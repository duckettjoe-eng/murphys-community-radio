import "server-only";

import dns from "node:dns/promises";
import net from "node:net";
import { load, type CheerioAPI } from "cheerio";

const maxRedirects = 5;
const maxHtmlBytes = 2 * 1024 * 1024;
const maxArticleCharacters = 24_000;
const fetchTimeoutMs = 12_000;

const articleSelectors = [
  "[itemprop='articleBody']",
  "article .entry-content",
  "article .post-content",
  "article .article-content",
  "article .story-body",
  "article .td-post-content",
  "article .content-body",
  "article",
  "main",
];

const unwantedSelectors = [
  "script",
  "style",
  "noscript",
  "nav",
  "header",
  "footer",
  "aside",
  "form",
  "button",
  "iframe",
  "svg",
  ".advertisement",
  ".advertising",
  ".ad",
  ".ads",
  ".social-share",
  ".related-posts",
  ".newsletter",
  ".comments",
];

export type ExtractedWebArticle = {
  title: string;
  content: string;
  finalUrl: string;
};

export type FetchedPublicHtml = {
  html: string;
  finalUrl: string;
};

export async function extractWebArticle(
  inputUrl: string,
): Promise<ExtractedWebArticle> {
  const { html, finalUrl } = await fetchPublicHtml(inputUrl);
  const $ = load(html);
  const jsonLdArticle = extractJsonLdArticle($);
  const title =
    cleanText(
      $("meta[property='og:title']").attr("content") ||
        $("meta[name='twitter:title']").attr("content") ||
        jsonLdArticle.title ||
        $("h1").first().text() ||
        $("title").text(),
    ) || "Untitled webpage";

  $(unwantedSelectors.join(",")).remove();

  const content =
    cleanText(jsonLdArticle.content) ||
    longestArticleCandidate($) ||
    cleanText($("body").text());

  if (content.length < 120) {
    throw new Error("No readable article content was found on the webpage.");
  }

  return {
    title,
    content: content.slice(0, maxArticleCharacters),
    finalUrl,
  };
}

export async function fetchPublicHtml(
  inputUrl: string,
  allowedHosts?: ReadonlySet<string>,
): Promise<FetchedPublicHtml> {
  let currentUrl = await validatePublicUrl(inputUrl, allowedHosts);

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    await assertPublicHost(currentUrl, allowedHosts);

    const response = await fetch(currentUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent":
          "Mozilla/5.0 (compatible; MurphysCommunityRadio/1.0; article extraction)",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(fetchTimeoutMs),
      cache: "no-store",
    });

    if (![301, 302, 303, 307, 308].includes(response.status)) {
      const contentType =
        response.headers.get("content-type")?.toLowerCase() ?? "";

      if (!response.ok) {
        throw new Error(`The webpage returned HTTP ${response.status}.`);
      }
      if (!contentType.includes("text/html")) {
        throw new Error("The URL did not return an HTML webpage.");
      }

      return {
        html: await readLimitedBody(response),
        finalUrl: response.url,
      };
    }

    const location = response.headers.get("location");

    if (!location) {
      throw new Error("The webpage redirect did not include a destination.");
    }
    if (redirectCount === maxRedirects) {
      throw new Error("The webpage redirected too many times.");
    }

    currentUrl = await validatePublicUrl(
      new URL(location, currentUrl).toString(),
      allowedHosts,
    );
  }

  throw new Error("The webpage redirected too many times.");
}

async function validatePublicUrl(
  value: string,
  allowedHosts?: ReadonlySet<string>,
) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("The item URL is not valid.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS webpage URLs are supported.");
  }
  if (url.username || url.password) {
    throw new Error("Webpage URLs cannot contain credentials.");
  }
  if (allowedHosts && !allowedHosts.has(url.hostname.toLowerCase())) {
    throw new Error("The webpage redirected outside the approved news domains.");
  }

  await assertPublicHost(url, allowedHosts);
  return url;
}

async function assertPublicHost(
  url: URL,
  allowedHosts?: ReadonlySet<string>,
) {
  if (allowedHosts && !allowedHosts.has(url.hostname.toLowerCase())) {
    throw new Error("The webpage is not on an approved news domain.");
  }

  const addresses = await dns.lookup(url.hostname, {
    all: true,
    verbatim: true,
  });

  if (
    addresses.length === 0 ||
    addresses.some(({ address }) => isPrivateAddress(address))
  ) {
    throw new Error("The webpage URL must resolve to a public address.");
  }
}

function isPrivateAddress(address: string): boolean {
  if (net.isIPv4(address)) {
    const [a, b] = address.split(".").map(Number);

    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }

  if (net.isIPv6(address)) {
    const normalized = address.toLowerCase();
    const mappedIpv4 = normalized.match(
      /^::ffff:(\d+\.\d+\.\d+\.\d+)$/,
    )?.[1];

    return Boolean(
      (mappedIpv4 && isPrivateAddress(mappedIpv4)) ||
        normalized === "::" ||
        normalized === "::1" ||
        normalized.startsWith("fc") ||
        normalized.startsWith("fd") ||
        normalized.startsWith("fe8") ||
        normalized.startsWith("fe9") ||
        normalized.startsWith("fea") ||
        normalized.startsWith("feb"),
    );
  }

  return true;
}

async function readLimitedBody(response: Response) {
  const declaredLength = Number(response.headers.get("content-length") || 0);

  if (declaredLength > maxHtmlBytes) {
    throw new Error("The webpage is too large to extract safely.");
  }
  if (!response.body) {
    throw new Error("The webpage returned no content.");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;
    totalBytes += value.byteLength;

    if (totalBytes > maxHtmlBytes) {
      await reader.cancel();
      throw new Error("The webpage is too large to extract safely.");
    }

    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(bytes);
}

function longestArticleCandidate($: CheerioAPI) {
  let longest = "";

  for (const selector of articleSelectors) {
    $(selector).each((_, element) => {
      const paragraphs = $(element)
        .find("p")
        .map((__, paragraph) => cleanText($(paragraph).text()))
        .get()
        .filter((paragraph) => paragraph.length >= 30);
      const candidate = cleanText(
        paragraphs.length > 0 ? paragraphs.join("\n\n") : $(element).text(),
      );

      if (candidate.length > longest.length) longest = candidate;
    });
  }

  return longest;
}

function extractJsonLdArticle($: CheerioAPI) {
  let title = "";
  let content = "";

  $("script[type='application/ld+json']").each((_, element) => {
    try {
      const parsed = JSON.parse($(element).text()) as unknown;

      visitJsonLd(parsed, (entry) => {
        const body =
          typeof entry.articleBody === "string" ? entry.articleBody : "";
        const headline =
          typeof entry.headline === "string"
            ? entry.headline
            : typeof entry.name === "string"
              ? entry.name
              : "";

        if (body.length > content.length) {
          content = body;
          title = headline || title;
        }
      });
    } catch {
      // Ignore malformed publisher metadata and continue with DOM extraction.
    }
  });

  return { title, content };
}

function visitJsonLd(
  value: unknown,
  visitor: (entry: Record<string, unknown>) => void,
) {
  if (Array.isArray(value)) {
    value.forEach((entry) => visitJsonLd(entry, visitor));
    return;
  }
  if (!value || typeof value !== "object") return;

  const entry = value as Record<string, unknown>;
  visitor(entry);

  for (const nested of Object.values(entry)) {
    if (nested && typeof nested === "object") {
      visitJsonLd(nested, visitor);
    }
  }
}

function cleanText(value: string | undefined) {
  return (value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

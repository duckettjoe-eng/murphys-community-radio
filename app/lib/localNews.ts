import "server-only";

import { load, type CheerioAPI } from "cheerio";
import { fetchPublicHtml } from "@/app/lib/webArticle";

const maxStoriesPerSource = 20;

type LocalNewsSource = {
  name: string;
  indexUrl: string;
  hosts: ReadonlySet<string>;
  articlePath: RegExp;
};

export const LOCAL_NEWS_SOURCE_NAMES = [
  "myMotherLode",
  "Calaveras Enterprise",
  "Union Democrat",
  "Ledger Dispatch",
] as const;

export type LocalNewsSourceName = (typeof LOCAL_NEWS_SOURCE_NAMES)[number];

const localNewsSources: LocalNewsSource[] = [
  {
    name: "myMotherLode",
    indexUrl: "https://www.mymotherlode.com/news",
    hosts: new Set(["mymotherlode.com", "www.mymotherlode.com"]),
    articlePath: /^\/news\/local\/\d+\/.+\.html$/i,
  },
  {
    name: "Calaveras Enterprise",
    indexUrl: "https://www.calaverasenterprise.com/articles/news/",
    hosts: new Set([
      "calaverasenterprise.com",
      "www.calaverasenterprise.com",
    ]),
    articlePath: /^\/articles\/[^/]+\/[^/]+\/?$/i,
  },
  {
    name: "Union Democrat",
    indexUrl: "https://www.uniondemocrat.com/news/",
    hosts: new Set(["uniondemocrat.com", "www.uniondemocrat.com"]),
    articlePath: /^\/news\/.+/i,
  },
  {
    name: "Ledger Dispatch",
    indexUrl: "https://www.ledger.news/news/",
    hosts: new Set(["ledger.news", "www.ledger.news"]),
    articlePath: /^\/news\/.+/i,
  },
];

export type LocalNewsCandidate = {
  title: string;
  source: string;
  url: string;
  publishedDate: string | null;
  excerpt: string | null;
};

export type LocalNewsSourceResult = {
  source: string;
  stories: LocalNewsCandidate[];
  error?: string;
};

export async function fetchLocalNewsCandidates(sourceName?: string) {
  const selectedSources = sourceName
    ? localNewsSources.filter((source) => source.name === sourceName)
    : localNewsSources;

  if (sourceName && selectedSources.length === 0) {
    throw new Error("Unknown local news source.");
  }

  return Promise.all(selectedSources.map(fetchSource));
}

async function fetchSource(
  source: LocalNewsSource,
): Promise<LocalNewsSourceResult> {
  try {
    const { html, finalUrl } = await fetchPublicHtml(
      source.indexUrl,
      source.hosts,
    );
    const $ = load(html);
    const candidates = new Map<string, LocalNewsCandidate>();

    collectJsonLdCandidates($, source, finalUrl, candidates);
    collectDomCandidates($, source, finalUrl, candidates);

    if (candidates.size === 0) {
      return {
        source: source.name,
        stories: [],
        error: "No candidate stories were found on the source page.",
      };
    }

    return {
      source: source.name,
      stories: Array.from(candidates.values()).slice(0, maxStoriesPerSource),
    };
  } catch (error) {
    return {
      source: source.name,
      stories: [],
      error: error instanceof Error ? error.message : "Unknown source error.",
    };
  }
}

function collectJsonLdCandidates(
  $: CheerioAPI,
  source: LocalNewsSource,
  baseUrl: string,
  candidates: Map<string, LocalNewsCandidate>,
) {
  $("script[type='application/ld+json']").each((_, element) => {
    try {
      const parsed = JSON.parse($(element).text()) as unknown;

      visitJson(parsed, (entry) => {
        const title = stringValue(entry.headline) || stringValue(entry.name);
        const rawUrl =
          stringValue(entry.url) ||
          stringValue(entry["@id"]) ||
          objectStringValue(entry.mainEntityOfPage, "@id");

        addCandidate(candidates, source, baseUrl, {
          title,
          rawUrl,
          publishedDate:
            stringValue(entry.datePublished) || stringValue(entry.dateCreated),
          excerpt:
            stringValue(entry.description) ||
            stringValue(entry.abstract) ||
            stringValue(entry.articleSection),
        });
      });
    } catch {
      // Publisher metadata is optional; DOM extraction remains available.
    }
  });
}

function collectDomCandidates(
  $: CheerioAPI,
  source: LocalNewsSource,
  baseUrl: string,
  candidates: Map<string, LocalNewsCandidate>,
) {
  const selectors = [
    "article h1 a[href]",
    "article h2 a[href]",
    "article h3 a[href]",
    ".entry-title a[href]",
    ".post-title a[href]",
    ".headline a[href]",
    "h2 a[href]",
    "h3 a[href]",
  ].join(",");

  $(selectors).each((_, element) => {
    const link = $(element);
    const container = link.closest(
      "article, li, .post, .story, .item, .card, .entry",
    );
    const time = container.find("time").first();
    const excerpt = container
      .find("p, .excerpt, .summary, .description")
      .map((__, paragraph) => cleanText($(paragraph).text()))
      .get()
      .find((value) => value.length >= 30);

    addCandidate(candidates, source, baseUrl, {
      title: cleanText(link.text()),
      rawUrl: link.attr("href") || "",
      publishedDate:
        cleanText(time.attr("datetime")) || cleanText(time.text()) || null,
      excerpt: excerpt || null,
    });
  });
}

function addCandidate(
  candidates: Map<string, LocalNewsCandidate>,
  source: LocalNewsSource,
  baseUrl: string,
  candidate: {
    title: string;
    rawUrl: string;
    publishedDate: string | null;
    excerpt: string | null;
  },
) {
  const title = cleanText(candidate.title);

  if (title.length < 12 || !candidate.rawUrl) return;

  let url: URL;

  try {
    url = new URL(candidate.rawUrl, baseUrl);
  } catch {
    return;
  }

  url.hash = "";

  if (
    !source.hosts.has(url.hostname.toLowerCase()) ||
    !source.articlePath.test(url.pathname) ||
    normalizeUrl(url.toString()) === normalizeUrl(source.indexUrl)
  ) {
    return;
  }

  const normalizedUrl = normalizeUrl(url.toString());

  if (candidates.has(normalizedUrl)) return;

  candidates.set(normalizedUrl, {
    title,
    source: source.name,
    url: normalizedUrl,
    publishedDate: cleanText(candidate.publishedDate) || null,
    excerpt: truncateExcerpt(candidate.excerpt),
  });
}

function visitJson(
  value: unknown,
  visitor: (entry: Record<string, unknown>) => void,
) {
  if (Array.isArray(value)) {
    value.forEach((entry) => visitJson(entry, visitor));
    return;
  }
  if (!value || typeof value !== "object") return;

  const entry = value as Record<string, unknown>;
  visitor(entry);

  Object.values(entry).forEach((nested) => {
    if (nested && typeof nested === "object") visitJson(nested, visitor);
  });
}

function stringValue(value: unknown) {
  return typeof value === "string" ? cleanText(value) : "";
}

function objectStringValue(value: unknown, key: string) {
  if (!value || typeof value !== "object") return "";
  return stringValue((value as Record<string, unknown>)[key]);
}

function truncateExcerpt(value: string | null) {
  const excerpt = cleanText(value);

  if (!excerpt) return null;
  return excerpt.length <= 500 ? excerpt : `${excerpt.slice(0, 497).trim()}...`;
}

function normalizeUrl(value: string) {
  const url = new URL(value);

  url.hash = "";
  url.search = "";
  url.hostname = url.hostname.toLowerCase();
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";

  return url.toString();
}

function cleanText(value: string | null | undefined) {
  return (value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

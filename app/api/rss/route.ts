import dns from "node:dns/promises";
import net from "node:net";
import { NextResponse } from "next/server";
import Parser from "rss-parser";

export const runtime = "nodejs";
export const maxDuration = 15;

const parser = new Parser();
const MAX_FEED_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 10_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: corsHeaders,
  });
}

function isPrivateIp(address: string): boolean {
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
      (mappedIpv4 && isPrivateIp(mappedIpv4)) ||
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

async function validateFeedUrl(value: string): Promise<URL> {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("The url parameter must be a valid URL.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS feed URLs are supported.");
  }

  if (url.username || url.password) {
    throw new Error("Feed URLs cannot contain credentials.");
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("Local feed URLs are not allowed.");
  }

  const addresses = net.isIP(hostname)
    ? [{ address: hostname }]
    : await dns.lookup(hostname, { all: true });

  if (
    addresses.length === 0 ||
    addresses.some(({ address }) => isPrivateIp(address))
  ) {
    throw new Error("Private or reserved network addresses are not allowed.");
  }

  return url;
}

async function fetchFeed(initialUrl: string): Promise<string> {
  let url = await validateFeedUrl(initialUrl);

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const response = await fetch(url, {
      headers: {
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5",
        "User-Agent": "Murphys-Community-Radio-RSS-Proxy/1.0",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new Error("The feed returned an invalid redirect.");
      }

      url = await validateFeedUrl(new URL(location, url).toString());
      continue;
    }

    if (!response.ok) {
      throw new Error(`The feed server returned HTTP ${response.status}.`);
    }

    const declaredLength = Number(response.headers.get("content-length"));
    if (declaredLength > MAX_FEED_BYTES) {
      throw new Error("The feed is larger than the 2 MB limit.");
    }

    if (!response.body) {
      throw new Error("The feed returned an empty response.");
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      size += value.byteLength;
      if (size > MAX_FEED_BYTES) {
        await reader.cancel();
        throw new Error("The feed is larger than the 2 MB limit.");
      }
      chunks.push(value);
    }

    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return new TextDecoder().decode(bytes);
  }

  throw new Error(`The feed exceeded the ${MAX_REDIRECTS}-redirect limit.`);
}

function stripHtml(value = ""): string {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function toIsoDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request: Request) {
  const rawUrl = new URL(request.url).searchParams.get("url");

  if (!rawUrl) {
    return json(
      {
        error: "Missing required url query parameter.",
        example: "/api/rss?url=https%3A%2F%2Fexample.com%2Ffeed.xml",
      },
      400,
    );
  }

  try {
    const xml = await fetchFeed(rawUrl);
    const feed = await parser.parseString(xml);
    const source = feed.title || new URL(rawUrl).hostname;

    const articles = (feed.items || []).map((item) => ({
      title: item.title?.trim() || "Untitled",
      link: item.link || item.guid || null,
      source,
      pubDate: toIsoDate(item.isoDate || item.pubDate),
      excerpt: stripHtml(
        item.contentSnippet ||
          item.summary ||
          item.content ||
          item.description ||
          "",
      ).slice(0, 500),
    }));

    const response = json({ articles });
    response.headers.set(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=3600",
    );
    return response;
  } catch (error) {
    const message =
      error instanceof Error && error.name === "TimeoutError"
        ? "The feed request timed out."
        : error instanceof Error
          ? error.message
          : "Unable to fetch or parse the feed.";

    return json({ error: message }, 502);
  }
}

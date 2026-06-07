import { NextResponse } from "next/server";
import { fetchLocalNewsCandidates } from "@/app/lib/localNews";
import { getCupAJoeSupabase } from "@/app/lib/cupAJoeServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const {
      show_date: showDate,
      source,
    } = (await request.json()) as {
      show_date?: string;
      source?: string;
    };

    if (!showDate || !/^\d{4}-\d{2}-\d{2}$/.test(showDate)) {
      return NextResponse.json(
        { error: "A valid show date is required." },
        { status: 400 },
      );
    }

    const sourceResults = await fetchLocalNewsCandidates(source);
    const stories = sourceResults.flatMap((result) => result.stories);
    const supabase = getCupAJoeSupabase();
    const { data: existingItems, error: existingError } = await supabase
      .from("cup_a_joe_items")
      .select("show_date,title,source,url");

    if (existingError) throw existingError;

    const existingUrls = new Set(
      (existingItems ?? [])
        .map((item) => normalizeUrl(item.url))
        .filter((url): url is string => Boolean(url)),
    );
    const existingKeys = new Set(
      (existingItems ?? []).map((item) =>
        duplicateKey(item.show_date, item.title, item.source),
      ),
    );
    const importRows: Array<Record<string, unknown>> = [];
    let skipped = 0;

    for (const story of stories) {
      const normalizedUrl = normalizeUrl(story.url);
      const key = duplicateKey(showDate, story.title, story.source);

      if (
        (normalizedUrl && existingUrls.has(normalizedUrl)) ||
        existingKeys.has(key)
      ) {
        skipped += 1;
        continue;
      }

      if (normalizedUrl) existingUrls.add(normalizedUrl);
      existingKeys.add(key);
      importRows.push({
        show_date: showDate,
        use_in_show: false,
        category: "Local News",
        title: story.title,
        source: story.source,
        url: story.url,
        summary: story.excerpt,
        joe_notes: null,
        segment: "Local Headlines",
        sort_order: 0,
        estimated_minutes: 2,
      });
    }

    if (importRows.length > 0) {
      const { error: insertError } = await supabase
        .from("cup_a_joe_items")
        .insert(importRows);

      if (insertError) throw insertError;
    }

    return NextResponse.json({
      found: stories.length,
      imported: importRows.length,
      skipped,
      source_errors: sourceResults
        .filter((result) => result.error)
        .map((result) => ({
          source: result.source,
          error: result.error,
        })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: errorMessage(error) },
      { status: 500 },
    );
  }
}

function normalizeUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";
    url.hostname = url.hostname.toLowerCase();
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return value.trim();
  }
}

function duplicateKey(showDate: unknown, title: unknown, source: unknown) {
  return [showDate, title, source]
    .map((value) =>
      typeof value === "string" ? value.trim().toLowerCase() : "",
    )
    .join("|");
}

async function isAuthorized(request: Request) {
  const password = process.env.STUDIO_PASSWORD;

  if (!password) return false;

  const expected = await sha256(password);
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith("studio_auth="))
    ?.slice("studio_auth=".length);

  return cookie === expected;
}

async function sha256(value: string) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unable to import local news.";
}

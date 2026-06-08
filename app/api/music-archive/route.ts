import { NextResponse } from "next/server";
import {
  generatedMixcloudFallback,
  nonMixcloudLocalArchive,
  type MusicArchiveItem,
} from "@/app/lib/localMusicArchive";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type EpisodeLink = {
  id: string;
  show_name?: string;
  host_name?: string;
  episode_title?: string;
  episode_date?: string;
  episode_url?: string;
  platform?: string;
  description?: string;
  status?: string;
};

type ArchiveEpisode = {
  id: string;
  platform: string;
  account_slug: string;
  station_name: string;
  source_id: string;
  source_label: string;
  host_name: string;
  show_name: string;
  show_slug: string;
  episode_title: string;
  episode_url: string;
  mixcloud_key: string;
  published_at?: string;
  source_created_at?: string;
  artwork_url?: string;
  embed_url?: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchSupabaseRows<T>(path: string): Promise<T[] | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;

  try {
    const rows: T[] = [];
    const pageSize = 1000;
    let offset = 0;

    while (true) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Range: `${offset}-${offset + pageSize - 1}`,
        },
        cache: "no-store",
      });

      if (!res.ok) {
        console.error("Supabase archive fetch failed:", res.status);
        return null;
      }

      const page = (await res.json()) as T[];
      rows.push(...page);

      if (page.length < pageSize) return rows;
      offset += pageSize;
    }
  } catch (error) {
    console.error(
      "Supabase archive fetch failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return null;
  }
}

async function getStoredMixcloudEpisodes() {
  const rows = await fetchSupabaseRows<ArchiveEpisode>(
    "archive_episodes?select=*&account_slug=eq.skullcountyradio&or=(status.eq.approved,status.eq.published)&order=published_at.desc.nullslast,created_at.desc",
  );

  if (!rows) return null;

  return rows.map(
    (row): MusicArchiveItem => ({
      id: row.id,
      showSlug: row.show_slug || slugify(row.show_name),
      showName: row.show_name,
      djSlug: row.source_id,
      djName: row.host_name,
      host: row.host_name,
      title: row.episode_title,
      artist: row.host_name,
      audioUrl: "",
      parts: [],
      artwork: row.artwork_url || "/artwork/dj-hello-joey.jpg",
      date: row.published_at
        ? new Date(row.published_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          })
        : "Recent",
      externalUrl: row.episode_url,
      platform: row.platform || "Mixcloud",
      sourceId: row.source_id,
      sourceLabel: row.station_name || row.source_label,
      mixcloudUsername: row.account_slug,
      mixcloudKey: row.mixcloud_key,
      mixcloudUrl: row.episode_url,
      embedUrl: row.embed_url,
      imageUrl: row.artwork_url,
      publishedAt: row.published_at,
      createdAt: row.source_created_at,
    }),
  );
}

async function getPublishedSubmittedEpisodes() {
  const rows = await fetchSupabaseRows<EpisodeLink>(
    "episode_links?select=*&or=(status.eq.approved,status.eq.published)&order=created_at.desc",
  );

  return (rows || [])
    .filter((row) => row.episode_url)
    .map(
      (row): MusicArchiveItem => ({
        id: row.id || slugify(row.episode_title || row.show_name || "episode"),
        showSlug: slugify(row.show_name || row.episode_title || "submitted"),
        showName: row.show_name || row.episode_title || "Submitted Episode",
        djSlug: slugify(row.host_name || "submitted-link"),
        djName: row.host_name || "KMCR Host",
        title: row.episode_title || row.show_name || "Untitled Episode",
        host: row.host_name || "KMCR Host",
        artist: row.host_name || "KMCR Host",
        date: row.episode_date || "Recent",
        artwork: "/artwork/dj-hello-joey.jpg",
        audioUrl: row.episode_url || "",
        parts: [],
        platform: row.platform || "Submitted Link",
        sourceId: slugify(row.host_name || row.platform || "submitted-link"),
        sourceLabel: row.host_name || row.platform || "Submitted Link",
      }),
    );
}

function deduplicateEpisodes(items: MusicArchiveItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key =
      item.mixcloudKey ||
      item.mixcloudUrl ||
      item.externalUrl ||
      item.audioUrl ||
      item.id;

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET() {
  const [storedMixcloudEpisodes, submittedEpisodes] = await Promise.all([
    getStoredMixcloudEpisodes(),
    getPublishedSubmittedEpisodes(),
  ]);
  const mixcloudEpisodes =
    storedMixcloudEpisodes && storedMixcloudEpisodes.length > 0
      ? storedMixcloudEpisodes
      : generatedMixcloudFallback;

  return NextResponse.json(
    deduplicateEpisodes([
      ...mixcloudEpisodes,
      ...submittedEpisodes,
      ...nonMixcloudLocalArchive,
    ]),
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}

import { NextResponse } from "next/server";
import { localMusicArchive } from "@/app/lib/localMusicArchive";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getPublishedSubmittedEpisodes() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];

  const url =
    `${SUPABASE_URL}/rest/v1/episode_links` +
    `?select=*` +
    `&or=(status.eq.approved,status.eq.published)` +
    `&order=created_at.desc`;

  try {
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Supabase archive fetch failed:", await res.text());
      return [];
    }

    const rows = (await res.json()) as EpisodeLink[];

    return rows
      .filter((row) => row.episode_url)
      .map((row) => ({
        id: row.id || slugify(row.episode_title || row.show_name || "episode"),
        showSlug: slugify(row.show_name || row.episode_title || "submitted"),
        showName: row.show_name || row.episode_title || "Submitted Episode",
        djSlug: slugify(row.host_name || "submitted-link"),
        djName: row.host_name || "KMCR Host",
        title: row.episode_title || row.show_name || "Untitled Episode",
        host: row.host_name || "KMCR Host",
        artist: row.host_name || "KMCR Host",
        date: row.episode_date || "Recent",
        description: row.description || "",
        artwork: "/artwork/dj-hello-joey.jpg",
        audioUrl: row.episode_url,
        parts: [],
        platform: row.platform || "Submitted Link",
        sourceId: slugify(row.host_name || row.platform || "submitted-link"),
        sourceLabel: row.host_name || row.platform || "Submitted Link",
      }));
  } catch {
    return [];
  }
}

export async function GET() {
  const submittedEpisodes = await getPublishedSubmittedEpisodes();

  return NextResponse.json([
    ...submittedEpisodes,
    ...localMusicArchive,
  ]);
}

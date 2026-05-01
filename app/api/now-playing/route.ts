import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const streamUrl = "https://streams.ilovemusic.de/iloveradio1.mp3";
const fallbackTitle = "Golden Era Hip-Hop — Test Stream";
const fallbackArtist = "Murphys Community Radio";

type NowPlayingPayload = {
  title: string;
  artist: string;
  source: "icy" | "fallback";
};

const fallbackPayload: NowPlayingPayload = {
  title: fallbackTitle,
  artist: fallbackArtist,
  source: "fallback",
};

function concatBytes(first: Uint8Array, second: Uint8Array) {
  const combined = new Uint8Array(first.length + second.length);
  combined.set(first);
  combined.set(second, first.length);
  return combined;
}

function parseStreamTitle(metadata: string) {
  const match = metadata.match(/StreamTitle='([^']*)'/);
  const title = match?.[1]?.trim();

  return title || null;
}

async function getIcyTitle() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(streamUrl, {
      headers: {
        "Icy-MetaData": "1",
        "User-Agent": "MurphysCommunityRadio/0.1",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    const metaInterval = Number(response.headers.get("icy-metaint"));

    if (!response.body || !Number.isFinite(metaInterval) || metaInterval <= 0) {
      return null;
    }

    const reader = response.body.getReader();
    let buffer = new Uint8Array();
    let metadataLength: number | null = null;

    try {
      while (buffer.length < metaInterval + 1 + (metadataLength ?? 0)) {
        const { done, value } = await reader.read();

        if (done || !value) break;

        buffer = concatBytes(buffer, value);

        if (buffer.length > metaInterval && metadataLength === null) {
          metadataLength = buffer[metaInterval] * 16;
        }

        if (buffer.length > 128000) break;
      }
    } finally {
      await reader.cancel().catch(() => undefined);
    }

    if (!metadataLength) return null;

    const metadataBytes = buffer.slice(
      metaInterval + 1,
      metaInterval + 1 + metadataLength,
    );
    const metadata = new TextDecoder().decode(metadataBytes);

    return parseStreamTitle(metadata);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  try {
    const title = await getIcyTitle();

    if (title) {
      return NextResponse.json(
        {
          title,
          artist: fallbackArtist,
          source: "icy",
        } satisfies NowPlayingPayload,
        {
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    return NextResponse.json(fallbackPayload, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(fallbackPayload, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }
}

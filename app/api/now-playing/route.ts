import { NextResponse } from "next/server";
import { localSchedule, type Show } from "@/app/lib/localSchedule";
import { getStationDateParts } from "@/app/lib/stationTime";

export const dynamic = "force-dynamic";

const live365PlayerUrl = process.env.NEXT_PUBLIC_LIVE365_PLAYER_URL || "";
const live365MountId =
  process.env.LIVE365_MOUNT_ID || getLive365MountId(live365PlayerUrl) || "a11326";
const live365StationId = process.env.LIVE365_STATION_ID || "40167";
const live365BearerToken =
  process.env.LIVE365_BEARER_TOKEN || process.env.LIVE365_API_TOKEN || "";

// Legacy AzuraCast integration retained for fallback.
const azuraCastNowPlayingUrl =
  process.env.AZURACAST_NOW_PLAYING_URL ||
  "https://radio.murphyscommunityradio.com/api/nowplaying/skullcounty";
const streamUrl =
  process.env.AZURACAST_STREAM_URL ||
  "https://radio.murphyscommunityradio.com/listen/skullcounty/radio.mp3";
const fallbackTitle = "Live Stream";
const fallbackArtist = "Murphys Community Radio";

type NowPlayingPayload = {
  title: string;
  artist: string;
  art?: string | null;
  showArt?: string | null;
  isPlaying?: boolean;
  showName: string;
  playlistName?: string | null;
  showSource: "live365-event" | "local-schedule" | "fallback";
  source: "live365" | "azuracast" | "icy" | "fallback";
};

const fallbackPayload: NowPlayingPayload = {
  title: fallbackTitle,
  artist: fallbackArtist,
  art: null,
  showArt: "/logos/skull-county-radio-logo.png",
  isPlaying: false,
  showName: "Murphys Community Radio",
  playlistName: null,
  showSource: "fallback",
  source: "fallback",
};

const showArtwork = [
  {
    names: ["Golden Hour Groove", "GHG"],
    artwork: "/artwork/shows/golden-era-groove.png",
  },
  {
    names: ["Alt-Rock Barroom Radio"],
    artwork: "/artwork/shows/alt-rock-bar-room-radio.png",
  },
  {
    names: ["Dusty Crate Hip-Hop Hour"],
    artwork: "/artwork/shows/dusty-crate-hip-hop-hour.png",
  },
  {
    names: ["House Party Frequency"],
    artwork: "/artwork/shows/house-party-frequency.png",
  },
  {
    names: ["Weird Late-Night FM"],
    artwork: "/artwork/shows/weird-late-night-fm.png",
  },
  {
    names: ["Cali Sun Reggae Ride"],
    artwork: "/artwork/shows/cali-sun-reggae-ride.png",
  },
  {
    names: ["Mashup Crate Hour"],
    artwork: "/artwork/shows/mashup-crate-hour.png",
  },
  {
    names: ["Campfire Americana"],
    artwork: "/artwork/shows/campfire-americana.png",
  },
  {
    names: ["Lowrider Soul Sunday"],
    artwork: "/artwork/shows/low-rider-soul-sunday.png",
  },
  {
    names: ["Skull County Garage Gospel"],
    artwork: "/artwork/shows/skull-county-garage-gospel.png",
  },
] as const;

type Live365StationPayload = {
  is_playing?: boolean;
  "current-track"?: {
    title?: string;
    artist?: string;
    art?: string;
  };
};

type Live365Event = {
  id: string;
  attributes?: {
    title?: string;
    start_time?: string;
    duration?: number;
    is_canceled?: boolean;
  };
  relationships?: {
    playlist?: {
      data?: {
        id?: string;
      } | null;
    };
  };
};

type Live365Playlist = {
  id: string;
  attributes?: {
    title?: string;
  };
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

function parseSongText(songText: string) {
  const separator = songText.includes(" — ") ? " — " : " - ";

  if (!songText.includes(separator)) {
    return {
      artist: fallbackArtist,
      title: songText,
    };
  }

  const [artist, ...titleParts] = songText.split(separator);

  return {
    artist: artist?.trim() || fallbackArtist,
    title: titleParts.join(separator).trim() || songText,
  };
}

function getLive365MountId(embedUrl: string) {
  if (!embedUrl) return null;

  try {
    const { pathname } = new URL(embedUrl);
    const match = pathname.match(/\/player\/([^/?#]+)/);

    return match?.[1] || null;
  } catch {
    return null;
  }
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function isActiveShow(show: Show, currentDay: number, currentMinutes: number) {
  if (show.day !== currentDay) return false;

  const start = timeToMinutes(show.start);
  const end = timeToMinutes(show.end);
  const isFullDay = show.start === "00:00" && show.end === "23:59";

  return (
    currentMinutes >= start &&
    (isFullDay ? currentMinutes <= end : currentMinutes < end)
  );
}

function getLocalScheduleShowName() {
  const { day, minutes } = getStationDateParts();
  const show = localSchedule.find((item) => isActiveShow(item, day, minutes));

  return show?.name || "Murphys Community Radio";
}

function normalizeShowName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function getShowArtwork(showName: string) {
  const normalizedShowName = normalizeShowName(showName);
  const match = showArtwork.find((show) =>
    show.names.some((name) => {
      const normalizedName = normalizeShowName(name);
      return (
        normalizedShowName === normalizedName ||
        normalizedShowName.startsWith(`${normalizedName} `)
      );
    }),
  );

  return match?.artwork || "/logos/skull-county-radio-logo.png";
}

async function getLive365NowPlaying() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `https://api.live365.com/v1/station/${live365MountId}`,
      {
        cache: "no-store",
        signal: controller.signal,
      },
    );

    if (!response.ok) return null;

    const data = (await response.json()) as Live365StationPayload;
    const currentTrack = data["current-track"];
    const title = currentTrack?.title?.trim();
    const artist = currentTrack?.artist?.trim();

    if (!title && !artist) return null;

    return {
      title: title || fallbackTitle,
      artist: artist || fallbackArtist,
      art: currentTrack?.art || null,
      isPlaying: Boolean(data.is_playing),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function intervalDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isCurrentLive365Event(event: Live365Event, now: Date) {
  const startTime = event.attributes?.start_time;
  const duration = event.attributes?.duration;

  if (!startTime || !duration || event.attributes?.is_canceled) {
    return false;
  }

  const start = new Date(startTime);
  const end = new Date(start.getTime() + duration * 1000);

  return now >= start && now < end;
}

async function getLive365CurrentEvent() {
  if (!live365BearerToken) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const now = new Date();
  const intervalStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const intervalEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  try {
    const eventsUrl = new URL("https://dashboard.live365.com/api/v1/events/");
    eventsUrl.searchParams.set("filter[station]", live365StationId);
    eventsUrl.searchParams.set(
      "filter[interval]",
      `${intervalDate(intervalStart)}:${intervalDate(intervalEnd)}`,
    );

    const eventsResponse = await fetch(eventsUrl, {
      headers: {
        Authorization: `Bearer ${live365BearerToken}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!eventsResponse.ok) return null;

    const eventsJson = (await eventsResponse.json()) as {
      data?: Live365Event[];
    };
    const currentEvent = eventsJson.data?.find((event) =>
      isCurrentLive365Event(event, now),
    );

    if (!currentEvent) return null;

    const playlistId = currentEvent.relationships?.playlist?.data?.id;
    let playlistName: string | null = null;

    if (playlistId) {
      const playlistResponse = await fetch(
        `https://dashboard.live365.com/api/v1/playlists/${playlistId}`,
        {
          headers: {
            Authorization: `Bearer ${live365BearerToken}`,
          },
          cache: "no-store",
          signal: controller.signal,
        },
      );

      if (playlistResponse.ok) {
        const playlistJson = (await playlistResponse.json()) as {
          data?: Live365Playlist;
        };
        playlistName = playlistJson.data?.attributes?.title?.trim() || null;
      }
    }

    return {
      showName:
        currentEvent.attributes?.title?.trim() ||
        playlistName ||
        "Murphys Community Radio",
      playlistName,
      showArt: getShowArtwork(
        currentEvent.attributes?.title?.trim() ||
          playlistName ||
          "Murphys Community Radio",
      ),
      showSource: "live365-event" as const,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function getCurrentShowMetadata() {
  const live365Event = await getLive365CurrentEvent();

  if (live365Event) return live365Event;

  return {
    showName: getLocalScheduleShowName(),
    showArt: getShowArtwork(getLocalScheduleShowName()),
    playlistName: null,
    showSource: "local-schedule" as const,
  };
}

async function getAzuraCastNowPlaying() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(azuraCastNowPlayingUrl, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      now_playing?: {
        song?: {
          artist?: string;
          title?: string;
          text?: string;
        };
      };
    };

    const song = data.now_playing?.song;
    const title = song?.title?.trim();
    const artist = song?.artist?.trim();
    const text = song?.text?.trim();

    if (title || artist) {
      return {
        title: title || text || fallbackTitle,
        artist: artist || fallbackArtist,
      };
    }

    if (text) {
      return parseSongText(text);
    }

    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
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
    const showMetadata = await getCurrentShowMetadata();
    const live365NowPlaying = await getLive365NowPlaying();

    if (live365NowPlaying) {
      return NextResponse.json(
        {
          ...live365NowPlaying,
          ...showMetadata,
          source: "live365",
        } satisfies NowPlayingPayload,
        {
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const azuraCastNowPlaying = await getAzuraCastNowPlaying();

    if (azuraCastNowPlaying) {
      return NextResponse.json(
        {
          ...azuraCastNowPlaying,
          art: null,
          isPlaying: true,
          ...showMetadata,
          source: "azuracast",
        } satisfies NowPlayingPayload,
        {
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const title = await getIcyTitle();

    if (title) {
      const metadata = parseSongText(title);

      return NextResponse.json(
        {
          ...metadata,
          art: null,
          isPlaying: true,
          ...showMetadata,
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

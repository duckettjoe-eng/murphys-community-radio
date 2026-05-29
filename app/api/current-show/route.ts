import { NextResponse } from "next/server";
import { getLiveOverrideShow } from "@/app/lib/liveOverride";
import { localSchedule, type Show } from "@/app/lib/localSchedule";
import { formatStationTime, getStationDateParts } from "@/app/lib/stationTime";

const fallbackShow = {
  name: "Murphys Community Radio",
  host: "Live Broadcast",
};

type CurrentShowResponse = {
  name: string;
  host: string;
  source: string;
  time: string;
  day: number;
  isLive: boolean;
};

type SupabaseShow = Partial<Show> & {
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
};

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
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

function normalizeSupabaseShow(show: SupabaseShow): Show | null {
  const day = show.day ?? show.day_of_week;
  const start = show.start ?? show.start_time;
  const end = show.end ?? show.end_time;

  if (
    typeof show.name !== "string" ||
    typeof show.host !== "string" ||
    typeof day !== "number" ||
    typeof start !== "string" ||
    typeof end !== "string"
  ) {
    return null;
  }

  return {
    name: show.name,
    host: show.host,
    day,
    start,
    end,
  };
}

function getLocalCurrentShow(now: Date): CurrentShowResponse {
  const { day: currentDay, minutes: currentMinutes } =
    getStationDateParts(now);
  const overrideShow = getLiveOverrideShow(now);

  const current =
    overrideShow ||
    localSchedule.find((show) => {
      return isActiveShow(show, currentDay, currentMinutes);
    }) || fallbackShow;

  return {
    ...current,
    source: overrideShow ? "live-override" : "local-schedule-file",
    time: formatStationTime(now),
    day: currentDay,
    isLive: current.name !== fallbackShow.name,
  };
}

async function fetchSupabaseCurrentShow(
  now: Date,
): Promise<CurrentShowResponse | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (getLiveOverrideShow(now)) return null;

  const { day: currentDay, minutes: currentMinutes } =
    getStationDateParts(now);
  const response = await fetch(`${supabaseUrl}/rest/v1/shows?select=*`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const shows = (await response.json()) as SupabaseShow[];
  const current = shows
    .map(normalizeSupabaseShow)
    .find((show): show is Show => {
      return Boolean(show && isActiveShow(show, currentDay, currentMinutes));
    });

  if (!current) return null;

  return {
    name: current.name,
    host: current.host,
    source: "supabase-direct",
    time: formatStationTime(now),
    day: currentDay,
    isLive: true,
  };
}

async function fetchProxyCurrentShow() {
  const proxyUrl = process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL;

  if (!proxyUrl) return null;

  try {
    const response = await fetch(proxyUrl, { cache: "no-store" });

    if (!response.ok) return null;

    return (await response.json()) as CurrentShowResponse;
  } catch {
    return null;
  }
}

export async function GET() {
  const now = new Date();
  const localCurrent = getLocalCurrentShow(now);

  try {
    const supabaseCurrent = await fetchSupabaseCurrentShow(now);

    if (supabaseCurrent) {
      return NextResponse.json(supabaseCurrent, {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }
  } catch {
    const proxyCurrent = await fetchProxyCurrentShow();

    if (proxyCurrent) {
      return NextResponse.json(proxyCurrent, {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }
  }

  return NextResponse.json(localCurrent, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

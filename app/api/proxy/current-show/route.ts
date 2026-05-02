import { NextResponse } from "next/server";
import type { Show } from "@/app/lib/localSchedule";

const fallbackShow = {
  name: "Murphys Community Radio",
  host: "Live Broadcast",
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

export async function GET() {
  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({
      ...fallbackShow,
      source: "supabase-proxy-fallback",
      time: now.toLocaleTimeString(),
      day: currentDay,
    });
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/shows?select=*`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Supabase shows query failed");
    }

    const shows = (await response.json()) as SupabaseShow[];
    const current = shows
      .map(normalizeSupabaseShow)
      .find((show): show is Show => {
        return Boolean(show && isActiveShow(show, currentDay, currentMinutes));
      });

    return NextResponse.json({
      ...(current || fallbackShow),
      source: current ? "supabase-proxy" : "supabase-proxy-fallback",
      time: now.toLocaleTimeString(),
      day: currentDay,
    });
  } catch {
    return NextResponse.json({
      ...fallbackShow,
      source: "supabase-proxy-fallback",
      time: now.toLocaleTimeString(),
      day: currentDay,
    });
  }
}

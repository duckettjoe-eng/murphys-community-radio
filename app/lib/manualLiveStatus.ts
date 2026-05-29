import { getLiveOverrideShow } from "@/app/lib/liveOverride";
import type { Show } from "@/app/lib/localSchedule";
import { getStationDateParts } from "@/app/lib/stationTime";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const statusKey = "manual-live";

export type ManualLiveStatus = {
  isLive: boolean;
  name: string;
  host: string;
  source: "manual-live" | "env-override" | "fallback";
};

type StationStatusRow = {
  key: string;
  is_live?: boolean;
  show_name?: string;
  host_name?: string;
};

function fallbackStatus(now = new Date()): ManualLiveStatus {
  const overrideShow = getLiveOverrideShow(now);

  if (overrideShow) {
    return {
      isLive: true,
      name: overrideShow.name,
      host: overrideShow.host,
      source: "env-override",
    };
  }

  return {
    isLive: false,
    name: "Live Mix",
    host: "DJ Hello Joey",
    source: "fallback",
  };
}

function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

function getHeaders() {
  return {
    apikey: supabaseAnonKey || "",
    Authorization: `Bearer ${supabaseAnonKey || ""}`,
    "Content-Type": "application/json",
  };
}

export async function getManualLiveStatus(now = new Date()) {
  if (!hasSupabaseConfig()) return fallbackStatus(now);

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/station_status?key=eq.${statusKey}&select=key,is_live,show_name,host_name&limit=1`,
      {
        headers: getHeaders(),
        cache: "no-store",
      },
    );

    if (!response.ok) return fallbackStatus(now);

    const rows = (await response.json()) as StationStatusRow[];
    const row = rows[0];

    if (!row) return fallbackStatus(now);

    return {
      isLive: Boolean(row.is_live),
      name: row.show_name || "Live Mix",
      host: row.host_name || "DJ Hello Joey",
      source: "manual-live",
    } satisfies ManualLiveStatus;
  } catch {
    return fallbackStatus(now);
  }
}

export async function setManualLiveStatus(input: {
  isLive: boolean;
  name: string;
  host: string;
}) {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase is not configured.");
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/station_status`, {
    method: "POST",
    headers: {
      ...getHeaders(),
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({
      key: statusKey,
      is_live: input.isLive,
      show_name: input.name,
      host_name: input.host,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export function manualStatusToShow(status: ManualLiveStatus): Show | null {
  if (!status.isLive) return null;

  const { day } = getStationDateParts();

  return {
    name: status.name,
    host: status.host,
    day,
    start: "00:00",
    end: "23:59",
  };
}

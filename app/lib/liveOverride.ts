import type { Show } from "@/app/lib/localSchedule";
import { getStationDateParts } from "@/app/lib/stationTime";

function isEnabled(value?: string) {
  return ["1", "true", "yes", "on"].includes(value?.toLowerCase() || "");
}

export function getLiveOverrideShow(now = new Date()): Show | null {
  if (!isEnabled(process.env.LIVE_BROADCAST_OVERRIDE)) return null;

  const { day } = getStationDateParts(now);

  return {
    name: process.env.LIVE_BROADCAST_OVERRIDE_NAME || "Live Mix",
    host: process.env.LIVE_BROADCAST_OVERRIDE_HOST || "DJ Hello Joey",
    day,
    start: "00:00",
    end: "23:59",
  };
}

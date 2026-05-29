const stationTimeZone = "America/Los_Angeles";

const weekdayToDay: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const stationDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: stationTimeZone,
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function getStationDateParts(date = new Date()) {
  const parts = stationDateTimeFormatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value || "";
  const weekday = part("weekday");
  const hour = Number(part("hour"));
  const minute = Number(part("minute"));

  return {
    day: weekdayToDay[weekday] ?? date.getDay(),
    minutes: hour * 60 + minute,
  };
}

export function formatStationTime(date = new Date()) {
  return date.toLocaleTimeString("en-US", {
    timeZone: stationTimeZone,
  });
}

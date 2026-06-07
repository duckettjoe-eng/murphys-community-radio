import "server-only";

const stationTimeZone = "America/Los_Angeles";

type GoogleCalendarDate = {
  date?: string;
  dateTime?: string;
};

type GoogleCalendarEvent = {
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start?: GoogleCalendarDate;
  end?: GoogleCalendarDate;
};

type GoogleCalendarResponse = {
  items?: GoogleCalendarEvent[];
  error?: {
    message?: string;
  };
};

export type CalendarImportEvent = {
  title: string;
  summary: string | null;
  url: string | null;
};

export async function getGoogleCalendarEvents(showDate: string) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
  const accessToken = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN;
  const nextDate = addDays(showDate, 1);
  const requestedStartDate = stationDateTime(showDate);
  const requestedEndDate = stationDateTime(nextDate);

  console.log("[cup-a-joe calendar import]", {
    calendarIdPresent: Boolean(calendarId),
    apiKeyPresent: Boolean(apiKey),
    requestedStartDate,
    requestedEndDate,
  });

  if (!calendarId || (!apiKey && !accessToken)) {
    throw new Error(
      "Google Calendar is not configured. Set GOOGLE_CALENDAR_ID and GOOGLE_CALENDAR_API_KEY or GOOGLE_CALENDAR_ACCESS_TOKEN.",
    );
  }

  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    timeMin: requestedStartDate,
    timeMax: requestedEndDate,
    timeZone: stationTimeZone,
  });

  if (apiKey) params.set("key", apiKey);

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
      cache: "no-store",
    },
  );
  const data = (await response.json()) as GoogleCalendarResponse;
  const eventTitles = (data.items ?? [])
    .map((event) => event.summary?.trim())
    .filter((title): title is string => Boolean(title));

  console.log("[cup-a-joe calendar response]", {
    status: response.status,
    eventCount: data.items?.length ?? 0,
    eventTitles,
  });

  if (!response.ok) {
    throw new Error(
      data.error?.message || "Unable to load events from Google Calendar.",
    );
  }

  return (data.items ?? [])
    .filter((event) => Boolean(event.summary?.trim()))
    .map((event) => ({
      title: event.summary!.trim(),
      summary: buildEventSummary(event),
      url: event.htmlLink?.trim() || null,
    })) satisfies CalendarImportEvent[];
}

function buildEventSummary(event: GoogleCalendarEvent) {
  const lines = [`Time: ${formatEventTime(event.start, event.end)}`];
  const location = cleanCalendarText(event.location);
  const description = cleanCalendarText(event.description);

  if (location) lines.push(`Location: ${location}`);
  if (description) lines.push(`Description: ${description}`);

  return lines.join("\n");
}

function formatEventTime(
  start?: GoogleCalendarDate,
  end?: GoogleCalendarDate,
) {
  if (start?.date) return "All day";
  if (!start?.dateTime) return "Time not listed";

  const startDate = new Date(start.dateTime);
  const endDate = end?.dateTime ? new Date(end.dateTime) : null;
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: stationTimeZone,
    hour: "numeric",
    minute: "2-digit",
  });

  if (!endDate) return timeFormatter.format(startDate);

  return `${timeFormatter.format(startDate)} - ${timeFormatter.format(endDate)}`;
}

function cleanCalendarText(value?: string) {
  if (!value?.trim()) return null;

  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);

  return value.toISOString().slice(0, 10);
}

function stationDateTime(date: string) {
  const offsetFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: stationTimeZone,
    timeZoneName: "longOffset",
  });
  const offsetName =
    offsetFormatter
      .formatToParts(new Date(`${date}T12:00:00Z`))
      .find((part) => part.type === "timeZoneName")?.value || "GMT-08:00";
  const offset = offsetName.replace("GMT", "") || "+00:00";

  return `${date}T00:00:00${offset}`;
}

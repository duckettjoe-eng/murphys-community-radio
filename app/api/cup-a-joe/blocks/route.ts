import { NextResponse } from "next/server";
import { getCupAJoeSupabase } from "@/app/lib/cupAJoeServer";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) return unauthorized();

  try {
    const { action, show_date: showDate } = (await request.json()) as {
      action?: "weather" | "calendar";
      show_date?: string;
    };

    if (!showDate || !/^\d{4}-\d{2}-\d{2}$/.test(showDate)) {
      return NextResponse.json(
        { error: "A valid show date is required." },
        { status: 400 },
      );
    }

    if (action === "weather") return createWeatherBlock(showDate);
    if (action === "calendar") return createCalendarBlock(showDate);

    return NextResponse.json({ error: "Unknown block action." }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}

async function createWeatherBlock(showDate: string) {
  const { data, error } = await getCupAJoeSupabase()
    .from("cup_a_joe_items")
    .insert({
      show_date: showDate,
      use_in_show: false,
      category: "Weather",
      title: "Weather",
      source: "Manual Weather",
      url: null,
      summary: "",
      joe_notes: "",
      segment: "Weather",
      sort_order: 0,
      estimated_minutes: 1,
    })
    .select("*")
    .single();

  if (error) throw error;
  return NextResponse.json({ item: data }, { status: 201 });
}

async function createCalendarBlock(showDate: string) {
  const rangeEnd = addDays(showDate, 14);
  const { data: events, error: eventsError } = await getCupAJoeSupabase()
    .from("cup_a_joe_items")
    .select("show_date,title,summary")
    .eq("source", "Google Calendar")
    .gte("show_date", showDate)
    .lte("show_date", rangeEnd)
    .order("show_date", { ascending: true })
    .order("sort_order", { ascending: true });

  if (eventsError) throw eventsError;
  if (!events?.length) {
    return NextResponse.json(
      { error: "No imported Google Calendar items were found in the next 14 days." },
      { status: 400 },
    );
  }

  const groups = {
    Today: [] as typeof events,
    "This Weekend": [] as typeof events,
    "Coming Up": [] as typeof events,
  };

  for (const event of events) {
    if (event.show_date === showDate) {
      groups.Today.push(event);
    } else if (isThisWeekend(event.show_date, showDate)) {
      groups["This Weekend"].push(event);
    } else {
      groups["Coming Up"].push(event);
    }
  }

  const summary = Object.entries(groups)
    .filter(([, groupedEvents]) => groupedEvents.length > 0)
    .map(([label, groupedEvents]) => {
      const lines = groupedEvents.map((event) => {
        const details = event.summary?.trim()
          ? ` - ${event.summary.trim().replace(/\n+/g, "; ")}`
          : "";
        return `• ${event.title}${details}`;
      });

      return `${label}\n${lines.join("\n")}`;
    })
    .join("\n\n");

  const { data, error } = await getCupAJoeSupabase()
    .from("cup_a_joe_items")
    .insert({
      show_date: showDate,
      use_in_show: false,
      category: "Events",
      title: "Community Calendar",
      source: "Google Calendar Block",
      url: null,
      summary,
      joe_notes: null,
      segment: "Events",
      sort_order: 0,
      estimated_minutes: 1,
    })
    .select("*")
    .single();

  if (error) throw error;
  return NextResponse.json({ item: data }, { status: 201 });
}

function isThisWeekend(date: string, showDate: string) {
  const show = new Date(`${showDate}T12:00:00Z`);
  const day = show.getUTCDay();
  const daysUntilSaturday = (6 - day + 7) % 7;
  const saturday = addDays(showDate, daysUntilSaturday);
  const sunday = addDays(saturday, 1);

  return date === saturday || date === sunday;
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

async function isAuthorized(request: Request) {
  const password = process.env.STUDIO_PASSWORD;
  if (!password) return false;

  const expected = await sha256(password);
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith("studio_auth="))
    ?.slice("studio_auth=".length);

  return cookie === expected;
}

async function sha256(value: string) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

function errorResponse(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof error.message === "string"
        ? error.message
        : "Unable to create block.";

  return NextResponse.json({ error: message }, { status: 500 });
}

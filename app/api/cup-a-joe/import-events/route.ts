import { NextResponse } from "next/server";
import { getGoogleCalendarEvents } from "@/app/lib/googleCalendar";
import { getCupAJoeSupabase } from "@/app/lib/cupAJoeServer";

export const dynamic = "force-dynamic";

const googleCalendarSource = "Google Calendar";

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function isAuthorized(request: Request) {
  const studioPassword = process.env.STUDIO_PASSWORD;

  if (!studioPassword) return false;

  const expectedToken = await sha256(studioPassword);
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith("studio_auth="))
    ?.slice("studio_auth=".length);

  return cookie === expectedToken;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unable to import Google Calendar events.";
}

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { show_date: showDate } = (await request.json()) as {
      show_date?: string;
    };

    if (!showDate || !/^\d{4}-\d{2}-\d{2}$/.test(showDate)) {
      return NextResponse.json(
        { error: "A valid show date is required." },
        { status: 400 },
      );
    }

    const calendarEvents = await getGoogleCalendarEvents(showDate);
    const supabase = getCupAJoeSupabase();
    const { data: existingItems, error: existingError } = await supabase
      .from("cup_a_joe_items")
      .select("title")
      .eq("show_date", showDate)
      .eq("source", googleCalendarSource);

    if (existingError) throw existingError;

    const existingTitles = new Set(
      (existingItems ?? []).map((item) => item.title),
    );
    const seenTitles = new Set(existingTitles);
    const newEvents = calendarEvents.filter((event) => {
      if (seenTitles.has(event.title)) return false;

      seenTitles.add(event.title);
      return true;
    });

    if (newEvents.length > 0) {
      const { error: insertError } = await supabase
        .from("cup_a_joe_items")
        .insert(
          newEvents.map((event, index) => ({
            show_date: showDate,
            use_in_show: true,
            category: "Events",
            title: event.title,
            source: googleCalendarSource,
            url: event.url,
            summary: event.summary,
            joe_notes: null,
            segment: "Events",
            sort_order: index * 10,
          })),
        );

      if (insertError) throw insertError;
    }

    return NextResponse.json({
      found: calendarEvents.length,
      imported: newEvents.length,
      skipped: calendarEvents.length - newEvents.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: errorMessage(error) },
      { status: 500 },
    );
  }
}

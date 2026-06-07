import { NextResponse } from "next/server";
import { sortCupAJoeItems } from "@/app/lib/cupAJoe";
import { generateShowScript } from "@/app/lib/cupAJoeAi";
import { getCupAJoeSupabase } from "@/app/lib/cupAJoeServer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAuthorized(request))) return unauthorized();

  const showDate = new URL(request.url).searchParams.get("show_date");

  if (!validDate(showDate)) {
    return NextResponse.json(
      { error: "A valid show_date is required." },
      { status: 400 },
    );
  }

  try {
    const { data, error } = await getCupAJoeSupabase()
      .from("cup_a_joe_show_scripts")
      .select("*")
      .eq("show_date", showDate)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ show_script: data ?? null });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) return unauthorized();

  try {
    const { show_date: showDate } = (await request.json()) as {
      show_date?: string;
    };

    if (!validDate(showDate)) {
      return NextResponse.json(
        { error: "A valid show date is required." },
        { status: 400 },
      );
    }

    const supabase = getCupAJoeSupabase();
    const { data: items, error: itemsError } = await supabase
      .from("cup_a_joe_items")
      .select("*")
      .eq("show_date", showDate)
      .eq("use_in_show", true);

    if (itemsError) throw itemsError;
    if (!items?.length) {
      return NextResponse.json(
        { error: "No approved items are available for this show date." },
        { status: 400 },
      );
    }

    const generated = await generateShowScript(sortCupAJoeItems(items));
    const now = new Date().toISOString();
    const { data: showScript, error: saveError } = await supabase
      .from("cup_a_joe_show_scripts")
      .upsert(
        {
          show_date: showDate,
          script: generated.script,
          segments: generated.segments,
          model: generated.model,
          updated_at: now,
        },
        { onConflict: "show_date" },
      )
      .select("*")
      .single();

    if (saveError) throw saveError;

    return NextResponse.json({ show_script: showScript });
  } catch (error) {
    return errorResponse(error);
  }
}

function validDate(value: string | null | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
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
        : "Unable to generate the show script.";

  return NextResponse.json({ error: message }, { status: 500 });
}

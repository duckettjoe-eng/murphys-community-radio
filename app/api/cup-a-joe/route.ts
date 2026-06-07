import { NextResponse } from "next/server";
import {
  CUP_A_JOE_CATEGORIES,
  CUP_A_JOE_SEGMENTS,
  type CupAJoeItemInput,
} from "@/app/lib/cupAJoe";
import { getCupAJoeSupabase } from "@/app/lib/cupAJoeServer";

export const dynamic = "force-dynamic";

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
        : "Unable to save show prep.";

  return NextResponse.json(
    { error: message },
    { status: 500 },
  );
}

function cleanInput(input: Partial<CupAJoeItemInput>): CupAJoeItemInput {
  const title = input.title?.trim();

  if (!title) {
    throw new Error("Title is required.");
  }

  if (!input.show_date || !/^\d{4}-\d{2}-\d{2}$/.test(input.show_date)) {
    throw new Error("A valid show date is required.");
  }

  const category =
    input.category &&
    CUP_A_JOE_CATEGORIES.includes(
      input.category as (typeof CUP_A_JOE_CATEGORIES)[number],
    )
      ? input.category
      : null;
  const segment =
    typeof input.segment === "string" &&
    CUP_A_JOE_SEGMENTS.includes(
      input.segment as (typeof CUP_A_JOE_SEGMENTS)[number],
    )
      ? input.segment
      : "Local Headlines";

  return {
    show_date: input.show_date,
    use_in_show: Boolean(input.use_in_show),
    category,
    title,
    source: input.source?.trim() || null,
    url: input.url?.trim() || null,
    summary: input.summary?.trim() || null,
    joe_notes: input.joe_notes?.trim() || null,
    segment,
    sort_order: Number.isFinite(Number(input.sort_order))
      ? Number(input.sort_order)
      : 0,
  };
}

export async function GET(request: Request) {
  if (!(await isAuthorized(request))) return unauthorized();

  const showDate = new URL(request.url).searchParams.get("show_date");

  if (!showDate || !/^\d{4}-\d{2}-\d{2}$/.test(showDate)) {
    return NextResponse.json(
      { error: "A valid show_date is required." },
      { status: 400 },
    );
  }

  try {
    const { data, error } = await getCupAJoeSupabase()
      .from("cup_a_joe_items")
      .select("*")
      .eq("show_date", showDate)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json(
      { items: data ?? [] },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) return unauthorized();

  try {
    const input = cleanInput(await request.json());
    const { data, error } = await getCupAJoeSupabase()
      .from("cup_a_joe_items")
      .insert(input)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  if (!(await isAuthorized(request))) return unauthorized();

  try {
    const body = (await request.json()) as Partial<CupAJoeItemInput> & {
      id?: string;
    };

    if (!body.id) {
      return NextResponse.json({ error: "Item id is required." }, { status: 400 });
    }

    const input = cleanInput(body);
    const { data, error } = await getCupAJoeSupabase()
      .from("cup_a_joe_items")
      .update(input)
      .eq("id", body.id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ item: data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  if (!(await isAuthorized(request))) return unauthorized();

  try {
    const id = new URL(request.url).searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Item id is required." }, { status: 400 });
    }

    const { error } = await getCupAJoeSupabase()
      .from("cup_a_joe_items")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

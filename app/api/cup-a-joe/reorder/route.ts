import { NextResponse } from "next/server";
import { getCupAJoeSupabase } from "@/app/lib/cupAJoeServer";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) return unauthorized();

  try {
    const { items } = (await request.json()) as {
      items?: Array<{ id?: string; sort_order?: number }>;
    };

    if (!items?.length) {
      return NextResponse.json(
        { error: "At least one item is required." },
        { status: 400 },
      );
    }

    const supabase = getCupAJoeSupabase();

    for (const item of items) {
      if (!item.id || !Number.isFinite(Number(item.sort_order))) {
        return NextResponse.json(
          { error: "Each item requires an id and sort_order." },
          { status: 400 },
        );
      }

      const { error } = await supabase
        .from("cup_a_joe_items")
        .update({ sort_order: Number(item.sort_order) })
        .eq("id", item.id);

      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Unable to save rundown order.");
  }
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

function errorResponse(error: unknown, fallback: string) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof error.message === "string"
        ? error.message
        : fallback;

  return NextResponse.json({ error: message }, { status: 500 });
}

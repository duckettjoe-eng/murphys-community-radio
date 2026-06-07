import { NextResponse } from "next/server";
import { generateTalkingPoints } from "@/app/lib/cupAJoeAi";
import { getCupAJoeSupabase } from "@/app/lib/cupAJoeServer";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) return unauthorized();

  try {
    const { id } = (await request.json()) as { id?: string };

    if (!id) {
      return NextResponse.json({ error: "Item id is required." }, { status: 400 });
    }

    const supabase = getCupAJoeSupabase();
    const { data: item, error: itemError } = await supabase
      .from("cup_a_joe_items")
      .select("*")
      .eq("id", id)
      .eq("use_in_show", true)
      .single();

    if (itemError) throw itemError;

    const { value: talkingPoints } = await generateTalkingPoints(item);
    const { data: updatedItem, error: updateError } = await supabase
      .from("cup_a_joe_items")
      .update({ talking_points: talkingPoints })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    return errorResponse(error);
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

function errorResponse(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof error.message === "string"
        ? error.message
        : "Unable to generate talking points.";

  return NextResponse.json({ error: message }, { status: 500 });
}

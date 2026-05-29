import { NextResponse } from "next/server";
import {
  getManualLiveStatus,
  setManualLiveStatus,
} from "@/app/lib/manualLiveStatus";

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
    ?.replace("studio_auth=", "");

  return cookie === expectedToken;
}

export async function GET() {
  const status = await getManualLiveStatus();

  return NextResponse.json(status, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const input = (await request.json()) as {
    isLive?: boolean;
    name?: string;
    host?: string;
  };

  const name = input.name?.trim() || "Unscheduled Live Mix";
  const host = input.host?.trim() || "DJ Hello Joey";

  try {
    await setManualLiveStatus({
      isLive: Boolean(input.isLive),
      name,
      host,
    });

    return NextResponse.json({
      isLive: Boolean(input.isLive),
      name,
      host,
      source: "manual-live",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update live status.",
      },
      { status: 500 },
    );
  }
}

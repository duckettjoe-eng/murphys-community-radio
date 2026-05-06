import { NextResponse } from "next/server";

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: string };
  const studioPassword = process.env.STUDIO_PASSWORD;

  if (!studioPassword) {
    return NextResponse.json(
      { ok: false, error: "Studio password is not configured." },
      { status: 500 },
    );
  }

  if (password !== studioPassword) {
    return NextResponse.json(
      { ok: false, error: "Incorrect password." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set("studio_auth", await sha256(studioPassword), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return response;
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const studioPassword = process.env.STUDIO_PASSWORD;

  if (studioPassword) {
    const expectedToken = await sha256(studioPassword);
    const cookie = request.cookies.get("studio_auth")?.value;

    if (cookie === expectedToken) {
      return NextResponse.next();
    }
  }

  const loginUrl = new URL("/host-login", request.url);
  loginUrl.searchParams.set("next", path + request.nextUrl.search);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/studio/:path*",
    "/admin/live/:path*",
    "/admin/cup-a-joe/:path*",
  ],
};

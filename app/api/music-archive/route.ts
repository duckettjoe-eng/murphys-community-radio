import { NextResponse } from "next/server";
import { localMusicArchive } from "@/app/lib/localMusicArchive";

export async function GET() {
  return NextResponse.json(localMusicArchive);
}

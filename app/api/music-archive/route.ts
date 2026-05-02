import { NextResponse } from "next/server";
import { beatDownArchive } from "@/app/lib/localMusicArchive";

export async function GET() {
  return NextResponse.json(beatDownArchive);
}

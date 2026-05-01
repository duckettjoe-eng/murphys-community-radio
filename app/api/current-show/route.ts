import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

const fallbackShow = {
  name: "Murphys Community Radio",
  host: "Live Broadcast",
};

export async function GET() {
  try {
    const now = new Date();
    const hour = now.getHours();

    const { data, error } = await supabase.from("shows").select("*");

    if (error) throw error;

    const current =
      data?.find(
        (show) => hour >= show.start_hour && hour < show.end_hour,
      ) || fallbackShow;

    return NextResponse.json(current);
  } catch {
    return NextResponse.json({
      ...fallbackShow,
      source: "fallback",
    });
  }
}

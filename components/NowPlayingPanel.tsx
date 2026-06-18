"use client";

import { useEffect, useState } from "react";

type NowPlaying = {
  title: string;
  artist: string;
  source: string;
  artwork?: string;
};

const fallbackTrack: NowPlaying = {
  title: "Live Stream",
  artist: "Murphys Community Radio",
  source: "fallback",
  artwork: "/logos/murphys-radio-logo-color.png",
};

export default function NowPlayingPanel() {
  const [track, setTrack] = useState<NowPlaying>(fallbackTrack);

  useEffect(() => {
    let isMounted = true;

    async function loadNowPlaying() {
      try {
        const response = await fetch("/api/now-playing", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = (await response.json()) as Partial<NowPlaying>;

        if (!isMounted) return;

        setTrack({
          title: data.title?.trim() || fallbackTrack.title,
          artist: data.artist?.trim() || fallbackTrack.artist,
          source: data.source?.trim() || fallbackTrack.source,
          artwork: data.artwork?.trim() || fallbackTrack.artwork,
        });
      } catch {
        if (isMounted) setTrack(fallbackTrack);
      }
    }

    loadNowPlaying();
    const interval = window.setInterval(loadNowPlaying, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="bg-zinc-950 px-4 py-5">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-300">
        Last played
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-[9rem_1fr] sm:items-center">
        <div className="aspect-square overflow-hidden rounded-lg border border-orange-400/20 bg-black p-3">
          <img
            src={track.artwork || fallbackTrack.artwork}
            alt=""
            className="h-full w-full object-contain"
          />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-black leading-tight text-zinc-50">
            {track.title}
          </p>
          <p className="mt-2 text-base font-semibold text-zinc-400">
            {track.artist}
          </p>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
            {track.source}
          </p>
        </div>
      </div>
    </div>
  );
}

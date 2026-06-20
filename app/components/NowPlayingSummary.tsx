"use client";

import { useEffect, useState } from "react";

type NowPlayingPayload = {
  title: string;
  artist: string;
  art?: string | null;
  showArt?: string | null;
  isPlaying?: boolean;
  showName: string;
  playlistName?: string | null;
  showSource: "live365-event" | "local-schedule" | "fallback";
  source: "live365" | "azuracast" | "icy" | "fallback";
};

const fallbackNowPlaying: NowPlayingPayload = {
  title: "Live Stream",
  artist: "Murphys Community Radio",
  art: null,
  showArt: "/logos/skull-county-radio-logo.png",
  isPlaying: false,
  showName: "Murphys Community Radio",
  playlistName: null,
  showSource: "fallback",
  source: "fallback",
};

export default function NowPlayingSummary() {
  const [nowPlaying, setNowPlaying] =
    useState<NowPlayingPayload>(fallbackNowPlaying);

  useEffect(() => {
    let isMounted = true;

    const loadNowPlaying = async () => {
      try {
        const response = await fetch(`/api/now-playing?t=${Date.now()}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as NowPlayingPayload;

        if (isMounted) {
          setNowPlaying({
            ...fallbackNowPlaying,
            ...data,
          });
        }
      } catch {
        if (isMounted) {
          setNowPlaying(fallbackNowPlaying);
        }
      }
    };

    loadNowPlaying();
    const interval = setInterval(loadNowPlaying, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const artwork = nowPlaying.showArt || "/logos/skull-county-radio-logo.png";

  return (
    <div className="border-t border-orange-400/20 bg-zinc-950 px-4 py-4 sm:px-5">
      <div className="flex items-start gap-4">
        {artwork ? (
          <img
            src={artwork}
            alt=""
            className="h-16 w-16 flex-none rounded-md object-cover"
          />
        ) : (
          <div className="grid h-16 w-16 flex-none place-items-center rounded-md bg-orange-400/15 text-xs font-black uppercase tracking-[0.16em] text-orange-300">
            MCR
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-300">
            Current Show
          </p>
          <h3 className="mt-1 text-lg font-black leading-tight text-white">
            {nowPlaying.showName}
          </h3>
          {nowPlaying.playlistName &&
            nowPlaying.playlistName !== nowPlaying.showName && (
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                {nowPlaying.playlistName}
              </p>
            )}
          <p className="mt-3 truncate text-sm font-bold text-zinc-300">
            {nowPlaying.artist} - {nowPlaying.title}
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

export default function RadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const fallbackNowPlaying = "Golden Era Hip-Hop — Test Stream";
  const [nowPlaying, setNowPlaying] = useState(
    fallbackNowPlaying,
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamUrl = "https://streams.ilovemusic.de/iloveradio1.mp3";

  const refreshNowPlaying = async () => {
    try {
      const response = await fetch("/api/now-playing", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Now playing endpoint failed");
      }

      const data = (await response.json()) as { title?: string };

      if (data?.title) {
        setNowPlaying(data.title);
        return;
      }

      setNowPlaying(fallbackNowPlaying);
    } catch {
      setNowPlaying(fallbackNowPlaying);
    }
  };

  useEffect(() => {
    refreshNowPlaying();

    const interval = setInterval(refreshNowPlaying, 30000);

    return () => clearInterval(interval);
  }, []);

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch(() => {
        console.log("Stream failed to start");
      });
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gold/30 bg-hunter-deep/95 px-5 py-4 backdrop-blur-sm sm:px-6">
      <audio ref={audioRef} src={streamUrl} preload="none" />
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gold-light">
              Murphys Community Radio
            </p>
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cream shadow-sm">
              LIVE
            </span>
          </div>
          <p className="text-sm text-cream sm:text-base">
            <span className="text-yellow-500/80">Now Playing: </span>
            <span className="font-semibold text-[#f3ead2]">{nowPlaying}</span>
          </p>
          <p className="text-xs text-cream/65">
            Foothill voices, on the air.
          </p>
        </div>
        <button
          type="button"
          onClick={togglePlayback}
          className="inline-flex items-center justify-center rounded-full bg-gold px-5 py-2 text-sm font-bold uppercase tracking-[0.14em] text-hunter transition duration-200 hover:bg-gold-light focus:outline-none focus:ring-2 focus:ring-gold-light focus:ring-offset-2 focus:ring-offset-hunter-deep"
        >
          {isPlaying ? "Pause" : "Listen Live"}
        </button>
      </div>
    </div>
  );
}

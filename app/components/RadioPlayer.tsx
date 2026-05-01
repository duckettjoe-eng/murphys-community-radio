"use client";

import { useEffect, useRef, useState } from "react";

export default function RadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const fallbackNowPlaying = "Golden Era Hip-Hop — Test Stream";
  const [nowPlaying, setNowPlaying] = useState(fallbackNowPlaying);
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

  useEffect(() => {
    if (!audioRef.current) return;

    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!audioRef.current) return;

    audioRef.current.muted = muted;
  }, [muted]);

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
        setIsPlaying(false);
        setStatus("Stream unavailable");
        console.log("Stream failed to start");
      });
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-gold/30 bg-hunter-deep/95 px-4 py-4 shadow-2xl shadow-black/50 backdrop-blur-md sm:px-6">
      <audio
        ref={audioRef}
        src={streamUrl}
        preload="none"
        onPlay={() => {
          setIsPlaying(true);
          setStatus("Playing");
        }}
        onPause={() => {
          setIsPlaying(false);
          setStatus("Paused");
        }}
        onError={() => {
          setIsPlaying(false);
          setStatus("Stream unavailable");
        }}
      />
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cream shadow-sm">
              LIVE
            </span>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gold-light">
              Murphys Community Radio
            </p>
            <span className="rounded-full border border-gold/25 bg-cream/5 px-2 py-0.5 text-[11px] font-semibold text-cream/70">
              {status}
            </span>
          </div>
          <p className="max-w-3xl truncate text-sm text-cream sm:text-base">
            <span className="text-yellow-500/80">Now Playing: </span>
            <span className="font-semibold text-[#f3ead2]">{nowPlaying}</span>
          </p>
          <p className="text-xs text-cream/65">
            Foothill voices, on the air.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:justify-end">
          <button
            type="button"
            onClick={togglePlayback}
            className="inline-flex min-w-36 items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-hunter transition duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gold-light focus:ring-offset-2 focus:ring-offset-hunter-deep"
          >
            {isPlaying ? "Pause" : "Listen Live"}
          </button>
          <div className="flex flex-wrap items-center gap-3 rounded-full border border-gold/20 bg-black/15 px-4 py-2">
            <label
              htmlFor="radio-volume"
              className="text-xs font-bold uppercase tracking-[0.18em] text-cream/65"
            >
              Volume
            </label>
            <input
              id="radio-volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              className="h-2 w-32 accent-gold sm:w-40"
            />
            <button
              type="button"
              onClick={() => setMuted((current) => !current)}
              className="rounded-full border border-gold/40 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-gold-light transition duration-200 hover:bg-gold hover:text-hunter"
            >
              {muted ? "Unmute" : "Mute"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

export default function RadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fallbackNowPlaying = "Golden Era Hip-Hop — Test Stream";
  const [nowPlaying, setNowPlaying] = useState(fallbackNowPlaying);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamUrl = "https://streams.ilovemusic.de/iloveradio1.mp3";
  const expandedStatus =
    status === "Playing"
      ? "Live"
      : status === "Stream unavailable"
        ? "Offline"
        : status;

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
    <>
      {expanded ? (
        <button
          type="button"
          aria-label="Close expanded radio player"
          onClick={() => setExpanded(false)}
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px]"
        />
      ) : null}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 overflow-y-auto rounded-t-2xl border-t border-gold/30 bg-hunter-deep/95 px-4 shadow-2xl shadow-black/50 backdrop-blur-md transition-all duration-300 ease-in-out sm:px-6 ${
          expanded ? "max-h-[85vh] py-5 md:max-h-[350px]" : "max-h-64 py-4 md:max-h-44"
        }`}
      >
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
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          {expanded ? (
            <div className="grid gap-5 border-b border-gold/20 pb-5 md:grid-cols-[120px_1fr_auto] md:items-center">
              <div className="grid aspect-square w-24 place-items-center rounded-xl border border-gold/30 bg-gradient-to-br from-gold/20 via-hunter to-hunter-deep shadow-inner shadow-black/30 md:w-28">
                <div className="h-10 w-10 rounded-full border-4 border-gold/70 bg-cream/10" />
              </div>
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cream shadow-sm">
                    LIVE
                  </span>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gold-light">
                    Murphys Community Radio
                  </p>
                  <span className="rounded-full border border-gold/25 bg-cream/5 px-2 py-0.5 text-[11px] font-semibold text-cream/70">
                    {expandedStatus}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-yellow-500/80">
                    Now Playing
                  </p>
                  <p className="mt-2 max-w-4xl text-2xl font-semibold leading-tight text-[#f3ead2] sm:text-3xl">
                    {nowPlaying}
                  </p>
                </div>
                <p className="text-sm text-cream/65">
                  Foothill voices, on the air.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="hidden rounded-full border border-gold/40 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-gold-light transition duration-200 hover:bg-gold hover:text-hunter md:inline-flex"
              >
                Close
              </button>
            </div>
          ) : null}

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
                <span className="font-semibold text-[#f3ead2]">
                  {nowPlaying}
                </span>
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
              <button
                type="button"
                onClick={() => setExpanded((current) => !current)}
                className="inline-flex items-center justify-center rounded-full border border-gold/40 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-gold-light transition duration-200 hover:bg-gold hover:text-hunter"
              >
                {expanded ? "Close" : "Expand"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

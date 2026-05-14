"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  beatDownArchive,
  type MusicArchiveItem,
} from "@/app/lib/localMusicArchive";

type CurrentShow = {
  name: string;
  host: string;
  source?: string;
};

type PlaybackSource = "archive" | "live";

function splitMetadata(nowPlaying: string) {
  const separator = nowPlaying.includes(" — ") ? " — " : " - ";

  if (!nowPlaying.includes(separator)) {
    return {
      artist: "Murphys Community Radio",
      title: nowPlaying,
    };
  }

  const [artist, ...titleParts] = nowPlaying.split(separator);
  const title = titleParts.join(separator).trim();

  return {
    artist: artist.trim() || "Murphys Community Radio",
    title: title || nowPlaying,
  };
}

export default function RadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isFading, setIsFading] = useState(false);

  const [currentShow, setCurrentShow] = useState<CurrentShow>({
    name: "Murphys Community Radio",
    host: "Live Broadcast",
  });

  const [hasScheduledLiveShow, setHasScheduledLiveShow] = useState(false);

  const fallbackNowPlaying = "Golden Era Hip-Hop — Test Stream";
  const [nowPlaying, setNowPlaying] = useState(fallbackNowPlaying);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nowPlayingRef = useRef(fallbackNowPlaying);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const liveStreamUrl = ""; // Add the real stream URL here when live streaming is ready.

  const archiveTrack = useMemo<MusicArchiveItem | undefined>(
    () =>
      beatDownArchive.find(
        (item) =>
          item.showSlug === "beatdown" && item.djSlug === "dj-hello-joey",
      ) || beatDownArchive[0],
    [],
  );

  const hasLiveStreamUrl = liveStreamUrl.trim().length > 0;

  const playbackSource: PlaybackSource =
    hasScheduledLiveShow && hasLiveStreamUrl ? "live" : "archive";

  const activeAudioUrl =
    playbackSource === "live" ? liveStreamUrl : archiveTrack?.audioUrl || "";
  const hasActiveAudioUrl = activeAudioUrl.trim().length > 0;

  const sourceLabel = playbackSource === "live" ? "Live" : "Archive";

  const metadata = useMemo(
    () =>
      playbackSource === "archive" && archiveTrack
        ? {
            artist: archiveTrack.artist,
            title: archiveTrack.title,
          }
        : splitMetadata(nowPlaying),
    [archiveTrack, nowPlaying, playbackSource],
  );

  const displayedShow = {
    name:
      playbackSource === "archive"
        ? archiveTrack?.showName || "Archive coming soon"
        : currentShow.name,
    host:
      playbackSource === "archive"
        ? archiveTrack?.djName || "Broadcast archive"
        : currentShow.host,
    hostLabel: playbackSource === "archive" ? "DJ" : "Host",
    source: sourceLabel,
  };

  const expandedStatus =
    status === "Playing"
      ? sourceLabel
      : status === "Stream unavailable" || status === "Archive unavailable"
        ? "Offline"
        : status;

  const updateNowPlaying = (nextNowPlaying: string) => {
    const nextValue = nextNowPlaying || fallbackNowPlaying;

    if (nextValue === nowPlayingRef.current) return;

    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }

    setIsFading(true);

    fadeTimeoutRef.current = setTimeout(() => {
      nowPlayingRef.current = nextValue;
      setNowPlaying(nextValue);
      setIsFading(false);
    }, 200);
  };

  const refreshNowPlaying = async () => {
    try {
      const response = await fetch("/api/now-playing", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Now playing endpoint failed");
      }

      const data = (await response.json()) as { title?: string };

      if (data?.title) {
        updateNowPlaying(data.title);
        return;
      }

      updateNowPlaying(fallbackNowPlaying);
    } catch {
      updateNowPlaying(fallbackNowPlaying);
    }
  };

  const fetchCurrentShow = async () => {
    try {
      const response = await fetch("/api/current-show", {
        cache: "no-store",
      });

      const data = (await response.json()) as {
        name?: string;
        host?: string;
        source?: string;
      };

      if (data?.name) {
        const hasRealScheduledShow =
          data.source === "local-schedule-file" &&
          data.name !== "Murphys Community Radio";

        setHasScheduledLiveShow(hasRealScheduledShow);
        setCurrentShow({
          name: data.name,
          host: data.host || "Live Broadcast",
          source: data.source,
        });
        return;
      }

      setHasScheduledLiveShow(false);
    } catch {
      setHasScheduledLiveShow(false);
      setCurrentShow({
        name: "Murphys Community Radio",
        host: "Live Broadcast",
      });
    }
  };

  useEffect(() => {
    if (playbackSource !== "live") return;

    refreshNowPlaying();

    const interval = setInterval(refreshNowPlaying, 30000);

    return () => clearInterval(interval);
  }, [playbackSource]);

  useEffect(() => {
    fetchCurrentShow();

    const interval = setInterval(fetchCurrentShow, 60000);

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

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  const togglePlayback = () => {
    if (!audioRef.current || !hasActiveAudioUrl) return;

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
        setStatus(
          playbackSource === "archive"
            ? "Archive unavailable"
            : "Stream unavailable",
        );
        console.log("Audio failed to start");
      });
  };

  return (
    <>
      {hasActiveAudioUrl ? (
        <audio
          ref={audioRef}
          src={activeAudioUrl}
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
            setStatus(
              playbackSource === "archive"
                ? "Archive unavailable"
                : "Stream unavailable",
            );
          }}
        />
      ) : null}

      {expanded ? (
        <button
          type="button"
          aria-label="Close expanded radio player"
          onClick={() => setExpanded(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />
      ) : null}

      {!expanded ? (
        <div className="fixed inset-x-0 bottom-0 z-50 max-h-64 overflow-y-auto border-t border-orange-400/25 bg-black/95 px-4 py-4 shadow-2xl shadow-black/80 backdrop-blur-md transition-all duration-300 ease-in-out sm:px-6 md:max-h-44">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-orange-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-black">
                  {sourceLabel}
                </span>

                <p className="text-sm font-black uppercase tracking-[0.24em] text-orange-300">
                  Murphys Community Radio
                </p>

                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/60">
                  {status}
                </span>
              </div>

              <div className="max-w-3xl">
                <div className="mb-3 rounded-2xl border border-white/10 bg-zinc-950 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400/90">
                    Current Source: {displayedShow.source}
                  </p>

                  <p className="mt-1 truncate text-xl font-black leading-tight text-white">
                    Show: {displayedShow.name}
                  </p>

                  <p className="mt-1 truncate text-xs font-semibold text-white/55">
                    {displayedShow.hostLabel}: {displayedShow.host}
                  </p>

                  {playbackSource === "live" && currentShow.source ? (
                    <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
                      Source: {currentShow.source}
                    </p>
                  ) : null}
                </div>

                <div
                  className={`transition-opacity duration-300 ${
                    isFading ? "opacity-0" : "opacity-100"
                  }`}
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-400/90">
                    Track
                  </p>

                  <p className="truncate text-sm font-semibold text-white sm:text-base">
                    {metadata.title}
                  </p>

                  <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                    {metadata.artist}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:justify-end">
              <button
                type="button"
                onClick={togglePlayback}
                disabled={!hasActiveAudioUrl}
                className="inline-flex min-w-36 items-center justify-center rounded-full bg-orange-400 px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-black transition duration-200 hover:-translate-y-0.5 hover:bg-orange-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-white/50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {isPlaying
                  ? "Pause"
                  : !hasActiveAudioUrl
                    ? "Coming Soon"
                    : playbackSource === "archive"
                    ? "Play Archive"
                    : "Listen Live"}
              </button>

              <div className="flex flex-wrap items-center gap-3 rounded-full border border-white/10 bg-zinc-950 px-4 py-2">
                <label
                  htmlFor="radio-volume"
                  className="text-xs font-black uppercase tracking-[0.18em] text-white/50"
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
                  className="h-2 w-32 accent-orange-400 sm:w-40"
                />

                <button
                  type="button"
                  onClick={() => setMuted((current) => !current)}
                  className="rounded-full border border-orange-400/40 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-orange-300 transition duration-200 hover:bg-orange-400 hover:text-black"
                >
                  {muted ? "Unmute" : "Mute"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="inline-flex items-center justify-center rounded-full border border-orange-400/40 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-orange-300 transition duration-200 hover:bg-orange-400 hover:text-black"
              >
                Expand
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {expanded ? (
        <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto border-t border-orange-400/25 bg-black/95 px-4 py-5 shadow-2xl shadow-black/80 backdrop-blur-md transition-all duration-300 ease-in-out sm:px-6 md:max-h-[350px]">
          <div className="mx-auto flex max-w-7xl flex-col gap-4">
            <div className="grid gap-5 border-b border-white/10 pb-5 md:grid-cols-[120px_1fr_auto] md:items-center">
              <div className="grid aspect-square w-24 place-items-center rounded-2xl border border-orange-400/25 bg-zinc-950 shadow-inner shadow-black/50 md:w-28">
                <div className="h-10 w-10 rounded-full border-4 border-orange-400/80 bg-white/5" />
              </div>

              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-orange-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-black">
                    {sourceLabel}
                  </span>

                  <p className="text-sm font-black uppercase tracking-[0.24em] text-orange-300">
                    Murphys Community Radio
                  </p>

                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/60">
                    {expandedStatus}
                  </span>
                </div>

                <div>
                  <div className="mb-4 rounded-2xl border border-white/10 bg-zinc-950 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-400/90">
                      Current Source: {displayedShow.source}
                    </p>

                    <p className="mt-2 text-2xl font-black leading-tight text-white">
                      Show: {displayedShow.name}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-white/60">
                      {displayedShow.hostLabel}: {displayedShow.host}
                    </p>

                    {playbackSource === "live" && currentShow.source ? (
                      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
                        Source: {currentShow.source}
                      </p>
                    ) : null}
                  </div>

                  <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-400/90">
                    Track
                  </p>

                  <div
                    className={`mt-2 max-w-4xl overflow-hidden transition-opacity duration-300 ${
                      isFading ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    <p className="metadata-marquee whitespace-nowrap text-2xl font-black leading-tight text-white sm:text-3xl">
                      {metadata.title}
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold uppercase tracking-[0.18em] text-white/45">
                      {metadata.artist}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="hidden rounded-full border border-orange-400/40 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-orange-300 transition duration-200 hover:bg-orange-400 hover:text-black md:inline-flex"
              >
                Close
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={togglePlayback}
                disabled={!hasActiveAudioUrl}
                className="inline-flex min-w-36 items-center justify-center rounded-full bg-orange-400 px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-black transition duration-200 hover:-translate-y-0.5 hover:bg-orange-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-white/50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {isPlaying
                  ? "Pause"
                  : !hasActiveAudioUrl
                    ? "Coming Soon"
                    : playbackSource === "archive"
                    ? "Play Archive"
                    : "Listen Live"}
              </button>

              <div className="flex flex-wrap items-center gap-3 rounded-full border border-white/10 bg-zinc-950 px-4 py-2">
                <label
                  htmlFor="radio-volume-expanded"
                  className="text-xs font-black uppercase tracking-[0.18em] text-white/50"
                >
                  Volume
                </label>

                <input
                  id="radio-volume-expanded"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  className="h-2 w-32 accent-orange-400 sm:w-40"
                />

                <button
                  type="button"
                  onClick={() => setMuted((current) => !current)}
                  className="rounded-full border border-orange-400/40 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-orange-300 transition duration-200 hover:bg-orange-400 hover:text-black"
                >
                  {muted ? "Unmute" : "Mute"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="inline-flex items-center justify-center rounded-full border border-orange-400/40 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-orange-300 transition duration-200 hover:bg-orange-400 hover:text-black"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

interface Live365PlayerProps {
  embedUrl?: string;
}

type NowPlayingPayload = {
  title: string;
  artist: string;
  art?: string | null;
  showArt?: string | null;
  showName: string;
  playlistName?: string | null;
};

const fallbackNowPlaying: NowPlayingPayload = {
  title: "Live Stream",
  artist: "Murphys Community Radio",
  art: null,
  showArt: "/logos/skull-county-radio-logo.png",
  showName: "Murphys Community Radio",
  playlistName: null,
};

function isValidEmbedUrl(embedUrl?: string) {
  if (!embedUrl) return false;

  try {
    return new URL(embedUrl).protocol === "https:";
  } catch {
    return false;
  }
}

function getStreamUrl(embedUrl: string) {
  try {
    const { pathname } = new URL(embedUrl);
    const mountId = pathname.match(/\/player\/([^/?#]+)/)?.[1];
    return mountId ? `https://streaming.live365.com/${mountId}` : null;
  } catch {
    return null;
  }
}

export default function Live365Player({
  embedUrl,
}: Live365PlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playerSize, setPlayerSize] = useState<"md" | "xl">("xl");
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nowPlaying, setNowPlaying] =
    useState<NowPlayingPayload>(fallbackNowPlaying);

  useEffect(() => {
    const updatePlayerSize = () => {
      const width = playerRef.current?.clientWidth ?? window.innerWidth;
      setPlayerSize(width >= 700 ? "xl" : "md");
    };

    updatePlayerSize();
    const observer = new ResizeObserver(updatePlayerSize);
    if (playerRef.current) observer.observe(playerRef.current);
    window.addEventListener("resize", updatePlayerSize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePlayerSize);
    };
  }, []);

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
        if (isMounted) setNowPlaying(fallbackNowPlaying);
      }
    };

    loadNowPlaying();
    const interval = setInterval(loadNowPlaying, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!embedUrl || !isValidEmbedUrl(embedUrl)) {
    return (
      <div
        className="grid h-[220px] place-items-center bg-black/40 px-6 text-center text-sm font-semibold text-zinc-300 sm:h-[236px]"
        role="status"
      >
        Live365 player is not configured yet.
      </div>
    );
  }

  const streamUrl = getStreamUrl(embedUrl);
  const sourceHeight = playerSize === "xl" ? 190 : 176;
  const artwork = nowPlaying.showArt || nowPlaying.art || fallbackNowPlaying.showArt;

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      setError(null);

      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        return;
      }

      audio.load();
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
      setError("Stream unavailable");
    }
  };

  if (!streamUrl) {
    return (
      <div
        className="grid h-[176px] place-items-center bg-black/40 px-6 text-center text-sm font-semibold text-zinc-300 sm:h-[190px]"
        role="status"
      >
        Live365 player is not configured yet.
      </div>
    );
  }

  return (
    <div
      ref={playerRef}
      className="grid place-items-center overflow-hidden bg-[#171321] px-5 py-5"
      style={{ height: `${sourceHeight}px` }}
    >
      <audio
        ref={audioRef}
        src={streamUrl}
        preload="none"
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onError={() => {
          setIsPlaying(false);
          setError("Stream unavailable");
        }}
      />
      <div className="flex w-full max-w-xl items-center justify-between gap-5">
        {artwork ? (
          <img
            src={artwork}
            alt=""
            className="h-24 w-24 flex-none rounded-md border border-white/10 object-cover shadow-[0_18px_40px_rgba(0,0,0,0.35)] sm:h-28 sm:w-28"
          />
        ) : null}
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-orange-300">
            {nowPlaying.playlistName || "Live365 Stream"}
          </p>
          <h3 className="mt-2 truncate text-2xl font-black text-white">
            {nowPlaying.showName}
          </h3>
          <p className="mt-2 text-sm font-semibold text-zinc-400">
            {error || (isPlaying ? "Live now" : "Ready")}
          </p>
          <p className="mt-2 truncate text-sm font-bold text-zinc-200">
            {nowPlaying.artist} - {nowPlaying.title}
          </p>
        </div>
        <button
          type="button"
          onClick={togglePlayback}
          className="grid h-16 w-16 flex-none place-items-center rounded-full bg-orange-400 text-sm font-black uppercase tracking-normal text-zinc-950 shadow-[0_0_30px_rgba(251,146,60,0.35)] transition hover:scale-105 hover:bg-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200"
          aria-label={isPlaying ? "Pause live stream" : "Play live stream"}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>
    </div>
  );
}

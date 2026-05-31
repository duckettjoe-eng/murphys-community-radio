"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CurrentShow = {
  name: string;
  host: string;
  source: string;
};

function splitMetadata(nowPlaying: string) {
  const separator = nowPlaying.includes(" — ") ? " — " : " - ";

  if (!nowPlaying.includes(separator)) {
    return {
      artist: "Skull County Radio",
      title: nowPlaying,
    };
  }

  const [artist, ...titleParts] = nowPlaying.split(separator);

  return {
    artist: artist?.trim() || "Skull County Radio",
    title: titleParts.join(separator).trim() || nowPlaying,
  };
}

export default function RadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);

  const [currentShow, setCurrentShow] = useState<CurrentShow>({
    name: "Skull County Radio",
    host: "",
    source: "Live",
  });

  const fallbackNowPlaying = "Skull County Radio — Live Stream";

  const [nowPlaying, setNowPlaying] = useState(fallbackNowPlaying);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const streamUrl =
      "https://radio.murphyscommunityradio.com/listen/skullcounty/radio.mp3";
  const metadata = useMemo(
    () => splitMetadata(nowPlaying),
    [nowPlaying],
  );

  useEffect(() => {
    if (!audioRef.current) return;

    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!audioRef.current) return;

    audioRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const response = await fetch("/api/now-playing", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed");
        }

        const data = (await response.json()) as {
          title?: string;
        };

        setNowPlaying(data.title || fallbackNowPlaying);
      } catch {
        setNowPlaying(fallbackNowPlaying);
      }
    };

    fetchNowPlaying();

    const interval = setInterval(fetchNowPlaying, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
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

        const isScheduledShow =
          data?.name &&
          data.name !== "Murphys Community Radio" &&
          data.name !== "Unscheduled Live Mix";

        if (isScheduledShow) {
          setCurrentShow({
            name: data.name || "Skull County Radio",
            host: data.host || "",
            source: data.source || "Live",
          });

          return;
        }

        setCurrentShow({
          name: "Skull County Radio",
          host: "",
          source: "Live",
        });
      } catch {
        setCurrentShow({
          name: "Skull County Radio",
          host: "",
          source: "Live",
        });
      }
    };

    fetchCurrentShow();

    const interval = setInterval(fetchCurrentShow, 60000);

    return () => clearInterval(interval);
  }, []);

  const togglePlayback = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setStatus("Paused");
      return;
    }

    try {
      await audioRef.current.play();

      setIsPlaying(true);
      setStatus("Playing");
    } catch {
      setStatus("Stream unavailable");
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-orange-400/20 bg-black/95 px-4 py-4 backdrop-blur">
      <audio
        ref={audioRef}
        src={streamUrl}
        preload="none"
      />

      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-orange-400 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-black">
              LIVE
            </span>

            <span className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
              Murphys Community Radio
            </span>

            <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/60">
              {status}
            </span>
          </div>

          <div className="mt-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400/80">
              Current Source
            </p>

            <h2 className="truncate text-xl font-black text-white">
              {currentShow.name}
            </h2>

            {currentShow.host ? (
              <p className="truncate text-sm text-white/60">
                Host: {currentShow.host}
              </p>
            ) : null}
          </div>

          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400/80">
              Now Playing
            </p>

            <p className="truncate text-base font-semibold text-white">
              {metadata.title}
            </p>

            <p className="truncate text-xs uppercase tracking-[0.12em] text-white/40">
              {metadata.artist}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={togglePlayback}
            className="rounded-full bg-orange-400 px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:bg-orange-300"
          >
            {isPlaying ? "Pause" : "Listen Live"}
          </button>

          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-zinc-950 px-4 py-2">
            <label
              htmlFor="radio-volume"
              className="text-xs font-black uppercase tracking-[0.12em] text-white/50"
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
              onChange={(event) =>
                setVolume(Number(event.target.value))
              }
              className="w-32 accent-orange-400"
            />

            <button
              type="button"
              onClick={() => setMuted((current) => !current)}
              className="rounded-full border border-orange-400/30 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-orange-300"
            >
              {muted ? "Unmute" : "Mute"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useRef, useState } from "react";

interface Live365PlayerProps {
  embedUrl?: string;
}

function isValidEmbedUrl(embedUrl?: string) {
  if (!embedUrl) return false;

  try {
    return new URL(embedUrl).protocol === "https:";
  } catch {
    return false;
  }
}

function getPlayerUrl(embedUrl: string, size: "md" | "xl") {
  const url = new URL(embedUrl);
  url.searchParams.set("s", size);
  return url.toString();
}

export default function Live365Player({
  embedUrl,
}: Live365PlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const [playerSize, setPlayerSize] = useState<"md" | "xl">("xl");

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

  const playerUrl = getPlayerUrl(embedUrl, playerSize);
  const sourceHeight = playerSize === "xl" ? 296 : 316;

  return (
    <div
      ref={playerRef}
      className="overflow-hidden"
      style={{ height: `${sourceHeight}px` }}
    >
      <iframe
        title="Murphys Community Radio Live365 Player"
        src={playerUrl}
        width="100%"
        height={sourceHeight}
        frameBorder="0"
        allow="autoplay"
        loading="lazy"
        className="block w-full overflow-hidden border-0"
      />
    </div>
  );
}

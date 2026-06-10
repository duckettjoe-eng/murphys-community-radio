"use client";

import { useEffect, useState } from "react";

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

function getPlayerUrl(embedUrl: string, size: "md" | "lg") {
  const url = new URL(embedUrl);
  url.searchParams.set("s", size);
  return url.toString();
}

export default function Live365Player({
  embedUrl,
}: Live365PlayerProps) {
  const [playerSize, setPlayerSize] = useState<"md" | "lg">("md");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 640px)");
    const updatePlayerSize = () => {
      setPlayerSize(mediaQuery.matches ? "lg" : "md");
    };

    updatePlayerSize();
    mediaQuery.addEventListener("change", updatePlayerSize);

    return () => {
      mediaQuery.removeEventListener("change", updatePlayerSize);
    };
  }, []);

  if (!embedUrl || !isValidEmbedUrl(embedUrl)) {
    return (
      <div
        className="grid h-[316px] place-items-center bg-black/40 px-6 text-center text-sm font-semibold text-zinc-300 sm:h-[336px]"
        role="status"
      >
        Live365 player is not configured yet.
      </div>
    );
  }

  const playerUrl = getPlayerUrl(embedUrl, playerSize);
  const playerHeight = playerSize === "lg" ? 336 : 316;

  return (
    <div className="overflow-hidden">
      <iframe
        title="Murphys Community Radio Live365 Player"
        src={playerUrl}
        width="100%"
        height={playerHeight}
        frameBorder="0"
        allow="autoplay"
        loading="lazy"
        className="block h-[316px] w-full max-w-full overflow-hidden border-0 sm:h-[336px]"
      />
    </div>
  );
}

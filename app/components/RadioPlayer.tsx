"use client";

import { useState } from "react";

export default function RadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [nowPlaying] = useState("Skull County Radio — Test Broadcast");

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gold/30 bg-hunter-deep/95 px-5 py-4 backdrop-blur-sm sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gold-light">
            Murphys Community Radio
          </p>
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
          onClick={() => setIsPlaying((current) => !current)}
          className="inline-flex items-center justify-center rounded-full bg-gold px-5 py-2 text-sm font-bold uppercase tracking-[0.14em] text-hunter transition duration-200 hover:bg-gold-light focus:outline-none focus:ring-2 focus:ring-gold-light focus:ring-offset-2 focus:ring-offset-hunter-deep"
        >
          {isPlaying ? "Pause" : "Listen Live"}
        </button>
      </div>
    </div>
  );
}

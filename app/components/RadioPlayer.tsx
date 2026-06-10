"use client";

import { useEffect, useState } from "react";

type CurrentShow = {
  name: string;
  host: string;
};

type RadioPlayerProps = {
  live365Url?: string;
  initialShow?: CurrentShow | null;
};

function getLive365Url(live365Url?: string) {
  if (!live365Url) return null;

  try {
    const url = new URL(live365Url);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default function RadioPlayer({
  live365Url,
  initialShow,
}: RadioPlayerProps) {
  const [currentShow, setCurrentShow] = useState<CurrentShow>({
    name: initialShow?.name || "Skull County Radio",
    host: initialShow?.host || "",
  });
  const playerUrl = getLive365Url(live365Url);

  useEffect(() => {
    let isMounted = true;

    const fetchCurrentShow = async () => {
      try {
        const response = await fetch("/api/current-show", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = (await response.json()) as {
          name?: string;
          host?: string;
        };

        if (isMounted && data.name) {
          setCurrentShow({
            name: data.name,
            host: data.host || "",
          });
        }
      } catch {
        // Keep the server-rendered schedule value when status refresh fails.
      }
    };

    fetchCurrentShow();
    const interval = setInterval(fetchCurrentShow, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <section
      aria-label="Listen live"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-orange-400/30 bg-black/95 px-4 py-4 shadow-[0_-20px_60px_rgba(249,115,22,0.14)] backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-orange-400 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-black">
              Live
            </span>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">
              Murphys Community Radio
            </span>
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
              Live365
            </span>
          </div>

          <div className="mt-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400/75">
              Current Source
            </p>
            <h2 className="truncate text-xl font-black text-white">
              {currentShow.name}
            </h2>
            {currentShow.host ? (
              <p className="truncate text-sm text-white/55">
                Host: {currentShow.host}
              </p>
            ) : null}
          </div>
        </div>

        {playerUrl ? (
          <a
            href={playerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-3 rounded-full bg-orange-400 px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-black transition hover:bg-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-offset-2 focus:ring-offset-black"
          >
            <span
              aria-hidden="true"
              className="grid h-7 w-7 place-items-center rounded-full bg-black"
            >
              <span className="ml-0.5 block h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-orange-300" />
            </span>
            Listen on Live365
          </a>
        ) : (
          <p className="rounded-full border border-white/10 px-5 py-3 text-center text-sm font-bold text-white/55">
            Live365 player is not configured yet.
          </p>
        )}
      </div>
    </section>
  );
}

"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  buildScriptSegments,
  localDateInputValue,
  type CupAJoeItem,
} from "@/app/lib/cupAJoe";

function Prompter() {
  const searchParams = useSearchParams();
  const [showDate, setShowDate] = useState(
    searchParams.get("show_date") || localDateInputValue(),
  );
  const [items, setItems] = useState<CupAJoeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(35);
  const [fontSize, setFontSize] = useState(48);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);

  const segments = useMemo(() => buildScriptSegments(items), [items]);

  const loadItems = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    setPlaying(false);

    try {
      const response = await fetch(
        `/api/cup-a-joe?show_date=${encodeURIComponent(date)}`,
        { cache: "no-store" },
      );
      const data = (await response.json()) as {
        items?: CupAJoeItem[];
        error?: string;
      };

      if (!response.ok) throw new Error(data.error || "Unable to load script.");
      setItems((data.items ?? []).filter((item) => item.use_in_show));
      setSegmentIndex(0);
      setElapsedSeconds(0);
      scrollerRef.current?.scrollTo({ top: 0 });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load script.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems(showDate);
  }, [loadItems, showDate]);

  useEffect(() => {
    if (!playing) return;

    const interval = window.setInterval(
      () => setElapsedSeconds((seconds) => seconds + 1),
      1000,
    );

    return () => window.clearInterval(interval);
  }, [playing]);

  useEffect(() => {
    if (!playing) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      lastFrameRef.current = null;
      return;
    }

    const step = (timestamp: number) => {
      const scroller = scrollerRef.current;

      if (scroller && lastFrameRef.current !== null) {
        const elapsed = (timestamp - lastFrameRef.current) / 1000;
        scroller.scrollTop += speed * elapsed;

        if (
          scroller.scrollTop + scroller.clientHeight >=
          scroller.scrollHeight - 2
        ) {
          setPlaying(false);
          return;
        }
      }

      lastFrameRef.current = timestamp;
      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [playing, speed]);

  function goToSegment(index: number) {
    const safeIndex = Math.max(0, Math.min(index, segments.length - 1));
    const target = document.getElementById(`prompter-segment-${safeIndex}`);

    setSegmentIndex(safeIndex);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function formatTimer(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-black text-white">
      <header className="z-10 border-b border-zinc-800 bg-zinc-950/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href={`/admin/cup-a-joe/rundown?show_date=${showDate}`}
            className="rounded-full border border-zinc-700 px-3 py-2 text-xs font-black uppercase tracking-wider"
          >
            Rundown
          </Link>
          <input
            aria-label="Show date"
            type="date"
            value={showDate}
            onChange={(event) => setShowDate(event.target.value)}
            className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => setPlaying((current) => !current)}
            disabled={segments.length === 0}
            className="rounded-full bg-orange-400 px-5 py-2 text-sm font-black text-black disabled:opacity-40"
          >
            {playing ? "Pause" : "Start"}
          </button>
          <button
            type="button"
            onClick={() => goToSegment(segmentIndex - 1)}
            disabled={segmentIndex === 0}
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-black disabled:opacity-30"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => goToSegment(segmentIndex + 1)}
            disabled={
              segments.length === 0 || segmentIndex === segments.length - 1
            }
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-black disabled:opacity-30"
          >
            Next
          </button>
          <label className="flex items-center gap-2 text-xs font-bold text-zinc-400">
            Speed
            <input
              type="range"
              min="10"
              max="100"
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="w-20 accent-orange-400 sm:w-28"
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-zinc-400">
            Size
            <input
              type="range"
              min="28"
              max="88"
              value={fontSize}
              onChange={(event) => setFontSize(Number(event.target.value))}
              className="w-20 accent-orange-400 sm:w-28"
            />
          </label>
          <div className="ml-auto font-mono text-xl font-black text-orange-400">
            {formatTimer(elapsedSeconds)}
          </div>
        </div>
      </header>

      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto scroll-smooth px-[5vw]"
      >
        <div className="mx-auto max-w-5xl pb-[80vh] pt-[35vh]">
          {loading ? (
            <p className="text-center text-3xl text-zinc-500">Loading script...</p>
          ) : error ? (
            <p className="rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-xl text-red-200">
              {error}
            </p>
          ) : segments.length === 0 ? (
            <p className="text-center text-3xl text-zinc-500">
              No items are marked for this show.
            </p>
          ) : (
            segments.map((segment, index) => (
              <section
                id={`prompter-segment-${index}`}
                key={segment.name}
                className="mb-[25vh] scroll-mt-8"
                onMouseEnter={() => setSegmentIndex(index)}
              >
                <p className="mb-10 text-center text-sm font-black uppercase tracking-[0.3em] text-orange-400">
                  {segment.name}
                </p>
                <div
                  className="whitespace-pre-wrap font-bold leading-[1.45] tracking-[-0.02em]"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {segment.text.replace(`${segment.name.toUpperCase()}\n\n`, "")}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

export default function CupAJoePrompterPage() {
  return (
    <Suspense
      fallback={
        <main className="flex h-screen items-center justify-center bg-black text-2xl text-white">
          Loading prompter...
        </main>
      }
    >
      <Prompter />
    </Suspense>
  );
}

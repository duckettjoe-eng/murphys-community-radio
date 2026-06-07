"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  formatEstimatedMinutes,
  localDateInputValue,
  sortCupAJoeItems,
  totalEstimatedMinutes,
  type CupAJoeItem,
} from "@/app/lib/cupAJoe";
import CupAJoeShell from "../CupAJoeShell";

function OnAir() {
  const searchParams = useSearchParams();
  const [showDate, setShowDate] = useState(
    searchParams.get("show_date") || localDateInputValue(),
  );
  const [items, setItems] = useState<CupAJoeItem[]>([]);
  const [storyIndex, setStoryIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const approvedItems = useMemo(() => sortCupAJoeItems(items), [items]);
  const currentStory = approvedItems[storyIndex] ?? null;
  const totalMinutes = useMemo(
    () => totalEstimatedMinutes(approvedItems),
    [approvedItems],
  );

  const loadItems = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/cup-a-joe?show_date=${encodeURIComponent(date)}`,
        { cache: "no-store" },
      );
      const data = (await response.json()) as {
        items?: CupAJoeItem[];
        error?: string;
      };

      if (!response.ok) throw new Error(data.error || "Unable to load show.");

      setItems((data.items ?? []).filter((item) => item.use_in_show));
      setStoryIndex(0);
      setElapsedSeconds(0);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load show.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems(showDate);
  }, [loadItems, showDate]);

  useEffect(() => {
    const interval = window.setInterval(
      () => setElapsedSeconds((seconds) => seconds + 1),
      1000,
    );

    return () => window.clearInterval(interval);
  }, []);

  async function toggleComplete() {
    if (!currentStory) return;

    const completedAt = currentStory.completed_at
      ? null
      : new Date().toISOString();
    setError(null);

    try {
      const response = await fetch("/api/cup-a-joe", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...currentStory,
          completed_at: completedAt,
        }),
      });
      const data = (await response.json()) as {
        item?: CupAJoeItem;
        error?: string;
      };

      if (!response.ok || !data.item) {
        throw new Error(data.error || "Unable to mark story complete.");
      }

      setItems((current) =>
        current.map((item) => (item.id === data.item!.id ? data.item! : item)),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to mark story complete.",
      );
    }
  }

  return (
    <CupAJoeShell
      title="On Air"
      description="Large live controls for moving through the approved show rundown."
    >
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-400">
            Show date
            <input
              type="date"
              value={showDate}
              onChange={(event) => setShowDate(event.target.value)}
              className="rounded-xl border border-zinc-700 bg-black px-4 py-3 text-base font-normal text-white"
            />
          </label>
          <div className="text-right">
            <p className="font-mono text-3xl font-black text-orange-400">
              {formatTimer(elapsedSeconds)}
            </p>
            <p className="text-sm text-zinc-500">
              Estimated show: {formatEstimatedMinutes(totalMinutes)}
            </p>
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="py-20 text-center text-3xl text-zinc-500">
            Loading show...
          </p>
        ) : !currentStory ? (
          <p className="py-20 text-center text-3xl text-zinc-500">
            No approved stories for this date.
          </p>
        ) : (
          <>
            <div className="mt-6 flex items-center justify-between gap-4">
              <p className="text-lg font-black uppercase tracking-[0.15em] text-orange-400">
                Story {storyIndex + 1} of {approvedItems.length}
              </p>
              <p className="font-black text-zinc-400">
                {formatEstimatedMinutes(currentStory.estimated_minutes)}
              </p>
            </div>

            <article
              className={`mt-4 rounded-3xl border p-6 sm:p-10 ${
                currentStory.completed_at
                  ? "border-emerald-500/60 bg-emerald-500/10"
                  : "border-zinc-800 bg-zinc-950"
              }`}
            >
              <p className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">
                {currentStory.segment} / {currentStory.source || "Saved item"}
              </p>
              <h2 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">
                {currentStory.talking_points?.headline || currentStory.title}
              </h2>
              <div className="mt-8 grid gap-6 text-xl leading-relaxed sm:text-2xl">
                <Point
                  label="Summary"
                  value={
                    currentStory.talking_points?.summary ||
                    currentStory.summary ||
                    "No summary saved."
                  }
                />
                <Point
                  label="Local Relevance"
                  value={
                    currentStory.talking_points?.local_relevance ||
                    "No talking point saved."
                  }
                />
                <Point
                  label="Listener Question"
                  value={
                    currentStory.talking_points?.listener_question ||
                    "No listener question saved."
                  }
                />
                <Point
                  label="Transition"
                  value={
                    currentStory.talking_points?.transition ||
                    "No transition saved."
                  }
                />
              </div>
            </article>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setStoryIndex((index) => Math.max(0, index - 1))}
                disabled={storyIndex === 0}
                className="rounded-2xl border border-zinc-700 px-6 py-5 text-xl font-black disabled:opacity-30"
              >
                Previous Story
              </button>
              <button
                type="button"
                onClick={toggleComplete}
                className="rounded-2xl bg-emerald-400 px-6 py-5 text-xl font-black text-black"
              >
                {currentStory.completed_at ? "Mark Incomplete" : "Mark Complete"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setStoryIndex((index) =>
                    Math.min(approvedItems.length - 1, index + 1),
                  )
                }
                disabled={storyIndex === approvedItems.length - 1}
                className="rounded-2xl bg-orange-400 px-6 py-5 text-xl font-black text-black disabled:opacity-30"
              >
                Next Story
              </button>
            </div>
          </>
        )}
      </section>
    </CupAJoeShell>
  );
}

function Point({ label, value }: { label: string; value: string }) {
  return (
    <section>
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">
        {label}
      </h3>
      <p className="mt-2 whitespace-pre-wrap font-bold">{value}</p>
    </section>
  );
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export default function CupAJoeOnAirPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-black text-2xl text-white">
          Loading On Air...
        </main>
      }
    >
      <OnAir />
    </Suspense>
  );
}

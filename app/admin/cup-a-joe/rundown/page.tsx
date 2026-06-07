"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  buildFullScript,
  groupCupAJoeItems,
  localDateInputValue,
  type CupAJoeItem,
  type CupAJoeShowScript,
} from "@/app/lib/cupAJoe";
import CupAJoeShell from "../CupAJoeShell";

export default function CupAJoeRundownPage() {
  const [showDate, setShowDate] = useState(localDateInputValue);
  const [items, setItems] = useState<CupAJoeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showScript, setShowScript] = useState<CupAJoeShowScript | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadItems = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);

    try {
      const [itemsResponse, scriptResponse] = await Promise.all([
        fetch(`/api/cup-a-joe?show_date=${encodeURIComponent(date)}`, {
          cache: "no-store",
        }),
        fetch(`/api/cup-a-joe/show-script?show_date=${encodeURIComponent(date)}`, {
          cache: "no-store",
        }),
      ]);
      const data = (await itemsResponse.json()) as {
        items?: CupAJoeItem[];
        error?: string;
      };
      const scriptData = (await scriptResponse.json()) as {
        show_script?: CupAJoeShowScript | null;
        error?: string;
      };

      if (!itemsResponse.ok) {
        throw new Error(data.error || "Unable to load rundown.");
      }
      if (!scriptResponse.ok) {
        throw new Error(scriptData.error || "Unable to load the show script.");
      }

      setItems((data.items ?? []).filter((item) => item.use_in_show));
      setShowScript(scriptData.show_script ?? null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load rundown.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems(showDate);
  }, [loadItems, showDate]);

  const groups = useMemo(() => groupCupAJoeItems(items), [items]);
  const fallbackScript = useMemo(() => buildFullScript(items), [items]);
  const script = showScript?.script || fallbackScript;

  async function generateScript() {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/cup-a-joe/show-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show_date: showDate }),
      });
      const data = (await response.json()) as {
        show_script?: CupAJoeShowScript;
        error?: string;
      };

      if (!response.ok || !data.show_script) {
        throw new Error(data.error || "Unable to generate the show script.");
      }

      setShowScript(data.show_script);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to generate the show script.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function copyScript() {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <CupAJoeShell
      title="Show Rundown"
      description="Only items marked for the show appear here, ordered by segment and sort order."
    >
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:flex-row sm:items-end sm:justify-between">
          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-400">
            Show date
            <input
              type="date"
              value={showDate}
              onChange={(event) => setShowDate(event.target.value)}
              className="rounded-xl border border-zinc-700 bg-black px-4 py-3 text-base font-normal text-white"
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={generateScript}
              disabled={generating || items.length === 0}
              className="rounded-full bg-emerald-400 px-6 py-3 text-center font-black text-black hover:bg-emerald-300 disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate Show Script"}
            </button>
            <Link
              href={`/admin/cup-a-joe/prompter?show_date=${showDate}`}
              className="rounded-full bg-orange-400 px-6 py-3 text-center font-black text-black hover:bg-orange-300"
            >
              Open Prompter
            </Link>
          </div>
        </div>

        {error ? (
          <p className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
            {error}
          </p>
        ) : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="text-2xl font-black">Rundown</h2>
            <div className="mt-5 grid gap-5">
              {loading ? (
                <p className="text-zinc-400">Loading rundown...</p>
              ) : groups.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-zinc-700 p-8 text-center text-zinc-400">
                  No items are marked for this show.
                </p>
              ) : (
                groups.map((group) => (
                  <section
                    key={group.segment}
                    className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950"
                  >
                    <h3 className="bg-orange-400 px-5 py-3 text-lg font-black text-black">
                      {group.segment}
                    </h3>
                    <ol className="divide-y divide-zinc-800">
                      {group.items.map((item) => (
                        <li key={item.id} className="p-5">
                          <div className="flex gap-4">
                            <span className="font-black text-orange-400">
                              {item.sort_order}
                            </span>
                            <div>
                              <h4 className="font-black">{item.title}</h4>
                              {item.summary ? (
                                <p className="mt-2 leading-6 text-zinc-400">
                                  {item.summary}
                                </p>
                              ) : null}
                              {item.joe_notes ? (
                                <p className="mt-2 text-sm text-orange-200">
                                  Joe notes: {item.joe_notes}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </section>
                ))
              )}
            </div>
          </div>

          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Generated Script</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {showScript
                    ? "Saved AI script built only from approved items."
                    : "Preview built from saved titles, talking points, notes, and sources."}
                </p>
              </div>
              <button
                type="button"
                onClick={copyScript}
                disabled={!script}
                className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-black hover:border-orange-400 disabled:opacity-40"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="mt-5 max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-2xl border border-zinc-800 bg-zinc-950 p-5 font-sans text-base leading-7 text-zinc-200">
              {script || "No script available for this date."}
            </pre>
          </div>
        </div>
      </section>
    </CupAJoeShell>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";

type LiveStatus = {
  isLive: boolean;
  name: string;
  host: string;
  source?: string;
};

export default function LiveAdminPage() {
  const [status, setStatus] = useState<LiveStatus>({
    isLive: false,
    name: "Unscheduled Live Mix",
    host: "DJ Hello Joey",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshStatus() {
    setError(null);

    try {
      const response = await fetch("/api/live-status", { cache: "no-store" });
      const data = (await response.json()) as LiveStatus;

      setStatus({
        isLive: Boolean(data.isLive),
        name: data.name || "Unscheduled Live Mix",
        host: data.host || "DJ Hello Joey",
        source: data.source,
      });
    } catch {
      setError("Unable to load live status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshStatus();
  }, []);

  async function updateLiveStatus(nextIsLive: boolean) {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/live-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...status,
          isLive: nextIsLive,
        }),
      });
      const data = (await response.json()) as LiveStatus & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to update live status.");
      }

      setStatus(data);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update live status.",
      );
    } finally {
      setSaving(false);
    }
  }

  function saveAsLive(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateLiveStatus(true);
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <section className="mx-auto max-w-3xl">
        <a
          href="/"
          className="text-sm font-black uppercase tracking-[0.24em] text-orange-400"
        >
          Murphys Community Radio
        </a>

        <div className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-400">
                Admin
              </p>
              <h1 className="mt-3 text-4xl font-black">Live Broadcast</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                Start or end an unscheduled live mix without changing the weekly
                schedule.
              </p>
            </div>

            <span
              className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${
                status.isLive
                  ? "bg-red-500 text-white"
                  : "bg-zinc-800 text-zinc-300"
              }`}
            >
              {status.isLive ? "Live Now" : "Offline"}
            </span>
          </div>

          <form onSubmit={saveAsLive} className="mt-8 grid gap-5">
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                Show Name
              </span>
              <input
                type="text"
                value={status.name}
                onChange={(event) =>
                  setStatus((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none focus:border-orange-400"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                Host
              </span>
              <input
                type="text"
                value={status.host}
                onChange={(event) =>
                  setStatus((current) => ({
                    ...current,
                    host: event.target.value,
                  }))
                }
                className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none focus:border-orange-400"
              />
            </label>

            {error ? (
              <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={loading || saving}
                className="rounded-full bg-orange-400 px-6 py-3 font-black text-black transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Go Live"}
              </button>

              <button
                type="button"
                disabled={loading || saving}
                onClick={() => updateLiveStatus(false)}
                className="rounded-full border border-zinc-700 px-6 py-3 font-black text-zinc-200 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                End Live
              </button>
            </div>
          </form>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600">
            Source: {status.source || "loading"}
          </p>
        </div>
      </section>
    </main>
  );
}

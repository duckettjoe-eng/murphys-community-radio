"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  CUP_A_JOE_CATEGORIES,
  CUP_A_JOE_SEGMENTS,
  localDateInputValue,
  type CupAJoeItem,
  type CupAJoeItemInput,
} from "@/app/lib/cupAJoe";
import CupAJoeShell from "./CupAJoeShell";

const emptyItem = (showDate: string): CupAJoeItemInput => ({
  show_date: showDate,
  use_in_show: false,
  category: "Local News",
  title: "",
  source: "",
  url: "",
  summary: "",
  joe_notes: "",
  segment: "Local Headlines",
  sort_order: 0,
});

export default function CupAJoeAdminPage() {
  const [showDate, setShowDate] = useState(localDateInputValue);
  const [items, setItems] = useState<CupAJoeItem[]>([]);
  const [form, setForm] = useState<CupAJoeItemInput>(() =>
    emptyItem(localDateInputValue()),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importDate, setImportDate] = useState(localDateInputValue);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [generatingItemId, setGeneratingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

      if (!response.ok) throw new Error(data.error || "Unable to load items.");
      setItems(data.items ?? []);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load items.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems(showDate);
  }, [loadItems, showDate]);

  function changeShowDate(date: string) {
    setShowDate(date);
    setEditingId(null);
    setForm(emptyItem(date));
  }

  function updateField<K extends keyof CupAJoeItemInput>(
    field: K,
    value: CupAJoeItemInput[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(item: CupAJoeItem) {
    setEditingId(item.id);
    setForm({
      show_date: item.show_date,
      use_in_show: item.use_in_show,
      category: item.category,
      title: item.title,
      source: item.source,
      url: item.url,
      summary: item.summary,
      joe_notes: item.joe_notes,
      segment: item.segment,
      sort_order: item.sort_order,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyItem(showDate));
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/cup-a-joe", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { ...form, id: editingId } : form),
      });
      const data = (await response.json()) as {
        item?: CupAJoeItem;
        error?: string;
      };

      if (!response.ok) throw new Error(data.error || "Unable to save item.");

      const nextDate = form.show_date;
      setShowDate(nextDate);
      setEditingId(null);
      setForm(emptyItem(nextDate));
      await loadItems(nextDate);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save item.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(item: CupAJoeItem) {
    if (!window.confirm(`Delete "${item.title}"?`)) return;

    setError(null);

    try {
      const response = await fetch(
        `/api/cup-a-joe?id=${encodeURIComponent(item.id)}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { error?: string };

      if (!response.ok) throw new Error(data.error || "Unable to delete item.");
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      if (editingId === item.id) cancelEdit();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete item.",
      );
    }
  }

  async function importEvents() {
    setImporting(true);
    setImportStatus(null);
    setImportError(null);

    try {
      const response = await fetch("/api/cup-a-joe/import-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show_date: importDate }),
      });
      const data = (await response.json()) as {
        found?: number;
        imported?: number;
        skipped?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Unable to import events.");
      }

      setImportStatus(
        `Imported ${data.imported ?? 0} of ${data.found ?? 0} events${
          data.skipped ? `; skipped ${data.skipped} duplicate(s)` : ""
        }.`,
      );
      changeShowDate(importDate);
      await loadItems(importDate);
    } catch (caughtError) {
      setImportError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to import events.",
      );
    } finally {
      setImporting(false);
    }
  }

  async function generateTalkingPoints(item: CupAJoeItem) {
    setGeneratingItemId(item.id);
    setError(null);

    try {
      const response = await fetch("/api/cup-a-joe/talking-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      const data = (await response.json()) as {
        item?: CupAJoeItem;
        error?: string;
      };

      if (!response.ok || !data.item) {
        throw new Error(data.error || "Unable to generate talking points.");
      }

      setItems((current) =>
        current.map((entry) => (entry.id === item.id ? data.item! : entry)),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to generate talking points.",
      );
    } finally {
      setGeneratingItemId(null);
    }
  }

  return (
    <CupAJoeShell
      title="Cup a Joe"
      description="Manual daily show prep. Save only what you have verified, then choose what makes the broadcast."
    >
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[420px_1fr] lg:items-start">
        <form
          onSubmit={saveItem}
          className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 lg:sticky lg:top-6"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">
                {editingId ? "Edit Item" : "New Item"}
              </p>
              <h2 className="mt-2 text-2xl font-black">
                {editingId ? "Update show prep" : "Add show prep"}
              </h2>
            </div>
            {editingId ? (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-sm font-bold text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4">
            <Field label="Show date">
              <input
                required
                type="date"
                value={form.show_date}
                onChange={(event) =>
                  updateField("show_date", event.target.value)
                }
              />
            </Field>

            <label className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm font-bold">
              <input
                type="checkbox"
                checked={form.use_in_show}
                onChange={(event) =>
                  updateField("use_in_show", event.target.checked)
                }
                className="h-5 w-5 accent-orange-400"
              />
              Use in show
            </label>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Field label="Category">
                <select
                  value={form.category ?? ""}
                  onChange={(event) =>
                    updateField("category", event.target.value)
                  }
                >
                  <option value="">None</option>
                  {CUP_A_JOE_CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </Field>
              <Field label="Segment">
                <select
                  value={form.segment}
                  onChange={(event) =>
                    updateField("segment", event.target.value)
                  }
                >
                  {CUP_A_JOE_SEGMENTS.map((segment) => (
                    <option key={segment}>{segment}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Title">
              <input
                required
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
              />
            </Field>
            <Field label="Source">
              <input
                value={form.source ?? ""}
                onChange={(event) => updateField("source", event.target.value)}
              />
            </Field>
            <Field label="URL">
              <input
                type="url"
                value={form.url ?? ""}
                onChange={(event) => updateField("url", event.target.value)}
              />
            </Field>
            <Field label="Summary">
              <textarea
                rows={4}
                value={form.summary ?? ""}
                onChange={(event) => updateField("summary", event.target.value)}
              />
            </Field>
            <Field label="Joe notes">
              <textarea
                rows={4}
                value={form.joe_notes ?? ""}
                onChange={(event) =>
                  updateField("joe_notes", event.target.value)
                }
              />
            </Field>
            <Field label="Sort order">
              <input
                type="number"
                value={form.sort_order}
                onChange={(event) =>
                  updateField("sort_order", Number(event.target.value))
                }
              />
            </Field>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="mt-5 w-full rounded-full bg-orange-400 px-5 py-3 font-black text-black hover:bg-orange-300 disabled:opacity-60"
          >
            {saving ? "Saving..." : editingId ? "Update Item" : "Add Item"}
          </button>
        </form>

        <div>
          <section className="mb-8 rounded-3xl border border-orange-400/30 bg-orange-400/10 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">
                  Google Calendar
                </p>
                <h2 className="mt-2 text-2xl font-black">Import Events</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                  Add calendar events to the selected show date. Existing
                  Google Calendar items with the same title are skipped.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <Field label="Event date" compact>
                  <input
                    type="date"
                    value={importDate}
                    onChange={(event) => setImportDate(event.target.value)}
                  />
                </Field>
                <button
                  type="button"
                  onClick={importEvents}
                  disabled={importing}
                  className="rounded-full bg-orange-400 px-6 py-3 font-black text-black hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {importing ? "Importing..." : "Import Events"}
                </button>
              </div>
            </div>
            {importStatus ? (
              <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                {importStatus}
              </p>
            ) : null}
            {importError ? (
              <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                {importError}
              </p>
            ) : null}
          </section>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">
                Daily File
              </p>
              <h2 className="mt-2 text-3xl font-black">Saved items</h2>
            </div>
            <Field label="Viewing date" compact>
              <input
                type="date"
                value={showDate}
                onChange={(event) => changeShowDate(event.target.value)}
              />
            </Field>
          </div>

          <div className="mt-6 grid gap-4">
            {loading ? (
              <p className="text-zinc-400">Loading show prep...</p>
            ) : items.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-zinc-700 p-10 text-center text-zinc-400">
                No items saved for this date.
              </div>
            ) : (
              items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.12em]">
                        <span
                          className={
                            item.use_in_show
                              ? "text-orange-400"
                              : "text-zinc-600"
                          }
                        >
                          {item.use_in_show ? "In Show" : "Not Selected"}
                        </span>
                        <span className="text-zinc-600">/</span>
                        <span className="text-zinc-400">{item.segment}</span>
                        {item.category ? (
                          <>
                            <span className="text-zinc-600">/</span>
                            <span className="text-zinc-400">{item.category}</span>
                          </>
                        ) : null}
                      </div>
                      <h3 className="mt-3 text-2xl font-black">{item.title}</h3>
                      {item.summary ? (
                        <p className="mt-3 whitespace-pre-wrap leading-7 text-zinc-300">
                          {item.summary}
                        </p>
                      ) : null}
                      {item.joe_notes ? (
                        <p className="mt-3 whitespace-pre-wrap rounded-xl bg-orange-400/10 p-3 text-sm text-orange-100">
                          <strong>Joe notes:</strong> {item.joe_notes}
                        </p>
                      ) : null}
                      {item.talking_points ? (
                        <dl className="mt-4 grid gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm">
                          <TalkingPoint
                            label="Headline"
                            value={item.talking_points.headline}
                          />
                          <TalkingPoint
                            label="Summary"
                            value={item.talking_points.summary}
                          />
                          <TalkingPoint
                            label="Local relevance"
                            value={item.talking_points.local_relevance}
                          />
                          <TalkingPoint
                            label="Listener question"
                            value={item.talking_points.listener_question}
                          />
                          <TalkingPoint
                            label="Transition"
                            value={item.talking_points.transition}
                          />
                        </dl>
                      ) : null}
                      <p className="mt-4 text-sm text-zinc-500">
                        Sort {item.sort_order}
                        {item.source ? ` / ${item.source}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      {item.use_in_show ? (
                        <button
                          type="button"
                          onClick={() => generateTalkingPoints(item)}
                          disabled={generatingItemId === item.id}
                          className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-black text-black hover:bg-emerald-300 disabled:opacity-60"
                        >
                          {generatingItemId === item.id
                            ? "Generating..."
                            : item.talking_points
                              ? "Regenerate Talking Points"
                              : "Generate Talking Points"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-black hover:border-orange-400"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteItem(item)}
                        className="rounded-full border border-red-900 px-4 py-2 text-sm font-black text-red-300 hover:bg-red-950"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </CupAJoeShell>
  );
}

function TalkingPoint({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-[0.12em] text-emerald-300">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap leading-6 text-zinc-200">
        {value}
      </dd>
    </div>
  );
}

function Field({
  label,
  compact = false,
  children,
}: Readonly<{
  label: string;
  compact?: boolean;
  children: React.ReactNode;
}>) {
  return (
    <label
      className={`grid gap-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-400 ${
        compact ? "sm:w-52" : ""
      } [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-zinc-800 [&_input]:bg-black [&_input]:px-4 [&_input]:py-3 [&_input]:text-base [&_input]:font-normal [&_input]:normal-case [&_input]:tracking-normal [&_input]:text-white [&_input]:outline-none [&_input]:focus:border-orange-400 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-zinc-800 [&_select]:bg-black [&_select]:px-4 [&_select]:py-3 [&_select]:text-base [&_select]:font-normal [&_select]:normal-case [&_select]:tracking-normal [&_select]:text-white [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-zinc-800 [&_textarea]:bg-black [&_textarea]:px-4 [&_textarea]:py-3 [&_textarea]:text-base [&_textarea]:font-normal [&_textarea]:normal-case [&_textarea]:tracking-normal [&_textarea]:text-white [&_textarea]:outline-none [&_textarea]:focus:border-orange-400`}
    >
      {label}
      {children}
    </label>
  );
}

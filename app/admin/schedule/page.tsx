"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { localSchedule, type Show } from "@/app/lib/localSchedule";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const emptyShow: Show = {
  name: "",
  host: "",
  day: new Date().getDay(),
  start: "09:00",
  end: "10:00",
};

const storageKey = "radio_schedule";

export default function ScheduleAdminPage() {
  const [shows, setShows] = useState<Show[]>(localSchedule);
  const [formShow, setFormShow] = useState<Show>(emptyShow);

  useEffect(() => {
    const savedSchedule = window.localStorage.getItem(storageKey);

    if (!savedSchedule) return;

    try {
      const parsedSchedule = JSON.parse(savedSchedule) as Show[];

      if (Array.isArray(parsedSchedule)) {
        setShows(parsedSchedule);
      }
    } catch {
      setShows(localSchedule);
    }
  }, []);

  const showsByDay = useMemo(
    () =>
      dayNames.map((day, dayIndex) => ({
        day,
        shows: shows
          .map((show, originalIndex) => ({ ...show, originalIndex }))
          .filter((show) => show.day === dayIndex)
          .sort((a, b) => a.start.localeCompare(b.start)),
      })),
    [shows],
  );

  const updateFormShow = (field: keyof Show, value: string) => {
    setFormShow((current) => ({
      ...current,
      [field]: field === "day" ? Number(value) : value,
    }));
  };

  const addShow = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setShows((current) => {
      const nextShows = [
        ...current,
        {
          ...formShow,
          name: formShow.name.trim(),
          host: formShow.host.trim(),
        },
      ];

      window.localStorage.setItem(storageKey, JSON.stringify(nextShows));

      return nextShows;
    });
    setFormShow(emptyShow);
  };

  const deleteShow = (showIndex: number) => {
    setShows((current) => {
      const nextShows = current.filter((_, index) => index !== showIndex);

      window.localStorage.setItem(storageKey, JSON.stringify(nextShows));

      return nextShows;
    });
  };

  return (
    <main className="min-h-screen bg-hunter-deep text-cream">
      <section className="relative border-b border-gold/20 bg-[radial-gradient(circle_at_18%_12%,rgba(224,191,112,0.14),transparent_24rem),linear-gradient(145deg,#0c2f21_0%,#071d16_76%)]">
        <div className="absolute inset-0 opacity-[0.14] grain-overlay" />
        <div className="relative mx-auto max-w-6xl px-6 py-10 sm:px-8 sm:py-14">
          <a
            href="/"
            className="text-sm font-bold uppercase tracking-[0.18em] text-gold-light transition hover:text-cream"
          >
            Murphys Community Radio
          </a>
          <div className="mt-8 max-w-3xl">
            <p className="section-kicker">Admin</p>
            <h1 className="mt-3 font-display text-5xl font-bold leading-none text-cream sm:text-6xl">
              Local schedule
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-parchment/85 sm:text-lg">
              Manage a temporary in-browser schedule view while the station
              admin tools are coming together.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-cream py-10 text-ink paper-texture sm:py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:px-8 lg:grid-cols-[1fr_380px] lg:items-start">
          <div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-kicker">Current Schedule</p>
                <h2 className="mt-2 font-display text-4xl font-bold text-hunter">
                  Shows on file
                </h2>
              </div>
              <p className="text-sm font-semibold text-ink/60">
                {shows.length} total
              </p>
            </div>

            <div className="mt-6 grid gap-5">
              {showsByDay.map(({ day, shows: dayShows }) => (
                <section
                  key={day}
                  className="rounded-lg border border-hunter/10 bg-white/45 p-4 shadow-sm sm:p-5"
                >
                  <div className="flex items-center justify-between gap-4 border-b border-hunter/10 pb-3">
                    <h3 className="font-display text-2xl font-bold text-hunter">
                      {day}
                    </h3>
                    <p className="text-sm font-semibold text-ink/55">
                      {dayShows.length} {dayShows.length === 1 ? "show" : "shows"}
                    </p>
                  </div>

                  {dayShows.length > 0 ? (
                    <div className="mt-4 grid gap-3">
                      {dayShows.map((show) => (
                        <article
                          key={`${show.day}-${show.start}-${show.name}-${show.originalIndex}`}
                          className="premium-card border-hunter/15 bg-cream p-4 shadow-black/10 sm:p-5"
                        >
                          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="sm:col-span-3">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">
                                  Show Name
                                </p>
                                <p className="mt-1 font-display text-2xl font-bold leading-tight text-hunter">
                                  {show.name}
                                </p>
                              </div>

                              <div className="rounded-md border border-hunter/10 bg-white/55 px-3 py-3">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink/50">
                                  Host
                                </p>
                                <p className="mt-1 font-semibold text-ink">
                                  {show.host}
                                </p>
                              </div>

                              <div className="rounded-md border border-hunter/10 bg-white/55 px-3 py-3 sm:col-span-2">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink/50">
                                  Time
                                </p>
                                <p className="mt-1 font-semibold text-hunter">
                                  {show.start} - {show.end}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => deleteShow(show.originalIndex)}
                              className="w-full rounded-md border border-red-900/20 px-4 py-2 text-sm font-bold uppercase tracking-[0.12em] text-red-900 transition hover:bg-red-900 hover:text-cream md:w-auto"
                            >
                              Delete
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-md border border-dashed border-hunter/15 bg-cream/60 px-4 py-3 text-sm font-semibold text-ink/55">
                      No shows scheduled.
                    </p>
                  )}
                </section>
              ))}
            </div>
          </div>

          <form
            onSubmit={addShow}
            className="premium-card border-hunter/15 bg-parchment p-5 text-ink shadow-black/10 sm:p-6"
          >
            <p className="section-kicker">Add Show</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-hunter">
              New schedule entry
            </h2>

            <div className="mt-6 grid gap-4">
              <label className="form-field">
                Name
                <input
                  required
                  type="text"
                  value={formShow.name}
                  onChange={(event) => updateFormShow("name", event.target.value)}
                  placeholder="Saturday Soundcheck"
                />
              </label>

              <label className="form-field">
                Host
                <input
                  required
                  type="text"
                  value={formShow.host}
                  onChange={(event) => updateFormShow("host", event.target.value)}
                  placeholder="DJ Foothill"
                />
              </label>

              <label className="form-field">
                Day
                <select
                  value={formShow.day}
                  onChange={(event) => updateFormShow("day", event.target.value)}
                >
                  {dayNames.map((day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="form-field">
                  Start
                  <input
                    required
                    type="time"
                    value={formShow.start}
                    onChange={(event) =>
                      updateFormShow("start", event.target.value)
                    }
                  />
                </label>

                <label className="form-field">
                  End
                  <input
                    required
                    type="time"
                    value={formShow.end}
                    onChange={(event) => updateFormShow("end", event.target.value)}
                  />
                </label>
              </div>
            </div>

            <button type="submit" className="btn-primary mt-6 w-full">
              Add Show
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

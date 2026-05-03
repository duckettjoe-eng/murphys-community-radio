"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MusicArchiveItem } from "@/app/lib/localMusicArchive";

const defaultShowSlug = "beatdown";
const allDjsSlug = "all";

export default function ArchivePage() {
  const [archiveItems, setArchiveItems] = useState<MusicArchiveItem[]>([]);
  const [status, setStatus] = useState("Loading archive");
  const [selectedShowSlug, setSelectedShowSlug] = useState(defaultShowSlug);
  const [selectedDjSlug, setSelectedDjSlug] = useState(allDjsSlug);
  const [activeItem, setActiveItem] = useState<MusicArchiveItem | null>(null);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [isFullShowPlayback, setIsFullShowPlayback] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldAutoPlayRef = useRef(false);
  const activeParts =
    activeItem?.parts && activeItem.parts.length > 0
      ? activeItem.parts
      : activeItem?.audioUrl
        ? [activeItem.audioUrl]
        : [];
  const activeAudioSrc = activeParts[activePartIndex] ?? null;
  const activeAudioLabel = activeAudioSrc
    ? decodeURIComponent(activeAudioSrc.split("/").pop() || "Archive audio")
    : null;
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const hasArchiveItems = archiveItems.length > 0;

  const showOptions = useMemo(
    () => {
      const options = archiveItems.reduce<
        { showSlug: string; showName: string }[]
      >(
        (options, item) => {
          const showExists = options.some(
            (option) => option.showSlug === item.showSlug,
          );

          if (showExists) return options;

          return [
            ...options,
            {
              showSlug: item.showSlug,
              showName: item.showName,
            },
          ];
        },
        [],
      );

      if (options.length > 0) return options;

      return [{ showSlug: defaultShowSlug, showName: "The Beat Down" }];
    },
    [archiveItems],
  );

  const selectedShowName =
    showOptions.find((show) => show.showSlug === selectedShowSlug)?.showName ||
    "The Beat Down";

  const djOptions = useMemo(
    () =>
      archiveItems
        .filter((item) => item.showSlug === selectedShowSlug)
        .reduce<{ djSlug: string; djName: string }[]>((options, item) => {
          const djExists = options.some(
            (option) => option.djSlug === item.djSlug,
          );

          if (djExists) return options;

          return [
            ...options,
            {
              djSlug: item.djSlug,
              djName: item.djName,
            },
          ];
        }, []),
    [archiveItems, selectedShowSlug],
  );

  const selectedArchiveItems = useMemo(
    () =>
      archiveItems.filter(
        (item) =>
          item.showSlug === selectedShowSlug &&
          (selectedDjSlug === allDjsSlug || item.djSlug === selectedDjSlug),
      ),
    [archiveItems, selectedDjSlug, selectedShowSlug],
  );

  useEffect(() => {
    const fetchArchive = async () => {
      try {
        const response = await fetch("/api/music-archive", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Music archive endpoint failed");
        }

        const data = (await response.json()) as MusicArchiveItem[];

        setArchiveItems(data);
        setStatus("");
      } catch {
        setArchiveItems([]);
        setStatus("The archive could not be loaded. Try refreshing the page.");
      }
    };

    fetchArchive();
  }, []);

  const playEpisode = (item: MusicArchiveItem) => {
    const isCurrentEpisode = activeItem?.id === item.id;

    if (isCurrentEpisode) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
        return;
      }

      audioRef.current
        ?.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
      return;
    }

    setSelectedShowSlug(item.showSlug);
    setSelectedDjSlug(allDjsSlug);
    setActiveItem(item);
    setActivePartIndex(0);
    setIsFullShowPlayback(false);
    setCurrentTime(0);
    setDuration(0);
    shouldAutoPlayRef.current = true;
    setIsPlaying(true);
  };

  const playFullShow = (item: MusicArchiveItem) => {
    const isCurrentEpisode = activeItem?.id === item.id;

    setSelectedShowSlug(item.showSlug);
    setSelectedDjSlug(allDjsSlug);
    setActiveItem(item);
    setActivePartIndex(0);
    setIsFullShowPlayback(true);
    setCurrentTime(0);
    setDuration(0);
    shouldAutoPlayRef.current = true;
    setIsPlaying(true);

    if (isCurrentEpisode && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const playItemPart = (item: MusicArchiveItem, partIndex: number) => {
    const parts =
      item.parts && item.parts.length > 0
        ? item.parts
        : item.audioUrl
          ? [item.audioUrl]
          : [];

    if (partIndex < 0 || partIndex >= parts.length) return;

    setSelectedShowSlug(item.showSlug);
    setSelectedDjSlug(allDjsSlug);
    setActiveItem(item);
    setActivePartIndex(partIndex);
    setIsFullShowPlayback(false);
    setCurrentTime(0);
    setDuration(0);
    shouldAutoPlayRef.current = true;
    setIsPlaying(true);
  };

  const updateSelectedShow = (showSlug: string) => {
    setSelectedShowSlug(showSlug);
    setSelectedDjSlug(allDjsSlug);
    setActivePartIndex(0);
    setIsFullShowPlayback(false);
    setCurrentTime(0);
    setDuration(0);
    shouldAutoPlayRef.current = false;
  };

  const togglePlayback = () => {
    if (!activeItem || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  const updateProgress = (nextTime: number) => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const playPart = (partIndex: number) => {
    if (!activeItem || partIndex < 0 || partIndex >= activeParts.length) return;

    const isCurrentPart = partIndex === activePartIndex;

    setActivePartIndex(partIndex);
    setIsFullShowPlayback(false);
    setCurrentTime(0);
    setDuration(0);
    shouldAutoPlayRef.current = true;
    setIsPlaying(true);

    if (isCurrentPart && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const playPreviousPart = () => {
    playPart(activePartIndex - 1);
  };

  const playNextPart = (keepFullShowPlayback = false) => {
    const nextPartIndex = activePartIndex + 1;

    if (nextPartIndex >= activeParts.length) {
      setIsFullShowPlayback(false);
      shouldAutoPlayRef.current = false;
      setIsPlaying(false);
      return;
    }

    setActivePartIndex(nextPartIndex);
    setIsFullShowPlayback(keepFullShowPlayback);
    setCurrentTime(0);
    setDuration(0);
    shouldAutoPlayRef.current = true;
    setIsPlaying(true);
  };

  const handleEnded = () => {
    const hasNextPart = activePartIndex < activeParts.length - 1;

    if (isFullShowPlayback && hasNextPart) {
      playNextPart(true);
      return;
    }

    setIsFullShowPlayback(false);
    shouldAutoPlayRef.current = false;
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");

    return `${minutes}:${remainingSeconds}`;
  };

  useEffect(() => {
    if (!activeAudioSrc || !shouldAutoPlayRef.current || !audioRef.current) {
      return;
    }

    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [activeAudioSrc]);

  return (
    <main className="min-h-screen bg-hunter-deep text-cream">
      {activeAudioSrc ? (
        <audio
          ref={audioRef}
          src={activeAudioSrc}
          preload="metadata"
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
          onTimeUpdate={(event) =>
            setCurrentTime(event.currentTarget.currentTime)
          }
          onEnded={handleEnded}
        />
      ) : null}

      <section className="relative border-b border-gold/20 bg-[radial-gradient(circle_at_18%_12%,rgba(224,191,112,0.16),transparent_25rem),radial-gradient(circle_at_84%_16%,rgba(135,155,117,0.12),transparent_24rem),linear-gradient(145deg,#0c2f21_0%,#071d16_76%)]">
        <div className="absolute inset-0 opacity-[0.14] grain-overlay" />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-6 py-10 sm:px-8 sm:py-16 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <a
              href="/"
              className="text-sm font-bold uppercase tracking-[0.18em] text-gold-light transition hover:text-cream"
            >
              Murphys Community Radio
            </a>
            <div className="mt-8 max-w-3xl">
              <p className="section-kicker">Archive</p>
              <h1 className="mt-3 font-display text-6xl font-bold leading-none text-cream sm:text-7xl">
                Archive
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-parchment/85 sm:text-lg">
                Past shows, DJ sets, and community radio recordings from
                Murphys Community Radio.
              </p>
            </div>
          </div>

          <aside className="premium-card border-gold/25 bg-cream/10 p-5 shadow-black/20 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-light">
              Now Playing
            </p>
            {activeItem ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-[88px_1fr] lg:grid-cols-1">
                {activeItem.artwork ? (
                  <img
                    src={activeItem.artwork}
                    alt={`${activeItem.host} artwork`}
                    className="aspect-square w-24 rounded-lg border border-gold/25 object-cover shadow-lg shadow-black/20 lg:w-full"
                  />
                ) : null}
                <div className="min-w-0">
                  <h2 className="font-display text-3xl font-bold leading-tight text-cream">
                    {activeItem.title}
                  </h2>
                  <p className="mt-2 text-sm font-semibold text-parchment/80">
                    {activeItem.host}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.14em]">
                    {isFullShowPlayback ? (
                      <span className="rounded-full bg-gold px-3 py-1 text-hunter">
                        Playing full show
                      </span>
                    ) : null}
                    <span className="rounded-full bg-cream/10 px-3 py-1 text-gold-light">
                      Part {activePartIndex + 1} of {activeParts.length}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-parchment/75">
                Choose a recording below to cue up the archive player.
              </p>
            )}
          </aside>
        </div>
      </section>

      <section className="bg-cream py-10 text-ink paper-texture sm:py-14">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <div className="premium-card sticky top-3 z-10 border-hunter/15 bg-hunter p-4 text-cream shadow-black/20 sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="grid min-w-0 gap-4 sm:grid-cols-[96px_1fr] sm:items-center">
                {activeItem?.artwork ? (
                  <img
                    src={activeItem.artwork}
                    alt={`${activeItem.host} artwork`}
                    className="aspect-square w-24 rounded-lg border border-gold/25 object-cover shadow-lg shadow-black/20"
                  />
                ) : (
                  <div className="grid aspect-square w-24 place-items-center rounded-lg border border-gold/25 bg-cream/10 text-center text-xs font-bold uppercase tracking-[0.14em] text-cream/45">
                    Artwork
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-light">
                    Archive Player
                  </p>
                  <h2 className="mt-2 truncate font-display text-3xl font-bold leading-tight text-cream">
                    {activeItem?.title || "Choose an episode"}
                  </h2>
                  {activeItem ? (
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold text-cream/65">
                      <span>{activeItem.host}</span>
                      <span className="text-cream/35">/</span>
                      <span>
                        Part {activePartIndex + 1} of {activeParts.length}
                      </span>
                      {isFullShowPlayback ? (
                        <>
                          <span className="text-cream/35">/</span>
                          <span className="text-gold-light">
                            Playing full show
                          </span>
                        </>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm font-semibold text-cream/65">
                      {selectedShowName} archive
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:min-w-[18rem]">
                <button
                  type="button"
                  onClick={playPreviousPart}
                  disabled={!activeItem || activePartIndex === 0}
                  className="rounded-full border border-cream/20 bg-cream/5 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-cream/75 transition duration-200 hover:border-gold/70 hover:text-gold-light disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={togglePlayback}
                  disabled={!activeItem}
                  className="rounded-full bg-gold px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-hunter transition duration-200 hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPlaying ? "Pause" : "Play"}
                </button>
                <button
                  type="button"
                  onClick={() => playNextPart(false)}
                  disabled={
                    !activeItem || activePartIndex >= activeParts.length - 1
                  }
                  className="rounded-full border border-cream/20 bg-cream/5 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-cream/75 transition duration-200 hover:border-gold/70 hover:text-gold-light disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-cream/15">
                <div
                  className="h-full rounded-full bg-gold transition-[width] duration-200"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.01"
                value={duration ? currentTime : 0}
                onChange={(event) => updateProgress(Number(event.target.value))}
                disabled={!activeItem || !duration}
                className="h-2 w-full accent-gold"
                aria-label="Episode progress"
              />
              <div className="mt-2 flex justify-between text-xs font-semibold text-cream/55">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              {activeAudioLabel ? (
                <p className="mt-2 truncate text-xs font-semibold text-cream/45">
                  {activeAudioLabel}
                </p>
              ) : null}
            </div>

            {activeItem && activeParts.length > 1 ? (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {activeParts.map((part, partIndex) => (
                  <button
                    key={part}
                    type="button"
                    onClick={() => playPart(partIndex)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] transition duration-200 ${
                      activePartIndex === partIndex
                        ? "border-gold bg-gold text-hunter"
                        : "border-cream/20 bg-cream/5 text-cream/75 hover:border-gold/70 hover:text-gold-light"
                    }`}
                  >
                    Part {partIndex + 1}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-kicker">Browse Recordings</p>
              <h2 className="mt-2 font-display text-4xl font-bold text-hunter">
                {selectedShowName}
              </h2>
            </div>
            <div className="grid gap-3 sm:min-w-[32rem] sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="archive-show"
                  className="text-xs font-bold uppercase tracking-[0.16em] text-hunter"
                >
                  Show Archive
                </label>
                <select
                  id="archive-show"
                  value={selectedShowSlug}
                  onChange={(event) => updateSelectedShow(event.target.value)}
                  className="w-full rounded-md border border-hunter/20 bg-white px-4 py-3 text-base font-semibold text-ink outline-none transition duration-200 focus:border-gold focus:ring-2 focus:ring-gold/30"
                >
                  {showOptions.map((show) => (
                    <option key={show.showSlug} value={show.showSlug}>
                      {show.showName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="archive-dj"
                  className="text-xs font-bold uppercase tracking-[0.16em] text-hunter"
                >
                  DJ
                </label>
                <select
                  id="archive-dj"
                  value={selectedDjSlug}
                  onChange={(event) => setSelectedDjSlug(event.target.value)}
                  className="w-full rounded-md border border-hunter/20 bg-white px-4 py-3 text-base font-semibold text-ink outline-none transition duration-200 focus:border-gold focus:ring-2 focus:ring-gold/30"
                >
                  <option value={allDjsSlug}>All DJs</option>
                  {djOptions.map((dj) => (
                    <option key={dj.djSlug} value={dj.djSlug}>
                      {dj.djName}
                    </option>
                  ))}
                </select>
              </div>
              {status ? (
                <p className="text-sm font-semibold text-ink/60 sm:col-span-2">
                  {status}
                </p>
              ) : (
                <p className="text-sm font-semibold text-ink/60 sm:col-span-2">
                  {selectedArchiveItems.length} items
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {selectedArchiveItems.map((item) => (
              <article
                key={item.id}
                className={`premium-card overflow-hidden shadow-black/10 ${
                  activeItem?.id === item.id
                    ? "border-gold bg-parchment shadow-gold-soft"
                    : "border-hunter/15 bg-white/80"
                }`}
              >
                <div className="grid gap-0 sm:grid-cols-[168px_1fr]">
                  {item.artwork ? (
                    <img
                      src={item.artwork}
                      alt={`${item.host} artwork`}
                      className="aspect-square w-full object-cover sm:h-full"
                    />
                  ) : null}
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
                        {item.showName}
                      </p>
                      {activeItem?.id === item.id ? (
                        <span className="rounded-full bg-hunter px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-gold-light">
                          Selected
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-3 font-display text-3xl font-bold leading-tight text-hunter">
                      {item.title}
                    </h3>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-[0.14em] text-ink/45">
                          Host
                        </dt>
                        <dd className="mt-1 font-semibold text-ink/75">
                          {item.host}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-[0.14em] text-ink/45">
                          Date
                        </dt>
                        <dd className="mt-1 font-semibold text-ink/75">
                          {item.date}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-[0.14em] text-ink/45">
                          Parts
                        </dt>
                        <dd className="mt-1 font-semibold text-ink/75">
                          {item.parts.length || 1}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => playFullShow(item)}
                        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gold px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-hunter transition duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-lg"
                      >
                        Play Full Show
                      </button>
                      <button
                        type="button"
                        onClick={() => playEpisode(item)}
                        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-hunter px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-gold-light transition duration-200 hover:-translate-y-0.5 hover:bg-hunter-deep hover:shadow-lg"
                      >
                        {activeItem?.id === item.id && isPlaying
                          ? "Pause"
                          : "Play"}
                      </button>
                    </div>
                    {item.parts.length > 1 ? (
                      <div className="mt-5">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/45">
                          View Parts
                        </p>
                        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                          {item.parts.map((part, partIndex) => (
                            <button
                              key={part}
                              type="button"
                              onClick={() => playItemPart(item, partIndex)}
                              className={`shrink-0 rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition duration-200 ${
                                activeItem?.id === item.id &&
                                activePartIndex === partIndex
                                  ? "border-gold bg-gold text-hunter"
                                  : "border-hunter/15 bg-white text-hunter hover:border-gold hover:bg-parchment"
                              }`}
                            >
                              Part {partIndex + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {!status && hasArchiveItems && selectedArchiveItems.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-hunter/20 bg-white/65 px-5 py-6 text-center">
              <p className="font-display text-2xl font-bold text-hunter">
                No recordings found
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/60">
                There are no archive items for {selectedShowName} with the
                current filters. Try another DJ, or add new shows through the
                archive pipeline.
              </p>
            </div>
          ) : null}

          {!status && !hasArchiveItems ? (
            <div className="mt-6 rounded-lg border border-dashed border-hunter/20 bg-white/65 px-5 py-6 text-center">
              <p className="font-display text-2xl font-bold text-hunter">
                The archive is ready for recordings
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/60">
                Add uploaded shows to the local archive data or run the archive
                pipeline to publish new recordings here.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

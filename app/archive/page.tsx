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
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeParts =
    activeItem?.parts && activeItem.parts.length > 0
      ? activeItem.parts
      : activeItem?.audioUrl
        ? [activeItem.audioUrl]
        : [];
  const activeAudioSrc = activeParts[activePartIndex] ?? null;

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
        setStatus("Archive unavailable");
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

    setActiveItem(item);
    setActivePartIndex(0);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);
  };

  const updateSelectedShow = (showSlug: string) => {
    setSelectedShowSlug(showSlug);
    setSelectedDjSlug(allDjsSlug);
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

  const playNextPart = () => {
    const nextPartIndex = activePartIndex + 1;

    if (nextPartIndex >= activeParts.length) {
      setIsPlaying(false);
      return;
    }

    setActivePartIndex(nextPartIndex);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);
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
    if (!activeItem || !audioRef.current) return;

    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [activeItem]);

  useEffect(() => {
    if (!activeAudioSrc || !isPlaying || !audioRef.current) return;

    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [activeAudioSrc, isPlaying]);

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
          onEnded={playNextPart}
        />
      ) : null}

      <section className="relative border-b border-gold/20 bg-[radial-gradient(circle_at_18%_12%,rgba(224,191,112,0.14),transparent_24rem),linear-gradient(145deg,#0c2f21_0%,#071d16_76%)]">
        <div className="absolute inset-0 opacity-[0.14] grain-overlay" />
        <div className="relative mx-auto max-w-6xl px-6 py-10 sm:px-8 sm:py-16">
          <a
            href="/"
            className="text-sm font-bold uppercase tracking-[0.18em] text-gold-light transition hover:text-cream"
          >
            Murphys Community Radio
          </a>
          <div className="mt-8 max-w-3xl">
            <p className="section-kicker">Archive</p>
            <h1 className="mt-3 font-display text-5xl font-bold leading-none text-cream sm:text-6xl">
              The Beat Down
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-parchment/85 sm:text-lg">
              Local music archive entries for The Beat Down recordings and
              mixes.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-cream py-10 text-ink paper-texture sm:py-14">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <div className="premium-card border-hunter/15 bg-hunter p-5 text-cream shadow-black/10 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-light">
              Beat Down Player
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="grid min-w-0 gap-4 sm:grid-cols-[112px_1fr] sm:items-center">
                {activeItem?.artwork ? (
                  <img
                    src={activeItem.artwork}
                    alt={`${activeItem.djName} artwork`}
                    className="aspect-square w-28 rounded-lg border border-gold/25 object-cover shadow-lg shadow-black/20"
                  />
                ) : (
                  <div className="grid aspect-square w-28 place-items-center rounded-lg border border-gold/25 bg-cream/10 text-center text-xs font-bold uppercase tracking-[0.14em] text-cream/45">
                    Artwork
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="truncate font-display text-3xl font-bold leading-tight text-cream">
                    {activeItem?.title || "Choose an episode"}
                  </h2>
                  {activeItem ? (
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold text-cream/65">
                      <span>{activeItem.artist}</span>
                      <span className="text-cream/35">/</span>
                      <span>{activeItem.showName}</span>
                      <span className="text-cream/35">/</span>
                      <span>{activeItem.djName}</span>
                    </div>
                  ) : (
                    <p className="mt-1 truncate text-sm font-semibold text-cream/65">
                      {selectedShowName} archive
                    </p>
                  )}
                  {activeItem && activeParts.length > 1 ? (
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-gold-light/80">
                      Part {activePartIndex + 1} of {activeParts.length}
                    </p>
                  ) : null}
                </div>
              </div>

              <button
                type="button"
                onClick={togglePlayback}
                disabled={!activeItem}
                className="inline-flex w-full items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-hunter transition duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
            </div>

            <div className="mt-5">
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
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-kicker">Local Audio</p>
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

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {selectedArchiveItems.map((item) => (
              <article
                key={item.id}
                className={`premium-card overflow-hidden shadow-black/10 ${
                  activeItem?.id === item.id
                    ? "border-gold bg-parchment shadow-gold-soft"
                    : "border-hunter/15 bg-white/65"
                }`}
              >
                {item.artwork ? (
                  <img
                    src={item.artwork}
                    alt={`${item.djName} artwork`}
                    className="aspect-square w-full object-cover"
                  />
                ) : null}
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
                    {item.showName}
                  </p>
                  <h3 className="mt-3 font-display text-3xl font-bold leading-tight text-hunter">
                    {item.title}
                  </h3>
                  <p className="mt-2 font-semibold text-ink/75">
                    {item.artist}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink/60">
                    DJ: {item.djName}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink/50">
                    {item.date}
                  </p>
                  {item.parts.length > 1 ? (
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-ink/45">
                      {item.parts.length} parts
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => playEpisode(item)}
                    className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-hunter px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-gold-light transition duration-200 hover:-translate-y-0.5 hover:bg-hunter-deep hover:shadow-lg sm:w-auto"
                  >
                    {activeItem?.id === item.id && isPlaying
                      ? "Pause"
                      : "Play"}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {!status && selectedArchiveItems.length === 0 ? (
            <p className="mt-6 rounded-md border border-dashed border-hunter/15 bg-white/55 px-4 py-3 text-sm font-semibold text-ink/55">
              No archive items for {selectedShowName} yet.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}

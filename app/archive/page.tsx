"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MusicArchiveItem } from "@/app/lib/localMusicArchive";

const defaultShowSlug = "beatdown";
const allDjsSlug = "all";

export default function ArchivePage() {
  const [archiveItems, setArchiveItems] = useState<MusicArchiveItem[]>([]);
  const [selectedShowSlug, setSelectedShowSlug] = useState(defaultShowSlug);
  const [activeItem, setActiveItem] = useState<MusicArchiveItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch("/api/music-archive")
      .then((res) => res.json())
      .then((data) => setArchiveItems(data));
  }, []);

  const selectedArchiveItems = useMemo(
    () =>
      archiveItems.filter((item) => item.showSlug === selectedShowSlug),
    [archiveItems, selectedShowSlug]
  );

  const showOptions = useMemo(() => {
    const map = new Map();
    archiveItems.forEach((item) => {
      if (!map.has(item.showSlug)) {
        map.set(item.showSlug, item.showName);
      }
    });
    return Array.from(map, ([slug, name]) => ({ slug, name }));
  }, [archiveItems]);

  const playItem = (item: MusicArchiveItem) => {
    setActiveItem(item);

    setTimeout(() => {
      audioRef.current?.play();
      setIsPlaying(true);
    }, 100);
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white pb-32">

      {/* NAV */}
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-orange-400">
          Murphys Community Radio
        </p>

        <div className="flex flex-wrap gap-3">
          <Link href="/" className="nav-btn">Home</Link>
          <Link href="/shows" className="nav-btn">Shows</Link>
          <Link href="/underwrite" className="nav-btn">Underwrite</Link>
          <Link href="/support" className="nav-btn-active">Support</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="text-center px-6 pb-16">
        <img
          src="/logos/skull-county-radio-logo.png"
          className="mx-auto mb-8 w-36 md:w-48"
        />

        <h1 className="text-5xl md:text-7xl font-black">
          Archive
        </h1>

        <p className="mt-6 text-white/60 max-w-2xl mx-auto">
          Past shows, DJ sets, and community recordings from Skull County Radio.
        </p>
      </section>

      {/* PLAYER */}
      <section className="px-6 mb-12">
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-[#17171b] p-6">
          {activeItem ? (
            <>
              <h2 className="text-2xl font-black">{activeItem.title}</h2>
              <p className="text-sm text-orange-300 mt-1">
                {activeItem.host}
              </p>

              <button
                onClick={togglePlayback}
                className="mt-4 rounded-full bg-orange-400 px-6 py-3 font-black text-black"
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
            </>
          ) : (
            <p className="text-white/60">
              Select a show to start listening
            </p>
          )}
        </div>
      </section>

      {/* FILTER */}
      <section className="px-6 mb-10">
        <div className="mx-auto max-w-5xl flex flex-wrap gap-3">
          {showOptions.map((show) => (
            <button
              key={show.slug}
              onClick={() => setSelectedShowSlug(show.slug)}
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                selectedShowSlug === show.slug
                  ? "bg-orange-400 text-black"
                  : "bg-zinc-900 border border-white/10"
              }`}
            >
              {show.name}
            </button>
          ))}
        </div>
      </section>

      {/* GRID */}
      <section className="px-6">
        <div className="mx-auto max-w-7xl grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {selectedArchiveItems.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-white/10 bg-[#17171b] p-6"
            >
              {item.artwork && (
                <img
                  src={item.artwork}
                  className="rounded-xl mb-4"
                />
              )}

              <h3 className="text-xl font-black">{item.title}</h3>

              <p className="text-sm text-white/60 mt-2">
                {item.host}
              </p>

              <button
                onClick={() => playItem(item)}
                className="mt-4 w-full rounded-full bg-orange-400 px-5 py-3 font-black text-black"
              >
                Play Episode
              </button>
            </div>
          ))}
        </div>
      </section>

      <audio ref={audioRef} src={activeItem?.audioUrl || ""} />

    </main>
  );
}
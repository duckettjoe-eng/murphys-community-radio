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

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeParts =
    activeItem?.parts?.length
      ? activeItem.parts
      : activeItem?.audioUrl
        ? [activeItem.audioUrl]
        : [];

  const activeAudioSrc = activeParts[activePartIndex] ?? null;

  const showOptions = useMemo(() => {
    const unique = new Map();
    archiveItems.forEach((item) => {
      if (!unique.has(item.showSlug)) {
        unique.set(item.showSlug, item.showName);
      }
    });
    return Array.from(unique, ([showSlug, showName]) => ({
      showSlug,
      showName,
    }));
  }, [archiveItems]);

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
    fetch("/api/music-archive")
      .then((res) => res.json())
      .then((data) => {
        setArchiveItems(data);
        setStatus("");
      })
      .catch(() => {
        setStatus("Failed to load archive");
      });
  }, []);

  const playItem = (item: MusicArchiveItem) => {
    setActiveItem(item);
    setActivePartIndex(0);

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
      {activeAudioSrc && (
        <audio
          ref={audioRef}
          src={activeAudioSrc}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* HEADER */}
      <section className="px-6 py-20 text-center">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-orange-400">
          Murphys Community Radio
        </p>

        <h1 className="mt-6 text-5xl font-black md:text-7xl">
          Archive
        </h1>

        <p className="mt-6 max-w-2xl mx-auto text-white/60">
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
              key={show.showSlug}
              onClick={() => setSelectedShowSlug(show.showSlug)}
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                selectedShowSlug === show.showSlug
                  ? "bg-orange-400 text-black"
                  : "bg-[#17171b] border border-white/10 text-white"
              }`}
            >
              {show.showName}
            </button>
          ))}
        </div>
      </section>

      {/* LIST */}
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
    </main>
  );
}
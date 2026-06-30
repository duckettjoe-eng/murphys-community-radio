"use client";

import Link from "next/link";
import LiveBroadcastButton from "@/app/components/LiveBroadcastButton";
import { useEffect, useMemo, useState } from "react";
import type { MusicArchiveItem } from "@/app/lib/localMusicArchive";

type ShowArchiveCard = {
  slug: string;
  name: string;
  host: string;
  sourceLabel: string;
  artwork: string;
  items: MusicArchiveItem[];
};

const defaultSourceFilters = [
  { id: "all", label: "All DJs" },
  { id: "skull-county-radio", label: "Skull County Radio" },
  { id: "dj-hello-joey", label: "DJ Hello Joey" },
  { id: "dj-aquarobotics", label: "DJ Aquarobotics" },
  { id: "dj-donette-g", label: "DJ Donette G" },
];

function getHostLabel(item: MusicArchiveItem) {
  return item.host || item.djName || "KMCR Host";
}

function getSourceLabel(item: MusicArchiveItem) {
  return item.sourceLabel && item.sourceLabel !== getHostLabel(item)
    ? item.sourceLabel
    : "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getShowTitle(item: MusicArchiveItem) {
  return (item.showName || item.title || "Archived Show").trim();
}

function getShowGroupKey(item: MusicArchiveItem) {
  return getShowTitle(item).toLocaleLowerCase();
}

export default function ArchivePage() {
  const [archiveItems, setArchiveItems] = useState<MusicArchiveItem[]>([]);
  const [expandedShowSlug, setExpandedShowSlug] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState("skull-county-radio");

  useEffect(() => {
    fetch("/api/music-archive")
      .then((res) => res.json())
      .then((data) => setArchiveItems(data));
  }, []);

  const sourceFilters = useMemo(() => {
    const filters = new Map(
      defaultSourceFilters.map((filter) => [filter.id, filter]),
    );

    archiveItems.forEach((item) => {
      if (!item.sourceId || filters.has(item.sourceId)) return;
      filters.set(item.sourceId, {
        id: item.sourceId,
        label: item.sourceLabel || item.djName || item.sourceId,
      });
    });

    return Array.from(filters.values());
  }, [archiveItems]);

  const filteredArchiveItems = useMemo(() => {
    if (selectedSourceId === "all") return archiveItems;

    const selectedFilter = sourceFilters.find(
      (filter) => filter.id === selectedSourceId,
    );

    return archiveItems.filter((item) => {
      if (item.sourceId === selectedSourceId) return true;
      if (!selectedFilter) return false;

      return (
        item.djName === selectedFilter.label ||
        item.sourceLabel === selectedFilter.label
      );
    });
  }, [archiveItems, selectedSourceId, sourceFilters]);

  const showCards = useMemo<ShowArchiveCard[]>(() => {
    const map = new Map<string, ShowArchiveCard>();

    filteredArchiveItems.forEach((item) => {
      const name = getShowTitle(item);
      const groupKey = getShowGroupKey(item);

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          slug: slugify(name),
          name,
          host: getHostLabel(item),
          sourceLabel: getSourceLabel(item),
          artwork: item.artwork || "/artwork/dj-hello-joey.jpg",
          items: [],
        });
      }

      map.get(groupKey)?.items.push(item);
    });

    return Array.from(map.values()).map((show) => {
      const hostLabels = Array.from(
        new Set(show.items.map((item) => getHostLabel(item)).filter(Boolean)),
      );
      const sourceLabels = Array.from(
        new Set(
          show.items.map((item) => getSourceLabel(item)).filter(Boolean),
        ),
      );

      const items = [...show.items].sort((a, b) => {
        const aTime = Date.parse(a.publishedAt || a.createdAt || "");
        const bTime = Date.parse(b.publishedAt || b.createdAt || "");
        return (Number.isNaN(bTime) ? 0 : bTime) -
          (Number.isNaN(aTime) ? 0 : aTime);
      });

      return {
        ...show,
        artwork: items[0]?.artwork || show.artwork,
        items,
        host: hostLabels.join(" / ") || show.host,
        sourceLabel: sourceLabels.join(" / ") || show.sourceLabel,
      };
    });
  }, [filteredArchiveItems]);

  return (
    <main className="min-h-screen bg-black text-white pb-32">

      {/* NAV */}
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-orange-400">
            Murphys Community Radio
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <LiveBroadcastButton />

          <Link
            href="/"
            className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800"
          >
            Home
          </Link>

          <Link
            href="/shows"
            className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800"
          >
            Shows
          </Link>

          <Link
            href="/underwriting"
            className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800"
          >
            Underwrite
          </Link>

          <Link
            href="/support"
            className="rounded-full bg-orange-400 px-5 py-3 text-sm font-bold text-black hover:bg-orange-300"
          >
            Support
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="text-center px-6 pb-16">
        <img
          src="/logos/skull-county-radio-logo.png"
          className="mx-auto mb-8 w-36 md:w-48"
          alt="Skull County Radio"
        />

        <h1 className="text-5xl md:text-7xl font-black">
          Archive
        </h1>

        <p className="mt-6 text-white/60 max-w-2xl mx-auto">
          Past shows, DJ sets, and community recordings from Skull County Radio.
        </p>
      </section>

      {/* SOURCE FILTER */}
      <section className="px-6 mb-8">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-3">
          {sourceFilters.map((filter) => {
            const isSelected = selectedSourceId === filter.id;

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => {
                  setSelectedSourceId(filter.id);
                  setExpandedShowSlug(null);
                }}
                className={`rounded-full px-5 py-3 text-sm font-bold ${
                  isSelected
                    ? "bg-orange-400 text-black"
                    : "bg-zinc-900 text-white hover:bg-zinc-800"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* SHOW CARDS */}
      <section className="px-6">
        {showCards.length > 0 ? (
          <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 xl:grid-cols-3">
            {showCards.map((show) => {
              const isExpanded = expandedShowSlug === show.slug;

              return (
                <div
                  key={show.slug}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-[#17171b]"
                >
                  <div className="block w-full">
                    <img
                      src={show.artwork}
                      className="aspect-square w-full object-cover"
                      alt={show.name}
                    />
                  </div>

                  <div className="p-6">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-300">
                      {show.items.length}{" "}
                      {show.items.length === 1 ? "episode" : "episodes"}
                    </p>

                    <h3 className="mt-3 text-2xl font-black">{show.name}</h3>

                    <p className="mt-2 text-sm text-white/60">{show.host}</p>
                    {show.sourceLabel && (
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.24em] text-white/35">
                        {show.sourceLabel}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedShowSlug(isExpanded ? null : show.slug)
                      }
                      className="mt-6 w-full rounded-full border border-white/15 px-5 py-3 font-black hover:bg-white/10"
                      aria-expanded={isExpanded}
                    >
                      {isExpanded
                        ? "Hide Episodes"
                        : `View All Episodes (${show.items.length})`}
                    </button>

                    {isExpanded && (
                      <div className="mt-6 space-y-3">
                        {show.items.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-white/10 bg-black p-4"
                          >
                            <h4 className="font-black">{item.title}</h4>

                            <p className="mt-1 text-sm text-white/50">
                              {item.date}
                            </p>
                            <p className="mt-1 text-sm text-white/60">
                              Host: {getHostLabel(item)}
                            </p>
                            {getSourceLabel(item) && (
                              <p className="mt-1 text-xs font-bold uppercase tracking-[0.22em] text-white/35">
                                {getSourceLabel(item)}
                              </p>
                            )}

                            {item.externalUrl && (
                              <a
                                href={item.externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 block w-full rounded-full bg-orange-400 px-5 py-3 text-center font-black text-black"
                              >
                                Open on Mixcloud
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-[#17171b] p-8 text-center">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-orange-300">
              Archive
            </p>

            <h2 className="mt-3 text-3xl font-black">
              First broadcast coming soon.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-white/60">
              Archived shows will appear here after the first Murphys Community
              Radio broadcast.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

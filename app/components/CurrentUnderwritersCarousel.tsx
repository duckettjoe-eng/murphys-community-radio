"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type Underwriter = {
  name: string;
  description: string;
  image: string;
  website?: string;
  imageClassName?: string;
};

// Add website URLs here when the underwriter destinations are confirmed.
const underwriters: Underwriter[] = [
  {
    name: "Pure Aloha",
    description:
      "Pure Aloha Cannabis Dispensary, proudly supporting community radio in Calaveras County.",
    image: "/partners/pure-aloha-current.png",
    imageClassName: "object-contain p-3",
  },
  {
    name: "Xtra Good Labs",
    description:
      "Creative support for independent local voices, music, and community programming.",
    image: "/partners/xtra-good-labs.jpg",
    imageClassName: "object-contain p-4",
  },
  {
    name: "Punch Creations",
    description:
      "Helping keep Murphys Community Radio creative, local, and on the air.",
    image: "/partners/punch-creations.png",
    imageClassName: "object-contain p-4",
  },
];

export default function CurrentUnderwritersCarousel() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);

  const updateControls = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    setCanScrollBack(track.scrollLeft > 4);
    setCanScrollForward(
      track.scrollLeft + track.clientWidth < track.scrollWidth - 4,
    );
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateControls();
    track.addEventListener("scroll", updateControls, { passive: true });

    const resizeObserver = new ResizeObserver(updateControls);
    resizeObserver.observe(track);

    return () => {
      track.removeEventListener("scroll", updateControls);
      resizeObserver.disconnect();
    };
  }, [updateControls]);

  const scroll = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;

    track.scrollBy({
      left: direction * track.clientWidth,
      behavior: "smooth",
    });
  };

  return (
    <div>
      <div className="flex flex-col gap-5 text-left sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-2xl font-black text-white sm:text-3xl">
            Current Underwriters
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
            Local businesses helping keep Murphys Community Radio on the air.
          </p>
        </div>

        <div className="flex gap-3 lg:hidden">
          <button
            type="button"
            onClick={() => scroll(-1)}
            disabled={!canScrollBack}
            aria-label="Previous underwriters"
            className="grid h-11 w-11 place-items-center rounded-full border border-orange-400/40 bg-black text-xl text-orange-300 transition hover:border-orange-300 hover:bg-orange-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
          >
            <span aria-hidden="true">&larr;</span>
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            disabled={!canScrollForward}
            aria-label="Next underwriters"
            className="grid h-11 w-11 place-items-center rounded-full border border-orange-400/40 bg-black text-xl text-orange-300 transition hover:border-orange-300 hover:bg-orange-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
          >
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="mt-6 grid snap-x snap-mandatory auto-cols-[88%] grid-flow-col gap-4 overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] sm:auto-cols-[calc((100%_-_1rem)/2)] lg:grid-flow-row lg:grid-cols-3 lg:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        {underwriters.map((underwriter) => {
          const content = (
            <>
              <div className="relative h-32 overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(135deg,#27150d,#090909_55%,#3a220d)] sm:h-36">
                <Image
                  src={underwriter.image}
                  alt={`${underwriter.name} logo`}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className={underwriter.imageClassName || "object-contain p-4"}
                />
              </div>
              <h4 className="mt-4 text-lg font-black text-white">
                {underwriter.name}
              </h4>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {underwriter.description}
              </p>
            </>
          );

          return underwriter.website ? (
            <a
              key={underwriter.name}
              href={underwriter.website}
              target="_blank"
              rel="noopener noreferrer"
              className="snap-start rounded-2xl border border-white/10 bg-zinc-950 p-4 text-left transition hover:border-orange-400/45"
            >
              {content}
            </a>
          ) : (
            <article
              key={underwriter.name}
              className="snap-start rounded-2xl border border-white/10 bg-zinc-950 p-4 text-left"
            >
              {content}
            </article>
          );
        })}
      </div>
    </div>
  );
}

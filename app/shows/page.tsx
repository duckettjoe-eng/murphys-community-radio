import Link from "next/link";
import { existsSync } from "node:fs";
import path from "node:path";
import LiveBroadcastButton from "@/app/components/LiveBroadcastButton";
import { generatedMixcloudArchive } from "@/app/lib/generatedMixcloudArchive";
import { getSpotifyOpenUrl } from "@/app/lib/spotifyPlaylists";

const shows = [
  {
    title: "Golden Hour Groove",
    description:
      "Golden Hour Groove blends golden era hip hop with classic soul — Nas, A Tribe Called Quest, Gang Starr, Bill Withers, Al Green, Curtis Mayfield, Marvin Gaye, and the warm crate-digging records that connect them.",
    tags: ["Golden Era Hip-Hop", "Classic Soul", "Crates"],
    day: "Thursday",
    time: "6-7 PM",
    artwork: "/artwork/shows/golden-era-groove.png",
  },
  {
    title: "Alt-Rock Barroom Radio",
    description:
      "Alternative rock, dive-bar anthems, 90s grit, and guitar-forward radio energy.",
    tags: ["Alt Rock", "Indie", "Barroom"],
    day: "Thursday",
    time: "7-8 PM",
    artwork: "/artwork/shows/alt-rock-bar-room-radio.png",
  },
  {
    title: "Dusty Crate Hip-Hop Hour",
    description:
      "Classic hip-hop, breaks, samples, and crate-digging selections with deep groove energy.",
    tags: ["Hip-Hop", "Breaks", "Crates"],
    day: "Friday",
    time: "6-7 PM",
    artwork: "/artwork/shows/dusty-crate-hip-hop-hour.png",
  },
  {
    title: "House Party Frequency",
    description:
      "Dance-floor friendly house, disco, edits, and party tracks for high-energy sets.",
    tags: ["House", "Disco", "Party"],
    day: "Friday",
    time: "7-8 PM",
    artwork: "/artwork/shows/house-party-frequency.png",
  },
  {
    title: "Weird Late-Night FM",
    description:
      "Strange, cinematic, left-field, and after-hours sounds from the edge of the dial.",
    tags: ["Experimental", "Late Night", "Oddities"],
    day: "Friday",
    time: "8-9 PM",
    artwork: "/artwork/shows/weird-late-night-fm.png",
  },
  {
    title: "Cali Sun Reggae Ride",
    description:
      "Reggae, dub, roots, and California coastal rhythms built for an easy ride.",
    tags: ["Reggae", "Dub", "Roots"],
    day: "Saturday",
    time: "5-6 PM",
    artwork: "/artwork/shows/cali-sun-reggae-ride.png",
  },
  {
    title: "Mashup Crate Hour",
    description:
      "Genre-crossing mashups, blends, tempo flips, and DJ-friendly surprises.",
    tags: ["Mashups", "DJ", "Open Format"],
    day: "Saturday",
    time: "6-7 PM",
    artwork: "/artwork/shows/mashup-crate-hour.png",
  },
  {
    title: "Campfire Americana",
    description:
      "Folk, country, roots, and storytelling songs for foothill evenings.",
    tags: ["Americana", "Folk", "Country"],
    day: "Saturday",
    time: "7-8 PM",
    artwork: "/artwork/shows/campfire-americana.png",
  },
  {
    title: "Lowrider Soul Sunday",
    description:
      "Oldies, lowrider soul, sweet harmonies, and Sunday cruising music.",
    tags: ["Oldies", "Soul", "Sunday"],
    day: "Sunday",
    time: "10-11 AM",
    artwork: "/artwork/shows/low-rider-soul-sunday.png",
  },
  {
    title: "Skull County Garage Gospel",
    description:
      "Raw garage rock, blues grit, punk spirit, and backroad gospel energy.",
    tags: ["Garage", "Blues", "Rock"],
    day: "Sunday",
    time: "11 AM-12 PM",
    artwork: "/artwork/shows/skull-county-garage-gospel.png",
  },
];

const scheduleDays = ["Thursday", "Friday", "Saturday", "Sunday"];

const showArtwork = new Map(
  generatedMixcloudArchive
    .filter((item) => item.showName && item.artwork)
    .map((item) => [item.showName, item.artwork]),
);

function publicAssetExists(src: string) {
  if (!src.startsWith("/")) return true;

  return existsSync(path.join(process.cwd(), "public", src));
}

function getShowArtwork(show: (typeof shows)[number]) {
  if (publicAssetExists(show.artwork)) return show.artwork;

  return (
    showArtwork.get(show.title) || "/logos/skull-county-radio-logo.png"
  );
}

export default function ShowsPage() {
  return (
    <main className="min-h-screen bg-[#071d16] pb-28 text-white">
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
            href="/archive"
            className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800"
          >
            Archive
          </Link>

          <Link
            href="/underwrite"
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
      <section className="px-6 pb-14 pt-8 text-center md:pb-16">
        <div className="mx-auto max-w-4xl">
          <img
            src="/logos/skull-county-radio-logo.png"
            alt="Skull County Radio"
            className="mx-auto mb-8 w-36 md:w-48"
          />

          <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.35em] text-orange-400">
            Murphys Community Radio Programming
          </p>

          <h1 className="text-5xl font-black leading-none tracking-tight md:text-7xl">
            Weekly Shows
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-white/70 md:text-xl md:leading-8">
            A simple guide to what is on the station, when to catch it, and
            where to open each companion Spotify playlist.
          </p>
        </div>
      </section>

      {/* SCHEDULE */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="overflow-hidden rounded-lg border border-white/10 bg-black/35">
          {scheduleDays.map((day) => {
            const dayShows = shows.filter((show) => show.day === day);

            return (
              <section
                key={day}
                className="grid border-b border-white/10 last:border-b-0 md:grid-cols-[11rem_1fr]"
              >
                <div className="border-b border-white/10 bg-orange-400 px-5 py-5 text-black md:border-b-0 md:border-r md:border-white/10">
                  <p className="text-xs font-black uppercase tracking-[0.18em]">
                    On Air
                  </p>
                  <h2 className="mt-1 text-2xl font-black">{day}</h2>
                </div>

                <div>
                  {dayShows.map((show) => (
                    <article
                      key={show.title}
                      className="grid gap-4 border-b border-white/10 px-5 py-5 last:border-b-0 md:grid-cols-[7rem_1fr] md:items-center"
                    >
                      <div className="flex items-center gap-4 md:block">
                        <img
                          src={getShowArtwork(show)}
                          alt=""
                          className="aspect-square w-24 rounded-lg border border-white/10 bg-black object-cover md:w-28"
                        />

                        <div className="mt-0 text-sm font-black uppercase tracking-[0.14em] text-orange-300 md:mt-3">
                          {show.time}
                        </div>
                      </div>

                      <div className="grid min-w-0 gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div className="min-w-0">
                          <h3 className="text-2xl font-black leading-tight text-white">
                            {show.title}
                          </h3>
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
                            {show.description}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {show.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white/70"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {getSpotifyOpenUrl(show.title) ? (
                          <a
                            href={getSpotifyOpenUrl(show.title) || undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex justify-center rounded-lg bg-orange-400 px-5 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-orange-300 lg:min-w-[13rem]"
                          >
                            Open Spotify Playlist
                          </a>
                        ) : (
                          <span className="inline-flex justify-center rounded-lg border border-white/10 px-5 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-white/45 lg:min-w-[13rem]">
                            Playlist Coming Soon
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}

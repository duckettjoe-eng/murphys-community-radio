import Link from "next/link";
import LiveBroadcastButton from "@/app/components/LiveBroadcastButton";
import CurrentUnderwritersCarousel from "./components/CurrentUnderwritersCarousel";
import RadioPlayer from "./components/RadioPlayer";
import { localSchedule } from "@/app/lib/localSchedule";
import { getStationDateParts } from "@/app/lib/stationTime";
import { getSpotifyEmbedUrl, getSpotifyOpenUrl } from "@/app/lib/spotifyPlaylists";

export const dynamic = "force-dynamic";

const hostPortalUrl = "https://kmcr-host-portal.base44.app/";
const live365Url = process.env.NEXT_PUBLIC_LIVE365_PLAYER_URL;

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(time: string) {
  const [hourString, minuteString] = time.split(":");
  const hour = Number(hourString);
  const minute = Number(minuteString);

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  const displayMinute = minute === 0 ? "" : `:${minuteString}`;

  return `${displayHour}${displayMinute} ${suffix}`;
}

function getNextShows() {
  const { day: currentDay, minutes: currentMinutes } = getStationDateParts();

  return localSchedule
    .map((show) => {
      const startMinutes = toMinutes(show.start);
      let dayOffset = show.day - currentDay;

      if (dayOffset < 0) dayOffset += 7;

      let totalMinutes = dayOffset * 1440 + (startMinutes - currentMinutes);

      if (totalMinutes <= 0) {
        totalMinutes += 7 * 1440;
      }

      return {
        ...show,
        totalMinutes,
        airTime: `${dayNames[show.day]}, ${formatTime(show.start)}–${formatTime(
          show.end,
        )}`,
      };
    })
    .sort((a, b) => a.totalMinutes - b.totalMinutes)
    .slice(0, 3);
}

export default async function Home() {
  const nextShows = getNextShows();

  return (
    <main className="min-h-screen bg-black text-white">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-orange-400/20 px-6 pb-12 pt-8 sm:pb-16 sm:pt-10">
        <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="absolute bottom-[-160px] right-[-120px] h-96 w-96 rounded-full bg-yellow-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <nav className="mb-10 flex flex-wrap items-center justify-between gap-4 lg:mb-12">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.35em] text-orange-400">
                Murphys Community Radio
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.25em] text-zinc-500">
                Amplifying the voices of Calaveras County
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <LiveBroadcastButton />

              <Link
                href="/archive"
                className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800"
              >
                Archive
              </Link>

              <Link
                href="/shows"
                className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800"
              >
                Shows
              </Link>

              <Link
                href="/support"
                className="rounded-full bg-orange-400 px-5 py-3 text-sm font-bold text-black hover:bg-orange-300"
              >
                Support
              </Link>
            </div>
          </nav>

          <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(480px,0.9fr)] lg:items-center xl:gap-x-16">
            <div>
              <p className="mb-5 text-sm font-black uppercase tracking-[0.35em] text-orange-400">
                Local voices. Real signal. Community radio.
              </p>

              <h1 className="max-w-4xl text-5xl font-black leading-none tracking-tight sm:text-6xl md:text-7xl xl:text-8xl">
                Murphys Community Radio
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300 sm:text-xl">
                A community-built radio platform for local music, DJs,
                storytellers, artists, events, and Calaveras County culture.
              </p>
            </div>

            <div className="flex min-w-0 flex-col items-center">
              <img
                src="/logos/murphys-radio-logo-color.png"
                alt="Murphys Community Radio"
                className="w-[280px] max-w-full drop-shadow-[0_24px_65px_rgba(0,0,0,0.9)] sm:w-[360px] lg:w-[420px]"
              />

              <RadioPlayer embedUrl={live365Url} />
            </div>
          </div>
        </div>
      </section>

      <section
        id="underwriters"
        aria-label="Current underwriters"
        className="border-b border-white/10 bg-[#070707] px-6 py-10 sm:py-12"
      >
        <div className="mx-auto max-w-7xl">
          <CurrentUnderwritersCarousel />
        </div>
      </section>

      {/* SUPPORT */}
      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2">
          <div className="rounded-3xl bg-orange-400 p-10 text-black">
            <p className="text-sm font-black uppercase tracking-[0.25em]">
              Support the Signal
            </p>

            <h2 className="mt-4 text-4xl font-black">
              Help build the station.
            </h2>

            <p className="mt-4 leading-7 text-black/75">
              Donations help fund streaming, equipment, licensing, launch costs,
              and local programming.
            </p>

            <Link
              href="/support"
              className="mt-8 inline-block rounded-full bg-black px-7 py-4 font-black text-white"
            >
              Donate
            </Link>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-10">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-orange-400">
              Business Support
            </p>

            <h2 className="mt-4 text-4xl font-black">
              Underwrite local radio.
            </h2>

            <p className="mt-4 leading-7 text-zinc-300">
              Put your business alongside local music, culture, events, and
              community voices.
            </p>

            <Link
              href="/underwrite"
              className="mt-8 inline-block rounded-full bg-orange-400 px-7 py-4 font-black text-black"
            >
              Become an Underwriter
            </Link>
          </div>
        </div>
      </section>

      {/* PROGRAMMING */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 border-b border-zinc-800 pb-12">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">
              Explore the Station
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Link
                href="/archive"
                className="rounded-full bg-orange-400 px-6 py-3 text-center text-sm font-black text-black hover:bg-orange-300 sm:py-4 sm:text-base"
              >
                Listen to the Archive
              </Link>

              <a
                href={hostPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-orange-400 px-6 py-3 text-center text-sm font-black text-orange-300 hover:bg-orange-400 hover:text-black sm:py-4 sm:text-base"
              >
                Submit a Show
              </a>

              <Link
                href="/underwrite"
                className="rounded-full border border-zinc-700 px-6 py-3 text-center text-sm font-black text-white hover:bg-zinc-900 sm:py-4 sm:text-base"
              >
                Become a Sponsor
              </Link>
            </div>
          </div>

          <p className="text-sm font-black uppercase tracking-[0.35em] text-orange-400">
            Programming
          </p>

          <h2 className="mt-4 text-5xl font-black">Up Next</h2>

          <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
            The next three scheduled Skull County Radio shows, with companion
            Spotify playlists when they are available.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {nextShows.map((show, index) => {
              const spotifyEmbedUrl = getSpotifyEmbedUrl(show.name);
              const spotifyOpenUrl = getSpotifyOpenUrl(show.name);

              return (
                <div
                  key={`${show.name}-${show.day}-${show.start}`}
                  className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
                >
                  <p className="inline-flex rounded-full bg-orange-400 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-black">
                    {index === 0 ? "Next Up" : "Upcoming"}
                  </p>

                  <h3 className="mt-5 text-2xl font-black">{show.name}</h3>

                  <p className="mt-2 text-sm font-bold text-orange-300">
                    {show.airTime}
                  </p>

                  <p className="mt-2 text-sm text-zinc-500">{show.host}</p>

                  {show.description && (
                    <p className="mt-4 text-sm leading-6 text-zinc-400">
                      {show.description}
                    </p>
                  )}

                  {spotifyEmbedUrl && spotifyOpenUrl ? (
                    <>
                      <a
                        href={spotifyOpenUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 block w-full rounded-full bg-orange-400 px-5 py-3 text-center text-sm font-black text-black hover:bg-orange-300"
                      >
                        Open in Spotify
                      </a>

                      <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-800 bg-black">
                        <iframe
                          title={`${show.name} Spotify playlist`}
                          src={spotifyEmbedUrl}
                          width="100%"
                          height="152"
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy"
                          className="block rounded-2xl"
                        />
                      </div>
                    </>
                  ) : (
                    <p className="mt-5 rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-sm font-bold text-zinc-500">
                      Spotify playlist coming soon.
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8">
            <Link
              href="/shows"
              className="inline-block rounded-full border border-orange-400 px-7 py-4 font-black text-orange-300 hover:bg-orange-400 hover:text-black"
            >
              View All Shows
            </Link>
          </div>
        </div>
      </section>

      {/* SUBMIT */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-orange-400">
            Skull County Radio
          </p>

          <h2 className="mt-4 text-5xl font-black">
            Got a show, mix, story, or idea?
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-zinc-300">
            Use the host portal to submit show ideas, episodes, links, and
            programming concepts.
          </p>

          <a
            href={hostPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block rounded-full bg-orange-400 px-8 py-4 font-black text-black hover:bg-orange-300"
          >
            Open Host Portal
          </a>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import LiveBroadcastButton from "@/app/components/LiveBroadcastButton";
import RadioPlayer from "./components/RadioPlayer";
import { getLiveOverrideShow } from "@/app/lib/liveOverride";
import { localSchedule } from "@/app/lib/localSchedule";
import {
  getManualLiveStatus,
  manualStatusToShow,
} from "@/app/lib/manualLiveStatus";
import { getStationDateParts } from "@/app/lib/stationTime";

export const dynamic = "force-dynamic";

const hostPortalUrl = "https://kmcr-host-portal.base44.app/";

// Add future community backers here when they are ready to publish.
const underwriters: string[] = [];

const spotifyMap: Record<string, string> = {
  "Golden Hour Groove":
    "https://open.spotify.com/embed/playlist/6MmSFo11AbLLGuXx8iUQI8",
  "Dusty Crate Hip-Hop Hour":
    "https://open.spotify.com/embed/playlist/31SuOU4Vbv7xjdtYlW4PE1",
  "Cali Sun Reggae Ride":
    "https://open.spotify.com/embed/playlist/0mf1PWxgjPUG8abErI67tC",
  "Alt-Rock Barroom Radio":
    "https://open.spotify.com/embed/playlist/4LCviG4Etf6sfoQNNWbRfs",
  "Weird Late-Night FM":
    "https://open.spotify.com/embed/playlist/5bChhr0FAb32b2oevGyUAv",
  "House Party Frequency":
    "https://open.spotify.com/embed/playlist/24x2HGar6r7xStbu7VktN4",
  "Lowrider Soul Sunday":
    "https://open.spotify.com/embed/playlist/5mkOQT5zf6vag2lAzjgPEp",
  "Campfire Americana":
    "https://open.spotify.com/embed/playlist/27dShIERXqZ5HZG3gVIuRX",
  "Mashup Crate Hour":
    "https://open.spotify.com/embed/playlist/5wIMxNuCrHLXbGcnN6e4eb",
  "Skull County Garage Gospel":
    "https://open.spotify.com/embed/playlist/5ciTziF2CsE7ifteDHg0FW",
};

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

function isCurrentShow(show: (typeof localSchedule)[number]) {
  const { day: currentDay, minutes: currentMinutes } = getStationDateParts();

  if (show.day !== currentDay) return false;

  const start = toMinutes(show.start);
  const end = toMinutes(show.end);
  const isFullDay = show.start === "00:00" && show.end === "23:59";

  return (
    currentMinutes >= start &&
    (isFullDay ? currentMinutes <= end : currentMinutes < end)
  );
}

async function getCurrentScheduledShow() {
  const manualLiveStatus = await getManualLiveStatus();

  return (
    manualStatusToShow(manualLiveStatus) ||
    getLiveOverrideShow() ||
    localSchedule.find(isCurrentShow) ||
    null
  );
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
  const currentScheduledShow = await getCurrentScheduledShow();
  const nextShows = getNextShows();

  return (
    <main className="min-h-screen bg-black pb-28 text-white">
      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-20">
        <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="absolute bottom-[-160px] right-[-120px] h-96 w-96 rounded-full bg-yellow-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <nav className="mb-16 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.35em] text-orange-400">
                Murphys Community Radio
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.25em] text-zinc-500">
                Amplifying the voices of Calaveras County
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <LiveBroadcastButton
                initialIsLive={Boolean(currentScheduledShow)}
              />

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

          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <p className="mb-5 text-sm font-black uppercase tracking-[0.35em] text-orange-400">
                Local voices. Real signal. Community radio.
              </p>

              <h1 className="max-w-4xl text-6xl font-black leading-none tracking-tight md:text-8xl">
                Murphys Community Radio
              </h1>

              <p className="mt-8 max-w-2xl text-xl leading-8 text-zinc-300">
                A community-built radio platform for local music, DJs,
                storytellers, artists, events, and Calaveras County culture.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/archive"
                  className="rounded-full bg-orange-400 px-7 py-4 font-black text-black hover:bg-orange-300"
                >
                  Listen to the Archive
                </Link>

                <a
                  href={hostPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-orange-400 px-7 py-4 font-black text-orange-300 hover:bg-orange-400 hover:text-black"
                >
                  Submit a Show
                </a>

                <Link
                  href="/underwrite"
                  className="rounded-full border border-zinc-700 px-7 py-4 font-black text-white hover:bg-zinc-900"
                >
                  Become a Sponsor
                </Link>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <img
                src="/logos/murphys-radio-logo-color.png"
                alt="Murphys Community Radio"
                className="w-[300px] drop-shadow-[0_30px_80px_rgba(0,0,0,0.9)] md:w-[500px] lg:w-[620px] xl:w-[700px]"
              />
            </div>
          </div>
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
          <p className="text-sm font-black uppercase tracking-[0.35em] text-orange-400">
            Programming
          </p>

          <h2 className="mt-4 text-5xl font-black">Up Next</h2>

          <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
            The next three scheduled Skull County Radio shows, linked to their
            companion Spotify playlists.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {nextShows.map((show, index) => {
              const spotifyEmbedUrl = spotifyMap[show.name];
              const spotifyOpenUrl = spotifyEmbedUrl.replace("/embed", "");

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

      {/* UNDERWRITERS */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl rounded-3xl border border-zinc-800 bg-zinc-950 p-10">
          <h2 className="text-4xl font-black">Community Backers</h2>

          <p className="mt-6 text-zinc-300">Supporters coming soon.</p>

          {underwriters.length > 0 && (
            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {underwriters.map((name) => (
                <div
                  key={name}
                  className="rounded-2xl bg-black px-5 py-4 text-sm font-bold text-zinc-300"
                >
                  {name}
                </div>
              ))}
            </div>
          )}
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

      {currentScheduledShow ? <RadioPlayer /> : null}
    </main>
  );
}

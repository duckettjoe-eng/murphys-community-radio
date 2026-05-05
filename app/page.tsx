import Link from "next/link";
import RadioPlayer from "./components/RadioPlayer";
import { localSchedule } from "@/app/lib/localSchedule";

export const dynamic = "force-dynamic";

const hostPortalUrl = "https://kmcr-host-portal.base44.app/";

const underwriters = [
  "Pure Aloha Dispensary",
  "Murphys Irish Pub",
  "Murphys Magical Emporium",
  "Ironstone Vineyards",
  "Murphys Hotel",
  "Alchemy Café",
];

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
  "Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"
];

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}${m ? `:${m}` : ""} ${suffix}`;
}

function getNextShows() {
  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return localSchedule
    .map((show) => {
      const startMinutes = toMinutes(show.start);
      let dayOffset = show.day - currentDay;
      if (dayOffset < 0) dayOffset += 7;

      let totalMinutes = dayOffset * 1440 + (startMinutes - currentMinutes);
      if (totalMinutes <= 0) totalMinutes += 7 * 1440;

      return {
        ...show,
        totalMinutes,
        airTime: `${dayNames[show.day]}, ${formatTime(show.start)}–${formatTime(show.end)}`,
      };
    })
    .sort((a, b) => a.totalMinutes - b.totalMinutes)
    .slice(0, 3);
}

export default function Home() {
  const nextShows = getNextShows();

  return (
    <main className="min-h-screen bg-black pb-28 text-white">

      {/* HERO */}
      <section className="px-6 py-20 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-orange-400">
          Murphys Community Radio
        </p>
        <h1 className="mt-4 text-6xl font-black md:text-8xl">
          Skull County Radio
        </h1>
        <p className="mt-6 text-xl text-zinc-400">
          Local voices. Real signal. Community radio.
        </p>
      </section>

      {/* PROGRAMMING */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-orange-400">
            Programming
          </p>

          <h2 className="mt-4 text-5xl font-black">Up Next</h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {nextShows.map((show, index) => {
              const embed = spotifyMap[show.name];
              const link = embed.replace("/embed", "");

              return (
                <div
                  key={show.name}
                  className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
                >
                  <p className="inline-flex rounded-full bg-orange-400 px-3 py-1 text-xs font-black text-black">
                    {index === 0 ? "Next Up" : "Upcoming"}
                  </p>

                  <h3 className="mt-4 text-2xl font-black">{show.name}</h3>

                  <p className="mt-2 text-sm text-orange-300">
                    {show.airTime}
                  </p>

                  {/* MOBILE + DESKTOP SAFE */}
                  <div className="mt-5">
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-4 block w-full rounded-full bg-orange-400 px-5 py-3 text-center text-sm font-black text-black"
                    >
                      Open in Spotify
                    </a>

                    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-black">
                      <iframe
                        title={show.name}
                        src={embed}
                        width="100%"
                        height="152"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <RadioPlayer />
    </main>
  );
}
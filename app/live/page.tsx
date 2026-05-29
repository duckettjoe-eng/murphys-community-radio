import Link from "next/link";
import { localSchedule, type Show } from "@/app/lib/localSchedule";
import { getStationDateParts } from "@/app/lib/stationTime";

export const dynamic = "force-dynamic";

const mixcloudLiveUrl = "https://www.mixcloud.com/live/skullcountyradio/";
const skullCountyHost = "DJ Hello Joey";

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

function timeToMinutes(time: string) {
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

function isCurrentShow(show: Show, currentDay: number, currentMinutes: number) {
  if (show.day !== currentDay) return false;

  const start = timeToMinutes(show.start);
  const end = timeToMinutes(show.end);
  const isFullDay = show.start === "00:00" && show.end === "23:59";

  return (
    currentMinutes >= start &&
    (isFullDay ? currentMinutes <= end : currentMinutes < end)
  );
}

function getCurrentShow() {
  const { day: currentDay, minutes: currentMinutes } = getStationDateParts();
  const show = localSchedule.find((item) =>
    isCurrentShow(item, currentDay, currentMinutes),
  );

  if (!show) {
    return {
      name: "Skull County Radio",
      host: skullCountyHost,
      time: "Programming from Murphys, California",
      spotifyEmbedUrl: null,
      spotifyUrl: null,
    };
  }

  const spotifyEmbedUrl = spotifyMap[show.name] || null;

  return {
    name: show.name,
    host: skullCountyHost,
    time: `${dayNames[show.day]}, ${formatTime(show.start)}-${formatTime(
      show.end,
    )}`,
    spotifyEmbedUrl,
    spotifyUrl: spotifyEmbedUrl?.replace("/embed", "") || null,
  };
}

function getUpcomingShows() {
  const { day: currentDay, minutes: currentMinutes } = getStationDateParts();

  return localSchedule
    .map((show) => {
      const startMinutes = timeToMinutes(show.start);
      let dayOffset = show.day - currentDay;

      if (dayOffset < 0) dayOffset += 7;

      let totalMinutes = dayOffset * 1440 + (startMinutes - currentMinutes);

      if (totalMinutes <= 0) {
        totalMinutes += 7 * 1440;
      }

      return {
        ...show,
        totalMinutes,
        time: `${dayNames[show.day]}, ${formatTime(show.start)}-${formatTime(
          show.end,
        )}`,
        spotifyEmbedUrl: spotifyMap[show.name] || null,
        spotifyUrl: spotifyMap[show.name]?.replace("/embed", "") || null,
      };
    })
    .sort((a, b) => a.totalMinutes - b.totalMinutes)
    .slice(0, 4);
}

export default function LivePage() {
  const currentShow = getCurrentShow();
  const upcomingShows = getUpcomingShows();
  const nextPlaylistShow = upcomingShows.find((show) => spotifyMap[show.name]);
  const fallbackSpotifyEmbedUrl = nextPlaylistShow
    ? spotifyMap[nextPlaylistShow.name]
    : null;
  const playlistShow = currentShow.spotifyEmbedUrl
    ? currentShow
    : {
        name: nextPlaylistShow?.name || currentShow.name,
        time: nextPlaylistShow?.time || currentShow.time,
        spotifyEmbedUrl: fallbackSpotifyEmbedUrl,
        spotifyUrl: fallbackSpotifyEmbedUrl?.replace("/embed", "") || null,
      };

  return (
    <main className="min-h-screen overflow-hidden bg-[#050806] pb-24 text-[#f8efd8]">
      <section className="relative border-b border-[#d6a847]/20 bg-[radial-gradient(circle_at_top_left,rgba(214,168,71,0.18),transparent_34%),linear-gradient(135deg,#07120c_0%,#050806_48%,#0f1410_100%)] px-6">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#d6a847] to-transparent opacity-70" />

        <div className="relative mx-auto max-w-7xl py-8">
          <nav className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="group">
              <p className="text-sm font-bold uppercase tracking-[0.35em] text-[#d6a847] transition group-hover:text-[#f3c866]">
                Murphys Community Radio
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.25em] text-[#f8efd8]/50">
                Live from the foothills
              </p>
            </Link>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-full bg-[#f8efd8]/10 px-5 py-3 text-sm font-bold text-[#f8efd8] ring-1 ring-[#f8efd8]/10 hover:bg-[#f8efd8]/15"
              >
                Home
              </Link>
              <Link
                href="/shows"
                className="rounded-full bg-[#f8efd8]/10 px-5 py-3 text-sm font-bold text-[#f8efd8] ring-1 ring-[#f8efd8]/10 hover:bg-[#f8efd8]/15"
              >
                Shows
              </Link>
              <Link
                href="/archive"
                className="rounded-full bg-[#f8efd8]/10 px-5 py-3 text-sm font-bold text-[#f8efd8] ring-1 ring-[#f8efd8]/10 hover:bg-[#f8efd8]/15"
              >
                Archive
              </Link>
              <Link
                href="/support"
                className="rounded-full bg-[#d6a847] px-5 py-3 text-sm font-black text-[#080a07] hover:bg-[#f3c866]"
              >
                Support
              </Link>
            </div>
          </nav>

          <div className="grid gap-10 py-16 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.38em] text-[#d6a847]">
                Skull County Radio
              </p>

              <h1 className="mt-5 max-w-4xl text-5xl font-black leading-none tracking-tight text-[#fff8e8] md:text-7xl">
                Live Broadcast
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#f8efd8]/72 md:text-xl">
                Streaming live from Murphys, California, with DJ Hello Joey.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={mixcloudLiveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[#d6a847] px-7 py-4 font-black text-[#080a07] shadow-[0_18px_45px_rgba(214,168,71,0.22)] hover:bg-[#f3c866]"
                >
                  Open Mixcloud Live
                </a>
                <Link
                  href="/shows"
                  className="rounded-full border border-[#d6a847]/45 px-7 py-4 font-black text-[#f3c866] hover:bg-[#d6a847] hover:text-[#080a07]"
                >
                  View Shows
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-[#d6a847]/30 bg-[#f8efd8] p-5 text-[#152017] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[#7b5c18]">
                  Current Signal
                </p>
                <span className="rounded-full bg-[#102016] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#f3c866]">
                  Live
                </span>
              </div>

              <h2 className="mt-4 text-2xl font-black leading-tight">
                {currentShow.name}
              </h2>
              <p className="mt-2 text-sm font-bold text-[#5e4a24]">
                {currentShow.host}
              </p>
              <p className="mt-4 border-t border-[#152017]/10 pt-4 text-sm leading-6 text-[#152017]/72">
                {currentShow.time}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-start gap-8 px-6 py-12 xl:grid-cols-[360px_minmax(0,1fr)_360px]">
        <div className="order-1 overflow-hidden rounded-2xl border border-[#d6a847]/25 bg-black shadow-[0_28px_90px_rgba(0,0,0,0.42)] xl:order-2">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d6a847]/20 bg-[#0b120d] px-5 py-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d6a847]">
                Now Playing / Current Show
              </p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-[#fff8e8]">
                {currentShow.name}
              </h2>
              <p className="mt-1 text-sm font-bold text-[#f8efd8]/55">
                Hosted by {currentShow.host} · {currentShow.time}
              </p>
            </div>
          </div>

          <div className="grid place-items-center bg-[radial-gradient(circle_at_center,rgba(214,168,71,0.16),transparent_34%),linear-gradient(135deg,#050806,#0b120d)] p-5 md:p-6">
            <div className="w-full max-w-xl rounded-2xl border border-[#d6a847]/30 bg-[#f8efd8] p-8 text-center text-[#152017] shadow-[0_30px_90px_rgba(0,0,0,0.36)]">
              <img
                src="/logos/skull-county-radio-logo.png"
                alt="Skull County Radio"
                className="mx-auto w-40 md:w-52"
              />

              <p className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-[#7b5c18]">
                Live on Mixcloud
              </p>
              <h2 className="mt-3 text-4xl font-black leading-tight">
                DJ Hello Joey
              </h2>

              <a
                href={mixcloudLiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex rounded-full bg-[#d6a847] px-8 py-4 font-black text-[#080a07] shadow-[0_18px_45px_rgba(122,89,18,0.22)] hover:bg-[#f3c866]"
              >
                Open Live Stream
              </a>

              <p className="mt-5 text-sm font-black uppercase tracking-[0.2em] text-[#152017]/50">
                Join the broadcast
              </p>
            </div>
          </div>

          <div className="border-t border-[#d6a847]/20 bg-[#0b120d] px-5 py-4">
            <p className="text-sm leading-6 text-[#f8efd8]/64">
              Murphys Community Radio 2026.
            </p>
          </div>
        </div>

        <aside className="contents">
          <section className="order-2 rounded-2xl border border-[#d6a847]/25 bg-[#0b120d] p-6 text-[#f8efd8] xl:order-1">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d6a847]">
              Broadcast Playlist
            </p>
            <h2 className="mt-4 text-2xl font-black leading-tight">
              {playlistShow.name}
            </h2>
            <p className="mt-2 text-sm font-bold text-[#f8efd8]/55">
              {playlistShow.time}
            </p>
            <p className="mt-5 text-sm leading-6 text-[#f8efd8]/62">
              The weekly Spotify playlist DJ Hello Joey works from for this
              broadcast block.
            </p>

            <div className="mt-6 overflow-hidden rounded-xl border border-[#d6a847]/20 bg-black/35">
              {playlistShow.spotifyEmbedUrl ? (
                <>
                  <iframe
                    title={`${playlistShow.name} Spotify playlist`}
                    src={playlistShow.spotifyEmbedUrl}
                    className="h-[352px] w-full border-0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                  <div className="border-t border-[#d6a847]/15 px-4 py-3">
                    <a
                      href={playlistShow.spotifyUrl || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-black text-[#f3c866] hover:text-[#fff8e8]"
                    >
                      Open playlist on Spotify
                    </a>
                  </div>
                </>
              ) : (
                <div className="px-4 py-5">
                  <p className="text-sm leading-6 text-[#f8efd8]/60">
                    The matching weekly Spotify playlist will appear here once a
                    scheduled broadcast playlist is configured.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="order-3 rounded-2xl border border-dashed border-[#d6a847]/35 bg-[#0b120d]/70 p-6 text-[#f8efd8]">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d6a847]">
              Upcoming Shows
            </p>
            <h2 className="mt-4 text-2xl font-black">
              Next on Skull County Radio
            </h2>
            <div className="mt-5 grid gap-3">
              {upcomingShows.map((show) => {
                const cardContent = (
                  <>
                    <p className="text-sm font-black text-[#fff8e8]">
                      {show.name}
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#d6a847]">
                      {show.time}
                    </p>
                    <p className="mt-2 text-sm text-[#f8efd8]/52">
                      Playlist-driven broadcast block, refreshed weekly.
                    </p>
                    <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-[#f3c866]">
                      {show.spotifyUrl ? "Open playlist" : "Playlist coming soon"}
                    </p>
                  </>
                );

                return show.spotifyUrl ? (
                  <a
                    key={`${show.day}-${show.start}-${show.name}`}
                    href={show.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl border border-[#f8efd8]/10 bg-black/35 p-4 transition hover:border-[#d6a847]/50 hover:bg-black/55"
                  >
                    {cardContent}
                  </a>
                ) : (
                  <div
                    key={`${show.day}-${show.start}-${show.name}`}
                    className="rounded-xl border border-[#f8efd8]/10 bg-black/35 p-4"
                  >
                    {cardContent}
                  </div>
                );
              })}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

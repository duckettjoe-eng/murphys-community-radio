import Link from "next/link";
import { localSchedule, type Show } from "@/app/lib/localSchedule";

export const dynamic = "force-dynamic";

const mixcloudLiveUrl = "https://www.mixcloud.com/live/djhellojoey/";
const mixcloudEmbedUrl =
  "https://www.mixcloud.com/widget/iframe/?hide_cover=1&light=0&feed=%2Flive%2Fdjhellojoey%2F";

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
  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const show = localSchedule.find((item) =>
    isCurrentShow(item, currentDay, currentMinutes),
  );

  if (!show) {
    return {
      name: "Skull County Radio",
      host: "Live Broadcast",
      time: "Programming from Murphys, California",
    };
  }

  return {
    name: show.name,
    host: show.host,
    time: `${dayNames[show.day]}, ${formatTime(show.start)}-${formatTime(
      show.end,
    )}`,
  };
}

export default function LivePage() {
  const currentShow = getCurrentShow();

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
                Streaming live from Murphys, California.
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

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-2xl border border-[#d6a847]/25 bg-black shadow-[0_28px_90px_rgba(0,0,0,0.42)]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d6a847]/20 bg-[#0b120d] px-5 py-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d6a847]">
                Mixcloud Live
              </p>
              <p className="mt-1 text-sm text-[#f8efd8]/55">
                OBS to Mixcloud, embedded here for the station site.
              </p>
            </div>
            <a
              href={mixcloudLiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-[#d6a847]/50 px-5 py-3 text-sm font-black text-[#f3c866] hover:bg-[#d6a847] hover:text-[#080a07]"
            >
              Open Directly
            </a>
          </div>

          <div className="relative min-h-[520px] bg-[#050806] md:min-h-[620px]">
            <iframe
              title="Skull County Radio live stream on Mixcloud"
              src={mixcloudEmbedUrl}
              className="absolute inset-0 h-full w-full border-0"
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            />
          </div>

          <div className="border-t border-[#d6a847]/20 bg-[#0b120d] px-5 py-4">
            <p className="text-sm leading-6 text-[#f8efd8]/64">
              If the embedded player is unavailable, use the direct Mixcloud
              link above to join the live broadcast.
            </p>
          </div>
        </div>

        <aside className="grid content-start gap-8">
          <section className="rounded-2xl border border-[#d6a847]/25 bg-[#f8efd8] p-6 text-[#152017] shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#7b5c18]">
              Now Playing / Current Show
            </p>
            <h2 className="mt-4 text-2xl font-black leading-tight">
              {currentShow.name}
            </h2>
            <p className="mt-2 text-sm font-bold text-[#5e4a24]">
              Hosted by {currentShow.host}
            </p>
            <p className="mt-5 rounded-xl bg-[#152017]/8 px-4 py-3 text-sm font-bold text-[#152017]/72">
              {currentShow.time}
            </p>
          </section>

          <section className="rounded-2xl border border-[#d6a847]/25 bg-[#0b120d] p-6 text-[#f8efd8]">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d6a847]">
              Broadcast Setup
            </p>
            <h2 className="mt-4 text-2xl font-black leading-tight">
              OBS → Mixcloud → MurphysCommunityRadio.com
            </h2>
            <div className="mt-5 grid gap-3 text-sm font-bold">
              {["OBS", "Mixcloud", "MurphysCommunityRadio.com"].map(
                (step, index) => (
                  <div
                    key={step}
                    className="flex items-center gap-3 rounded-xl border border-[#d6a847]/15 bg-[#f8efd8]/6 px-4 py-3"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d6a847] text-xs font-black text-[#080a07]">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ),
              )}
            </div>
            <p className="mt-5 text-sm leading-6 text-[#f8efd8]/62">
              The live booth sends the program mix from OBS into Mixcloud, then
              MurphysCommunityRadio.com carries the public-facing stream window
              for listeners.
            </p>
          </section>

          <section className="rounded-2xl border border-dashed border-[#d6a847]/35 bg-[#0b120d]/70 p-6 text-[#f8efd8]">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d6a847]">
              Coming Soon
            </p>
            <h2 className="mt-4 text-2xl font-black">Live chat & show notes</h2>
            <div className="mt-5 min-h-40 rounded-xl border border-[#f8efd8]/10 bg-black/35 p-4">
              <p className="text-sm leading-6 text-[#f8efd8]/52">
                Space reserved for live chat, set notes, links, call-in prompts,
                and guest details during future broadcasts.
              </p>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

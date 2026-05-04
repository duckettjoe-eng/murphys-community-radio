import Link from "next/link";
import RadioPlayer from "./components/RadioPlayer";

const hostPortalUrl = "https://kmcr-host-portal.base44.app/";

const underwriters = [
  "Pure Aloha Dispensary",
  "Murphys Irish Pub",
  "Murphys Magical Emporium",
  "Ironstone Vineyards",
  "Murphys Hotel",
  "Alchemy Café",
];

const shows = [
  {
    title: "Live From the Big Bush",
    tag: "Founding show prospect",
    desc: "Local music, conversation, and foothill storytelling from the people who live it.",
  },
  {
    title: "Skull County Radio Hour",
    tag: "In development",
    desc: "Roots, odd histories, culture, DJs, and sounds from the deeper Calaveras current.",
  },
];

export default function Home() {
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
              <Link href="/archive" className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800">
                Archive
              </Link>

              <Link href="/support" className="rounded-full bg-orange-400 px-5 py-3 text-sm font-bold text-black hover:bg-orange-300">
                Support
              </Link>
            </div>
          </nav>

          <div className="grid gap-12 lg:grid-cols-[1fr_0.85fr] lg:items-center">
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
                <Link href="/archive" className="rounded-full bg-orange-400 px-7 py-4 font-black text-black hover:bg-orange-300">
                  Listen to the Archive
                </Link>

                <a href={hostPortalUrl} target="_blank" className="rounded-full border border-orange-400 px-7 py-4 font-black text-orange-300 hover:bg-orange-400 hover:text-black">
                  Submit a Show
                </a>

                <Link href="/underwrite" className="rounded-full border border-zinc-700 px-7 py-4 font-black text-white hover:bg-zinc-900">
                  Become a Sponsor
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
              <img
                src="/logos/murphys-radio-logo-color.png"
                alt="Murphys Community Radio"
                className="mx-auto w-full max-w-md"
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

            <Link href="/support" className="mt-8 inline-block rounded-full bg-black px-7 py-4 font-black text-white">
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

            <Link href="/underwrite" className="mt-8 inline-block rounded-full bg-orange-400 px-7 py-4 font-black text-black">
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

          <h2 className="mt-4 text-5xl font-black">Shows in motion</h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {shows.map((show) => (
              <div key={show.title} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
                <p className="text-xs font-black uppercase tracking-widest text-orange-400">
                  {show.tag}
                </p>

                <h3 className="mt-4 text-3xl font-black">{show.title}</h3>

                <p className="mt-4 leading-7 text-zinc-300">{show.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UNDERWRITERS (TEXT VERSION) */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl rounded-3xl border border-zinc-800 bg-zinc-950 p-10">

          <p className="text-sm font-black uppercase tracking-[0.35em] text-orange-400">
            Community Partners & Supporters
          </p>

          <h2 className="mt-4 text-4xl font-black">
            Early community backers
          </h2>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {underwriters.map((name) => (
              <div key={name} className="rounded-2xl bg-black px-5 py-4 text-sm font-bold text-zinc-300">
                {name}
              </div>
            ))}
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
            className="mt-8 inline-block rounded-full bg-orange-400 px-8 py-4 font-black text-black hover:bg-orange-300"
          >
            Open Host Portal
          </a>
        </div>
      </section>

      <RadioPlayer />
    </main>
  );
}
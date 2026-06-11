import Link from "next/link";
import LiveBroadcastButton from "@/app/components/LiveBroadcastButton";

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-20 text-white">
      {/* NAV */}
      <nav className="mx-auto mb-12 flex max-w-7xl flex-wrap items-center justify-between gap-4">
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
            href="/shows"
            className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800"
          >
            Shows
          </Link>

          <Link
            href="/underwrite"
            className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800"
          >
            Underwrite
          </Link>
        </div>
      </nav>

      {/* LOGO */}
      <div className="mb-10 text-center">
        <img
          src="/logos/murphys-radio-logo-color.png"
          alt="Murphys Community Radio"
          className="mx-auto w-52 md:w-72 drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
        />
      </div>

      {/* HERO */}
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="text-5xl font-black md:text-7xl">
          Support Murphys Community Radio
        </h1>

        <p className="mx-auto mt-6 max-w-3xl text-xl leading-8 text-zinc-300">
          Independent, local, DJ-powered radio for Calaveras County. Your
          support helps keep the stream running, the shows growing, and local
          voices on the air.
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-6xl gap-8 md:grid-cols-2">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 sm:p-10">
          <h2 className="text-3xl font-black">Listener Support</h2>
          <p className="mt-4 leading-7 text-zinc-300">
            Soon you’ll be able to make a one-time contribution or become a
            recurring listener supporter. These contributions will help cover
            streaming, licensing, equipment, and community programming costs.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="https://buy.stripe.com/28E14p6GQekA1iG9E81gs0a"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full bg-orange-400 px-7 py-4 font-black text-black hover:bg-orange-300"
            >
              Contribute $10
            </a>
            <a
              href="https://buy.stripe.com/14A3cx5CM5O48L8bMg1gs0b"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full border border-orange-400 px-7 py-4 font-black text-orange-300 hover:bg-orange-400 hover:text-black"
            >
              Contribute $5
            </a>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 sm:p-10">
          <h2 className="text-3xl font-black">MCR Merch</h2>
          <p className="mt-4 leading-7 text-zinc-300">
            We’re working on MCR shirts, stickers, mugs, and other station
            merch. Proceeds will help support the station and spread the word
            around Calaveras County.
          </p>
          <a
            href="#merch-placeholder"
            className="mt-8 inline-flex rounded-full bg-orange-400 px-7 py-4 font-black text-black hover:bg-orange-300"
          >
            Merch Coming Soon
          </a>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 sm:p-10">
          <h2 className="text-3xl font-black">Business Underwriting</h2>
          <p className="mt-4 leading-7 text-zinc-300">
            Local businesses can support MCR through underwriting. Underwriters
            help fund community radio while receiving recognition on the
            station website and, where appropriate, on-air mentions.
          </p>
          <Link
            href="/#underwriters"
            className="mt-8 inline-flex rounded-full bg-orange-400 px-7 py-4 font-black text-black hover:bg-orange-300"
          >
            View Underwriters / Sponsor MCR
          </Link>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 sm:p-10">
          <h2 className="text-3xl font-black">Where Your Support Goes</h2>
          <ul className="mt-6 list-disc space-y-3 pl-5 text-zinc-300 marker:text-orange-400">
            <li>Streaming and broadcast tools</li>
            <li>Music licensing and platform costs</li>
            <li>Audio equipment and production gear</li>
            <li>Local shows, DJs, and community programming</li>
            <li>Event coverage and future live broadcasts</li>
          </ul>
        </section>
      </div>
    </main>
  );
}

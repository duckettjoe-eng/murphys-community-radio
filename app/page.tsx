import Image from "next/image";
import RadioPlayer from "./components/RadioPlayer";
import Link from "next/link"; // ✅ ADDED

const underwriters = [
  "Pure Aloha Dispensary",
  "Murphys Irish Pub",
  "Murphys Magical Emporium",
  "Ironstone Vineyards",
  "Murphys Hotel",
  "Alchemy Café",
  "Brice Station Vineyards",
];

const submissionOptions = [
  "Submit a show",
  "Submit music",
  "Submit an event",
  "Become an underwriter",
  "Volunteer / board interest",
];

const shows = [
  {
    title: "Live From the Big Bush",
    status: "Founding show prospect",
    host: "Hosted by Ben G",
    description:
      "A local-forward hang with music, conversation, and the kind of foothill storytelling that sounds best when it is shared live.",
  },
  {
    title: "Skull County Radio Hour",
    status: "In development",
    host: "Skull County Radio",
    description:
      "A rotating hour for local culture, roots music, odd histories, and dispatches from the greater Calaveras creative scene.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-hunter-deep pb-28 text-cream">
      {/* HERO */}
      <section className="relative border-b border-gold/25 bg-[radial-gradient(circle_at_18%_18%,rgba(224,191,112,0.16),transparent_25rem),radial-gradient(circle_at_84%_20%,rgba(135,155,117,0.12),transparent_24rem),linear-gradient(145deg,#0c2f21_0%,#071d16_72%)]">
        <div className="absolute inset-0 opacity-[0.16] grain-overlay" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />

        <nav className="relative mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="font-display text-xl font-bold text-gold-light">
              Murphys Community Radio
            </p>
            <p className="text-xs uppercase tracking-[0.28em] text-cream/60">
              XTRA GOOD LABS
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a href="/archive" className="btn-secondary">
              Archive
            </a>
            <a href="#listen" className="btn-secondary">
              Listen Live
            </a>
          </div>
        </nav>

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pb-28 lg:pt-20">
          <div className="max-w-3xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.28em] text-gold-light">
              Skull County Radio
            </p>

            <h1 className="font-display text-6xl font-bold text-cream sm:text-7xl lg:text-8xl">
              Murphys Community Radio
            </h1>

            <p className="mt-6 text-xl text-parchment">
              Amplifying the voices of Calaveras County.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <a href="#listen" className="btn-primary">
                Listen Live
              </a>

              <a href="/archive" className="btn-secondary">
                Archive
              </a>

              {/* ✅ FIXED */}
              <Link href="/support" className="btn-secondary">
                Support
              </Link>

              <a href="#submissions" className="btn-secondary">
                Submit Music / Show
              </a>
            </div>
          </div>

          <div className="premium-card bg-cream/95 p-5 text-ink">
            <Image
              src="/images/mcr-logo.png"
              alt="Murphys Community Radio logo"
              width={520}
              height={520}
            />
          </div>
        </div>
      </section>

      {/* SUPPORT SECTION */}
      <section id="support" className="bg-parchment py-20 text-ink">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <h2 className="section-title text-hunter">
            Help launch the station.
          </h2>

          <p className="mt-4 text-lg text-ink/75 max-w-xl">
            Support Murphys Community Radio and help build the station.
          </p>

          <div className="mt-6 flex gap-4">
            {/* ✅ DONATE FIXED */}
            <Link href="/support" className="btn-primary">
              Donate
            </Link>

            {/* ✅ SPONSOR ADDED */}
            <Link href="/underwrite" className="btn-secondary">
              Become a Sponsor
            </Link>
          </div>
        </div>
      </section>

      <RadioPlayer />
    </main>
  );
}
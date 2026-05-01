import Image from "next/image";

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
    <main className="min-h-screen overflow-hidden bg-hunter-deep text-cream">
      <section className="relative border-b border-gold/25 bg-[radial-gradient(circle_at_18%_18%,rgba(224,191,112,0.16),transparent_25rem),radial-gradient(circle_at_84%_20%,rgba(135,155,117,0.12),transparent_24rem),linear-gradient(145deg,#0c2f21_0%,#071d16_72%)]">
        <div className="absolute inset-0 opacity-[0.16] grain-overlay" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />
        <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-8">
          <div>
            <p className="font-display text-xl font-bold text-gold-light">
              Murphys Community Radio
            </p>
            <p className="text-xs uppercase tracking-[0.28em] text-cream/60">
              XTRA GOOD LABS
            </p>
          </div>
          <a
            href="#listen"
            className="rounded-lg border border-gold/60 px-4 py-2 text-sm font-semibold text-gold-light transition duration-200 hover:bg-gold hover:text-hunter-deep"
          >
            Listen Live
          </a>
        </nav>

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pb-28 lg:pt-20">
          <div className="max-w-3xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.28em] text-gold-light">
              Skull County Radio
            </p>
            <h1 className="max-w-4xl font-display text-6xl font-bold leading-[0.94] text-cream sm:text-7xl lg:text-8xl">
              Murphys Community Radio
            </h1>
            <div className="mt-7 h-px w-32 bg-gradient-to-r from-gold via-gold-light to-transparent" />
            <p className="mt-7 max-w-2xl text-xl leading-8 text-parchment sm:text-2xl sm:leading-9">
              Amplifying the voices of Calaveras County.
            </p>
            <p className="mt-4 max-w-xl text-base leading-7 text-cream/70">
              Local music, civic conversation, foothill culture, and
              neighbor-made radio from Murphys.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a href="#listen" className="btn-primary">
                Listen Live
              </a>
              <a href="#support" className="btn-secondary">
                Support
              </a>
              <a href="#submissions" className="btn-secondary">
                Submit Music / Show
              </a>
            </div>
          </div>

          <div className="premium-card relative overflow-hidden bg-cream/95 p-5 text-ink paper-texture">
            <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-gold/10" />
            <div className="relative mx-auto w-full max-w-[420px]">
              <Image
                src="/images/mcr-logo.png"
                alt="Murphys Community Radio logo"
                width={520}
                height={520}
                priority
                className="h-auto w-full drop-shadow-2xl"
              />
            </div>
            <div className="relative mt-5 border-t border-hunter/15 pt-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-gold">
                Local Signal
              </p>
              <div className="mt-3 flex items-center gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg border border-gold/50 bg-hunter text-sm font-bold text-gold-light">
                  ON
                </div>
                <div>
                  <p className="font-display text-2xl font-bold leading-tight text-hunter">
                    Foothill voices, on the air.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="listen" className="bg-cream py-20 text-ink paper-texture">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="section-kicker">Listen Live</p>
            <h2 className="section-title text-hunter">Stream placeholder</h2>
            <p className="mt-4 max-w-xl text-lg leading-8 text-ink/70">
              Live stream coming soon. The first broadcast home for Murphys
              Community Radio is warming up.
            </p>
          </div>
          <div className="premium-card border-hunter/15 bg-white/55 p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-gold">
                  Now Playing
                </p>
                <p className="mt-2 font-display text-3xl text-hunter">
                  Programming test signal
                </p>
                <p className="mt-2 text-ink/65">
                  Artist, show, and episode metadata will appear here.
                </p>
              </div>
              <button className="rounded-lg bg-hunter px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-gold-light transition duration-200 hover:bg-hunter-deep">
                Coming Soon
              </button>
            </div>
            <div className="mt-7 h-3 overflow-hidden rounded-full bg-hunter/15">
              <div className="h-full w-1/3 rounded-full bg-gold" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-hunter py-20">
        <div className="absolute inset-0 opacity-[0.08] grain-overlay" />
        <div className="relative mx-auto max-w-7xl px-6 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_260px] lg:items-end">
            <div className="max-w-2xl">
              <p className="section-kicker">Shows</p>
              <h2 className="section-title">Skull County Radio programming</h2>
            </div>
            <div className="w-36 overflow-hidden rounded-lg border border-gold/30 bg-hunter-deep shadow-gold-soft sm:w-44 lg:ml-auto">
              <Image
                src="/images/scr-logo.png"
                alt="Skull County Radio logo"
                width={260}
                height={260}
                className="h-auto w-full"
              />
            </div>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {shows.map((show) => (
              <article
                key={show.title}
                className="premium-card group border-gold/25 bg-cream p-6 text-ink paper-texture hover:-translate-y-1 hover:border-gold/60 hover:shadow-gold-soft"
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
                      {show.status}
                    </p>
                    <h3 className="mt-4 font-display text-3xl font-bold leading-tight text-hunter">
                      {show.title}
                    </h3>
                  </div>
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md border border-gold/30 bg-hunter-deep">
                    <Image
                      src="/images/scr-logo.png"
                      alt="Skull County Radio logo"
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
                <p className="mt-2 font-semibold text-ink/80">{show.host}</p>
                <p className="mt-4 leading-7 text-ink/70">{show.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-hunter-deep py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="section-kicker">Launch Deck</p>
            <h2 className="section-title">A visual roadmap for local radio.</h2>
            <p className="section-copy">
              The first presentation frames the station vision, community need,
              programming paths, and sustainable local support model.
            </p>
          </div>
          <div className="premium-card border-gold/25 bg-cream/10 p-3">
            <Image
              src="/images/mcr-deck.png"
              alt="Murphys Community Radio launch deck preview"
              width={1600}
              height={900}
              className="h-auto w-full rounded-md border border-gold/20"
            />
          </div>
        </div>
      </section>

      <section id="support" className="bg-parchment py-20 text-ink">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="section-kicker">Support</p>
            <h2 className="section-title text-hunter">
              Help launch the station.
            </h2>
          </div>
          <div className="premium-card border-hunter/15 bg-cream p-8 paper-texture">
            <p className="text-lg leading-8 text-ink/75">
              We are preparing donation and support pathways for founding
              supporters. Early contributions will help build the stream,
              production tools, local programming, and the organizational
              foundation for a durable community station.
            </p>
            <button className="mt-6 rounded-lg bg-hunter px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-gold-light transition duration-200 hover:-translate-y-0.5 hover:bg-hunter-deep hover:shadow-lg">
              Donation Placeholder
            </button>
          </div>
        </div>
      </section>

      <section className="relative bg-hunter-deep py-20">
        <div className="absolute inset-0 opacity-[0.1] grain-overlay" />
        <div className="relative mx-auto max-w-7xl px-6 sm:px-8">
          <div className="max-w-3xl">
            <p className="section-kicker">Founding Supporters</p>
            <h2 className="section-title">
              Local recognition, LPFM-safe language.
            </h2>
            <p className="section-copy">
              Underwriter acknowledgements will be informational and
              non-promotional, recognizing businesses and organizations that
              help make local radio possible.
            </p>
          </div>
          <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {underwriters.map((name) => (
              <div
                key={name}
                className="rounded-lg border border-gold/20 bg-cream/95 px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-hunter transition duration-200 hover:border-gold/60 hover:bg-parchment"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="submissions"
        className="bg-cream py-20 text-ink paper-texture"
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-6 sm:px-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="section-kicker">Community Submissions</p>
            <h2 className="section-title text-hunter">
              Bring something to the signal.
            </h2>
            <p className="mt-4 text-lg leading-8 text-ink/70">
              Static form UI for early interest, show ideas, music, events,
              underwriting, and volunteer or board conversations.
            </p>
          </div>
          <form className="premium-card border-hunter/20 bg-parchment/80 p-6 sm:p-8">
            <div className="mb-6 border-b border-hunter/15 pb-4">
              <p className="font-display text-2xl font-bold text-hunter">
                Radio intake desk
              </p>
              <p className="mt-1 text-sm leading-6 text-ink/60">
                Static interest form for the MVP.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="form-field">
                Name
                <input placeholder="Your name" />
              </label>
              <label className="form-field">
                Email
                <input placeholder="you@example.com" />
              </label>
            </div>
            <label className="form-field mt-4">
              Submission type
              <select defaultValue="">
                <option value="" disabled>
                  Choose one
                </option>
                {submissionOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="form-field mt-4">
              Notes
              <textarea placeholder="Tell us what you have in mind." rows={5} />
            </label>
            <button
              type="button"
              className="mt-6 rounded-lg bg-hunter px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-gold-light transition duration-200 hover:-translate-y-0.5 hover:bg-hunter-deep hover:shadow-lg"
            >
              Submit Interest
            </button>
          </form>
        </div>
      </section>

      <section className="bg-hunter py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 sm:px-8 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <p className="section-kicker">About</p>
            <h2 className="section-title">A community station in formation.</h2>
            <p className="mt-5 text-lg leading-8 text-parchment">
              Murphys Community Radio exists to amplify the voices of Calaveras
              County: artists, venues, civic leaders, local businesses,
              nonprofit organizers, students, elders, and neighbors with a story
              worth sharing.
            </p>
            <p className="mt-4 text-lg leading-8 text-parchment">
              Board formation is underway as the station develops its operating
              model, programming standards, community governance, and launch
              pathway under the XTRA GOOD LABS umbrella.
            </p>
          </div>
          <div className="premium-card border-gold/25 bg-cream p-6 text-ink paper-texture">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
              Contact
            </p>
            <h3 className="mt-4 font-display text-3xl font-bold text-hunter">
              Murphys Community Radio
            </h3>
            <a
              className="mt-5 block text-lg font-semibold text-hunter underline decoration-gold decoration-2 underline-offset-4"
              href="mailto:joe@murphyscommunityradio.com"
            >
              joe@murphyscommunityradio.com
            </a>
            <a
              className="mt-3 block text-lg font-semibold text-hunter underline decoration-gold decoration-2 underline-offset-4"
              href="tel:12095285665"
            >
              209 528 5665
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-gold/25 bg-[#03110d] py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-gold">
              A project of XTRA GOOD LABS
            </p>
            <p className="mt-2 text-sm text-parchment">
              Umbrella support for Murphys Community Radio and Skull County
              Radio.
            </p>
          </div>
          <Image
            src="/images/xgl-logo.jpg"
            alt="XTRA GOOD LABS logo"
            width={160}
            height={160}
            className="h-20 w-20 rounded-md border border-gold/25 object-cover shadow-lg"
          />
        </div>
      </footer>
    </main>
  );
}

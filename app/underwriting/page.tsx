import Link from "next/link";
import LiveBroadcastButton from "@/app/components/LiveBroadcastButton";

const tiers = [
  {
    name: "Tier 1 - Community Supporter",
    price: "$250 / quarter",
    audience: "For small businesses, makers, artists, and community supporters.",
    includes: [
      "Business name recognition",
      "Website supporter listing",
      "Basic underwriting announcement",
      "Quarterly renewal option",
    ],
  },
  {
    name: "Tier 2 - Business Radio",
    price: "$500 / quarter",
    audience:
      "Designed for customer-facing businesses that want a simple, managed in-store radio and display experience.",
    includes: [
      "Private in-house radio station",
      "Client-approved music library",
      "On-screen display for the shop",
      "Underwriter recognition",
      "Technical hosting and maintenance",
      "Quarterly update cycle",
    ],
    note: "Current founding example: Pure Aloha",
  },
  {
    name: "Tier 3 - Community Partner",
    price: "$750 / quarter",
    audience:
      "For businesses that want regular community radio recognition and local visibility.",
    includes: [
      "On-air underwriting recognition",
      "Website business profile",
      "Community event mentions when applicable",
      "Streaming recognition",
      "Quarterly proof-of-performance summary",
    ],
  },
  {
    name: "Tier 4 - Premier Local Partner",
    price: "$1,250 / quarter",
    audience:
      "For businesses that want expanded recognition across radio, web, events, and station programming.",
    includes: [
      "Premium underwriting rotation",
      "Featured website profile",
      "Event calendar support",
      "Social media recognition",
      "Priority production support",
      "Quarterly reporting",
    ],
  },
  {
    name: "Tier 5 - Signature Underwriter",
    price: "Standard retail value: $2,500+ / quarter",
    audience:
      "For anchor partners, venue partners, live event partners, and businesses receiving expanded media services.",
    includes: [
      "Premium underwriting recognition",
      "Live365 player / licensing support",
      "Live radio presence",
      "Live event promotion",
      "Website feature placement",
      "Event support",
      "Social media recognition",
      "Custom production support",
      "Add-on services as needed",
    ],
  },
];

const foundingUnderwriters = [
  {
    name: "Pure Aloha",
    packageName: "Founding Tier 2 - Business Radio",
    href: "/underwriters/pure-aloha",
  },
  {
    name: "Murphys Irish Pub",
    packageName: "Founding Tier 5 - Signature Underwriter",
    href: "/underwriters/murphys-irish-pub",
  },
];

export default function UnderwritingPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-20 text-white">
      <nav className="mx-auto mb-12 flex max-w-7xl flex-wrap items-center justify-between gap-4">
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
          <Link href="/" className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800">
            Home
          </Link>
          <Link href="/underwriters" className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800">
            Underwriters
          </Link>
          <Link href="/support" className="rounded-full bg-orange-400 px-5 py-3 text-sm font-bold text-black hover:bg-orange-300">
            Support
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.35em] text-orange-400">
            Murphys Community Radio Underwriting Program
          </p>
          <h1 className="mt-5 text-5xl font-black leading-none md:text-7xl">
            Support Local Radio. Reach Local Customers.
          </h1>
          <p className="mt-6 max-w-3xl text-xl leading-8 text-zinc-300">
            Murphys Community Radio helps local businesses connect with
            Calaveras County through community radio, live events, streaming
            audio, in-store radio experiences, and local media services.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/underwriting/apply" className="rounded-full bg-orange-400 px-7 py-4 font-black text-black hover:bg-orange-300">
              Become an Underwriter
            </Link>
            <Link href="/underwriters" className="rounded-full border border-orange-400 px-7 py-4 font-black text-orange-300 hover:bg-orange-400 hover:text-black">
              View Current Underwriters
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 sm:p-10">
          <img
            src="/logos/murphys-radio-logo-color.png"
            alt="Murphys Community Radio"
            className="mx-auto mb-8 w-48 drop-shadow-[0_16px_45px_rgba(0,0,0,0.85)] sm:w-64"
          />
          <h2 className="text-3xl font-black">Community support with public recognition.</h2>
          <p className="mt-4 leading-7 text-zinc-300">
            Underwriting is not traditional advertising. It is a way for local
            businesses to support independent radio while receiving clear,
            factual acknowledgement from the station.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">
              Current Underwriting Packages
            </p>
            <h2 className="mt-3 text-4xl font-black">Five ways to support the signal.</h2>
          </div>
          <Link href="/underwriting/apply" className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800">
            Start Application
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {tiers.map((tier) => (
            <article key={tier.name} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-orange-400">
                {tier.name}
              </p>
              <h3 className="mt-3 text-3xl font-black">{tier.price}</h3>
              <p className="mt-4 leading-7 text-zinc-300">{tier.audience}</p>
              <ul className="mt-6 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
                {tier.includes.map((item) => (
                  <li key={item} className="rounded-2xl bg-black px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
              {tier.note && (
                <p className="mt-5 text-sm font-bold text-orange-300">{tier.note}</p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-7xl">
        <div className="rounded-3xl bg-orange-400 p-8 text-black sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.25em]">
            Founding Underwriters
          </p>
          <h2 className="mt-4 text-4xl font-black">Early support matters.</h2>
          <p className="mt-4 leading-7 text-black/75">
            Businesses that joined during the launch phase may receive special
            founding pricing. Founding pricing recognizes early support and
            does not necessarily reflect the future retail value of the package.
          </p>
          <p className="mt-4 leading-7 text-black/75">
            Murphys Community Radio reserves the right to update public package
            pricing for future underwriters while honoring existing founding
            agreements.
          </p>
          <div className="mt-8 grid gap-3">
            {foundingUnderwriters.map((underwriter) => (
              <Link
                key={underwriter.name}
                href={underwriter.href}
                className="rounded-2xl bg-black px-5 py-4 text-white transition hover:bg-zinc-900"
              >
                <span className="block text-lg font-black">{underwriter.name}</span>
                <span className="mt-1 block text-sm text-orange-200">
                  {underwriter.packageName}
                </span>
              </Link>
            ))}
          </div>
          <Link href="/underwriters" className="mt-8 inline-flex rounded-full bg-black px-7 py-4 font-black text-white">
            View Underwriter Directory
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-7xl rounded-3xl border border-orange-400/40 bg-[#120b04] p-8 text-center sm:p-12">
        <h2 className="text-4xl font-black">Ready to support local radio?</h2>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-zinc-300">
          Tell us about your business, your preferred tier, and the kind of
          recognition that fits your place in the community.
        </p>
        <Link href="/underwriting/apply" className="mt-8 inline-flex rounded-full bg-orange-400 px-7 py-4 font-black text-black hover:bg-orange-300">
          Become an Underwriter
        </Link>
      </section>
    </main>
  );
}

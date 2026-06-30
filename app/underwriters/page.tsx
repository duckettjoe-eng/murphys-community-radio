import Link from "next/link";
import LiveBroadcastButton from "@/app/components/LiveBroadcastButton";

const underwriters = [
  {
    name: "Pure Aloha",
    packageName: "Founding Tier 2 - Business Radio",
    href: "/underwriters/pure-aloha",
    image: "/partners/pure-aloha-text-transparent.png",
    description:
      "A founding Business Radio underwriter supporting an in-store radio and display experience.",
  },
  {
    name: "Murphys Irish Pub",
    packageName: "Founding Tier 5 - Signature Underwriter",
    href: "/underwriters/murphys-irish-pub",
    image: "/partners/murphys-irish-pub-black.png",
    description:
      "A founding Signature Underwriter supporting live radio, events, and community recognition.",
  },
];

export default function UnderwritersPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-20 text-white">
      <nav className="mx-auto mb-12 flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-orange-400">
            Murphys Community Radio
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <LiveBroadcastButton />
          <Link href="/underwriting" className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800">
            Underwriting
          </Link>
          <Link href="/underwriting/apply" className="rounded-full bg-orange-400 px-5 py-3 text-sm font-bold text-black hover:bg-orange-300">
            Become an Underwriter
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-5xl text-center">
        <p className="text-sm font-black uppercase tracking-[0.35em] text-orange-400">
          Current Underwriters
        </p>
        <h1 className="mt-5 text-5xl font-black md:text-7xl">
          Local businesses supporting local radio.
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-xl leading-8 text-zinc-300">
          These founding partners help Murphys Community Radio serve Calaveras
          County through streaming audio, local programming, in-store radio, and
          community events.
        </p>
      </section>

      <section className="mx-auto mt-14 grid max-w-6xl gap-8 md:grid-cols-2">
        {underwriters.map((underwriter) => (
          <Link
            key={underwriter.name}
            href={underwriter.href}
            className="group rounded-3xl border border-zinc-800 bg-zinc-950 p-8 transition hover:border-orange-400"
          >
            <div className="flex h-40 items-center justify-center rounded-2xl border border-zinc-800 bg-black p-6">
              <img
                src={underwriter.image}
                alt={`${underwriter.name} logo`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <p className="mt-6 text-sm font-black uppercase tracking-[0.22em] text-orange-400">
              {underwriter.packageName}
            </p>
            <h2 className="mt-3 text-3xl font-black">{underwriter.name}</h2>
            <p className="mt-4 leading-7 text-zinc-300">
              {underwriter.description}
            </p>
            <span className="mt-6 inline-flex rounded-full bg-orange-400 px-5 py-3 text-sm font-black text-black group-hover:bg-orange-300">
              View Profile
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}

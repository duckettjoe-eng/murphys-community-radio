import Link from "next/link";
import LiveBroadcastButton from "@/app/components/LiveBroadcastButton";

const services = [
  "Premium underwriting recognition",
  "Live radio presence",
  "Live events",
  "Live365 player / licensing support",
  "Website feature placement",
  "Event support",
  "Social media recognition",
  "Custom production support",
  "Add-on services as needed",
];

export default function MurphysIrishPubUnderwriterPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-20 text-white">
      <nav className="mx-auto mb-12 flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-orange-400">
          Murphys Community Radio
        </p>
        <div className="flex flex-wrap gap-3">
          <LiveBroadcastButton />
          <Link href="/underwriters" className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800">
            Underwriters
          </Link>
          <Link href="/underwriting" className="rounded-full bg-orange-400 px-5 py-3 text-sm font-bold text-black hover:bg-orange-300">
            Underwriting
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="rounded-3xl border border-zinc-800 bg-black p-8">
          <img
            src="/partners/murphys-irish-pub-black.png"
            alt="Murphys Irish Pub logo"
            className="mx-auto max-h-72 w-full object-contain"
          />
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.35em] text-orange-400">
            Founding Underwriter
          </p>
          <h1 className="mt-5 text-5xl font-black md:text-7xl">
            Murphys Irish Pub
          </h1>
          <div className="mt-8 grid gap-4">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
              <p className="text-sm font-bold text-zinc-500">Tier</p>
              <p className="mt-2 text-2xl font-black">
                Founding Tier 5 - Signature Underwriter
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-7xl rounded-3xl border border-zinc-800 bg-zinc-950 p-8 sm:p-10">
        <h2 className="text-4xl font-black">Services</h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {services.map((service) => (
            <li key={service} className="rounded-2xl bg-black px-5 py-4 text-zinc-300">
              {service}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

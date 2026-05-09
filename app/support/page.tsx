import Link from "next/link";

export default function SupportPage() {
  const tiers = [
    {
      name: "Supporter",
      price: "$25",
      desc: "Help keep the station moving and support the launch.",
      link: "https://buy.stripe.com/9B66oJ5CM0tKbXk03y1gs00",
    },
    {
      name: "Amplifier",
      price: "$100",
      desc: "Boost local music, artists, shows, and community voices.",
      link: "https://buy.stripe.com/00wbJ31mw2BS4uS2bG1gs02",
      featured: true,
    },
    {
      name: "Broadcaster",
      price: "$250",
      desc: "Power the signal and help build the station foundation.",
      link: "https://buy.stripe.com/bJe00lghqekA8L8eYs1gs03",
    },
    {
      name: "Producer",
      price: "$500",
      desc: "Support major launch costs, infrastructure, and programming.",
      link: "https://buy.stripe.com/aFa8wR0isa4k2mK03y1gs01",
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white px-6 py-20">

      {/* NAV */}
      <nav className="mb-12 flex flex-wrap items-center justify-between gap-4 max-w-7xl mx-auto">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-orange-400">
            Murphys Community Radio
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/live" className="rounded-full bg-red-500 px-5 py-3 text-sm font-black text-white hover:bg-red-400">
            Live Broadcast
          </Link>

          <Link href="/" className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800">
            Home
          </Link>

          <Link href="/archive" className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800">
            Archive
          </Link>

          <Link href="/shows" className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800">
            Shows
          </Link>

          <Link href="/underwrite" className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800">
            Underwrite
          </Link>
        </div>
      </nav>

      {/* LOGO */}
      <div className="text-center mb-10">
        <img
          src="/logos/murphys-radio-logo-color.png"
          alt="Murphys Community Radio"
          className="mx-auto w-52 md:w-72 drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
        />
      </div>

      {/* HERO */}
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-black">
          Support the Signal
        </h1>

        <p className="mt-6 text-xl text-zinc-300 max-w-3xl mx-auto">
          Help build independent community radio for Murphys, local artists,
          DJs, storytellers, musicians, and Calaveras County voices.
        </p>
      </div>

      {/* TIERS */}
      <div className="mt-16 grid gap-8 md:grid-cols-4 max-w-7xl mx-auto">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`p-8 rounded-3xl border ${
              tier.featured
                ? "bg-orange-400 text-black border-orange-400"
                : "bg-zinc-900 border-zinc-800"
            }`}
          >
            {tier.featured && (
              <p className="mb-4 text-xs font-bold uppercase bg-black text-white px-3 py-1 rounded-full inline-block">
                Most Popular
              </p>
            )}

            <h2 className="text-2xl font-black">{tier.name}</h2>
            <p className="text-4xl font-black mt-2">{tier.price}</p>

            <p className="mt-4 text-sm opacity-80">{tier.desc}</p>

            <a
              href={tier.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-6 inline-block px-6 py-3 rounded-full font-bold ${
                tier.featured
                  ? "bg-black text-white"
                  : "bg-orange-400 text-black"
              }`}
            >
              Support the Station
            </a>
          </div>
        ))}
      </div>

      {/* VALUE */}
      <div className="mt-24 max-w-5xl mx-auto grid md:grid-cols-3 gap-10 text-center">
        <div>
          <h3 className="text-xl font-black text-orange-300">🎧 Equipment</h3>
          <p className="text-zinc-300 text-sm mt-2">
            Microphones, mixers, production tools, and broadcast gear.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-black text-orange-300">🌐 Streaming</h3>
          <p className="text-zinc-300 text-sm mt-2">
            Keeping the station online and accessible beyond Main Street.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-black text-orange-300">🎶 Local Voices</h3>
          <p className="text-zinc-300 text-sm mt-2">
            Shows, music, interviews, stories, and community programming.
          </p>
        </div>
      </div>

      {/* FINAL CTA */}
      <div className="mt-24 max-w-3xl mx-auto text-center">
        <h3 className="text-2xl font-black text-orange-300">
          Built locally. Powered by you.
        </h3>

        <p className="mt-4 text-zinc-300 text-sm">
          Every contribution helps turn Murphys Community Radio from a launch
          project into a living local media platform.
        </p>
      </div>

    </main>
  );
}

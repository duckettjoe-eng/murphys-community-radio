export default function UnderwritePage() {
  const tiers = [
    {
      name: "Community Underwriter",
      price: "$150/mo",
      desc: "On-air acknowledgement + community support.",
      link: "PASTE_150_LINK",
    },
    {
      name: "Local Amplifier",
      price: "$250/mo",
      desc: "Featured presence + increased visibility.",
      link: "PASTE_250_LINK",
      featured: true,
    },
    {
      name: "Station Partner",
      price: "$500/mo",
      desc: "Top-tier recognition across the station.",
      link: "PASTE_500_LINK",
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white px-6 py-20">

      {/* LOGO */}
      <div className="text-center">
        <img
          src="/logos/skull-county-radio-logo.png"
          alt="Skull County Radio"
          className="mx-auto mb-6 w-44 md:w-64"
        />
      </div>

      {/* HERO */}
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-black">
          Underwrite the Signal
        </h1>

        <p className="mt-6 text-xl text-zinc-300 max-w-3xl mx-auto">
          Put your business in front of a real local audience—
          not algorithms, not ads, just people.
        </p>
      </div>

      {/* TIERS */}
      <div className="mt-16 grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
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
              className={`mt-6 inline-block px-6 py-3 rounded-full font-bold ${
                tier.featured
                  ? "bg-black text-white"
                  : "bg-orange-400 text-black"
              }`}
            >
              Become an Underwriter
            </a>
          </div>
        ))}
      </div>

      {/* BUSINESS VALUE */}
      <div className="mt-24 max-w-5xl mx-auto grid md:grid-cols-3 gap-10 text-center">
        <div>
          <h3 className="text-xl font-black text-orange-300">📍 Local Reach</h3>
          <p className="text-zinc-300 text-sm mt-2">
            Connect directly with Murphys listeners.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-black text-orange-300">🎧 Real Attention</h3>
          <p className="text-zinc-300 text-sm mt-2">
            No scrolling. Just listening.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-black text-orange-300">🤝 Trust</h3>
          <p className="text-zinc-300 text-sm mt-2">
            Align with local culture + community.
          </p>
        </div>
      </div>

    </main>
  );
}
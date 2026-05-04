const tiers = [
  {
    name: "Community Underwriter",
    price: "$150/mo",
    desc: "Support community radio and receive on-air acknowledgement.",
    link: "https://buy.stripe.com/3cI4gBghqccs0eC17C1gs04",
  },
  {
    name: "Local Amplifier",
    price: "$250/mo",
    desc: "Featured support with increased visibility on-air.",
    link: "https://buy.stripe.com/bJecN78OY3FW5yWaIc1gs06",
    featured: true,
  },
  {
    name: "Station Partner",
    price: "$500/mo",
    desc: "Top-tier support with premium recognition.",
    link: "https://buy.stripe.com/7sY9AVghqccs8L8g2w1gs05",
  },
];

export default function UnderwritePage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-20">

      <div className="max-w-6xl mx-auto text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-orange-400 mb-4">
          Murphys Community Radio
        </p>

        <h1 className="text-5xl md:text-7xl font-black">
          Underwrite Local Radio
        </h1>

        <p className="mt-6 text-xl text-zinc-300 max-w-3xl mx-auto">
          Support independent community broadcasting while aligning your business
          with local music, culture, and storytelling.
        </p>
      </div>

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
              <p className="mb-4 text-xs font-bold uppercase tracking-widest bg-black text-white px-3 py-1 inline-block rounded-full">
                Recommended
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
              Become an Underwriter
            </a>
          </div>
        ))}

      </div>

      <div className="mt-20 max-w-4xl mx-auto grid md:grid-cols-2 gap-8 text-left">

        <div>
          <h3 className="text-2xl font-black text-orange-300">
            What is underwriting?
          </h3>
          <p className="mt-3 text-zinc-300">
            Underwriting is not traditional advertising. It is recognition of
            support for community radio.
          </p>
        </div>

        <div>
          <h3 className="text-2xl font-black text-orange-300">
            FCC-friendly messaging
          </h3>
          <p className="mt-3 text-zinc-300">
            “Support for Murphys Community Radio comes from your business,
            serving Murphys and Calaveras County.”
          </p>
        </div>

      </div>

    </main>
  );
}
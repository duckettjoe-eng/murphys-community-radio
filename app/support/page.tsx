const tiers = [
  {
    name: "Supporter",
    price: "$25",
    desc: "Help get Murphys Community Radio off the ground.",
    link: "https://buy.stripe.com/9B66oJ5CM0tKbXk03y1gs00",
    emoji: "📻",
  },
  {
    name: "Amplifier",
    price: "$100",
    desc: "Boost local artists and programming.",
    link: "https://buy.stripe.com/00wbJ31mw2BS4uS2bG1gs02",
    emoji: "📡",
  },
  {
    name: "Broadcaster",
    price: "$250",
    desc: "Power the signal across Calaveras County.",
    link: "https://buy.stripe.com/bJe00lghqekA8L8eYs1gs03",
    emoji: "🎙️",
  },
  {
    name: "Producer",
    price: "$500",
    desc: "Fund major pieces of the station build.",
    link: "https://buy.stripe.com/aFa8wR0isa4k2mK03y1gs01",
    emoji: "🔥",
  },
];

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[#120b07] text-white px-6 py-16">

      <div className="max-w-5xl mx-auto text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-orange-400 mb-4">
          Murphys Community Radio
        </p>

        <h1 className="text-5xl md:text-7xl font-black">
          Support the Signal
        </h1>

        <p className="mt-6 text-xl text-zinc-300 max-w-2xl mx-auto">
          Help build a platform for local voices, music, and community storytelling.
        </p>
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">

        {tiers.map((tier, i) => (
          <div
            key={tier.name}
            className={`p-8 rounded-[2rem] border-4 border-black bg-[#ffe1a8] text-black shadow-[8px_8px_0px_#000] ${
              i % 2 === 0 ? "rotate-[-2deg]" : "rotate-[2deg]"
            }`}
          >
            <div className="text-4xl mb-3">{tier.emoji}</div>

            <h2 className="text-2xl font-black">{tier.name}</h2>

            <p className="text-lg font-bold mt-1">{tier.price}</p>

            <p className="mt-3 text-sm">{tier.desc}</p>

            <a
              href={tier.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block bg-black text-white px-6 py-3 rounded-full font-bold hover:bg-zinc-800"
            >
              Support
            </a>
          </div>
        ))}

      </div>
    </main>
  );
}
const shows = [
  {
    title: "Golden Hour Groove",
    description:
      "Warm soul, funk, yacht rock, and sunset selections for golden-hour listening.",
    tags: ["Soul", "Funk", "Sunset"],
    spotifyUrl: "https://open.spotify.com/embed/playlist/6MmSFo11AbLLGuXx8iUQI8",
  },
  {
    title: "Dusty Crate Hip-Hop Hour",
    description:
      "Classic hip-hop, breaks, samples, and crate-digging selections with deep groove energy.",
    tags: ["Hip-Hop", "Breaks", "Crates"],
    spotifyUrl: "https://open.spotify.com/embed/playlist/31SuOU4Vbv7xjdtYlW4PE1",
  },
  {
    title: "Cali Sun Reggae Ride",
    description:
      "Reggae, dub, roots, and California coastal rhythms built for an easy ride.",
    tags: ["Reggae", "Dub", "Roots"],
    spotifyUrl: "https://open.spotify.com/embed/playlist/0mf1PWxgjPUG8abErI67tC",
  },
  {
    title: "Alt-Rock Barroom Radio",
    description:
      "Alternative rock, dive-bar anthems, 90s grit, and guitar-forward radio energy.",
    tags: ["Alt Rock", "Indie", "Barroom"],
    spotifyUrl: "https://open.spotify.com/embed/playlist/4LCviG4Etf6sfoQNNWbRfs",
  },
  {
    title: "Weird Late-Night FM",
    description:
      "Strange, cinematic, left-field, and after-hours sounds from the edge of the dial.",
    tags: ["Experimental", "Late Night", "Oddities"],
    spotifyUrl: "https://open.spotify.com/embed/playlist/5bChhr0FAb32b2oevGyUAv",
  },
  {
    title: "House Party Frequency",
    description:
      "Dance-floor friendly house, disco, edits, and party tracks for high-energy sets.",
    tags: ["House", "Disco", "Party"],
    spotifyUrl: "https://open.spotify.com/embed/playlist/24x2HGar6r7xStbu7VktN4",
  },
  {
    title: "Lowrider Soul Sunday",
    description:
      "Oldies, lowrider soul, sweet harmonies, and Sunday cruising music.",
    tags: ["Oldies", "Soul", "Sunday"],
    spotifyUrl: "https://open.spotify.com/embed/playlist/5mkOQT5zf6vag2lAzjgPEp",
  },
  {
    title: "Campfire Americana",
    description:
      "Folk, country, roots, and storytelling songs for foothill evenings.",
    tags: ["Americana", "Folk", "Country"],
    spotifyUrl: "https://open.spotify.com/embed/playlist/27dShIERXqZ5HZG3gVIuRX",
  },
  {
    title: "Mashup Crate Hour",
    description:
      "Genre-crossing mashups, blends, tempo flips, and DJ-friendly surprises.",
    tags: ["Mashups", "DJ", "Open Format"],
    spotifyUrl: "https://open.spotify.com/embed/playlist/5wIMxNuCrHLXbGcnN6e4eb",
  },
  {
    title: "Skull County Garage Gospel",
    description:
      "Raw garage rock, blues grit, punk spirit, and backroad gospel energy.",
    tags: ["Garage", "Blues", "Rock"],
    spotifyUrl: "https://open.spotify.com/embed/playlist/5ciTziF2CsE7ifteDHg0FW",
  },
];

export default function ShowsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="px-6 py-20 text-center md:py-24">
        <div className="mx-auto max-w-5xl">
          <img
            src="/SCR Logo Final.png"
            alt="Skull County Radio"
            className="mx-auto mb-8 w-36 md:w-48"
          />

          <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.35em] text-orange-400">
            Murphys Community Radio Programming
          </p>

          <h1 className="text-5xl font-black leading-none tracking-tight md:text-7xl">
            Shows & Playlists
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-white/70 md:text-xl md:leading-8">
            Curated show blocks from Skull County Radio — built for on-air
            programming, companion listening, and future schedule expansion.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {shows.map((show) => (
            <article
              key={show.title}
              className="rounded-3xl border border-white/10 bg-[#17171b] p-6 shadow-2xl"
            >
              <p className="mb-3 inline-flex rounded-full bg-orange-400 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-black">
                Schedule TBA
              </p>

              <h2 className="text-2xl font-black leading-tight text-white">
                {show.title}
              </h2>

              <p className="mt-4 min-h-[72px] text-sm leading-6 text-white/65">
                {show.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {show.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black">
                <iframe
                  title={`${show.title} Spotify playlist`}
                  src={show.spotifyUrl}
                  width="100%"
                  height="352"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="block rounded-2xl"
                />
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
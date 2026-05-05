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
    <main className="min-h-screen bg-[#0F3D2E] text-[#F4EBDD]">
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="border border-[#C8A96A]/50 bg-[#F4EBDD] p-8 text-[#0F3D2E] shadow-2xl md:p-12">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-[#8B6F36]">
            Murphys Community Radio
          </p>

          <h1 className="font-serif text-5xl font-bold leading-tight md:text-7xl">
            Shows & Playlists
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#0F3D2E]/80 md:text-xl">
            Curated programming from Murphys Community Radio and Skull County
            Radio — built as a companion library for show blocks, playlists,
            and future on-air programming.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-8 md:grid-cols-2">
          {shows.map((show) => (
            <article
              key={show.title}
              className="overflow-hidden border border-[#C8A96A]/40 bg-[#F4EBDD] text-[#0F3D2E] shadow-xl"
            >
              <div className="border-b border-[#C8A96A]/40 p-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#8B6F36]">
                  Schedule TBA
                </p>

                <h2 className="font-serif text-3xl font-bold leading-tight">
                  {show.title}
                </h2>

                <p className="mt-4 leading-7 text-[#0F3D2E]/80">
                  {show.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {show.tags.map((tag) => (
                    <span
                      key={tag}
                      className="border border-[#C8A96A]/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-[#0F3D2E]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-[#0F3D2E] p-4">
                <iframe
                  title={`${show.title} Spotify playlist`}
                  src={show.spotifyUrl}
                  width="100%"
                  height="352"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="rounded-xl"
                />
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
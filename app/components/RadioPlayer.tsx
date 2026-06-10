import Live365Player from "@/components/Live365Player";

type RadioPlayerProps = {
  embedUrl?: string;
};

export default function RadioPlayer({ embedUrl }: RadioPlayerProps) {
  return (
    <section
      aria-labelledby="listen-live-heading"
      className="relative overflow-hidden border-y border-orange-400/20 bg-[#070707] px-6 py-16 sm:py-20"
    >
      <div className="absolute left-1/2 top-0 h-40 w-[42rem] max-w-full -translate-x-1/2 rounded-full bg-orange-400/10 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/80 to-transparent" />

      <div className="relative mx-auto max-w-6xl text-center">
        <h2
          id="listen-live-heading"
          className="text-4xl font-black tracking-tight text-white sm:text-5xl"
        >
          Listen Live
        </h2>
        <p className="mt-3 text-sm font-black uppercase tracking-[0.24em] text-orange-300 sm:text-base">
          Murphys Community Radio
        </p>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
          Streaming local music, DJs, stories, and community programming from
          Calaveras County.
        </p>

        <div className="mx-auto mt-10 max-w-[860px] rounded-2xl border border-orange-400/35 bg-zinc-950 p-3 shadow-[0_24px_80px_rgba(249,115,22,0.16)] sm:p-5">
          <div className="overflow-hidden rounded-xl bg-black">
            <Live365Player embedUrl={embedUrl} />
          </div>
        </div>
      </div>
    </section>
  );
}

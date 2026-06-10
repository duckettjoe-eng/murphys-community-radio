import Live365Player from "@/components/Live365Player";

type RadioPlayerProps = {
  embedUrl?: string;
};

export default function RadioPlayer({ embedUrl }: RadioPlayerProps) {
  return (
    <section className="relative overflow-hidden border-t border-gold/45 bg-[#050806] px-6 py-20 shadow-[0_-18px_70px_rgba(201,155,59,0.12)] sm:py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-light to-transparent opacity-80" />
      <div className="absolute left-1/2 top-0 h-48 w-[42rem] max-w-full -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative mx-auto max-w-[1100px] text-center">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            Listen Live
          </h2>
          <p className="mt-3 text-sm font-black uppercase tracking-[0.24em] text-gold-light sm:text-base">
            Murphys Community Radio
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
            Streaming local music, DJs, stories, and community programming from
            Calaveras County.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-[900px] overflow-hidden rounded-2xl border border-gold/40 bg-black shadow-[0_24px_80px_rgba(201,155,59,0.18)]">
          <Live365Player embedUrl={embedUrl} />
        </div>
      </div>
    </section>
  );
}

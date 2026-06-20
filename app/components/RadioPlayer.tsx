import Live365Player from "@/components/Live365Player";

type RadioPlayerProps = {
  embedUrl?: string;
};

export default function RadioPlayer({ embedUrl }: RadioPlayerProps) {
  return (
    <section
      aria-labelledby="listen-live-heading"
      className="relative mt-2 w-full max-w-[826px] overflow-hidden rounded-2xl border border-orange-400/40 bg-zinc-950 p-2 shadow-[0_20px_60px_rgba(249,115,22,0.18)] sm:p-3"
    >
      <div className="absolute left-1/2 top-0 h-24 w-4/5 -translate-x-1/2 rounded-full bg-orange-400/15 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/80 to-transparent" />

      <div className="relative">
        <div className="flex items-center justify-between gap-4 px-2 pb-2 pt-1">
          <h2
            id="listen-live-heading"
            className="text-sm font-black uppercase tracking-[0.22em] text-orange-300"
          >
            Listen Live
          </h2>
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
            Murphys Community Radio
          </span>
        </div>
        <div className="overflow-hidden rounded-xl bg-black">
          <Live365Player embedUrl={embedUrl} />
        </div>
      </div>
    </section>
  );
}

import Live365Player from "@/components/Live365Player";

type RadioPlayerProps = {
  embedUrl?: string;
};

export default function RadioPlayer({ embedUrl }: RadioPlayerProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto border-t border-orange-400/20 bg-black/95 px-4 py-4 backdrop-blur">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 text-center">
          <h2 className="text-xl font-black text-white">Listen Live</h2>
          <p className="mt-1 text-sm font-semibold text-orange-300">
            Murphys Community Radio
          </p>
        </div>

        <Live365Player embedUrl={embedUrl} />
      </div>
    </div>
  );
}

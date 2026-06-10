interface Live365PlayerProps {
  embedUrl?: string;
}

function isValidEmbedUrl(embedUrl?: string) {
  if (!embedUrl) return false;

  try {
    return new URL(embedUrl).protocol === "https:";
  } catch {
    return false;
  }
}

export default function Live365Player({
  embedUrl,
}: Live365PlayerProps) {
  if (!isValidEmbedUrl(embedUrl)) {
    return (
      <div
        className="grid h-[300px] place-items-center bg-black/40 px-6 text-center text-sm font-semibold text-zinc-300 md:h-[320px]"
        role="status"
      >
        Live365 player is not configured yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <iframe
        title="Murphys Community Radio Live365 Player"
        src={embedUrl}
        width="100%"
        height="320"
        frameBorder="0"
        allow="autoplay"
        loading="lazy"
        className="block h-[300px] w-full max-w-full overflow-hidden border-0 md:h-[320px]"
      />
    </div>
  );
}

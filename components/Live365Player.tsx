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
      <div className="rounded-xl border p-4 text-center" role="status">
        Live365 player has not been configured.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl">
      <iframe
        title="Murphys Community Radio Live365 Player"
        src={embedUrl}
        width="100%"
        height="296"
        frameBorder="0"
        allow="autoplay"
        loading="lazy"
        className="block w-full border-0"
      />
    </div>
  );
}

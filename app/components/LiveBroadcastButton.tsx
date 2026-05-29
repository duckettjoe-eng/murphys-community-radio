"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const liveRoomUrl = "https://www.mixcloud.com/live/skullcountyradio/";
const inactiveClassName =
  "rounded-full bg-red-500 px-5 py-3 text-sm font-black text-white hover:bg-red-400";
const activeClassName = `${inactiveClassName} live-broadcast-flash ring-2 ring-red-300/70`;

type LiveBroadcastButtonProps = {
  initialIsLive?: boolean;
};

export default function LiveBroadcastButton({
  initialIsLive = false,
}: LiveBroadcastButtonProps) {
  const [isLive, setIsLive] = useState(initialIsLive);

  useEffect(() => {
    let isMounted = true;

    const fetchCurrentShow = async () => {
      try {
        const response = await fetch("/api/current-show", {
          cache: "no-store",
        });
        const data = (await response.json()) as {
          isLive?: boolean;
          name?: string;
        };

        if (isMounted) {
          setIsLive(
            data.isLive ??
              Boolean(data.name && data.name !== "Murphys Community Radio"),
          );
        }
      } catch {
        if (isMounted) {
          setIsLive(false);
        }
      }
    };

    fetchCurrentShow();

    const interval = setInterval(fetchCurrentShow, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (isLive) {
    return (
      <a
        href={liveRoomUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={activeClassName}
        aria-label="Live Broadcast is on now. Open live stream."
      >
        Live Broadcast
      </a>
    );
  }

  return (
    <Link href="/live" className={inactiveClassName}>
      Live Broadcast
    </Link>
  );
}

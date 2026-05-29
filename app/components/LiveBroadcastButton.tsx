"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const liveRoomUrl = "https://www.mixcloud.com/live/skullcountyradio/";
const inactiveClassName =
  "rounded-full bg-red-500 px-5 py-3 text-sm font-black text-white hover:bg-red-400";
const activeClassName = `${inactiveClassName} live-broadcast-flash ring-2 ring-red-300/70`;

function isLiveShow(name?: string) {
  return Boolean(name && name !== "Murphys Community Radio");
}

export default function LiveBroadcastButton() {
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchCurrentShow = async () => {
      try {
        const response = await fetch("/api/current-show", {
          cache: "no-store",
        });
        const data = (await response.json()) as { name?: string };

        if (isMounted) {
          setIsLive(isLiveShow(data.name));
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

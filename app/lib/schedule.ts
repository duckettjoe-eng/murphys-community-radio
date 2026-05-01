export const schedule = [
  {
    name: "Morning Mix",
    host: "DJ Sunrise",
    start: 6,
    end: 10,
  },
  {
    name: "Midday Groove",
    host: "DJ Valley",
    start: 10,
    end: 14,
  },
  {
    name: "Drive Time",
    host: "DJ Highway",
    start: 14,
    end: 18,
  },
  {
    name: "Skull County Radio",
    host: "Murphys Community Radio",
    start: 18,
    end: 24,
  },
  {
    name: "Late Night Vibes",
    host: "DJ Midnight",
    start: 0,
    end: 6,
  },
];

export function getCurrentShow() {
  const now = new Date();
  const hour = now.getHours();

  return (
    schedule.find((show) => hour >= show.start && hour < show.end) || {
      name: "Murphys Community Radio",
      host: "Live Broadcast",
    }
  );
}

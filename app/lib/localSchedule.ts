export type Show = {
  name: string;
  host: string;
  day: number; // 0 = Sunday, 6 = Saturday
  start: string; // "HH:MM"
  end: string; // "HH:MM"
};

export const localSchedule: Show[] = [
  {
    name: "Test Show",
    host: "DJ Test",
    day: new Date().getDay(),
    start: "00:00",
    end: "23:59",
  },
  {
    name: "Morning Vibes",
    host: "DJ Sun",
    day: 1,
    start: "08:00",
    end: "12:00",
  },
  {
    name: "Afternoon Flow",
    host: "DJ Wave",
    day: 1,
    start: "12:00",
    end: "16:00",
  },
];

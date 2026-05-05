export type Show = {
  name: string;
  host: string;
  day: number;
  start: string;
  end: string;
};

// day uses JavaScript Date.getDay():
// 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday,
// 4 = Thursday, 5 = Friday, 6 = Saturday

export const localSchedule: Show[] = [
  {
    name: "Golden Hour Groove",
    host: "Skull County Radio",
    day: 4,
    start: "18:00",
    end: "19:00",
  },
  {
    name: "Alt-Rock Barroom Radio",
    host: "Skull County Radio",
    day: 4,
    start: "19:00",
    end: "20:00",
  },
  {
    name: "Dusty Crate Hip-Hop Hour",
    host: "Skull County Radio",
    day: 5,
    start: "18:00",
    end: "19:00",
  },
  {
    name: "House Party Frequency",
    host: "Skull County Radio",
    day: 5,
    start: "19:00",
    end: "20:00",
  },
  {
    name: "Weird Late-Night FM",
    host: "Skull County Radio",
    day: 5,
    start: "20:00",
    end: "21:00",
  },
  {
    name: "Cali Sun Reggae Ride",
    host: "Skull County Radio",
    day: 6,
    start: "17:00",
    end: "18:00",
  },
  {
    name: "Mashup Crate Hour",
    host: "Skull County Radio",
    day: 6,
    start: "18:00",
    end: "19:00",
  },
  {
    name: "Campfire Americana",
    host: "Skull County Radio",
    day: 6,
    start: "19:00",
    end: "20:00",
  },
  {
    name: "Lowrider Soul Sunday",
    host: "Skull County Radio",
    day: 0,
    start: "10:00",
    end: "11:00",
  },
  {
    name: "Skull County Garage Gospel",
    host: "Skull County Radio",
    day: 0,
    start: "11:00",
    end: "12:00",
  },
];
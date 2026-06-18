export type Show = {
  name: string;
  host: string;
  description?: string;
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
    description:
      "Golden era hip hop and classic soul, connecting warm crate-digging records from Nas, A Tribe Called Quest, Gang Starr, Bill Withers, Al Green, Curtis Mayfield, Marvin Gaye, and beyond.",
    day: 4,
    start: "18:00",
    end: "19:00",
  },
  {
    name: "Alt-Rock Barroom Radio",
    host: "Skull County Radio",
    description:
      "Alternative rock, dive-bar anthems, 90s grit, and guitar-forward radio energy.",
    day: 4,
    start: "19:00",
    end: "20:00",
  },
  {
    name: "Dusty Crate Hip-Hop Hour",
    host: "Skull County Radio",
    description:
      "Classic hip-hop, breaks, samples, and crate-digging selections with deep groove energy.",
    day: 5,
    start: "18:00",
    end: "19:00",
  },
  {
    name: "House Party Frequency",
    host: "Skull County Radio",
    description:
      "Dance-floor friendly house, disco, edits, and party tracks for high-energy sets.",
    day: 5,
    start: "19:00",
    end: "20:00",
  },
  {
    name: "Weird Late-Night FM",
    host: "Skull County Radio",
    description:
      "Strange, cinematic, left-field, and after-hours sounds from the edge of the dial.",
    day: 5,
    start: "20:00",
    end: "21:00",
  },
  {
    name: "Cali Sun Reggae Ride",
    host: "Skull County Radio",
    description:
      "Reggae, dub, roots, and California coastal rhythms built for an easy ride.",
    day: 6,
    start: "17:00",
    end: "18:00",
  },
  {
    name: "Mashup Crate Hour",
    host: "Skull County Radio",
    description:
      "Genre-crossing mashups, blends, tempo flips, and DJ-friendly surprises.",
    day: 6,
    start: "18:00",
    end: "19:00",
  },
  {
    name: "Campfire Americana",
    host: "Skull County Radio",
    description:
      "Folk, country, roots, and storytelling songs for foothill evenings.",
    day: 6,
    start: "19:00",
    end: "20:00",
  },
  {
    name: "Lowrider Soul Sunday",
    host: "Skull County Radio",
    description:
      "Oldies, lowrider soul, sweet harmonies, and Sunday cruising music.",
    day: 0,
    start: "10:00",
    end: "11:00",
  },
  {
    name: "Skull County Garage Gospel",
    host: "Skull County Radio",
    description:
      "Raw garage rock, blues grit, punk spirit, and backroad gospel energy.",
    day: 0,
    start: "11:00",
    end: "12:00",
  },
];

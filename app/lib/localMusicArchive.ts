export type MusicArchiveItem = {
  id: string;
  showSlug: string;
  showName: string;
  djSlug: string;
  djName: string;
  host: string;
  title: string;
  artist: string;
  audioUrl: string;
  parts: string[];
  artwork: string;
  date: string;
};

const SUPABASE_AUDIO_BASE =
  "https://pkvgpbbxihbhiammovzh.supabase.co/storage/v1/object/public/radio-archive";

const buildPartUrls = (fileNames: string[]) =>
  fileNames.map((fileName) => `${SUPABASE_AUDIO_BASE}/${fileName}`);

const buildSequentialPartUrls = (prefix: string, count: number) =>
  buildPartUrls(
    Array.from(
      { length: count },
      (_, index) => `${prefix}-part-${index.toString().padStart(3, "0")}.mp3`,
    ),
  );

const aHouseCalledQuestParts = buildPartUrls([
  "a-house-called-quest-part-000.mp3",
  "a-house-called-quest-part-001.mp3",
  "a-house-called-quest-part-002.mp3",
  "a-house-called-quest-part-003.mp3",
]);

const beatDownAugustSevenParts = buildPartUrls([
  "tbd_08_07_21-part-000.mp3",
  "tbd_08_07_21-part-001.mp3",
  "tbd_08_07_21-part-002.mp3",
  "tbd_08_07_21-part-003.mp3",
  "tbd_08_07_21-part-004.mp3",
  "tbd_08_07_21-part-005.mp3",
  "tbd_08_07_21-part-006.mp3",
  "tbd_08_07_21-part-007.mp3",
  "tbd_08_07_21-part-008.mp3",
  "tbd_08_07_21-part-009.mp3",
  "tbd_08_07_21-part-010.mp3",
  "tbd_08_07_21-part-011.mp3",
  "tbd_08_07_21-part-012.mp3",
]);

const beatDownAugustTwentyOneParts = buildPartUrls([
  "tbd_08_21_21-part-000.mp3",
  "tbd_08_21_21-part-001.mp3",
  "tbd_08_21_21-part-002.mp3",
  "tbd_08_21_21-part-003.mp3",
  "tbd_08_21_21-part-004.mp3",
]);

const beatDownFebruaryTwentySixPartOneParts = buildSequentialPartUrls(
  "tbd_2_26_22_part1",
  6,
);

const beatDownFebruaryTwentySixPartTwoParts = buildSequentialPartUrls(
  "tbd_2_26_22_part2",
  3,
);

const beatDownFebruaryTwentySixPartThreeParts = buildSequentialPartUrls(
  "tbd_2_26_22_part3",
  6,
);

const beatDownAprilThirtyPartOneParts = buildSequentialPartUrls(
  "tbd_4_30_22_part1",
  7,
);

const beatDownAprilThirtyPartTwoParts = buildSequentialPartUrls(
  "tbd_4_30_22_part2",
  7,
);

const beatDownMaySevenPartOneParts = buildSequentialPartUrls(
  "tbd_5_7_22_part1",
  4,
);

const beatDownJuneTwentyFiveParts = buildSequentialPartUrls("tbd_6_25_22", 19);

export const beatDownArchive: MusicArchiveItem[] = [
  {
    id: "a-house-called-quest",
    showSlug: "beatdown",
    showName: "The Beat Down",
    djSlug: "dj-hello-joey",
    djName: "DJ Hello Joey",
    host: "DJ Hello Joey",
    title: "A House Called Quest",
    artist: "DJ Hello Joey",
    audioUrl: aHouseCalledQuestParts[0],
    parts: aHouseCalledQuestParts,
    artwork: "/artwork/dj-hello-joey.jpg",
    date: "Archive",
  },
  {
    id: "tbd-08-07-21",
    showSlug: "beatdown",
    showName: "The Beat Down",
    djSlug: "dj-hello-joey",
    djName: "DJ Hello Joey",
    host: "DJ Hello Joey",
    title: "Beat Down — 08/07/21",
    artist: "DJ Hello Joey",
    audioUrl: beatDownAugustSevenParts[0],
    parts: beatDownAugustSevenParts,
    artwork: "/artwork/dj-hello-joey.jpg",
    date: "Archive",
  },
  {
    id: "tbd-08-21-21",
    showSlug: "beatdown",
    showName: "The Beat Down",
    djSlug: "dj-hello-joey",
    djName: "DJ Hello Joey",
    host: "DJ Hello Joey",
    title: "Beat Down — 08/21/21",
    artist: "DJ Hello Joey",
    audioUrl: beatDownAugustTwentyOneParts[0],
    parts: beatDownAugustTwentyOneParts,
    artwork: "/artwork/dj-hello-joey.jpg",
    date: "Archive",
  },
  {
    id: "tbd-02-26-22-part-1",
    showSlug: "beatdown",
    showName: "The Beat Down",
    djSlug: "dj-hello-joey",
    djName: "DJ Hello Joey",
    host: "DJ Hello Joey",
    title: "Beat Down — 02/26/22 Part 1",
    artist: "DJ Hello Joey",
    audioUrl: beatDownFebruaryTwentySixPartOneParts[0],
    parts: beatDownFebruaryTwentySixPartOneParts,
    artwork: "/artwork/dj-hello-joey.jpg",
    date: "Archive",
  },
  {
    id: "tbd-02-26-22-part-2",
    showSlug: "beatdown",
    showName: "The Beat Down",
    djSlug: "dj-hello-joey",
    djName: "DJ Hello Joey",
    host: "DJ Hello Joey",
    title: "Beat Down — 02/26/22 Part 2",
    artist: "DJ Hello Joey",
    audioUrl: beatDownFebruaryTwentySixPartTwoParts[0],
    parts: beatDownFebruaryTwentySixPartTwoParts,
    artwork: "/artwork/dj-hello-joey.jpg",
    date: "Archive",
  },
  {
    id: "tbd-02-26-22-part-3",
    showSlug: "beatdown",
    showName: "The Beat Down",
    djSlug: "dj-hello-joey",
    djName: "DJ Hello Joey",
    host: "DJ Hello Joey",
    title: "Beat Down — 02/26/22 Part 3",
    artist: "DJ Hello Joey",
    audioUrl: beatDownFebruaryTwentySixPartThreeParts[0],
    parts: beatDownFebruaryTwentySixPartThreeParts,
    artwork: "/artwork/dj-hello-joey.jpg",
    date: "Archive",
  },
  {
    id: "tbd-04-30-22-part-1",
    showSlug: "beatdown",
    showName: "The Beat Down",
    djSlug: "dj-hello-joey",
    djName: "DJ Hello Joey",
    host: "DJ Hello Joey",
    title: "Beat Down — 04/30/22 Part 1",
    artist: "DJ Hello Joey",
    audioUrl: beatDownAprilThirtyPartOneParts[0],
    parts: beatDownAprilThirtyPartOneParts,
    artwork: "/artwork/dj-hello-joey.jpg",
    date: "Archive",
  },
  {
    id: "tbd-04-30-22-part-2",
    showSlug: "beatdown",
    showName: "The Beat Down",
    djSlug: "dj-hello-joey",
    djName: "DJ Hello Joey",
    host: "DJ Hello Joey",
    title: "Beat Down — 04/30/22 Part 2",
    artist: "DJ Hello Joey",
    audioUrl: beatDownAprilThirtyPartTwoParts[0],
    parts: beatDownAprilThirtyPartTwoParts,
    artwork: "/artwork/dj-hello-joey.jpg",
    date: "Archive",
  },
  {
    id: "tbd-05-07-22-part-1",
    showSlug: "beatdown",
    showName: "The Beat Down",
    djSlug: "dj-hello-joey",
    djName: "DJ Hello Joey",
    host: "DJ Hello Joey",
    title: "Beat Down — 05/07/22 Part 1",
    artist: "DJ Hello Joey",
    audioUrl: beatDownMaySevenPartOneParts[0],
    parts: beatDownMaySevenPartOneParts,
    artwork: "/artwork/dj-hello-joey.jpg",
    date: "Archive",
  },
  {
    id: "tbd-06-25-22",
    showSlug: "beatdown",
    showName: "The Beat Down",
    djSlug: "dj-hello-joey",
    djName: "DJ Hello Joey",
    host: "DJ Hello Joey",
    title: "Beat Down — 06/25/22",
    artist: "DJ Hello Joey",
    audioUrl: beatDownJuneTwentyFiveParts[0],
    parts: beatDownJuneTwentyFiveParts,
    artwork: "/artwork/dj-hello-joey.jpg",
    date: "Archive",
  },
];

export const localMusicArchive = beatDownArchive;

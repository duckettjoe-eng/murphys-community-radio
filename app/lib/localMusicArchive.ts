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
];

export const localMusicArchive = beatDownArchive;

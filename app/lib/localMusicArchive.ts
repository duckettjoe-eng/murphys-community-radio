import { generatedMusicArchive } from "./generatedMusicArchive";

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
  externalUrl?: string;
  platform?: string;
};

type GeneratedMusicArchiveItem = {
  id: string;
  title: string;
  host: string;
  date: string;
  artwork: string;
  parts: string[];
};

export const beatDownArchive: MusicArchiveItem[] = [];

export const mixcloudArchive: MusicArchiveItem[] = [
  {
    id: "golden-hour-groove-2026-05-14",
    showSlug: "golden-hour-groove",
    showName: "Golden Hour Groove",
    djSlug: "dj-hello-joey",
    djName: "DJ Hello Joey",
    host: "DJ Hello Joey",
    title: "Golden Hour Groove 5.14.26",
    artist: "DJ Hello Joey",
    audioUrl: "",
    parts: [],
    artwork:
      "https://thumbnailer.mixcloud.com/unsafe/600x600/extaudio/a/2/b/6/ee13-cad7-4ee0-8e9f-cf2fdc0daed0",
    date: "May 14, 2026",
    externalUrl:
      "https://www.mixcloud.com/djhellojoey/golden-era-groove-51426/",
    platform: "Mixcloud",
  },
  {
    id: "alt-rock-bar-room-2026-05-14",
    showSlug: "alt-rock-barroom-radio",
    showName: "Alt-Rock Barroom Radio",
    djSlug: "dj-hello-joey",
    djName: "DJ Hello Joey",
    host: "DJ Hello Joey",
    title: "Alt Rock Bar Room 5.14.26",
    artist: "DJ Hello Joey",
    audioUrl: "",
    parts: [],
    artwork:
      "https://thumbnailer.mixcloud.com/unsafe/600x600/extaudio/8/b/7/8/30fa-5248-4da1-9a19-ab18d6161ea4",
    date: "May 14, 2026",
    externalUrl:
      "https://www.mixcloud.com/djhellojoey/bar-room-jukebox-51426/",
    platform: "Mixcloud",
  },
];

const generatedBeatDownArchive: MusicArchiveItem[] = (
  generatedMusicArchive as GeneratedMusicArchiveItem[]
)
  .filter((item) => item.parts.length > 0)
  .map((item) => ({
    id: item.id,
    showSlug: "beatdown",
    showName: "The Beat Down",
    djSlug: "dj-hello-joey",
    djName: item.host,
    host: item.host,
    title: item.title,
    artist: item.host,
    audioUrl: item.parts[0],
    parts: item.parts,
    artwork: item.artwork,
    date: item.date,
  }));

export const localMusicArchive = [
  ...mixcloudArchive,
  ...beatDownArchive,
  ...generatedBeatDownArchive,
];

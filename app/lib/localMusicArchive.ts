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
  ...beatDownArchive,
  ...generatedBeatDownArchive,
];

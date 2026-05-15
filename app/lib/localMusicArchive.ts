import { generatedMusicArchive } from "./generatedMusicArchive";
import { generatedMixcloudArchive } from "./generatedMixcloudArchive";

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

type GeneratedMixcloudArchiveItem = {
  id: string;
  showSlug: string;
  showName: string;
  title: string;
  host: string;
  date: string;
  artwork: string;
  externalUrl: string;
  platform: string;
};

export const beatDownArchive: MusicArchiveItem[] = [];

export const mixcloudArchive: MusicArchiveItem[] = (
  generatedMixcloudArchive as GeneratedMixcloudArchiveItem[]
).map((item) => ({
  id: item.id,
  showSlug: item.showSlug,
  showName: item.showName,
  djSlug: "dj-hello-joey",
  djName: item.host,
  host: item.host,
  title: item.title,
  artist: item.host,
  audioUrl: "",
  parts: [],
  artwork: item.artwork,
  date: item.date,
  externalUrl: item.externalUrl,
  platform: item.platform,
}));

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

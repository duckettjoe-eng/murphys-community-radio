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
  sourceId?: string;
  sourceLabel?: string;
  mixcloudUsername?: string;
  mixcloudKey?: string;
  mixcloudUrl?: string;
  embedUrl?: string;
  imageUrl?: string;
  publishedAt?: string;
  createdAt?: string;
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
  djName?: string;
  sourceId?: string;
  sourceLabel?: string;
  mixcloudUsername?: string;
  mixcloudKey?: string;
  mixcloudUrl?: string;
  embedUrl?: string;
  imageUrl?: string;
  publishedAt?: string;
  createdAt?: string;
  date: string;
  artwork: string;
  externalUrl?: string;
  platform: string;
};

export const beatDownArchive: MusicArchiveItem[] = [];

export const mixcloudArchive: MusicArchiveItem[] = (
  generatedMixcloudArchive as GeneratedMixcloudArchiveItem[]
).map((item) => ({
  id: item.id,
  showSlug: item.showSlug,
  showName: item.showName,
  djSlug: item.sourceId || "dj-hello-joey",
  djName: item.djName || item.host,
  host: item.host,
  title: item.title,
  artist: item.host,
  audioUrl: "",
  parts: [],
  artwork: item.artwork || item.imageUrl || "/artwork/dj-hello-joey.jpg",
  date: item.date,
  externalUrl: item.externalUrl || item.mixcloudUrl,
  platform: item.platform,
  sourceId: item.sourceId,
  sourceLabel: item.sourceLabel,
  mixcloudUsername: item.mixcloudUsername,
  mixcloudKey: item.mixcloudKey,
  mixcloudUrl: item.mixcloudUrl || item.externalUrl,
  embedUrl: item.embedUrl,
  imageUrl: item.imageUrl || item.artwork,
  publishedAt: item.publishedAt,
  createdAt: item.createdAt,
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

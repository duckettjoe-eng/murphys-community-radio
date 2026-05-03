export type MusicArchiveItem = {
  showSlug: string;
  showName: string;
  djSlug: string;
  djName: string;
  title: string;
  artist: string;
  filePath: string;
  audioParts: string[];
  artwork: string;
  date: string;
};

const archiveBaseUrl =
  "https://pkvgpbbxihbhiammovzh.supabase.co/storage/v1/object/public/radio-archive";

export const beatDownArchive: MusicArchiveItem[] = [
  {
    showSlug: "beatdown",
    showName: "The Beat Down",
    djSlug: "dj-hello-joey",
    djName: "DJ Hello Joey",
    title: "A House Called Quest",
    artist: "DJ Hello Joey",
    filePath: `${archiveBaseUrl}/beatdown/dj-hello-joey/a-house-called-quest-part-000.mp3`,
    audioParts: [
      `${archiveBaseUrl}/beatdown/dj-hello-joey/a-house-called-quest-part-000.mp3`,
      `${archiveBaseUrl}/beatdown/dj-hello-joey/a-house-called-quest-part-001.mp3`,
      `${archiveBaseUrl}/beatdown/dj-hello-joey/a-house-called-quest-part-002.mp3`,
      `${archiveBaseUrl}/beatdown/dj-hello-joey/a-house-called-quest-part-003.mp3`,
    ],
    artwork: "/artwork/beatdown/dj-hello-joey.jpg",
    date: "2026-05-03",
  },
];

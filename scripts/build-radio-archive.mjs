#!/usr/bin/env node

import { execFile } from "node:child_process";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const SUPABASE_AUDIO_BASE =
  "https://pkvgpbbxihbhiammovzh.supabase.co/storage/v1/object/public/radio-archive";

const projectRoot = process.cwd();
const incomingDir = path.join(projectRoot, "incoming-audio");
const convertedDir = path.join(projectRoot, "converted-audio");
const archiveOutputPath = path.join(
  projectRoot,
  "app",
  "lib",
  "generatedMusicArchive.ts",
);

const supportedExtensions = new Set([".mp3", ".wav"]);

const slugify = (value) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const titleFromSlug = (slug) =>
  slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const readAudioSources = async () => {
  try {
    const entries = await readdir(incomingDir, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((fileName) =>
        supportedExtensions.has(path.extname(fileName).toLowerCase()),
      )
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
};

const removeExistingChunks = async (slug) => {
  const entries = await readdir(convertedDir, { withFileTypes: true });
  const matchingChunks = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => fileName.startsWith(`${slug}-part-`));

  await Promise.all(
    matchingChunks.map((fileName) =>
      rm(path.join(convertedDir, fileName), { force: true }),
    ),
  );
};

const convertToChunks = async (sourceFileName, slug) => {
  const sourcePath = path.join(incomingDir, sourceFileName);
  const outputPattern = path.join(convertedDir, `${slug}-part-%03d.mp3`);

  await removeExistingChunks(slug);

  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    sourcePath,
    "-vn",
    "-ac",
    "1",
    "-b:a",
    "64k",
    "-f",
    "segment",
    "-segment_time",
    "600",
    "-reset_timestamps",
    "1",
    outputPattern,
  ]);

  const convertedFiles = await readdir(convertedDir);

  return convertedFiles
    .filter((fileName) => fileName.startsWith(`${slug}-part-`))
    .filter((fileName) => fileName.endsWith(".mp3"))
    .sort((a, b) => a.localeCompare(b));
};

const renderArchiveFile = (shows) => `export const generatedMusicArchive = ${JSON.stringify(
  shows,
  null,
  2,
)};
`;

const main = async () => {
  await mkdir(incomingDir, { recursive: true });
  await mkdir(convertedDir, { recursive: true });

  const sourceFiles = await readAudioSources();
  const shows = [];

  for (const sourceFileName of sourceFiles) {
    const sourceName = path.basename(
      sourceFileName,
      path.extname(sourceFileName),
    );
    const slug = slugify(sourceName);

    if (!slug) {
      console.warn(`Skipping ${sourceFileName}: could not create a safe slug.`);
      continue;
    }

    console.log(`Converting ${sourceFileName} into 10-minute MP3 chunks...`);

    const convertedFileNames = await convertToChunks(sourceFileName, slug);

    shows.push({
      id: slug,
      title: titleFromSlug(slug),
      host: "DJ Hello Joey",
      date: "Archive",
      artwork: "/artwork/dj-hello-joey.jpg",
      parts: convertedFileNames.map(
        (fileName) => `${SUPABASE_AUDIO_BASE}/${fileName}`,
      ),
    });
  }

  await writeFile(archiveOutputPath, renderArchiveFile(shows));

  console.log(
    `Generated ${path.relative(projectRoot, archiveOutputPath)} with ${shows.length} archive item(s).`,
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

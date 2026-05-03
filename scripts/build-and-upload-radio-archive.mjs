#!/usr/bin/env node

import { execFile } from "node:child_process";
import { readFile, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { createClient } from "@supabase/supabase-js";

const execFileAsync = promisify(execFile);

const SUPABASE_AUDIO_BASE =
  "https://pkvgpbbxihbhiammovzh.supabase.co/storage/v1/object/public/radio-archive";
const SUPABASE_BUCKET = "radio-archive";

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

const requiredEnv = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

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

const uploadChunk = async (supabase, fileName) => {
  const filePath = path.join(convertedDir, fileName);
  const fileData = await readFile(filePath);

  const { error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(fileName, fileData, {
      contentType: "audio/mpeg",
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload ${fileName}: ${error.message}`);
  }

  return `${SUPABASE_AUDIO_BASE}/${fileName}`;
};

const renderArchiveFile = (shows) => `export const generatedMusicArchive = ${JSON.stringify(
  shows,
  null,
  2,
)};
`;

const assertEnvironment = () => {
  const missingEnv = requiredEnv.filter((name) => !process.env[name]);

  if (missingEnv.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missingEnv.join(", ")}`,
    );
  }
};

const main = async () => {
  assertEnvironment();

  await mkdir(incomingDir, { recursive: true });
  await mkdir(convertedDir, { recursive: true });

  const sourceFiles = await readAudioSources();
  console.log(`Files found: ${sourceFiles.length}`);

  if (sourceFiles.length === 0) {
    console.log("Drop WAV or MP3 files into incoming-audio/ and run again.");
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

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
    console.log(
      `Chunks created for ${sourceFileName}: ${convertedFileNames.length}`,
    );

    const parts = [];

    for (const fileName of convertedFileNames) {
      console.log(`Uploading ${fileName} to ${SUPABASE_BUCKET}...`);
      const publicUrl = await uploadChunk(supabase, fileName);
      parts.push(publicUrl);
    }

    console.log(`Uploads completed for ${sourceFileName}: ${parts.length}`);

    shows.push({
      id: slug,
      title: titleFromSlug(slug),
      host: "DJ Hello Joey",
      date: "Archive",
      artwork: "/artwork/dj-hello-joey.jpg",
      parts,
    });
  }

  await writeFile(archiveOutputPath, renderArchiveFile(shows));

  console.log(
    `Generated archive file: ${path.relative(projectRoot, archiveOutputPath)}`,
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

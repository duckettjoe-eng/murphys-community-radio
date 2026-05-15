#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const MIXCLOUD_USERNAME = "djhellojoey";
const MIXCLOUD_LIMIT = 20;

const projectRoot = process.cwd();
const archiveOutputPath = path.join(
  projectRoot,
  "app",
  "lib",
  "generatedMixcloudArchive.ts",
);

const showMatchers = [
  {
    showSlug: "golden-hour-groove",
    showName: "Golden Hour Groove",
    patterns: [/golden\s+(hour|era)\s+groove/i],
  },
  {
    showSlug: "alt-rock-barroom-radio",
    showName: "Alt-Rock Barroom Radio",
    patterns: [/alt\s*rock\s+bar\s*room/i, /bar\s*room\s+jukebox/i],
  },
  {
    showSlug: "dusty-crate-hip-hop-hour",
    showName: "Dusty Crate Hip-Hop Hour",
    patterns: [/dusty\s+crate/i],
  },
  {
    showSlug: "house-party-frequency",
    showName: "House Party Frequency",
    patterns: [/house\s+party\s+frequency/i],
  },
  {
    showSlug: "weird-late-night-fm",
    showName: "Weird Late-Night FM",
    patterns: [/weird\s+late\s*night/i],
  },
  {
    showSlug: "cali-sun-reggae-ride",
    showName: "Cali Sun Reggae Ride",
    patterns: [/cali\s+sun\s+reggae/i],
  },
  {
    showSlug: "mashup-crate-hour",
    showName: "Mashup Crate Hour",
    patterns: [/mashup\s+crate/i],
  },
  {
    showSlug: "campfire-americana",
    showName: "Campfire Americana",
    patterns: [/campfire\s+americana/i],
  },
  {
    showSlug: "lowrider-soul-sunday",
    showName: "Lowrider Soul Sunday",
    patterns: [/lowrider\s+soul/i],
  },
  {
    showSlug: "skull-county-garage-gospel",
    showName: "Skull County Garage Gospel",
    patterns: [/skull\s+county\s+garage\s+gospel/i],
  },
];

const slugFromKey = (key) => key.split("/").filter(Boolean).at(-1) || "";

const formatDate = (value) => {
  if (!value) return "Archive";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Los_Angeles",
  }).format(new Date(value));
};

const matchShow = (cloudcast) =>
  showMatchers.find((show) =>
    show.patterns.some(
      (pattern) => pattern.test(cloudcast.name) || pattern.test(cloudcast.slug),
    ),
  );

const fetchCloudcasts = async () => {
  const url = new URL(
    `https://api.mixcloud.com/${MIXCLOUD_USERNAME}/cloudcasts/`,
  );
  url.searchParams.set("limit", String(MIXCLOUD_LIMIT));

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Mixcloud cloudcasts fetch failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  return Array.isArray(data.data) ? data.data : [];
};

const loadExistingArchive = async () => {
  try {
    const source = await readFile(archiveOutputPath, "utf8");
    const json = source
      .replace(/^export const generatedMixcloudArchive = /, "")
      .replace(/;\s*$/, "");

    return JSON.parse(json);
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
};

const renderArchiveFile = (items) => `export const generatedMixcloudArchive = ${JSON.stringify(
  items,
  null,
  2,
)};
`;

const main = async () => {
  const [cloudcasts, existingItems] = await Promise.all([
    fetchCloudcasts(),
    loadExistingArchive(),
  ]);

  const existingUrls = new Set(existingItems.map((item) => item.externalUrl));

  const newItems = cloudcasts
    .map((cloudcast) => {
      const matchedShow = matchShow(cloudcast);
      if (!matchedShow || existingUrls.has(cloudcast.url)) return null;

      return {
        id: cloudcast.slug || slugFromKey(cloudcast.key),
        showSlug: matchedShow.showSlug,
        showName: matchedShow.showName,
        title: cloudcast.name,
        host: cloudcast.user?.name || "DJ Hello Joey",
        date: formatDate(cloudcast.created_time),
        artwork:
          cloudcast.pictures?.extra_large ||
          cloudcast.pictures?.["640wx640h"] ||
          cloudcast.pictures?.large ||
          "/artwork/dj-hello-joey.jpg",
        externalUrl: cloudcast.url,
        platform: "Mixcloud",
      };
    })
    .filter(Boolean);

  const nextItems = [...newItems, ...existingItems];

  await writeFile(archiveOutputPath, renderArchiveFile(nextItems));

  if (newItems.length === 0) {
    console.log("No new matching Mixcloud shows found.");
    return;
  }

  console.log(`Added ${newItems.length} Mixcloud archive item(s):`);
  newItems.forEach((item) => console.log(`- ${item.showName}: ${item.title}`));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

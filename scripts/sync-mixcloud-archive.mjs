#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import path from "node:path";

const MIXCLOUD_LIMIT = 100;

// Update Mixcloud usernames here when station or DJ source pages change.
const MIXCLOUD_SOURCES = [
  {
    id: "skull-county-radio",
    label: "Skull County Radio",
    username: "skullcountyradio",
    djName: "Skull County Radio",
    includeAllUploads: true,
  },
  {
    id: "dj-hello-joey",
    label: "DJ Hello Joey",
    username: "djhellojoey",
    djName: "DJ Hello Joey",
    includeAllUploads: true,
  },
  {
    id: "dj-aquarobotics",
    label: "DJ Aquarobotics",
    username: "gdyken",
    djName: "DJ Aquarobotics",
    includeAllUploads: true,
  },
];

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

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

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

const getImageUrl = (cloudcast) =>
  cloudcast.pictures?.extra_large ||
  cloudcast.pictures?.["640wx640h"] ||
  cloudcast.pictures?.large ||
  cloudcast.pictures?.medium ||
  cloudcast.pictures?.thumbnail ||
  "";

const getPublishedAt = (cloudcast) =>
  cloudcast.publish_date ||
  cloudcast.published_time ||
  cloudcast.created_time ||
  "";

const fetchCloudcastsForSource = async (source) => {
  const cloudcasts = [];
  let nextUrl = new URL(
    `https://api.mixcloud.com/${source.username}/cloudcasts/`,
  );
  nextUrl.searchParams.set("limit", String(MIXCLOUD_LIMIT));

  while (nextUrl) {
    const response = await fetch(nextUrl);

    if (!response.ok) {
      throw new Error(
        `Mixcloud cloudcasts fetch failed for ${source.username}: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    if (Array.isArray(data.data)) {
      cloudcasts.push(...data.data);
    }

    nextUrl = data.paging?.next ? new URL(data.paging.next) : null;
  }

  return cloudcasts;
};

const buildArchiveItem = (source, cloudcast) => {
  const matchedShow = matchShow(cloudcast);
  if (!source.includeAllUploads && !matchedShow) return null;

  const mixcloudKey = cloudcast.key || "";
  const mixcloudUrl = cloudcast.url || "";
  const cloudcastSlug = cloudcast.slug || slugFromKey(mixcloudKey);
  const title = cloudcast.name || "Untitled Mixcloud Upload";
  const showName = matchedShow?.showName || title;
  const showSlug = matchedShow?.showSlug || slugify(showName || cloudcastSlug);
  const imageUrl = getImageUrl(cloudcast);
  const publishedAt = getPublishedAt(cloudcast);
  const createdAt = cloudcast.created_time || publishedAt;

  return {
    id: `${source.id}-${cloudcastSlug || slugify(title)}`,
    title,
    showName,
    showSlug,
    host: source.djName,
    djName: source.djName,
    sourceId: source.id,
    sourceLabel: source.label,
    mixcloudUsername: source.username,
    mixcloudKey,
    mixcloudUrl,
    embedUrl: cloudcast.embed_url || cloudcast.embedUrl || "",
    imageUrl,
    publishedAt,
    createdAt,
    date: formatDate(publishedAt || createdAt),
    artwork: imageUrl || "/artwork/dj-hello-joey.jpg",
    externalUrl: mixcloudUrl,
    platform: "Mixcloud",
  };
};

const dedupeArchiveItems = (items) => {
  const seenKeys = new Set();
  const seenUrls = new Set();
  const dedupedItems = [];

  for (const item of items) {
    const key = item.mixcloudKey || "";
    const url = item.mixcloudUrl || "";
    if ((key && seenKeys.has(key)) || (url && seenUrls.has(url))) continue;

    if (key) seenKeys.add(key);
    if (url) seenUrls.add(url);
    dedupedItems.push(item);
  }

  return dedupedItems;
};

const renderArchiveFile = (items) => `export const generatedMixcloudArchive = ${JSON.stringify(
  items,
  null,
  2,
)};
`;

const main = async () => {
  const sourceResults = await Promise.all(
    MIXCLOUD_SOURCES.map(async (source) => ({
      source,
      cloudcasts: await fetchCloudcastsForSource(source),
    })),
  );

  const archiveItems = sourceResults
    .flatMap(({ source, cloudcasts }) =>
      cloudcasts.map((cloudcast) => buildArchiveItem(source, cloudcast)),
    )
    .filter(Boolean);

  const nextItems = dedupeArchiveItems(archiveItems).sort((a, b) => {
    const aTime = Date.parse(a.publishedAt || a.createdAt || "") || 0;
    const bTime = Date.parse(b.publishedAt || b.createdAt || "") || 0;
    return bTime - aTime;
  });

  await writeFile(archiveOutputPath, renderArchiveFile(nextItems));

  console.log(`Generated ${nextItems.length} Mixcloud archive item(s).`);
  sourceResults.forEach(({ source, cloudcasts }) =>
    console.log(`- ${source.label}: ${cloudcasts.length} upload(s)`),
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

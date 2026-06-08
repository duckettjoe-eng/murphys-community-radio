#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

const MIXCLOUD_LIMIT = 100;
const DEFAULT_SLUGS = ["skullcountyradio"];

const sourceProfiles = {
  skullcountyradio: {
    stationName: "Skull County Radio",
  },
};

const hostProfiles = {
  djhellojoey: {
    displayName: "DJ Hello Joey",
    patterns: [/\bdj\s*hello\s*joey\b/i, /\bdjhellojoey\b/i],
  },
  gdyken: {
    displayName: "DJ Aquarobotics",
    patterns: [/\baquarobotics\b/i],
  },
  dj_donette_g: {
    displayName: "DJ Donette G",
    patterns: [
      /\bdj\s*donette\s*g\b/i,
      /\bdj[_\s-]*donette[_\s-]*g\b/i,
      /\blife\s+of\s+a\s+g\b/i,
    ],
  },
  "g-dyken": {
    displayName: "G Dyken",
    patterns: [/\bg\s*dyken\b/i],
  },
};

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
    patterns: [/weird\s+late[-\s]*night/i],
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

function configuredSlugs() {
  const configured = process.env.MIXCLOUD_ARCHIVE_SLUGS?.split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);

  const slugs = configured?.length ? configured : DEFAULT_SLUGS;
  const uniqueSlugs = new Map(
    slugs.map((slug) => [slug.toLowerCase(), slug]),
  );

  return Array.from(uniqueSlugs.values());
}

function sourceForSlug(accountSlug) {
  const profile = sourceProfiles[accountSlug.toLowerCase()];
  const fallbackLabel = accountSlug
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return {
    accountSlug,
    stationName: profile?.stationName || fallbackLabel,
  };
}

async function fetchCloudcasts(accountSlug) {
  const cloudcasts = [];
  let nextUrl = new URL(
    `https://api.mixcloud.com/${encodeURIComponent(accountSlug)}/cloudcasts/`,
  );
  nextUrl.searchParams.set("limit", String(MIXCLOUD_LIMIT));

  while (nextUrl) {
    const response = await fetch(nextUrl);

    if (!response.ok) {
      throw new Error(
        `Mixcloud fetch failed for ${accountSlug}: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    if (Array.isArray(data.data)) cloudcasts.push(...data.data);
    nextUrl = data.paging?.next ? new URL(data.paging.next) : null;
  }

  return Promise.all(
    cloudcasts.map(async (cloudcast) => {
      const response = await fetch(`https://api.mixcloud.com${cloudcast.key}`);

      if (!response.ok) {
        throw new Error(
          `Mixcloud detail fetch failed for ${cloudcast.key}: ${response.status} ${response.statusText}`,
        );
      }

      return response.json();
    }),
  );
}

function buildEpisode(source, cloudcast) {
  const mixcloudKey = clean(cloudcast.key);
  const episodeUrl = clean(cloudcast.url);

  if (!mixcloudKey || !episodeUrl) return null;

  const matchedShow = matchShow(cloudcast);
  const stationName =
    clean(cloudcast.user?.name) || source.stationName || "Skull County Radio";
  const host = getHost(cloudcast);
  const cloudcastSlug =
    clean(cloudcast.slug) || mixcloudKey.split("/").filter(Boolean).at(-1) || "";
  const episodeTitle = clean(cloudcast.name) || "Untitled Mixcloud Upload";
  const showName = matchedShow?.showName || episodeTitle;
  const artworkUrl = getImageUrl(cloudcast);
  const publishedAt = getPublishedAt(cloudcast);

  return {
    status: "published",
    platform: "Mixcloud",
    account_slug:
      clean(cloudcast.user?.username) || source.accountSlug,
    station_name: stationName,
    source_id: slugify(host.displayName),
    source_label: stationName,
    host_name: host.displayName,
    host_username: host.username || null,
    show_name: showName,
    show_slug: matchedShow?.showSlug || slugify(showName || cloudcastSlug),
    episode_title: episodeTitle,
    episode_url: episodeUrl,
    mixcloud_key: mixcloudKey,
    published_at: publishedAt || null,
    source_created_at: clean(cloudcast.created_time) || publishedAt || null,
    artwork_url: artworkUrl || null,
    embed_url: clean(cloudcast.embed_url || cloudcast.embedUrl) || null,
    description: clean(cloudcast.description) || null,
    tags: Array.isArray(cloudcast.tags)
      ? cloudcast.tags.map((tag) => clean(tag.name)).filter(Boolean)
      : [],
    synced_at: new Date().toISOString(),
  };
}

function matchShow(cloudcast) {
  return showMatchers.find((show) =>
    show.patterns.some(
      (pattern) =>
        pattern.test(cloudcast.name || "") ||
        pattern.test(cloudcast.slug || ""),
    ),
  );
}

function getHost(cloudcast) {
  const directHost = Array.isArray(cloudcast.hosts)
    ? cloudcast.hosts.find((host) => host?.username || host?.name)
    : null;

  if (directHost) {
    const username = clean(directHost.username);
    const profile = hostProfiles[username.toLowerCase()];

    return {
      username,
      displayName:
        profile?.displayName ||
        clean(directHost.name) ||
        formatDisplayName(username),
    };
  }

  const searchableText = [
    cloudcast.name,
    cloudcast.description,
    ...(Array.isArray(cloudcast.tags)
      ? cloudcast.tags.map((tag) => tag?.name)
      : []),
  ]
    .filter(Boolean)
    .join(" ");

  for (const [username, profile] of Object.entries(hostProfiles)) {
    if (profile.patterns.some((pattern) => pattern.test(searchableText))) {
      return {
        username,
        displayName: profile.displayName,
      };
    }
  }

  return {
    username: "",
    displayName: "Unknown Host",
  };
}

function formatDisplayName(value) {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getImageUrl(cloudcast) {
  return clean(
    cloudcast.pictures?.extra_large ||
      cloudcast.pictures?.["640wx640h"] ||
      cloudcast.pictures?.large ||
      cloudcast.pictures?.medium ||
      cloudcast.pictures?.thumbnail,
  );
}

function getPublishedAt(cloudcast) {
  return clean(
    cloudcast.publish_date ||
      cloudcast.published_time ||
      cloudcast.created_time,
  );
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const slugs = configuredSlugs();
  const sourceResults = await Promise.all(
    slugs.map(async (accountSlug) => {
      const source = sourceForSlug(accountSlug);
      const cloudcasts = await fetchCloudcasts(accountSlug);
      return { source, cloudcasts };
    }),
  );
  const fetchedEpisodes = sourceResults
    .flatMap(({ source, cloudcasts }) =>
      cloudcasts.map((cloudcast) => buildEpisode(source, cloudcast)),
    )
    .filter(Boolean);
  const uniqueEpisodes = Array.from(
    new Map(
      fetchedEpisodes.map((episode) => [episode.mixcloud_key, episode]),
    ).values(),
  );

  if (uniqueEpisodes.length > 0) {
    const { error: upsertError } = await supabase
      .from("archive_episodes")
      .upsert(uniqueEpisodes, {
        onConflict: "mixcloud_key",
      });

    if (upsertError) throw upsertError;
  }

  console.log(
    `Mixcloud archive sync: ${fetchedEpisodes.length} fetched, ${uniqueEpisodes.length} stored.`,
  );
  sourceResults.forEach(({ source, cloudcasts }) => {
    console.log(`- ${source.accountSlug}: ${cloudcasts.length} upload(s)`);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

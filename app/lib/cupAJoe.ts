export const CUP_A_JOE_CATEGORIES = [
  "Local News",
  "Events",
  "Weather",
  "Roads",
  "Schools",
  "Community",
  "Sports",
  "Weird/Fun",
] as const;

export const CUP_A_JOE_SEGMENTS = [
  "Opening",
  "Local Headlines",
  "Events",
  "Community Notes",
  "Music Breaks",
  "Closing",
] as const;

export type CupAJoeItem = {
  id: string;
  created_at: string;
  show_date: string;
  use_in_show: boolean;
  category: string | null;
  title: string;
  source: string | null;
  url: string | null;
  summary: string | null;
  joe_notes: string | null;
  segment: string;
  sort_order: number;
};

export type CupAJoeItemInput = Omit<CupAJoeItem, "id" | "created_at">;

export type ScriptSegment = {
  name: string;
  text: string;
  itemIds: string[];
};

export function localDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function sortCupAJoeItems(items: CupAJoeItem[]) {
  return [...items].sort((a, b) => {
    const segmentDifference =
      segmentIndex(a.segment) - segmentIndex(b.segment);

    if (segmentDifference !== 0) return segmentDifference;
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;

    return a.created_at.localeCompare(b.created_at);
  });
}

export function groupCupAJoeItems(items: CupAJoeItem[]) {
  const sorted = sortCupAJoeItems(items);

  return CUP_A_JOE_SEGMENTS.map((segment) => ({
    segment,
    items: sorted.filter((item) => item.segment === segment),
  })).filter((group) => group.items.length > 0);
}

export function buildScriptSegments(items: CupAJoeItem[]): ScriptSegment[] {
  return groupCupAJoeItems(items).map(({ segment, items: segmentItems }) => ({
    name: segment,
    itemIds: segmentItems.map((item) => item.id),
    text: [
      segment.toUpperCase(),
      ...segmentItems.map(buildItemScript),
    ].join("\n\n"),
  }));
}

export function buildFullScript(items: CupAJoeItem[]) {
  return buildScriptSegments(items)
    .map((segment) => segment.text)
    .join("\n\n---\n\n");
}

function segmentIndex(segment: string) {
  const index = CUP_A_JOE_SEGMENTS.indexOf(
    segment as (typeof CUP_A_JOE_SEGMENTS)[number],
  );

  return index === -1 ? CUP_A_JOE_SEGMENTS.length : index;
}

function buildItemScript(item: CupAJoeItem) {
  const lines = [item.title.trim()];

  if (item.summary?.trim()) {
    lines.push(item.summary.trim());
  }

  if (item.joe_notes?.trim()) {
    lines.push(`JOE'S NOTES: ${item.joe_notes.trim()}`);
  }

  const attribution = [item.source?.trim(), item.url?.trim()]
    .filter(Boolean)
    .join(" - ");

  if (attribution) {
    lines.push(`SOURCE: ${attribution}`);
  }

  return lines.join("\n");
}

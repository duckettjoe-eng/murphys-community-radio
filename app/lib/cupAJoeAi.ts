import "server-only";

import type {
  CupAJoeItem,
  CupAJoeTalkingPoints,
  ScriptSegment,
} from "@/app/lib/cupAJoe";

const defaultModel = "gemini-2.5-flash";

type GeminiErrorDetails = {
  code?: number;
  status?: string;
};

class GeminiGenerationError extends Error {
  details: GeminiErrorDetails;

  constructor(message: string, details: GeminiErrorDetails = {}) {
    super(message);
    this.name = "GeminiGenerationError";
    this.details = details;
  }
}

type GeminiPart = {
  text?: string;
};

type GeminiCandidate = {
  content?: {
    parts?: GeminiPart[];
  };
};

type GeminiApiResponse = {
  candidates?: GeminiCandidate[];
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

type GeminiRequest = {
  contents: Array<{
    role: "user";
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig: {
    responseMimeType: "application/json";
    responseJsonSchema: Record<string, unknown>;
  };
};

export async function generateTalkingPoints(item: CupAJoeItem) {
  const result = await requestStructuredOutput<CupAJoeTalkingPoints>({
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "headline",
        "summary",
        "local_relevance",
        "listener_question",
        "transition",
      ],
      properties: {
        headline: { type: "string" },
        summary: { type: "string" },
        local_relevance: { type: "string" },
        listener_question: { type: "string" },
        transition: { type: "string" },
      },
    },
    instructions: sourceOnlyInstructions,
    input: JSON.stringify({
      task: "Create concise on-air talking points for this approved item.",
      rules: [
        "Use only the supplied item fields.",
        "Do not add or infer facts, people, dates, places, causes, outcomes, or event details.",
        "If local relevance is not supported by the item, say that it is not specified in the saved item.",
        "The listener question may invite opinion but must not assert a new fact.",
        "The transition must be a neutral segue and must not introduce new information.",
      ],
      item: sourceItem(item),
    }),
  });

  return result;
}

export async function generateShowScript(items: CupAJoeItem[]) {
  const result = await requestStructuredOutput<{
    segments: Array<{ name: string; text: string; item_ids: string[] }>;
  }>({
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["segments"],
      properties: {
        segments: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "text", "item_ids"],
            properties: {
              name: { type: "string" },
              text: { type: "string" },
              item_ids: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
        },
      },
    },
    instructions: sourceOnlyInstructions,
    input: JSON.stringify({
      task: "Write a warm, conversational radio show script.",
      rules: [
        "Use only the supplied approved items and their saved talking points.",
        "Do not invent news, events, people, dates, places, quotes, context, or facts.",
        "Keep items in the supplied segment and sort order.",
        "Every segment must cite only item_ids supplied in that segment.",
        "Use neutral connective language when a transition is not supplied.",
        "Do not add an opening, closing, station identification, weather, or commentary unless supported by a supplied item.",
      ],
      segments: groupSourceItems(items),
    }),
  });
  const allowedIds = new Set(items.map((item) => item.id));
  const segments: ScriptSegment[] = result.value.segments.map((segment) => ({
    name: segment.name,
    text: segment.text.trim(),
    itemIds: segment.item_ids.filter((id) => allowedIds.has(id)),
  }));

  if (segments.length === 0 || segments.some((segment) => !segment.text)) {
    throw new Error("The AI response did not contain a usable show script.");
  }

  return {
    segments,
    script: segments.map((segment) => segment.text).join("\n\n---\n\n"),
    model: result.model,
  };
}

const sourceOnlyInstructions = [
  "You are preparing Murphys Community Radio copy from a closed set of saved records.",
  "Treat the supplied JSON as the only source of truth.",
  "Never use outside knowledge.",
  "Never invent or assume facts.",
  "When information is absent, omit it or explicitly state that it is not specified in the saved item.",
].join(" ");

async function requestStructuredOutput<T>({
  schema,
  instructions,
  input,
}: {
  schema: Record<string, unknown>;
  instructions: string;
  input: string;
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || defaultModel;

  if (!apiKey) {
    throw new GeminiGenerationError(
      "AI generation is not configured yet. Add GEMINI_API_KEY and try again.",
    );
  }

  let response: Response;

  try {
    const requestBody: GeminiRequest = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${instructions}\n\nSOURCE DATA:\n${input}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseJsonSchema: schema,
      },
    };

    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(requestBody),
        cache: "no-store",
      },
    );
  } catch {
    throw new GeminiGenerationError(
      "AI generation is temporarily unavailable. Please try again shortly.",
    );
  }

  const data = (await response.json().catch(() => ({}))) as GeminiApiResponse;

  if (!response.ok) {
    if (
      response.status === 429 ||
      data.error?.code === 429 ||
      data.error?.status === "RESOURCE_EXHAUSTED"
    ) {
      throw new GeminiGenerationError(
        "The AI generation quota is temporarily unavailable. Please try again later.",
        {
          code: data.error?.code,
          status: data.error?.status,
        },
      );
    }

    throw new GeminiGenerationError(
      "AI generation could not be completed. Please try again.",
      {
        code: data.error?.code,
        status: data.error?.status,
      },
    );
  }

  const outputText = data.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!outputText) {
    throw new GeminiGenerationError(
      "AI generation returned no usable content. Please try again.",
    );
  }

  let value: T;

  try {
    value = JSON.parse(outputText) as T;
  } catch {
    throw new GeminiGenerationError(
      "AI generation returned an unexpected format. Please try again.",
    );
  }

  return {
    value,
    model,
  };
}

function sourceItem(item: CupAJoeItem) {
  return {
    id: item.id,
    show_date: item.show_date,
    category: item.category,
    title: item.title,
    source: item.source,
    url: item.url,
    summary: item.summary,
    joe_notes: item.joe_notes,
    segment: item.segment,
    sort_order: item.sort_order,
    talking_points: item.talking_points,
  };
}

function groupSourceItems(items: CupAJoeItem[]) {
  const groups = new Map<string, ReturnType<typeof sourceItem>[]>();

  for (const item of items) {
    const group = groups.get(item.segment) ?? [];
    group.push(sourceItem(item));
    groups.set(item.segment, group);
  }

  return Array.from(groups, ([name, groupedItems]) => ({
    name,
    items: groupedItems,
  }));
}

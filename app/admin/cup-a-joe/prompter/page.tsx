"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  buildScriptSegments,
  formatEstimatedMinutes,
  groupCupAJoeItems,
  localDateInputValue,
  sortCupAJoeItems,
  totalEstimatedMinutes,
  type CupAJoeItem,
  type CupAJoeShowScript,
} from "@/app/lib/cupAJoe";

type PresenterMode = "teleprompter" | "cue-card" | "show-flow";

const presenterModes: Array<{ value: PresenterMode; label: string }> = [
  { value: "teleprompter", label: "Teleprompter" },
  { value: "cue-card", label: "Cue Cards" },
  { value: "show-flow", label: "Show Flow" },
];

function Prompter() {
  const searchParams = useSearchParams();
  const [showDate, setShowDate] = useState(
    searchParams.get("show_date") || localDateInputValue(),
  );
  const [items, setItems] = useState<CupAJoeItem[]>([]);
  const [showScript, setShowScript] = useState<CupAJoeShowScript | null>(null);
  const [mode, setMode] = useState<PresenterMode>("teleprompter");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(35);
  const [fontSize, setFontSize] = useState(48);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [storyIndex, setStoryIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);

  const approvedItems = useMemo(() => sortCupAJoeItems(items), [items]);
  const storyGroups = useMemo(
    () => groupCupAJoeItems(approvedItems),
    [approvedItems],
  );
  const currentStory = approvedItems[storyIndex] ?? null;
  const segments = useMemo(
    () =>
      showScript?.segments?.length
        ? showScript.segments
        : buildScriptSegments(approvedItems),
    [approvedItems, showScript],
  );
  const totalMinutes = useMemo(
    () => totalEstimatedMinutes(approvedItems),
    [approvedItems],
  );

  const loadItems = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    setPlaying(false);

    try {
      const [itemsResponse, scriptResponse] = await Promise.all([
        fetch(`/api/cup-a-joe?show_date=${encodeURIComponent(date)}`, {
          cache: "no-store",
        }),
        fetch(
          `/api/cup-a-joe/show-script?show_date=${encodeURIComponent(date)}`,
          { cache: "no-store" },
        ),
      ]);
      const data = (await itemsResponse.json()) as {
        items?: CupAJoeItem[];
        error?: string;
      };
      const scriptData = (await scriptResponse.json()) as {
        show_script?: CupAJoeShowScript | null;
        error?: string;
      };

      if (!itemsResponse.ok) {
        throw new Error(data.error || "Unable to load script.");
      }
      if (!scriptResponse.ok) {
        throw new Error(scriptData.error || "Unable to load the saved script.");
      }

      setItems((data.items ?? []).filter((item) => item.use_in_show));
      setShowScript(scriptData.show_script ?? null);
      setSegmentIndex(0);
      setStoryIndex(0);
      setElapsedSeconds(0);
      scrollerRef.current?.scrollTo({ top: 0 });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load script.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems(showDate);
  }, [loadItems, showDate]);

  useEffect(() => {
    if (mode !== "teleprompter") setPlaying(false);
  }, [mode]);

  useEffect(() => {
    if (!playing) return;

    const interval = window.setInterval(
      () => setElapsedSeconds((seconds) => seconds + 1),
      1000,
    );

    return () => window.clearInterval(interval);
  }, [playing]);

  useEffect(() => {
    if (!playing || mode !== "teleprompter") {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      lastFrameRef.current = null;
      return;
    }

    const step = (timestamp: number) => {
      const scroller = scrollerRef.current;

      if (scroller && lastFrameRef.current !== null) {
        const elapsed = (timestamp - lastFrameRef.current) / 1000;
        scroller.scrollTop += speed * elapsed;

        if (
          scroller.scrollTop + scroller.clientHeight >=
          scroller.scrollHeight - 2
        ) {
          setPlaying(false);
          return;
        }
      }

      lastFrameRef.current = timestamp;
      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [mode, playing, speed]);

  const goToStory = useCallback(
    (index: number) => {
      if (approvedItems.length === 0) return;
      setStoryIndex(
        Math.max(0, Math.min(index, approvedItems.length - 1)),
      );
    },
    [approvedItems.length],
  );

  useEffect(() => {
    if (mode !== "cue-card") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToStory(storyIndex - 1);
      } else if (event.key === "ArrowRight" || event.code === "Space") {
        event.preventDefault();
        goToStory(storyIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToStory, mode, storyIndex]);

  function goToSegment(index: number) {
    const safeIndex = Math.max(0, Math.min(index, segments.length - 1));
    const target = document.getElementById(`prompter-segment-${safeIndex}`);

    setSegmentIndex(safeIndex);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function formatTimer(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-black text-white">
      <header className="z-10 border-b border-zinc-800 bg-zinc-950/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href={`/admin/cup-a-joe/rundown?show_date=${showDate}`}
            className="rounded-full border border-zinc-700 px-3 py-2 text-xs font-black uppercase tracking-wider"
          >
            Rundown
          </Link>
          <input
            aria-label="Show date"
            type="date"
            value={showDate}
            onChange={(event) => setShowDate(event.target.value)}
            className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm"
          />
          <div className="flex rounded-full border border-zinc-700 bg-black p-1">
            {presenterModes.map((presenterMode) => (
              <button
                key={presenterMode.value}
                type="button"
                onClick={() => setMode(presenterMode.value)}
                className={`rounded-full px-3 py-2 text-xs font-black sm:px-4 ${
                  mode === presenterMode.value
                    ? "bg-orange-400 text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {presenterMode.label}
              </button>
            ))}
          </div>

          {mode === "teleprompter" ? (
            <>
              <button
                type="button"
                onClick={() => setPlaying((current) => !current)}
                disabled={segments.length === 0}
                className="rounded-full bg-orange-400 px-5 py-2 text-sm font-black text-black disabled:opacity-40"
              >
                {playing ? "Pause" : "Start"}
              </button>
              <button
                type="button"
                onClick={() => goToSegment(segmentIndex - 1)}
                disabled={segmentIndex === 0}
                className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-black disabled:opacity-30"
              >
                Previous Segment
              </button>
              <button
                type="button"
                onClick={() => goToSegment(segmentIndex + 1)}
                disabled={
                  segments.length === 0 ||
                  segmentIndex === segments.length - 1
                }
                className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-black disabled:opacity-30"
              >
                Next Segment
              </button>
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                Speed
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={speed}
                  onChange={(event) => setSpeed(Number(event.target.value))}
                  className="w-20 accent-orange-400 sm:w-28"
                />
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                Size
                <input
                  type="range"
                  min="28"
                  max="88"
                  value={fontSize}
                  onChange={(event) => setFontSize(Number(event.target.value))}
                  className="w-20 accent-orange-400 sm:w-28"
                />
              </label>
            </>
          ) : null}

          <div className="ml-auto font-mono text-xl font-black text-orange-400">
            {formatTimer(elapsedSeconds)}
            <span className="ml-3 text-sm text-zinc-500">
              / {formatEstimatedMinutes(totalMinutes)}
            </span>
          </div>
        </div>
      </header>

      {loading ? (
        <PresenterMessage>Loading presenter...</PresenterMessage>
      ) : error ? (
        <PresenterMessage error>{error}</PresenterMessage>
      ) : approvedItems.length === 0 ? (
        <PresenterMessage>No items are marked for this show.</PresenterMessage>
      ) : mode === "teleprompter" ? (
        <TeleprompterView
          ref={scrollerRef}
          segments={segments}
          fontSize={fontSize}
          onSegmentEnter={setSegmentIndex}
        />
      ) : mode === "cue-card" ? (
        <CueCardView
          item={currentStory}
          index={storyIndex}
          total={approvedItems.length}
          onPrevious={() => goToStory(storyIndex - 1)}
          onNext={() => goToStory(storyIndex + 1)}
        />
      ) : (
        <ShowFlowView
          groups={storyGroups}
          currentStory={currentStory}
          onSelect={(item) => {
            const nextIndex = approvedItems.findIndex(
              (candidate) => candidate.id === item.id,
            );
            goToStory(nextIndex);
          }}
        />
      )}
    </main>
  );
}

const TeleprompterView = function TeleprompterView({
  ref,
  segments,
  fontSize,
  onSegmentEnter,
}: {
  ref: React.RefObject<HTMLDivElement | null>;
  segments: CupAJoeShowScript["segments"];
  fontSize: number;
  onSegmentEnter: (index: number) => void;
}) {
  return (
    <div
      ref={ref}
      className="flex-1 overflow-y-auto scroll-smooth px-[5vw]"
    >
      <div className="mx-auto max-w-5xl pb-[80vh] pt-[35vh]">
        {segments.map((segment, index) => (
          <section
            id={`prompter-segment-${index}`}
            key={`${segment.name}-${index}`}
            className="mb-[25vh] scroll-mt-8"
            onMouseEnter={() => onSegmentEnter(index)}
          >
            <p className="mb-10 text-center text-sm font-black uppercase tracking-[0.3em] text-orange-400">
              {segment.name}
            </p>
            <div
              className="whitespace-pre-wrap font-bold leading-[1.45] tracking-[-0.02em]"
              style={{ fontSize: `${fontSize}px` }}
            >
              {segment.text.replace(
                `${segment.name.toUpperCase()}\n\n`,
                "",
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

function CueCardView({
  item,
  index,
  total,
  onPrevious,
  onNext,
}: {
  item: CupAJoeItem | null;
  index: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (!item) return null;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto flex min-h-full max-w-5xl flex-col">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-400">
            Story {index + 1} of {total}
          </p>
          <p className="text-xs font-bold text-zinc-500">
            Left / Right / Space
          </p>
        </div>

        <article className="my-auto py-8">
          <StoryDetails item={item} large />
        </article>

        <div className="grid grid-cols-2 gap-3 pb-4">
          <button
            type="button"
            onClick={onPrevious}
            disabled={index === 0}
            className="rounded-2xl border border-zinc-700 px-5 py-4 text-lg font-black disabled:opacity-30"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={index === total - 1}
            className="rounded-2xl bg-orange-400 px-5 py-4 text-lg font-black text-black disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function ShowFlowView({
  groups,
  currentStory,
  onSelect,
}: {
  groups: ReturnType<typeof groupCupAJoeItems>;
  currentStory: CupAJoeItem | null;
  onSelect: (item: CupAJoeItem) => void;
}) {
  return (
    <div className="grid min-h-0 flex-1 lg:grid-cols-[360px_1fr]">
      <aside className="max-h-[38vh] overflow-y-auto border-b border-zinc-800 bg-zinc-950 lg:max-h-none lg:border-b-0 lg:border-r">
        <div className="p-4 sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">
            Today&apos;s Rundown
          </p>
          <div className="mt-4 grid gap-5">
            {groups.map((group) => (
              <section key={group.segment}>
                <h2 className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                  {group.segment}
                </h2>
                <div className="mt-2 grid gap-2">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelect(item)}
                      className={`rounded-xl border p-3 text-left transition ${
                        currentStory?.id === item.id
                          ? "border-orange-400 bg-orange-400 text-black"
                          : "border-zinc-800 bg-black text-zinc-200 hover:border-zinc-600"
                      }`}
                    >
                      <span className="block text-sm font-black leading-5">
                        {item.title}
                      </span>
                      <span
                        className={`mt-1 block text-xs ${
                          currentStory?.id === item.id
                            ? "text-black/70"
                            : "text-zinc-500"
                        }`}
                      >
                        {item.source || "Saved item"}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </aside>

      <section className="overflow-y-auto px-4 py-6 sm:px-8 sm:py-10 lg:px-12">
        <div className="mx-auto max-w-5xl">
          {currentStory ? <StoryDetails item={currentStory} large /> : null}
        </div>
      </section>
    </div>
  );
}

function StoryDetails({
  item,
  large = false,
}: {
  item: CupAJoeItem;
  large?: boolean;
}) {
  const talkingPoints = item.talking_points;

  return (
    <div>
      <p className="text-sm font-black uppercase tracking-[0.22em] text-orange-400">
        {item.segment}
      </p>
      <h1
        className={`mt-4 font-black leading-[1.05] tracking-[-0.03em] ${
          large ? "text-4xl sm:text-6xl" : "text-3xl"
        }`}
      >
        {talkingPoints?.headline || item.title}
      </h1>
      <p className="mt-4 text-sm font-bold uppercase tracking-[0.12em] text-zinc-500">
        {item.source || "Source not listed"}
        <span className="ml-3 text-orange-400">
          {formatEstimatedMinutes(item.estimated_minutes)}
        </span>
      </p>

      <div className="mt-8 grid gap-6">
        <TalkingPoint
          label="Summary"
          value={
            talkingPoints?.summary ||
            item.summary ||
            "No summary has been saved for this item."
          }
          prominent
        />
        <TalkingPoint
          label="Local Relevance"
          value={
            talkingPoints?.local_relevance ||
            "Generate talking points to add local relevance."
          }
        />
        <TalkingPoint
          label="Listener Question"
          value={
            talkingPoints?.listener_question ||
            "Generate talking points to add a listener question."
          }
        />
        <TalkingPoint
          label="Transition"
          value={
            talkingPoints?.transition ||
            "Generate talking points to add a transition."
          }
        />
      </div>
    </div>
  );
}

function TalkingPoint({
  label,
  value,
  prominent = false,
}: {
  label: string;
  value: string;
  prominent?: boolean;
}) {
  return (
    <section>
      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </h2>
      <p
        className={`mt-2 whitespace-pre-wrap font-bold leading-relaxed ${
          prominent
            ? "text-2xl text-white sm:text-3xl"
            : "text-xl text-zinc-200 sm:text-2xl"
        }`}
      >
        {value}
      </p>
    </section>
  );
}

function PresenterMessage({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <p
        className={
          error
            ? "max-w-2xl rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-xl text-red-200"
            : "text-center text-3xl text-zinc-500"
        }
      >
        {children}
      </p>
    </div>
  );
}

export default function CupAJoePrompterPage() {
  return (
    <Suspense
      fallback={
        <main className="flex h-screen items-center justify-center bg-black text-2xl text-white">
          Loading presenter...
        </main>
      }
    >
      <Prompter />
    </Suspense>
  );
}

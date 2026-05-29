"use client";

import Link from "next/link";
import LiveBroadcastButton from "@/app/components/LiveBroadcastButton";
import { useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";

type SoundBed = {
  id: string;
  name: string;
  url: string;
};

function StudioPageContent() {
  const params = useSearchParams();
  const [recording, setRecording] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [soundBeds, setSoundBeds] = useState<SoundBed[]>([]);
  const [activeBed, setActiveBed] = useState<string | null>(null);

  const [title, setTitle] = useState(() => params.get("show_name") || "");
  const [artistHost, setArtistHost] = useState(() => params.get("host") || "");
  const [recordingDate, setRecordingDate] = useState(
    () => params.get("date") || new Date().toISOString().slice(0, 10),
  );

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);

    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (event) => chunksRef.current.push(event.data);

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setRecording(URL.createObjectURL(blob));
      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.start();
    setIsRecording(true);
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setIsRecording(false);
  }

  function discardRecording() {
    if (recording) URL.revokeObjectURL(recording);
    setRecording(null);
    setTitle("");
    setArtistHost("");
  }

  function downloadRecording() {
    if (!recording) return;

    const safeTitle =
      title.trim().replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() ||
      "studio-recording";

    const link = document.createElement("a");
    link.href = recording;
    link.download = `${safeTitle}.webm`;
    link.click();
  }

  function playTone(freq: number) {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }

  function uploadBeds(files: FileList | null) {
    if (!files) return;

    const newBeds = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setSoundBeds((prev) => [...newBeds, ...prev]);
  }

  function toggleBed(id: string) {
    const audio = audioRefs.current[id];
    if (!audio) return;

    if (activeBed === id) {
      audio.pause();
      setActiveBed(null);
    } else {
      Object.values(audioRefs.current).forEach((a) => a.pause());
      audio.play();
      setActiveBed(id);
    }
  }

  function removeBed(id: string) {
    setSoundBeds((prev) => prev.filter((bed) => bed.id !== id));
  }

  return (
    <main className="min-h-screen bg-black pb-28 text-white">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-orange-400">
            Skull County Radio
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-zinc-500">
            Studio Tools
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <LiveBroadcastButton />

          <Link
            href="/"
            className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800"
          >
            Home
          </Link>

          <Link
            href="/shows"
            className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800"
          >
            Shows
          </Link>

          <Link
            href="/archive"
            className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800"
          >
            Archive
          </Link>

          <Link
            href="/support"
            className="rounded-full bg-orange-400 px-5 py-3 text-sm font-bold text-black hover:bg-orange-300"
          >
            Support
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 pb-12">
        <p className="text-sm font-black uppercase tracking-[0.35em] text-orange-400">
          Tools. Beds. Breaks. Rough cuts.
        </p>

        <h1 className="mt-4 text-6xl font-black leading-none tracking-tight md:text-8xl">
          Studio
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">
          Record quick voice breaks, preview takes, prep sound beds, and test
          show elements for Skull County Radio.
        </p>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-[#17171b] p-6">
          <h2 className="text-xl font-black text-orange-400">Mic Recorder</h2>

          <div className="mt-6 rounded-3xl border border-white/10 bg-black p-8 text-center">
            <div className="text-5xl">🎙️</div>

            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`mt-6 rounded-full px-7 py-4 font-black ${
                isRecording
                  ? "bg-red-500 text-white hover:bg-red-400"
                  : "bg-orange-400 text-black hover:bg-orange-300"
              }`}
            >
              {isRecording ? "Stop Recording" : "Record"}
            </button>
          </div>

          {recording && (
            <>
              <audio controls src={recording} className="mt-6 w-full" />

              <div className="mt-6 rounded-3xl border border-white/10 bg-black p-5">
                <h3 className="font-black text-orange-300">Recording Info</h3>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title"
                    className="rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-orange-400"
                  />

                  <input
                    value={artistHost}
                    onChange={(e) => setArtistHost(e.target.value)}
                    placeholder="Artist / Host"
                    className="rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-orange-400"
                  />

                  <input
                    type="date"
                    value={recordingDate}
                    onChange={(e) => setRecordingDate(e.target.value)}
                    className="rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-orange-400 md:col-span-2"
                  />
                </div>
              </div>

              <div className="mt-4 rounded-3xl border border-white/10 bg-black p-5">
                <h3 className="font-black text-orange-300">Post-Processing</h3>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {["Normalize", "Noise Reduction", "Fade In", "Fade Out"].map(
                    (label) => (
                      <button
                        key={label}
                        type="button"
                        className="rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-left text-sm font-bold text-zinc-300 opacity-70"
                      >
                        {label} — Coming Soon
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-3xl border border-orange-400/30 bg-orange-400/10 p-5">
                <h3 className="font-black text-orange-300">Trim Clip</h3>
                <p className="mt-2 text-sm text-zinc-300">
                  Basic trim controls are staged here. For now, preview and
                  download the full take.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={downloadRecording}
                    className="rounded-full bg-orange-400 px-6 py-3 font-black text-black hover:bg-orange-300"
                  >
                    Download Recording
                  </button>

                  <button
                    onClick={discardRecording}
                    className="rounded-full border border-red-500/50 px-6 py-3 font-black text-red-300 hover:bg-red-500 hover:text-white"
                  >
                    Discard Recording
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-[#17171b] p-6">
          <h2 className="text-xl font-black text-orange-400">Soundboard</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Quick hits for timing breaks and testing show flow.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              ["📣", "Airhorn", 220],
              ["🔔", "Ding", 880],
              ["🚨", "Buzzer", 140],
              ["✨", "Chime", 660],
              ["📡", "Beep", 520],
              ["🎵", "Low Tone", 90],
              ["🚨", "Siren", 320],
              ["💥", "Pop", 760],
              ["💨", "Swoosh", 180],
            ].map(([icon, label, freq]) => (
              <button
                key={label}
                onClick={() => playTone(Number(freq))}
                className="rounded-2xl border border-white/10 bg-black/60 p-5 text-center hover:border-orange-400/60 hover:bg-orange-400/10"
              >
                <div className="text-3xl">{icon}</div>
                <div className="mt-2 text-xs font-black">{label}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-3xl border border-zinc-800 bg-[#17171b] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-orange-400">
                Sound Beds
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                Session only. Uploads clear on refresh.
              </p>
            </div>

            <label className="cursor-pointer rounded-full bg-orange-400 px-6 py-3 font-black text-black hover:bg-orange-300">
              Upload Audio
              <input
                type="file"
                multiple
                accept="audio/*"
                onChange={(e) => uploadBeds(e.target.files)}
                className="hidden"
              />
            </label>
          </div>

          {soundBeds.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-white/15 bg-black/40 p-12 text-center">
              <div className="text-4xl">⬆️</div>
              <p className="mt-4 font-black">Upload audio files</p>
              <p className="mt-2 text-sm text-zinc-500">
                MP3, WAV, OGG, M4A depending on browser support.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {soundBeds.map((bed) => (
                <div key={bed.id} className="rounded-2xl bg-black p-4">
                  <audio
                    ref={(el) => {
                      if (el) audioRefs.current[bed.id] = el;
                    }}
                    src={bed.url}
                    loop
                  />

                  <p className="truncate font-black">{bed.name}</p>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => toggleBed(bed.id)}
                      className="rounded-full bg-orange-400 px-4 py-2 text-sm font-black text-black"
                    >
                      {activeBed === bed.id ? "Pause" : "Play"}
                    </button>

                    <button
                      onClick={() => removeBed(bed.id)}
                      className="rounded-full border border-white/10 px-4 py-2 text-sm font-black text-zinc-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function StudioPage() {
  return (
    <Suspense>
      <StudioPageContent />
    </Suspense>
  );
}

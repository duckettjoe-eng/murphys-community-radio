"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function safeRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/studio";
  }

  return value;
}

function HostLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/host-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };

    if (data.ok) {
      router.push(safeRedirect(params.get("next")));
      return;
    }

    setError(data.error || "Login failed.");
    setLoading(false);
  }

  return (
    <form
      onSubmit={login}
      className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#17171b] p-8 shadow-xl"
    >
      <h1 className="mb-6 text-2xl font-black text-orange-400">Host Login</h1>
      <label className="mb-4 block">
        <span className="mb-2 block text-sm uppercase tracking-widest text-zinc-400">
          Password
        </span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-white outline-none focus:border-orange-400"
          required
        />
      </label>
      {error && <p className="mb-4 text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-orange-400 py-3 font-black text-black hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}

export default function HostLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
      <Suspense>
        <HostLoginForm />
      </Suspense>
    </main>
  );
}

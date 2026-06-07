import Link from "next/link";
import CupAJoeNav from "./CupAJoeNav";

export default function CupAJoeShell({
  title,
  description,
  children,
}: Readonly<{
  title: string;
  description: string;
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                href="/"
                className="text-xs font-black uppercase tracking-[0.24em] text-orange-400"
              >
                Murphys Community Radio
              </Link>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-zinc-500">
                Private Show Tools
              </p>
              <h1 className="mt-2 text-4xl font-black sm:text-5xl">{title}</h1>
              <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
                {description}
              </p>
            </div>
            <CupAJoeNav />
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}

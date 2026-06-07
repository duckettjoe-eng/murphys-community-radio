"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/cup-a-joe", label: "Admin" },
  { href: "/admin/cup-a-joe/rundown", label: "Rundown" },
  { href: "/admin/cup-a-joe/prompter", label: "Presenter" },
  { href: "/admin/cup-a-joe/on-air", label: "On Air" },
];

export default function CupAJoeNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Cup a Joe">
      {links.map((link) => {
        const active = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-4 py-2 text-sm font-black uppercase tracking-[0.12em] transition ${
              active
                ? "bg-orange-400 text-black"
                : "border border-zinc-700 text-zinc-300 hover:border-orange-400 hover:text-orange-300"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

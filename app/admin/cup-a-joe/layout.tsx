import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cup a Joe | MCR",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CupAJoeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

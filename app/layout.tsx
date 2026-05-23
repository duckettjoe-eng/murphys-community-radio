import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Murphys Community Radio",
  description: "Amplifying the voices of Calaveras County",
  manifest: "/manifest.json",
  themeColor: "#c9a227",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-512.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

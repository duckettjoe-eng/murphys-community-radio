import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Murphys Community Radio",
  description: "Amplifying the voices of Calaveras County",
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

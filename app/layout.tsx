import type { Metadata } from "next";
import "./globals.css";
import "./readable.css";

export const metadata: Metadata = {
  title: "TF-IDF Studio — Understand how words become numbers",
  description: "An interactive visual playground for exploring TF-IDF.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Golf Score App",
  description: "Fast, comparable golf round tracking for solo players.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

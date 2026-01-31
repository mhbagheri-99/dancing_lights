import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dancing Lights - Audio Visualizer",
  description: "Windows Media Player inspired audio visualizer using your microphone",
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

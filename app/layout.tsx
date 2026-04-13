import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import RecordingWidget from "./components/RecordingWidget";
import EditModeButton from "./components/EditModeButton";
import { EditModeProvider } from "./context/EditModeContext";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "THE A LIST",
  description: "Honest, opinionated restaurant reviews. Your friend who knows where to eat.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="min-h-screen bg-white text-zinc-900 font-[family-name:var(--font-geist)] pb-24">
        <EditModeProvider>
          <Navbar />
          {children}
          <RecordingWidget />
          <EditModeButton />
        </EditModeProvider>
      </body>
    </html>
  );
}

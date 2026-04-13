import type { Metadata } from "next";
import Image from "next/image";
import { promises as fs } from "fs";
import path from "path";
import AboutBioEditable from "../components/AboutBioEditable";
import AboutFactsEditable from "../components/AboutFactsEditable";

export const metadata: Metadata = {
  title: "About | THE A LIST",
  description: "The person behind the opinions.",
};

// Always read fresh from disk so edits show after save
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const aboutPath = path.join(process.cwd(), "data", "about.json");
  const aboutData = JSON.parse(await fs.readFile(aboutPath, "utf-8"));

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">

      {/* Page header */}
      <div className="mb-12 border-b border-zinc-200 pb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#C1440E] mb-2">
          The human behind the opinions
        </p>
        <h1 className="text-5xl md:text-6xl font-black leading-none tracking-tight">
          About Me
        </h1>
      </div>

      {/* Bio section */}
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-12 mb-16">

        {/* Photo */}
        <div className="flex flex-col items-start gap-4">
          <div className="relative w-full aspect-[3/4] bg-zinc-100 rounded-sm overflow-hidden">
            <Image
              src="/P1540075-Enhanced-NR_Original - Copy.jpg"
              alt="Archita"
              fill
              className="object-cover scale-150 object-[center_20%]"
            />
          </div>

          {/* Location tags */}
          <div className="flex flex-wrap gap-2">
            {["📍 North Beach, SF", "🎓 UC Berkeley", "💼 Consultant", "♏ Scorpio", "🌱 Vegetarian"].map((tag) => (
              <span
                key={tag}
                className="text-xs font-semibold bg-zinc-100 text-zinc-600 px-3 py-1.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Bio text — editable */}
        <AboutBioEditable bio={aboutData.bio} />
      </div>

      {/* Fun facts section */}
      <div>
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#C1440E] mb-2">
            The important stuff
          </p>
          <h2 className="text-3xl font-black tracking-tight">
            Food Facts &amp; Hot Takes
          </h2>
        </div>

        {/* Facts grid — editable */}
        <AboutFactsEditable facts={aboutData.facts} />
      </div>

    </main>
  );
}

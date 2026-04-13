import { Suspense } from "react";
import Link from "next/link";
import FilterBar from "./FilterBar";

function FilterBarFallback() {
  return (
    <div className="border-b border-zinc-200 bg-white sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-1 py-3 h-[46px]" />
      </div>
    </div>
  );
}

export default function Navbar() {
  return (
    <header>
      {/* Top bar — brand */}
      <div className="bg-[#C1440E] text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight uppercase hover:opacity-80 transition-opacity"
          >
            THE A LIST
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold uppercase tracking-wide">
            <Link href="/" className="hover:opacity-70 transition-opacity">
              Reviews
            </Link>
            <Link href="/" className="hover:opacity-70 transition-opacity">
              San Francisco
            </Link>
            <Link href="/about" className="hover:opacity-70 transition-opacity">
              About
            </Link>
          </nav>
        </div>
      </div>

      {/* Filter bar — wrapped in Suspense because FilterBar uses useSearchParams() */}
      <Suspense fallback={<FilterBarFallback />}>
        <FilterBar />
      </Suspense>
    </header>
  );
}

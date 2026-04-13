import Link from "next/link";
import FilterBar from "./FilterBar";

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

      {/* Filter bar */}
      <FilterBar />
    </header>
  );
}

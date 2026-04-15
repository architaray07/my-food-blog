"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const CUISINES = ["All", "Restaurants", "Bakery", "Coffee Shop", "Ice Cream"];

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("cuisine") ?? "All";

  const setFilter = useCallback(
    (cuisine: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (cuisine === "All") {
        params.delete("cuisine");
      } else {
        params.set("cuisine", cuisine);
      }
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="border-b border-zinc-200 bg-white sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-none">
          {CUISINES.map((cuisine) => {
            const isActive =
              cuisine === active || (cuisine === "All" && active === "All");
            return (
              <button
                key={cuisine}
                onClick={() => setFilter(cuisine)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {cuisine}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

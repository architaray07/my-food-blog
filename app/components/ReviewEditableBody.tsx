"use client";
import { useState } from "react";
import { useEditMode } from "../context/EditModeContext";
import { EditableText } from "./EditableText";

const CUISINES = [
  "American", "Chinese", "French", "Indian", "Italian", "Japanese",
  "Korean", "Mediterranean", "Mexican", "Middle Eastern", "Thai", "Vietnamese",
];

const GRADES = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D"];

const GRADE_STYLES: Record<string, string> = {
  "A+": "bg-emerald-700 text-white",
  "A":  "bg-emerald-600 text-white",
  "A-": "bg-emerald-500 text-white",
  "B+": "bg-yellow-500 text-zinc-900",
  "B":  "bg-yellow-400 text-zinc-900",
  "B-": "bg-yellow-300 text-zinc-900",
  "C+": "bg-orange-600 text-white",
  "C":  "bg-orange-500 text-white",
  "C-": "bg-orange-400 text-white",
  "D":  "bg-red-500 text-white",
};

interface Props {
  slug: string;
  category: string;
  cuisine: string;
  rating: string;
  shortPreview: string;
  fullReview: string;
}

type RefreshStatus = "idle" | "searching" | "success" | "notfound" | "error";
type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function ReviewEditableBody({ slug, category, cuisine, rating, shortPreview, fullReview }: Props) {
  const { isEditMode, editPassword } = useEditMode();

  // Rating state
  const [ratingValue, setRatingValue] = useState(rating);
  const [ratingSaveStatus, setRatingSaveStatus] = useState<SaveStatus>("idle");

  const saveRating = async (grade: string) => {
    setRatingSaveStatus("saving");
    try {
      const res = await fetch("/api/save-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: editPassword, type: "review", slug, field: "rating", value: grade }),
      });
      if (!res.ok) throw new Error("Save failed");
      setRatingValue(grade);
      setRatingSaveStatus("saved");
      setTimeout(() => {
        setRatingSaveStatus("idle");
        window.location.reload();
      }, 800);
    } catch {
      setRatingSaveStatus("error");
      setTimeout(() => setRatingSaveStatus("idle"), 3000);
    }
  };

  // Cuisine state
  const initialIsCustom = cuisine !== "" && cuisine !== "Unknown" && !CUISINES.includes(cuisine);
  const [cuisineValue, setCuisineValue] = useState(cuisine);
  const [cuisineOther, setCuisineOther] = useState(initialIsCustom);
  const [cuisineSaveStatus, setCuisineSaveStatus] = useState<SaveStatus>("idle");

  const cuisineIsKnown = cuisineValue !== "" && cuisineValue !== "Unknown";
  const selectDisplayValue = cuisineOther
    ? "Other"
    : cuisineIsKnown && CUISINES.includes(cuisineValue)
    ? cuisineValue
    : "";

  const saveCuisine = async (val: string) => {
    if (!val.trim()) return;
    setCuisineSaveStatus("saving");
    try {
      const res = await fetch("/api/save-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: editPassword, type: "review", slug, field: "cuisine", value: val }),
      });
      if (!res.ok) throw new Error("Save failed");
      setCuisineValue(val);
      setCuisineSaveStatus("saved");
      setTimeout(() => setCuisineSaveStatus("idle"), 2000);
    } catch {
      setCuisineSaveStatus("error");
      setTimeout(() => setCuisineSaveStatus("idle"), 3000);
    }
  };
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus>("idle");

  const saveField = async (field: string, value: string) => {
    const res = await fetch("/api/save-edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: editPassword, type: "review", slug, field, value }),
    });
    if (!res.ok) throw new Error("Save failed");
  };

  const handleRefreshPhoto = async () => {
    setRefreshStatus("searching");
    try {
      const res = await fetch("/api/refresh-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: editPassword, slug }),
      });

      if (res.ok) {
        setRefreshStatus("success");
        setTimeout(() => window.location.reload(), 600);
      } else if (res.status === 404) {
        setRefreshStatus("notfound");
        setTimeout(() => setRefreshStatus("idle"), 4000);
      } else {
        setRefreshStatus("error");
        setTimeout(() => setRefreshStatus("idle"), 4000);
      }
    } catch {
      setRefreshStatus("error");
      setTimeout(() => setRefreshStatus("idle"), 4000);
    }
  };

  const refreshLabel: Record<RefreshStatus, string> = {
    idle: "Refresh photo",
    searching: "Searching…",
    success: "Found! Reloading…",
    notfound: "No photo found — check API keys",
    error: "Error — try again",
  };

  return (
    <>
      {/* Grade editor — edit mode only */}
      {isEditMode && (
        <div className="mb-6 pb-5 border-b border-zinc-100">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 shrink-0 w-16">Grade</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {GRADES.map((g) => (
                <button
                  key={g}
                  onClick={() => saveRating(g)}
                  disabled={ratingSaveStatus === "saving"}
                  className={`px-2.5 py-1 rounded-sm text-xs font-black transition-all disabled:opacity-50 ${
                    ratingValue === g
                      ? `${GRADE_STYLES[g]} ring-2 ring-offset-1 ring-zinc-400 scale-110`
                      : `${GRADE_STYLES[g]} opacity-50 hover:opacity-100`
                  }`}
                >
                  {g}
                </button>
              ))}
              {ratingSaveStatus === "saving" && (
                <span className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ml-1">
                  Saving…
                </span>
              )}
              {ratingSaveStatus === "saved" && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ml-1">
                  Saved
                </span>
              )}
              {ratingSaveStatus === "error" && (
                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ml-1">
                  Error
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cuisine editor — edit mode only, restaurants only */}
      {isEditMode && category === "Restaurants" && (
        <div className="mb-8 pb-5 border-b border-zinc-100">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 shrink-0 w-16">Cuisine</p>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <select
                value={selectDisplayValue}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "Other") {
                    setCuisineOther(true);
                  } else {
                    setCuisineOther(false);
                    saveCuisine(val);
                  }
                }}
                className="border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C1440E] bg-white"
              >
                <option value="" disabled>Select cuisine…</option>
                {CUISINES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="Other">Other…</option>
              </select>

              {cuisineOther && (
                <input
                  type="text"
                  value={cuisineIsKnown ? cuisineValue : ""}
                  onChange={(e) => setCuisineValue(e.target.value)}
                  onBlur={(e) => saveCuisine(e.target.value.trim())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  }}
                  placeholder="e.g. Ethiopian, Peruvian…"
                  autoFocus
                  className="border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C1440E] w-44"
                />
              )}

              {cuisineSaveStatus === "saving" && (
                <span className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                  Saving…
                </span>
              )}
              {cuisineSaveStatus === "saved" && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                  Saved
                </span>
              )}
              {cuisineSaveStatus === "error" && (
                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                  Error
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pull quote */}
      <blockquote className="border-l-4 border-[#C1440E] pl-5 mb-8">
        <EditableText
          value={shortPreview}
          onSave={(v) => saveField("shortPreview", v)}
          render={(v) => (
            <p className="text-xl md:text-2xl font-semibold leading-snug text-zinc-800 italic">
              &ldquo;{v}&rdquo;
            </p>
          )}
        />
      </blockquote>

      {/* Full review body */}
      <EditableText
        value={fullReview}
        onSave={(v) => saveField("fullReview", v)}
        multiline
        render={(v) => {
          const paragraphs = v.replace(/\r\n/g, "\n").split("\n\n").filter(Boolean);
          return (
            <div className="space-y-5">
              {paragraphs.map((p, i) => (
                <p key={i} className="text-[17px] leading-8 text-zinc-700">
                  {p}
                </p>
              ))}
            </div>
          );
        }}
      />

      {/* Refresh photo — only visible in edit mode */}
      {isEditMode && (
        <div className="mt-8 pt-5 border-t border-zinc-100">
          <button
            onClick={handleRefreshPhoto}
            disabled={refreshStatus === "searching" || refreshStatus === "success"}
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 ${
              refreshStatus === "notfound" || refreshStatus === "error"
                ? "text-red-400"
                : refreshStatus === "success"
                ? "text-emerald-500"
                : "text-zinc-400 hover:text-[#C1440E]"
            }`}
          >
            <RefreshIcon spinning={refreshStatus === "searching"} />
            {refreshLabel[refreshStatus]}
          </button>
          {refreshStatus === "notfound" && (
            <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
              Add <code className="bg-zinc-100 px-1 rounded">GOOGLE_PLACES_API_KEY</code> or{" "}
              <code className="bg-zinc-100 px-1 rounded">UNSPLASH_ACCESS_KEY</code> to .env.local
            </p>
          )}
        </div>
      )}
    </>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={spinning ? "animate-spin" : ""}
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

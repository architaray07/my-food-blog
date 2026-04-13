"use client";
import { useState } from "react";
import { useEditMode } from "../context/EditModeContext";
import { EditableText } from "./EditableText";

interface Props {
  slug: string;
  shortPreview: string;
  fullReview: string;
}

type RefreshStatus = "idle" | "searching" | "success" | "notfound" | "error";

export default function ReviewEditableBody({ slug, shortPreview, fullReview }: Props) {
  const { isEditMode, editPassword } = useEditMode();
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

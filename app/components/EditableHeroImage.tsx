"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useEditMode } from "../context/EditModeContext";

interface SearchResult {
  id: string;
  thumb: string;
  full: string;
  description: string;
  author: string;
}

type ModalView = "closed" | "pick" | "search";

interface Props {
  slug: string;
  imageUrl: string;
  name: string;
  category: string;
}

export default function EditableHeroImage({ slug, imageUrl: initial, name, category }: Props) {
  const { isEditMode, editPassword } = useEditMode();
  const [imageUrl, setImageUrl] = useState(initial);
  const [hovered, setHovered] = useState(false);
  const [view, setView] = useState<ModalView>("closed");

  // Upload
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Search
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [saving, setSaving] = useState(false);

  const close = () => {
    setView("closed");
    setResults([]);
    setQuery("");
    setSearchError("");
    setUploadError("");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");

    const form = new FormData();
    form.append("password", editPassword);
    form.append("slug", slug);
    form.append("file", file);

    try {
      const res = await fetch("/api/upload-image", { method: "POST", body: form });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error || "Upload failed");
      }
      const { imageUrl: newUrl } = (await res.json()) as { imageUrl: string };
      setImageUrl(newUrl);
      close();
      window.location.reload();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError("");
    setResults([]);
    try {
      const res = await fetch("/api/search-unsplash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) {
        setSearchError("Search failed — is NEXT_PUBLIC_UNSPLASH_ACCESS_KEY set in .env.local?");
        return;
      }
      const data = (await res.json()) as { results: SearchResult[] };
      setResults(data.results);
      if (!data.results.length) setSearchError("No results found, try different keywords");
    } catch {
      setSearchError("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUnsplash = async (fullUrl: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/save-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: editPassword, type: "review", slug, field: "imageUrl", value: fullUrl }),
      });
      if (!res.ok) throw new Error("Save failed");
      setImageUrl(fullUrl);
      close();
      window.location.reload();
    } catch {
      // silent — user can retry
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="relative w-full h-[50vh] md:h-[60vh] bg-zinc-900"
        onMouseEnter={() => isEditMode && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Image
          src={imageUrl}
          alt={`Photo for ${name} restaurant review`}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-80"
          unoptimized={imageUrl.startsWith("/")}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Edit overlay — only in edit mode on hover */}
        {isEditMode && hovered && (
          <button
            onClick={() => setView("pick")}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/25"
            aria-label="Change photo"
          >
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-xl shadow-lg">
              <CameraIcon />
              <span className="text-sm font-black text-zinc-900">Change photo</span>
            </div>
          </button>
        )}

        {/* Header content on image */}
        <div className="absolute bottom-0 left-0 right-0 max-w-3xl mx-auto px-4 pb-8 z-[5]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/70 mb-3">
            <Link href="/" className="hover:text-white transition-colors">
              Reviews
            </Link>
            <span>›</span>
            <span>{category}</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
            {name}
          </h1>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Modal */}
      {view !== "closed" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              {view === "search" ? (
                <button
                  onClick={() => {
                    setView("pick");
                    setResults([]);
                    setSearchError("");
                  }}
                  className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-700 transition-colors flex items-center gap-1"
                >
                  ← Back
                </button>
              ) : (
                <h2 className="text-base font-black">Update photo</h2>
              )}
              <button
                onClick={close}
                className="text-zinc-400 hover:text-zinc-700 transition-colors"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Pick view */}
            {view === "pick" && (
              <div className="p-5 flex flex-col gap-3">
                {uploadError && (
                  <p className="text-xs text-red-500 font-medium">{uploadError}</p>
                )}

                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-start gap-4 p-4 rounded-xl border-2 border-zinc-100 hover:border-[#C1440E] hover:bg-orange-50/30 transition-all text-left group disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 group-hover:bg-[#C1440E]/10 flex items-center justify-center shrink-0 transition-colors">
                    <UploadIcon />
                  </div>
                  <div>
                    <p className="font-black text-sm mb-0.5">
                      {uploading ? "Uploading…" : "Upload from device"}
                    </p>
                    <p className="text-xs text-zinc-400">
                      Choose a photo from your computer
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setView("search")}
                  className="flex items-start gap-4 p-4 rounded-xl border-2 border-zinc-100 hover:border-[#C1440E] hover:bg-orange-50/30 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 group-hover:bg-[#C1440E]/10 flex items-center justify-center shrink-0 transition-colors">
                    <SearchIcon />
                  </div>
                  <div>
                    <p className="font-black text-sm mb-0.5">Search Unsplash</p>
                    <p className="text-xs text-zinc-400">
                      Find a photo by keyword (e.g. &ldquo;Thai food Bangkok&rdquo;)
                    </p>
                  </div>
                </button>
              </div>
            )}

            {/* Search view */}
            {view === "search" && (
              <div className="p-5">
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="e.g. Thai food Bangkok street market"
                    autoFocus
                    className="flex-1 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C1440E]"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searching || !query.trim()}
                    className="px-4 py-2 bg-zinc-900 text-white text-sm font-black rounded-lg hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                  >
                    {searching ? "…" : "Search"}
                  </button>
                </div>

                {searchError && (
                  <p className="text-xs text-zinc-400 mb-3">{searchError}</p>
                )}

                {results.length > 0 && (
                  <>
                    <div
                      className={`grid grid-cols-3 gap-2 max-h-72 overflow-y-auto ${
                        saving ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      {results.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => handleSelectUnsplash(r.full)}
                          className="relative aspect-[4/3] rounded-lg overflow-hidden group"
                          title={r.description || r.author}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={r.thumb}
                            alt={r.description || "Unsplash photo"}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-1.5">
                              <CheckIcon />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-zinc-300 mt-3 text-center">
                      Photos by Unsplash contributors
                    </p>
                  </>
                )}

                {saving && (
                  <p className="text-xs text-zinc-400 text-center mt-3">Saving…</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function CameraIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-zinc-500"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-zinc-500"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-zinc-900"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

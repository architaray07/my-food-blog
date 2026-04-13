"use client";
import { useState, useRef, useEffect } from "react";
import { useEditMode } from "../context/EditModeContext";

export default function EditModeButton() {
  const { isEditMode, enterEditMode, exitEditMode } = useEditMode();
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showModal) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showModal]);

  const handleButtonClick = () => {
    if (isEditMode) {
      exitEditMode();
    } else {
      setShowModal(true);
      setPassword("");
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/verify-edit-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.valid) {
        enterEditMode(password);
        setShowModal(false);
      } else {
        setError("Wrong password");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Orange top bar when in edit mode */}
      {isEditMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#C1440E] text-white text-[11px] font-bold uppercase tracking-widest text-center py-1.5 pointer-events-none select-none">
          Edit mode — click any text to edit · changes save automatically
        </div>
      )}

      {/* Pencil button — bottom left */}
      <button
        onClick={handleButtonClick}
        title={isEditMode ? "Exit edit mode" : "Edit mode"}
        aria-label={isEditMode ? "Exit edit mode" : "Edit mode"}
        className={`fixed bottom-6 left-6 z-40 w-10 h-10 rounded-full flex items-center justify-center shadow-lg border transition-all duration-200 ${
          isEditMode
            ? "bg-[#C1440E] text-white border-[#C1440E]"
            : "bg-white text-zinc-400 border-zinc-200 hover:text-zinc-600 hover:border-zinc-300 hover:shadow-xl"
        }`}
      >
        <PencilIcon />
      </button>

      {/* Password modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl p-6 w-80 mx-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 shrink-0">
                <PencilIcon />
              </div>
              <div>
                <h2 className="text-base font-black leading-none">Edit Mode</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Enter your edit password to continue</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="border border-zinc-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#C1440E] w-full"
              />
              {error && (
                <p className="text-red-500 text-xs font-medium">{error}</p>
              )}
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold border border-zinc-200 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !password}
                  className="flex-1 py-2 rounded-lg text-sm font-black bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                >
                  {loading ? "…" : "Enter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function PencilIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

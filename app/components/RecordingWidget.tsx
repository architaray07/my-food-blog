"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────
type Stage =
  | "idle"
  | "password"
  | "recording"
  | "form"
  | "generating"
  | "editing"
  | "publishing"
  | "done";

interface ReviewForm {
  name: string;
  neighborhood: string;
  address: string;
  category: string;
  cuisine: string;
  priceRange: string;
  transcript: string;
  photo: File | null;
}

interface Generated {
  review: string;
  rating: string;
  summary: string;
}

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

// ── Constants ──────────────────────────────────────────────────────────────
const NEIGHBORHOODS: Record<string, string[]> = {
  "San Francisco": [
    "Alamo Square", "Bayview", "Bernal Heights", "Castro", "Chinatown",
    "Civic Center", "Cole Valley", "Cow Hollow", "Crocker Amazon",
    "Diamond Heights", "Dogpatch", "Duboce Triangle", "Embarcadero",
    "Excelsior", "Financial District", "Fisherman's Wharf", "Forest Hill",
    "Glen Park", "Haight-Ashbury", "Hayes Valley", "Inner Richmond",
    "Inner Sunset", "Japantown", "Lower Haight", "Lower Pacific Heights",
    "Marina District", "Mission District", "Nob Hill", "Noe Valley",
    "North Beach", "Outer Mission", "Outer Richmond", "Outer Sunset",
    "Pacific Heights", "Portola", "Potrero Hill", "Presidio Heights",
    "Russian Hill", "SoMa", "Tenderloin", "The Mission", "Twin Peaks",
    "Union Square", "Visitacion Valley", "West Portal", "Western Addition",
  ],
  "Oakland": [
    "Downtown Oakland", "Fruitvale", "Grand Lake", "Jack London Square",
    "Lake Merritt", "Montclair", "Old Oakland", "Piedmont Avenue",
    "Rockridge", "Temescal", "Uptown Oakland",
  ],
  "Berkeley": [
    "Downtown Berkeley", "Elmwood", "North Berkeley", "South Berkeley",
    "Telegraph Avenue", "West Berkeley",
  ],
  "San Jose": [
    "Downtown San Jose", "Japantown (San Jose)", "Rose Garden",
    "Santana Row", "Willow Glen",
  ],
};

const CATEGORIES = ["Restaurants", "Bakery", "Coffee Shop", "Ice Cream"];
const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"];
const CUISINES = [
  "American", "Chinese", "French", "Indian", "Italian", "Japanese",
  "Korean", "Mediterranean", "Mexican", "Middle Eastern", "Thai", "Vietnamese",
];

const EMPTY_FORM: ReviewForm = {
  name: "", neighborhood: "Mission District", address: "", category: "Restaurants",
  cuisine: "", priceRange: "$$", transcript: "", photo: null,
};

// ── Helpers ────────────────────────────────────────────────────────────────
function formatTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// ── Icons ──────────────────────────────────────────────────────────────────
function MicIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

function Spinner() {
  return (
    <div className="w-8 h-8 border-3 border-zinc-200 border-t-[#C1440E] rounded-full animate-spin" />
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function RecordingWidget() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [form, setForm] = useState<ReviewForm>(EMPTY_FORM);
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [cuisineOther, setCuisineOther] = useState(false);
  const [lookupState, setLookupState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptAccum = useRef("");
  const isRecordingRef = useRef(false);

  // ── Recording ────────────────────────────────────────────────────────────
  const startSpeechRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcriptAccum.current += event.results[i][0].transcript + " ";
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setLiveTranscript(transcriptAccum.current + interim);
    };

    // Auto-restart on end (Chrome stops after silence — this keeps it alive)
    recognition.onend = () => {
      if (isRecordingRef.current) {
        try { recognition.start(); } catch { /* ignore */ }
      }
    };

    recognition.onerror = (event: any) => {
      // "no-speech" is normal during pauses — ignore it
      if (event.error === "no-speech") return;
      // For other errors, stop trying to restart
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        isRecordingRef.current = false;
        setError("Speech recognition was blocked. You can still type your notes manually after stopping.");
      }
    };

    try { recognition.start(); } catch { /* ignore */ }
    recognitionRef.current = recognition;
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setLiveTranscript("");
    transcriptAccum.current = "";
    isRecordingRef.current = true;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      isRecordingRef.current = false;
      setError("Microphone access denied. Allow microphone access in your browser settings.");
      setStage("password");
      return;
    }

    // MediaRecorder (audio capture)
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    recorder.start();

    // Speech recognition for live transcription
    startSpeechRecognition();

    // Timer
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((t) => t + 1), 1000);
    setStage("recording");
  }, [startSpeechRecognition]);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false; // prevents recognition from auto-restarting
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
    }

    const finalTranscript = transcriptAccum.current.trim();
    setForm((prev) => ({ ...prev, transcript: finalTranscript }));
    setStage("form");
  }, []);

  // ── Password ─────────────────────────────────────────────────────────────
  const getStoredPassword = (): string | null => {
    try { return sessionStorage.getItem("alist_pw"); } catch { return null; }
  };

  const setStoredPassword = (pw: string) => {
    try { sessionStorage.setItem("alist_pw", pw); } catch { /* ignore */ }
  };

  const removeStoredPassword = () => {
    try { sessionStorage.removeItem("alist_pw"); } catch { /* ignore */ }
  };

  const handleMicClick = () => {
    // Always show password modal — don't skip it even if cached,
    // so the user always gets visible feedback that something happened.
    setPwInput("");
    setPwError(false);
    setError(null);
    setStage("password");
  };

  const submitPassword = async () => {
    setPwError(false);
    const res = await fetch("/api/verify-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwInput }),
    });
    const { valid } = await res.json();
    if (!valid) {
      setPwError(true);
      return;
    }
    setStoredPassword(pwInput);
    startRecording();
  };

  // ── Generate ─────────────────────────────────────────────────────────────
  const generateReview = async () => {
    if (!form.name.trim()) {
      setError("Please enter the restaurant name.");
      return;
    }
    if (form.category === "Restaurants" && !form.cuisine.trim()) {
      setError("Please select a cuisine for this restaurant.");
      return;
    }
    setError(null);
    setStage("generating");

    const pw = getStoredPassword() || pwInput;

    try {
      const res = await fetch("/api/generate-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: pw,
          transcript: form.transcript,
          restaurantName: form.name,
          neighborhood: form.neighborhood,
          category: form.category,
          cuisine: form.category === "Restaurants" ? form.cuisine : "",
          priceRange: form.priceRange,
        }),
      });

      if (res.status === 401) {
        removeStoredPassword();
        setError("Wrong password. Please try again.");
        setStage("password");
        return;
      }

      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg || "Generation failed");
      }

      const data: Generated = await res.json();
      setGenerated(data);
      setStage("editing");
    } catch (err: any) {
      setError(err.message || "Failed to generate review. Please try again.");
      setStage("form");
    }
  };

  // ── Publish ──────────────────────────────────────────────────────────────
  const publishReview = async () => {
    if (!generated) return;
    setStage("publishing");

    const pw = getStoredPassword() || pwInput;
    const fd = new FormData();
    fd.append("password", pw);
    fd.append("name", form.name);
    fd.append("neighborhood", form.neighborhood);
    fd.append("address", form.address);
    fd.append("category", form.category);
    fd.append("cuisine", form.category === "Restaurants" ? form.cuisine : "");
    fd.append("priceRange", form.priceRange);
    fd.append("review", generated.review);
    fd.append("rating", generated.rating);
    fd.append("summary", generated.summary);
    if (form.photo) fd.append("photo", form.photo);

    try {
      const res = await fetch("/api/publish-review", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Publish failed");
      const { slug } = await res.json();

      setStage("done");
      setTimeout(() => {
        reset();
        router.push(`/reviews/${slug}`);
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to publish. Please try again.");
      setStage("editing");
    }
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  // ── Place lookup ──────────────────────────────────────────────────────────────
  const lookupPlace = async (name: string) => {
    if (name.trim().length < 2) return;
    setLookupState("loading");
    try {
      const res = await fetch("/api/lookup-place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          neighborhood: form.neighborhood,
          transcript: form.transcript,
        }),
      });
      if (!res.ok) { setLookupState("error"); return; }
      const data = await res.json();
      setForm((f) => ({
        ...f,
        name: data.name || f.name,
        address: data.address || f.address,
        category: data.category || f.category,
        cuisine: data.category === "Restaurants" ? (data.cuisine || f.cuisine) : f.cuisine,
        priceRange: data.priceRange || f.priceRange,
      }));
      if (data.category !== "Restaurants") setCuisineOther(false);
      setLookupState("done");
    } catch {
      setLookupState("error");
    }
  };

  const reset = () => {
    setStage("idle");
    setForm(EMPTY_FORM);
    setGenerated(null);
    setError(null);
    setLiveTranscript("");
    setSeconds(0);
    setPwInput("");
    setPwError(false);
    setCuisineOther(false);
    setLookupState("idle");
  };

  const closeModal = () => {
    if (stage === "recording") stopRecording();
    reset();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Floating mic button — always visible */}
      {stage === "idle" && (
        <button
          onClick={handleMicClick}
          aria-label="Record a new review"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-14 h-14 rounded-full bg-[#C1440E] text-white shadow-xl flex items-center justify-center hover:bg-[#a33a0b] transition-colors"
        >
          <MicIcon size={22} />
        </button>
      )}

      {/* Modal overlay */}
      {stage !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

            {/* ── Password ── */}
            {stage === "password" && (
              <div className="p-8 flex flex-col items-center gap-6 text-center">
                <div className="w-14 h-14 rounded-full bg-[#C1440E]/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-[#C1440E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-black mb-1">Enter password</h2>
                  <p className="text-sm text-zinc-500">Only you can create reviews.</p>
                </div>

                <input
                  type="password"
                  placeholder="Password"
                  value={pwInput}
                  onChange={(e) => setPwInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitPassword()}
                  autoFocus
                  className={`w-full border rounded-lg px-4 py-3 text-center text-lg outline-none focus:ring-2 focus:ring-[#C1440E] ${pwError ? "border-red-400 bg-red-50" : "border-zinc-200"}`}
                />
                {pwError && (
                  <p className="text-sm text-red-500 -mt-2">Wrong password. Try again.</p>
                )}
                {error && <p className="text-sm text-red-500 -mt-2">{error}</p>}

                <div className="flex gap-3 w-full">
                  <button onClick={closeModal} className="flex-1 px-4 py-3 border border-zinc-200 rounded-lg text-sm font-semibold hover:bg-zinc-50 transition-colors">
                    Cancel
                  </button>
                  <button onClick={submitPassword} disabled={!pwInput}
                    className="flex-1 px-4 py-3 bg-[#C1440E] text-white rounded-lg text-sm font-semibold hover:bg-[#a33a0b] transition-colors disabled:opacity-40">
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* ── Recording ── */}
            {stage === "recording" && (
              <div className="p-8 flex flex-col items-center gap-6 text-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[#C1440E]/20 animate-ping" />
                  <div className="relative w-24 h-24 rounded-full bg-[#C1440E] text-white flex items-center justify-center shadow-lg">
                    <MicIcon size={36} />
                  </div>
                </div>

                <div>
                  <p className="text-3xl font-black tabular-nums text-zinc-900">
                    {formatTime(seconds)}
                  </p>
                  <p className="text-sm text-zinc-500 mt-1">Recording… just talk naturally</p>
                </div>

                {liveTranscript && (
                  <div className="w-full bg-zinc-50 rounded-lg p-3 text-left max-h-28 overflow-y-auto">
                    <p className="text-sm text-zinc-600 leading-relaxed">{liveTranscript}</p>
                  </div>
                )}

                <button
                  onClick={stopRecording}
                  className="px-8 py-3 bg-zinc-900 text-white rounded-full font-semibold hover:bg-zinc-700 transition-colors"
                >
                  Stop Recording
                </button>
              </div>
            )}

            {/* ── Form ── */}
            {stage === "form" && (
              <div className="p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black">New Review</h2>
                  <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 text-2xl leading-none">&times;</button>
                </div>

                {/* Transcript */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
                    Your voice notes {!form.transcript && <span className="text-zinc-300 normal-case font-normal">(nothing captured — type your notes below)</span>}
                  </label>
                  <textarea
                    rows={4}
                    value={form.transcript}
                    onChange={(e) => setForm((f) => ({ ...f, transcript: e.target.value }))}
                    placeholder="What did you think? Mention specific dishes, the vibe, what to order…"
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm resize-none outline-none focus:ring-2 focus:ring-[#C1440E]"
                  />
                </div>

                <div className="h-px bg-zinc-100" />

                {/* Restaurant name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Restaurant Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, name: e.target.value }));
                      setLookupState("idle");
                    }}
                    onBlur={(e) => lookupPlace(e.target.value)}
                    placeholder="e.g. Tartine Bakery"
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#C1440E]"
                  />
                  {lookupState === "loading" && (
                    <p className="text-[11px] text-zinc-400 mt-1">Looking up on Google…</p>
                  )}
                  {lookupState === "done" && (
                    <p className="text-[11px] text-emerald-600 mt-1">✓ Auto-filled from Google</p>
                  )}
                  {lookupState === "error" && (
                    <p className="text-[11px] text-zinc-400 mt-1">Couldn&apos;t find on Google — fill in manually</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Address <span className="text-zinc-300 normal-case font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    placeholder="e.g. 595 Valencia St, San Francisco, CA 94110"
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#C1440E]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Neighborhood */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Neighborhood</label>
                    <select
                      value={form.neighborhood}
                      onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
                      className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#C1440E] bg-white"
                    >
                      {Object.entries(NEIGHBORHOODS).map(([city, hoods]) => (
                        <optgroup key={city} label={city}>
                          {hoods.map((n) => <option key={n}>{n}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => {
                        const cat = e.target.value;
                        setForm((f) => ({ ...f, category: cat, cuisine: cat !== "Restaurants" ? "" : f.cuisine }));
                        if (cat !== "Restaurants") setCuisineOther(false);
                      }}
                      className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#C1440E] bg-white"
                    >
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Cuisine — Restaurants only */}
                {form.category === "Restaurants" && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
                      Cuisine *
                    </label>
                    <div className="flex flex-col gap-2">
                      <select
                        value={cuisineOther ? "Other" : form.cuisine}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "Other") {
                            setCuisineOther(true);
                            setForm((f) => ({ ...f, cuisine: "" }));
                          } else {
                            setCuisineOther(false);
                            setForm((f) => ({ ...f, cuisine: val }));
                          }
                        }}
                        className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#C1440E] bg-white"
                      >
                        <option value="" disabled>Select cuisine…</option>
                        {CUISINES.map((c) => <option key={c} value={c}>{c}</option>)}
                        <option value="Other">Other…</option>
                      </select>
                      {cuisineOther && (
                        <input
                          type="text"
                          value={form.cuisine}
                          onChange={(e) => setForm((f) => ({ ...f, cuisine: e.target.value }))}
                          placeholder="e.g. Ethiopian, Peruvian, Burmese…"
                          autoFocus
                          className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#C1440E]"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Price range */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Price Range</label>
                  <div className="flex gap-2">
                    {PRICE_RANGES.map((p) => (
                      <button
                        key={p}
                        onClick={() => setForm((f) => ({ ...f, priceRange: p }))}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${form.priceRange === p ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo upload */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
                    Photo <span className="text-zinc-300 normal-case font-normal">(optional)</span>
                  </label>
                  <label className="flex items-center gap-3 border border-dashed border-zinc-200 rounded-lg px-3 py-3 cursor-pointer hover:border-[#C1440E] transition-colors group">
                    <svg className="w-5 h-5 text-zinc-400 group-hover:text-[#C1440E] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    <span className="text-sm text-zinc-500">
                      {form.photo ? form.photo.name : "Upload a photo"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setForm((f) => ({ ...f, photo: e.target.files?.[0] ?? null }))}
                    />
                  </label>
                </div>

                {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                <button
                  onClick={generateReview}
                  disabled={
                    !form.name.trim() ||
                    (form.category === "Restaurants" && !form.cuisine.trim())
                  }
                  className="w-full py-3.5 bg-[#C1440E] text-white rounded-xl font-bold text-sm hover:bg-[#a33a0b] transition-colors disabled:opacity-40"
                >
                  Generate Review
                </button>
              </div>
            )}

            {/* ── Generating ── */}
            {stage === "generating" && (
              <div className="p-12 flex flex-col items-center gap-4 text-center">
                <Spinner />
                <p className="font-semibold text-zinc-700">Writing your review…</p>
                <p className="text-sm text-zinc-400">This takes about 10 seconds.</p>
              </div>
            )}

            {/* ── Editing ── */}
            {stage === "editing" && generated && (
              <div className="p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black">{form.name}</h2>
                    <p className="text-sm text-zinc-500">{form.neighborhood} · {form.priceRange}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex flex-wrap gap-1 justify-end max-w-[160px]">
                      {GRADES.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGenerated((gen) => gen ? { ...gen, rating: g } : gen)}
                          className={`px-2 py-0.5 rounded-sm text-xs font-black transition-all ${
                            generated.rating === g
                              ? `${GRADE_STYLES[g]} ring-2 ring-offset-1 ring-zinc-300 scale-110`
                              : `${GRADE_STYLES[g]} opacity-40 hover:opacity-80`
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest">Grade</span>
                  </div>
                </div>

                <div className="h-px bg-zinc-100" />

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Preview line</label>
                  <input
                    type="text"
                    value={generated.summary}
                    onChange={(e) => setGenerated((g) => g ? { ...g, summary: e.target.value } : g)}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#C1440E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Full Review</label>
                  <textarea
                    rows={10}
                    value={generated.review}
                    onChange={(e) => setGenerated((g) => g ? { ...g, review: e.target.value } : g)}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm resize-none outline-none focus:ring-2 focus:ring-[#C1440E] leading-relaxed"
                  />
                </div>

                {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStage("form")}
                    className="flex-1 py-3 border border-zinc-200 rounded-xl text-sm font-semibold hover:bg-zinc-50 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={publishReview}
                    className="flex-2 flex-grow py-3 bg-[#C1440E] text-white rounded-xl font-bold text-sm hover:bg-[#a33a0b] transition-colors"
                  >
                    Publish Review
                  </button>
                </div>
              </div>
            )}

            {/* ── Publishing ── */}
            {stage === "publishing" && (
              <div className="p-12 flex flex-col items-center gap-4 text-center">
                <Spinner />
                <p className="font-semibold text-zinc-700">Publishing…</p>
              </div>
            )}

            {/* ── Done ── */}
            {stage === "done" && (
              <div className="p-12 flex flex-col items-center gap-4 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <p className="text-xl font-black">Published!</p>
                <p className="text-sm text-zinc-500">Taking you to your new review…</p>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}

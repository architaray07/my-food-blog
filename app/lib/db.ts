/**
 * Data persistence layer.
 *
 * Locally:     reads/writes data/*.json on the filesystem.
 * On Vercel:   uses Vercel KV (Redis). On first read the bundled JSON seeds KV
 *              automatically, so existing reviews survive the first deployment.
 *
 * Setup (Vercel dashboard → Storage):
 *   1. Create a KV database → it injects KV_REST_API_URL + KV_REST_API_TOKEN.
 */

import { promises as fs } from "fs";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

/** True when running on Vercel with a KV database attached. */
function useKV(): boolean {
  return !!process.env.KV_REST_API_URL;
}

async function kv() {
  // Dynamic import so the module doesn't crash locally when KV isn't wired up.
  const mod = await import("@vercel/kv");
  return mod.kv;
}

// ── Reviews ───────────────────────────────────────────────────────────────────

const LOCAL_REVIEWS = path.join(process.cwd(), "data", "reviews.json");

export async function getReviews(): Promise<AnyRecord[]> {
  if (useKV()) {
    const store = await kv();
    const stored = await store.get<AnyRecord[]>("reviews");
    if (stored) return stored;
    // First deploy: seed KV from the bundled JSON so no data is lost.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const seed = require("../../data/reviews.json") as AnyRecord[];
    await store.set("reviews", seed);
    return seed;
  }
  return JSON.parse(await fs.readFile(LOCAL_REVIEWS, "utf-8"));
}

export async function saveReviews(reviews: AnyRecord[]): Promise<void> {
  if (useKV()) {
    const store = await kv();
    await store.set("reviews", reviews);
  } else {
    await fs.writeFile(LOCAL_REVIEWS, JSON.stringify(reviews, null, 2));
  }
}

// ── About ─────────────────────────────────────────────────────────────────────

const LOCAL_ABOUT = path.join(process.cwd(), "data", "about.json");

export async function getAbout(): Promise<AnyRecord> {
  if (useKV()) {
    const store = await kv();
    const stored = await store.get<AnyRecord>("about");
    if (stored) return stored;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const seed = require("../../data/about.json") as AnyRecord;
    await store.set("about", seed);
    return seed;
  }
  return JSON.parse(await fs.readFile(LOCAL_ABOUT, "utf-8"));
}

export async function saveAbout(about: AnyRecord): Promise<void> {
  if (useKV()) {
    const store = await kv();
    await store.set("about", about);
  } else {
    await fs.writeFile(LOCAL_ABOUT, JSON.stringify(about, null, 2));
  }
}

/**
 * Image upload abstraction.
 *
 * Locally:     saves files to public/uploads/ and returns a relative path.
 * On Vercel:   uploads to Vercel Blob and returns the CDN URL.
 *
 * Setup (Vercel dashboard → Storage):
 *   1. Create a Blob store → it injects BLOB_READ_WRITE_TOKEN automatically.
 */

import { promises as fs } from "fs";
import path from "path";

/** True when running on Vercel with a Blob store attached. */
function useBlob(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

export async function uploadImage(
  buffer: Buffer,
  filename: string
): Promise<string> {
  if (useBlob()) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`uploads/${filename}`, buffer, { access: "public" });
    return blob.url;
  }
  // Local: write to public/uploads/
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

import fs from "fs";
import path from "path";

export const STORAGE_ROOT = path.join(/* turbopackIgnore: true */ process.cwd(), "storage");
export const UPLOADS_DIR = path.join(STORAGE_ROOT, "uploads");
export const POSTERS_DIR = path.join(STORAGE_ROOT, "posters");

export function ensureStorageDirs() {
  for (const dir of [STORAGE_ROOT, UPLOADS_DIR, POSTERS_DIR]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

export function uploadFilePath(filename: string): string {
  return path.join(UPLOADS_DIR, filename);
}

export function posterFilePath(filename: string): string {
  return path.join(POSTERS_DIR, filename);
}

export function safeFileName(original: string): string {
  const ext = path.extname(original || "").slice(0, 10);
  const base = crypto.randomUUID();
  return `${base}${ext}`;
}

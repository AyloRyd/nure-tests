import fs from "fs";
import path from "path";
import { PAGES_DIR } from "./paths.ts";

export interface SavedAttempt {
  attemptId: string;
  folder: string;
  label: string;
}

export function scanAttempts(
  dir: string,
  list: SavedAttempt[] = [],
): SavedAttempt[] {
  if (!fs.existsSync(dir)) return list;
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      scanAttempts(fullPath, list);
    } else if (
      file.isFile() &&
      file.name.endsWith(".html") &&
      file.name.startsWith("page_")
    ) {
      // Parse attempt ID
      const attemptMatch = file.name.match(/attempt_(\d+)/);
      if (attemptMatch) {
        const attemptId = attemptMatch[1];
        const relativeFolder = path.relative(PAGES_DIR, dir);
        const label = relativeFolder
          ? `${relativeFolder} (Attempt ${attemptId})`
          : `Attempt ${attemptId}`;
        const exists = list.some(
          (item) =>
            item.attemptId === attemptId && item.folder === relativeFolder,
        );
        if (!exists) {
          list.push({ attemptId, folder: relativeFolder, label });
        }
      }
    }
  }
  return list;
}

export function findSavedFile(
  dir: string,
  pageNum: number,
  attemptId: string,
): string | null {
  if (!fs.existsSync(dir)) return null;
  // 1. Try matching attemptId
  const found = search(dir, pageNum, attemptId);
  if (found) return found;
  // 2. Fallback to just matching pageNum
  return search(dir, pageNum, null);

  function search(
    currentDir: string,
    pNum: number,
    attId: string | null,
  ): string | null {
    const files = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(currentDir, file.name);
      if (file.isDirectory()) {
        const res = search(fullPath, pNum, attId);
        if (res) return res;
      } else if (file.isFile()) {
        if (
          file.name.startsWith(`page_${pNum}_`) &&
          file.name.endsWith(".html")
        ) {
          if (!attId || file.name.includes(`attempt_${attId}`)) {
            return fullPath;
          }
        }
      }
    }
    return null;
  }
}

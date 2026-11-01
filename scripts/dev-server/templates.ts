import fs from "fs";
import path from "path";
import { TEMPLATES_DIR } from "./paths.ts";

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Reads `templates/<name>` and fills in placeholders. `{{key}}` is escaped,
 * `{{{key}}}` is inserted as is (for HTML built from other templates).
 * Templates are read on every call, so edits show up without a restart.
 */
export function render(
  name: string,
  vars: Record<string, string | number> = {},
): string {
  const template = fs.readFileSync(path.join(TEMPLATES_DIR, name), "utf8");
  return template
    .replace(/\{\{\{\s*(\w+)\s*\}\}\}/g, (_, key) => String(lookup(key)))
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) =>
      escapeHtml(String(lookup(key))),
    );

  function lookup(key: string) {
    if (!(key in vars)) throw new Error(`${name}: missing "${key}"`);
    return vars[key];
  }
}

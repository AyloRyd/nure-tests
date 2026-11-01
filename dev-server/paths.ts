import path from "path";

export const ROOT_DIR = path.resolve(import.meta.dirname, "..");
export const PAGES_DIR = path.join(ROOT_DIR, ".pages");
export const DEFAULT_DIR = path.join(PAGES_DIR, "default");
export const DIST_DIR = path.join(ROOT_DIR, "dist");
export const TEMPLATES_DIR = path.join(import.meta.dirname, "templates");

// Static Moodle assets (theme CSS, fonts, images) are cached on disk, so mock
// pages render offline and don't hammer dl.nure.ua, whose firewall starts
// answering with a CAPTCHA page after too many requests.
export const CACHE_DIR = path.join(PAGES_DIR, ".cache");

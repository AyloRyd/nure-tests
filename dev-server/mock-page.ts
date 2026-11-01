import { extensionHarness } from "./browser/extension-harness.ts";
import { mockNavigation } from "./browser/mock-navigation.ts";
import { render } from "./templates.ts";

/**
 * Moodle's JS is stripped from mock pages, so the course index drawer would
 * stay open showing only loading placeholders. Start with it closed instead.
 */
function closeCourseIndexDrawer(html: string): string {
  return html
    .replace(/(<body[^>]*class="[^"]*)\bdrawer-open-index\b/, "$1")
    .replace(/(<div id="page"[^>]*class="[^"]*)\bshow-drawer-left\b/, "$1")
    .replace(
      /(<div\s+class="drawer drawer-left) show\b([^"]*" data-region="fixed-drawer" id="theme_boost-drawers-courseindex")/,
      "$1$2",
    );
}

// Runs a self-contained browser function as soon as the page loads it
function inlineScript(fn: () => void): string {
  return `<script>(${fn.toString()})();</script>`;
}

/** Turns a saved Moodle page into one that works offline from this server */
export function buildMockPage(
  savedHtml: string,
  { withExtension }: { withExtension: boolean },
): string {
  let html = savedHtml;

  // Rewrite dl.nure.ua references so assets (CSS, JS, images) load via our local proxy
  html = html.replaceAll("https://dl.nure.ua", "http://localhost:3010");
  html = html.replaceAll("https:\\/\\/dl.nure.ua", "http:\\/\\/localhost:3010");

  // Strip Moodle script tags to prevent automatic redirects and auth checks in local mock mode
  html = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, "");

  html = closeCourseIndexDrawer(html);

  const injected = [
    `<style id="nuretests-mock-style">\n${render("mock-page.css")}</style>`,
    inlineScript(mockNavigation),
  ];
  if (withExtension) {
    injected.push(
      inlineScript(extensionHarness),
      `<script src="/__ext/assets/content.js"></script>`,
    );
  }

  if (html.includes("</body>")) {
    return html.replace("</body>", `${injected.join("\n")}\n</body>`);
  }
  return html + injected.join("\n");
}

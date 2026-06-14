import { createRoot } from "react-dom/client";
import { Overlay } from "./content/components/Overlay";
import { loadSession, saveSession } from "./core/storage";
import type { StoredSession } from "./core/storage";
import "./content.css";

let rootInstance: ReturnType<typeof createRoot> | null = null;
let hostElement: HTMLDivElement | null = null;

function mountOverlay(initialSession?: StoredSession) {
  if (document.getElementById("nuretests-host")) return;

  hostElement = document.createElement("div");
  hostElement.id = "nuretests-host";
  document.body.appendChild(hostElement);

  const shadowRoot = hostElement.attachShadow({ mode: "open" });

  // Link the compiled content.css stylesheet inside the shadow DOM
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL("assets/content.css");
  shadowRoot.appendChild(link);

  // Create a mount container inside the shadow DOM
  const mountPoint = document.createElement("div");
  shadowRoot.appendChild(mountPoint);

  rootInstance = createRoot(mountPoint);

  const handleClose = () => {
    if (rootInstance) {
      rootInstance.unmount();
      rootInstance = null;
    }
    if (hostElement) {
      hostElement.remove();
      hostElement = null;
    }
    // Update persisted session open state to false
    saveSession({ isOpen: false });
  };

  rootInstance.render(
    <Overlay
      onClose={handleClose}
      initialSession={initialSession}
      onScrapeFinish={(questions) => {
        console.log("Successfully scraped questions:", questions);
      }}
    />,
  );
}

// Auto-restore the UI if it was previously open on the last page of the attempt
loadSession().then((session) => {
  if (session && session.isOpen) {
    mountOverlay(session);
  }
});

// Listen for messages from the popup UI
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "runParser") {
    // Check if the overlay is already injected
    if (document.getElementById("nuretests-host")) {
      sendResponse({ success: true, message: "Already running" });
      return;
    }

    loadSession().then((session) => {
      try {
        // Mark as open in storage
        saveSession({ isOpen: true });

        // Merge isOpen in the loaded session or just reload it
        const finalSession = session ? { ...session, isOpen: true } : undefined;

        mountOverlay(finalSession);
        sendResponse({ success: true });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        sendResponse({ success: false, error: errMsg });
      }
    });

    return true; // Keep message channel open
  }
});

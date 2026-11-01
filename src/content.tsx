import { createRoot } from "react-dom/client";
import { Overlay } from "./content/components/Overlay";
import { loadSession, saveSession } from "./core/storage";
import type { StoredSession } from "./core/storage";
import { useStore } from "./content/store/useStore";
import "./content.css";

let rootInstance: ReturnType<typeof createRoot> | null = null;
let hostElement: HTMLDivElement | null = null;

function mountOverlay(session: StoredSession | null) {
  if (document.getElementById("nuretests-host")) return;

  // Restore state before the first render so the panel doesn't flash defaults
  useStore.getState().initialize(session);

  hostElement = document.createElement("div");
  hostElement.id = "nuretests-host";
  document.body.appendChild(hostElement);

  const shadowRoot = hostElement.attachShadow({ mode: "open" });

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL("assets/content.css");
  shadowRoot.appendChild(link);

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
    saveSession({ isOpen: false });
  };

  rootInstance.render(<Overlay onClose={handleClose} />);
}

loadSession().then((session) => {
  if (session && session.isOpen) {
    mountOverlay(session);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "runParser") {
    if (document.getElementById("nuretests-host")) {
      sendResponse({ success: true, message: "Already running" });
      return;
    }

    loadSession().then((session) => {
      try {
        saveSession({ isOpen: true });
        mountOverlay(session);
        sendResponse({ success: true });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        sendResponse({ success: false, error: errMsg });
      }
    });

    return true;
  }
});

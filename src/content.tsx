import { createRoot } from "react-dom/client";
import { Overlay } from "./content/components/Overlay";
import "./content.css";

// Listen for messages from the popup UI
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "runParser") {
    // Check if the overlay is already injected
    if (document.getElementById("nuretests-host")) {
      sendResponse({ success: true, message: "Already running" });
      return;
    }

    try {
      const host = document.createElement("div");
      host.id = "nuretests-host";
      document.body.appendChild(host);

      const shadowRoot = host.attachShadow({ mode: "open" });

      // Link the compiled content.css stylesheet inside the shadow DOM
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = chrome.runtime.getURL("assets/content.css");
      shadowRoot.appendChild(link);

      // Create a mount container inside the shadow DOM
      const mountPoint = document.createElement("div");
      shadowRoot.appendChild(mountPoint);

      const root = createRoot(mountPoint);
      const handleClose = () => {
        root.unmount();
        host.remove();
      };

      root.render(
        <Overlay
          onClose={handleClose}
          onScrapeFinish={(questions) => {
            console.log("Successfully scraped questions:", questions);
          }}
        />,
      );

      sendResponse({ success: true });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      sendResponse({ success: false, error: errMsg });
    }

    return true; // Keep message channel open for async response
  }
});

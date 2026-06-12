// Content script for NURETests
import { runQuizParser } from "./core/index";

// Listen for messages from the popup UI
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "runParser") {
    runQuizParser()
      .then((output) => {
        sendResponse({ success: true, output });
      })
      .catch((err) => {
        sendResponse({ success: false, error: err.message || err });
      });
    // Return true to indicate we wish to send a response asynchronously
    return true;
  }
});

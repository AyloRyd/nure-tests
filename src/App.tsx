import { useState } from "react";
import { FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

function App() {
  const [status, setStatus] = useState<
    "idle" | "running" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRunParser = () => {
    setStatus("running");
    setErrorMsg(null);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab || !activeTab.id) {
        console.error("NURETests: No active tab found.");
        setStatus("error");
        setErrorMsg("No active tab found.");
        return;
      }

      console.log("NURETests: Active tab queried:", {
        id: activeTab.id,
        url: activeTab.url,
        title: activeTab.title,
      });

      const url = activeTab.url || "";
      const isMoodleQuiz =
        url.includes("dl.nure.ua/mod/quiz") ||
        (url.includes("localhost") && url.includes("/mod/quiz")) ||
        (url.includes("127.0.0.1") && url.includes("/mod/quiz"));

      if (!isMoodleQuiz) {
        setStatus("error");
        setErrorMsg("This page does not seem to be a Moodle quiz page.");
        return;
      }

      chrome.tabs.sendMessage(
        activeTab.id,
        { action: "runParser" },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "NURETests: Communication error:",
              chrome.runtime.lastError,
            );
            setStatus("error");
            setErrorMsg("Failed to establish connection to the page.");
          } else if (response && response.success) {
            console.log("NURETests: Scraper triggered successfully on tab.");
            setStatus("success");
            window.close();
          } else {
            const errMsg = response ? response.error : "Failed to run parser.";
            console.error("NURETests: Scraper error response:", response);
            setStatus("error");
            setErrorMsg(errMsg);
          }
        },
      );
    });
  };

  return (
    <div className="w-[380px] min-h-[320px] bg-slate-950 text-slate-100 p-5 font-sans flex flex-col justify-between selection:bg-indigo-500/30">
      <header className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <img
            src="/favicon.ico"
            className="w-6 h-6 rounded object-cover shadow"
            alt="NURETests logo"
          />
          <div>
            <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              NURETests
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">
              NURE MOODLE PARSER
            </p>
          </div>
        </div>
        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono">
          v1.0.0
        </span>
      </header>

      <main className="flex-1 my-5 flex flex-col justify-center">
        {status === "idle" && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-200">
                Ready to parse
              </h3>
              <p className="text-xs text-slate-400 px-4">
                Open a Moodle test page and click below to scrape the quiz
                questions.
              </p>
            </div>
          </div>
        )}

        {status === "running" && (
          <div className="text-center space-y-3">
            <div className="mx-auto w-10 h-10 flex items-center justify-center text-indigo-400">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-200">
                Parsing quiz questions...
              </h3>
              <p className="text-xs text-slate-400">
                Processing pages. Check the page overlay for details.
              </p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-200">
                Parsing Completed!
              </h3>
              <p className="text-xs text-slate-400 px-4">
                Quiz output container successfully injected on the page. Copy
                logs or results from the overlay.
              </p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1 px-4">
              <h3 className="text-sm font-semibold text-rose-400">
                Parsing failed
              </h3>
              <p className="text-xs text-slate-400 whitespace-pre-wrap break-words leading-relaxed">
                {errorMsg}
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="space-y-3">
        <button
          onClick={handleRunParser}
          disabled={status === "running"}
          className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] transition text-sm font-semibold shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:pointer-events-none disabled:transform-none cursor-pointer"
        >
          {status === "running" ? "Extracting..." : "Run parser"}
        </button>
        <p className="text-[9px] text-center text-slate-600">
          Must be on dl.nure.ua quiz attempt or review page
        </p>
      </footer>
    </div>
  );
}

export default App;


function App() {
  return (
    <div className="w-[380px] min-h-[300px] bg-slate-900 text-slate-100 p-4 font-sans flex flex-col justify-between">
      <header className="border-b border-slate-800 pb-3 mb-4">
        <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          DL NURE Test Parser
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">Firefox Extension v1.0.0</p>
      </header>

      <main className="flex-1 flex flex-col justify-center items-center gap-4 text-center">
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 max-w-full">
          <p className="text-sm text-slate-300">
            Bookmarklet logic has been migrated to the extension core.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Open dl.nure.ua test page to begin parsing.
          </p>
        </div>
      </main>

      <footer className="border-t border-slate-800 pt-3 mt-4 text-center text-[10px] text-slate-500">
        Created for NURE Moodle Tests
      </footer>
    </div>
  )
}

export default App

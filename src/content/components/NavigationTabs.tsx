import React from "react";

interface NavigationTabsProps {
  activeTab: "parse-test" | "import-answers";
  onChangeTab: (tab: "parse-test" | "import-answers") => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onChangeTab,
}) => {
  return (
    <div className="flex bg-slate-950/40 border-b border-slate-900 shrink-0">
      <button
        onClick={() => onChangeTab("parse-test")}
        className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider transition cursor-pointer select-none text-center ${
          activeTab === "parse-test"
            ? "bg-slate-900/40 text-indigo-400 font-extrabold border-b-2 border-indigo-500"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        Parse Test
      </button>
      <button
        onClick={() => onChangeTab("import-answers")}
        className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider transition cursor-pointer select-none text-center ${
          activeTab === "import-answers"
            ? "bg-slate-900/40 text-indigo-400 font-extrabold border-b-2 border-indigo-500"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        Import Answers
      </button>
    </div>
  );
};

import React, { useEffect } from "react";
import { useOverlay } from "../hooks/useOverlay";
import { OverlayHeader } from "./OverlayHeader";
import { OverlayContent } from "./OverlayContent";
import { OverlayFooter } from "./OverlayFooter";
import { loadSession } from "../../core/storage";
import { useStore } from "../store/useStore";

interface OverlayProps {
  onClose: () => void;
  onScrapeFinish: () => void;
}

export const Overlay: React.FC<OverlayProps> = ({ onClose }) => {
  const state = useOverlay();

  useEffect(() => {
    loadSession().then((session) => {
      if (session) {
        useStore.getState().initialize(session);
      }
    });
  }, []);

  return (
    <div
      className={`fixed top-3 w-[420px] bg-slate-900 rounded-xl shadow-2xl flex flex-col font-sans text-slate-100 z-[99999] overflow-hidden ${
        state.uiPosition === "left" ? "left-3" : "right-3"
      }`}
      style={{
        border: "1px solid #64748b",
        ...(state.isCollapsed
          ? {}
          : state.shouldExpand
            ? { height: "85vh" }
            : { height: "auto" }),
      }}
    >
      <OverlayHeader
        status={
          state.activeMainTab === "parse-test" ? state.status : "completed"
        }
        onClose={onClose}
        isCollapsed={state.isCollapsed}
        onToggleCollapse={state.handleToggleCollapse}
        uiPosition={state.uiPosition}
        onTogglePosition={state.handleTogglePosition}
      />

      <OverlayContent state={state} onClose={onClose} />

      {state.showFooter && (
        <OverlayFooter
          onCopy={state.handleCopy}
          copyFeedback={state.copyFeedback}
          showCopyButton={
            state.activeMainTab === "parse-test" ||
            (state.activeMainTab === "import-answers" &&
              state.activeSubTab === "json-output")
          }
          showAutoSelect={state.activeMainTab === "import-answers"}
          autoSelect={state.autoSelect}
          onToggleAutoSelect={state.setAutoSelect}
        />
      )}
    </div>
  );
};

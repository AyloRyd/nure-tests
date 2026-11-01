/// <reference lib="dom" />

/**
 * Replaces the Moodle JS the mock pages need: page navigation and drawers.
 *
 * Runs in the browser. It is injected into the page with `toString()`, so it
 * must stay self-contained: no imports and no references to anything outside
 * the function body (types are fine, Node strips them).
 */
export function mockNavigation() {
  function goToPage(page: number) {
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(page));
    window.location.href = window.location.pathname + "?" + params.toString();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const current = parseInt(
      new URLSearchParams(window.location.search).get("page") || "0",
      10,
    );

    const form = document.getElementById("responseform");
    if (form) {
      let clickedButtonName: string | null = null;
      form.addEventListener("click", (e) => {
        const button = (e.target as Element).closest<HTMLInputElement>(
          "input[type=submit], button[type=submit]",
        );
        if (button) clickedButtonName = button.name;
      });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (clickedButtonName === "next") goToPage(current + 1);
        else if (clickedButtonName === "previous") goToPage(current - 1);
        else
          console.log("[Dev Server] Ignored form action: " + clickedButtonName);
      });
    }

    document.addEventListener("click", (e) => {
      const target = e.target as Element;

      const qnbutton = target.closest<HTMLElement>(".qnbutton[data-quiz-page]");
      if (qnbutton) {
        const page = parseInt(qnbutton.dataset.quizPage ?? "", 10);
        if (page !== current) {
          e.preventDefault();
          goToPage(page);
        }
        return;
      }

      const toggler = target.closest<HTMLElement>('[data-toggler="drawers"]');
      if (!toggler) return;
      e.preventDefault();
      const drawer = document.getElementById(toggler.dataset.target ?? "");
      const page = document.getElementById("page");
      if (!drawer || !page) return;
      const open =
        toggler.dataset.action === "closedrawer"
          ? false
          : !drawer.classList.contains("show");
      drawer.classList.toggle("show", open);
      const side = drawer.classList.contains("drawer-right") ? "right" : "left";
      page.classList.toggle("show-drawer-" + side, open);
    });
  });
}

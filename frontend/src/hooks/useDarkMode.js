import { useEffect } from "react";

/**
 * Syncs body class with saved or system dark mode preference.
 * Call once at the top of every page/layout so the whole site stays in sync.
 */
export default function useDarkMode() {
  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = saved !== null ? saved === "true" : prefersDark;
    if (shouldBeDark) document.body.classList.add("darkMode");
    else document.body.classList.remove("darkMode");
  }, []);
}

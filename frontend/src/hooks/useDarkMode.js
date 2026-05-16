import { useEffect } from "react";

/**
 * Syncs body class with saved or system dark mode preference.
 * Call once at the top of every page/layout so the whole site stays in sync.
 */
export default function useDarkMode() {
  useEffect(() => {
    const saved =
      localStorage.getItem("inclass-theme") ?? localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const shouldBeDark =
      saved !== null ? saved === "dark" || saved === "true" : prefersDark;

    document.documentElement.classList.toggle("dark", shouldBeDark);
    document.documentElement.setAttribute(
      "data-theme",
      shouldBeDark ? "dark" : "light",
    );
    document.body.classList.toggle("darkMode", shouldBeDark);
  }, []);
}

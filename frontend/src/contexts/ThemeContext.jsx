import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const getInitialTheme = () => {
    if (typeof window === "undefined") {
      return false;
    }

    const savedTheme = localStorage.getItem("inclass-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    return savedTheme !== null ? savedTheme === "dark" : prefersDark;
  };

  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(isDarkMode);
  }, [isDarkMode]);

  const applyTheme = (dark) => {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    if (dark) {
      htmlElement.classList.add("dark");
      htmlElement.setAttribute("data-theme", "dark");
      bodyElement?.classList.add("darkMode");
    } else {
      htmlElement.classList.remove("dark");
      htmlElement.setAttribute("data-theme", "light");
      bodyElement?.classList.remove("darkMode");
    }
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      localStorage.setItem("inclass-theme", newValue ? "dark" : "light");
      applyTheme(newValue);
      return newValue;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;

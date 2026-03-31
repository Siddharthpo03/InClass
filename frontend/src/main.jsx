// src/main.jsx

import React, { StrictMode } from "react";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { LanguageProvider } from "./contexts/LanguageContext";
import App from "./App.jsx";
import "./styles/global.css";

// Dev-only: clear stale auth when the dev server restarts so the app loads fresh.
// Within the same server session, page refreshes preserve login for testing.
if (import.meta.env.DEV && typeof __DEV_SESSION_ID__ === "string") {
  const key = "inclass_dev_session";
  const prev = sessionStorage.getItem(key);
  if (prev !== __DEV_SESSION_ID__) {
    sessionStorage.setItem(key, __DEV_SESSION_ID__);
    localStorage.removeItem("inclass_token");
    localStorage.removeItem("user_role");
  }
}

// Accessibility: run axe-core in development only (no runtime cost in production)
async function initA11y() {
  if (import.meta.env.DEV) {
    try {
      const axe = await import("@axe-core/react");
      axe.default(React, ReactDOM, 1000);
    } catch (e) {
      console.warn("[a11y] @axe-core/react failed to load:", e.message);
    }
  }
}

async function bootstrap() {
  await initA11y();
  const root = createRoot(document.getElementById("root"));
  root.render(
    <StrictMode>
      <BrowserRouter>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </BrowserRouter>
    </StrictMode>
  );
}

bootstrap();

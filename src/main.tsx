import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  // Hard environment failure — fail clearly instead of a silent blank screen.
  document.body.innerHTML =
    '<div style="padding:2rem;font-family:sans-serif;color:#e2e2e2;background:#121414">Fatal: root element #root not found.</div>';
  throw new Error("Root element #root not found");
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);

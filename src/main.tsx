import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

if ("serviceWorker" in navigator) {
  import("virtual:serwist").then(({ getSerwist }) => {
    getSerwist().then((sw) => {
      sw?.register();
      sw?.addEventListener("waiting", () => {
        // Only reload on updates, not on first install
        if (navigator.serviceWorker.controller) {
          sw.messageSkipWaiting();
          window.location.reload();
        }
      });
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

import React from "react";
import ReactDOM from "react-dom/client";
import Home from "./routes/Home";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>,
);

// Aplicação instalável: o service worker só corre no site publicado (não no modo de desenvolvimento).
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
  });
}

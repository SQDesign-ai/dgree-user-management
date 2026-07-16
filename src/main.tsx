import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
// Design system: primitives, then the skin that overrides them, then the
// components' own (CSS Module) styles. App styles last so they win on conflict.
import "@sqdesign-ai/dgree-ds-tokens/colors.css";
import "@sqdesign-ai/dgree-ds-tokens/skins/dgree-current.css";
import "@sqdesign-ai/dgree-ds-react/styles.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { IconProvider } from "@sqdesign-ai/dgree-ds-react";
import App from "./App.tsx";
// Design system: primitives, then the skin that overrides them, then the
// components' own (CSS Module) styles. App styles last so they win on conflict.
import "@sqdesign-ai/dgree-ds-tokens/colors.css";
import "@sqdesign-ai/dgree-ds-tokens/skins/dgree-current.css";
import "@sqdesign-ai/dgree-ds-react/styles.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Phosphor icons default to regular @ 20 / currentColor, set once here so
        no call site has to remember — that's how mixed weights creep in. */}
    <IconProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </IconProvider>
  </StrictMode>
);

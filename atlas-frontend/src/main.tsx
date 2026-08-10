import "@fontsource/inter";

import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import AppProviders from "./core/providers/AppProviders";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);
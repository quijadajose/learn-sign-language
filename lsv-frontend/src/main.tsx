import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./i18n";
import "./index.css";
import App from "./App";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: SENTRY_DSN,
  sendDefaultPii: false,
  enableLogs: import.meta.env.DEV,
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>
    <BrowserRouter basename="/">
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

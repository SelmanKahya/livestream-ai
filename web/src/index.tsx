import React from "react";
// @ts-ignore
import ReactDOM from "react-dom/client";
import "./index.css";
import Application from "./Application";
import reportWebVitals from "./reportWebVitals";
import { ThemeProvider } from "./contexts/ThemeContext";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <Application />
    </ThemeProvider>
  </React.StrictMode>
);

reportWebVitals();

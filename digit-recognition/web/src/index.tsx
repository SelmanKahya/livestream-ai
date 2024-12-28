import React from "react";
// @ts-ignore
import ReactDOM from "react-dom";
import "./index.css";
import Application from "./Application";
import reportWebVitals from "./reportWebVitals";
import { ThemeProvider } from "./contexts/ThemeContext";

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider>
      <Application />
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

reportWebVitals();

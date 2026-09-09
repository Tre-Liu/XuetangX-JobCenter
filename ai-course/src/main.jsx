import React from "react";
import { createRoot } from "react-dom/client";
import {CourseCMS} from "./cms/CourseCMS.jsx";
import { App } from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {location.pathname.includes('/cms/') ? <CourseCMS /> : <App />}
  </React.StrictMode>,
);

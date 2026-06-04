import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CloudOracle from "./CloudOracle.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <CloudOracle />
  </StrictMode>
);

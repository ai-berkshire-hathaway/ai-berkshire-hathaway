import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { Web3Provider } from "./providers/Web3Provider";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Web3Provider>
      <App />
    </Web3Provider>
  </React.StrictMode>
);
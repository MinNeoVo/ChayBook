import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import App from "./App.jsx";
import AuthProvider from "./context/AuthProvider";
import BmiProvider from "./context/BmiProvider";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BmiProvider>
          <App />
        </BmiProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);

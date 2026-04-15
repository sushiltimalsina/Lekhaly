import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { DateFormatProvider } from "@/lib/date-format";
import App from "@/app";
import "@/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <DateFormatProvider>
          <App />
        </DateFormatProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

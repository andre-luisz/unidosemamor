import React from "react"
import ReactDOM from "react-dom/client"
import AppRoutes from "./routes/AppRoutes"
import { AuthProvider } from "./context/AuthContext"
import { Toaster } from "sonner"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>

      {/* TOAST GLOBAL DEFINITIVO */}
      <Toaster
        position="top-right"
        richColors
        closeButton
      />

      <AppRoutes />
    </AuthProvider>
  </React.StrictMode>
)

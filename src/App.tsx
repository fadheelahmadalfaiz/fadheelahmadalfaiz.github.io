import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { AppDownloadPage } from "@/pages/app-download"
import { HomePage } from "@/pages/home"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/apps/:slug/" element={<AppDownloadPage />} />
        <Route path="/apps/:slug" element={<AppDownloadPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

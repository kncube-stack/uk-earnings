import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import EarningsDashboard from './App.jsx'

if (import.meta.env.PROD && window.location.search.includes("__fresh=")) {
  const url = new URL(window.location.href)
  url.searchParams.delete("__fresh")
  window.history.replaceState({}, "", url)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <EarningsDashboard />
    <Analytics />
  </React.StrictMode>
)

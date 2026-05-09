import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* basename must match the base in vite.config.js and the FastAPI mount path */}
    <BrowserRouter basename="/panel">
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

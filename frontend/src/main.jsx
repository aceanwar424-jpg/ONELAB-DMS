import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/onelab-dms-production-921d.up.railway.app">
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

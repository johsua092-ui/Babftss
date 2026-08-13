import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { initErrorTracking } from './lib/analytics'
import { startHeartbeat } from './lib/tracker'

// Aktifkan pelacakan error global (JS error + unhandled rejection) ke Firestore.
initErrorTracking()
// Heartbeat periodik untuk deteksi lonjakan traffic di admin panel.
startHeartbeat(60000)

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
  </AuthProvider>
)

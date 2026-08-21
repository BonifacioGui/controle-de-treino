import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './pages/WorkoutApp.jsx'
import { migrateLegacyStorage } from './utils/storage.js'

migrateLegacyStorage()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

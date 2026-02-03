import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './WorkoutApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

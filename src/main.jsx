import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './pages/WorkoutApp.jsx'

const isUiPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).has('ui-preview')
const UiPreviewApp = isUiPreview ? lazy(() => import('./dev/UiPreviewApp.jsx')) : null
const RootApp = UiPreviewApp || App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={null}>
      <RootApp />
    </Suspense>
  </StrictMode>,
)

import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './pages/WorkoutApp.jsx'
import AppErrorBoundary from './components/shared/AppErrorBoundary.jsx'
import PwaUpdatePrompt from './components/shared/PwaUpdatePrompt.jsx'
import {
  CHUNK_RECOVERY_STORAGE_KEY,
  getChunkFailureMessage,
  getChunkRecoveryDecision,
} from './utils/chunkRecovery.js'

let inMemoryRecoveryAttempt = null

window.addEventListener('vite:preloadError', (event) => {
  let storedAttempt = inMemoryRecoveryAttempt

  try {
    storedAttempt = sessionStorage.getItem(CHUNK_RECOVERY_STORAGE_KEY) || storedAttempt
  } catch {
    // Alguns navegadores bloqueiam sessionStorage; o marcador em memória ainda evita repetição nesta página.
  }

  const decision = getChunkRecoveryDecision({
    previousAttempt: storedAttempt,
    failedResource: getChunkFailureMessage(event.payload),
  })

  if (!decision.shouldReload) return

  event.preventDefault()
  inMemoryRecoveryAttempt = decision.nextAttempt

  try {
    sessionStorage.setItem(CHUNK_RECOVERY_STORAGE_KEY, JSON.stringify(decision.nextAttempt))
  } catch {
    // A recarga continua válida mesmo quando o armazenamento da sessão está indisponível.
  }

  window.location.reload()
})

const isUiPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).has('ui-preview')
const UiPreviewApp = isUiPreview ? lazy(() => import('./dev/UiPreviewApp.jsx')) : null
const RootApp = UiPreviewApp || App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <Suspense fallback={null}>
        <RootApp />
      </Suspense>
    </AppErrorBoundary>
    <PwaUpdatePrompt />
  </StrictMode>,
)

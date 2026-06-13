import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from './lib/notify'
import { useStore } from './store'

registerSW()
// Restore the logged-in user (if any) before first paint.
useStore.getState().bootstrap()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

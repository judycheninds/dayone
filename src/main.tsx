import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from './lib/notify'
import { useStore } from './store'
import { ensureDemoUser } from './lib/localdb'

registerSW()
// Seed the built-in demo account (tester / test1234) so it works on any browser.
ensureDemoUser()
// Restore the logged-in user (if any) before first paint.
useStore.getState().bootstrap()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadCompleteDivineCatalog } from './data/completeDivineCatalogLoader'

await loadCompleteDivineCatalog()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

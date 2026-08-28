import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './ctx/userCtx.tsx'
import Header from './components/Header.tsx'
import { GameProvider } from './ctx/gameCtx.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <GameProvider>
        <Header />
        <App />
      </GameProvider>
    </AuthProvider>
  </StrictMode>,
)

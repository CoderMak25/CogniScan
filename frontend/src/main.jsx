import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { CognitiveProvider } from './context/CognitiveContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <CognitiveProvider>
        <App />
      </CognitiveProvider>
    </BrowserRouter>
  </StrictMode>,
)

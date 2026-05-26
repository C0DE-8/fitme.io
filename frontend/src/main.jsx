import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppErrorBoundary } from './components/error/AppErrorBoundary.jsx'
import { ToastProvider } from './components/feedback/ToastProvider.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import LoadingBar from './components/LoadingBar.jsx'
import './styles.css'
import './auth.css'
import './tasks.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LoadingBar />
    <App />
  </StrictMode>,
)

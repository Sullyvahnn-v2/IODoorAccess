import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import EmployeeGate from './pages/EmployeeGate.jsx' 

// odczytanie zmiennej ustawionej w terminalu
const appMode = import.meta.env.VITE_APP_MODE;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* jeśli tryb to 'gate', załaduj Bramkę, w innym przypadku panel admina */}
    {appMode === 'gate' ? <EmployeeGate /> : <App />}
  </StrictMode>,
)
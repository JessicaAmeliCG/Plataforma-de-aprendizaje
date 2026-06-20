import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { I18nProvider } from './contexts/I18nContext.jsx'

// Inicializar tema y estilo
const savedTema = localStorage.getItem('yc_tema');
const isDark = savedTema === 'dark' || (!savedTema && window.matchMedia('(prefers-color-scheme: dark)').matches);
if (isDark) document.documentElement.classList.add('dark');

const savedEstilo = localStorage.getItem('yc_estilo');
if (savedEstilo && savedEstilo !== 'profesional') {
  document.documentElement.classList.add(`theme-${savedEstilo}`);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>,
)

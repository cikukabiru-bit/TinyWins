import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// PWA Service worker auto-registration hook
import { registerSW } from 'virtual:pwa-register';

if ('serviceWorker' in navigator) {
  registerSW({
    onNeedRefresh() {
      if (confirm('A new version of TinyWins is available. Refresh gently now?')) {
        window.location.reload();
      }
    },
    onOfflineReady() {
      console.log('TinyWins is ready for offline growth.');
    },
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

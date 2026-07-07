import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Proxy interceptor for Brave CORS bypass
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let url = args[0];
  if (typeof url === 'string' && url.startsWith('https://api.music.apple.com')) {
    args[0] = url.replace('https://api.music.apple.com', '/api-apple');
  } else if (args[0] instanceof Request && args[0].url.startsWith('https://api.music.apple.com')) {
    const newRequest = new Request(args[0].url.replace('https://api.music.apple.com', '/api-apple'), args[0]);
    args[0] = newRequest;
  }
  return originalFetch(...args);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

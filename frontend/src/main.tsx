// frontend/src/main.tsx — REPLACE ENTIRE FILE
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Apply persisted theme before React renders — prevents white flash on dark mode
const storedTheme = localStorage.getItem('theme') ?? 'light';
document.documentElement.classList.toggle('dark', storedTheme === 'dark');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

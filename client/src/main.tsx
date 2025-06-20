import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { DemoAuthProvider } from './contexts/DemoAuthContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DemoAuthProvider>
      <App />
    </DemoAuthProvider>
  </StrictMode>
);
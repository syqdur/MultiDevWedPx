import React from 'react';
import { AuthenticatedApp } from './components/AuthenticatedApp';
import { useDemoAuth } from './contexts/DemoAuthContext';
import { SpotifyCallback } from './components/SpotifyCallback';
import { PublicRecapPage } from './components/PublicRecapPage';
import { useDarkMode } from './hooks/useDarkMode';

function App() {
  const { user, loading } = useDemoAuth();
  const { isDarkMode } = useDarkMode();
  
  // Check if we're on special routes that don't require auth
  const isSpotifyCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('code') && urlParams.has('state');
  };

  const isPublicRecap = () => {
    return window.location.pathname === '/recap';
  };

  // Handle special routes
  if (isSpotifyCallback()) {
    return <SpotifyCallback isDarkMode={isDarkMode} />;
  }

  if (isPublicRecap()) {
    return <PublicRecapPage isDarkMode={isDarkMode} />;
  }

  // Use new authentication system
  return <AuthenticatedApp />;
}

export default App;
import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { DemoAuthProvider } from './contexts/DemoAuthContext';
import { AuthenticatedApp } from './components/AuthenticatedApp';
import { SpotifyCallback } from './components/SpotifyCallback';
import { PublicRecapPage } from './components/PublicRecapPage';
import { useDarkMode } from './hooks/useDarkMode';
import { isSupabaseConfigured } from './config/supabase';

function App() {
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

  // Use Supabase auth if configured, otherwise fall back to demo auth
  const AuthWrapper = isSupabaseConfigured ? AuthProvider : DemoAuthProvider;
  
  return (
    <AuthWrapper>
      <AuthenticatedApp />
    </AuthWrapper>
  );
}

export default App;
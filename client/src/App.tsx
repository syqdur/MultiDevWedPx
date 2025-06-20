import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { DemoAuthProvider } from './contexts/DemoAuthContext';
import { AuthenticatedApp } from './components/AuthenticatedApp';
import { UserProfilePage } from './components/UserProfilePage';
import { SpotifyCallback } from './components/SpotifyCallback';
import { PublicRecapPage } from './components/PublicRecapPage';
import { useDarkMode } from './hooks/useDarkMode';
import { isSupabaseConfigured } from './config/supabase';

function App() {
  const { isDarkMode } = useDarkMode();
  
  // Check current path for routing
  const currentPath = window.location.pathname;
  const urlParams = new URLSearchParams(window.location.search);
  
  // Check if we're on special routes that don't require auth
  const isSpotifyCallback = () => {
    return urlParams.has('code') && urlParams.has('state');
  };

  const isPublicRecap = () => {
    return currentPath === '/recap';
  };

  // Check if we're on a user profile route (/user/:username)
  const getUserFromPath = () => {
    const userMatch = currentPath.match(/^\/user\/([^\/]+)$/);
    return userMatch ? userMatch[1] : null;
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
  
  const username = getUserFromPath();
  
  return (
    <AuthWrapper>
      {username ? (
        <UserProfilePage username={username} isDarkMode={isDarkMode} />
      ) : (
        <AuthenticatedApp />
      )}
    </AuthWrapper>
  );
}

export default App;
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { Login } from './components/Login';
import Dashboard from './components/Dashboard';
import { NetworkBadge } from './components/NetworkBadge';
import { applyThemePreferences, resolveThemePreferences } from './utils/themePreferences';

function AppContent() {
  const { user, profile, loading, isAuthReady } = useAuth();

  useEffect(() => {
    const { theme, accent } = resolveThemePreferences(profile);
    applyThemePreferences(theme, accent);
  }, [profile]);

  if (!isAuthReady || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <NetworkBadge />
      <AppContent />
    </AuthProvider>
  );
}


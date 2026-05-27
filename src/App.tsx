/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { Login } from './components/Login';
import Dashboard from './components/Dashboard';
import { NetworkBadge } from './components/NetworkBadge';

function AppContent() {
  const { user, profile, loading, isAuthReady } = useAuth();

  useEffect(() => {
    if (profile) {
      document.documentElement.setAttribute('data-theme', profile.theme || 'dark');
      document.documentElement.setAttribute('data-accent', profile.accentColor || 'green');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.setAttribute('data-accent', 'green');
    }
  }, [profile]);

  if (!isAuthReady || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
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


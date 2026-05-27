import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline, setWasOffline };
}

export function NetworkBadge() {
  const { isOnline, wasOffline, setWasOffline } = useNetworkStatus();

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isOnline && wasOffline) {
      timeout = setTimeout(() => {
        setWasOffline(false);
      }, 3000); // hide success message after 3 seconds
    }
    return () => clearTimeout(timeout);
  }, [isOnline, wasOffline, setWasOffline]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 flex justify-center mt-2 pointer-events-none"
        >
          <div className="bg-brand-orange text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold flex items-center gap-2">
            <span>📵 Sem conexão — seus dados serão salvos localmente</span>
          </div>
        </motion.div>
      )}

      {isOnline && wasOffline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 flex justify-center mt-2 pointer-events-none"
        >
          <div className="bg-brand-primary text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold flex items-center gap-2">
            <span>✅ Conexão restaurada — sincronizando...</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import React from 'react';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

export function Login() {
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-card border border-border rounded-3xl p-10 text-center shadow-2xl"
        >
          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Target className="text-brand-primary w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Bem-vindo ao seu Mentor!</h1>
          <p className="text-text-secondary mb-10">Sua jornada rumo à aprovação começa aqui. Vamos organizar seus estudos de forma inteligente.</p>
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-all shadow-lg"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Entrar com Google
          </button>
        </motion.div>
      </div>
    </div>
  );
}

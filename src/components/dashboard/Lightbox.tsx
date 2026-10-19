import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { ErrorAttachment } from '../../types';

interface LightboxProps {
  attachment: ErrorAttachment | null;
  onClose: () => void;
}

export function Lightbox({ attachment, onClose }: LightboxProps) {
  React.useEffect(() => {
    if (!attachment) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [attachment, onClose]);

  return (
    <AnimatePresence>
      {attachment ? (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={`Visualização de ${attachment.nome}`}
          onClick={onClose}
        >
          <div className="absolute right-4 top-4 flex gap-2">
            <a
              href={attachment.url}
              download={attachment.nome}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/15 bg-black/50 p-2.5 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label="Abrir anexo em nova aba"
            >
              <Download size={20} />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/15 bg-black/50 p-2.5 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label="Fechar visualização"
            >
              <X size={20} />
            </button>
          </div>
          <motion.img
            src={attachment.url}
            alt={attachment.nome}
            className="max-h-[88vh] max-w-[94vw] rounded-xl object-contain shadow-2xl"
            initial={{ scale: 0.96 }}
            animate={{ scale: 1 }}
            onClick={event => event.stopPropagation()}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { designTokens } from '../../styles/designTokens';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClassName?: string;
  hideCloseButton?: boolean;
  headerContent?: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidthClassName = 'max-w-md',
  hideCloseButton = false,
  headerContent
}: ModalProps) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`${designTokens.modalPanel} ${maxWidthClassName}`}
            onClick={(event) => event.stopPropagation()}
          >
            {(title || headerContent || !hideCloseButton) && (
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  {headerContent || (title ? <h3 className="text-2xl font-bold">{title}</h3> : null)}
                </div>
                {!hideCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-border p-2 text-text-secondary transition-all hover:text-text-primary"
                    title="Fechar"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}
            <div>{children}</div>
            {footer ? <div className="pt-6">{footer}</div> : null}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

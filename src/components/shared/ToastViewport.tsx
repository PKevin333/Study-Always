import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  message: string;
  title?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastOptions, 'title'>> {
  id: string;
  title?: string;
}

const TOAST_EVENT = 'study-always:toast';

const emitToast = (variant: ToastVariant, message: string, options?: Omit<ToastOptions, 'message' | 'variant'>) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ToastOptions>(TOAST_EVENT, {
    detail: { message, variant, ...options }
  }));
};

export const toast = {
  success: (message: string, options?: Omit<ToastOptions, 'message' | 'variant'>) => emitToast('success', message, options),
  error: (message: string, options?: Omit<ToastOptions, 'message' | 'variant'>) => emitToast('error', message, options),
  warning: (message: string, options?: Omit<ToastOptions, 'message' | 'variant'>) => emitToast('warning', message, options),
  info: (message: string, options?: Omit<ToastOptions, 'message' | 'variant'>) => emitToast('info', message, options)
};

const styles: Record<ToastVariant, { icon: typeof Info; accent: string; iconSurface: string; defaultTitle: string }> = {
  success: { icon: CheckCircle2, accent: 'border-l-brand-green', iconSurface: 'bg-brand-green/10 text-brand-green', defaultTitle: 'Tudo certo' },
  error: { icon: AlertCircle, accent: 'border-l-brand-red', iconSurface: 'bg-brand-red/10 text-brand-red', defaultTitle: 'Não foi possível concluir' },
  warning: { icon: TriangleAlert, accent: 'border-l-brand-orange', iconSurface: 'bg-brand-orange/10 text-brand-orange', defaultTitle: 'Atenção' },
  info: { icon: Info, accent: 'border-l-brand-blue', iconSurface: 'bg-brand-blue/10 text-brand-blue', defaultTitle: 'Informação' }
};

export function ToastViewport() {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const timers = React.useRef(new Map<string, number>());

  const dismiss = React.useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    setItems(current => current.filter(item => item.id !== id));
  }, []);

  React.useEffect(() => {
    const currentTimers = timers.current;
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastOptions>).detail;
      if (!detail?.message) return;

      const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const duration = detail.duration ?? (detail.variant === 'error' ? 6000 : 4200);
      const item: ToastItem = {
        id,
        message: detail.message,
        title: detail.title,
        variant: detail.variant || 'info',
        duration
      };

      setItems(current => [...current.slice(-3), item]);
      const timer = window.setTimeout(() => dismiss(id), duration);
      currentTimers.set(id, timer);
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast);
      currentTimers.forEach(timer => window.clearTimeout(timer));
      currentTimers.clear();
    };
  }, [dismiss]);

  return (
    <div
      className="pointer-events-none fixed inset-x-3 top-3 z-[200] flex flex-col items-end gap-3 sm:inset-x-auto sm:right-5 sm:top-5 sm:w-[min(390px,calc(100vw-2.5rem))]"
      aria-live="polite"
      aria-relevant="additions"
    >
      <AnimatePresence initial={false}>
        {items.map(item => {
          const style = styles[item.variant];
          const Icon = style.icon;
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.97 }}
              role={item.variant === 'error' ? 'alert' : 'status'}
              className={cn(
                'pointer-events-auto relative w-full overflow-hidden rounded-xl border border-border border-l-4 bg-card p-4 shadow-[var(--app-shadow)]',
                style.accent
              )}
            >
              <div className="flex items-start gap-3 pr-7">
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', style.iconSurface)}>
                  <Icon size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-text-primary">{item.title || style.defaultTitle}</p>
                  <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-text-secondary">{item.message}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="absolute right-2.5 top-2.5 rounded-md p-1 text-text-secondary transition hover:bg-[var(--surface-muted)] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                aria-label="Fechar aviso"
              >
                <X size={15} />
              </button>
              <motion.div
                className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-current opacity-30"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: item.duration / 1000, ease: 'linear' }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

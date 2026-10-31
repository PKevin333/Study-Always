import React from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import { ErrorAttachment } from '../../types';
import { Lightbox } from './Lightbox';

interface AnexosGridProps {
  anexos?: ErrorAttachment[];
}

export function AnexosGrid({ anexos = [] }: AnexosGridProps) {
  const [activeAttachment, setActiveAttachment] = React.useState<ErrorAttachment | null>(null);
  if (anexos.length === 0) return null;

  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {anexos.map((anexo, index) => {
          const isPdf = anexo.tipo === 'application/pdf' || anexo.nome.toLowerCase().endsWith('.pdf');
          if (isPdf) {
            return (
              <a
                key={`${anexo.url}-${index}`}
                href={anexo.url}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-24 flex-col justify-between rounded-xl border border-border bg-background p-3 text-left transition hover:border-brand-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                aria-label={`Abrir PDF ${anexo.nome}`}
              >
                <FileText className="text-brand-red" size={24} />
                <span className="mt-3 flex items-center gap-1 truncate text-xs font-medium text-text-primary">
                  {anexo.nome} <ExternalLink size={12} />
                </span>
              </a>
            );
          }

          return (
            <button
              type="button"
              key={`${anexo.url}-${index}`}
              onClick={() => setActiveAttachment(anexo)}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label={`Ampliar imagem ${anexo.nome}`}
            >
              <img src={anexo.url} alt={anexo.nome} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
              <span className="absolute inset-x-0 bottom-0 truncate bg-black/65 px-2 py-1.5 text-left text-[11px] text-white">
                {anexo.nome}
              </span>
            </button>
          );
        })}
      </div>
      <Lightbox attachment={activeAttachment} onClose={() => setActiveAttachment(null)} />
    </>
  );
}

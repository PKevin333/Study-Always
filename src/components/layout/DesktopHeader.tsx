import React from 'react';
import { CalendarDays, Settings, Timer } from 'lucide-react';

interface DesktopHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  profile: any;
}

const TAB_LABELS: Record<string, string> = {
  dashboard: 'Página inicial',
  focus: 'Foco de estudo',
  daily: 'Plano do dia',
  calendar: 'Calendário',
  kanban: 'Quadro Kanban',
  cycle: 'Ciclo de estudos',
  subjects: 'Disciplinas',
  topics: 'Tópicos',
  performance: 'Desempenho',
  errors: 'Caderno de erros',
  timer: 'Cronômetro',
  history: 'Histórico',
  mentor: 'Mentor IA',
  settings: 'Configurações'
};

export function DesktopHeader({ activeTab, setActiveTab, user, profile }: DesktopHeaderProps) {
  const profileName = profile?.displayName || user?.displayName || 'Usuário';
  const profilePhotoUrl = profile?.photoURL || user?.photoURL || '';
  const profileInitial = profileName.trim().charAt(0).toUpperCase() || 'U';
  const today = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long'
  }).format(new Date());

  return (
    <header className="hidden h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6 lg:flex xl:px-8">
      <div className="min-w-0">
        <h1 className="truncate text-base font-bold text-text-primary">{TAB_LABELS[activeTab] || 'Study Always'}</h1>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs capitalize text-text-secondary">
          <CalendarDays size={12} /> {today}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('timer')}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-bold text-text-secondary transition hover:border-brand-primary/40 hover:text-brand-primary"
        >
          <Timer size={16} /> Cronômetro
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary transition hover:border-brand-primary/40 hover:text-brand-primary"
          aria-label="Abrir configurações"
        >
          <Settings size={17} />
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className="ml-1 flex items-center gap-2 border-l border-border pl-3 text-left"
          aria-label="Abrir perfil"
        >
          {profilePhotoUrl ? (
            <img src={profilePhotoUrl} alt="Perfil" className="h-9 w-9 rounded-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary text-xs font-black text-white">
              {profileInitial}
            </span>
          )}
          <span className="hidden max-w-32 truncate text-xs font-bold text-text-primary xl:block">{profileName}</span>
        </button>
      </div>
    </header>
  );
}

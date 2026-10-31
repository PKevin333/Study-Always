import React from 'react';
import { 
  LayoutDashboard, 
  Target, 
  CalendarCheck, 
  CalendarDays,
  Kanban, 
  History, 
  BookOpen, 
  BarChart3, 
  ListChecks, 
  Timer, 
  Sparkles, 
  Settings, 
  LogOut,
  ClipboardList,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { NavItem } from '../ui/NavItem';
import { cn } from '../../lib/utils';
import { auth } from '../../firebase';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  user: any;
  profile: any;
}

export function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isMobileMenuOpen, 
  setIsMobileMenuOpen, 
  user, 
  profile 
}: SidebarProps) {
  const targetContest = profile?.targetExam || profile?.concursoAlvo || (profile?.area === 'controle' ? 'Tribunais de Contas' : 'Área Administrativa');
  const profilePhotoUrl = profile?.photoURL || user?.photoURL || '';
  const profileName = profile?.displayName || user?.displayName || 'Usuário';
  const profileInitial = React.useMemo(() => {
    const parts = profileName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
  }, [profileName]);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const profileMenuRef = React.useRef<HTMLDivElement | null>(null);

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  React.useEffect(() => {
    if (!isProfileMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileMenuOpen]);

  return (
    <>
      {/* Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-[15.5rem] transform flex-col border-r border-white/10 bg-[var(--sidebar-background)] px-3 py-4 text-[var(--sidebar-text)] shadow-2xl transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="mb-7 flex items-center gap-3 border-b border-white/10 px-2 pb-5 pt-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5">
            <Target className="text-white w-6 h-6" />
          </div>
          <div>
            <span className="block text-lg font-black leading-none tracking-tight text-white">Study Always</span>
            <span className="mt-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--sidebar-muted)]">Seu plano de estudos</span>
          </div>
        </div>

        <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto pr-1">
          <p className="px-3 pb-2 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--sidebar-muted)]">Hoje</p>
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => handleNavClick('dashboard')} />
          <NavItem icon={<Target size={20} />} label="Foco de Estudo" active={activeTab === 'focus'} onClick={() => handleNavClick('focus')} />

          <p className="px-3 pb-2 pt-5 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--sidebar-muted)]">Planejamento</p>
          <NavItem icon={<CalendarCheck size={20} />} label="Plano do Dia" active={activeTab === 'daily'} onClick={() => handleNavClick('daily')} />
          <NavItem icon={<CalendarDays size={20} />} label="Calendário" active={activeTab === 'calendar'} onClick={() => handleNavClick('calendar')} />
          <NavItem icon={<Kanban size={20} />} label="Quadro Kanban" active={activeTab === 'kanban'} onClick={() => handleNavClick('kanban')} />
          <NavItem icon={<History size={20} />} label="Ciclo de Estudos" active={activeTab === 'cycle'} onClick={() => handleNavClick('cycle')} />
          <NavItem icon={<BookOpen size={20} />} label="Disciplinas" active={activeTab === 'subjects'} onClick={() => handleNavClick('subjects')} />

          <p className="px-3 pb-2 pt-5 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--sidebar-muted)]">Evolução</p>
          <NavItem icon={<BarChart3 size={20} />} label="Desempenho" active={activeTab === 'performance'} onClick={() => handleNavClick('performance')} />
          <NavItem icon={<ListChecks size={20} />} label="Caderno de Erros" active={activeTab === 'errors'} onClick={() => handleNavClick('errors')} />
          <NavItem icon={<Timer size={20} />} label="Cronômetro" active={activeTab === 'timer'} onClick={() => handleNavClick('timer')} />
          <NavItem icon={<ClipboardList size={20} />} label="Histórico" active={activeTab === 'history'} onClick={() => handleNavClick('history')} />
          <NavItem icon={<Sparkles size={20} />} label="Mentor IA" badge="IA" active={activeTab === 'mentor'} onClick={() => handleNavClick('mentor')} />

          <p className="px-3 pb-2 pt-5 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--sidebar-muted)]">Conta</p>
          <NavItem icon={<Settings size={20} />} label="Configurações" active={activeTab === 'settings'} onClick={() => handleNavClick('settings')} />
        </nav>

        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-left transition-colors hover:bg-white/10"
              onClick={() => setIsProfileMenuOpen((current) => !current)}
              aria-haspopup="menu"
              aria-expanded={isProfileMenuOpen}
              aria-label="Abrir menu do perfil"
            >
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full font-bold"
                  style={{
                    backgroundColor: 'var(--bg-accent)',
                    color: 'var(--text-accent)'
                  }}
                >
                  {profileInitial}
                </div>
              )}
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="truncate text-sm font-medium text-white">{profileName}</div>
                <div className="truncate text-xs text-[var(--sidebar-muted)]">{targetContest}</div>
              </div>
              {isProfileMenuOpen ? (
                <ChevronUp size={18} className="shrink-0 text-[var(--sidebar-muted)]" />
              ) : (
                <ChevronDown size={18} className="shrink-0 text-[var(--sidebar-muted)]" />
              )}
            </button>

            {isProfileMenuOpen && (
              <div
                className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-2xl border border-border bg-card p-1 shadow-xl"
                role="menu"
                aria-label="Menu do perfil"
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-text-primary transition-colors hover:bg-background/70"
                  onClick={() => handleNavClick('settings')}
                  role="menuitem"
                >
                  <Settings size={18} />
                  <span>Configurações</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-brand-red transition-colors hover:bg-brand-red/10"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    void auth.signOut();
                  }}
                  role="menuitem"
                >
                  <LogOut size={18} />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

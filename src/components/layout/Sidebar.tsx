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
        "fixed lg:static inset-y-0 left-0 w-64 border-r border-border bg-card lg:bg-transparent flex flex-col p-6 z-50 transition-transform duration-300 transform lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center">
            <Target className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight">Study Always</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => handleNavClick('dashboard')} />
          <NavItem icon={<Target size={20} />} label="Foco de Estudo" active={activeTab === 'focus'} onClick={() => handleNavClick('focus')} />
          <NavItem icon={<CalendarCheck size={20} />} label="Plano do Dia" active={activeTab === 'daily'} onClick={() => handleNavClick('daily')} />
          <NavItem icon={<CalendarDays size={20} />} label="Calendário" active={activeTab === 'calendar'} onClick={() => handleNavClick('calendar')} />
          <NavItem icon={<Kanban size={20} />} label="Quadro Kanban" active={activeTab === 'kanban'} onClick={() => handleNavClick('kanban')} />
          <NavItem icon={<History size={20} />} label="Ciclo de Estudos" active={activeTab === 'cycle'} onClick={() => handleNavClick('cycle')} />
          <NavItem icon={<BookOpen size={20} />} label="Disciplinas" active={activeTab === 'subjects'} onClick={() => handleNavClick('subjects')} />
          <NavItem icon={<BarChart3 size={20} />} label="Desempenho" active={activeTab === 'performance'} onClick={() => handleNavClick('performance')} />
          <NavItem icon={<ListChecks size={20} />} label="Caderno de Erros" active={activeTab === 'errors'} onClick={() => handleNavClick('errors')} />
          <NavItem icon={<Timer size={20} />} label="Cronômetro" active={activeTab === 'timer'} onClick={() => handleNavClick('timer')} />
          <NavItem icon={<ClipboardList size={20} />} label="Histórico" active={activeTab === 'history'} onClick={() => handleNavClick('history')} />
          <NavItem icon={<Sparkles size={20} />} label="Mentor IA" badge="IA" active={activeTab === 'mentor'} onClick={() => handleNavClick('mentor')} />
          <NavItem icon={<Settings size={20} />} label="Configurações" active={activeTab === 'settings'} onClick={() => handleNavClick('settings')} />
        </nav>

        <div className="pt-6 border-t border-border mt-auto">
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-background/70"
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
                <div className="truncate text-sm font-medium text-text-primary">{profileName}</div>
                <div className="truncate text-xs text-text-secondary">{targetContest}</div>
              </div>
              {isProfileMenuOpen ? (
                <ChevronUp size={18} className="shrink-0 text-text-secondary" />
              ) : (
                <ChevronDown size={18} className="shrink-0 text-text-secondary" />
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

import React from 'react';
import { 
  LayoutDashboard, 
  Target, 
  CalendarCheck, 
  Kanban, 
  History, 
  BookOpen, 
  BarChart3, 
  ListChecks, 
  Timer, 
  Sparkles, 
  Settings, 
  LogOut,
  ClipboardList
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

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

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
          <NavItem icon={<Kanban size={20} />} label="Quadro Kanban" active={activeTab === 'kanban'} onClick={() => handleNavClick('kanban')} />
          <NavItem icon={<History size={20} />} label="Ciclo de Estudos" active={activeTab === 'cycle'} onClick={() => handleNavClick('cycle')} />
          <NavItem icon={<BookOpen size={20} />} label="Disciplinas" active={activeTab === 'subjects'} onClick={() => handleNavClick('subjects')} />
          <NavItem icon={<BarChart3 size={20} />} label="Desempenho" active={activeTab === 'performance'} onClick={() => handleNavClick('performance')} />
          <NavItem icon={<ListChecks size={20} />} label="Caderno de Erros" active={activeTab === 'errors'} onClick={() => handleNavClick('errors')} />
          <NavItem icon={<Timer size={20} />} label="Cronômetro" active={activeTab === 'timer'} onClick={() => handleNavClick('timer')} />
          <NavItem icon={<ClipboardList size={20} />} label="Histórico" active={activeTab === 'history'} onClick={() => handleNavClick('history')} />
          <NavItem icon={<Sparkles size={20} />} label="Mentor IA" active={activeTab === 'mentor'} onClick={() => handleNavClick('mentor')} />
          <NavItem icon={<Settings size={20} />} label="Configurações" active={activeTab === 'settings'} onClick={() => handleNavClick('settings')} />
        </nav>

        <div className="pt-6 border-t border-border mt-auto">
          <div className="flex items-center gap-3 mb-4 px-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleNavClick('settings')}>
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="Profile" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold">
                {user?.displayName?.[0] || 'U'}
              </div>
            )}
            <div className="overflow-hidden">
              <div className="text-sm font-medium truncate">{profile?.displayName || user?.displayName}</div>
              <div className="text-xs text-text-secondary truncate">{targetContest}</div>
            </div>
          </div>
          <button onClick={() => auth.signOut()} className="w-full flex items-center gap-3 px-3 py-2 text-text-secondary hover:text-text-primary transition-colors">
            <LogOut size={20} />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}

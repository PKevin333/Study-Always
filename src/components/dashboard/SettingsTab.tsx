import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, X, Eye, Check, Sparkles, BookOpen } from 'lucide-react';
import { cn } from '../../lib/utils';
import { GerenciarMaterias } from './GerenciarMaterias';

interface SettingsTabProps {
  saveStatus: 'idle' | 'saving' | 'success' | 'error';
  editProfileName: string;
  setEditProfileName: (name: string) => void;
  editProfilePhoto: string;
  setEditProfilePhoto: (photo: string) => void;
  editProfileCover: string;
  setEditProfileCover: (cover: string) => void;
  urlErrors: { photo?: string, cover?: string };
  setUrlErrors: React.Dispatch<React.SetStateAction<{ photo?: string, cover?: string }>>;
  handleSaveProfile: () => void;
  user: any;
  profile: any;
  updateDoc: any;
  doc: any;
  db: any;
}

export function SettingsTab({
  saveStatus,
  editProfileName,
  setEditProfileName,
  editProfilePhoto,
  setEditProfilePhoto,
  editProfileCover,
  setEditProfileCover,
  urlErrors,
  setUrlErrors,
  handleSaveProfile,
  user,
  profile,
  updateDoc,
  doc,
  db
}: SettingsTabProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }} 
      key="settings" 
      className="max-w-5xl mx-auto pb-20"
    >
      <header className="mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Configurações</h2>
        <p className="text-text-secondary text-sm sm:text-base">Personalize sua experiência e perfil.</p>
      </header>

      <div className="space-y-8">
        {/* Matérias do Usuário */}
        {user?.uid && (
          <GerenciarMaterias userId={user.uid} />
        )}

        {/* Perfil */}
        <section className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-xl font-bold">Perfil do Usuário</h3>
            {saveStatus === 'success' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="flex items-center gap-2 text-brand-primary text-sm font-bold"
              >
                <CheckCircle2 size={18} /> Perfil atualizado com sucesso
              </motion.div>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Coluna Esquerda: Inputs */}
            <div className="p-4 md:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-border">
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-2">Nome de Exibição</label>
                <input 
                  type="text" 
                  value={editProfileName}
                  onChange={(e) => setEditProfileName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-brand-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-text-secondary mb-2">Imagem de perfil (link ou GIF)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      placeholder="https://exemplo.com/foto.gif"
                      value={editProfilePhoto}
                      onChange={(e) => setEditProfilePhoto(e.target.value)}
                      className={cn(
                        "w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-brand-primary transition-all pr-10",
                        urlErrors.photo && "border-brand-red focus:border-brand-red"
                      )}
                    />
                    {editProfilePhoto && (
                      <button 
                        onClick={() => setEditProfilePhoto('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-brand-red transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <button 
                    onClick={() => window.open(editProfilePhoto, '_blank')}
                    disabled={!editProfilePhoto}
                    className="p-3 bg-background border border-border rounded-xl hover:border-brand-primary transition-all disabled:opacity-30"
                    title="Visualizar"
                  >
                    <Eye size={20} />
                  </button>
                </div>
                {urlErrors.photo && <p className="text-[10px] text-brand-red mt-1 font-bold">{urlErrors.photo}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-text-secondary mb-2">Imagem de capa (link ou GIF)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      placeholder="https://exemplo.com/capa.gif"
                      value={editProfileCover}
                      onChange={(e) => setEditProfileCover(e.target.value)}
                      className={cn(
                        "w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-brand-primary transition-all pr-10",
                        urlErrors.cover && "border-brand-red focus:border-brand-red"
                      )}
                    />
                    {editProfileCover && (
                      <button 
                        onClick={() => setEditProfileCover('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-brand-red transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <button 
                    onClick={() => window.open(editProfileCover, '_blank')}
                    disabled={!editProfileCover}
                    className="p-3 bg-background border border-border rounded-xl hover:border-brand-primary transition-all disabled:opacity-30"
                    title="Visualizar"
                  >
                    <Eye size={20} />
                  </button>
                </div>
                {urlErrors.cover && <p className="text-[10px] text-brand-red mt-1 font-bold">{urlErrors.cover}</p>}
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleSaveProfile}
                  disabled={saveStatus === 'saving'}
                  className="w-full bg-brand-primary text-white font-bold py-4 rounded-2xl hover:bg-brand-primary/80 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 disabled:opacity-50"
                >
                  {saveStatus === 'saving' ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : saveStatus === 'success' ? (
                    <Check size={20} />
                  ) : (
                    "Salvar alterações"
                  )}
                </button>
              </div>
            </div>
            
            {/* Coluna Direita: Preview */}
            <div className="p-4 md:p-8 bg-background/50 flex items-center justify-center">
              <div className="w-full max-w-sm">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4 text-center">Preview em tempo real</p>
                <div className="relative bg-card border border-border rounded-3xl overflow-hidden shadow-2xl group">
                  {/* Capa */}
                  <div className="h-32 w-full bg-border overflow-hidden relative">
                    {editProfileCover ? (
                      <img 
                        src={editProfileCover} 
                        alt="Cover Preview" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        referrerPolicy="no-referrer"
                        onError={() => setUrlErrors(prev => ({...prev, cover: 'Link inválido'}))}
                        onLoad={() => setUrlErrors(prev => ({...prev, cover: undefined}))}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-primary/20 via-brand-primary/5 to-transparent"></div>
                    )}
                  </div>

                  {/* Foto de Perfil */}
                  <div className="absolute top-20 left-1/2 -translate-x-1/2">
                    <div className="relative">
                      {editProfilePhoto ? (
                        <img 
                          src={editProfilePhoto} 
                          alt="Profile Preview" 
                          className="w-24 h-24 rounded-full object-cover border-4 border-card shadow-xl transition-transform duration-500 group-hover:scale-110" 
                          referrerPolicy="no-referrer"
                          onError={() => setUrlErrors(prev => ({...prev, photo: 'Link inválido'}))}
                          onLoad={() => setUrlErrors(prev => ({...prev, photo: undefined}))}
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-3xl border-4 border-card shadow-xl">
                          {editProfileName?.[0] || user?.displayName?.[0] || 'U'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-16 pb-8 px-6 text-center">
                    <h4 className="text-xl font-bold mb-1">{editProfileName || user?.displayName}</h4>
                    <p className="text-sm text-text-secondary">{profile?.area === 'controle' ? 'Tribunal de Contas' : 'Área Administrativa'}</p>
                    
                    <div className="mt-6 flex justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-brand-primary"></div>
                      <div className="w-2 h-2 rounded-full bg-brand-primary/30"></div>
                      <div className="w-2 h-2 rounded-full bg-brand-primary/30"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Aparência */}
        <section className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <Sparkles size={24} className="text-brand-primary" /> Personalização Visual
          </h3>
          
          <div className="space-y-10">
            <div>
              <label className="block text-sm font-bold text-text-secondary mb-4 uppercase tracking-wider">Tema do Sistema</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { id: 'dark', label: 'Modo Escuro', desc: 'Conforto visual para longas sessões.', icon: <div className="w-6 h-6 rounded-full bg-[#0f0f0f] border border-[#262626]"></div> },
                  { id: 'light', label: 'Modo Claro', desc: 'Clareza e brilho para o dia a dia.', icon: <div className="w-6 h-6 rounded-full bg-[#f9fafb] border border-[#e5e7eb]"></div> },
                  { id: 'bw', label: 'Minimalista', desc: 'Foco total, sem distrações visuais.', icon: <div className="w-6 h-6 rounded-full bg-white border border-black flex items-center justify-center"><div className="w-3 h-3 bg-black rounded-full"></div></div> }
                ].map(theme => (
                  <button
                    key={theme.id}
                    onClick={async () => {
                      if (!user || !db) return;
                      await updateDoc(doc(db, 'users', user.uid), { theme: theme.id });
                    }}
                    className={cn(
                      "flex flex-col gap-4 p-6 rounded-2xl border transition-all text-left group",
                      (profile?.theme || 'dark') === theme.id ? "bg-brand-primary/5 border-brand-primary shadow-lg shadow-brand-primary/5" : "bg-background border-border hover:border-brand-primary/30"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      {theme.icon}
                      {(profile?.theme || 'dark') === theme.id && <CheckCircle2 size={20} className="text-brand-primary" />}
                    </div>
                    <div>
                      <div className={cn("font-bold mb-1", (profile?.theme || 'dark') === theme.id ? "text-brand-primary" : "text-text-primary")}>{theme.label}</div>
                      <div className="text-xs text-text-secondary leading-relaxed">{theme.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-text-secondary mb-6 uppercase tracking-wider">Cor de Destaque</label>
              <div className="flex flex-wrap gap-6">
                {[
                  { id: 'green', color: '#22c55e', name: 'Verde' },
                  { id: 'blue', color: '#3b82f6', name: 'Azul' },
                  { id: 'purple', color: '#a855f7', name: 'Roxo' },
                  { id: 'orange', color: '#f97316', name: 'Laranja' }
                ].map(accent => (
                  <button
                    key={accent.id}
                    onClick={async () => {
                      if (!user || !db) return;
                      await updateDoc(doc(db, 'users', user.uid), { accentColor: accent.id });
                    }}
                    className="flex flex-col items-center gap-3 group"
                  >
                    <div 
                      className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg",
                        (profile?.accentColor || 'green') === accent.id ? "scale-110 ring-4 ring-offset-4 ring-offset-background" : "hover:scale-105 opacity-60 hover:opacity-100"
                      )}
                      style={{ 
                        backgroundColor: accent.color,
                        borderColor: accent.color
                      }}
                    >
                      {(profile?.accentColor || 'green') === accent.id && <Check size={28} className="text-white" />}
                    </div>
                    <span className={cn("text-xs font-bold transition-colors", (profile?.accentColor || 'green') === accent.id ? "text-brand-primary" : "text-text-secondary")}>
                      {accent.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

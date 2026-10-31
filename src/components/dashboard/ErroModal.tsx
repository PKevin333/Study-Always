import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { ErrorAttachment, ErrorType, StudyError, StudyErrorDraft, Subject } from '../../types';
import { uploadErrorAttachment } from '../../services/upload';
import { AnexosUploader } from './AnexosUploader';
import { getErrorContent, getErrorSubjectName } from './errorUtils';

interface ErroModalProps {
  open: boolean;
  userId: string;
  subjects: Subject[];
  editingError: StudyError | null;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: StudyErrorDraft) => Promise<boolean>;
}

const ERROR_TYPES: { value: ErrorType; label: string; helper: string }[] = [
  { value: 'atencao', label: 'Falta de atenção', helper: 'Eu sabia, mas deixei passar um detalhe.' },
  { value: 'nao_sabia', label: 'Não sabia', helper: 'O conteúdo ainda não estava consolidado.' },
  { value: 'confusao', label: 'Confusão', helper: 'Misturei regras ou conceitos parecidos.' },
  { value: 'pegadinha', label: 'Pegadinha', helper: 'A questão induziu a uma leitura errada.' }
];

const fileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

export function ErroModal({
  open,
  userId,
  subjects,
  editingError,
  saving,
  onClose,
  onSave
}: ErroModalProps) {
  const titleRef = React.useRef<HTMLInputElement | null>(null);
  const [subjectId, setSubjectId] = React.useState('');
  const [assunto, setAssunto] = React.useState('');
  const [tipoErro, setTipoErro] = React.useState<ErrorType>('atencao');
  const [conteudo, setConteudo] = React.useState('');
  const [tagsText, setTagsText] = React.useState('');
  const [nivel, setNivel] = React.useState(1);
  const [files, setFiles] = React.useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = React.useState<ErrorAttachment[]>([]);
  const [progress, setProgress] = React.useState<Record<string, number>>({});
  const [formError, setFormError] = React.useState('');
  const [uploading, setUploading] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const matchingSubject = editingError
      ? subjects.find(subject => subject.name === getErrorSubjectName(editingError))
      : undefined;
    setSubjectId(editingError?.subjectId || matchingSubject?.id || subjects[0]?.id || '');
    setAssunto(editingError?.assunto || '');
    setTipoErro(editingError?.tipoErro || 'atencao');
    setConteudo(editingError ? getErrorContent(editingError) : '');
    setTagsText(editingError?.tags?.join(', ') || '');
    setNivel(editingError?.nivel || 1);
    setExistingAttachments(editingError?.anexos || []);
    setFiles([]);
    setProgress({});
    setFormError('');
    window.setTimeout(() => titleRef.current?.focus(), 100);
  }, [editingError, open, subjects]);

  React.useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving && !uploading) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, open, saving, uploading]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    const trimmedContent = conteudo.trim();
    const subject = subjects.find(item => item.id === subjectId);

    if (!subject || !trimmedContent) {
      setFormError('Selecione uma disciplina e descreva o erro.');
      return;
    }
    if (trimmedContent.length > 5000) {
      setFormError('O conteúdo deve ter no máximo 5000 caracteres.');
      return;
    }

    let uploadedAttachments: ErrorAttachment[] = [];
    setUploading(files.length > 0);
    try {
      uploadedAttachments = await Promise.all(files.map(file => uploadErrorAttachment(
        userId,
        file,
        value => setProgress(current => ({ ...current, [fileKey(file)]: value }))
      )));
    } catch (error) {
      console.error('Error uploading error attachments:', error);
      setFormError('Não foi possível enviar os anexos. Verifique sua conexão e tente novamente.');
      setUploading(false);
      return;
    }

    try {
      const saved = await onSave({
        subjectId,
        disciplina: subject.name,
        assunto: assunto.trim() || undefined,
        tipoErro,
        conteudo: trimmedContent,
        anexos: [...existingAttachments, ...uploadedAttachments],
        tags: tagsText.split(',').map(tag => tag.trim()).filter(Boolean).slice(0, 10),
        nivel
      });
      if (saved) {
        onClose();
      } else {
        setFormError(files.length > 0
          ? 'Os anexos foram enviados, mas o registro não foi salvo. As regras do Firebase Storage e Firestore precisam estar publicadas.'
          : 'Não foi possível salvar o registro. Tente novamente em alguns instantes.');
      }
    } catch (error) {
      console.error('Error saving study error:', error);
      setFormError('Não foi possível salvar o registro. Tente novamente em alguns instantes.');
    } finally {
      setUploading(false);
    }
  };

  const busy = saving || uploading;

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[100] flex justify-end sm:items-center sm:justify-center sm:p-4">
          <motion.button
            type="button"
            aria-label="Fechar formulário"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !busy && onClose()}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="erro-modal-title"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="relative h-full w-[min(94vw,430px)] overflow-y-auto border-l border-border bg-card shadow-2xl sm:h-auto sm:max-h-[92vh] sm:w-full sm:max-w-2xl sm:rounded-3xl sm:border"
          >
            <form onSubmit={handleSubmit} className="p-5 sm:p-7">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">Caderno de Erros</p>
                  <h3 id="erro-modal-title" className="text-2xl font-bold text-text-primary">
                    {editingError ? 'Editar registro' : 'Registrar novo erro'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy}
                  className="rounded-xl border border-border p-2 text-text-secondary hover:bg-[var(--surface-muted)] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                  aria-label="Fechar"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Disciplina *
                    <select
                      value={subjectId}
                      onChange={event => setSubjectId(event.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-normal normal-case tracking-normal text-text-primary outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                    >
                      <option value="">Selecione</option>
                      {subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                    </select>
                  </label>
                  <label className="space-y-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Assunto
                    <input
                      ref={titleRef}
                      value={assunto}
                      onChange={event => setAssunto(event.target.value)}
                      maxLength={160}
                      placeholder="Ex: Competências da União"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-normal normal-case tracking-normal text-text-primary outline-none placeholder:text-text-secondary/60 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                    />
                  </label>
                </div>

                <fieldset>
                  <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-text-secondary">Tipo do erro *</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {ERROR_TYPES.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTipoErro(option.value)}
                        className={`rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${tipoErro === option.value ? 'border-brand-primary bg-brand-primary/15' : 'border-border bg-background hover:border-brand-primary/50'}`}
                        aria-pressed={tipoErro === option.value}
                        title={option.helper}
                      >
                        <span className="block text-xs font-bold text-text-primary">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="block space-y-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
                  O que aconteceu? *
                  <textarea
                    value={conteudo}
                    onChange={event => setConteudo(event.target.value)}
                    maxLength={5000}
                    rows={7}
                    placeholder="Escreva com suas palavras o erro, a regra correta e o que lembrar na próxima vez..."
                    className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm font-normal normal-case leading-relaxed tracking-normal text-text-primary outline-none placeholder:text-text-secondary/60 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                  />
                  <span className="block text-right text-[11px] font-normal normal-case tracking-normal text-text-secondary">{conteudo.length}/5000</span>
                </label>

                <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                  <label className="space-y-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Tags
                    <input
                      value={tagsText}
                      onChange={event => setTagsText(event.target.value)}
                      placeholder="lei seca, revisão, prova"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-normal normal-case tracking-normal text-text-primary outline-none placeholder:text-text-secondary/60 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                    />
                  </label>
                  <label className="space-y-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Nível
                    <select
                      value={nivel}
                      onChange={event => setNivel(Number(event.target.value))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-normal normal-case tracking-normal text-text-primary outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                    >
                      {[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-secondary">Anexos</p>
                  <AnexosUploader
                    files={files}
                    existingAttachments={existingAttachments}
                    progress={progress}
                    disabled={busy}
                    onFilesChange={setFiles}
                    onExistingAttachmentsChange={setExistingAttachments}
                  />
                </div>

                {formError ? (
                  <div className="flex items-start gap-2 rounded-xl border border-brand-red/30 bg-brand-red/10 p-3 text-sm text-brand-red" role="alert">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" /> {formError}
                  </div>
                ) : null}
              </div>

              <div className="sticky bottom-0 -mx-5 mt-7 flex gap-3 border-t border-border bg-card/95 px-5 pb-1 pt-4 backdrop-blur sm:static sm:mx-0 sm:px-0 sm:pb-0">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy}
                  className="h-11 flex-1 rounded-xl border border-border font-bold text-text-primary hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={busy || !subjectId || !conteudo.trim()}
                  className="h-11 flex-[1.4] rounded-xl bg-brand-primary font-bold text-white shadow-lg shadow-brand-primary/20 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:opacity-50"
                >
                  {uploading ? 'Enviando anexos...' : saving ? 'Salvando...' : editingError ? 'Salvar alterações' : 'Registrar erro'}
                </button>
              </div>
            </form>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

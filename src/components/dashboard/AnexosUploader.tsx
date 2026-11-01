import React from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, FileText, Paperclip, Trash2, UploadCloud } from 'lucide-react';
import { ErrorAttachment } from '../../types';
import {
  ERROR_ATTACHMENT_ACCEPT,
  MAX_ERROR_ATTACHMENTS,
  validateErrorAttachment
} from '../../services/upload';
import { cn } from '../../lib/utils';

interface AnexosUploaderProps {
  files: File[];
  existingAttachments: ErrorAttachment[];
  progress: Record<string, number>;
  disabled?: boolean;
  onFilesChange: (files: File[]) => void;
  onExistingAttachmentsChange: (attachments: ErrorAttachment[]) => void;
}

const fileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;
const formatSize = (size: number) => `${(size / 1024 / 1024).toFixed(size > 1024 * 1024 ? 1 : 2)} MB`;

export const getClipboardFiles = (clipboardData: DataTransfer | null): File[] => {
  if (!clipboardData) return [];

  const directFiles = Array.from(clipboardData.files || []);
  if (directFiles.length > 0) return directFiles;

  return Array.from(clipboardData.items || [])
    .filter(item => item.kind === 'file')
    .map(item => item.getAsFile())
    .filter((file): file is File => file !== null);
};

export const moveAttachment = <T,>(items: T[], index: number, offset: -1 | 1): T[] => {
  const targetIndex = index + offset;
  if (index < 0 || index >= items.length || targetIndex < 0 || targetIndex >= items.length) return items;
  const next = [...items];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
};

function LocalImagePreview({ file }: { file: File }) {
  const [url, setUrl] = React.useState('');

  React.useEffect(() => {
    if (!file.type.startsWith('image/')) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!url) return <Paperclip size={18} className="text-brand-primary" />;
  return <img src={url} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />;
}

export function AnexosUploader({
  files,
  existingAttachments,
  progress,
  disabled = false,
  onFilesChange,
  onExistingAttachmentsChange
}: AnexosUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const feedbackTimerRef = React.useRef<number | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [error, setError] = React.useState('');
  const [pasteFeedback, setPasteFeedback] = React.useState('');
  const totalCount = files.length + existingAttachments.length;

  const addFiles = React.useCallback((incoming: File[]) => {
    setError('');
    setPasteFeedback('');
    const availableSlots = MAX_ERROR_ATTACHMENTS - totalCount;
    if (availableSlots <= 0) {
      setError('Você pode adicionar no máximo 5 anexos.');
      return 0;
    }

    const accepted: File[] = [];
    for (const file of incoming.slice(0, availableSlots)) {
      const validationError = validateErrorAttachment(file);
      if (validationError) {
        setError(validationError);
        continue;
      }
      const duplicate = [...files, ...accepted].some(current => fileKey(current) === fileKey(file));
      if (!duplicate) accepted.push(file);
    }

    if (incoming.length > availableSlots) setError('Somente os primeiros arquivos dentro do limite de 5 foram adicionados.');
    if (accepted.length > 0) onFilesChange([...files, ...accepted]);
    return accepted.length;
  }, [files, onFilesChange, totalCount]);

  React.useEffect(() => {
    if (disabled) return;
    const handlePaste = (event: ClipboardEvent) => {
      const pastedFiles = getClipboardFiles(event.clipboardData);
      if (pastedFiles.length === 0) return;

      const acceptedCount = addFiles(pastedFiles);
      if (acceptedCount > 0) {
        event.preventDefault();
        setPasteFeedback(acceptedCount === 1 ? 'Imagem colada e adicionada aos anexos.' : `${acceptedCount} anexos colados e adicionados.`);
        if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = window.setTimeout(() => setPasteFeedback(''), 3500);
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [addFiles, disabled]);

  React.useEffect(() => () => {
    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
  }, []);

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Adicionar anexos por clique, arrastar ou colar"
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={event => {
          if (!disabled && (event.key === 'Enter' || event.key === ' ')) inputRef.current?.click();
        }}
        onDragEnter={event => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={event => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={event => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) addFiles(Array.from(event.dataTransfer.files));
        }}
        className={cn(
          'cursor-pointer rounded-2xl border border-dashed px-4 py-6 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
          dragging ? 'border-brand-primary bg-brand-primary/10' : 'border-border bg-background hover:border-brand-primary/60',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept={ERROR_ATTACHMENT_ACCEPT.join(',')}
          disabled={disabled}
          onChange={event => {
            addFiles(Array.from(event.target.files || []));
            event.target.value = '';
          }}
        />
        <UploadCloud className="mx-auto mb-2 text-brand-primary" size={26} />
        <p className="text-sm font-semibold text-text-primary">Clique, arraste ou cole uma imagem com Ctrl+V</p>
        <p className="mt-1 text-xs text-text-secondary">PNG, JPG, WEBP ou PDF · até 5 MB · {totalCount}/5</p>
      </div>

      {pasteFeedback ? (
        <p className="flex items-center gap-2 text-xs font-semibold text-brand-green" role="status" aria-live="polite">
          <CheckCircle2 size={15} /> {pasteFeedback}
        </p>
      ) : null}

      {error ? <p className="text-xs text-brand-red" role="alert">{error}</p> : null}

      {(existingAttachments.length > 0 || files.length > 0) && (
        <div className="space-y-2">
          {existingAttachments.map((attachment, index) => (
            <div key={`${attachment.url}-${index}`} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
              {attachment.tipo.startsWith('image/') ? (
                <img src={attachment.url} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
              ) : <FileText size={18} className="text-brand-red" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-text-primary">{attachment.nome}</p>
                <p className="text-[11px] text-text-secondary">{formatSize(attachment.tamanho)}</p>
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => onExistingAttachmentsChange(moveAttachment(existingAttachments, index, -1))}
                  disabled={disabled || index === 0}
                  className="rounded-md p-1.5 text-text-secondary hover:bg-[var(--surface-muted)] hover:text-text-primary disabled:opacity-25"
                  aria-label={`Mover ${attachment.nome} para cima`}
                >
                  <ChevronUp size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onExistingAttachmentsChange(moveAttachment(existingAttachments, index, 1))}
                  disabled={disabled || index === existingAttachments.length - 1}
                  className="rounded-md p-1.5 text-text-secondary hover:bg-[var(--surface-muted)] hover:text-text-primary disabled:opacity-25"
                  aria-label={`Mover ${attachment.nome} para baixo`}
                >
                  <ChevronDown size={15} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => onExistingAttachmentsChange(existingAttachments.filter((_, itemIndex) => itemIndex !== index))}
                disabled={disabled}
                className="rounded-lg p-2 text-text-secondary hover:bg-brand-red/10 hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                aria-label={`Remover ${attachment.nome}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {files.map((file, index) => {
            const currentProgress = progress[fileKey(file)];
            return (
              <div key={fileKey(file)} className="rounded-xl border border-border bg-background p-3">
                <div className="flex items-center gap-3">
                  <LocalImagePreview file={file} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-text-primary">{file.name}</p>
                    <p className="text-[11px] text-text-secondary">{formatSize(file.size)}</p>
                  </div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => onFilesChange(moveAttachment(files, index, -1))}
                      disabled={disabled || index === 0}
                      className="rounded-md p-1.5 text-text-secondary hover:bg-[var(--surface-muted)] hover:text-text-primary disabled:opacity-25"
                      aria-label={`Mover ${file.name} para cima`}
                    >
                      <ChevronUp size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onFilesChange(moveAttachment(files, index, 1))}
                      disabled={disabled || index === files.length - 1}
                      className="rounded-md p-1.5 text-text-secondary hover:bg-[var(--surface-muted)] hover:text-text-primary disabled:opacity-25"
                      aria-label={`Mover ${file.name} para baixo`}
                    >
                      <ChevronDown size={15} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onFilesChange(files.filter((_, itemIndex) => itemIndex !== index))}
                    disabled={disabled}
                    className="rounded-lg p-2 text-text-secondary hover:bg-brand-red/10 hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                    aria-label={`Remover ${file.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {currentProgress !== undefined ? (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                      <div className="h-full rounded-full bg-brand-primary transition-all" style={{ width: `${currentProgress}%` }} />
                    </div>
                    <span className="w-9 text-right text-[10px] text-text-secondary">{currentProgress}%</span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

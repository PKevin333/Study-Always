import React from 'react';
import { FileText, Image, Paperclip, Trash2, UploadCloud } from 'lucide-react';
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

export function AnexosUploader({
  files,
  existingAttachments,
  progress,
  disabled = false,
  onFilesChange,
  onExistingAttachmentsChange
}: AnexosUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [error, setError] = React.useState('');
  const totalCount = files.length + existingAttachments.length;

  const addFiles = React.useCallback((incoming: File[]) => {
    setError('');
    const availableSlots = MAX_ERROR_ATTACHMENTS - totalCount;
    if (availableSlots <= 0) {
      setError('Você pode adicionar no máximo 5 anexos.');
      return;
    }

    const accepted: File[] = [];
    for (const file of incoming.slice(0, availableSlots)) {
      const validationError = validateErrorAttachment(file);
      if (validationError) {
        setError(validationError);
        continue;
      }
      const duplicate = files.some(current => fileKey(current) === fileKey(file));
      if (!duplicate) accepted.push(file);
    }

    if (incoming.length > availableSlots) setError('Somente os primeiros arquivos dentro do limite de 5 foram adicionados.');
    if (accepted.length > 0) onFilesChange([...files, ...accepted]);
  }, [files, onFilesChange, totalCount]);

  React.useEffect(() => {
    if (disabled) return;
    const handlePaste = (event: ClipboardEvent) => {
      const pastedFiles = Array.from(event.clipboardData?.files || []);
      if (pastedFiles.length > 0) addFiles(pastedFiles);
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [addFiles, disabled]);

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
          dragging ? 'border-brand-primary bg-brand-primary/10' : 'border-[#4a4058] bg-[#17131d] hover:border-brand-primary/60',
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
        <p className="text-sm font-semibold text-white">Clique, arraste ou cole com Ctrl+V</p>
        <p className="mt-1 text-xs text-text-secondary">PNG, JPG, WEBP ou PDF · até 5 MB · {totalCount}/5</p>
      </div>

      {error ? <p className="text-xs text-rose-400" role="alert">{error}</p> : null}

      {(existingAttachments.length > 0 || files.length > 0) && (
        <div className="space-y-2">
          {existingAttachments.map((attachment, index) => (
            <div key={`${attachment.url}-${index}`} className="flex items-center gap-3 rounded-xl border border-[#383044] bg-[#17131d] p-3">
              {attachment.tipo.startsWith('image/') ? <Image size={18} className="text-violet-300" /> : <FileText size={18} className="text-rose-300" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-200">{attachment.nome}</p>
                <p className="text-[11px] text-text-secondary">{formatSize(attachment.tamanho)}</p>
              </div>
              <button
                type="button"
                onClick={() => onExistingAttachmentsChange(existingAttachments.filter((_, itemIndex) => itemIndex !== index))}
                disabled={disabled}
                className="rounded-lg p-2 text-text-secondary hover:bg-rose-500/10 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                aria-label={`Remover ${attachment.nome}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {files.map((file, index) => {
            const currentProgress = progress[fileKey(file)];
            return (
              <div key={fileKey(file)} className="rounded-xl border border-[#383044] bg-[#17131d] p-3">
                <div className="flex items-center gap-3">
                  <Paperclip size={18} className="text-violet-300" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-200">{file.name}</p>
                    <p className="text-[11px] text-text-secondary">{formatSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onFilesChange(files.filter((_, itemIndex) => itemIndex !== index))}
                    disabled={disabled}
                    className="rounded-lg p-2 text-text-secondary hover:bg-rose-500/10 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                    aria-label={`Remover ${file.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {currentProgress !== undefined ? (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
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

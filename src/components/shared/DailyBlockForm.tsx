import React from 'react';
import { Subject } from '../../types';
import { Modal } from './Modal';
import { getStudyTypeBadgeClasses, getStudyTypeBadgeLabel } from './StudyTypeBadge';
import { designTokens } from '../../styles/designTokens';
import { cn } from '../../lib/utils';

type DailyBlockFormType = 'teoria' | 'questoes' | 'revisao';

interface DailyBlockFormProps {
  open: boolean;
  title: string;
  subjects: Subject[];
  subjectId: string;
  type: DailyBlockFormType;
  durationMinutes: number;
  onClose: () => void;
  onSubmit: () => void;
  onSubjectChange: (subjectId: string) => void;
  onTypeChange: (type: DailyBlockFormType) => void;
  onDurationChange: (durationMinutes: number) => void;
  submitLabel: string;
  submitDisabled?: boolean;
  durationPresets?: number[];
}

export function DailyBlockForm({
  open,
  title,
  subjects,
  subjectId,
  type,
  durationMinutes,
  onClose,
  onSubmit,
  onSubjectChange,
  onTypeChange,
  onDurationChange,
  submitLabel,
  submitDisabled = false,
  durationPresets = []
}: DailyBlockFormProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border px-4 py-3 font-bold transition-all hover:bg-background"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitDisabled}
            className="flex-1 rounded-xl bg-brand-primary px-4 py-3 font-bold text-white transition-all hover:bg-brand-primary/80 disabled:opacity-50 shadow-lg shadow-brand-primary/20"
          >
            {submitLabel}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-secondary">Disciplina</label>
          <select
            value={subjectId}
            onChange={(event) => onSubjectChange(event.target.value)}
            className={designTokens.input}
          >
            <option value="">Selecione uma matéria</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-secondary">Tipo de Estudo</label>
          <div className="grid grid-cols-3 gap-2">
            {(['teoria', 'questoes', 'revisao'] as DailyBlockFormType[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onTypeChange(option)}
                className={cn(
                  'rounded-lg border py-2 text-xs font-bold capitalize transition-all',
                  type === option
                    ? getStudyTypeBadgeClasses(option, 'border-current')
                    : 'bg-background border-border text-text-secondary hover:border-brand-primary/30'
                )}
              >
                {getStudyTypeBadgeLabel(option)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-secondary">Duração (minutos)</label>
          {durationPresets.length > 0 && (
            <div className="mb-3 grid grid-cols-4 gap-2">
              {durationPresets.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => onDurationChange(minutes)}
                  className={cn(
                    'rounded-lg border py-2 text-xs font-bold transition-all',
                    durationMinutes === minutes
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                      : 'bg-background border-border text-text-secondary hover:border-brand-primary/30'
                  )}
                >
                  {minutes}'
                </button>
              ))}
            </div>
          )}
          <input
            type="number"
            min={1}
            step={5}
            value={durationMinutes}
            onChange={(event) => onDurationChange(parseInt(event.target.value, 10) || 0)}
            className={`${designTokens.input} text-center font-bold`}
            placeholder="Outro tempo..."
          />
        </div>
      </div>
    </Modal>
  );
}

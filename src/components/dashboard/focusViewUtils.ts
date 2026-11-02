export type FocusView = 'cards' | 'list' | 'table';

export type FocusSort = 'performance' | 'days' | 'errors' | 'topic';

export type SortDirection = 'asc' | 'desc';

export interface FocusViewItem {
  key: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  reason: string;
  percentage: number;
  errors: number;
  daysSinceLastStudy: number;
}

export interface FocusActionHandlers {
  onStudy: (item: FocusViewItem) => void;
  onAddToCycle: (item: FocusViewItem) => void;
  onMarkReviewed: (item: FocusViewItem) => void;
  onRemove: (item: FocusViewItem) => void;
}

export const getPerformanceTone = (percentage: number) => {
  if (percentage < 60) {
    return {
      accent: 'bg-red-500',
      badge: 'bg-red-500/10 text-red-500',
      text: 'text-red-500',
      cardAccent: 'before:bg-red-400',
      cardText: 'text-red-400',
    };
  }

  if (percentage < 80) {
    return {
      accent: 'bg-amber-500',
      badge: 'bg-amber-500/10 text-amber-500',
      text: 'text-amber-500',
      cardAccent: 'before:bg-amber-400',
      cardText: 'text-amber-400',
    };
  }

  return {
    accent: 'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-500',
    text: 'text-emerald-500',
    cardAccent: 'before:bg-emerald-400',
    cardText: 'text-emerald-400',
  };
};

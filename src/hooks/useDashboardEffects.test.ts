import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDashboardEffects } from './useDashboardEffects';

const mocks = vi.hoisted(() => ({
  effects: [] as Array<{ callback: () => unknown; dependencies: unknown[] }>,
  setToday: vi.fn(),
  query: vi.fn((...args: unknown[]) => args),
  onSnapshot: vi.fn(() => vi.fn()),
  limit: vi.fn((count: number) => ({ limit: count })),
}));

vi.mock('react', () => ({
  useEffect: (callback: () => unknown, dependencies: unknown[]) => {
    mocks.effects.push({ callback, dependencies });
  },
  useRef: (current: unknown) => ({ current }),
  useState: (initial: () => string) => [initial(), mocks.setToday],
}));
vi.mock('../firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, path: string) => path,
  query: mocks.query,
  onSnapshot: mocks.onSnapshot,
  orderBy: (...args: unknown[]) => ({ orderBy: args }),
  limit: mocks.limit,
  where: (...args: unknown[]) => ({ where: args }),
  Timestamp: { fromDate: (date: Date) => date },
}));

function createState(overrides: Record<string, unknown> = {}) {
  return {
    dailyBlocks: [],
    dailyPlanGuardUntil: 0,
    setDailyPlanGuardUntil: vi.fn(),
    setTopics: vi.fn(),
    setTimeLeft: vi.fn(),
    setSeconds: vi.fn(),
    setTimerActive: vi.fn(),
    setTimerMode: vi.fn(),
    setTotalTimeForMode: vi.fn(),
    setCurrentCycle: vi.fn(),
    timerActive: true,
    timeLeft: 0,
    seconds: 3000,
    timerMode: 'study',
    currentCycle: 1,
    cyclesBeforeLongBreak: 4,
    studyTime: 50,
    shortBreakTime: 10,
    longBreakTime: 20,
    selectedSubject: 'math',
    timerStudyType: 'teoria',
    ...overrides,
  };
}

describe('dashboard effects regressions', () => {
  const cleanups: Array<() => void> = [];

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.effects.length = 0;
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 19, 23, 59, 59));
    vi.stubGlobal('window', new EventTarget());
    vi.stubGlobal('document', new EventTarget());
  });

  afterEach(() => {
    cleanups.splice(0).forEach(cleanup => cleanup());
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function runEffects(state: ReturnType<typeof createState>, finishStudySession: ReturnType<typeof vi.fn>) {
    useDashboardEffects({ uid: 'alice' }, state, { finishStudySession });
    for (const effect of mocks.effects) {
      const cleanup = effect.callback();
      if (typeof cleanup === 'function') cleanups.push(cleanup as () => void);
    }
  }

  it('does not discard elapsed time while saving, and advances only on success', async () => {
    let resolveSave!: (saved: boolean) => void;
    const finishStudySession = vi.fn(() => new Promise<boolean>(resolve => { resolveSave = resolve; }));
    const state = createState();
    runEffects(state, finishStudySession);

    expect(state.setTimerActive).toHaveBeenCalledWith(false);
    expect(state.setSeconds).not.toHaveBeenCalled();
    expect(state.setTimerMode).not.toHaveBeenCalled();
    // A repeated effect while saving must not create a duplicate session.
    mocks.effects.at(-1)!.callback();
    expect(finishStudySession).toHaveBeenCalledTimes(1);

    resolveSave(true);
    await Promise.resolve();
    expect(state.setSeconds).toHaveBeenCalledWith(0);
    expect(state.setTimerMode).toHaveBeenCalledWith('shortBreak');
    expect(state.setTimeLeft).toHaveBeenCalledWith(600);
  });

  it('preserves elapsed time and phase when saving fails', async () => {
    const state = createState();
    runEffects(state, vi.fn().mockResolvedValue(false));
    await Promise.resolve();
    expect(state.setSeconds).not.toHaveBeenCalled();
    expect(state.setTimerMode).not.toHaveBeenCalled();
  });

  it('uses the long break after successfully saving the last cycle', async () => {
    const state = createState({ currentCycle: 4 });
    runEffects(state, vi.fn().mockResolvedValue(true));
    await Promise.resolve();
    expect(state.setTimerMode).toHaveBeenCalledWith('longBreak');
    expect(state.setTimeLeft).toHaveBeenCalledWith(1200);
    expect(state.setCurrentCycle).toHaveBeenCalledWith(1);
  });

  it('loads the complete question history, not just the latest 50 records', () => {
    runEffects(createState({ timerActive: false }), vi.fn());
    expect(mocks.query).toHaveBeenCalledWith(
      'users/alice/questionRecords',
      { orderBy: ['date', 'desc'] },
    );
    expect(mocks.limit).not.toHaveBeenCalledWith(50);
  });

  it('refreshes the date at midnight and when returning to the page', () => {
    runEffects(createState({ timerActive: false }), vi.fn());
    vi.advanceTimersByTime(1000);
    expect(mocks.setToday).toHaveBeenCalledWith('2026-10-20');
    mocks.setToday.mockClear();
    window.dispatchEvent(new Event('focus'));
    document.dispatchEvent(new Event('visibilitychange'));
    expect(mocks.setToday).toHaveBeenCalledTimes(2);
  });

  it('makes daily and weekly subscriptions depend on the current day', () => {
    runEffects(createState({ timerActive: false }), vi.fn());
    const subscriptions = mocks.effects.filter(effect => effect.dependencies.includes('2026-10-19'));
    expect(subscriptions).toHaveLength(2);
    for (const effect of subscriptions) {
      mocks.query.mockClear();
      effect.callback();
      expect(mocks.query.mock.calls[0][0]).toMatch(/\/(dailyBlocks|sessions)$/);
    }
  });
});

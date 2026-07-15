import { useState, useEffect } from 'react';
import { MentorAdvice } from '../services/geminiService';

export function useDashboardState(user: any, profile: any) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timerActive, setTimerActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  
  // Advanced Timer State
  const [timerMode, setTimerMode] = useState<'study' | 'shortBreak' | 'longBreak'>('study');
  const [studyTime, setStudyTime] = useState(50);
  const [shortBreakTime, setShortBreakTime] = useState(10);
  const [longBreakTime, setLongBreakTime] = useState(20);
  const [cyclesBeforeLongBreak, setCyclesBeforeLongBreak] = useState(4);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [timeLeft, setTimeLeft] = useState(50 * 60);
  const [totalTimeForMode, setTotalTimeForMode] = useState(50 * 60);
  const [timerPreset, setTimerPreset] = useState<'pomodoro' | 'medium' | 'deep' | 'custom'>('deep');
  const [timerStudyType, setTimerStudyType] = useState<'teoria' | 'questoes' | 'revisao'>('teoria');

  const [selectedSubject, setSelectedSubject] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectGroup, setNewSubjectGroup] = useState(1);
  const [mentorAdvice, setMentorAdvice] = useState<MentorAdvice | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [errorSubject, setErrorSubject] = useState('');
  const [errors, setErrors] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [savingError, setSavingError] = useState(false);
  const [cycleBlocks, setCycleBlocks] = useState<any[]>([]);
  const [dailyBlocks, setDailyBlocks] = useState<any[]>([]);
  const [dailyPlanGuardUntil, setDailyPlanGuardUntil] = useState(0);
  const [draggedBlock, setDraggedBlock] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Profile Editing State
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfilePhoto, setEditProfilePhoto] = useState('');
  const [editProfileCover, setEditProfileCover] = useState('');
  const [editTargetContest, setEditTargetContest] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [urlErrors, setUrlErrors] = useState<{photo?: string, cover?: string}>({});
  const [activeSessionBlock, setActiveSessionBlock] = useState<any | null>(null);
  const [selectedSubjectForTopics, setSelectedSubjectForTopics] = useState<any | null>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [newTopicName, setNewTopicName] = useState('');

  // Performance Records
  const [questionRecords, setQuestionRecords] = useState<any[]>([]);
  const [newRecordSubject, setNewRecordSubject] = useState('');
  const [newRecordTopic, setNewRecordTopic] = useState('');
  const [newRecordTotal, setNewRecordTotal] = useState<number>(0);
  const [newRecordCorrect, setNewRecordCorrect] = useState<number>(0);
  const [savingRecord, setSavingRecord] = useState(false);
  const [ignoredFocusTopics, setIgnoredFocusTopics] = useState<string[]>([]);
  const [weaknessPlan, setWeaknessPlan] = useState<any[]>([]);
  const [showWeaknessPlan, setShowWeaknessPlan] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Cycle settings
  const [cycleFocus, setCycleFocus] = useState('equilibrado');
  const [dailyTime, setDailyTime] = useState(120);
  const [blocksPerDay, setBlocksPerDay] = useState(2);
  const [blockDuration, setBlockDuration] = useState(60);
  const [cycleAutonomy, setCycleAutonomy] = useState('sugerido');

  useEffect(() => {
    if (profile) {
      setCycleFocus(profile.cycleFocus || 'equilibrado');
      setDailyTime(profile.dailyTimeMinutes || 120);
      setBlocksPerDay(profile.blocksPerDay || 2);
      setBlockDuration(profile.blockDurationMinutes || 60);
      setCycleAutonomy(profile.cycleAutonomy || 'sugerido');
    }
  }, [profile]);

  useEffect(() => {
    if (activeTab === 'settings' && profile) {
      setEditProfileName(profile.displayName || user?.displayName || '');
      setEditProfilePhoto(profile.photoURL || '');
      setEditProfileCover(profile.coverURL || '');
      setEditTargetContest(profile.targetExam || profile.concursoAlvo || (profile.area === 'controle' ? 'Tribunais de Contas' : 'Área Administrativa'));
      setSaveStatus('idle');
      setUrlErrors({});
    }
  }, [activeTab, profile, user]);

  return {
    subjects, setSubjects,
    activeTab, setActiveTab,
    timerActive, setTimerActive,
    seconds, setSeconds,
    timerMode, setTimerMode,
    studyTime, setStudyTime,
    shortBreakTime, setShortBreakTime,
    longBreakTime, setLongBreakTime,
    cyclesBeforeLongBreak, setCyclesBeforeLongBreak,
    currentCycle, setCurrentCycle,
    timeLeft, setTimeLeft,
    totalTimeForMode, setTotalTimeForMode,
    timerPreset, setTimerPreset,
    timerStudyType, setTimerStudyType,
    selectedSubject, setSelectedSubject,
    newSubjectName, setNewSubjectName,
    newSubjectGroup, setNewSubjectGroup,
    mentorAdvice, setMentorAdvice,
    loadingAdvice, setLoadingAdvice,
    errorText, setErrorText,
    errorSubject, setErrorSubject,
    errors, setErrors,
    sessions, setSessions,
    savingError, setSavingError,
    cycleBlocks, setCycleBlocks,
    dailyBlocks, setDailyBlocks,
    dailyPlanGuardUntil, setDailyPlanGuardUntil,
    draggedBlock, setDraggedBlock,
    isGenerating, setIsGenerating,
    editProfileName, setEditProfileName,
    editProfilePhoto, setEditProfilePhoto,
    editProfileCover, setEditProfileCover,
    editTargetContest, setEditTargetContest,
    saveStatus, setSaveStatus,
    urlErrors, setUrlErrors,
    activeSessionBlock, setActiveSessionBlock,
    selectedSubjectForTopics, setSelectedSubjectForTopics,
    topics, setTopics,
    newTopicName, setNewTopicName,
    questionRecords, setQuestionRecords,
    newRecordSubject, setNewRecordSubject,
    newRecordTopic, setNewRecordTopic,
    newRecordTotal, setNewRecordTotal,
    newRecordCorrect, setNewRecordCorrect,
    savingRecord, setSavingRecord,
    ignoredFocusTopics, setIgnoredFocusTopics,
    weaknessPlan, setWeaknessPlan,
    showWeaknessPlan, setShowWeaknessPlan,
    isMobileMenuOpen, setIsMobileMenuOpen,
    cycleFocus, setCycleFocus,
    dailyTime, setDailyTime,
    blocksPerDay, setBlocksPerDay,
    blockDuration, setBlockDuration,
    cycleAutonomy, setCycleAutonomy
  };
}

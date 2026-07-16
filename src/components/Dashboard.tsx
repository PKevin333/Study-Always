import React from 'react';
import { auth, db } from '../firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from './layout/Sidebar';
import { MobileHeader } from './layout/MobileHeader';
import { DashboardHome } from './dashboard/DashboardHome';
import { SubjectsTab } from './dashboard/SubjectsTab';
import { CycleTab } from './dashboard/CycleTab';
import { KanbanTab } from './dashboard/KanbanTab';
import { DailyPlanTab } from './dashboard/DailyPlanTab';
import { TimerTab } from './dashboard/TimerTab';
import { FocusTab } from './dashboard/FocusTab';
import { PerformanceTab } from './dashboard/PerformanceTab';
import { ErrorsTab } from './dashboard/ErrorsTab';
import { HistoryTab } from './dashboard/HistoryTab';
import { MentorTab } from './dashboard/MentorTab';
import { SettingsTab } from './dashboard/SettingsTab';
import { TopicsTab } from './dashboard/TopicsTab';
import { Onboarding } from './dashboard/Onboarding';
import { useDashboardState } from '../hooks/useDashboardState';
import { useDashboardEffects } from '../hooks/useDashboardEffects';
import { useDashboardActions } from '../hooks/useDashboardActions';
import { useDashboardLogic } from '../hooks/useDashboardLogic';

export default function Dashboard() {
  const { user, profile, loading, isAuthReady } = useAuth();
  const state = useDashboardState(user, profile);
  
  const {
    subjects,
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
    setDailyPlanGuardUntil,
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
  } = state;

  const actions = useDashboardActions(user, subjects, cycleBlocks, questionRecords, profile, errors);
  
  const {
    addSubject,
    updateSubject,
    deleteSubject,
    toggleSubjectStatus,
    moveSubject,
    addCycleBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    generateCycle,
    addDailyBlock,
    updateDailyBlock,
    deleteDailyBlock,
    saveError,
    rateErrorReview,
    deleteError,
    updateError,
    addQuestionRecord,
    deleteQuestionRecord,
    addTopic,
    updateTopic,
    deleteTopic,
    handleSaveProfile,
    fetchMentorAdvice,
    generateDailyPlan,
    finishStudySession,
    recordManualStudySession,
    updateCycleSettings,
    completeOnboarding
  } = actions;

  useDashboardEffects(user, state, actions);

  const logic = useDashboardLogic(
    subjects,
    cycleBlocks,
    dailyBlocks,
    questionRecords,
    sessions,
    ignoredFocusTopics,
    profile,
    dailyTime,
    blocksPerDay,
    errors
  );

  const {
    totalHours,
    totalQuestions,
    avgAccuracy,
    prioritySubjects,
    focusItems,
    getValidationAlerts,
    chartData,
    dailyAverage,
    overdueReviewsCount
  } = logic;

  // Helper functions for Dashboard
  const startStudySession = (block: any) => {
    updateDailyBlock(block.id, { status: 'em_andamento' });
    setActiveSessionBlock(block);
    setSelectedSubject(block.subjectId);
    setSeconds(0);
    setTimerActive(true);
    setActiveTab('timer');
  };

  const handleFinishSession = async () => {
    const success = await finishStudySession(activeSessionBlock, selectedSubject, seconds, timerStudyType);
    if (success) {
      setTimerActive(false);
      setActiveSessionBlock(null);
      setSeconds(0);
      if (activeSessionBlock) setActiveTab('daily');
    }
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimerMode('study');
    setTimeLeft(studyTime * 60);
    setTotalTimeForMode(studyTime * 60);
    setSeconds(0);
    setCurrentCycle(1);
  };

  const skipPhase = () => {
    // Phase transition is handled in useDashboardEffects timer logic
    setTimeLeft(0);
  };

  const handleProfileSave = async () => {
    setSaveStatus('saving');
    const success = await handleSaveProfile(editProfileName, editProfilePhoto, editProfileCover, editTargetContest);
    if (success) {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
    }
  };

  const handleGenerateDailyPlan = async () => {
    const generatedBlocks = await generateDailyPlan(dailyTime, blocksPerDay);
    // [FIX]: mostra o plano imediatamente apos a gravacao, sem depender do tempo do snapshot do Firestore.
    if (generatedBlocks.length > 0) {
      setDailyBlocks(generatedBlocks);
      // [FIX]: impede que um snapshot vazio atrasado sobrescreva o plano recem-gerado.
      setDailyPlanGuardUntil(Date.now() + 10000);
    }
  };

  const handleOnboardingComplete = async (data: { level: string, hours: number, subjects: string[] }) => {
    const success = await completeOnboarding(data);
    if (success) {
      // After onboarding, we need to generate cycle and daily plan
      // The subjects will be added to Firestore, but the state might not have them yet
      // However, the effects will fetch them.
      // We can wait a bit or just let the user see the empty state for a second
      // Or we can manually trigger generation once subjects are in state
      setActiveTab('daily');
    }
  };

  const handleAddCustomSubject = async () => {
    const trimmedName = newSubjectName.trim();
    if (!trimmedName) {
      alert('Digite o nome da disciplina antes de adicionar.');
      return;
    }

    await addSubject(trimmedName, newSubjectGroup);
    setNewSubjectName('');
  };

  const showOnboarding = isAuthReady && (!profile || !profile.onboardingCompleted);

  if (loading || !isAuthReady) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary font-bold animate-pulse text-sm">Preparando seu ambiente...</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardHome 
            user={user}
            profile={profile}
            totalHours={totalHours}
            totalQuestions={totalQuestions}
            avgAccuracy={avgAccuracy}
            chartData={chartData}
            sessions={sessions}
            cycleBlocks={cycleBlocks}
            prioritySubjects={prioritySubjects}
            setActiveTab={setActiveTab}
            setSelectedSubject={setSelectedSubject}
            setTimerActive={setTimerActive}
            dailyAverage={dailyAverage}
            recordManualStudySession={recordManualStudySession}
          />
        );
      case 'subjects':
        return (
          <SubjectsTab 
            newSubjectName={newSubjectName}
            setNewSubjectName={setNewSubjectName}
            newSubjectGroup={newSubjectGroup}
            setNewSubjectGroup={setNewSubjectGroup}
            addCustomSubject={handleAddCustomSubject}
            subjects={subjects}
            setSelectedSubjectForTopics={setSelectedSubjectForTopics}
            setActiveTab={setActiveTab}
            moveSubject={moveSubject}
            toggleSubjectStatus={toggleSubjectStatus}
            deleteSubject={deleteSubject}
          />
        );
      case 'topics':
        return (
          <TopicsTab 
            selectedSubjectForTopics={selectedSubjectForTopics}
            setActiveTab={setActiveTab}
            topics={topics}
            newTopicName={newTopicName}
            setNewTopicName={setNewTopicName}
            addTopic={async () => {
              if (!selectedSubjectForTopics) return false;
              const added = await addTopic(selectedSubjectForTopics.id, newTopicName, topics.length);
              if (added) setNewTopicName('');
              return Boolean(added);
            }}
            updateTopic={(id, updates) => updateTopic(selectedSubjectForTopics.id, id, updates)}
            deleteTopic={(id) => deleteTopic(selectedSubjectForTopics.id, id)}
          />
        );
      case 'cycle':
        return (
          <CycleTab 
            cycleFocus={cycleFocus}
            dailyTime={dailyTime}
            blocksPerDay={blocksPerDay}
            updateCycleSettings={updateCycleSettings}
            generateCycle={() => generateCycle(dailyTime, blocksPerDay, cycleFocus)}
            isGenerating={isGenerating}
            cycleBlocks={cycleBlocks}
            updateBlock={updateBlock}
            deleteBlock={deleteBlock}
            duplicateBlock={duplicateBlock}
            getValidationAlerts={() => getValidationAlerts}
            subjects={subjects}
            addCycleBlock={addCycleBlock}
            updateSubject={updateSubject}
            recordManualStudySession={recordManualStudySession}
          />
        );
      case 'daily':
        return (
          <DailyPlanTab 
            dailyBlocks={dailyBlocks}
            generateDailyPlan={handleGenerateDailyPlan}
            isGenerating={isGenerating}
            startStudySession={startStudySession}
            updateDailyBlock={updateDailyBlock}
            deleteDailyBlock={deleteDailyBlock}
            subjects={subjects}
            addDailyBlock={addDailyBlock}
            overdueReviewsCount={overdueReviewsCount}
            setActiveTab={setActiveTab}
          />
        );
      case 'kanban':
        return (
          <KanbanTab 
            dailyBlocks={dailyBlocks}
            generateDailyPlan={handleGenerateDailyPlan}
            isGenerating={isGenerating}
            startStudySession={startStudySession}
            updateDailyBlock={updateDailyBlock}
            deleteDailyBlock={deleteDailyBlock}
            subjects={subjects}
            addDailyBlock={addDailyBlock}
          />
        );
      case 'timer':
        return (
          <TimerTab 
            timerMode={timerMode}
            timeLeft={timeLeft}
            totalTimeForMode={totalTimeForMode}
            timerActive={timerActive}
            setTimerActive={setTimerActive}
            skipPhase={skipPhase}
            resetTimer={resetTimer}
            currentCycle={currentCycle}
            cyclesBeforeLongBreak={cyclesBeforeLongBreak}
            timerPreset={timerPreset}
            setTimerPreset={setTimerPreset}
            timerStudyType={timerStudyType}
            setTimerStudyType={setTimerStudyType}
            studyTime={studyTime}
            setStudyTime={setStudyTime}
            shortBreakTime={shortBreakTime}
            setShortBreakTime={setShortBreakTime}
            longBreakTime={longBreakTime}
            setLongBreakTime={setLongBreakTime}
            setCyclesBeforeLongBreak={setCyclesBeforeLongBreak}
            setTimeLeft={setTimeLeft}
            setTotalTimeForMode={setTotalTimeForMode}
            subjects={subjects}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
            finishStudySession={handleFinishSession}
            recordManualStudySession={recordManualStudySession}
            seconds={seconds}
            activeSessionBlock={activeSessionBlock}
          />
        );
      case 'focus':
        return (
          <FocusTab 
            focusItems={focusItems}
            setIgnoredFocusTopics={setIgnoredFocusTopics}
            weaknessPlan={weaknessPlan}
            setWeaknessPlan={setWeaknessPlan}
            showWeaknessPlan={showWeaknessPlan}
            setShowWeaknessPlan={setShowWeaknessPlan}
            subjects={subjects}
            dailyBlocks={dailyBlocks}
            setActiveTab={setActiveTab}
            setSelectedSubject={setSelectedSubject}
            cycleBlocks={cycleBlocks}
            addDailyBlock={addDailyBlock}
            addCycleBlock={addCycleBlock}
            generateWeaknessPlan={() => {}} // Placeholder or implement if needed
          />
        );
      case 'performance':
        return (
          <PerformanceTab 
            subjects={subjects}
            questionRecords={questionRecords}
            newRecordSubject={newRecordSubject}
            setNewRecordSubject={setNewRecordSubject}
            newRecordTopic={newRecordTopic}
            setNewRecordTopic={setNewRecordTopic}
            newRecordTotal={newRecordTotal}
            setNewRecordTotal={setNewRecordTotal}
            newRecordCorrect={newRecordCorrect}
            setNewRecordCorrect={setNewRecordCorrect}
            savingRecord={savingRecord}
            addQuestionRecord={async () => {
              const saved = await addQuestionRecord(newRecordSubject, newRecordTopic, newRecordTotal, newRecordCorrect);
              if (saved) {
                // [FIX]: mantém a disciplina selecionada e limpa apenas os campos do registro concluído.
                setNewRecordTopic('');
                setNewRecordTotal(0);
                setNewRecordCorrect(0);
              }
              return saved;
            }}
            deleteQuestionRecord={deleteQuestionRecord}
          />
        );
      case 'errors':
        return (
          <ErrorsTab 
            errorText={errorText}
            setErrorText={setErrorText}
            errorSubject={errorSubject}
            setErrorSubject={setErrorSubject}
            subjects={subjects}
            handleSaveError={() => saveError(errorSubject, errorText)}
            savingError={savingError}
            errors={errors}
            deleteError={deleteError}
            updateError={updateError}
            rateErrorReview={rateErrorReview}
          />
        );
      case 'history':
        return (
          <HistoryTab
            sessions={sessions}
            subjects={subjects}
          />
        );
      case 'mentor':
        return (
          <MentorTab 
            loadingAdvice={loadingAdvice}
            mentorAdvice={mentorAdvice}
            fetchMentorAdvice={() => fetchMentorAdvice(sessions)}
          />
        );
      case 'settings':
        return (
          <SettingsTab 
            saveStatus={saveStatus}
            editProfileName={editProfileName}
            setEditProfileName={setEditProfileName}
            editProfilePhoto={editProfilePhoto}
            setEditProfilePhoto={setEditProfilePhoto}
            editProfileCover={editProfileCover}
            setEditProfileCover={setEditProfileCover}
            editTargetContest={editTargetContest}
            setEditTargetContest={setEditTargetContest}
            urlErrors={urlErrors}
            setUrlErrors={setUrlErrors}
            handleSaveProfile={handleProfileSave}
            user={user}
            profile={profile}
            updateDoc={updateDoc}
            doc={doc}
            db={db}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background text-text-primary overflow-hidden font-sans">
      <AnimatePresence>
        {showOnboarding && (
          <Onboarding 
            onComplete={handleOnboardingComplete} 
            isGenerating={isGenerating} 
          />
        )}
      </AnimatePresence>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        user={user}
        profile={profile}
      />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <MobileHeader 
          isMobileMenuOpen={isMobileMenuOpen} 
          setIsMobileMenuOpen={setIsMobileMenuOpen} 
        />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            {renderTabContent()}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

import { useEffect, useRef, useCallback } from 'react';
import { pushEvent } from '../lib/tracking';

const DEFAULT_STEPS = [
  "KOKARDE",
  "UDDANNELSESBÅND",
  "BRODERI",
  "BETRÆK",
  "SKYGGE",
  "FOER",
  "EKSTRABETRÆK",
  "TILBEHØR",
  "STØRRELSE"
];

/**
 * Hook to track configurator step-by-step progress, milestones (25%, 50%, 75%, 100%),
 * time spent on each page, skipped steps, user activity percentage, and exit/abandonment.
 */
export const useProgressTracking = ({
  activeStep = "KOKARDE",
  steps = DEFAULT_STEPS,
  configuratorName = 'gradcap_configurator',
  packageName = 'standard',
  program = 'STX',
}) => {
  const effectiveSteps = steps && steps.length > 0 ? steps : DEFAULT_STEPS;
  const reachedMilestones = useRef(new Set());
  const visitedSteps = useRef(new Set());
  const stepStartTimeRef = useRef(Date.now());
  const timePerStepRef = useRef({});
  const prevStepRef = useRef(null);
  const isCompletedRef = useRef(false);

  // Helper to get total time spent across all steps
  const getTotalTimeSpent = useCallback(() => {
    const totalRecorded = Object.values(timePerStepRef.current).reduce((a, b) => a + b, 0);
    const currentActiveSeconds = Math.max(0, Math.round((Date.now() - stepStartTimeRef.current) / 1000));
    return totalRecorded + currentActiveSeconds;
  }, []);

  // Helper to calculate which steps prior to the target step were skipped
  const getSkippedSteps = useCallback((targetStep) => {
    const stepToCheck = targetStep || activeStep;
    const targetIdx = effectiveSteps.indexOf(stepToCheck);
    if (targetIdx <= 0) return [];

    const skipped = [];
    for (let i = 0; i < targetIdx; i++) {
      const stepName = effectiveSteps[i];
      if (!visitedSteps.current.has(stepName)) {
        skipped.push(stepName);
      }
    }
    return skipped;
  }, [effectiveSteps, activeStep]);

  // Track Step Views, Time Spent, and Milestones on activeStep change
  useEffect(() => {
    if (!activeStep) return;

    const now = Date.now();
    const prevStep = prevStepRef.current;

    // 1. Record time spent on previous step
    let timeSpentOnPrev = 0;
    if (prevStep) {
      timeSpentOnPrev = Math.max(1, Math.round((now - stepStartTimeRef.current) / 1000));
      timePerStepRef.current[prevStep] = (timePerStepRef.current[prevStep] || 0) + timeSpentOnPrev;
    }

    // Reset timer for the newly active step
    stepStartTimeRef.current = now;
    prevStepRef.current = activeStep;

    const currentIndex = effectiveSteps.indexOf(activeStep);
    const stepNumber = currentIndex !== -1 ? currentIndex + 1 : 1;
    const totalSteps = effectiveSteps.length;

    // Mark current step as visited
    visitedSteps.current.add(activeStep);

    // Single percentage = visited pages / total pages (same formula everywhere)
    const percentage = Math.round((visitedSteps.current.size / totalSteps) * 100);
    const skippedSteps = getSkippedSteps(activeStep);
    const totalTime = getTotalTimeSpent();

    // 2. Track Step View Event with rich params (time spent, skipped steps, etc.)
    pushEvent('configurator_step_view', {
      step_name: activeStep,
      step_index: stepNumber,
      total_steps: totalSteps,
      previous_step: prevStep || null,
      time_spent_on_previous_step: timeSpentOnPrev,
      total_time_spent: totalTime,
      visited_steps: Array.from(visitedSteps.current),
      visited_count: visitedSteps.current.size,
      percentage,
      package: packageName,
      program: program,
    }, configuratorName);

    // 3. Trigger funnel milestones (25%, 50%, 75%, 100%) — based on visited count
    const milestoneThresholds = [25, 50, 75, 100];
    milestoneThresholds.forEach((m) => {
      if (percentage >= m && !reachedMilestones.current.has(String(m))) {
        reachedMilestones.current.add(String(m));
        pushEvent('configurator_progress', {
          milestone: String(m),
          percentage,
          step_name: activeStep,
          step_index: stepNumber,
          total_steps: totalSteps,
          time_spent_on_step: timeSpentOnPrev,
          total_time_spent: totalTime,
          visited_steps: Array.from(visitedSteps.current),
          package: packageName,
          program: program,
        }, configuratorName);
      }
    });

  }, [activeStep, effectiveSteps, configuratorName, packageName, program, getSkippedSteps, getTotalTimeSpent]);

  // Mark configurator as 100% completed (e.g. when opening quote/checkout modal)
  const markCompleted = useCallback((extraParams = {}) => {
    isCompletedRef.current = true;
    const now = Date.now();
    const currentStep = prevStepRef.current || activeStep;
    if (currentStep) {
      const activeDuration = Math.max(1, Math.round((now - stepStartTimeRef.current) / 1000));
      timePerStepRef.current[currentStep] = (timePerStepRef.current[currentStep] || 0) + activeDuration;
    }

    // Ensure all milestones up to 100 are marked as reached
    [25, 50, 75, 100].forEach((m) => {
      if (!reachedMilestones.current.has(String(m))) {
        reachedMilestones.current.add(String(m));
        pushEvent('configurator_progress', {
          milestone: String(m),
          percentage: 100,
          step_name: currentStep,
          package: packageName,
          program: program,
        }, configuratorName);
      }
    });

    const totalSteps = effectiveSteps.length || 1;
    const totalTime = Object.values(timePerStepRef.current).reduce((a, b) => a + b, 0);

    pushEvent('configurator_completed', {
      total_time_spent: totalTime,
      time_per_step: { ...timePerStepRef.current },
      visited_steps: Array.from(visitedSteps.current),
      visited_count: visitedSteps.current.size,
      total_steps: totalSteps,
      percentage: Math.round((visitedSteps.current.size / totalSteps) * 100),
      package: packageName,
      program: program,
      ...extraParams
    }, configuratorName);
  }, [activeStep, effectiveSteps, configuratorName, packageName, program, getSkippedSteps]);

  // Abandonment / Exit tracking on pageleave or tab switch
  useEffect(() => {
    const handleExit = () => {
      if (isCompletedRef.current) return;

      const now = Date.now();
      const currentStep = prevStepRef.current || activeStep;
      let currentActiveDuration = 0;
      if (currentStep) {
        currentActiveDuration = Math.max(0, Math.round((now - stepStartTimeRef.current) / 1000));
      }

      const timeBreakdown = {
        ...timePerStepRef.current,
        [currentStep]: (timePerStepRef.current[currentStep] || 0) + currentActiveDuration,
      };

      const totalTime = Object.values(timeBreakdown).reduce((a, b) => a + b, 0);
      const totalSteps = effectiveSteps.length || 1;
      const highestMilestone = Array.from(reachedMilestones.current).pop() || '0';

      pushEvent('configurator_abandoned', {
        last_step: currentStep,
        furthest_milestone: highestMilestone,
        percentage: Math.round((visitedSteps.current.size / totalSteps) * 100),
        total_time_spent: totalTime,
        time_per_step: timeBreakdown,
        visited_steps: Array.from(visitedSteps.current),
        package: packageName,
        program: program,
      }, configuratorName);
    };

    window.addEventListener('beforeunload', handleExit);
    window.addEventListener('pagehide', handleExit);

    return () => {
      window.removeEventListener('beforeunload', handleExit);
      window.removeEventListener('pagehide', handleExit);
    };
  }, [activeStep, effectiveSteps, configuratorName, packageName, program, getSkippedSteps]);

  return {
    markCompleted,
    getTimePerStep: () => ({ ...timePerStepRef.current }),
    getTotalTimeSpent,
    getVisitedSteps: () => Array.from(visitedSteps.current),
    getSkippedSteps,
  };
};

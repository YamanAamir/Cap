import { useEffect, useRef } from 'react';
import { pushEvent } from '../lib/tracking';

export const useProgressTracking = (currentIndex, totalSteps, configuratorName) => {
  const reachedMilestones = useRef(new Set());

  useEffect(() => {
    if (!totalSteps || totalSteps <= 0) return;
    
    const percentage = Math.round((currentIndex / totalSteps) * 100);
    
    const milestones = [25, 50, 75, 100];
    let reached = null;

    if (percentage >= 100) reached = '100';
    else if (percentage >= 75) reached = '75';
    else if (percentage >= 50) reached = '50';
    else if (percentage >= 25) reached = '25';

    if (reached && !reachedMilestones.current.has(reached)) {
      reachedMilestones.current.add(reached);
      pushEvent('configurator_progress', { milestone: reached }, configuratorName);
    }
  }, [currentIndex, totalSteps, configuratorName]);
};

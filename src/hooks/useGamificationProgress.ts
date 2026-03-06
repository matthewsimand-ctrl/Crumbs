import { useState } from 'react';

interface CompletionPayload {
  recipeId: string;
  totalSteps: number;
}

const XP_PER_RECIPE = 40;

export const useGamificationProgress = () => {
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);

  const onRecipeCompleted = ({ recipeId }: CompletionPayload) => {
    setXp((currentXp) => currentXp + XP_PER_RECIPE);
    setStreak((currentStreak) => currentStreak + 1);

    setBadges((currentBadges) => {
      if (currentBadges.includes(recipeId)) {
        return currentBadges;
      }

      return [...currentBadges, recipeId];
    });
  };

  return {
    xp,
    streak,
    badges,
    onRecipeCompleted,
  };
};

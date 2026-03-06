import React, { useEffect, useMemo, useState } from 'react';
import { Recipe, Insight } from '../types';
import { Clock, ChefHat, ChevronDown, ChevronUp, ShoppingCart, Loader2, MapPin, Play, Pause, RotateCcw, CheckCircle2, ChevronLeft, ChevronRight, Flame, Trophy, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { findLocalDeals } from '../services/geminiService';
import { searchInstacartDeals, DealItem } from '../services/dealsService';

interface RecipeCardProps {
  recipe: Recipe;
  onRecipeCompleted?: (payload: { recipeId: string; totalSteps: number }) => void;
  gamification?: {
    xp: number;
    streak: number;
    badges: number;
  };
}

interface StepTimerState {
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isCompleted: boolean;
}

const parseTimerFromInstruction = (instruction: string) => {
  const lowerInstruction = instruction.toLowerCase();

  const minuteMatch = lowerInstruction.match(/(\d+)\s*(minute|min|minutes|mins)/);
  if (minuteMatch?.[1]) {
    return Number(minuteMatch[1]) * 60;
  }

  const secondMatch = lowerInstruction.match(/(\d+)\s*(second|sec|seconds|secs)/);
  if (secondMatch?.[1]) {
    return Number(secondMatch[1]);
  }

  return null;
};

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
};

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onRecipeCompleted, gamification }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCooking, setIsCooking] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(() => recipe.instructions.map(() => false));
  const [stepTimers, setStepTimers] = useState<StepTimerState[]>(
    () =>
      recipe.instructions.map((instruction) => {
        const parsedDuration = parseTimerFromInstruction(instruction);
        const safeDuration = parsedDuration ?? 0;

        return {
          durationSeconds: safeDuration,
          remainingSeconds: safeDuration,
          isRunning: false,
          isCompleted: false,
        };
      })
  );
  const [deals, setDeals] = useState<Insight[]>([]);
  const [instacartDeals, setInstacartDeals] = useState<DealItem[]>([]);
  const [isLoadingDeals, setIsLoadingDeals] = useState(false);
  const [zipCode, setZipCode] = useState('');
  const [showZipInput, setShowZipInput] = useState(false);
  const [dealsError, setDealsError] = useState<string | null>(null);

  const allStepsComplete = completedSteps.length > 0 && completedSteps.every(Boolean);

  const progressPercent = useMemo(() => {
    if (recipe.instructions.length === 0) return 0;
    const completedCount = completedSteps.filter(Boolean).length;
    return Math.round((completedCount / recipe.instructions.length) * 100);
  }, [completedSteps, recipe.instructions.length]);

  useEffect(() => {
    if (!allStepsComplete) {
      return;
    }

    onRecipeCompleted?.({ recipeId: recipe.id, totalSteps: recipe.instructions.length });
  }, [allStepsComplete, onRecipeCompleted, recipe.id, recipe.instructions.length]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStepTimers((timers) =>
        timers.map((timer, index) => {
          if (!timer.isRunning || timer.isCompleted || index !== currentStep) {
            return timer;
          }

          if (timer.remainingSeconds <= 1) {
            window.alert(`Step ${index + 1} timer is complete!`);
            return {
              ...timer,
              remainingSeconds: 0,
              isRunning: false,
              isCompleted: true,
            };
          }

          return {
            ...timer,
            remainingSeconds: timer.remainingSeconds - 1,
          };
        })
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, [currentStep]);

  const handleFindDeals = async () => {
    if (!zipCode) {
      setShowZipInput(true);
      return;
    }

    setIsLoadingDeals(true);
    try {
      const allDeals = await Promise.all(
        recipe.missingIngredients.map((ing) => searchInstacartDeals(ing, zipCode, ['Walmart', 'Kroger', 'Costco']))
      );

      const uniqueDeals: DealItem[] = [];
      const seenIds = new Set<string>();

      allDeals.flat().forEach((deal) => {
        if (!seenIds.has(deal.id)) {
          seenIds.add(deal.id);
          uniqueDeals.push(deal);
        }
      });

      const prioritizedDeals = uniqueDeals.sort((a, b) => (b.isSale ? 1 : 0) - (a.isSale ? 1 : 0)).slice(0, 8);
      setInstacartDeals(prioritizedDeals);

      try {
        await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
      } catch {
        console.warn('Location access denied');
      }

      const dealsText = await findLocalDeals(recipe.missingIngredients, prioritizedDeals);
      setDeals(dealsText);
    } catch {
      setDeals([]);
      setInstacartDeals([]);
      setDealsError('Deal search hit a snag. Please try again in a moment.');
    } finally {
      setIsLoadingDeals(false);
    }
  };

  const toggleStepCompletion = (index: number) => {
    setCompletedSteps((steps) => {
      const next = [...steps];
      next[index] = !next[index];
      return next;
    });
  };

  const goToNextStep = () => {
    setCurrentStep((step) => Math.min(step + 1, recipe.instructions.length - 1));
  };

  const goToPreviousStep = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const startTimer = (index: number) => {
    setStepTimers((timers) =>
      timers.map((timer, timerIndex) => {
        if (timerIndex !== index || timer.durationSeconds === 0) {
          return { ...timer, isRunning: false };
        }

        return {
          ...timer,
          isRunning: true,
          isCompleted: false,
        };
      })
    );
  };

  const pauseTimer = (index: number) => {
    setStepTimers((timers) =>
      timers.map((timer, timerIndex) => (timerIndex === index ? { ...timer, isRunning: false } : timer))
    );
  };

  const resetTimer = (index: number) => {
    setStepTimers((timers) =>
      timers.map((timer, timerIndex) =>
        timerIndex === index
          ? {
              ...timer,
              remainingSeconds: timer.durationSeconds,
              isRunning: false,
              isCompleted: false,
            }
          : timer
      )
    );
  };

  const activeTimer = stepTimers[currentStep];

  return (
    <motion.div layout className="app-card overflow-hidden hover:shadow-[var(--shadow-card-hover)] transition-shadow">
      <div>
        <div className="flex justify-between items-start mb-3 md:mb-4 gap-2">
          <div>
            <h3 className="text-xl font-bold text-emerald-900">{recipe.title}</h3>
            <p className="text-emerald-600/70 text-sm line-clamp-2 mt-1">{recipe.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                recipe.difficulty === 'Easy'
                  ? 'bg-green-100 text-green-700'
                  : recipe.difficulty === 'Medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
              }`}
            >
              {recipe.difficulty}
            </span>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              recipe.difficulty === 'Easy'
                ? 'bg-green-100 text-green-800'
                : recipe.difficulty === 'Medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-700'
            }`}
          >
            {recipe.difficulty}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[var(--color-text-muted)] text-sm mb-5">
          <div className="flex items-center gap-1.5">
            <Clock size={16} />
            {recipe.prepTime}
          </div>
          <div className="flex items-center gap-1.5">
            <ChefHat size={16} />
            {recipe.ingredients.length} ingredients
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setIsCooking(true);
              setIsExpanded(false);
            }}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Start Cooking
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-xl hover:bg-emerald-100 transition-colors"
          >
            {isExpanded ? 'Hide Recipe' : 'View Recipe'}
          </button>
        </div>

        {gamification && (
          <div className="mb-6 grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-2 text-amber-700 flex items-center gap-1">
              <Star size={14} /> {gamification.xp} XP
            </div>
            <div className="rounded-xl bg-red-50 border border-red-100 p-2 text-red-700 flex items-center gap-1">
              <Flame size={14} /> {gamification.streak} streak
            </div>
            <div className="rounded-xl bg-purple-50 border border-purple-100 p-2 text-purple-700 flex items-center gap-1">
              <Trophy size={14} /> {gamification.badges} badges
            </div>
          </div>
        )}

        <AnimatePresence>
          {isCooking && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Cooking Stepper</p>
                <span className="text-xs font-semibold text-emerald-700">{progressPercent}% complete</span>
              </div>

              <div className="w-full h-2 rounded-full bg-emerald-100 overflow-hidden mb-4">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progressPercent}%` }} />
              </div>

              <div className="bg-white rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-emerald-600 font-semibold">
                    Step {currentStep + 1} of {recipe.instructions.length}
                  </p>
                  <button
                    onClick={() => toggleStepCompletion(currentStep)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
                      completedSteps[currentStep]
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {completedSteps[currentStep] ? 'Completed' : 'Mark done'}
                  </button>
                </div>
                <p className="mt-3 text-sm text-emerald-900">{recipe.instructions[currentStep]}</p>

                {activeTimer?.durationSeconds > 0 && (
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 mb-2">Step Timer</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-slate-900">{formatTime(activeTimer.remainingSeconds)}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startTimer(currentStep)}
                          className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                          aria-label="Start timer"
                        >
                          <Play size={14} />
                        </button>
                        <button
                          onClick={() => pauseTimer(currentStep)}
                          className="p-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600"
                          aria-label="Pause timer"
                        >
                          <Pause size={14} />
                        </button>
                        <button
                          onClick={() => resetTimer(currentStep)}
                          className="p-2 rounded-lg bg-slate-600 text-white hover:bg-slate-700"
                          aria-label="Reset timer"
                        >
                          <RotateCcw size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={goToPreviousStep}
                  disabled={currentStep === 0}
                  className="py-3 px-4 rounded-xl bg-white border border-emerald-200 text-emerald-700 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ChevronLeft size={18} /> Previous step
                </button>
                <button
                  onClick={goToNextStep}
                  disabled={currentStep === recipe.instructions.length - 1}
                  className="py-3 px-4 rounded-xl bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Next step <ChevronRight size={18} />
                </button>
              </div>

              {allStepsComplete && (
                <div className="mt-4 p-3 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} /> Recipe complete! XP and streak updated.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {recipe.missingIngredients.length > 0 && (
          <div className="mb-5 p-3 md:p-4 bg-[var(--color-primary-soft)]/70 rounded-[var(--radius-control)] border border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--color-primary-strong)] uppercase tracking-wider">Missing Ingredients</span>
              <button
                onClick={handleFindDeals}
                disabled={isLoadingDeals}
                className="text-xs font-semibold text-[var(--color-primary-strong)] hover:text-[var(--color-text)] flex items-center gap-1"
              >
                {isLoadingDeals ? <Loader2 className="animate-spin" size={12} /> : <ShoppingCart size={12} />}
                Find Deals
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recipe.missingIngredients.map((ing, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-white text-[var(--color-primary-strong)] rounded-lg border border-[var(--color-border)]">
                  {ing}
                </span>
              ))}
            </div>

            <AnimatePresence>
              {showZipInput && !instacartDeals.length && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={14} />
                    <input
                      type="text"
                      placeholder="Enter zip code (e.g. 90210)"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>
                  <button
                    onClick={handleFindDeals}
                    className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors"
                  >
                    Go
                  </button>
                </motion.div>
              )}

              {isLoadingDeals && <div className="status-panel mt-3">Finding nearby prices and promos... 🛒</div>}

              {instacartDeals.length > 0 && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 space-y-3">
                  <p className="text-xs font-bold text-[var(--color-primary-strong)] uppercase tracking-wider">Savings Spotlight</p>
                  <div className="grid grid-cols-1 gap-2">
                    {instacartDeals.map((deal, index) => (
                      <div
                        key={`${deal.id}-${deal.retailer}-${index}`}
                        className="flex items-center gap-3 p-2 bg-white rounded-xl border border-orange-100 shadow-sm"
                      >
                        <img src={deal.imageUrl} alt={deal.name} className="w-10 h-10 object-contain rounded-lg" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[var(--color-text)] truncate">{deal.name}</p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">{deal.retailer}</p>
                        </div>
                        <div className={`text-xs font-bold ${deal.isSale ? 'text-emerald-600' : 'text-emerald-900'}`}>
                          ${deal.price.toFixed(2)}{' '}
                          {deal.isSale && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1 rounded">SALE</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {deals.length > 0 && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 pt-3 border-t border-[var(--color-border)]">
                  <p className="text-xs font-bold text-[var(--color-primary-strong)] uppercase tracking-wider mb-2">AI Shopping Insights</p>
                  <div className="space-y-2">
                    {deals.map((insight, i) => (
                      <div key={i} className="bg-white p-3 rounded-xl border border-[var(--color-border)] shadow-sm">
                        <p className="text-sm font-bold text-[var(--color-text)] mb-1">{insight.title}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{insight.description}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {dealsError && (
                <div className="status-panel mt-3 flex items-center justify-center gap-2">
                  <AlertCircle size={16} /> {dealsError}
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 space-y-6">
                <div>
                  <h4 className="font-bold text-[var(--color-text)] mb-2.5">Ingredients</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                        <div className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-[var(--color-text)] mb-2.5">Instructions</h4>
                  <ol className="space-y-4">
                    {recipe.instructions.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm text-[var(--color-text-muted)]">
                        <span className="flex-shrink-0 w-6 h-6 bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)] rounded-full flex items-center justify-center font-bold text-xs">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={onCompleteStep}
                    className="px-3 py-2 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 hover:bg-emerald-100"
                  >
                    + Complete Step
                  </button>
                  <button
                    onClick={onCompleteRecipe}
                    className="px-3 py-2 text-xs font-semibold bg-orange-50 text-orange-700 rounded-lg border border-orange-200 hover:bg-orange-100"
                  >
                    + Complete Recipe
                  </button>
                </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

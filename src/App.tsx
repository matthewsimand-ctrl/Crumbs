import { useState } from 'react';
import { FridgeScanner } from './components/FridgeScanner';
import { PantryList } from './components/PantryList';
import { RecipeCard } from './components/RecipeCard';
import { RecipePlannerBoard } from './components/RecipePlannerBoard';
import { Ingredient, Recipe } from './types';
import { analyzeFridgeImage, generateRecipes } from './services/geminiService';
import { ChefHat, Refrigerator, Sparkles, Loader2, UtensilsCrossed, Trophy, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PREFERENCES_STORAGE_KEY = 'fridgevibe.preferences';
const PROGRESS_STORAGE_KEY = 'fridgevibe.progress';

const defaultPreferences: UserPreferences = {
  cookingLevel: 'Beginner',
  tasteProfiles: [],
  onboardingCompleted: false,
};

const defaultProgress: UserProgress = {
  xp: 0,
  badges: [],
  completedRecipes: 0,
  completedSteps: 0,
};

export default function App() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);
  const [activeTab, setActiveTab] = useState<'pantry' | 'recipes' | 'planner'>('pantry');

  const handleScanComplete = async (base64Image: string) => {
    setScanError(null);
    setIsScanning(true);
    try {
      const detectedIngredients = await analyzeFridgeImage(base64Image);
      setIngredients(detectedIngredients);
      setActiveTab('pantry');
    } catch (error) {
      console.error('Scanning failed', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleGenerateRecipes = async () => {
    if (ingredients.length === 0) return;
    setRecipeError(null);
    setIsGeneratingRecipes(true);
    try {
      const newRecipes = await generateRecipes(ingredients, preferences);
      setRecipes(newRecipes);
      setActiveTab('recipes');
    } catch (error) {
      console.error('Recipe generation failed', error);
    } finally {
      setIsGeneratingRecipes(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-slate-900 font-sans selection:bg-emerald-100">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="app-icon-pill shadow-sm">
              <Refrigerator size={22} />
            </div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-[var(--color-text)]">FridgeVibe</h1>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('pantry')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'pantry' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Pantry
            </button>
            <button
              onClick={() => setActiveTab('recipes')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'recipes' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Recipes
            </button>
            <button
              onClick={() => setActiveTab('planner')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'planner' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Planner
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
              <Flame size={16} className="text-amber-500" />
              <span className="text-xs font-semibold text-amber-700">{progress.xp} XP</span>
              <Trophy size={16} className="text-emerald-600 ml-1" />
              <span className="text-xs font-semibold text-emerald-700">{progress.badges.length} badges</span>
            </div>
            <button className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
              <Sparkles size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!preferences.onboardingCompleted && (
          <div className="mb-10">
            <OnboardingPreferences initialPreferences={preferences} onSave={handleSavePreferences} />
          </div>
        )}

        <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white border border-emerald-100 rounded-2xl p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Progress XP</p>
            <p className="text-2xl font-bold text-emerald-700">{progress.xp}</p>
          </div>
          <div className="bg-white border border-emerald-100 rounded-2xl p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Completed Steps</p>
            <p className="text-2xl font-bold text-emerald-700">{progress.completedSteps}</p>
          </div>
          <div className="bg-white border border-emerald-100 rounded-2xl p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Completed Recipes / Badges</p>
            <p className="text-2xl font-bold text-emerald-700">{progress.completedRecipes} / {progress.badges.length}</p>
          </div>
        </div>

        <div className="mb-12 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-emerald-950 mb-4"
          >
            Cook Smarter, <span className="text-orange-500">Waste Less.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[var(--color-text-muted)] text-base md:text-lg max-w-2xl mx-auto"
          >
            Scan a fridge or pantry photo to auto-extract ingredients, then turn what you have into great meals.
            Discover recipes, find local deals, and master your kitchen.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-8">
            <FridgeScanner onScanComplete={handleScanComplete} isScanning={isScanning} />

            {ingredients.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="app-card bg-[linear-gradient(140deg,#9a4610,#7f3608)] text-white border-0"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <ChefHat size={20} />
                    Ready to Cook?
                  </h3>
                  <span className="text-orange-100 text-xs font-semibold px-2 py-1 bg-white/15 rounded-lg">
                    {ingredients.length} items found
                  </span>
                </div>
                <p className="text-emerald-100/70 text-sm mb-2">
                  We&apos;ve identified your ingredients. Now let&apos;s generate recipes that match your profile.
                </p>
                <p className="text-emerald-200/70 text-xs mb-6">
                  Cooking level: {preferences.cookingLevel} • Taste: {preferences.tasteProfiles.length > 0 ? preferences.tasteProfiles.join(', ') : 'No preference yet'}
                </p>
                <button onClick={handleGenerateRecipes} disabled={isGeneratingRecipes} className="app-button-primary w-full flex items-center justify-center gap-2">
                  {isGeneratingRecipes ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Crafting Recipes...
                    </>
                  ) : (
                    <>
                      <UtensilsCrossed size={20} />
                      Generate Recipes
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </div>

          <div className="lg:col-span-7">
            <div className="flex md:hidden mb-6 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('pantry')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'pantry' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                Pantry
              </button>
              <button
                onClick={() => setActiveTab('recipes')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'recipes' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                Recipes
              </button>
              <button
                onClick={() => setActiveTab('planner')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'planner' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                Planner
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'pantry' && (
                <motion.div
                  key="pantry"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <PantryList ingredients={ingredients} onUpdate={setIngredients} />
                </motion.div>
              )}

              {activeTab === 'recipes' && (
                <motion.div
                  key="recipes"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 md:space-y-6"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xl md:text-2xl font-semibold">Suggested Recipes</h2>
                    {recipes.length > 0 && (
                      <button
                        onClick={handleGenerateRecipes}
                        className="text-sm text-emerald-600 font-medium hover:underline"
                      >
                        Refresh Suggestions
                      </button>
                    )}
                  </div>

                  {recipes.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100">
                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UtensilsCrossed className="text-emerald-200" size={32} />
                      </div>
                      <h3 className="text-emerald-900 font-semibold mb-2">No recipes yet</h3>
                      <p className="text-slate-400 text-sm max-w-xs mx-auto">Scan your fridge or add ingredients manually to see recipe suggestions.</p>
                    </div>
                  ) : (
                    recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)
                  )}
                </motion.div>
              )}

              {activeTab === 'planner' && (
                <motion.div
                  key="planner"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <RecipePlannerBoard recipes={recipes} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="mt-24 border-t border-slate-100 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Refrigerator className="text-[var(--color-primary-strong)]" size={18} />
            <span className="font-bold">FridgeVibe</span>
          </div>
          <p className="text-slate-400 text-sm">Powered by Gemini AI • Built for Foodies</p>
        </div>
      </footer>
    </div>
  );
}

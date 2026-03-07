import { useEffect, useMemo, useState } from 'react';
import { FridgeScanner } from './components/FridgeScanner';
import { PantryList } from './components/PantryList';
import { RecipeCard } from './components/RecipeCard';
import { CrumbsLogo } from './components/CrumbsLogo';
import { OnboardingPreferences } from './components/OnboardingPreferences';
import { RecipePlannerBoard } from './components/RecipePlannerBoard';
import { Ingredient, Recipe, UserPreferences } from './types';
import { analyzeFridgeImage, generateRecipes } from './services/geminiService';
import { ChefHat, Loader2, Sparkles, UtensilsCrossed, UserPlus, ScanLine, CheckCircle2, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGamificationProgress } from './hooks/useGamificationProgress';

const PREFERENCES_STORAGE_KEY = 'fridgevibe.preferences';
const ACCOUNT_STORAGE_KEY = 'fridgevibe.account';

type AppTab = 'pantry' | 'recipes' | 'planner';

interface LocalAccount {
  fullName: string;
  email: string;
  createdAt: string;
}

const defaultPreferences: UserPreferences = {
  cookingLevel: 'Beginner',
  tasteProfiles: [],
  onboardingCompleted: false,
};

export default function App() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('pantry');
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [scanMode, setScanMode] = useState<'manual' | 'camera'>('manual');
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [account, setAccount] = useState<LocalAccount | null>(null);
  const [accountName, setAccountName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountError, setAccountError] = useState<string | null>(null);
  const { xp, streak, badges, onRecipeCompleted } = useGamificationProgress();

  useEffect(() => {
    const savedPreferences = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (savedPreferences) {
      try {
        const parsedPreferences = JSON.parse(savedPreferences) as Partial<UserPreferences>;
        setPreferences({
          ...defaultPreferences,
          ...parsedPreferences,
        });
      } catch (error) {
        console.error('Failed to parse stored preferences', error);
      }
    }

    const savedAccount = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (savedAccount) {
      try {
        setAccount(JSON.parse(savedAccount) as LocalAccount);
      } catch (error) {
        console.error('Failed to parse stored account', error);
      }
    }
  }, []);

  const setupSteps = useMemo(
    () => [
      {
        title: 'Create account',
        detail: account ? `${account.fullName} is ready.` : 'Save your profile details to personalize your dashboard.',
        done: Boolean(account),
        icon: UserPlus,
      },
      {
        title: 'Set cooking preferences',
        detail: preferences.onboardingCompleted
          ? `${preferences.cookingLevel} level • ${preferences.tasteProfiles.length || 'No'} taste profiles selected`
          : 'Tell us your skill level and preferred meal styles.',
        done: preferences.onboardingCompleted,
        icon: CheckCircle2,
      },
      {
        title: 'Scan ingredients',
        detail: ingredients.length > 0 ? `${ingredients.length} ingredients in pantry` : 'Upload or capture your fridge to start recipe generation.',
        done: ingredients.length > 0,
        icon: ScanLine,
      },
      {
        title: 'Cook and track progress',
        detail: recipes.length > 0 ? `${recipes.length} recipe ideas ready` : 'Generate recipes and build streaks from completed meals.',
        done: recipes.length > 0,
        icon: ChefHat,
      },
    ],
    [account, preferences, ingredients.length, recipes.length]
  );

  const handleSavePreferences = (newPreferences: UserPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(newPreferences));
  };

  const handleCreateAccount = (event: React.FormEvent) => {
    event.preventDefault();

    if (!accountName.trim() || !accountEmail.trim()) {
      setAccountError('Please add your name and email to continue.');
      return;
    }

    const newAccount: LocalAccount = {
      fullName: accountName.trim(),
      email: accountEmail.trim(),
      createdAt: new Date().toISOString(),
    };

    setAccount(newAccount);
    localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(newAccount));
    setAccountName('');
    setAccountEmail('');
    setAccountError(null);
  };

  const handleScanComplete = async (base64Image: string) => {
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
    <div className="min-h-screen bg-[#FDFBF8] text-slate-900 font-sans selection:bg-amber-100">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <CrumbsLogo />

          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['pantry', 'recipes', 'planner'] as AppTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>

          <button
            onClick={() => setIsPremiumUser(true)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border ${isPremiumUser ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'}`}
          >
            <Crown size={16} />
            {isPremiumUser ? 'Premium active' : 'Upgrade'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <section className="bg-gradient-to-br from-amber-50 via-white to-emerald-50 border border-amber-100 rounded-3xl p-6 md:p-8">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-bold text-amber-950 mb-3">
            A cleaner cooking flow from signup to dinner.
          </motion.h1>
          <p className="text-slate-600 max-w-3xl">
            Build your account, define your preferences, scan what you already have, and generate a plan in one dashboard. Each panel below mirrors that journey so the experience feels predictable and fast.
          </p>
          <div className="grid gap-3 md:grid-cols-4 mt-6">
            {setupSteps.map((step) => (
              <div key={step.title} className={`rounded-2xl border p-4 ${step.done ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <step.icon size={16} className={step.done ? 'text-emerald-600' : 'text-slate-400'} />
                  <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                </div>
                <p className="text-xs text-slate-500">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            {!account ? (
              <form onSubmit={handleCreateAccount} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Create your account</h2>
                <p className="text-sm text-slate-500">Set up your profile to unlock onboarding and save personalized recipe context.</p>
                <input
                  value={accountName}
                  onChange={(event) => setAccountName(event.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
                <input
                  type="email"
                  value={accountEmail}
                  onChange={(event) => setAccountEmail(event.target.value)}
                  placeholder="Email address"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
                {accountError && <p className="text-sm text-red-500">{accountError}</p>}
                <button type="submit" className="app-button-primary w-full">
                  Create account
                </button>
              </form>
            ) : (
              <div className="bg-white rounded-3xl border border-emerald-100 p-6 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">Account</p>
                <h2 className="text-xl font-bold text-emerald-800 mt-1">Welcome back, {account.fullName.split(' ')[0]}!</h2>
                <p className="text-sm text-slate-500 mt-1">{account.email}</p>
              </div>
            )}

            {account && !preferences.onboardingCompleted && (
              <OnboardingPreferences initialPreferences={preferences} onSave={handleSavePreferences} />
            )}

            <FridgeScanner
              onScanComplete={handleScanComplete}
              isScanning={isScanning}
              scanMode={scanMode}
              onScanModeChange={setScanMode}
              isPremiumUser={isPremiumUser}
              onUpgradeClick={() => setIsPremiumUser(true)}
              onEnterIngredientsClick={() => setActiveTab('pantry')}
            />

            {ingredients.length > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6 bg-amber-900 rounded-3xl text-white shadow-xl shadow-amber-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <ChefHat size={20} />
                    Ready to cook?
                  </h3>
                  <span className="text-amber-200 text-xs font-medium px-2 py-1 bg-white/10 rounded-lg">{ingredients.length} items found</span>
                </div>
                <p className="text-amber-100/80 text-sm mb-6">Generate recipe ideas based on pantry inventory and your selected taste preferences.</p>
                <button onClick={handleGenerateRecipes} disabled={isGeneratingRecipes} className="app-button-primary w-full flex items-center justify-center gap-2">
                  {isGeneratingRecipes ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Crafting recipes...
                    </>
                  ) : (
                    <>
                      <UtensilsCrossed size={20} />
                      Generate recipes
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white border border-emerald-100 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Progress XP</p>
                <p className="text-2xl font-bold text-emerald-700">{xp}</p>
              </div>
              <div className="bg-white border border-emerald-100 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Streak</p>
                <p className="text-2xl font-bold text-emerald-700">{streak}</p>
              </div>
              <div className="bg-white border border-emerald-100 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Badges</p>
                <p className="text-2xl font-bold text-emerald-700">{badges.length}</p>
              </div>
            </div>

            <div className="flex md:hidden bg-slate-100 p-1 rounded-xl">
              {(['pantry', 'recipes', 'planner'] as AppTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab === tab ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500'}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'pantry' && (
                <motion.div key="pantry" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <PantryList ingredients={ingredients} onUpdate={setIngredients} />
                </motion.div>
              )}

              {activeTab === 'recipes' && (
                <motion.div key="recipes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 md:space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-semibold text-amber-900">Suggested recipes</h2>
                    {recipes.length > 0 && (
                      <button onClick={handleGenerateRecipes} className="text-sm text-amber-700 font-medium hover:underline">
                        Refresh suggestions
                      </button>
                    )}
                  </div>

                  {recipes.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-amber-100">
                      <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UtensilsCrossed className="text-amber-300" size={32} />
                      </div>
                      <h3 className="text-amber-900 font-semibold mb-2">No recipes yet</h3>
                      <p className="text-slate-400 text-sm max-w-xs mx-auto">Scan your fridge or add ingredients manually to see recipe suggestions.</p>
                    </div>
                  ) : (
                    recipes.map((recipe) => (
                      <RecipeCard key={recipe.id} recipe={recipe} onRecipeCompleted={onRecipeCompleted} gamification={{ xp, streak, badges: badges.length }} />
                    ))
                  )}
                </motion.div>
              )}

              {activeTab === 'planner' && (
                <motion.div key="planner" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <RecipePlannerBoard recipes={recipes} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>

      <footer className="mt-16 border-t border-slate-100 py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CrumbsLogo iconClassName="w-8 h-8" textClassName="font-bold text-amber-900" />
          </div>
          <p className="text-slate-400 text-sm">Powered by Gemini AI • Built for foodies</p>
          <p className="text-slate-400 text-xs mt-1 inline-flex items-center gap-1">
            <Sparkles size={12} /> Dashboard redesigned for a step-by-step kitchen workflow.
          </p>
        </div>
      </footer>
    </div>
  );
}

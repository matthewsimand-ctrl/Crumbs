import { useEffect, useMemo, useState } from 'react';
import { FridgeScanner } from './components/FridgeScanner';
import { PantryList } from './components/PantryList';
import { RecipeCard } from './components/RecipeCard';
import { CrumbsLogo } from './components/CrumbsLogo';
import { OnboardingPreferences } from './components/OnboardingPreferences';
import { RecipePlannerBoard } from './components/RecipePlannerBoard';
import { GroceryShoppingList } from './components/GroceryShoppingList';
import { Ingredient, Recipe, UserPreferences } from './types';
import { analyzeFridgeImage, generateRecipes } from './services/geminiService';
import { ChefHat, Loader2, Sparkles, UtensilsCrossed, UserPlus, ScanLine, CheckCircle2, Crown, AlertCircle, ShoppingBasket, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGamificationProgress } from './hooks/useGamificationProgress';

const PREFERENCES_STORAGE_KEY = 'fridgevibe.preferences';
const ACCOUNT_STORAGE_KEY = 'fridgevibe.account';

type AppTab = 'pantry' | 'recipes' | 'planner' | 'grocery';

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

const tabs: Array<{ key: AppTab; label: string; icon: typeof ChefHat }> = [
  { key: 'pantry', label: 'Ingredients', icon: ScanLine },
  { key: 'recipes', label: 'Recipes', icon: UtensilsCrossed },
  { key: 'planner', label: 'Planning', icon: CalendarDays },
  { key: 'grocery', label: 'Grocery', icon: ShoppingBasket },
];

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
  const [actionError, setActionError] = useState<string | null>(null);
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
        title: 'Track ingredients',
        detail: ingredients.length > 0 ? `${ingredients.length} ingredients in pantry` : 'Add items from scanning or manual entry.',
        done: ingredients.length > 0,
        icon: ScanLine,
      },
      {
        title: 'Generate and plan meals',
        detail: recipes.length > 0 ? `${recipes.length} recipe ideas ready` : 'Generate recipes, then schedule and shop from dedicated tabs.',
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
    setActionError(null);
    try {
      const detectedIngredients = await analyzeFridgeImage(base64Image);
      setIngredients(detectedIngredients);
      setActiveTab('pantry');
    } catch (error) {
      console.error('Scanning failed', error);
      setActionError(error instanceof Error ? error.message : 'Scanning failed unexpectedly.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleGenerateRecipes = async () => {
    if (ingredients.length === 0 || isGeneratingRecipes) return;

    setIsGeneratingRecipes(true);
    setActionError(null);
    try {
      const newRecipes = await generateRecipes(ingredients, preferences);
      setRecipes(newRecipes);
      setActiveTab('recipes');
    } catch (error) {
      console.error('Recipe generation failed', error);
      setActionError(error instanceof Error ? error.message : 'Could not generate recipes. Please try again.');
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
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab.label}
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
            Ingredients, recipes, planning, and shopping now live in dedicated tabs so each part of your workflow stays focused.
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

        <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-4 space-y-6">
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

            {account && !preferences.onboardingCompleted && <OnboardingPreferences initialPreferences={preferences} onSave={handleSavePreferences} />}

            <div className="bg-white border border-emerald-100 rounded-2xl p-4 grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Progress XP</p>
                <p className="text-2xl font-bold text-emerald-700">{xp}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Streak</p>
                <p className="text-2xl font-bold text-emerald-700">{streak}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Badges</p>
                <p className="text-2xl font-bold text-emerald-700">{badges.length}</p>
              </div>
            </div>

            {actionError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}
          </div>

          <div className="xl:col-span-8 space-y-6">
            <div className="flex md:hidden bg-slate-100 p-1 rounded-xl">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab === tab.key ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'pantry' && (
                <motion.div key="pantry" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <section className="bg-gradient-to-r from-orange-50 to-amber-50 border border-amber-100 rounded-3xl p-5">
                    <h2 className="text-2xl font-semibold text-amber-900">Ingredient Tracker</h2>
                    <p className="text-sm text-slate-600 mt-1">Use scanning and manual edits to keep an accurate pantry list.</p>
                  </section>
                  <FridgeScanner
                    onScanComplete={handleScanComplete}
                    isScanning={isScanning}
                    scanMode={scanMode}
                    onScanModeChange={setScanMode}
                    isPremiumUser={isPremiumUser}
                    onUpgradeClick={() => setIsPremiumUser(true)}
                    onEnterIngredientsClick={() => setActiveTab('pantry')}
                  />
                  <PantryList ingredients={ingredients} onUpdate={setIngredients} />
                </motion.div>
              )}

              {activeTab === 'recipes' && (
                <motion.div key="recipes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 md:space-y-6">
                  <section className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-3xl p-5">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <h2 className="text-2xl font-semibold text-amber-900">Recipes</h2>
                        <p className="text-sm text-slate-600 mt-1">Generate ideas from your tracked ingredients.</p>
                      </div>
                      <button onClick={handleGenerateRecipes} disabled={isGeneratingRecipes || ingredients.length === 0} className="app-button-primary flex items-center gap-2 disabled:opacity-50">
                        {isGeneratingRecipes ? <Loader2 className="animate-spin" size={18} /> : <UtensilsCrossed size={18} />}
                        {isGeneratingRecipes ? 'Crafting recipes...' : recipes.length > 0 ? 'Refresh suggestions' : 'Generate recipes'}
                      </button>
                    </div>
                    {ingredients.length === 0 && <p className="text-xs text-amber-700 mt-3">Add ingredients in the Ingredients tab to unlock recipe generation.</p>}
                  </section>

                  {recipes.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-amber-100">
                      <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UtensilsCrossed className="text-amber-300" size={32} />
                      </div>
                      <h3 className="text-amber-900 font-semibold mb-2">No recipes yet</h3>
                      <p className="text-slate-400 text-sm max-w-xs mx-auto">Generate recipes from the ingredients you track in the Ingredients tab.</p>
                    </div>
                  ) : (
                    recipes.map((recipe) => (
                      <RecipeCard key={recipe.id} recipe={recipe} onRecipeCompleted={onRecipeCompleted} gamification={{ xp, streak, badges: badges.length }} />
                    ))
                  )}
                </motion.div>
              )}

              {activeTab === 'planner' && (
                <motion.div key="planner" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <section className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-3xl p-5">
                    <h2 className="text-2xl font-semibold text-emerald-900">Meal Planning</h2>
                    <p className="text-sm text-slate-600 mt-1">Plan the week by dragging recipe cards into your schedule.</p>
                  </section>
                  <RecipePlannerBoard recipes={recipes} />
                </motion.div>
              )}

              {activeTab === 'grocery' && (
                <motion.div key="grocery" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <section className="bg-gradient-to-r from-cyan-50 to-sky-50 border border-cyan-100 rounded-3xl p-5">
                    <h2 className="text-2xl font-semibold text-cyan-900">Grocery Shopping</h2>
                    <p className="text-sm text-slate-600 mt-1">Shop smarter with one combined list from all missing recipe ingredients.</p>
                  </section>
                  <GroceryShoppingList recipes={recipes} />
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
            <Sparkles size={12} /> Dedicated tabs for ingredients, recipes, planning, and shopping.
          </p>
        </div>
      </footer>
    </div>
  );
}

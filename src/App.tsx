import { useState } from 'react';
import { FridgeScanner } from './components/FridgeScanner';
import { PantryList } from './components/PantryList';
import { RecipeCard } from './components/RecipeCard';
import { Ingredient, Recipe } from './types';
import { analyzeFridgeImage, generateRecipes } from './services/geminiService';
import { ChefHat, Refrigerator, Sparkles, Loader2, UtensilsCrossed, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);
  const [activeTab, setActiveTab] = useState<'pantry' | 'recipes'>('pantry');
  const [scanError, setScanError] = useState<string | null>(null);
  const [recipeError, setRecipeError] = useState<string | null>(null);

  const handleScanComplete = async (base64Image: string) => {
    setScanError(null);
    setIsScanning(true);
    try {
      const detectedIngredients = await analyzeFridgeImage(base64Image);
      setIngredients(detectedIngredients);
      setActiveTab('pantry');
    } catch (error) {
      console.error('Scanning failed', error);
      setScanError('We could not read that photo. Try a brighter image 🍊');
    } finally {
      setIsScanning(false);
    }
  };

  const handleGenerateRecipes = async () => {
    if (ingredients.length === 0) return;
    setRecipeError(null);
    setIsGeneratingRecipes(true);
    try {
      const newRecipes = await generateRecipes(ingredients);
      setRecipes(newRecipes);
      setActiveTab('recipes');
    } catch (error) {
      console.error('Recipe generation failed', error);
      setRecipeError('No luck this round. Give it another stir in a moment 🍔');
    } finally {
      setIsGeneratingRecipes(false);
    }
  };

  return (
    <div className="min-h-screen text-[var(--color-text)] font-sans selection:bg-orange-100">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-[4.5rem] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="app-icon-pill shadow-sm">
              <Refrigerator size={22} />
            </div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-[var(--color-text)]">FridgeVibe</h1>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-[var(--color-primary-soft)] p-1 rounded-xl border border-[var(--color-border)]">
            {(['pantry', 'recipes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === tab
                    ? 'bg-white text-[var(--color-primary-strong)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {tab[0].toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>

          <button className="app-icon-pill" aria-label="App sparkle">
            <Sparkles size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="mb-8 md:mb-12 text-center">
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
            Cook Smarter, <span className="text-[var(--color-primary)]">Waste Less.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[var(--color-text-muted)] text-base md:text-lg max-w-2xl mx-auto"
          >
            Snap your shelf, track what you have, then turn leftovers into weeknight wins 🍽️
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          <div className="lg:col-span-5 space-y-5 md:space-y-7">
            <FridgeScanner onScanComplete={handleScanComplete} isScanning={isScanning} />

            {scanError && (
              <div className="status-panel flex items-center justify-center gap-2">
                <AlertTriangle size={16} /> {scanError}
              </div>
            )}

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
                <p className="text-orange-50/90 text-sm mb-4 md:mb-6">
                  Nice haul. Let&apos;s plate up ideas before anything goes to waste 🌮
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
            <div className="flex md:hidden mb-4 bg-[var(--color-primary-soft)] p-1 rounded-xl border border-[var(--color-border)]">
              {(['pantry', 'recipes'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${
                    activeTab === tab ? 'bg-white text-[var(--color-primary-strong)] shadow-sm' : 'text-[var(--color-text-muted)]'
                  }`}
                >
                  {tab[0].toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'pantry' ? (
                <motion.div key="pantry" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <PantryList ingredients={ingredients} onUpdate={setIngredients} />
                </motion.div>
              ) : (
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
                      <button onClick={handleGenerateRecipes} className="text-sm text-[var(--color-primary-strong)] font-semibold hover:underline">
                        Refresh Suggestions
                      </button>
                    )}
                  </div>

                  {isGeneratingRecipes && <div className="status-panel">Cooking up ideas... this takes a few seconds 🍳</div>}
                  {recipeError && <div className="status-panel">{recipeError}</div>}

                  {!isGeneratingRecipes && recipes.length === 0 ? (
                    <div className="app-card text-center py-10 md:py-12">
                      <div className="w-14 h-14 bg-[var(--color-primary-soft)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--color-primary-strong)]">
                        <UtensilsCrossed size={28} />
                      </div>
                      <h3 className="font-semibold mb-2">No recipes yet</h3>
                      <p className="text-[var(--color-text-muted)] text-sm max-w-xs mx-auto">
                        Scan your fridge or add pantry items manually. We&apos;ll serve suggestions with zero fuss 🍔
                      </p>
                    </div>
                  ) : (
                    recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="mt-16 md:mt-24 border-t border-[var(--color-border)] py-10 bg-white/80">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Refrigerator className="text-[var(--color-primary-strong)]" size={18} />
            <span className="font-bold">FridgeVibe</span>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">Powered by Gemini AI • Built for foodies 🥕</p>
        </div>
      </footer>
    </div>
  );
}

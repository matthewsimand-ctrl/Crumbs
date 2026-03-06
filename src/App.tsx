import { useState } from 'react';
import { FridgeScanner } from './components/FridgeScanner';
import { PantryList } from './components/PantryList';
import { RecipeCard } from './components/RecipeCard';
import { CrumbsLogo } from './components/CrumbsLogo';
import { Ingredient, Recipe } from './types';
import { analyzeFridgeImage, generateRecipes } from './services/geminiService';
import { ChefHat, Sparkles, Loader2, UtensilsCrossed } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);
  const [activeTab, setActiveTab] = useState<'pantry' | 'recipes'>('pantry');

  const handleScanComplete = async (base64Image: string) => {
    setIsScanning(true);
    try {
      const detectedIngredients = await analyzeFridgeImage(base64Image);
      setIngredients(detectedIngredients);
      setActiveTab('pantry');
    } catch (error) {
      console.error("Scanning failed", error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleGenerateRecipes = async () => {
    if (ingredients.length === 0) return;
    setIsGeneratingRecipes(true);
    try {
      const newRecipes = await generateRecipes(ingredients);
      setRecipes(newRecipes);
      setActiveTab('recipes');
    } catch (error) {
      console.error("Recipe generation failed", error);
    } finally {
      setIsGeneratingRecipes(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF8] text-slate-900 font-sans selection:bg-amber-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <CrumbsLogo />
          
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('pantry')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'pantry' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Pantry
            </button>
            <button
              onClick={() => setActiveTab('recipes')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'recipes' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Recipes
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-400 hover:text-amber-700 transition-colors">
              <Sparkles size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-amber-950 mb-4"
          >
            Cook Smarter, <span className="text-orange-500">Waste Less.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 max-w-2xl mx-auto"
          >
            Snap a photo of your fridge and let AI turn your leftovers into gourmet meals.
            Discover recipes, find local deals, and master your kitchen.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Scanner */}
          <div className="lg:col-span-5 space-y-8">
            <FridgeScanner onScanComplete={handleScanComplete} isScanning={isScanning} />
            
            {ingredients.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-amber-900 rounded-3xl text-white shadow-xl shadow-amber-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <ChefHat size={20} />
                    Ready to Cook?
                  </h3>
                  <span className="text-amber-200 text-xs font-medium px-2 py-1 bg-white/10 rounded-lg">
                    {ingredients.length} items found
                  </span>
                </div>
                <p className="text-amber-100/70 text-sm mb-6">
                  We've identified your ingredients. Now let's generate some delicious recipes tailored to what you have.
                </p>
                <button
                  onClick={handleGenerateRecipes}
                  disabled={isGeneratingRecipes}
                  className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-900/20"
                >
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

          {/* Right Column: Pantry/Recipes */}
          <div className="lg:col-span-7">
            {/* Mobile Tabs */}
            <div className="flex md:hidden mb-6 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('pantry')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'pantry' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                Pantry
              </button>
              <button
                onClick={() => setActiveTab('recipes')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'recipes' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                Recipes
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'pantry' ? (
                <motion.div
                  key="pantry"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <PantryList ingredients={ingredients} onUpdate={setIngredients} />
                </motion.div>
              ) : (
                <motion.div
                  key="recipes"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-semibold text-amber-900">Suggested Recipes</h2>
                    {recipes.length > 0 && (
                      <button 
                        onClick={handleGenerateRecipes}
                        className="text-sm text-amber-700 font-medium hover:underline"
                      >
                        Refresh Suggestions
                      </button>
                    )}
                  </div>
                  
                  {recipes.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-amber-100">
                      <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UtensilsCrossed className="text-amber-300" size={32} />
                      </div>
                      <h3 className="text-amber-900 font-semibold mb-2">No recipes yet</h3>
                      <p className="text-slate-400 text-sm max-w-xs mx-auto">
                        Scan your fridge or add ingredients manually to see recipe suggestions.
                      </p>
                    </div>
                  ) : (
                    recipes.map((recipe) => (
                      <RecipeCard key={recipe.id} recipe={recipe} />
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-24 border-t border-slate-100 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CrumbsLogo iconClassName="w-8 h-8" textClassName="font-bold text-amber-900" />
          </div>
          <p className="text-slate-400 text-sm">
            Powered by Gemini AI • Built for Foodies
          </p>
        </div>
      </footer>
    </div>
  );
}

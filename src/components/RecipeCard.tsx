import React, { useState } from 'react';
import { Recipe, Insight } from '../types';
import { Clock, ChefHat, ChevronDown, ChevronUp, ShoppingCart, Loader2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { findLocalDeals } from '../services/geminiService';
import { searchInstacartDeals, DealItem } from '../services/dealsService';

interface RecipeCardProps {
  recipe: Recipe;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [deals, setDeals] = useState<Insight[]>([]);
  const [instacartDeals, setInstacartDeals] = useState<DealItem[]>([]);
  const [isLoadingDeals, setIsLoadingDeals] = useState(false);
  const [zipCode, setZipCode] = useState('');
  const [showZipInput, setShowZipInput] = useState(false);

  const handleFindDeals = async () => {
    if (!zipCode) {
      setShowZipInput(true);
      return;
    }
    
    setIsLoadingDeals(true);
    try {
      // 1. Get Instacart Deals (Real data)
      const allDeals = await Promise.all(
        recipe.missingIngredients.map(ing => searchInstacartDeals(ing, zipCode, ["Walmart", "Kroger", "Costco"]))
      );
      
      // Filter for unique IDs and prioritize sales
      const uniqueDeals: DealItem[] = [];
      const seenIds = new Set<string>();
      
      allDeals.flat().forEach(deal => {
        if (!seenIds.has(deal.id)) {
          seenIds.add(deal.id);
          uniqueDeals.push(deal);
        }
      });

      const finalDeals = uniqueDeals
        .sort((a, b) => (b.isSale ? 1 : 0) - (a.isSale ? 1 : 0))
        .slice(0, 8);

      setInstacartDeals(finalDeals);

      // 2. Get Gemini Insights (Grounding)
      const dealsText = await findLocalDeals(recipe.missingIngredients, finalDeals);
      setDeals(dealsText);
    } catch (e) {
      setDeals([]);
    } finally {
      setIsLoadingDeals(false);
    }
  };

  return (
    <motion.div
      layout
      className="bg-white rounded-3xl overflow-hidden shadow-sm border border-emerald-100 hover:shadow-md transition-shadow"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-emerald-900">{recipe.title}</h3>
            <p className="text-emerald-600/70 text-sm line-clamp-2 mt-1">{recipe.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              recipe.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
              recipe.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {recipe.difficulty}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-emerald-700/60 text-sm mb-6">
          <div className="flex items-center gap-1">
            <Clock size={16} />
            {recipe.prepTime}
          </div>
          <div className="flex items-center gap-1">
            <ChefHat size={16} />
            {recipe.ingredients.length} ingredients
          </div>
        </div>

        {recipe.missingIngredients.length > 0 && (
          <div className="mb-6 p-4 bg-orange-50 rounded-2xl border border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">Missing Ingredients</span>
              <button
                onClick={handleFindDeals}
                disabled={isLoadingDeals}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                {isLoadingDeals ? <Loader2 className="animate-spin" size={12} /> : <ShoppingCart size={12} />}
                Find Deals
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recipe.missingIngredients.map((ing, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-white text-orange-600 rounded-lg border border-orange-200">
                  {ing}
                </span>
              ))}
            </div>
            
            <AnimatePresence>
              {showZipInput && !instacartDeals.length && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 flex gap-2"
                >
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={14} />
                    <input 
                      type="text"
                      placeholder="Enter Zip Code (e.g. 90210)"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-orange-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
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

              {instacartDeals.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-4 space-y-3"
                >
                  <p className="text-xs font-bold text-orange-800 uppercase tracking-wider">Savings Spotlight</p>
                  <div className="grid grid-cols-1 gap-2">
                    {instacartDeals.map((deal, index) => (
                      <div key={`${deal.id}-${deal.retailer}-${index}`} className="flex items-center gap-3 p-2 bg-white rounded-xl border border-orange-100 shadow-sm">
                        <img src={deal.imageUrl} alt={deal.name} className="w-10 h-10 object-contain rounded-lg" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-orange-900 truncate">{deal.name}</p>
                          <p className="text-[10px] text-orange-600">{deal.retailer}</p>
                        </div>
                        <div className={`text-xs font-bold ${deal.isSale ? 'text-emerald-600' : 'text-emerald-900'}`}>
                          ${deal.price.toFixed(2)} {deal.isSale && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1 rounded">SALE</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {deals.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-3 pt-3 border-t border-orange-200"
                >
                  <p className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-2">AI Shopping Insights</p>
                  <div className="space-y-2">
                    {deals.map((insight, i) => (
                      <div key={i} className="bg-white p-3 rounded-xl border border-orange-100 shadow-sm">
                        <p className="text-xs font-bold text-orange-900 mb-1">{insight.title}</p>
                        <p className="text-[10px] text-orange-700">{insight.description}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-2 flex items-center justify-center gap-2 text-emerald-600 font-semibold hover:bg-emerald-50 rounded-xl transition-colors"
        >
          {isExpanded ? (
            <>Hide Recipe <ChevronUp size={20} /></>
          ) : (
            <>View Recipe <ChevronDown size={20} /></>
          )}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-6 space-y-6">
                <div>
                  <h4 className="font-bold text-emerald-900 mb-3">Ingredients</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-emerald-700">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-emerald-900 mb-3">Instructions</h4>
                  <ol className="space-y-4">
                    {recipe.instructions.map((step, i) => (
                      <li key={i} className="flex gap-4 text-sm text-emerald-700">
                        <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xs">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

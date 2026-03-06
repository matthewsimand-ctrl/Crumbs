import React, { useState } from 'react';
import { Recipe, Insight } from '../types';
import { Clock, ChefHat, ChevronDown, ChevronUp, ShoppingCart, Loader2, MapPin, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { findLocalDeals } from '../services/geminiService';
import { searchInstacartDeals, DealItem } from '../services/dealsService';

interface RecipeCardProps {
  recipe: Recipe;
  onCompleteStep: () => void;
  onCompleteRecipe: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onCompleteStep, onCompleteRecipe }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [deals, setDeals] = useState<Insight[]>([]);
  const [instacartDeals, setInstacartDeals] = useState<DealItem[]>([]);
  const [isLoadingDeals, setIsLoadingDeals] = useState(false);
  const [zipCode, setZipCode] = useState('');
  const [showZipInput, setShowZipInput] = useState(false);
  const [dealsError, setDealsError] = useState<string | null>(null);

  const handleFindDeals = async () => {
    if (!zipCode) {
      setShowZipInput(true);
      return;
    }

    setDealsError(null);
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

      const finalDeals = uniqueDeals
        .sort((a, b) => (b.isSale ? 1 : 0) - (a.isSale ? 1 : 0))
        .slice(0, 8);

      setInstacartDeals(finalDeals);

      // 2. Get Gemini Insights (Grounding)
      const dealsText = await findLocalDeals(recipe.missingIngredients, uniqueDeals);
      setDeals(dealsText);

      if (topDeals.length === 0 && dealsText.length === 0) {
        setDealsError('No nearby deals found yet. Try another zip for fresh results 🍎');
      }
    } catch {
      setDeals([]);
      setInstacartDeals([]);
      setDealsError('Deal search hit a snag. Please try again in a moment.');
    } finally {
      setIsLoadingDeals(false);
    }
  };

  return (
    <motion.div layout className="app-card overflow-hidden hover:shadow-[var(--shadow-card-hover)] transition-shadow">
      <div>
        <div className="flex justify-between items-start mb-3 md:mb-4 gap-2">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-[var(--color-text)]">{recipe.title}</h3>
            <p className="text-[var(--color-text-muted)] text-sm line-clamp-2 mt-1">{recipe.description}</p>
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
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={14} />
                    <input
                      type="text"
                      placeholder="Enter zip code (e.g. 90210)"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>
                  <button onClick={handleFindDeals} className="app-button-primary px-4 !min-h-[2.6rem] text-sm">
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
                        className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-[var(--color-border)] shadow-sm"
                      >
                        <img src={deal.imageUrl} alt={deal.name} className="w-10 h-10 object-contain rounded-lg" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[var(--color-text)] truncate">{deal.name}</p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">{deal.retailer}</p>
                        </div>
                        <div className={`text-sm font-bold ${deal.isSale ? 'text-[var(--color-success)]' : 'text-[var(--color-text)]'}`}>
                          ${deal.price.toFixed(2)}{' '}
                          {deal.isSale && <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded">SALE</span>}
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

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="app-button-secondary w-full !min-h-[2.8rem] flex items-center justify-center gap-2"
        >
          {isExpanded ? (
            <>
              Hide Recipe <ChevronUp size={18} />
            </>
          ) : (
            <>
              View Recipe <ChevronDown size={18} />
            </>
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
              <div className="pt-5 space-y-5">
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

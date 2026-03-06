import React from 'react';
import { Ingredient } from '../types';
import { Trash2, Plus, Tag, Soup } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PantryListProps {
  ingredients: Ingredient[];
  onUpdate: (ingredients: Ingredient[]) => void;
}

export const PantryList: React.FC<PantryListProps> = ({ ingredients, onUpdate }) => {
  const removeIngredient = (id: string) => {
    onUpdate(ingredients.filter((i) => i.id !== id));
  };

  const addIngredient = () => {
    const newIng: Ingredient = {
      id: `ing-${Date.now()}`,
      name: 'New Item',
      quantity: '1 unit',
      category: 'Other',
    };
    onUpdate([...ingredients, newIng]);
  };

  const updateField = (id: string, field: keyof Ingredient, value: string) => {
    onUpdate(ingredients.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  return (
    <div className="app-card">
      <div className="flex items-center justify-between mb-4 md:mb-6 gap-2">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold">Your Pantry</h2>
          <p className="text-[var(--color-text-muted)] text-sm">Edit ingredient names and amounts before generating recipes.</p>
        </div>
        <button onClick={addIngredient} className="app-icon-pill" aria-label="Add pantry ingredient">
          <Plus size={22} />
        </button>
      </div>

      <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 md:pr-2 custom-scrollbar">
        <AnimatePresence initial={false}>
          {ingredients.length === 0 ? (
            <div className="status-panel py-10">
              <Soup className="mx-auto mb-2 text-[var(--color-primary-strong)]" size={22} />
              Pantry is empty for now — scan your fridge to start simmering ideas 🍲
            </div>
          ) : (
            ingredients.map((ing) => (
              <motion.div
                key={ing.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 md:gap-3 p-3 md:p-3.5 bg-[var(--color-primary-soft)]/50 rounded-[var(--radius-control)] border border-[var(--color-border)] group"
              >
                <div className="app-icon-pill min-h-9 min-w-9">
                  <Tag size={16} />
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    value={ing.name}
                    onChange={(e) => updateField(ing.id, 'name', e.target.value)}
                    className="bg-white/80 font-medium text-[var(--color-text)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-orange-300 rounded-lg px-2 py-2"
                    placeholder="Item name"
                  />
                  <input
                    value={ing.quantity}
                    onChange={(e) => updateField(ing.id, 'quantity', e.target.value)}
                    className="bg-white/80 text-[var(--color-text-muted)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-orange-300 rounded-lg px-2 py-2 sm:text-right"
                    placeholder="Quantity"
                  />
                </div>

                <button
                  onClick={() => removeIngredient(ing.id)}
                  className="p-2.5 text-[var(--color-text-muted)] hover:text-red-600 transition-colors md:opacity-0 group-hover:opacity-100"
                  aria-label={`Remove ${ing.name}`}
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

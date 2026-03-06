import React from 'react';
import { Ingredient } from '../types';
import { Trash2, Plus, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PantryListProps {
  ingredients: Ingredient[];
  onUpdate: (ingredients: Ingredient[]) => void;
}

export const PantryList: React.FC<PantryListProps> = ({ ingredients, onUpdate }) => {
  const removeIngredient = (id: string) => {
    onUpdate(ingredients.filter(i => i.id !== id));
  };

  const addIngredient = () => {
    const newIng: Ingredient = {
      id: `ing-${Date.now()}`,
      name: 'New Item',
      quantity: '1 unit',
      category: 'Other'
    };
    onUpdate([...ingredients, newIng]);
  };

  const updateField = (id: string, field: keyof Ingredient, value: string) => {
    onUpdate(ingredients.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-orange-900">Your Pantry</h2>
          <p className="text-orange-600/70 text-sm">Manage and correct your ingredients</p>
        </div>
        <button
          onClick={addIngredient}
          className="p-2 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-200 transition-colors"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence initial={false}>
          {ingredients.length === 0 ? (
            <div className="text-center py-12 text-orange-300 italic">
              No ingredients found. Scan your fridge to start!
            </div>
          ) : (
            ingredients.map((ing) => (
              <motion.div
                key={ing.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 bg-orange-50/50 rounded-2xl border border-orange-100 group"
              >
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <Tag className="text-orange-400" size={18} />
                </div>
                
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    value={ing.name}
                    onChange={(e) => updateField(ing.id, 'name', e.target.value)}
                    className="bg-transparent font-medium text-orange-900 focus:outline-none focus:ring-1 focus:ring-orange-200 rounded px-1"
                    placeholder="Item name"
                  />
                  <input
                    value={ing.quantity}
                    onChange={(e) => updateField(ing.id, 'quantity', e.target.value)}
                    className="bg-transparent text-sm text-orange-600 focus:outline-none focus:ring-1 focus:ring-orange-200 rounded px-1 text-right"
                    placeholder="Quantity"
                  />
                </div>

                <button
                  onClick={() => removeIngredient(ing.id)}
                  className="p-2 text-orange-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
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

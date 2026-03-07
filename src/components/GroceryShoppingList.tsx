import { useMemo, useState } from 'react';
import { Recipe } from '../types';
import { CheckCircle2, ShoppingBasket } from 'lucide-react';

interface GroceryShoppingListProps {
  recipes: Recipe[];
}

export function GroceryShoppingList({ recipes }: GroceryShoppingListProps) {
  const missingIngredients = useMemo(() => {
    const counts = new Map<string, number>();

    recipes.forEach((recipe) => {
      recipe.missingIngredients.forEach((ingredient) => {
        const normalized = ingredient.trim();
        if (!normalized) return;
        counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, usedInRecipes]) => ({ name, usedInRecipes }));
  }, [recipes]);

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleChecked = (itemName: string) => {
    setCheckedItems((current) => ({ ...current, [itemName]: !current[itemName] }));
  };

  if (missingIngredients.length === 0) {
    return (
      <section className="bg-white rounded-3xl border border-emerald-100 p-12 text-center">
        <ShoppingBasket className="mx-auto text-emerald-400 mb-3" size={36} />
        <h2 className="text-xl font-semibold text-emerald-900 mb-1">No grocery items yet</h2>
        <p className="text-sm text-slate-500">Generate recipes first and we will auto-build a consolidated shopping list here.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-emerald-900">Grocery Shopping</h2>
        <p className="text-sm text-slate-500">A combined list of every missing ingredient from your recipes.</p>
      </header>

      <div className="bg-white border border-emerald-100 rounded-2xl divide-y divide-emerald-50 overflow-hidden">
        {missingIngredients.map((item) => {
          const isChecked = Boolean(checkedItems[item.name]);
          return (
            <label key={item.name} className="flex items-center justify-between p-4 gap-4 cursor-pointer hover:bg-emerald-50/40">
              <div className="flex items-center gap-3 min-w-0">
                <input type="checkbox" checked={isChecked} onChange={() => toggleChecked(item.name)} className="accent-emerald-600" />
                <div className="min-w-0">
                  <p className={`font-medium ${isChecked ? 'line-through text-slate-400' : 'text-slate-800'}`}>{item.name}</p>
                  <p className="text-xs text-slate-500">Used in {item.usedInRecipes} recipe{item.usedInRecipes > 1 ? 's' : ''}</p>
                </div>
              </div>
              {isChecked && <CheckCircle2 className="text-emerald-600" size={18} />}
            </label>
          );
        })}
      </div>
    </section>
  );
}

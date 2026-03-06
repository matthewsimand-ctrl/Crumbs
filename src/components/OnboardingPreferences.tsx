import React, { useState } from 'react';
import { CookingLevel, TasteProfile, UserPreferences } from '../types';

interface OnboardingPreferencesProps {
  initialPreferences?: Partial<UserPreferences>;
  onSave: (preferences: UserPreferences) => void;
}

const cookingLevels: CookingLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
const tasteOptions: TasteProfile[] = ['Comfort Food', 'Healthy', 'Spicy', 'Global Flavors', 'Quick Meals', 'Vegetarian'];

export const OnboardingPreferences: React.FC<OnboardingPreferencesProps> = ({ initialPreferences, onSave }) => {
  const [cookingLevel, setCookingLevel] = useState<CookingLevel>(initialPreferences?.cookingLevel ?? 'Beginner');
  const [tasteProfiles, setTasteProfiles] = useState<TasteProfile[]>(initialPreferences?.tasteProfiles ?? []);

  const toggleTaste = (taste: TasteProfile) => {
    setTasteProfiles((prev) =>
      prev.includes(taste)
        ? prev.filter((item) => item !== taste)
        : [...prev, taste]
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({
      cookingLevel,
      tasteProfiles,
      onboardingCompleted: true,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-emerald-900">Set up your kitchen profile</h3>
        <p className="text-sm text-slate-500 mt-1">Tell FridgeVibe how you like to cook so recipes feel more personal.</p>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">Cooking level</p>
        <div className="flex flex-wrap gap-2">
          {cookingLevels.map((level) => (
            <button
              type="button"
              key={level}
              onClick={() => setCookingLevel(level)}
              className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
                cookingLevel === level
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">Taste profile (choose any)</p>
        <div className="flex flex-wrap gap-2">
          {tasteOptions.map((taste) => (
            <button
              type="button"
              key={taste}
              onClick={() => toggleTaste(taste)}
              className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
                tasteProfiles.includes(taste)
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300'
              }`}
            >
              {taste}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl transition-colors"
      >
        Save Preferences
      </button>
    </form>
  );
};

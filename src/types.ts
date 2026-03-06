export interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  category: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  ingredients: string[];
  missingIngredients: string[];
  prepTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface Deal {
  storeName: string;
  itemName: string;
  price: string;
  link?: string;
}

export interface Insight {
  title: string;
  description: string;
}

export type CookingLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type TasteProfile = 'Comfort Food' | 'Healthy' | 'Spicy' | 'Global Flavors' | 'Quick Meals' | 'Vegetarian';

export interface UserProgress {
  xp: number;
  badges: string[];
  completedRecipes: number;
  completedSteps: number;
}

export interface ScheduledRecipe {
  id: string;
  recipeId: string;
  recipeTitle: string;
  scheduledFor: string;
}

export interface UserPreferences {
  cookingLevel: CookingLevel;
  tasteProfiles: TasteProfile[];
  onboardingCompleted: boolean;
}

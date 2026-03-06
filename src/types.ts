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

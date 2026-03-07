import { GoogleGenAI, Type } from "@google/genai";
import { Ingredient, Recipe, UserPreferences } from "../types";
import { DealItem } from "./dealsService";
import { Insight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const analyzeFridgeImage = async (base64Image: string, mimeType = 'image/jpeg'): Promise<Ingredient[]> => {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
          {
            text: "Identify all food items in this fridge image. For each item, provide its name, estimated quantity (e.g., 'half full', '2 units', 'small amount'), and a broad category (e.g., 'Dairy', 'Vegetable', 'Protein', 'Condiment'). Return the result as a JSON array of objects.",
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            quantity: { type: Type.STRING },
            category: { type: Type.STRING },
          },
          required: ["name", "quantity", "category"],
        },
      },
    },
  });

  try {
    const data = JSON.parse(response.text || "[]");
    return data.map((item: any, index: number) => ({
      ...item,
      id: `ing-${Date.now()}-${index}`,
    }));
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
};

export const generateRecipes = async (ingredients: Ingredient[], preferences?: UserPreferences): Promise<Recipe[]> => {
  const model = "gemini-3-flash-preview";
  const ingredientNames = ingredients.map(i => i.name).join(", ");
  const preferenceContext = preferences
    ? `The user has cooking level "${preferences.cookingLevel}" and taste preferences: ${preferences.tasteProfiles.length > 0 ? preferences.tasteProfiles.join(", ") : "No specific taste preferences selected"}.`
    : 'No user preference context was provided.';
  
  const response = await ai.models.generateContent({
    model,
    contents: `Generate 3 creative recipes based on these ingredients: ${ingredientNames}. 
    ${preferenceContext}
    Match recipe complexity to the cooking level and flavor direction to the taste profile when possible.
    Include some recipes that might need 1-2 extra common ingredients (list those as missing).
    Return a JSON array of recipe objects.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            ingredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            missingIngredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            prepTime: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
          },
          required: ["title", "description", "instructions", "ingredients", "missingIngredients", "prepTime", "difficulty"],
        },
      },
    },
  });

  try {
    return JSON.parse(response.text || "[]").map((r: any, i: number) => ({
      ...r,
      id: `rec-${Date.now()}-${i}`
    }));
  } catch (e) {
    console.error("Failed to parse recipes", e);
    return [];
  }
};

export const findLocalDeals = async (missingIngredients: string[], deals: DealItem[]): Promise<Insight[]> => {
  const model = "gemini-3-flash-preview";
  
  const dealsContext = deals.map(d => `${d.name} at ${d.retailer}: $${d.price}${d.isSale ? ' (SALE)' : ''}`).join("\n");
  
  const prompt = `
    You are the "Smart Kitchen Assistant" for Crumbs.
    Your goal is to help the user save money and reduce food waste.
    
    The user is missing these ingredients: ${missingIngredients.join(", ")}.
    
    Here are the current deals found at nearby stores:
    ${dealsContext}
    
    Provide 3 top "Savings Spotlight" insights as a JSON array of objects with 'title' and 'description' fields.
    - Focus on items that are on sale.
    - Be encouraging, helpful, and focused on cost-saving.
    - Do NOT use Google Maps to find deals. Use the provided deal data to give insights.
    - Keep it concise.
  `;
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ["title", "description"],
        },
      },
    },
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse insights", e);
    return [];
  }
};

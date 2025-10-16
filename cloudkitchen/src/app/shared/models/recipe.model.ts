// Recipe model matching MongoDB Recipe schema
export interface Recipe {
  _id?: string;
  recipeId: string;
  userId: string;
  title: string;
  chef: string;
  ingredients: string[];
  instructions: string[];
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  cuisineType: 'Italian' | 'Asian' | 'Mexican' | 'American' | 'French' | 'Indian' | 'Mediterranean' | 'Other';
  prepTime: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  servings: number;
  createdDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RecipeRequest {
  title: string;
  chef: string;
  ingredients: string[];
  instructions: string[];
  mealType: string;
  cuisineType: string;
  prepTime: number;
  difficulty: string;
  servings: number;
  userId: string;
}

export interface RecipeResponse {
  success: boolean;
  data?: Recipe | Recipe[];
  message?: string;
  error?: string;
}

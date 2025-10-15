import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Recipe, RecipeRequest } from '../../shared/models/recipe.model';

/**
 * Recipe Service - Handles all recipe-related API calls
 * Based on employee-management DatabaseService pattern
 * Student: Zhan Sun ()
 */
@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private http = inject(HttpClient);

  // API base URL - matches backend configuration
  private readonly API_URL = 'http://localhost:3000/api/recipes';

  /**
   * Get all recipes
   * @returns Observable<Recipe[]>
   */
  getAllRecipes(): Observable<Recipe[]> {
    return this.http.get<Recipe[]>(this.API_URL).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get recipe by ID
   * @param recipeId Recipe ID (format: R-XXXXX)
   * @returns Observable<Recipe>
   */
  getRecipeById(recipeId: string): Observable<Recipe> {
    return this.http.get<Recipe>(`${this.API_URL}/${recipeId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get recipes by user ID
   * @param userId User ID (format: U-XXXXX)
   * @returns Observable<Recipe[]>
   */
  getRecipesByUserId(userId: string): Observable<Recipe[]> {
    return this.http.get<Recipe[]>(`${this.API_URL}/user/${userId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Create a new recipe
   * @param recipeData Recipe data to create
   * @returns Observable<Recipe>
   */
  createRecipe(recipeData: RecipeRequest): Observable<Recipe> {
    return this.http.post<Recipe>(this.API_URL, recipeData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Update an existing recipe
   * @param recipeId Recipe ID
   * @param recipeData Updated recipe data
   * @returns Observable<Recipe>
   */
  updateRecipe(recipeId: string, recipeData: Partial<RecipeRequest>): Observable<Recipe> {
    return this.http.put<Recipe>(`${this.API_URL}/${recipeId}`, recipeData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Delete a recipe
   * @param recipeId Recipe ID
   * @returns Observable<any>
   */
  deleteRecipe(recipeId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${recipeId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Search recipes by filters
   * @param filters Search filters (mealType, cuisineType, difficulty, etc.)
   * @returns Observable<Recipe[]>
   */
  searchRecipes(filters: any): Observable<Recipe[]> {
    return this.http.get<Recipe[]>(`${this.API_URL}/search`, { params: filters }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Error handler for HTTP requests
   * @param error HTTP error response
   * @returns Observable that throws error
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || error.message || `Error Code: ${error.status}`;
    }

    console.error('Recipe Service Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}

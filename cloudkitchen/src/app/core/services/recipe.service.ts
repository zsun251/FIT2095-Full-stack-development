import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { Recipe, RecipeRequest, RecipeResponse } from '../../shared/models/recipe.model';

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
    return this.http.get<RecipeResponse>(`${this.API_URL}`).pipe(
      map(response => {
        if (response.success && Array.isArray(response.data)) {
          return response.data;
        }
        throw new Error(response.error || 'Failed to fetch recipes');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get current user's recipes
   * @returns Observable<Recipe[]>
   */
  getMyRecipes(): Observable<Recipe[]> {
    return this.http.get<RecipeResponse>(`${this.API_URL}/my`).pipe(
      map(response => {
        if (response.success && Array.isArray(response.data)) {
          return response.data;
        }
        throw new Error(response.error || 'Failed to fetch my recipes');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get recipe by ID
   * @param recipeId Recipe ID (format: R-XXXXX)
   * @returns Observable<Recipe>
   */
  getRecipeById(recipeId: string): Observable<Recipe> {
    return this.http.get<RecipeResponse>(`${this.API_URL}/${recipeId}`).pipe(
      map(response => {
        if (response.success && response.data && !Array.isArray(response.data)) {
          return response.data;
        }
        throw new Error(response.error || 'Recipe not found');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Create a new recipe
   * @param recipeData Recipe data to create
   * @returns Observable<Recipe>
   */
  createRecipe(recipeData: RecipeRequest): Observable<Recipe> {
    return this.http.post<RecipeResponse>(`${this.API_URL}`, recipeData).pipe(
      map(response => {
        if (response.success && response.data && !Array.isArray(response.data)) {
          return response.data;
        }
        throw new Error(response.error || 'Failed to create recipe');
      }),
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
    return this.http.put<RecipeResponse>(`${this.API_URL}/${recipeId}`, recipeData).pipe(
      map(response => {
        if (response.success && response.data && !Array.isArray(response.data)) {
          return response.data;
        }
        throw new Error(response.error || 'Failed to update recipe');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Delete a recipe
   * @param recipeId Recipe ID
   * @returns Observable<RecipeResponse>
   */
  deleteRecipe(recipeId: string): Observable<RecipeResponse> {
    return this.http.delete<RecipeResponse>(`${this.API_URL}/${recipeId}`).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Failed to delete recipe');
        }
        return response;
      }),
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

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';

export interface Language {
  code: string;
  name: string;
}

export interface TranslatedRecipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  targetLanguage: string;
  originalLanguage: string;
}

export interface TranslationResponse {
  success: boolean;
  data?: TranslatedRecipe;
  error?: string;
}

export interface LanguagesResponse {
  success: boolean;
  data?: Language[];
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private http = inject(HttpClient);
  private readonly API_URL = '/api/translation';

  /**
   * Translate a recipe to target language
   * @param recipeId Recipe ID
   * @param targetLanguage Target language code (e.g., 'es', 'fr', 'it')
   * @returns Observable<TranslationResponse>
   */
  translateRecipe(recipeId: string, targetLanguage: string): Observable<TranslationResponse> {
    return this.http.post<TranslationResponse>(
      `${this.API_URL}/recipe/${recipeId}`,
      { targetLanguage }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get list of supported languages
   * @returns Observable<Language[]>
   */
  getSupportedLanguages(): Observable<Language[]> {
    return this.http.get<LanguagesResponse>(`${this.API_URL}/languages`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error || 'Failed to fetch languages');
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
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.error || error.message || `Error Code: ${error.status}`;
    }

    console.error('Translation Service Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}

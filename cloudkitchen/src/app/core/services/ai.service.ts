import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HealthAnalysis {
  healthScore: number;
  concerns: string[];
  strengths: string[];
  suggestions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private readonly apiUrl = '/api/recipes';

  constructor(private http: HttpClient) {}

  analyzeRecipeHealth(recipeId: string): Observable<{ success: boolean; data?: HealthAnalysis; error?: string }> {
    return this.http.post<{ success: boolean; data?: HealthAnalysis; error?: string }>(
      `${this.apiUrl}/${recipeId}/analyze-health`,
      {}
    );
  }
}

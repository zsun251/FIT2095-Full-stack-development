import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RecipeService } from '../../core/services/recipe.service';
import { AuthService } from '../../core/services/auth.service';
import { AiService, HealthAnalysis } from '../../core/services/ai.service';
import { Recipe } from '../../shared/models/recipe.model';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recipe-list.component.html'
})
export class RecipeListComponent implements OnInit {
  private recipeService = inject(RecipeService);
  private authService = inject(AuthService);
  private aiService = inject(AiService);

  recipes: Recipe[] = [];
  filteredRecipes: Recipe[] = [];
  loading = false;
  error: string | null = null;
  showAll = true;
  currentUserId: string | null = null;
  analyzingRecipeId: string | null = null;
  healthAnalysis: HealthAnalysis | null = null;
  showAnalysisModal = false;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUserId = user?.userId || null;
      this.loadRecipes();
    });
  }

  loadRecipes(): void {
    this.loading = true;
    this.error = null;

    if (this.showAll) {
      this.recipeService.getAllRecipes().subscribe({
        next: (recipes) => {
          this.recipes = recipes;
          this.filteredRecipes = recipes;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message || 'Failed to load recipes';
          this.loading = false;
        }
      });
    } else {
      this.recipeService.getMyRecipes().subscribe({
        next: (recipes) => {
          this.recipes = recipes;
          this.filteredRecipes = recipes;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message || 'Failed to load your recipes';
          this.loading = false;
        }
      });
    }
  }

  toggleView(showAll: boolean): void {
    this.showAll = showAll;
    this.loadRecipes();
  }

  deleteRecipe(recipeId: string, title: string): void {
    if (confirm(`Are you sure you want to delete this recipe: ${title}?`)) {
      this.recipeService.deleteRecipe(recipeId).subscribe({
        next: () => {
          this.loadRecipes();
        },
        error: (err) => {
          this.error = err.message || 'Failed to delete recipe';
        }
      });
    }
  }

  getMealTypeBadgeClass(mealType: string): string {
    switch (mealType) {
      case 'Breakfast': return 'bg-warning';
      case 'Lunch': return 'bg-success';
      case 'Dinner': return 'bg-primary';
      default: return 'bg-secondary';
    }
  }

  getDifficultyBadgeClass(difficulty: string): string {
    switch (difficulty) {
      case 'Easy': return 'bg-success';
      case 'Medium': return 'bg-warning';
      case 'Hard': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  truncate(text: string, length: number): string {
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  analyzeHealth(recipeId: string): void {
    this.analyzingRecipeId = recipeId;
    this.error = null;

    this.aiService.analyzeRecipeHealth(recipeId).subscribe({
      next: (response) => {
        this.analyzingRecipeId = null;
        if (response.success && response.data) {
          this.healthAnalysis = response.data;
          this.showAnalysisModal = true;
        } else {
          this.error = response.error || 'Failed to analyze recipe health';
        }
      },
      error: (err) => {
        this.analyzingRecipeId = null;
        this.error = err.message || 'Failed to analyze recipe health';
      }
    });
  }

  closeAnalysisModal(): void {
    this.showAnalysisModal = false;
    this.healthAnalysis = null;
  }

  getHealthScoreClass(score: number): string {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-warning';
    return 'bg-danger';
  }
}

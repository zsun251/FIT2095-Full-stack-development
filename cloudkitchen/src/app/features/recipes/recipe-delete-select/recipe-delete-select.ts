import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RecipeService } from '../../../core/services/recipe.service';
import { Recipe } from '../../../shared/models/recipe.model';

@Component({
  selector: 'app-recipe-delete-select',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recipe-delete-select.html'
})
export class RecipeDeleteSelect implements OnInit {
  recipes: Recipe[] = [];
  selectedRecipeId: string = '';
  selectedRecipe: Recipe | null = null;
  showDetails: boolean = false;
  confirmChecked: boolean = false;
  loading: boolean = true;
  error: string = '';

  constructor(
    private recipeService: RecipeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRecipes();
  }

  loadRecipes(): void {
    this.loading = true;
    // Only load current user's recipes for deletion
    this.recipeService.getMyRecipes().subscribe({
      next: (recipes) => {
        this.recipes = recipes;
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = 'Failed to load your recipes';
        this.loading = false;
        console.error('Error loading recipes:', err);
      }
    });
  }

  onRecipeSelect(): void {
    if (!this.selectedRecipeId) {
      this.showDetails = false;
      this.selectedRecipe = null;
      this.confirmChecked = false;
      return;
    }

    this.selectedRecipe = this.recipes.find(recipe => recipe.recipeId === this.selectedRecipeId) || null;

    if (this.selectedRecipe) {
      this.showDetails = true;
      this.confirmChecked = false;
    }
  }

  onDelete(): void {
    if (!this.selectedRecipeId || !this.confirmChecked) {
      return;
    }

    if (confirm(`Are you sure you want to delete "${this.selectedRecipe?.title}"? This action cannot be undone.`)) {
      this.recipeService.deleteRecipe(this.selectedRecipeId).subscribe({
        next: () => {
          alert('Recipe deleted successfully!');
          this.router.navigate(['/recipes']);
        },
        error: (err: Error) => {
          this.error = 'Failed to delete recipe';
          console.error('Error deleting recipe:', err);
          alert('Failed to delete recipe. Please try again.');
        }
      });
    }
  }

  resetForm(): void {
    this.selectedRecipeId = '';
    this.showDetails = false;
    this.selectedRecipe = null;
    this.confirmChecked = false;
    this.error = '';
  }

  goBack(): void {
    this.router.navigate(['/recipes']);
  }
}

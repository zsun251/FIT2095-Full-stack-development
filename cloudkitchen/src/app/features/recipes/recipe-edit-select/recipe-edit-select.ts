import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RecipeService } from '../../../core/services/recipe.service';
import { Recipe } from '../../../shared/models/recipe.model';

@Component({
  selector: 'app-recipe-edit-select',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recipe-edit-select.html'
})
export class RecipeEditSelect implements OnInit {
  recipes: Recipe[] = [];
  selectedRecipeId: string = '';
  selectedRecipe: Recipe | null = null;
  showEditForm: boolean = false;
  loading: boolean = true;
  error: string = '';

  // Form fields
  formData = {
    title: '',
    chef: '',
    cuisineType: '',
    mealType: '',
    prepTime: 1,
    difficulty: '',
    servings: 1,
    ingredients: [] as string[],
    instructions: [] as string[]
  };

  // Ingredients and instructions as text
  ingredientsText: string = '';
  instructionsText: string = '';

  cuisineTypes = ['Italian', 'Asian', 'Mexican', 'American', 'French', 'Indian', 'Mediterranean', 'Other'];
  mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  difficulties = ['Easy', 'Medium', 'Hard'];

  constructor(
    private recipeService: RecipeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRecipes();
  }

  loadRecipes(): void {
    this.loading = true;
    // Only load current user's recipes for editing
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
      this.showEditForm = false;
      this.selectedRecipe = null;
      return;
    }

    this.selectedRecipe = this.recipes.find(recipe => recipe.recipeId === this.selectedRecipeId) || null;

    if (this.selectedRecipe) {
      // Populate form with selected recipe data
      this.formData = {
        title: this.selectedRecipe.title,
        chef: this.selectedRecipe.chef,
        cuisineType: this.selectedRecipe.cuisineType,
        mealType: this.selectedRecipe.mealType,
        prepTime: this.selectedRecipe.prepTime,
        difficulty: this.selectedRecipe.difficulty,
        servings: this.selectedRecipe.servings,
        ingredients: [...this.selectedRecipe.ingredients],
        instructions: [...this.selectedRecipe.instructions]
      };

      // Convert arrays to text for editing
      this.ingredientsText = this.formData.ingredients.join('\n');
      this.instructionsText = this.formData.instructions.join('\n');

      this.showEditForm = true;
    }
  }

  onSubmit(): void {
    if (!this.selectedRecipeId || !this.selectedRecipe) {
      return;
    }

    // Convert text back to arrays
    const ingredients = this.ingredientsText.split('\n').filter(line => line.trim() !== '');
    const instructions = this.instructionsText.split('\n').filter(line => line.trim() !== '');

    const updatedRecipe = {
      title: this.formData.title,
      chef: this.formData.chef,
      cuisineType: this.formData.cuisineType,
      mealType: this.formData.mealType,
      prepTime: this.formData.prepTime,
      difficulty: this.formData.difficulty,
      servings: this.formData.servings,
      ingredients: ingredients,
      instructions: instructions,
      userId: this.selectedRecipe.userId
    };

    this.recipeService.updateRecipe(this.selectedRecipeId, updatedRecipe).subscribe({
      next: () => {
        alert('Recipe updated successfully!');
        this.router.navigate(['/recipes']);
      },
      error: (err: Error) => {
        this.error = 'Failed to update recipe';
        console.error('Error updating recipe:', err);
        alert('Failed to update recipe. Please try again.');
      }
    });
  }

  resetForm(): void {
    this.selectedRecipeId = '';
    this.showEditForm = false;
    this.selectedRecipe = null;
    this.ingredientsText = '';
    this.instructionsText = '';
    this.error = '';
  }

  goBack(): void {
    this.router.navigate(['/recipes']);
  }
}

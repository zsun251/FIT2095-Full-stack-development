import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeService } from '../../core/services/recipe.service';
import { AiService } from '../../core/services/ai.service';
import { TranslationService, Language, TranslatedRecipe } from '../../core/services/translation.service';
import { SocketService } from '../../core/services/socket.service';
import { Recipe } from '../../shared/models/recipe.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recipe-detail.component.html'
})
export class RecipeDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private recipeService = inject(RecipeService);
  private aiService = inject(AiService);
  private translationService = inject(TranslationService);
  private socketService = inject(SocketService);

  recipe: Recipe | null = null;
  loading = false;
  error: string | null = null;
  analyzingTask: number | null = null;
  taskResults: { [key: number]: any } = {};

  // Translation properties
  languages: Language[] = [];
  selectedLanguage: string = '';
  translatedRecipe: TranslatedRecipe | null = null;
  showTranslation: boolean = false;

  // Text-to-Speech properties
  audioUrl: string | null = null;
  isGeneratingAudio: boolean = false;
  audioStatus: string = '';
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    const recipeId = this.route.snapshot.paramMap.get('id');
    if (recipeId) {
      this.loadRecipe(recipeId);
    } else {
      this.error = 'No recipe ID provided';
    }

    // Load supported languages
    this.loadLanguages();

    // Connect to Socket.IO and set up listeners
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());

    // Disconnect socket
    this.socketService.disconnect();
  }

  loadLanguages(): void {
    this.translationService.getSupportedLanguages().subscribe({
      next: (languages) => {
        this.languages = languages;
      },
      error: (err) => {
        console.error('Failed to load languages:', err);
      }
    });
  }

  loadRecipe(recipeId: string): void {
    this.loading = true;
    this.error = null;

    this.recipeService.getRecipeById(recipeId).subscribe({
      next: (recipe) => {
        this.recipe = recipe;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load recipe';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/recipes']);
  }

  editRecipe(): void {
    if (this.recipe) {
      this.router.navigate(['/recipes/edit'], {
        state: { selectedRecipeId: this.recipe.recipeId }
      });
    }
  }

  deleteRecipe(): void {
    if (!this.recipe) return;

    if (confirm(`Are you sure you want to delete "${this.recipe.title}"?`)) {
      this.recipeService.deleteRecipe(this.recipe.recipeId).subscribe({
        next: () => {
          this.router.navigate(['/recipes']);
        },
        error: (err) => {
          this.error = err.message || 'Failed to delete recipe';
        }
      });
    }
  }

  // HD Task 1: AI Analysis
  analyzeHealth(): void {
    if (!this.recipe) return;

    this.analyzingTask = 1;
    this.error = null;

    this.aiService.analyzeRecipeHealth(this.recipe.recipeId).subscribe({
      next: (response) => {
        this.analyzingTask = null;
        if (response.success && response.data) {
          this.taskResults[1] = response.data;
        } else {
          this.error = response.error || 'Failed to analyze recipe health';
        }
      },
      error: (err) => {
        this.analyzingTask = null;
        this.error = err.message || 'Failed to analyze recipe health';
      }
    });
  }

  // HD Task 2: Translation
  translateRecipe(): void {
    if (!this.recipe || !this.selectedLanguage) {
      this.error = 'Please select a language';
      return;
    }

    this.analyzingTask = 2;
    this.error = null;

    this.translationService.translateRecipe(this.recipe.recipeId, this.selectedLanguage).subscribe({
      next: (response) => {
        this.analyzingTask = null;
        if (response.success && response.data) {
          this.translatedRecipe = response.data;
          this.showTranslation = true;
        } else {
          this.error = response.error || 'Translation failed';
        }
      },
      error: (err) => {
        this.analyzingTask = null;
        this.error = err.message || 'Translation failed';
      }
    });
  }

  closeTranslation(): void {
    this.showTranslation = false;
    this.translatedRecipe = null;
    this.selectedLanguage = '';
  }

  // HD Task 3: Text-to-Speech
  setupSocketListeners(): void {
    // Connect to Socket.IO
    this.socketService.connect();

    // Listen for speech generation progress
    const generatingSub = this.socketService.onSpeechGenerating().subscribe(data => {
      this.audioStatus = data.message;
    });
    this.subscriptions.push(generatingSub);

    // Listen for speech ready
    const readySub = this.socketService.onSpeechReady().subscribe(data => {
      this.isGeneratingAudio = false;
      this.analyzingTask = null;
      this.audioUrl = data.audioUrl;
      this.audioStatus = 'Audio ready';
    });
    this.subscriptions.push(readySub);

    // Listen for errors
    const errorSub = this.socketService.onSpeechError().subscribe(data => {
      this.isGeneratingAudio = false;
      this.analyzingTask = null;
      this.error = data.error;
      this.audioStatus = '';
    });
    this.subscriptions.push(errorSub);
  }

  readRecipe(): void {
    if (!this.recipe) return;

    this.isGeneratingAudio = true;
    this.analyzingTask = 3;
    this.error = null;
    this.audioStatus = 'Generating audio...';
    this.audioUrl = null;

    // Request speech generation via Socket.IO
    this.socketService.generateSpeech(this.recipe.recipeId);
  }

  stopAudio(): void {
    this.audioUrl = null;
    this.audioStatus = '';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getHealthScoreClass(score: number): string {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-warning';
    return 'bg-danger';
  }
}

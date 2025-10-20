import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
  `]
})
export class App {
  title = 'CloudKitchen Pro - Recipe & Inventory Management';
  showHeaderFooter = false;

  constructor(private router: Router) {
    // Check current route and update header/footer visibility
    const updateVisibility = (url: string) => {
      this.showHeaderFooter = !(url.includes('/login') || url.includes('/register'));
    };

    // Check on init
    updateVisibility(this.router.url);

    // Listen to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      updateVisibility(event.url);
    });
  }
}

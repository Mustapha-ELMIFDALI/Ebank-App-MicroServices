import { Component, effect, inject, signal, untracked } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { BankService } from './services/bank.service';
import { ChatService } from './services/chat.service';
import { LoadingService } from './services/loading.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly loading = inject(LoadingService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  protected readonly menuOpen = signal(false);
  protected readonly pages = [
    { path: '/', label: 'Home' },
    { path: '/accounts', label: 'Accounts' },
    { path: '/customers', label: 'Customers' },
    { path: '/bot', label: 'Bot' },
    { path: '/network', label: 'Network' },
  ];

  constructor() {
    const bank = inject(BankService);
    const chat = inject(ChatService);
    let wasSignedIn = false;
    effect(() => {
      const signedIn = this.auth.signedIn();
      untracked(() => {
        if (signedIn) {
          bank.refresh();
        } else if (wasSignedIn) {
          // nothing of the previous user stays on screen or in memory
          bank.clear();
          chat.restart();
          this.menuOpen.set(false);
          void this.router.navigate(['/login']);
        }
        wasSignedIn = signedIn;
      });
    });
  }

  protected search(words: string, event: Event): void {
    event.preventDefault();
    this.menuOpen.set(false);
    void this.router.navigate(['/accounts'], { queryParams: { q: words.trim() || null } });
  }

  // A plain #main link would resolve against <base href="/"> and leave the page
  protected skipToContent(main: HTMLElement, event: Event): void {
    event.preventDefault();
    main.focus();
  }
}

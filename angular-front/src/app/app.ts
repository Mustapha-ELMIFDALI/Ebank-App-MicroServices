import { Component, effect, inject, untracked } from '@angular/core';
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
  protected readonly loading = inject(LoadingService);
  protected readonly theme = inject(ThemeService);
  protected readonly pages = [
    { path: '/', label: 'Wallet', icon: 'ph-wallet' },
    { path: '/accounts', label: 'Accounts', icon: 'ph-cards-three' },
    { path: '/customers', label: 'Customers', icon: 'ph-users-three' },
    { path: '/assistant', label: 'Assistant', icon: 'ph-chat-teardrop-dots' },
    { path: '/network', label: 'Network', icon: 'ph-share-network' },
  ];

  protected readonly auth = inject(AuthService);

  constructor() {
    const bank = inject(BankService);
    const chat = inject(ChatService);
    const router = inject(Router);
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
          void router.navigate(['/login']);
        }
        wasSignedIn = signedIn;
      });
    });
  }

  // A plain #main link would resolve against <base href="/"> and leave the page
  protected skipToContent(main: HTMLElement, event: Event): void {
    event.preventDefault();
    main.focus();
  }
}

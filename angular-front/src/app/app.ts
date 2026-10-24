import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BankService } from './services/bank.service';
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

  constructor() {
    inject(BankService).refresh();
  }

  // A plain #main link would resolve against <base href="/"> and leave the page
  protected skipToContent(main: HTMLElement, event: Event): void {
    event.preventDefault();
    main.focus();
  }
}

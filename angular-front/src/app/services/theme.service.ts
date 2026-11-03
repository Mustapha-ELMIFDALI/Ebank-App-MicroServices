import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

// Bootstrap color modes
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly root = inject(DOCUMENT).documentElement;
  private readonly current = signal<Theme>(this.root.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light');
  readonly theme = this.current.asReadonly();

  toggle(): void {
    const next: Theme = this.current() === 'dark' ? 'light' : 'dark';
    this.root.setAttribute('data-bs-theme', next);
    this.current.set(next);
    try {
      localStorage.setItem('ebank-theme', next);
    } catch {
      // storage can be blocked, the theme still changes
    }
  }
}

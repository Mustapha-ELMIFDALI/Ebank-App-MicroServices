import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly current = signal<Theme>(
    this.document.documentElement.dataset['theme'] === 'dark' ? 'dark' : 'light',
  );
  readonly theme = this.current.asReadonly();

  toggle(origin?: HTMLElement): void {
    const next: Theme = this.current() === 'dark' ? 'light' : 'dark';
    const root = this.document.documentElement;
    const apply = () => {
      root.dataset['theme'] = next;
      this.current.set(next);
      try {
        localStorage.setItem('ebank-theme', next);
      } catch {
        // storage can be blocked, the theme still changes
      }
    };
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still || !this.document.startViewTransition) return apply();

    // The new theme opens from the button that was pressed
    const box = origin?.getBoundingClientRect();
    root.style.setProperty('--reveal-x', `${box ? box.x + box.width / 2 : 0}px`);
    root.style.setProperty('--reveal-y', `${box ? box.y + box.height / 2 : 0}px`);
    this.document.startViewTransition(apply);
  }
}

import { Component, computed, inject, input } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { Seal } from '../../shared/seal/seal';

// The frame of both screens. The pass engraves its seal while the email is typed
@Component({
  selector: 'app-gate',
  imports: [Seal],
  templateUrl: './gate.html',
})
export class Gate {
  readonly email = input('');
  readonly holder = input('');
  protected readonly theme = inject(ThemeService);
  protected readonly seed = computed(() => this.email().trim().toLowerCase() || 'e-bank');
  protected readonly title = computed(() => this.holder().trim() || this.email().split('@')[0] || 'Your name');
}

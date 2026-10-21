import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { engrave } from './engraving';

@Component({
  selector: 'app-seal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg viewBox="-8 -8 216 216" fill="none">
      @for (path of paths(); track $index) {
        <path [attr.d]="path" />
      }
    </svg>
  `,
})
export class Seal {
  readonly value = input.required<string>();
  readonly rings = input(11);
  protected readonly paths = computed(() => engrave(this.value(), this.rings()));
}

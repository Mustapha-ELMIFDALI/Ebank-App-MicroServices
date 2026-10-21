import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Totals } from '../../model/account.model';

@Component({
  selector: 'app-split-bar',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="split" tabindex="0" role="img" [attr.aria-label]="description()">
      <div class="split-track" [style.width.%]="width()">
        @if (totals().current) {
          <i class="split-current" [style.flex-grow]="totals().current"></i>
        }
        @if (totals().saving) {
          <i class="split-saving" [style.flex-grow]="totals().saving"></i>
        }
      </div>
      <span class="split-tip" aria-hidden="true">
        <span><i class="key key-current"></i>Current<b>{{ totals().current | number: '1.2-2' }}</b></span>
        <span><i class="key key-saving"></i>Savings<b>{{ totals().saving | number: '1.2-2' }}</b></span>
      </span>
    </div>
  `,
})
export class SplitBar {
  readonly totals = input.required<Totals>();
  readonly max = input(0);
  protected readonly width = computed(() => (this.max() ? (this.totals().total / this.max()) * 100 : 100));
  protected readonly description = computed(
    () => `Current ${this.totals().current.toFixed(2)} MAD, savings ${this.totals().saving.toFixed(2)} MAD`,
  );
}

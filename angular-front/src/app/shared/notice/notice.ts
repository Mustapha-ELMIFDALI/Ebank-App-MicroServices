import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-notice',
  template: `
    <div class="notice" role="alert">
      <i class="ph ph-plugs" aria-hidden="true"></i>
      <p><strong>{{ heading() }}</strong>{{ message() }}</p>
      <button type="button" class="button button-quiet" (click)="retry.emit()">Retry</button>
    </div>
  `,
})
export class Notice {
  readonly heading = input.required<string>();
  readonly message = input<string | undefined>('');
  readonly retry = output<void>();
}

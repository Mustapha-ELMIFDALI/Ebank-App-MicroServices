import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-notice',
  template: `
    <div class="alert alert-danger d-flex flex-wrap align-items-center gap-3" role="alert">
      <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
      <div class="flex-grow-1"><strong>{{ heading() }}</strong>{{ message() }}</div>
      <button type="button" class="btn btn-danger btn-sm" (click)="retry.emit()">Retry</button>
    </div>
  `,
})
export class Notice {
  readonly heading = input.required<string>();
  readonly message = input<string | undefined>('');
  readonly retry = output<void>();
}

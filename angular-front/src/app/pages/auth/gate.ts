import { Component, input } from '@angular/core';

// The frame of both screens: a photo and a form
@Component({
  selector: 'app-gate',
  templateUrl: './gate.html',
})
export class Gate {
  readonly screen = input.required<'login' | 'signup'>();
}

import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { FormField, email, form, required, submit, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { errorMessageOf } from '../../model/request-state.model';
import { AuthService } from '../../services/auth.service';
import { safeNext } from '../../shared/safe-next';
import { Gate } from './gate';

@Component({
  selector: 'app-signup',
  imports: [FormField, RouterLink, Gate],
  templateUrl: './signup.html',
})
export class Signup {
  readonly next = input<string>();
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly failure = signal('');
  protected readonly visible = signal(false);

  protected readonly model = signal({ name: '', email: '', password: '', confirm: '' });
  protected readonly signupForm = form(this.model, (path) => {
    required(path.name, { message: 'Enter your name.' });
    validate(path.name, ({ value }) => {
      if (value() && !value().trim()) return { kind: 'blank', message: 'Enter your name.' };
      return value().length > 80 ? { kind: 'long', message: 'Use 80 characters at most.' } : undefined;
    });
    required(path.email, { message: 'Enter your email address.' });
    email(path.email, { message: 'Use an address like name@example.com.' });
    required(path.password, { message: 'Choose a password.' });
    validate(path.password, ({ value }) => {
      if (!value()) return undefined;
      if (value().length < 10) return { kind: 'short', message: 'Use at least 10 characters.' };
      return new TextEncoder().encode(value()).length > 72
        ? { kind: 'long', message: 'This password is too long.' }
        : undefined;
    });
    required(path.confirm, { message: 'Type the password again.' });
    validate(path.confirm, ({ value, valueOf }) =>
      value() && value() !== valueOf(path.password)
        ? { kind: 'mismatch', message: 'The two passwords are different.' }
        : undefined,
    );
  });

  protected save(event: Event): void {
    event.preventDefault();
    this.failure.set('');
    void submit(this.signupForm, async () => {
      const { name, email: address, password } = this.model();
      try {
        await firstValueFrom(this.auth.signUp(name.trim(), address, password));
        await this.router.navigateByUrl(safeNext(this.next()));
      } catch (error) {
        this.failure.set(errorMessageOf(error as HttpErrorResponse));
      }
    });
  }
}

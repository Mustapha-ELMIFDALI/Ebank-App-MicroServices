import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { errorMessageOf } from '../../model/request-state.model';
import { AuthService } from '../../services/auth.service';
import { safeNext } from '../../shared/safe-next';
import { Gate } from './gate';

@Component({
  selector: 'app-login',
  imports: [FormField, RouterLink, Gate],
  templateUrl: './login.html',
})
export class Login {
  readonly next = input<string>();
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly failure = signal('');
  protected readonly visible = signal(false);

  protected readonly model = signal({ email: '', password: '' });
  protected readonly loginForm = form(this.model, (path) => {
    required(path.email, { message: 'Enter your email address.' });
    required(path.password, { message: 'Enter your password.' });
  });

  protected save(event: Event): void {
    event.preventDefault();
    this.failure.set('');
    void submit(this.loginForm, async () => {
      const { email, password } = this.model();
      try {
        await firstValueFrom(this.auth.login(email, password));
        await this.router.navigateByUrl(safeNext(this.next()));
      } catch (error) {
        this.failure.set(errorMessageOf(error as HttpErrorResponse));
      }
    });
  }
}

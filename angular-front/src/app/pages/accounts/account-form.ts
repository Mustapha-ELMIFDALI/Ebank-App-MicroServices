import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormField, form, max, min, required, submit, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { Account, AccountType } from '../../model/account.model';
import { errorMessageOf } from '../../model/request-state.model';
import { BankService } from '../../services/bank.service';

// Angular 21 signal forms
@Component({
  selector: 'app-account-form',
  imports: [FormField],
  templateUrl: './account-form.html',
})
export class AccountForm implements OnInit {
  readonly initialOwner = input('');
  readonly created = output<Account>();
  protected readonly bank = inject(BankService);
  protected readonly failure = signal('');

  private readonly model = signal<{ customerId: string; type: AccountType; balance: number }>({
    customerId: '',
    type: 'CURRENT_ACCOUNT',
    balance: 1000,
  });

  protected readonly accountForm = form(this.model, (path) => {
    required(path.customerId, { message: 'Choose the customer who owns the account.' });
    required(path.balance, { message: 'Enter the opening balance.' });
    min(path.balance, 0, { message: 'The balance cannot be negative.' });
    max(path.balance, 999999999999, { message: 'This amount is too large.' });
    validate(path.balance, ({ value }) =>
      Number.isFinite(value()) && Math.abs(value() * 100 - Math.round(value() * 100)) > 1e-4
        ? { kind: 'cents', message: 'Use two decimals at most.' }
        : undefined,
    );
  });

  ngOnInit(): void {
    this.model.update((model) => ({ ...model, customerId: this.initialOwner() }));
  }

  protected save(event: Event): void {
    event.preventDefault();
    this.failure.set('');
    void submit(this.accountForm, async () => {
      const { customerId, type, balance } = this.model();
      try {
        this.created.emit(
          await firstValueFrom(this.bank.createAccount({ customerId: Number(customerId), type, balance })),
        );
      } catch (error) {
        this.failure.set(errorMessageOf(error as HttpErrorResponse));
      }
    });
  }
}

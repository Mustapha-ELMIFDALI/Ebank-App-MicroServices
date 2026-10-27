import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormField, form, required, submit, validate } from '@angular/forms/signals';
import { parseAmount } from './amount';
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

  private readonly model = signal<{ customerId: string; type: AccountType; balance: string }>({
    customerId: '',
    type: 'CURRENT_ACCOUNT',
    balance: '1000',
  });

  protected readonly accountForm = form(this.model, (path) => {
    required(path.customerId, { message: 'Choose the customer who owns the account.' });
    required(path.balance, { message: 'Enter the opening balance.' });
    validate(path.balance, ({ value }) => {
      if (!value() || parseAmount(value()) !== null) return undefined;
      return value().trim().startsWith('-')
        ? { kind: 'negative', message: 'The balance cannot be negative.' }
        : { kind: 'amount', message: 'Enter an amount like 1234.56.' };
    });
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
          await firstValueFrom(
            this.bank.createAccount({ customerId: Number(customerId), type, balance: parseAmount(balance)! }),
          ),
        );
      } catch (error) {
        this.failure.set(errorMessageOf(error as HttpErrorResponse));
      }
    });
  }
}

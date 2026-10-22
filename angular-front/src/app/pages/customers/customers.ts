import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormField, email, form, required, submit, validate } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { totalsOf } from '../../model/account.model';
import { RequestStatus, errorMessageOf } from '../../model/request-state.model';
import { BankService } from '../../services/bank.service';
import { Notice } from '../../shared/notice/notice';
import { Seal } from '../../shared/seal/seal';
import { SplitBar } from '../../shared/split-bar/split-bar';

@Component({
  selector: 'app-customers',
  imports: [DecimalPipe, RouterLink, FormField, Notice, Seal, SplitBar],
  templateUrl: './customers.html',
})
export class Customers {
  protected readonly bank = inject(BankService);
  protected readonly Status = RequestStatus;

  protected readonly people = computed(() =>
    this.bank.customers().items.map((customer) => {
      const accounts = this.bank.accounts().items.filter((account) => account.customerId === customer.id);
      return { ...customer, count: accounts.length, totals: totalsOf(accounts) };
    }),
  );
  protected readonly largest = computed(() => Math.max(0, ...this.people().map((person) => person.totals.total)));

  private readonly model = signal({ name: '', email: '' });
  protected readonly customerForm = form(this.model, (path) => {
    required(path.name, { message: 'Enter the customer’s name.' });
    validate(path.name, ({ value }) =>
      value() && !value().trim() ? { kind: 'blank', message: 'Enter the customer’s name.' } : undefined,
    );
    required(path.email, { message: 'Enter an email address.' });
    email(path.email, { message: 'Use an address like name@example.com.' });
  });
  protected readonly failure = signal('');
  protected readonly added = signal('');

  protected save(event: Event): void {
    event.preventDefault();
    this.failure.set('');
    this.added.set('');
    void submit(this.customerForm, async () => {
      const { name, email: address } = this.model();
      try {
        const customer = await firstValueFrom(this.bank.createCustomer({ name: name.trim(), email: address }));
        this.added.set(customer.name);
        this.customerForm().reset({ name: '', email: '' });
      } catch (error) {
        this.failure.set(errorMessageOf(error as HttpErrorResponse));
      }
    });
  }
}

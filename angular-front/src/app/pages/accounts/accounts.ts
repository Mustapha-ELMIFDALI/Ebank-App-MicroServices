import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, computed, inject, input, linkedSignal, signal, viewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { Account, AccountType, typeLabel } from '../../model/account.model';
import { RequestStatus, errorMessageOf } from '../../model/request-state.model';
import { BankService } from '../../services/bank.service';
import { Notice } from '../../shared/notice/notice';
import { AccountForm } from './account-form';

type SortKey = 'createdAt' | 'balance' | 'customerId';

@Component({
  selector: 'app-accounts',
  imports: [DatePipe, DecimalPipe, Notice, AccountForm],
  templateUrl: './accounts.html',
})
export class Accounts {
  // bound from ?q=, ?type= and ?customer=
  readonly q = input<string>();
  readonly type = input<string>();
  readonly customer = input<string>();

  protected readonly bank = inject(BankService);
  protected readonly Status = RequestStatus;
  protected readonly label = typeLabel;

  private readonly createDialog = viewChild.required<ElementRef<HTMLDialogElement>>('createDialog');
  private readonly detailDialog = viewChild.required<ElementRef<HTMLDialogElement>>('detailDialog');
  private detailRequest?: Subscription;

  protected readonly words = linkedSignal(() => this.q() ?? '');
  protected readonly kind = linkedSignal(() => (this.type() ?? '') as AccountType | '');
  protected readonly owner = linkedSignal(() => this.customer() ?? '');
  protected readonly sort = signal<{ key: SortKey; ascending: boolean }>({ key: 'createdAt', ascending: false });

  protected readonly creating = signal(false);
  protected readonly createdId = signal('');
  protected readonly copied = signal(false);
  protected readonly detail = signal<{ account?: Account; error?: string }>({});

  protected readonly rows = computed(() => {
    const words = this.words().trim().toLowerCase();
    const { key, ascending } = this.sort();
    return this.bank
      .accounts()
      .items.filter(
        (account) =>
          (!this.kind() || account.type === this.kind()) &&
          (!this.owner() || String(account.customerId) === this.owner()) &&
          (!words || `${account.id} ${this.bank.ownerOf(account.customerId)}`.toLowerCase().includes(words)),
      )
      .sort((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0) * (ascending ? 1 : -1));
  });

  protected sortBy(key: SortKey): void {
    this.sort.update((sort) => ({ key, ascending: sort.key === key ? !sort.ascending : key === 'customerId' }));
  }

  protected direction(key: SortKey): 'ascending' | 'descending' | null {
    return this.sort().key !== key ? null : this.sort().ascending ? 'ascending' : 'descending';
  }

  protected open(): void {
    this.creating.set(true);
    this.createDialog().nativeElement.showModal();
  }

  protected created(account: Account): void {
    this.words.set('');
    this.kind.set('');
    this.owner.set('');
    this.sort.set({ key: 'createdAt', ascending: false });
    this.createdId.set(account.id);
    this.createDialog().nativeElement.close();
  }

  // The single-account endpoint is the one that calls customer-service through OpenFeign
  protected show(id: string): void {
    this.detailRequest?.unsubscribe();
    this.detail.set({});
    this.copied.set(false);
    this.detailDialog().nativeElement.showModal();
    this.detailRequest = this.bank.account(id).subscribe({
      next: (account) => this.detail.set({ account }),
      error: (error: HttpErrorResponse) => this.detail.set({ error: errorMessageOf(error) }),
    });
  }

  protected async copy(id: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(id);
      this.copied.set(true);
    } catch {
      this.copied.set(false);
    }
  }
}

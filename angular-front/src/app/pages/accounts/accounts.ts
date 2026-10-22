import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, computed, inject, input, linkedSignal, signal, viewChild } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap } from 'rxjs';
import { Account, AccountType, typeLabel } from '../../model/account.model';
import { RequestStatus, errorMessageOf } from '../../model/request-state.model';
import { BankService } from '../../services/bank.service';
import { Note } from '../../shared/note/note';
import { Notice } from '../../shared/notice/notice';
import { AccountForm } from './account-form';

type SortKey = 'owner' | 'createdAt' | 'balance';

@Component({
  selector: 'app-accounts',
  imports: [DatePipe, DecimalPipe, Note, Notice, AccountForm],
  templateUrl: './accounts.html',
})
export class Accounts {
  // bound from ?id= and ?customer=
  readonly id = input<string>();
  readonly customer = input<string>();

  protected readonly bank = inject(BankService);
  protected readonly Status = RequestStatus;
  protected readonly label = typeLabel;
  protected readonly filters: { value: AccountType | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'CURRENT_ACCOUNT', label: 'Current' },
    { value: 'SAVING_ACCOUNT', label: 'Savings' },
  ];

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  protected readonly creating = signal(false);
  protected readonly copied = signal(false);
  protected readonly search = signal('');
  protected readonly type = signal<AccountType | 'ALL'>('ALL');
  protected readonly owner = linkedSignal(() => this.customer() ?? '');
  protected readonly sort = signal<{ key: SortKey; ascending: boolean }>({ key: 'createdAt', ascending: false });

  protected readonly rows = computed(() => {
    const words = this.search().trim().toLowerCase();
    const { key, ascending } = this.sort();
    const valueOf = (account: Account) =>
      key === 'owner' ? this.bank.ownerOf(account.customerId).toLowerCase() : account[key];
    return this.bank
      .accounts()
      .items.filter(
        (account) =>
          (this.type() === 'ALL' || account.type === this.type()) &&
          (!this.owner() || String(account.customerId) === this.owner()) &&
          (!words || `${account.id} ${this.bank.ownerOf(account.customerId)}`.toLowerCase().includes(words)),
      )
      .sort((a, b) => {
        const [x, y] = [valueOf(a), valueOf(b)];
        return (x < y ? -1 : x > y ? 1 : 0) * (ascending ? 1 : -1);
      });
  });

  protected readonly picked = linkedSignal(() => this.id());
  protected readonly selectedId = computed(() => {
    const rows = this.rows();
    return rows.find((account) => account.id === this.picked())?.id ?? rows[0]?.id;
  });

  // The single-account endpoint is the one that calls customer-service through OpenFeign
  protected readonly detail = toSignal(
    toObservable(this.selectedId).pipe(
      switchMap((id) =>
        id
          ? this.bank.account(id).pipe(
              map((account) => ({ account, error: '' })),
              catchError((error: HttpErrorResponse) => of({ account: undefined, error: errorMessageOf(error) })),
            )
          : of(undefined),
      ),
    ),
  );

  protected sortBy(key: SortKey): void {
    this.sort.update((sort) => ({ key, ascending: sort.key === key ? !sort.ascending : key === 'owner' }));
  }

  protected direction(key: SortKey): 'ascending' | 'descending' | null {
    return this.sort().key !== key ? null : this.sort().ascending ? 'ascending' : 'descending';
  }

  protected open(): void {
    this.creating.set(true);
    this.dialog().nativeElement.showModal();
  }

  protected created(account: Account): void {
    this.search.set('');
    this.type.set('ALL');
    this.owner.set('');
    this.picked.set(account.id);
    this.dialog().nativeElement.close();
  }

  protected async copy(id: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(id);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1600);
    } catch {
      this.copied.set(false);
    }
  }
}

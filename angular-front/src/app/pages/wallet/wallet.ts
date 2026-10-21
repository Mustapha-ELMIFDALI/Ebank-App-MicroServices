import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Account, totalsOf, typeLabel } from '../../model/account.model';
import { RequestStatus } from '../../model/request-state.model';
import { BankService } from '../../services/bank.service';
import { Note } from '../../shared/note/note';
import { Notice } from '../../shared/notice/notice';
import { SplitBar } from '../../shared/split-bar/split-bar';

const FAN_SIZE = 5;

@Component({
  selector: 'app-wallet',
  imports: [DecimalPipe, RouterLink, Note, Notice, SplitBar],
  templateUrl: './wallet.html',
})
export class Wallet {
  protected readonly bank = inject(BankService);
  private readonly router = inject(Router);
  protected readonly Status = RequestStatus;
  protected readonly label = typeLabel;

  protected readonly totals = computed(() => totalsOf(this.bank.accounts().items));
  protected readonly richest = computed(() => [...this.bank.accounts().items].sort((a, b) => b.balance - a.balance));
  protected readonly front = linkedSignal<Account[], number>({ source: this.richest, computation: () => 0 });
  protected readonly selected = computed<Account | undefined>(() => this.richest()[this.front()]);

  // A window of five notes around the one in front, wrapping at both ends
  protected readonly fan = computed(() => {
    const list = this.richest();
    const size = Math.min(FAN_SIZE, list.length);
    const before = Math.floor((size - 1) / 2);
    return Array.from({ length: size }, (_, i) => {
      const index = (this.front() + i - before + list.length) % list.length;
      return { index, offset: i - before, account: list[index] };
    }).sort((a, b) => a.index - b.index);
  });

  protected readonly holdings = computed(() => {
    const accounts = this.bank.accounts().items;
    return [...new Set(accounts.map((account) => account.customerId))]
      .map((id) => ({ id, totals: totalsOf(accounts.filter((account) => account.customerId === id)) }))
      .sort((a, b) => b.totals.total - a.totals.total)
      .slice(0, 6);
  });
  protected readonly largest = computed(() => this.holdings()[0]?.totals.total ?? 0);

  protected readonly latest = computed(() =>
    [...this.bank.accounts().items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4),
  );

  protected readonly question = signal('');
  protected readonly suggestions = ['List all customers', 'Which accounts does Imane have?', 'Who holds the most money?'];

  protected move(step: number): void {
    const length = this.richest().length;
    if (length) this.front.update((index) => (index + step + length) % length);
  }

  protected ask(question: string, event?: Event): void {
    event?.preventDefault();
    if (question.trim()) this.router.navigate(['/assistant'], { state: { question } });
  }
}

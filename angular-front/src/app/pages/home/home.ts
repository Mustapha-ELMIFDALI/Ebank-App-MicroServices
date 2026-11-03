import { DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { totalsOf } from '../../model/account.model';
import { RequestStatus } from '../../model/request-state.model';
import { BankService } from '../../services/bank.service';
import { Notice } from '../../shared/notice/notice';

@Component({
  selector: 'app-home',
  imports: [DecimalPipe, RouterLink, Notice],
  templateUrl: './home.html',
})
export class Home {
  protected readonly bank = inject(BankService);
  protected readonly Status = RequestStatus;
  protected readonly totals = computed(() => totalsOf(this.bank.accounts().items));
  protected readonly loaded = computed(() => this.bank.accounts().status === RequestStatus.SUCCESS);
}

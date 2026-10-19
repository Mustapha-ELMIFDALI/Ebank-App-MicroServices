import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, WritableSignal, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { GATEWAY_URL } from '../api.config';
import { Account, NewAccount } from '../model/account.model';
import { Customer, NewCustomer } from '../model/customer.model';
import { ListState, RequestStatus, errorMessageOf } from '../model/request-state.model';

@Injectable({ providedIn: 'root' })
export class BankService {
  private readonly http = inject(HttpClient);
  private readonly gateway = inject(GATEWAY_URL);
  private readonly accountsUrl = `${this.gateway}/EBANK-SERVICE/accounts`;
  private readonly customersUrl = `${this.gateway}/CUSTOMER-SERVICE/customers`;

  readonly accounts = signal<ListState<Account>>({ status: RequestStatus.LOADING, items: [] });
  readonly customers = signal<ListState<Customer>>({ status: RequestStatus.LOADING, items: [] });
  private readonly names = computed(
    () => new Map(this.customers().items.map((customer) => [customer.id, customer.name])),
  );

  refresh(): void {
    this.load(this.accountsUrl, this.accounts);
    this.load(this.customersUrl, this.customers);
  }

  ownerOf(customerId: number): string {
    return this.names().get(customerId) ?? `Customer ${customerId}`;
  }

  account(id: string): Observable<Account> {
    return this.http.get<Account>(`${this.accountsUrl}/${encodeURIComponent(id)}`);
  }

  createAccount(account: NewAccount): Observable<Account> {
    return this.http.post<Account>(this.accountsUrl, account).pipe(tap(() => this.refresh()));
  }

  createCustomer(customer: NewCustomer): Observable<Customer> {
    return this.http.post<Customer>(this.customersUrl, customer).pipe(tap(() => this.refresh()));
  }

  // The two lists fail independently: accounts stay readable while customer-service is down
  private load<T>(url: string, state: WritableSignal<ListState<T>>): void {
    this.http
      .get<T[]>(url)
      .pipe(
        map((items): ListState<T> => ({ status: RequestStatus.SUCCESS, items })),
        catchError((error: HttpErrorResponse) =>
          of<ListState<T>>({ status: RequestStatus.ERROR, items: [], errorMessage: errorMessageOf(error) }),
        ),
      )
      .subscribe((next) => state.set(next));
  }
}

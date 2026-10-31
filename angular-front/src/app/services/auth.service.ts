import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { GATEWAY_URL } from '../api.config';
import { Session } from '../model/session.model';

const STORAGE_KEY = 'ebank-session';

function storedSession(): Session | null {
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Session | null;
    return session?.token && session.user && Date.parse(session.expiresAt) > Date.now() ? session : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(GATEWAY_URL)}/AUTH-SERVICE/auth`;
  private readonly session = signal<Session | null>(storedSession());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly signedIn = computed(() => this.session() !== null);
  readonly expired = signal(false);

  constructor() {
    // signing out in one tab signs out the others
    addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY || event.key === null) this.session.set(storedSession());
    });
  }

  token(): string | undefined {
    return this.session()?.token;
  }

  // false once the token has expired, even if nothing has called the gateway since
  isValid(): boolean {
    const session = this.session();
    return session !== null && Date.parse(session.expiresAt) > Date.now();
  }

  login(email: string, password: string): Observable<Session> {
    return this.http.post<Session>(`${this.url}/login`, { email, password }).pipe(tap((s) => this.keep(s)));
  }

  signUp(name: string, email: string, password: string): Observable<Session> {
    return this.http.post<Session>(`${this.url}/signup`, { name, email, password }).pipe(tap((s) => this.keep(s)));
  }

  signOut(expired = false): void {
    this.session.set(null);
    this.expired.set(expired);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage can be blocked
    }
  }

  private keep(session: Session): void {
    this.session.set(session);
    this.expired.set(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // the session then lasts until the page is closed
    }
  }
}

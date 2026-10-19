import { HttpClient, HttpDownloadProgressEvent, HttpEventType } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { GATEWAY_URL } from '../api.config';
import { BankService } from './bank.service';

export interface ChatMessage {
  id: number;
  from: 'user' | 'agent';
  text: string;
  state?: 'streaming' | 'stopped' | 'failed';
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly bank = inject(BankService);
  private readonly url = `${inject(GATEWAY_URL)}/EBANK-BOT/chatStream`;
  private conversationId: string = crypto.randomUUID();
  private nextId = 0;
  private request?: Subscription;

  readonly messages = signal<ChatMessage[]>([]);
  readonly busy = signal(false);

  ask(question: string): void {
    const query = question.trim();
    if (!query || this.busy()) return;

    const id = this.nextId + 1;
    this.nextId += 2;
    this.messages.update((list) => [
      ...list,
      { id: id - 1, from: 'user', text: query },
      { id, from: 'agent', text: '', state: 'streaming' },
    ]);
    this.busy.set(true);

    this.request = this.http
      .get(this.url, {
        params: { query, conversationId: this.conversationId },
        responseType: 'text',
        observe: 'events',
        reportProgress: true,
      })
      .subscribe({
        next: (event) => {
          switch (event.type) {
            case HttpEventType.DownloadProgress:
              this.patch(id, { text: (event as HttpDownloadProgressEvent).partialText ?? '' });
              break;
            case HttpEventType.Response:
              this.patch(id, { text: event.body ?? '' });
              break;
          }
        },
        error: () => {
          this.patch(id, { state: 'failed' });
          this.busy.set(false);
        },
        complete: () => {
          this.patch(id, { state: undefined });
          this.busy.set(false);
          // the agent may have created a customer or an account
          this.bank.refresh();
        },
      });
  }

  stop(): void {
    if (!this.busy()) return;
    this.request?.unsubscribe();
    this.busy.set(false);
    this.messages.update((list) =>
      list.map((message) => (message.state === 'streaming' ? { ...message, state: 'stopped' } : message)),
    );
    this.bank.refresh();
  }

  restart(): void {
    this.request?.unsubscribe();
    this.busy.set(false);
    this.messages.set([]);
    this.conversationId = crypto.randomUUID();
  }

  private patch(id: number, change: Partial<ChatMessage>): void {
    this.messages.update((list) => list.map((message) => (message.id === id ? { ...message, ...change } : message)));
  }
}

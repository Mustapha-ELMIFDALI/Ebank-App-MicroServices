import { Component, ElementRef, OnInit, afterRenderEffect, inject, signal, viewChild } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';
import { ChatService } from '../../services/chat.service';
import { Seal } from '../../shared/seal/seal';

@Component({
  selector: 'app-assistant',
  imports: [MarkdownComponent, Seal],
  templateUrl: './assistant.html',
})
export class Assistant implements OnInit {
  protected readonly chat = inject(ChatService);
  private readonly log = viewChild<ElementRef<HTMLElement>>('log');
  private followsAnswer = true;

  protected readonly draft = signal('');
  protected readonly starters = [
    { icon: 'ph-users-three', text: 'List all customers' },
    { icon: 'ph-cards-three', text: 'Show the accounts of Imane in a table' },
    { icon: 'ph-scales', text: 'Compare the total deposits of each customer' },
    { icon: 'ph-plus-circle', text: 'Open a savings account of 4000 MAD for customer 2' },
  ];

  constructor() {
    afterRenderEffect(() => {
      const hasMessages = this.chat.messages().length > 0;
      const log = this.log()?.nativeElement;
      if (log && hasMessages && this.followsAnswer) log.scrollTop = log.scrollHeight;
    });
  }

  ngOnInit(): void {
    // Question typed on the wallet. Kept out of the URL and consumed once, so a reload never replays a creation
    const state = history.state as { question?: string } | null;
    if (state?.question) {
      history.replaceState({ ...state, question: undefined }, '');
      this.chat.ask(state.question);
    }
  }

  protected onScroll(log: HTMLElement): void {
    this.followsAnswer = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
  }

  protected send(event: Event): void {
    event.preventDefault();
    if (this.chat.busy() || !this.draft().trim()) return;
    this.followsAnswer = true;
    this.chat.ask(this.draft());
    this.draft.set('');
  }

  protected onEnter(event: Event): void {
    const key = event as KeyboardEvent;
    if (!key.shiftKey && !key.isComposing) this.send(event);
  }
}

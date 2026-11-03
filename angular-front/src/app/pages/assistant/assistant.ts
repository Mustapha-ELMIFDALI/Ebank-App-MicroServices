import { Component, ElementRef, afterRenderEffect, inject, signal, viewChild } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-assistant',
  imports: [MarkdownComponent],
  templateUrl: './assistant.html',
})
export class Assistant {
  protected readonly chat = inject(ChatService);
  private readonly log = viewChild<ElementRef<HTMLElement>>('log');
  private followsAnswer = true;

  protected readonly draft = signal('');
  protected readonly starters = [
    'List all customers',
    'Show the accounts of Imane in a table',
    'Compare the total deposits of each customer',
  ];

  constructor() {
    afterRenderEffect(() => {
      const hasMessages = this.chat.messages().length > 0;
      const log = this.log()?.nativeElement;
      if (log && hasMessages && this.followsAnswer) log.scrollTop = log.scrollHeight;
    });
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
}

import { DecimalPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Account, typeLabel } from '../../model/account.model';
import { Seal } from '../seal/seal';

@Component({
  selector: 'app-note',
  imports: [DecimalPipe, DatePipe, Seal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './note.html',
  host: { class: 'note', '[class.note-saving]': "account().type === 'SAVING_ACCOUNT'" },
})
export class Note {
  readonly account = input.required<Account>();
  readonly owner = input('');
  protected readonly label = computed(() => typeLabel(this.account().type));
  protected readonly serial = computed(() => this.account().id.slice(0, 8).toUpperCase());
}

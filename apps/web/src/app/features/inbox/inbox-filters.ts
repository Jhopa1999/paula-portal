import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { ConversationMode, ConversationStatus } from '@paula/contracts';

export interface InboxFilters {
  search?: string;
  status?: ConversationStatus;
  mode?: ConversationMode;
}

/**
 * Filtros de la bandeja: busqueda con debounce + estado + modo.
 * Emite los filtros combinados al padre.
 */
@Component({
  selector: 'app-inbox-filters',
  imports: [FormsModule],
  templateUrl: './inbox-filters.html',
  styleUrl: './inbox-filters.scss',
})
export class InboxFiltersComponent {
  readonly filtersChange = output<InboxFilters>();

  protected search = '';
  protected status = signal<ConversationStatus | ''>('');
  protected mode = signal<ConversationMode | ''>('');

  private readonly search$ = new Subject<string>();

  constructor() {
    this.search$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.emit());
  }

  protected onSearchInput(value: string): void {
    this.search = value;
    this.search$.next(value);
  }

  protected onStatusChange(value: string): void {
    this.status.set(value as ConversationStatus | '');
    this.emit();
  }

  protected onModeChange(value: string): void {
    this.mode.set(value as ConversationMode | '');
    this.emit();
  }

  protected reset(): void {
    this.search = '';
    this.status.set('');
    this.mode.set('');
    this.emit();
  }

  private emit(): void {
    this.filtersChange.emit({
      search: this.search.trim() || undefined,
      status: this.status() || undefined,
      mode: this.mode() || undefined,
    });
  }
}

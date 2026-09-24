import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type {
  ConversationSummary,
  InboxView,
  ListConversationsQuery,
} from '@paula/contracts';
import { ConversationsApi } from '../../core/api/conversations.api';
import { NormalizedError } from '../../core/http/api.types';
import { SessionDetail } from '../session-detail/session-detail';
import { InboxFiltersComponent, InboxFilters } from './inbox-filters';
import { flowLabel, modeLabel, statusLabel } from '../../shared/labels';

/**
 * Pagina de bandeja con layout de 3 columnas:
 * [ lista + filtros ] [ conversacion ] [ detalle ]
 * Feature 02 (inbox) + integra feature 05 (detalle) en la 3a columna.
 */
@Component({
  selector: 'app-inbox-page',
  imports: [InboxFiltersComponent, SessionDetail],
  templateUrl: './inbox-page.html',
  styleUrl: './inbox-page.scss',
})
export class InboxPage {
  private readonly api = inject(ConversationsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly items = signal<ConversationSummary[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedId = signal<string | null>(null);
  protected readonly view = signal<InboxView>('all');
  protected readonly nextCursor = signal<string | undefined>(undefined);
  protected readonly loadingMore = signal(false);

  private filters: InboxFilters = {};

  protected readonly flowLabel = flowLabel;
  protected readonly statusLabel = statusLabel;
  protected readonly modeLabel = modeLabel;

  /** Lista filtrada en cliente por el texto de busqueda. */
  protected readonly visibleItems = computed(() => {
    const term = this.filters.search?.toLowerCase();
    const list = this.items();
    if (!term) return list;
    return list.filter(
      (c) =>
        c.phone.toLowerCase().includes(term) ||
        (c.contactName?.toLowerCase().includes(term) ?? false) ||
        (c.thirdPartyId?.toLowerCase().includes(term) ?? false) ||
        c.sessionId.toLowerCase().includes(term),
    );
  });

  constructor() {
    this.route.data.subscribe((data) => {
      const view = (data['view'] as InboxView) ?? 'all';
      this.view.set(view);
      this.selectedId.set(null);
      this.load(view, true);
    });

    // Restaura seleccion desde el query param si existe.
    this.route.queryParamMap.subscribe((q) => {
      const sid = q.get('sessionId');
      if (sid) this.selectedId.set(sid);
    });
  }

  protected onFiltersChange(filters: InboxFilters): void {
    this.filters = filters;
    // status/mode van al backend; search se filtra en cliente.
    this.load(this.view(), true);
  }

  protected select(sessionId: string): void {
    this.selectedId.set(sessionId);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sessionId },
      queryParamsHandling: 'merge',
    });
  }

  protected loadMore(): void {
    if (!this.nextCursor() || this.loadingMore()) return;
    this.loadingMore.set(true);
    this.api.list(this.view(), this.buildQuery(this.nextCursor())).subscribe({
      next: (page) => {
        this.items.update((prev) => [...prev, ...page.items]);
        this.nextCursor.set(page.nextCursor);
        this.loadingMore.set(false);
      },
      error: (err: NormalizedError) => {
        this.error.set(err.message);
        this.loadingMore.set(false);
      },
    });
  }

  private load(view: InboxView, reset: boolean): void {
    this.loading.set(true);
    this.error.set(null);
    if (reset) {
      this.items.set([]);
      this.nextCursor.set(undefined);
    }
    this.api.list(view, this.buildQuery()).subscribe({
      next: (page) => {
        this.items.set(page.items);
        this.nextCursor.set(page.nextCursor);
        this.loading.set(false);
      },
      error: (err: NormalizedError) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }

  private buildQuery(cursor?: string): ListConversationsQuery {
    const q: ListConversationsQuery = {};
    if (this.view() === 'unassigned') q.assignmentState = 'UNASSIGNED';
    if (this.view() === 'closed') q.status = 'CLOSED';
    if (this.filters.status) q.status = this.filters.status;
    if (this.filters.mode) q.mode = this.filters.mode;
    if (cursor) q.cursor = cursor;
    return q;
  }
}

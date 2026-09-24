import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import type {
  ConversationSummary,
  InboxView,
  ListConversationsQuery,
} from '@paula/contracts';
import { ConversationsApi } from '../../core/api/conversations.api';
import { NormalizedError } from '../../core/http/api.types';

/**
 * Pagina de bandeja con layout de 3 columnas:
 * [ lista de conversaciones ] [ conversacion ] [ detalle ]
 * En Fase 0 la lista consume datos reales del mock via API;
 * chat y detalle son placeholders que se implementan en features 03 y 05.
 */
@Component({
  selector: 'app-inbox-page',
  imports: [],
  templateUrl: './inbox-page.html',
  styleUrl: './inbox-page.scss',
})
export class InboxPage {
  private readonly api = inject(ConversationsApi);
  private readonly route = inject(ActivatedRoute);

  protected readonly conversations = signal<ConversationSummary[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedId = signal<string | null>(null);
  protected readonly view = signal<InboxView>('all');

  constructor() {
    this.route.data.subscribe((data) => {
      const view = (data['view'] as InboxView) ?? 'all';
      this.view.set(view);
      this.load(view);
    });
  }

  protected select(sessionId: string): void {
    this.selectedId.set(sessionId);
  }

  private load(view: InboxView): void {
    this.loading.set(true);
    this.error.set(null);

    const query = this.buildQuery(view);
    this.api.list(query).subscribe({
      next: (items) => {
        this.conversations.set(items);
        this.loading.set(false);
      },
      error: (err: NormalizedError) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }

  private buildQuery(view: InboxView): ListConversationsQuery {
    switch (view) {
      case 'unassigned':
        return { assignmentState: 'UNASSIGNED' };
      case 'closed':
        return { status: 'CLOSED' };
      case 'mine':
        // En 01-auth se filtrara por el usuario autenticado.
        return {};
      case 'all':
      default:
        return {};
    }
  }
}

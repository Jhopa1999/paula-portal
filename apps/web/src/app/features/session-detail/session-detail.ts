import { Component, effect, inject, input, signal } from '@angular/core';
import type { ConversationDetail } from '@paula/contracts';
import { ConversationsApi } from '../../core/api/conversations.api';
import { NormalizedError } from '../../core/http/api.types';
import { flowLabel, formatLocal, modeLabel, statusLabel } from '../../shared/labels';

/**
 * Panel derecho: detalle de contacto y sesion (feature 05).
 * La seccion tecnica solo se muestra si capabilities.canViewTechnical.
 */
@Component({
  selector: 'app-session-detail',
  imports: [],
  templateUrl: './session-detail.html',
  styleUrl: './session-detail.scss',
})
export class SessionDetail {
  private readonly api = inject(ConversationsApi);

  /** sessionId seleccionado; si es null, el panel esta vacio. */
  readonly sessionId = input<string | null>(null);

  protected readonly detail = signal<ConversationDetail | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly copied = signal<string | null>(null);

  protected readonly flowLabel = flowLabel;
  protected readonly statusLabel = statusLabel;
  protected readonly modeLabel = modeLabel;
  protected readonly formatLocal = formatLocal;

  constructor() {
    effect(() => {
      const id = this.sessionId();
      if (id) {
        this.load(id);
      } else {
        this.detail.set(null);
      }
    });
  }

  protected copy(value?: string): void {
    if (!value) return;
    void navigator.clipboard?.writeText(value);
    this.copied.set(value);
    setTimeout(() => this.copied.set(null), 1500);
  }

  private load(sessionId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.get(sessionId).subscribe({
      next: (d) => {
        this.detail.set(d);
        this.loading.set(false);
      },
      error: (err: NormalizedError) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }
}

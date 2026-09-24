import { Component, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { AuditEvent, ConversationDetail } from '@paula/contracts';
import { ConversationsApi } from '../../core/api/conversations.api';
import { NormalizedError } from '../../core/http/api.types';
import { RealtimeService } from '../../core/realtime/realtime.service';
import {
  auditActionLabel,
  flowLabel,
  formatLocal,
  modeLabel,
  statusLabel,
} from '../../shared/labels';

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
  private readonly realtime = inject(RealtimeService);

  /** sessionId seleccionado; si es null, el panel esta vacio. */
  readonly sessionId = input<string | null>(null);

  protected readonly detail = signal<ConversationDetail | null>(null);
  protected readonly audit = signal<AuditEvent[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly copied = signal<string | null>(null);

  protected readonly flowLabel = flowLabel;
  protected readonly statusLabel = statusLabel;
  protected readonly modeLabel = modeLabel;
  protected readonly formatLocal = formatLocal;
  protected readonly auditActionLabel = auditActionLabel;

  constructor() {
    effect(() => {
      const id = this.sessionId();
      if (id) {
        this.load(id);
      } else {
        this.detail.set(null);
        this.audit.set([]);
      }
    });

    // Refresca detalle + auditoria cuando llega un evento de esta sesion.
    this.realtime.stream.pipe(takeUntilDestroyed()).subscribe((event) => {
      const id = this.sessionId();
      if (id && event.sessionId === id) {
        this.load(id);
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
    this.audit.set([]);
    this.api.get(sessionId).subscribe({
      next: (d) => {
        this.detail.set(d);
        this.loading.set(false);
        // El timeline solo se pide si el rol lo permite (evita un 403 esperado).
        if (d.capabilities.canViewTechnical) {
          this.loadAudit(sessionId);
        }
      },
      error: (err: NormalizedError) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }

  private loadAudit(sessionId: string): void {
    this.api.getAudit(sessionId).subscribe({
      next: (events) => this.audit.set(events),
      error: () => this.audit.set([]),
    });
  }
}

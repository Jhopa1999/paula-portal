import {
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type {
  ConversationDetail,
  ConversationMessage,
  RealtimeEvent,
} from '@paula/contracts';
import { ConversationsApi } from '../../core/api/conversations.api';
import { NormalizedError } from '../../core/http/api.types';
import { RealtimeService } from '../../core/realtime/realtime.service';
import { formatLocal, modeLabel, statusLabel } from '../../shared/labels';

/** Mensaje en la UI: puede llevar estado local para optimistic UI. */
interface UiMessage extends ConversationMessage {
  pending?: boolean;
  failed?: boolean;
}

function uuid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

/**
 * Columna central: histgrico de mensajes + composer + panel de acciones.
 * Cubre features 03 (chat) y 04 (assignment/handoff).
 */
@Component({
  selector: 'app-conversation-view',
  imports: [FormsModule],
  templateUrl: './conversation-view.html',
  styleUrl: './conversation-view.scss',
})
export class ConversationView {
  private readonly api = inject(ConversationsApi);
  private readonly realtime = inject(RealtimeService);

  readonly sessionId = input<string | null>(null);
  /** Notifica al padre que el detalle cambio (para refrescar la bandeja). */
  readonly changed = output<ConversationDetail>();

  protected readonly detail = signal<ConversationDetail | null>(null);
  protected readonly messages = signal<UiMessage[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected draft = '';

  protected readonly statusLabel = statusLabel;
  protected readonly modeLabel = modeLabel;
  protected readonly formatLocal = formatLocal;

  constructor() {
    effect(() => {
      const id = this.sessionId();
      if (id) {
        this.loadAll(id);
      } else {
        this.detail.set(null);
        this.messages.set([]);
      }
    });

    this.realtime.stream
      .pipe(takeUntilDestroyed())
      .subscribe((event) => this.applyRealtime(event));
  }

  private applyRealtime(event: RealtimeEvent): void {
    const current = this.sessionId();
    if (!current || event.sessionId !== current) return;

    if (event.type === 'message.created') {
      const msg = event.data as ConversationMessage;
      this.messages.update((list) => {
        // Dedup por messageId (eco ya presente) o por clientMessageId
        // (eco del propio mensaje optimista que ya reconciliamos).
        const exists = list.some(
          (m) =>
            m.messageId === msg.messageId ||
            (!!msg.clientMessageId && m.messageId === msg.clientMessageId) ||
            (!!msg.clientMessageId &&
              !!m.clientMessageId &&
              m.clientMessageId === msg.clientMessageId),
        );
        if (exists) return list;
        return [...list, msg];
      });
      return;
    }

    // Cambios de estado/modo/asignacion: refresca el detalle desde REST.
    if (
      event.type === 'session.mode_changed' ||
      event.type === 'conversation.assigned' ||
      event.type === 'conversation.closed' ||
      event.type === 'session.status_changed' ||
      event.type === 'conversation.updated'
    ) {
      this.api.get(current).subscribe({
        next: (d) => this.detail.set(d),
      });
    }
  }

  // ---- Carga ----
  private loadAll(sessionId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.actionError.set(null);
    this.detail.set(null);
    this.messages.set([]);

    this.api.get(sessionId).subscribe({
      next: (d) => {
        this.detail.set(d);
        this.loadMessages(sessionId);
      },
      error: (err: NormalizedError) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }

  private loadMessages(sessionId: string): void {
    this.api.getMessages(sessionId).subscribe({
      next: (msgs) => {
        this.messages.set(msgs);
        this.loading.set(false);
      },
      error: (err: NormalizedError) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }

  // ---- Envio de mensaje (optimistic) ----
  protected send(): void {
    const d = this.detail();
    const text = this.draft.trim();
    if (!d || !text || !d.capabilities.canSendMessage) return;

    const clientMessageId = uuid();
    const optimistic: UiMessage = {
      messageId: clientMessageId,
      clientMessageId,
      sessionId: d.sessionId,
      role: 'advisor',
      type: 'text',
      content: text,
      createdAt: new Date().toISOString(),
      deliveryStatus: 'PENDING',
      pending: true,
    };
    this.messages.update((m) => [...m, optimistic]);
    this.draft = '';

    this.api
      .sendMessage(d.sessionId, {
        clientMessageId,
        type: 'text',
        content: text,
        expectedVersion: d.version,
      })
      .subscribe({
        next: (saved) => {
          this.messages.update((m) =>
            m.map((msg) =>
              msg.messageId === clientMessageId
                ? { ...saved, pending: false, failed: false }
                : msg,
            ),
          );
          this.bumpVersion();
        },
        error: (err: NormalizedError) => {
          this.messages.update((m) =>
            m.map((msg) =>
              msg.messageId === clientMessageId
                ? { ...msg, pending: false, failed: true }
                : msg,
            ),
          );
          this.actionError.set(err.message);
        },
      });
  }

  protected retry(msg: UiMessage): void {
    const d = this.detail();
    if (!d) return;
    this.messages.update((m) =>
      m.map((x) =>
        x.messageId === msg.messageId
          ? { ...x, failed: false, pending: true }
          : x,
      ),
    );
    this.api
      .sendMessage(d.sessionId, {
        clientMessageId: msg.messageId,
        type: 'text',
        content: msg.content ?? '',
        expectedVersion: d.version,
      })
      .subscribe({
        next: (saved) => {
          this.messages.update((m) =>
            m.map((x) =>
              x.messageId === msg.messageId
                ? { ...saved, pending: false, failed: false }
                : x,
            ),
          );
          this.bumpVersion();
        },
        error: (err: NormalizedError) => {
          this.messages.update((m) =>
            m.map((x) =>
              x.messageId === msg.messageId
                ? { ...x, pending: false, failed: true }
                : x,
            ),
          );
          this.actionError.set(err.message);
        },
      });
  }

  // ---- Acciones (take / mode / close) ----
  protected take(): void {
    const d = this.detail();
    if (!d) return;
    this.runCommand(() =>
      this.api.take(d.sessionId, { commandId: uuid(), expectedVersion: d.version }),
    );
  }

  protected returnToAgent(): void {
    const d = this.detail();
    if (!d) return;
    const ok = confirm(
      'Paula volvera a responder automaticamente en esta conversacion. El historial actual se conservara. Continuar?',
    );
    if (!ok) return;
    this.runCommand(() =>
      this.api.changeMode(d.sessionId, {
        commandId: uuid(),
        mode: 'AGENT',
        expectedVersion: d.version,
        reason: 'ADVISOR_RETURN_TO_AGENT',
      }),
    );
  }

  protected close(): void {
    const d = this.detail();
    if (!d) return;
    const ok = confirm('Cerrar esta conversacion? Quedara en solo lectura.');
    if (!ok) return;
    this.runCommand(() =>
      this.api.close(d.sessionId, { commandId: uuid(), expectedVersion: d.version }),
    );
  }

  private runCommand(
    exec: () => import('rxjs').Observable<ConversationDetail>,
  ): void {
    this.busy.set(true);
    this.actionError.set(null);
    exec().subscribe({
      next: (d) => {
        this.detail.set(d);
        this.busy.set(false);
        this.changed.emit(d);
      },
      error: (err: NormalizedError) => {
        this.busy.set(false);
        if (err.code === 'INVALID_COMMAND_VERSION' || err.code === 'CONVERSATION_ALREADY_ASSIGNED') {
          this.actionError.set(
            `${err.message} Actualizando la conversacion...`,
          );
          const id = this.sessionId();
          if (id) this.loadAll(id);
        } else {
          this.actionError.set(err.message);
        }
      },
    });
  }

  private bumpVersion(): void {
    // Tras enviar, la version del backend avanzo; recargamos el detalle
    // para mantener expectedVersion sincronizado.
    const id = this.sessionId();
    if (id) {
      this.api.get(id).subscribe({
        next: (d) => {
          this.detail.set(d);
          this.changed.emit(d);
        },
      });
    }
  }
}

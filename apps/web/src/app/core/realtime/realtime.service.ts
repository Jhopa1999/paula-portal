import { inject, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import type { RealtimeEvent, RealtimeEventType } from '@paula/contracts';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

export type RealtimeStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting';

const EVENT_TYPES: RealtimeEventType[] = [
  'conversation.created',
  'conversation.updated',
  'conversation.assigned',
  'conversation.closed',
  'message.created',
  'message.updated',
  'session.mode_changed',
  'session.status_changed',
];

/**
 * Cliente WebSocket. Conecta con el token actual, reconecta con backoff,
 * deduplica por eventId y expone un stream unico de eventos + estado.
 *
 * La reconciliacion por REST (refrescar bandeja/chat tras reconectar) la
 * hacen los componentes escuchando el cambio de estado a 'connected'.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly auth = inject(AuthService);
  private socket?: Socket;

  private readonly seenEventIds = new Set<string>();
  private readonly seenOrder: string[] = [];

  private readonly events$ = new Subject<RealtimeEvent>();
  readonly status = signal<RealtimeStatus>('disconnected');
  /** Se incrementa cada vez que se (re)conecta, para disparar reconciliacion. */
  readonly reconnectTick = signal(0);

  get stream() {
    return this.events$.asObservable();
  }

  connect(): void {
    const token = this.auth.getToken();
    if (!token || this.socket) return;

    this.status.set('connecting');
    const url = environment.apiBaseUrl.replace(/\/api\/v1$/, '');

    this.socket = io(`${url}/realtime`, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    this.socket.on('connect', () => {
      this.status.set('connected');
      this.reconnectTick.update((n) => n + 1);
    });
    this.socket.on('disconnect', () => this.status.set('reconnecting'));
    this.socket.io.on('reconnect_attempt', () =>
      this.status.set('reconnecting'),
    );
    this.socket.on('unauthorized', () => this.disconnect());

    for (const type of EVENT_TYPES) {
      this.socket.on(type, (event: RealtimeEvent) => this.handle(event));
    }
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = undefined;
    this.status.set('disconnected');
  }

  private handle(event: RealtimeEvent): void {
    if (!event?.eventId || this.seenEventIds.has(event.eventId)) {
      return; // dedup
    }
    this.seenEventIds.add(event.eventId);
    this.seenOrder.push(event.eventId);
    // Cache corta: conservar ultimos 500 ids.
    if (this.seenOrder.length > 500) {
      const old = this.seenOrder.shift();
      if (old) this.seenEventIds.delete(old);
    }
    this.events$.next(event);
  }
}

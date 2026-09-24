import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { RealtimeEvent, RealtimeEventType } from '@paula/contracts';

/**
 * Punto unico para emitir eventos realtime.
 * Hoy lo alimenta el propio backend Web al procesar comandos; cuando exista
 * el consumer de SQS (eventos del Bot Core), este dispatcher sera el destino
 * de esos eventos sin cambiar el gateway ni los clientes.
 */
@Injectable()
export class RealtimeDispatcher {
  private emitFn?: (event: RealtimeEvent) => void;

  /** El gateway se registra para recibir los eventos a difundir. */
  registerEmitter(fn: (event: RealtimeEvent) => void): void {
    this.emitFn = fn;
  }

  emit<T>(
    eventType: RealtimeEventType,
    data: T,
    opts: { sessionId?: string; aggregateVersion?: number } = {},
  ): void {
    const event: RealtimeEvent<T> = {
      eventId: uuidv4(),
      type: eventType,
      sessionId: opts.sessionId,
      occurredAt: new Date().toISOString(),
      data,
    };
    this.emitFn?.(event as RealtimeEvent);
  }
}

import type { ConversationMode } from './enums.js';

/**
 * Comandos que la Web envia al Bot Core a traves de NestJS.
 * Todo comando mutable lleva idempotencia y (cuando aplica) version esperada.
 */

/** Tomar una conversacion sin asignar. */
export interface TakeConversationCommand {
  commandId: string;
  expectedVersion: number;
}

/** Asignar o reasignar una conversacion a un asesor. */
export interface AssignConversationCommand {
  commandId: string;
  assigneeId: string;
  expectedVersion: number;
}

/** Enviar un mensaje manual (solo en mode MANUAL). */
export interface SendMessageCommand {
  clientMessageId: string;
  type: 'text';
  content: string;
  expectedVersion: number;
}

/** Registrar una nota interna (no se envia a WhatsApp). */
export interface AddNoteCommand {
  clientMessageId: string;
  content: string;
}

/** Cambiar el modo de la conversacion. */
export interface ChangeModeCommand {
  commandId: string;
  mode: ConversationMode;
  expectedVersion: number;
  reason?: string;
}

/** Cerrar una conversacion. */
export interface CloseConversationCommand {
  commandId: string;
  expectedVersion: number;
  reason?: string;
}

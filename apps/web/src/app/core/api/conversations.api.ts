import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import type {
  ConversationDetail,
  ConversationMessage,
  ConversationSummary,
  InboxView,
  ListConversationsQuery,
  ChangeModeCommand,
  CloseConversationCommand,
  SendMessageCommand,
  TakeConversationCommand,
  AuditEvent,
} from '@paula/contracts';
import { environment } from '../../../environments/environment';
import { ApiEnvelope, PaginatedEnvelope } from '../http/api.types';

export interface ConversationPage {
  items: ConversationSummary[];
  nextCursor?: string;
}

/**
 * Cliente HTTP de conversaciones hacia la Web API (NestJS).
 * Desenvuelve el envelope { data, ... } para exponer el payload limpio.
 */
@Injectable({ providedIn: 'root' })
export class ConversationsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/conversations`;

  list(
    view: InboxView,
    query: ListConversationsQuery = {},
  ): Observable<ConversationPage> {
    let params = new HttpParams().set('view', view);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http
      .get<PaginatedEnvelope<ConversationSummary>>(this.base, { params })
      .pipe(
        map((res) => ({
          items: res.data,
          nextCursor: res.pagination.nextCursor,
        })),
      );
  }

  get(sessionId: string): Observable<ConversationDetail> {
    return this.http
      .get<ApiEnvelope<ConversationDetail>>(
        `${this.base}/${encodeURIComponent(sessionId)}`,
      )
      .pipe(map((res) => res.data));
  }

  getMessages(sessionId: string): Observable<ConversationMessage[]> {
    return this.http
      .get<PaginatedEnvelope<ConversationMessage>>(
        `${this.base}/${encodeURIComponent(sessionId)}/messages`,
      )
      .pipe(map((res) => res.data));
  }

  getAudit(sessionId: string): Observable<AuditEvent[]> {
    return this.http
      .get<PaginatedEnvelope<AuditEvent>>(
        `${this.base}/${encodeURIComponent(sessionId)}/audit`,
      )
      .pipe(map((res) => res.data));
  }

  private url(sessionId: string, path: string): string {
    return `${this.base}/${encodeURIComponent(sessionId)}/${path}`;
  }

  take(
    sessionId: string,
    command: TakeConversationCommand,
  ): Observable<ConversationDetail> {
    return this.http
      .post<ApiEnvelope<ConversationDetail>>(this.url(sessionId, 'take'), command)
      .pipe(map((res) => res.data));
  }

  sendMessage(
    sessionId: string,
    command: SendMessageCommand,
  ): Observable<ConversationMessage> {
    return this.http
      .post<ApiEnvelope<ConversationMessage>>(
        this.url(sessionId, 'messages'),
        command,
      )
      .pipe(map((res) => res.data));
  }

  changeMode(
    sessionId: string,
    command: ChangeModeCommand,
  ): Observable<ConversationDetail> {
    return this.http
      .put<ApiEnvelope<ConversationDetail>>(this.url(sessionId, 'mode'), command)
      .pipe(map((res) => res.data));
  }

  close(
    sessionId: string,
    command: CloseConversationCommand,
  ): Observable<ConversationDetail> {
    return this.http
      .post<ApiEnvelope<ConversationDetail>>(
        this.url(sessionId, 'close'),
        command,
      )
      .pipe(map((res) => res.data));
  }
}

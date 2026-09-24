import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import type {
  ConversationDetail,
  ConversationMessage,
  ConversationSummary,
  ListConversationsQuery,
} from '@paula/contracts';
import { environment } from '../../../environments/environment';
import { ApiEnvelope, PaginatedEnvelope } from '../http/api.types';

/**
 * Cliente HTTP de conversaciones hacia la Web API (NestJS).
 * Desenvuelve el envelope { data, ... } para exponer el payload limpio.
 */
@Injectable({ providedIn: 'root' })
export class ConversationsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/conversations`;

  list(query: ListConversationsQuery = {}): Observable<ConversationSummary[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http
      .get<PaginatedEnvelope<ConversationSummary>>(this.base, { params })
      .pipe(map((res) => res.data));
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
}

import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import type {
  AuthenticatedUser,
  LoginResponse,
  UserRole,
} from '@paula/contracts';
import { environment } from '../../../environments/environment';
import { ApiEnvelope } from '../http/api.types';

const TOKEN_KEY = 'paula.token';
const USER_KEY = 'paula.user';

/**
 * Gestiona la sesion del usuario.
 * En DEV usa el login mock del backend. El token vive en sessionStorage
 * (se limpia al cerrar el navegador). NO expone el token a los componentes;
 * solo el interceptor lo lee via getToken().
 *
 * Cuando exista Cognito real, login() se reemplaza por el flujo OIDC
 * (Authorization Code + PKCE) sin cambiar la API publica de este servicio.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/auth`;

  private readonly _user = signal<AuthenticatedUser | null>(this.restoreUser());

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly roles = computed<UserRole[]>(() => this._user()?.roles ?? []);

  /** Lista de usuarios de prueba (solo DEV). */
  mockUsers(): Observable<AuthenticatedUser[]> {
    return this.http
      .get<ApiEnvelope<AuthenticatedUser[]>>(`${this.base}/mock-users`)
      .pipe(mapData());
  }

  /** Login mock por userId. Persiste token + usuario. */
  login(userId: string): Observable<LoginResponse> {
    return this.http
      .post<ApiEnvelope<LoginResponse>>(`${this.base}/login`, { userId })
      .pipe(
        mapData(),
        tap((res) => this.setSession(res)),
      );
  }

  logout(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this._user.set(null);
  }

  hasRole(...roles: UserRole[]): boolean {
    const current = this._user()?.roles ?? [];
    return roles.some((r) => current.includes(r));
  }

  /** Solo para el interceptor. */
  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  private setSession(res: LoginResponse): void {
    sessionStorage.setItem(TOKEN_KEY, res.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this._user.set(res.user);
  }

  private restoreUser(): AuthenticatedUser | null {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthenticatedUser;
    } catch {
      return null;
    }
  }
}

/** Helper para desenvolver el envelope { data }. */
function mapData<T>() {
  return (source: Observable<ApiEnvelope<T>>): Observable<T> =>
    new Observable<T>((subscriber) => {
      const sub = source.subscribe({
        next: (env) => subscriber.next(env.data),
        error: (e) => subscriber.error(e),
        complete: () => subscriber.complete(),
      });
      return () => sub.unsubscribe();
    });
}

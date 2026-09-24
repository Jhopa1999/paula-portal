import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { AuthenticatedUser } from '@paula/contracts';
import { AuthService } from '../../core/auth/auth.service';
import { NormalizedError } from '../../core/http/api.types';

/**
 * Pantalla de acceso (DEV/mock): lista usuarios de prueba y permite entrar
 * con el rol elegido. En produccion se reemplaza por el boton "Iniciar sesion"
 * que dispara el flujo OIDC de Cognito.
 */
@Component({
  selector: 'app-login-page',
  imports: [],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly users = signal<AuthenticatedUser[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.auth.mockUsers().subscribe({
      next: (users) => this.users.set(users),
      error: (err: NormalizedError) => this.error.set(err.message),
    });
  }

  protected loginAs(userId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(userId).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/app/inbox/all']);
      },
      error: (err: NormalizedError) => {
        this.loading.set(false);
        this.error.set(err.message);
      },
    });
  }
}

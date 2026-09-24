import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { RealtimeService } from '../core/realtime/realtime.service';

/**
 * Shell principal del portal: topbar + layout de 3 columnas
 * (Bandeja | Conversacion | Detalle) segun el design 00-foundation.
 * Gestiona la conexion realtime durante la sesion.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell implements OnInit, OnDestroy {
  protected readonly auth = inject(AuthService);
  protected readonly realtime = inject(RealtimeService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.realtime.connect();
  }

  ngOnDestroy(): void {
    this.realtime.disconnect();
  }

  protected logout(): void {
    this.realtime.disconnect();
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}

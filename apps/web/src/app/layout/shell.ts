import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/**
 * Shell principal del portal: topbar + layout de 3 columnas
 * (Bandeja | Conversacion | Detalle) segun el design 00-foundation.
 * En Fase 0 solo la columna Bandeja tiene contenido real.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {}

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="nf">
      <h1>404</h1>
      <p>La pagina que busca no existe.</p>
      <a routerLink="/app/inbox/all">Ir a la bandeja</a>
    </div>
  `,
  styles: [
    `
      .nf {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        gap: 0.5rem;
        color: #475569;
      }
      h1 {
        font-size: 3rem;
        margin: 0;
      }
    `,
  ],
})
export class NotFound {}

import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'app/inbox/all' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inbox/all' },
      {
        path: 'inbox/mine',
        loadComponent: () =>
          import('./features/inbox/inbox-page').then((m) => m.InboxPage),
        data: { view: 'mine' },
      },
      {
        path: 'inbox/unassigned',
        loadComponent: () =>
          import('./features/inbox/inbox-page').then((m) => m.InboxPage),
        data: { view: 'unassigned' },
      },
      {
        path: 'inbox/all',
        loadComponent: () =>
          import('./features/inbox/inbox-page').then((m) => m.InboxPage),
        data: { view: 'all' },
      },
      {
        path: 'inbox/closed',
        loadComponent: () =>
          import('./features/inbox/inbox-page').then((m) => m.InboxPage),
        data: { view: 'closed' },
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];

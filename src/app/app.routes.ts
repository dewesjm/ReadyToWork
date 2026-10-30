import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'readiness' },
  {
    path: 'readiness',
    title: 'Readiness · Ready to Work',
    loadComponent: () => import('./features/readiness/readiness').then((m) => m.Readiness),
  },
  {
    path: 'person/:id',
    title: 'Person · Ready to Work',
    loadComponent: () =>
      import('./features/person-detail/person-detail').then((m) => m.PersonDetail),
  },
  {
    path: 'admin',
    title: 'Admin · Ready to Work',
    loadComponent: () => import('./features/admin/admin').then((m) => m.Admin),
  },
  {
    path: '**',
    title: 'Not found · Ready to Work',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];

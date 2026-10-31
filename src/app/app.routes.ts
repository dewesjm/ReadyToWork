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
      import('./features/person-detail/person-page').then((m) => m.PersonPage),
  },
  {
    path: 'admin',
    title: 'Admin · Ready to Work',
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'changelog',
    title: 'Change log · Ready to Work',
    loadComponent: () =>
      import('./features/changelog/changelog-page').then((m) => m.ChangelogPage),
  },
  {
    path: '**',
    title: 'Not found · Ready to Work',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];

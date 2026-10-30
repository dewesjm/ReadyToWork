import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tree' },
  {
    path: 'tree',
    title: 'Org tree · Ready to Work',
    loadComponent: () => import('./features/org-tree/org-tree').then((m) => m.OrgTree),
  },
  {
    path: 'person/:id',
    title: 'Person · Ready to Work',
    loadComponent: () =>
      import('./features/person-detail/person-detail').then((m) => m.PersonDetail),
  },
  {
    path: 'issues',
    title: 'Issues · Ready to Work',
    loadComponent: () => import('./features/issues-list/issues-list').then((m) => m.IssuesList),
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

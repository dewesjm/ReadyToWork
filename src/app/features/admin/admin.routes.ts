import { Routes } from '@angular/router';
import { Admin } from './admin';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: Admin,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'programs' },
      {
        path: 'programs',
        title: 'Programs · Admin · Ready to Work',
        loadComponent: () => import('./program-list').then((m) => m.ProgramList),
      },
      {
        path: 'programs/:id',
        title: 'Program · Admin · Ready to Work',
        loadComponent: () => import('./program-editor').then((m) => m.ProgramEditor),
      },
      {
        path: 'thresholds',
        title: 'Thresholds · Admin · Ready to Work',
        loadComponent: () => import('./thresholds').then((m) => m.Thresholds),
      },
      {
        path: 'announcements',
        title: 'Announcements · Admin · Ready to Work',
        loadComponent: () => import('./announcement-list').then((m) => m.AnnouncementList),
      },
      {
        path: 'announcements/:id',
        title: 'Announcement · Admin · Ready to Work',
        loadComponent: () => import('./announcement-editor').then((m) => m.AnnouncementEditor),
      },
      {
        path: 'file',
        title: 'Settings file · Admin · Ready to Work',
        loadComponent: () => import('./settings-file').then((m) => m.SettingsFile),
      },
    ],
  },
];

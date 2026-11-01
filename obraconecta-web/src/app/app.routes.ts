import { Routes } from '@angular/router';
import { authGuard, guestGuard, panelHomeGuard, roleGuard } from './core/guards';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage), title: 'ObraConecta · Maestros de obra en el Cauca' },
  { path: 'ingresar', canActivate: [guestGuard], loadComponent: () => import('./pages/auth/login.page').then((m) => m.LoginPage), title: 'Ingresar · ObraConecta' },
  { path: 'registro', canActivate: [guestGuard], loadComponent: () => import('./pages/auth/register.page').then((m) => m.RegisterPage), title: 'Crear cuenta · ObraConecta' },
  { path: 'maestros', loadComponent: () => import('./pages/workers/workers.page').then((m) => m.WorkersPage), title: 'Buscar maestros · ObraConecta' },
  { path: 'maestros/:id', loadComponent: () => import('./pages/workers/worker-detail.page').then((m) => m.WorkerDetailPage), title: 'Perfil del maestro · ObraConecta' },
  { path: 'trabajos', loadComponent: () => import('./pages/jobs/jobs.page').then((m) => m.JobsPage), title: 'Trabajos disponibles · ObraConecta' },
  { path: 'trabajos/:id', loadComponent: () => import('./pages/jobs/job-detail.page').then((m) => m.JobDetailPage), title: 'Detalle del trabajo · ObraConecta' },
  { path: 'publicar', canActivate: [roleGuard('client')], loadComponent: () => import('./pages/jobs/job-form.page').then((m) => m.JobFormPage), title: 'Publicar trabajo · ObraConecta' },
  { path: 'publicar/:id', canActivate: [roleGuard('client')], loadComponent: () => import('./pages/jobs/job-form.page').then((m) => m.JobFormPage), title: 'Editar trabajo · ObraConecta' },
  {
    path: 'panel',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/panel/panel.layout').then((m) => m.PanelLayout),
    children: [
      { path: '', pathMatch: 'full', canActivate: [panelHomeGuard], children: [] },
      { path: 'postulaciones', canActivate: [roleGuard('worker')], loadComponent: () => import('./pages/panel/my-applications.page').then((m) => m.MyApplicationsPage), title: 'Mis postulaciones · ObraConecta' },
      { path: 'portafolio', canActivate: [roleGuard('worker')], loadComponent: () => import('./pages/panel/portfolio.page').then((m) => m.PortfolioPage), title: 'Mi portafolio · ObraConecta' },
      { path: 'mis-trabajos', canActivate: [roleGuard('client')], loadComponent: () => import('./pages/panel/my-jobs.page').then((m) => m.MyJobsPage), title: 'Mis trabajos · ObraConecta' },
      { path: 'contratos', canActivate: [roleGuard('worker', 'client')], loadComponent: () => import('./pages/panel/contracts.page').then((m) => m.ContractsPage), title: 'Contrataciones · ObraConecta' },
      { path: 'perfil', loadComponent: () => import('./pages/panel/profile.page').then((m) => m.ProfilePage), title: 'Mi perfil · ObraConecta' },
      { path: 'verificacion', canActivate: [roleGuard('worker', 'client')], loadComponent: () => import('./pages/panel/verification.page').then((m) => m.VerificationPage), title: 'Verificación · ObraConecta' },
    ],
  },
  { path: 'admin', canActivate: [roleGuard('admin')], loadComponent: () => import('./pages/admin/admin.page').then((m) => m.AdminPage), title: 'Administración · ObraConecta' },
  { path: '**', loadComponent: () => import('./pages/not-found.page').then((m) => m.NotFoundPage), title: 'Página no encontrada · ObraConecta' },
];

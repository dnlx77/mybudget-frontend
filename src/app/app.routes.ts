import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardLayout } from './layout/dashboard-layout/dashboard-layout';
import { authGuard } from './guards/auth-guard';
import { ContiPage } from './components/conti-page/conti-page';
import { TagsPage } from './components/tags-page/tags-page';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'dashboard',
    component: DashboardLayout,
    canActivate: [authGuard]
  },
  {
    path: 'conti',
    component: ContiPage,
    canActivate: [authGuard]
  },
  {
    path: 'tags',
    component: TagsPage,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
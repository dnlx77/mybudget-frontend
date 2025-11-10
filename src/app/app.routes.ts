import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { ContiList } from './components/conti-list/conti-list';
import { OperazioniList } from './components/operazioni-list/operazioni-list';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: 'conti',
    component: ContiList,
    canActivate: [authGuard]  // ← Protegge questa route
  },
  {
    path: 'operazioni',
    component: OperazioniList,
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
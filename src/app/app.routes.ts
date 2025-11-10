import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { ContiList } from './components/conti-list/conti-list';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: 'conti',
    component: ContiList
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
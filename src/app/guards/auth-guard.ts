import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * AuthGuard - Protegge le route richiedendo autenticazione
 * 
 * Cosa fa:
 * - Se l'utente è autenticato (ha il token), permette l'accesso
 * - Se l'utente NON è autenticato, lo reindirizza a /login
 * 
 * Uso in routing:
 * {
 *   path: 'conti',
 *   component: ContiListComponent,
 *   canActivate: [authGuard]  ← Protegge questa route
 * }
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  /**
   * Verifica se l'utente è autenticato
   * isAuthenticated() controlla se il token esiste in localStorage
   */
  if (authService.isAuthenticated()) {
    // ✅ Utente autenticato, permetti l'accesso
    return true;
  } else {
    // ❌ Utente NON autenticato
    console.warn('Accesso negato: utente non autenticato');
    
    // Reindirizza a /login
    router.navigate(['/login']);
    
    // Nega l'accesso alla route
    return false;
  }
};
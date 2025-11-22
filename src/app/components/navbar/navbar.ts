import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * NavbarComponent - Header dell'applicazione
 * 
 * Mostra:
 * - Nome utente autenticato
 * - Button Logout
 * - Navigazione tra pagine
 */
@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  
  currentUser: User | null = null;
  loading: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Sottoscriviti al currentUser$ per ottenere l'utente autenticato
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  /**
   * Effettua il logout
   */
  onLogout(): void {
    this.loading = true;

    this.authService.logout()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Logout effettuato');
          this.loading = false;
          
          // Reindirizza a /login
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Errore logout:', error);
          this.loading = false;
          
          // Anche se c'è errore, reindirizza a login
          // (il token è comunque stato cancellato localmente)
          this.router.navigate(['/login']);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
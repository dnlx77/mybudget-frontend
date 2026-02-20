import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  
  private authService = inject(AuthService);
  private router = inject(Router);

  // ✅ CORREZIONE: Usiamo il Signal direttamente (senza $)
  // Questo si aggiornerà automaticamente quando l'utente cambia
  currentUser = this.authService.currentUser;
  
  loading = false;

  onLogout(): void {
    this.loading = true;

    // Logout è un'azione HTTP, quindi qui la subscribe serve ancora
    this.authService.logout().subscribe({
      next: () => {
        console.log('Logout effettuato');
        this.loading = false;
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Errore logout:', error);
        this.loading = false;
        this.router.navigate(['/login']);
      }
    });
  }
}
import { Component, inject, OnInit } from '@angular/core'; // ⬅️ Aggiungi OnInit
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Navbar } from './components/navbar/navbar';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit { // ⬅️ Implementa OnInit
  
  private authService = inject(AuthService);

  // Perfetto: i componenti figli e l'HTML leggeranno da qui in automatico
  isAuthenticated = this.authService.isAuthenticated;

  ngOnInit() {
    // Controlliamo se c'è un token salvato prima di disturbare il backend
    const token = localStorage.getItem('auth_token'); // Usa il nome esatto della tua chiave

    if (token) {
      // Facciamo la chiamata. Il "tap" dentro getMe() popolerà il Signal da solo!
      this.authService.getMe().subscribe({
        error: () => {
          // Se il token è scaduto, il backend darà errore e possiamo ripulire
          console.warn('Sessione scaduta, necessario nuovo login.');
          this.authService.logout().subscribe(); // Opzionale: forza la pulizia
        }
      });
    }
  }
}
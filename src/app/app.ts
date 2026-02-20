import { Component, inject } from '@angular/core';
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
export class App {
  
  private authService = inject(AuthService);

  // Colleghiamo direttamente il Signal del servizio
  // Non serve più ngOnInit o subscribe!
  isAuthenticated = this.authService.isAuthenticated;

}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  
  email: string = '';
  password: string = '';
  
  loading: boolean = false;
  error: string | null = null;
  errors: { [key: string]: string[] } = {};

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    console.log('🟢 LoginComponent inizializzato');
  }

  validateForm(): boolean {
    this.error = null;
    this.errors = {};

    if (!this.email.trim()) {
      this.error = 'L\'email è obbligatoria';
      return false;
    }

    if (!this.email.includes('@')) {
      this.error = 'L\'email non è valida';
      return false;
    }

    if (!this.password) {
      this.error = 'La password è obbligatoria';
      return false;
    }

    return true;
  }

  onLogin(): void {
    console.log('🔐 Tentativo di login');

    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.errors = {};

    console.log('📤 Invio login con email:', this.email);

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        console.log('✅ Login avvenuto:', response);
        this.loading = false;
        
        // Reindirizza al dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('❌ Errore login:', error);
        this.loading = false;

        // Gestisci errori di validazione (422)
        if (error.status === 422 && error.error?.errors) {
          this.errors = error.error.errors;
          const firstErrorKey = Object.keys(this.errors)[0];
          const firstErrorMessage = this.errors[firstErrorKey][0];
          this.error = firstErrorMessage;
        }
        // Gestisci errori di autenticazione (401)
        else if (error.status === 401) {
          this.error = 'Email o password non corretti';
        }
        // Gestisci errori generici
        else if (error.error?.error) {
          this.error = error.error.error;
        } else if (error.error?.message) {
          this.error = error.error.message;
        } else if (error.status === 500) {
          this.error = 'Errore del server. Contatta l\'amministratore';
        } else {
          this.error = 'Errore nel login';
        }
      }
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  getFieldError(fieldName: string): string | null {
    if (this.errors[fieldName]) {
      return this.errors[fieldName][0];
    }
    return null;
  }
}

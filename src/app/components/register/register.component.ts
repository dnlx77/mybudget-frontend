import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  
  name: string = '';
  email: string = '';
  password: string = '';
  password_confirmation: string = '';
  
  loading: boolean = false;
  error: string | null = null;
  errors: { [key: string]: string[] } = {};

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    console.log('🟢 RegisterComponent inizializzato');
  }

  validateForm(): boolean {
    this.error = null;
    this.errors = {};

    if (!this.name.trim()) {
      this.error = 'Il nome è obbligatorio';
      return false;
    }

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

    if (this.password.length < 8) {
      this.error = 'La password deve essere almeno 8 caratteri';
      return false;
    }

    if (this.password !== this.password_confirmation) {
      this.error = 'Le password non coincidono';
      return false;
    }

    return true;
  }

  onRegister(): void {
    console.log('📝 Tentativo di registrazione');

    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.errors = {};

    const registerData = {
      name: this.name.trim(),
      email: this.email.trim(),
      password: this.password,
      password_confirmation: this.password_confirmation,
    };

    console.log('📤 Invio registrazione:', { name: registerData.name, email: registerData.email });

    this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log('✅ Registrazione avvenuta:', response);
        
        if (response.token) {
          localStorage.setItem('auth_token', response.token);
          console.log('💾 Token salvato');
          
          // Reindirizza al dashboard
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 500);
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Errore registrazione:', error);
        this.loading = false;

        // Gestisci errori di validazione (422)
        if (error.status === 422 && error.error?.errors) {
          this.errors = error.error.errors;
          const firstErrorKey = Object.keys(this.errors)[0];
          const firstErrorMessage = this.errors[firstErrorKey][0];
          this.error = firstErrorMessage;
        }
        // Gestisci errori generici
        else if (error.error?.error) {
          this.error = error.error.error;
        } else if (error.error?.message) {
          this.error = error.error.message;
        } else if (error.status === 500) {
          this.error = 'Errore del server. Contatta l\'amministratore';
        } else {
          this.error = 'Errore nella registrazione';
        }
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  getFieldError(fieldName: string): string | null {
    if (this.errors[fieldName]) {
      return this.errors[fieldName][0];
    }
    return null;
  }
}

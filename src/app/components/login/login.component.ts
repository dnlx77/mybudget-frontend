import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // ⬅️ Importante: ReactiveFormsModule
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  
  // DEPENDENCIES
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // STATE SIGNALS
  loading = signal(false);
  error = signal<string | null>(null);

  // REACTIVE FORM
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  onLogin(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // Mostra gli errori rossi se l'utente clicca senza scrivere
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();

    this.authService.login(email!, password!).subscribe({
      next: (response) => {
        console.log('✅ Login avvenuto:', response);
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('❌ Errore login:', err);
        this.loading.set(false);
        this.handleError(err);
      }
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  // Gestione errori API avanzata
  private handleError(error: any) {
    if (error.status === 401) {
      this.error.set('Email o password non corretti.');
    } else if (error.status === 422 && error.error?.errors) {
      // Prende il primo errore di validazione dal backend
      const firstError = Object.values(error.error.errors)[0] as string[];
      this.error.set(firstError[0]);
    } else {
      this.error.set(error.error?.message || 'Si è verificato un errore. Riprova.');
    }
  }
}
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // ⬅️ Reactive Forms
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  
  // DEPENDENCIES
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // STATE SIGNALS
  loading = signal(false);
  error = signal<string | null>(null);

  // REACTIVE FORM
  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator }); // ⬅️ Validatore di gruppo per il match

  // VALIDATORE CUSTOM: Password Match
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirm = control.get('confirmPassword')?.value;
    
    // Se non coincidono, ritorna l'errore 'mismatch'
    return password && confirm && password !== confirm ? { mismatch: true } : null;
  }

  onRegister(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // Mostra errori se l'utente clicca subito
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { name, email, password, confirmPassword } = this.form.getRawValue();

    // Mapping per Laravel: confirmPassword -> password_confirmation
    const payload = {
      name: name!,
      email: email!,
      password: password!,
      password_confirmation: confirmPassword!
    };

    console.log('📤 Invio registrazione:', { name, email });

    this.authService.register(payload).subscribe({
      next: (response) => {
        console.log('✅ Registrazione completata:', response);
        this.loading.set(false);
        // Login automatico avvenuto (token salvato nel service), andiamo alla dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('❌ Errore registrazione:', err);
        this.loading.set(false);
        this.handleError(err);
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  // Gestione Errori Backend (Preservata la tua logica originale)
  private handleError(error: any) {
    if (error.status === 422 && error.error?.errors) {
      // Prende il primo errore di validazione (es. "Email già in uso")
      const firstErrorKey = Object.keys(error.error.errors)[0];
      const firstErrorMessage = error.error.errors[firstErrorKey][0];
      this.error.set(firstErrorMessage);
    } else if (error.status === 500) {
      this.error.set('Errore del server. Contatta l\'amministratore');
    } else {
      this.error.set(error.error?.message || 'Errore durante la registrazione.');
    }
  }
}
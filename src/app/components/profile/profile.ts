import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  passwordForm: FormGroup;

  // Sostituiamo le vecchie variabili con i Signal! 🚀
  loading = signal<boolean>(false);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  constructor() {
    this.passwordForm = this.fb.group({
      current_password: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.passwordForm.invalid) return;

    if (this.passwordForm.value.password !== this.passwordForm.value.password_confirmation) {
      this.errorMessage.set('Le nuove password non coincidono.');
      return;
    }

    // Aggiorniamo lo stato usando i Signal
    this.loading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    this.authService.changePassword(this.passwordForm.value).subscribe({
      next: (res) => {
        this.successMessage.set(res.message || 'Password aggiornata con successo!');
        this.passwordForm.reset();
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Errore durante l\'aggiornamento della password.');
        this.loading.set(false);
      }
    });
  }
}
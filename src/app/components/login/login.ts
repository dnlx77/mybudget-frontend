import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, LoginRequest } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnDestroy {
  
  email: string = '';
  password: string = '';
  loading: boolean = false;
  error: string | null = null;
  success: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Effettua il login
   */
  onLogin(): void {
    if (!this.email || !this.password) {
      this.error = 'Email e password sono obbligatori';
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    const credentials: LoginRequest = {
      email: this.email,
      password: this.password
    };

    this.authService.login(credentials)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          console.log('Login riuscito:', response);
          this.success = 'Login effettuato con successo!';
          this.loading = false;
          
          setTimeout(() => {
            this.router.navigate(['/conti']);
          }, 1000);
        },
        error: (error) => {
          console.error('Errore login:', error);
          
          if (error.status === 422) {
            this.error = 'Email o password non validi';
          } else if (error.status === 401) {
            this.error = 'Credenziali non valide';
          } else {
            this.error = `Errore: ${error.error?.message || 'Impossibile effettuare il login'}`;
          }
          
          this.loading = false;
        }
      });
  }

  /**
   * Cleanup quando il componente viene distrutto
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
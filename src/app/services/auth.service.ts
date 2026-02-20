import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  error?: string;
  errors?: { [key: string]: string[] };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://mybudget-angular.test/api/v1'; // O usa API_CONFIG se preferisci

  // ============================================================
  // STATE (SIGNALS)
  // ============================================================
  
  // Signal privato scrivibile
  private _currentUser = signal<User | null>(null);

  // Signal pubblico in sola lettura
  currentUser = this._currentUser.asReadonly();

  // Computed: siamo loggati se abbiamo un utente O un token nel local storage
  // (Qui facciamo un controllo ibrido per evitare flash al refresh)
  isAuthenticated = computed(() => !!this._currentUser() || !!this.getToken());

  constructor() {
    // Al caricamento, se c'è un token, proviamo a recuperare l'utente
    if (this.hasToken()) {
      // Opzionale: potresti chiamare getMe() qui nel costruttore o nell'APP_INITIALIZER
    }
  }

  // ============================================================
  // API METHODS
  // ============================================================

  /**
   * Login
   */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          if (response.token) {
            this.setToken(response.token);
          }
          if (response.user) {
            this._currentUser.set(response.user);
          }
        })
      );
  }

  /**
   * Register
   */
  register(data: { name: string; email: string; password: string; password_confirmation: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data)
      .pipe(
        tap(response => {
          if (response.token) {
            this.setToken(response.token);
          }
          if (response.user) {
            this._currentUser.set(response.user);
          }
        })
      );
  }

  /**
   * Logout
   */
  logout(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/logout`, {}).pipe(
      tap(() => {
        this.clearSession();
        window.location.href = '/login';
      })
    );
  }

  /**
   * Recupera profilo utente (es. al refresh della pagina)
   */
  getMe(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.apiUrl}/auth/me`).pipe(
      tap(response => {
        if (response.user) {
          this._currentUser.set(response.user);
        }
      })
    );
  }

  // ============================================================
  // TOKEN MANAGEMENT
  // ============================================================

  private hasToken(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private setToken(token: string) {
    localStorage.setItem('auth_token', token);
  }

  private clearSession() {
    localStorage.removeItem('auth_token');
    this._currentUser.set(null);
  }
}
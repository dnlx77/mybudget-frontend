import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { API_CONFIG } from '../config/api.config';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  message: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = API_CONFIG.getEndpoint('auth');
  
  // BehaviorSubject per tenere traccia dell'utente autenticato
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadTokenFromStorage();
  }

  /**
   * POST /api/v1/auth/login
   * Effettua il login
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success) {
            this.saveToken(response.token);
            this.currentUserSubject.next(response.user);
          }
        })
      );
  }

  /**
   * POST /api/v1/auth/register
   * Registra un nuovo utente
   */
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data)
      .pipe(
        tap(response => {
          if (response.success) {
            this.saveToken(response.token);
            this.currentUserSubject.next(response.user);
          }
        })
      );
  }

  /**
   * POST /api/v1/auth/logout
   * Effettua il logout
   */
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {})
      .pipe(
        tap(() => {
          this.clearToken();
          this.currentUserSubject.next(null);
        })
      );
  }

  /**
   * GET /api/v1/auth/me
   * Recupera i dati dell'utente autenticato
   */
  getMe(): Observable<{ data: User }> {
    return this.http.get<{ data: User }>(`${this.apiUrl}/me`);
  }

  /**
   * Salva il token nel localStorage
   */
  private saveToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  /**
   * Recupera il token dal localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Elimina il token dal localStorage
   */
  private clearToken(): void {
    localStorage.removeItem('auth_token');
  }

  /**
   * Carica il token dal localStorage all'avvio
   */
  private loadTokenFromStorage(): void {
    const token = this.getToken();
    if (token) {
      // Opzionalmente, puoi qui fare una richiesta a /me per caricare l'utente
      // Ma per ora lo lasciamo così
    }
  }

  /**
   * Verifica se l'utente è autenticato
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Ritorna l'utente corrente
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
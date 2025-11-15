import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthResponse {
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
  private apiUrl = 'http://mybudget-angular.test/api/v1';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) { }

  private hasToken(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  /**
   * Register - POST /api/v1/auth/register
   * Payload: { name, email, password, password_confirmation }
   * Response: { success, token, user, message }
   */
  register(data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data);
  }

  /**
   * Login - POST /api/v1/auth/login
   * Payload: { email, password }
   * Response: { success, token, user, message }
   */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem('auth_token', response.token);
          this.isAuthenticatedSubject.next(true);
        }
        if (response.user) {
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  /**
   * Logout - POST /api/v1/auth/logout
   * Header: Authorization: Bearer TOKEN
   * Response: { success, message }
   */
  logout(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/logout`, {}).pipe(
      tap(() => {
        localStorage.removeItem('auth_token');
        this.isAuthenticatedSubject.next(false);
        this.currentUserSubject.next(null);
      })
    );
  }

  /**
   * Get Me - GET /api/v1/auth/me
   * Header: Authorization: Bearer TOKEN
   * Response: { success, user }
   */
  getMe(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.apiUrl}/auth/me`).pipe(
      tap(response => {
        if (response.user) {
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  isAuthenticatedSync(): boolean {
    return this.hasToken();
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}
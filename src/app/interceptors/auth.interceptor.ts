import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * AuthInterceptor
 * 
 * Questo interceptor intercetta TUTTE le richieste HTTP
 * e aggiunge il token di autenticazione nell'header Authorization
 * 
 * PERCHÉ serve?
 * - Senza: devi aggiungere manualmente il token a ogni richiesta
 * - Con: il token viene aggiunto automaticamente a tutte le richieste
 * 
 * Come funziona:
 * 1. Ogni volta che fai un HTTP request (GET, POST, etc)
 * 2. Questo interceptor lo intercetta PRIMA che parta
 * 3. Aggiunge l'header: Authorization: Bearer <token>
 * 4. Poi la richiesta continua normalmente
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    
    // Recupera il token dal servizio di autenticazione
    const token = this.authService.getToken();

    // Se il token esiste, aggiungilo alla richiesta
    if (token) {
      /**
       * request.clone() crea una COPIA della richiesta
       * Non modificare direttamente la richiesta perché è immutabile in Angular
       * 
       * setHeaders aggiunge (o sostituisce) gli header
       */
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Continua con la richiesta modificata
    return next.handle(request);
  }
}
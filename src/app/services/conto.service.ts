import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

// Interface per il modello Conto
export interface Conto {
  id: number;
  nome: string;
  saldo_totale?: number;
  operazioni?: any[];
  created_at?: string;
  updated_at?: string;
}

// Interface per la risposta lista conti
export interface ContiListResponse {
  success: boolean;
  data: Conto[];  // ← Sempre array!
  message: string;
  count?: number;
}

// Interface per la risposta dell'API
export interface ContoResponse {
  success: boolean;
  data: Conto | Conto[];
  message: string;
  count?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ContoService {
  private apiUrl = API_CONFIG.getEndpoint('conti');

  constructor(private http: HttpClient) { }

  /**
   * GET /api/conti
   * Recupera tutti i conti con i loro saldi
   */
  getConti(): Observable<ContiListResponse> {
    return this.http.get<ContiListResponse>(this.apiUrl);
  }

  /**
   * GET /api/conti/{id}
   * Recupera un conto specifico
   */
  getConto(id: number): Observable<ContoResponse> {
    return this.http.get<ContoResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * POST /api/conti
   * Crea un nuovo conto
   */
  createConto(conto: Conto): Observable<ContoResponse> {
    return this.http.post<ContoResponse>(this.apiUrl, conto);
  }

  /**
   * PUT /api/conti/{id}
   * Aggiorna un conto
   */
  updateConto(id: number, conto: Conto): Observable<ContoResponse> {
    return this.http.put<ContoResponse>(`${this.apiUrl}/${id}`, conto);
  }

  /**
   * DELETE /api/conti/{id}
   * Elimina un conto
   */
  deleteConto(id: number): Observable<ContoResponse> {
    return this.http.delete<ContoResponse>(`${this.apiUrl}/${id}`);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

// Interface per il modello Operazione
export interface Operazione {
  id: number;
  data_operazione: string;
  importo: number;
  descrizione: string;
  conto_id: number;
  trasferimento?: string;
  conto?: {
    id: number;
    nome: string;
  };
  tags?: Array<{
    id: number;
    nome: string;
  }>;
  created_at?: string;
  updated_at?: string;
}

// Interface per i dati di paginazione
export interface PaginationData {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  has_more: boolean;
}

// Interface per la risposta dell'API
export interface OperazioneResponse {
  success: boolean;
  data: Operazione | Operazione[];
  pagination?: PaginationData;
  message: string;
  count?: number;
}

// Interface per i filtri
export interface FiltriOperazioni {
  anno?: number;
  mese?: number;
  giorno?: number;
  tag?: number;
  conto?: number;
  page?: number;
  per_page?: number;
}

@Injectable({
  providedIn: 'root',
})
export class OperazioneService {
  private apiUrl = API_CONFIG.getEndpoint('operazioni');

  constructor(private http: HttpClient) { }

  /**
   * GET /api/v1/operazioni
   * Recupera tutte le operazioni con filtri opzionali
   */
  getOperazioni(params?: any): Observable<any> {
  let url = this.apiUrl;
  
  if (params) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      queryParams.append(key, params[key]);
    });
    url += `?${queryParams.toString()}`;
  }
  
  return this.http.get<any>(url);
}

  /**
   * GET /api/v1/operazioni/{id}
   * Recupera una singola operazione
   */
  getOperazione(id: number): Observable<OperazioneResponse> {
    return this.http.get<OperazioneResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * POST /api/v1/operazioni
   * Crea una nuova operazione
   */
  createOperazione(operazione: Operazione): Observable<OperazioneResponse> {
    return this.http.post<OperazioneResponse>(this.apiUrl, operazione);
  }

  /**
   * PUT /api/v1/operazioni/{id}
   * Aggiorna un'operazione
   */
  updateOperazione(id: number, operazione: Operazione): Observable<OperazioneResponse> {
    return this.http.put<OperazioneResponse>(`${this.apiUrl}/${id}`, operazione);
  }

  /**
   * DELETE /api/v1/operazioni/{id}
   * Elimina un'operazione
   */
  deleteOperazione(id: number): Observable<OperazioneResponse> {
    return this.http.delete<OperazioneResponse>(`${this.apiUrl}/${id}`);
  }

  getStatistiche(params?: any): Observable<any> {
  return this.http.get(`${this.apiUrl}/statistiche/totali`, { params });
}
}
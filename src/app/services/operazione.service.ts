import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

// Interface allineata al database Laravel
export interface Operazione {
  id: number;
  data_operazione: string;
  importo: number;
  descrizione: string;
  conto_id: number;
  conto_destinazione_id?: number; // Opzionale per il form (trasferimenti)
  trasferimento: 'T' | 'N';       // Tipizzazione stretta
  transfer_code?: string | null;  // Nuovo campo UUID
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

export interface PaginationData {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  has_more: boolean;
}

export interface OperazioneResponse {
  success: boolean;
  data: Operazione[];
  pagination: PaginationData;
  message: string;
  count: number;
}

export interface StatisticheResponse {
  success: boolean;
  data: {
    guadagno: number;
    spese: number;
    saldo: number;
  };
}

// Index signature per permettere l'iterazione sui filtri
export interface FiltriOperazioni {
  [key: string]: any;
  anno?: number;
  mese?: number;
  data?: string;
  tag?: number | string;
  conto_id?: number | string;
  page?: number;
  per_page?: number;
}

@Injectable({
  providedIn: 'root',
})
export class OperazioneService {
  private http = inject(HttpClient);
  private apiUrl = API_CONFIG.getEndpoint('operazioni');

  /**
   * GET /api/operazioni
   */
  getOperazioni(filters: FiltriOperazioni): Observable<OperazioneResponse> {
    let params = new HttpParams();

    Object.keys(filters).forEach(key => {
      // Aggiungiamo il parametro solo se ha un valore valido
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params = params.set(key, filters[key].toString());
      }
    });

    return this.http.get<OperazioneResponse>(this.apiUrl, { params });
  }

  /**
   * GET /api/operazioni/statistiche/totali
   */
  getStatistiche(filters: FiltriOperazioni): Observable<StatisticheResponse> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      // Escludiamo page e per_page dalle statistiche
      if (key !== 'page' && key !== 'per_page') {
        // ⚠️ USIAMO LO STESSO CONTROLLO ROBUSTO DI getOperazioni
        const val = filters[key];
        if (val !== null && val !== undefined && val !== '') {
           params = params.set(key, val.toString());
        }
      }
    });
    return this.http.get<StatisticheResponse>(`${this.apiUrl}/statistiche/totali`, { params });
  }

  getOperazione(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createOperazione(operazione: Partial<Operazione>): Observable<any> {
    return this.http.post(this.apiUrl, operazione);
  }

  updateOperazione(id: number, operazione: Partial<Operazione>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, operazione);
  }

  deleteOperazione(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { PaginationData } from './operazione.service';

// Interface per il modello PagamentoRata
// importo_pagato, importo_residuo, rate_pagate e stato sono calcolati dal backend
// (somma delle operazioni collegate), non salvati come dato a parte.
export interface PagamentoRataModel {
  id: number;
  nome: string;
  importo_totale: number;
  numero_rate: number;
  data_inizio: string;
  importo_pagato: number;
  importo_residuo: number;
  rate_pagate: number;
  stato: 'attivo' | 'completato';
  created_at?: string;
  updated_at?: string;
}

export interface PagamentoRataPayload {
  nome: string;
  importo_totale: number;
  numero_rate: number;
  data_inizio: string;
}

export interface PagamentoRataResponse {
  success: boolean;
  data: PagamentoRataModel;
  message: string;
}

export interface PagamentiRateListResponse {
  success: boolean;
  data: PagamentoRataModel[];
  pagination: PaginationData;
  message: string;
}

export interface PagamentiRateListParams {
  page?: number;
  per_page?: number;
  stato?: 'attivo' | 'completato';
}

@Injectable({
  providedIn: 'root',
})
export class PagamentoRataService {
  private apiUrl = API_CONFIG.getEndpoint('pagamenti-rate');

  constructor(private http: HttpClient) { }

  /**
   * GET /api/v1/pagamenti-rate
   */
  getPagamenti(params: PagamentiRateListParams = {}): Observable<PagamentiRateListResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.per_page) httpParams = httpParams.set('per_page', params.per_page);
    if (params.stato) httpParams = httpParams.set('stato', params.stato);

    return this.http.get<PagamentiRateListResponse>(this.apiUrl, { params: httpParams });
  }

  /**
   * GET /api/v1/pagamenti-rate/{id}
   */
  getPagamento(id: number): Observable<PagamentoRataResponse> {
    return this.http.get<PagamentoRataResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * POST /api/v1/pagamenti-rate
   */
  createPagamento(pagamento: PagamentoRataPayload): Observable<PagamentoRataResponse> {
    return this.http.post<PagamentoRataResponse>(this.apiUrl, pagamento);
  }

  /**
   * PUT /api/v1/pagamenti-rate/{id}
   */
  updatePagamento(id: number, pagamento: PagamentoRataPayload): Observable<PagamentoRataResponse> {
    return this.http.put<PagamentoRataResponse>(`${this.apiUrl}/${id}`, pagamento);
  }

  /**
   * DELETE /api/v1/pagamenti-rate/{id}
   */
  deletePagamento(id: number): Observable<PagamentoRataResponse> {
    return this.http.delete<PagamentoRataResponse>(`${this.apiUrl}/${id}`);
  }
}

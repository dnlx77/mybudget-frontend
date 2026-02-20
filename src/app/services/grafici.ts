import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

/**
 * Interface per i dati spese per tag
 */
export interface SpesePerTagData {
  nome: string;
  id: number;
  totale: number;
  num_operazioni: number;
}

/**
 * Interface per i dati guadagni vs spese (mensile)
 */
export interface GuadagniVsSpeseData {
  data: string;           // Formato: "2025-01"
  guadagni: number;       // Entrate (importo > 0)
  spese: number;          // Uscite (|importo < 0|)
  saldo_netto: number;    // guadagni - spese
}

/**
 * Interface per i dati andamento saldo
 */
export interface AndamentoSaldoData {
  data: string;           // Formato: "2025-01-15"
  saldo: number;          // Saldo cumulativo fino a quella data
}

/**
 * Interface per i filtri applicati (Risposta Backend)
 */
export interface FiltriFiltriGrafici {
  data_inizio: string;
  data_fine: string;
  conto_id: number | null;
  tag_id: number | null;
  giorni: number;
}

/**
 * Interface per la risposta API completa (variante per spese-per-tag)
 */
export interface ApiResponseGrafici<T> {
  success: boolean;
  data: T;
  filtri: FiltriFiltriGrafici;
  totale_generale: number;
  totale_distribuito?: number;
  num_categorie_totali?: number; 
  num_categorie_mostrate?: number; 
}

/**
 * Interface per la risposta API guadagni-spese
 */
export interface ApiResponseGuadagniSpese {
  success: boolean;
  data: GuadagniVsSpeseData[];
  filtri: {
    data_inizio: string;
    data_fine: string;
    conto_id: number | null;
  };
  statistiche: {
    totale_guadagni: number;
    totale_spese: number;
    saldo_netto: number;
    num_mesi: number;
  };
  message: string;
}

/**
 * Interface per la risposta API andamento-saldo
 */
export interface ApiResponseAndamentoSaldo {
  success: boolean;
  data: AndamentoSaldoData[];
  conto: {
    id: number;
    nome: string;
  };
  filtri: {
    data_inizio: string;
    data_fine: string;
  };
  statistiche: {
    saldo_iniziale: number;
    saldo_finale: number;
    variazione: number;
    saldo_minimo: number;
    saldo_massimo: number;
    num_giorni: number;
  };
  message: string;
}

/**
 * Interface per i parametri di filtro (Input Frontend)
 */
export interface FiltriGraficiParams {
  data_inizio?: string;   // Formato: YYYY-MM-DD
  data_fine?: string;     // Formato: YYYY-MM-DD
  conto_id?: number | null;
  tag_id?: number | null;
  tag_ids?: number[];     // 🆕 CAMPO AGGIUNTO PER RISOLVERE L'ERRORE
}

@Injectable({
  providedIn: 'root'
})
export class GraficiService {
  
  private apiUrl = `${API_CONFIG.BASE_URL}/${API_CONFIG.API_VERSION}/grafici`;

  constructor(private http: HttpClient) {}

  /**
   * Helper privato per costruire i parametri comuni
   */
  private buildParams(filtri?: FiltriGraficiParams): HttpParams {
    let params = new HttpParams();
    
    if (filtri?.data_inizio) {
      params = params.set('data_inizio', filtri.data_inizio);
    }
    
    if (filtri?.data_fine) {
      params = params.set('data_fine', filtri.data_fine);
    }
    
    if (filtri?.conto_id !== null && filtri?.conto_id !== undefined) {
      params = params.set('conto_id', filtri.conto_id.toString());
    }
    
    if (filtri?.tag_id) {
      params = params.set('tag_id', filtri.tag_id.toString());
    }

    // 🆕 GESTIONE ARRAY TAGS -> STRINGA
    if (filtri?.tag_ids && filtri.tag_ids.length > 0) {
      params = params.set('tag_ids', filtri.tag_ids.join(','));
    }

    return params;
  }

  /**
   * Recupera spese aggregate per tag con filtri personalizzabili
   */
  getSpesePerTag(filtri?: FiltriGraficiParams): Observable<ApiResponseGrafici<SpesePerTagData[]>> {
    const params = this.buildParams(filtri);
    return this.http.get<ApiResponseGrafici<SpesePerTagData[]>>(
      `${this.apiUrl}/spese-per-tag`,
      { params }
    );
  }

  /**
   * Recupera confronto guadagni vs spese per mese
   */
  getGuadagniVsSpese(filtri?: FiltriGraficiParams): Observable<ApiResponseGuadagniSpese> {
    const params = this.buildParams(filtri);
    return this.http.get<ApiResponseGuadagniSpese>(
      `${this.apiUrl}/guadagni-vs-spese`,
      { params }
    );
  }

  /**
   * Recupera l'andamento del saldo nel tempo (giorno per giorno)
   */
  getAndamentoSaldo(filtri: FiltriGraficiParams): Observable<ApiResponseAndamentoSaldo> {
    console.log('🔍 getAndamentoSaldo() chiamato con filtri:', filtri);
    const params = this.buildParams(filtri);
    return this.http.get<ApiResponseAndamentoSaldo>(
      `${this.apiUrl}/andamento-saldo`,
      { params }
    );
  }
}
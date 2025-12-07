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
  mese: string;           // Formato: "2025-01"
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
 * Interface per i filtri applicati
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
 * Interface per i parametri di filtro
 */
export interface FiltriGraficiParams {
  data_inizio?: string;   // Formato: YYYY-MM-DD
  data_fine?: string;     // Formato: YYYY-MM-DD
  conto_id?: number | null;
  tag_id?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class GraficiService {
  
  private apiUrl = `${API_CONFIG.BASE_URL}/${API_CONFIG.API_VERSION}/grafici`;

  constructor(private http: HttpClient) {}

  /**
   * Recupera spese aggregate per tag con filtri personalizzabili
   * 
   * @param filtri - Oggetto con parametri opzionali
   * @returns Observable con dati e metadati
   * 
   * Esempi uso:
   * 
   * // Default: ultimi 30 giorni
   * this.graficiService.getSpesePerTag().subscribe(...)
   * 
   * // Anno specifico
   * this.graficiService.getSpesePerTag({
   *   data_inizio: '2024-01-01',
   *   data_fine: '2024-12-31'
   * }).subscribe(...)
   * 
   * // Filtra per conto
   * this.graficiService.getSpesePerTag({
   *   data_inizio: '2024-11-01',
   *   conto_id: 3
   * }).subscribe(...)
   */
  getSpesePerTag(filtri?: FiltriGraficiParams): Observable<ApiResponseGrafici<SpesePerTagData[]>> {
    // Costruisci i query parameters
    let params = new HttpParams();
    
    if (filtri?.data_inizio) {
      params = params.set('data_inizio', filtri.data_inizio);
    }
    
    if (filtri?.data_fine) {
      params = params.set('data_fine', filtri.data_fine);
    }
    
    // ⬇️ IMPORTANTE: Solo se conto_id è definito e diverso da null/undefined
    if (filtri?.conto_id !== null && filtri?.conto_id !== undefined) {
      params = params.set('conto_id', filtri.conto_id.toString());
    }
    
    if (filtri?.tag_id) {
      params = params.set('tag_id', filtri.tag_id.toString());
    }

    return this.http.get<ApiResponseGrafici<SpesePerTagData[]>>(
      `${this.apiUrl}/spese-per-tag`,
      { params }  // ⬅️ Passa i parametri alla richiesta
    );
  }

  /**
   * Recupera confronto guadagni vs spese per mese
   * 
   * Mostra mensile:
   * - Guadagni (entrate, importo > 0)
   * - Spese (uscite, |importo < 0|)
   * - Saldo netto (guadagni - spese)
   * 
   * NOTA: I trasferimenti sono SEMPRE esclusi
   * 
   * @param filtri - Oggetto con parametri opzionali
   * @returns Observable con dati mensili e statistiche
   * 
   * Esempi uso:
   * 
   * // Ultimi 12 mesi
   * this.graficiService.getGuadagniVsSpese().subscribe(...)
   * 
   * // Anno specifico
   * this.graficiService.getGuadagniVsSpese({
   *   data_inizio: '2024-01-01',
   *   data_fine: '2024-12-31'
   * }).subscribe(...)
   * 
   * // Per conto specifico
   * this.graficiService.getGuadagniVsSpese({
   *   data_inizio: '2024-01-01',
   *   data_fine: '2024-12-31',
   *   conto_id: 3
   * }).subscribe(...)
   */
  getGuadagniVsSpese(filtri?: FiltriGraficiParams): Observable<ApiResponseGuadagniSpese> {
    let params = new HttpParams();
    
    if (filtri?.data_inizio) {
      params = params.set('data_inizio', filtri.data_inizio);
    }
    
    if (filtri?.data_fine) {
      params = params.set('data_fine', filtri.data_fine);
    }
    
    // ⬇️ IMPORTANTE: Solo se conto_id è definito e diverso da null/undefined
    if (filtri?.conto_id !== null && filtri?.conto_id !== undefined) {
      params = params.set('conto_id', filtri.conto_id.toString());
    }

    return this.http.get<ApiResponseGuadagniSpese>(
      `${this.apiUrl}/guadagni-vs-spese`,
      { params }
    );
  }

  /**
   * Recupera l'andamento del saldo nel tempo (giorno per giorno)
   * 
   * Mostra l'evoluzione cumulativa del saldo:
   * - Parte dal saldo_iniziale del conto
   * - Aggiorna ogni giorno con le operazioni
   * - Genera un punto per ogni giorno nel periodo
   * 
   * IMPORTANTE: conto_id è OBBLIGATORIO per calcolare il saldo iniziale correttamente
   * 
   * @param filtri - Oggetto con parametri (conto_id è OBBLIGATORIO!)
   * @returns Observable con dati giornalieri e statistiche
   * 
   * Esempi uso:
   * 
   * // Per un conto, ultimi 3 mesi
   * this.graficiService.getAndamentoSaldo({
   *   conto_id: 3
   * }).subscribe(...)
   * 
   * // Periodo personalizzato
   * this.graficiService.getAndamentoSaldo({
   *   data_inizio: '2024-10-01',
   *   data_fine: '2024-12-31',
   *   conto_id: 3
   * }).subscribe(...)
   */
  getAndamentoSaldo(filtri: FiltriGraficiParams): Observable<ApiResponseAndamentoSaldo> {
    console.log('🔍 getAndamentoSaldo() chiamato con filtri:', filtri);
    let params = new HttpParams();
    
    if (filtri?.data_inizio) {
      params = params.set('data_inizio', filtri.data_inizio);
    }
    
    if (filtri?.data_fine) {
      params = params.set('data_fine', filtri.data_fine);
    }
    
    // ⬇️ IMPORTANTE: conto_id è OBBLIGATORIO per questo endpoint!
    if (filtri?.conto_id !== null && filtri?.conto_id !== undefined) {
      params = params.set('conto_id', filtri.conto_id.toString());
    }

    return this.http.get<ApiResponseAndamentoSaldo>(
      `${this.apiUrl}/andamento-saldo`,
      { params }
    );
  }
}
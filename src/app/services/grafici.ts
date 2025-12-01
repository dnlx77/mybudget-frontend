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
 * Interface per la risposta API completa
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
}
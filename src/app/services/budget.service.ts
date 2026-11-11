import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export interface MeseRiferimento {
  etichetta: string;   // es. "Ottobre 2026"
  speso: number;
}

// Percentuale del mese a cui "dovresti" essere oggi. "storico": quanto di solito
// avevi già speso a questo giorno nei mesi di riferimento; "lineare": giorni
// trascorsi / giorni del mese (senza storico, o per mesi passati/futuri).
export interface RitmoBudget {
  percentuale: number;
  tipo: 'storico' | 'lineare';
}

export interface BudgetTagData {
  speso: number;
  riferimento: number | null;          // media dei mesi di riferimento, null se non ce ne sono
  mesi_riferimento: MeseRiferimento[];
  ritmo: RitmoBudget;                  // calcolato sulla storia di questo tag
}

export interface BudgetData {
  anno: number;
  mese: number;
  etichetta: string;                   // es. "Novembre 2026"
  budget: number | null;               // null se per il mese non è ancora impostato
  proposta: number | null;             // media dei 3 mesi precedenti, arrotondata a 10 €
  mesi_riferimento: MeseRiferimento[];
  speso: number;                       // stesse regole della card Uscite (trasferimenti esclusi)
  giorni_mese: number;
  giorni_trascorsi: number;
  ritmo: RitmoBudget;
  tag: BudgetTagData | null;           // presente solo se si filtra per tag o gruppo tag
}

export interface BudgetResponse {
  success: boolean;
  data: BudgetData;
}

@Injectable({
  providedIn: 'root',
})
export class BudgetService {
  private http = inject(HttpClient);
  private apiUrl = API_CONFIG.getEndpoint('budget');

  /**
   * GET /api/v1/budget?anno=&mese=[&tag=1,2,3]
   */
  getBudget(anno: number, mese: number, tag?: string): Observable<BudgetResponse> {
    let params = new HttpParams().set('anno', anno).set('mese', mese);
    if (tag) params = params.set('tag', tag);

    return this.http.get<BudgetResponse>(this.apiUrl, { params });
  }

  /**
   * PUT /api/v1/budget
   */
  salvaBudget(anno: number, mese: number, importo: number): Observable<unknown> {
    return this.http.put(this.apiUrl, { anno, mese, importo });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { TagModel } from './tag.service';

// Interface per il modello GruppoTag ("tag virtuale": raccolta di tag salvata)
export interface GruppoTagModel {
  id: number;
  nome: string;
  tags: TagModel[];
  created_at?: string;
  updated_at?: string;
}

export interface GruppoTagPayload {
  nome: string;
  tags: number[];
}

export interface GruppoTagResponse {
  success: boolean;
  data: GruppoTagModel;
  message: string;
}

export interface GruppiTagListResponse {
  success: boolean;
  data: GruppoTagModel[];
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class GruppoTagService {
  private apiUrl = API_CONFIG.getEndpoint('gruppi-tag');

  constructor(private http: HttpClient) { }

  /**
   * GET /api/v1/gruppi-tag
   */
  getGruppi(): Observable<GruppiTagListResponse> {
    return this.http.get<GruppiTagListResponse>(this.apiUrl);
  }

  /**
   * GET /api/v1/gruppi-tag/{id}
   */
  getGruppo(id: number): Observable<GruppoTagResponse> {
    return this.http.get<GruppoTagResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * POST /api/v1/gruppi-tag
   */
  createGruppo(gruppo: GruppoTagPayload): Observable<GruppoTagResponse> {
    return this.http.post<GruppoTagResponse>(this.apiUrl, gruppo);
  }

  /**
   * PUT /api/v1/gruppi-tag/{id}
   */
  updateGruppo(id: number, gruppo: GruppoTagPayload): Observable<GruppoTagResponse> {
    return this.http.put<GruppoTagResponse>(`${this.apiUrl}/${id}`, gruppo);
  }

  /**
   * DELETE /api/v1/gruppi-tag/{id}
   */
  deleteGruppo(id: number): Observable<GruppoTagResponse> {
    return this.http.delete<GruppoTagResponse>(`${this.apiUrl}/${id}`);
  }
}

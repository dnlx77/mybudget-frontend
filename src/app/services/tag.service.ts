import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

// Interface per il modello Tag
export interface TagModel {
  id: number;
  nome: string;
  created_at?: string;
  updated_at?: string;
}

// Interface per la risposta dell'API
export interface TagResponse {
  success: boolean;
  data: TagModel | TagModel[];
  message: string;
  count?: number;
}

@Injectable({
  providedIn: 'root',
})
export class TagService {
  private apiUrl = API_CONFIG.getEndpoint('tags');

  constructor(private http: HttpClient) { }

  /**
   * GET /api/v1/tags
   * Recupera tutti i tag
   */
  getTags(): Observable<TagResponse> {
    return this.http.get<TagResponse>(this.apiUrl);
  }

  /**
   * GET /api/v1/tags/{id}
   * Recupera un singolo tag
   */
  getTag(id: number): Observable<TagResponse> {
    return this.http.get<TagResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * POST /api/v1/tags
   * Crea un nuovo tag
   */
  createTag(tag: TagModel): Observable<TagResponse> {
    return this.http.post<TagResponse>(this.apiUrl, tag);
  }

  /**
   * PUT /api/v1/tags/{id}
   * Aggiorna un tag
   */
  updateTag(id: number, tag: TagModel): Observable<TagResponse> {
    return this.http.put<TagResponse>(`${this.apiUrl}/${id}`, tag);
  }

  /**
   * DELETE /api/v1/tags/{id}
   * Elimina un tag
   */
  deleteTag(id: number): Observable<TagResponse> {
    return this.http.delete<TagResponse>(`${this.apiUrl}/${id}`);
  }
}
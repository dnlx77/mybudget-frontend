import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Event Service - Gestisce comunicazione tra componenti
 * 
 * Pattern: Subject privato + Observable pubblico
 * - Subject privato: solo EventService può emettere eventi
 * - Observable pubblico: tutti possono ascoltare
 */
@Injectable({
  providedIn: 'root',
})
export class EventService {
  
  // ============================================================
  // OPERAZIONI
  // ============================================================
  
  // Subject privato (solo questo service può emettere)
  private operazioneChangedSource = new Subject<void>();
  
  // Observable pubblico (chiunque può ascoltare)
  public operazioneChanged$ = this.operazioneChangedSource.asObservable();
  
  /**
   * Notifica che un'operazione è stata creata/modificata/cancellata
   * 
   * Chiamalo dopo operazioni di CREATE, UPDATE, DELETE
   */
  notifyOperazioneChanged(): void {
    console.log('🔔 EventService: operazione modificata');
    this.operazioneChangedSource.next();
  }
  
  // ============================================================
  // CONTI (per il futuro)
  // ============================================================
  
  private contoChangedSource = new Subject<void>();
  public contoChanged$ = this.contoChangedSource.asObservable();
  
  notifyContoChanged(): void {
    console.log('🔔 EventService: conto modificato');
    this.contoChangedSource.next();
  }
  
  // ============================================================
  // TAG (per il futuro)
  // ============================================================
  
  private tagChangedSource = new Subject<void>();
  public tagChanged$ = this.tagChangedSource.asObservable();
  
  notifyTagChanged(): void {
    console.log('🔔 EventService: tag modificato');
    this.tagChangedSource.next();
  }
}
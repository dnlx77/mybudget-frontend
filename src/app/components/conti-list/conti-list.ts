import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContoService, Conto } from '../../services/conto.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-conti-list',
  imports: [CommonModule],
  templateUrl: './conti-list.html',
  styleUrl: './conti-list.css',
})
export class ContiList implements OnInit, OnDestroy {
  
  conti: Conto[] = [];
  loading: boolean = true;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(private contoService: ContoService) { }

  /**
   * ngOnInit è un "lifecycle hook" (gancio del ciclo di vita)
   * Viene eseguito automaticamente quando il componente viene caricato
   * 
   * PERCHÉ qui e non nel constructor?
   * - Nel constructor: solo inizializzazione
   * - In ngOnInit: logica che dipende da dati/servizi
   */
  ngOnInit(): void {
    this.loadConti();
  }

  /**
   * Carica i conti dall'API
   */
  loadConti(): void {
    this.loading = true;
    this.error = null;

    /**
     * QUI USIAMO subscribe()!
     * 
     * this.contoService.getConti() ritorna un Observable
     * .subscribe() si mette in ascolto e quando arrivano i dati:
     * - next: callback quando i dati arrivano
     * - error: callback se c'è un errore
     * - complete: callback quando l'observable è completato
     */
    this.contoService.getConti()
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          console.log('Conti ricevuti:', response);
          
          // Controlliamo che la risposta sia OK
          if (response.success) {
            // response.data è un array di Conto
            this.conti = response.data as Conto[];
          } else {
            this.error = response.message;
          }
          
          this.loading = false;
        },
        
        error: (error) => {
          console.error('Errore nel caricamento conti:', error);
          this.error = `Errore: ${error.message || 'Impossibile caricare i conti'}`;
          this.loading = false;
        },
        
        complete: () => {
          console.log('Caricamento conti completato');
        }
      });
  }

  /**
   * Cleanup quando il componente viene distrutto
   * IMPORTANTE: cancella le subscription per evitare memory leak
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
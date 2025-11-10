import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OperazioneService, Operazione } from '../../services/operazione.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-operazioni-list',
  imports: [CommonModule],
  templateUrl: './operazioni-list.html',
  styleUrl: './operazioni-list.css',
})
export class OperazioniList implements OnInit, OnDestroy {
  
  operazioni: Operazione[] = [];
  loading: boolean = true;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(private operazioneService: OperazioneService) { }

  ngOnInit(): void {
    this.loadOperazioni();
  }

  /**
   * Carica le operazioni dall'API
   */
  loadOperazioni(): void {
    this.loading = true;
    this.error = null;

    this.operazioneService.getOperazioni()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Operazioni ricevute:', response);
          
          if (response.success) {
            // Ordina per data decrescente (più recenti prima)
            this.operazioni = (response.data as Operazione[]).sort(
              (a, b) => new Date(b.data_operazione).getTime() - new Date(a.data_operazione).getTime()
            );
          } else {
            this.error = response.message;
          }
          
          this.loading = false;
        },
        
        error: (error) => {
          console.error('Errore nel caricamento operazioni:', error);
          this.error = `Errore: ${error.message || 'Impossibile caricare le operazioni'}`;
          this.loading = false;
        },
        
        complete: () => {
          console.log('Caricamento operazioni completato');
        }
      });
  }

  /**
   * Elimina un'operazione
   */
  deleteOperazione(id: number): void {
    const conferma = confirm('Sei sicuro di voler eliminare questa operazione?');
    
    if (!conferma) {
      return;
    }

    this.operazioneService.deleteOperazione(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Operazione eliminata:', response);
          
          // Ricarica la lista
          this.loadOperazioni();
        },
        
        error: (error) => {
          console.error('Errore eliminazione operazione:', error);
          this.error = `Errore: ${error.message || 'Impossibile eliminare l\'operazione'}`;
        }
      });
  }

  /**
   * Modifica un'operazione (per ora solo log, dopo implementeremo il form)
   */
  editOperazione(operazione: Operazione): void {
    console.log('Modifica operazione:', operazione);
    // TODO: Aprire un modal/form per modificare l'operazione
  }

  /**
   * Formatta la data in formato leggibile
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  /**
   * Ritorna il colore dell'importo in base al segno
   */
  getImportoClass(importo: number): string {
    if (importo > 0) return 'positivo';
    if (importo < 0) return 'negativo';
    return 'neutro';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
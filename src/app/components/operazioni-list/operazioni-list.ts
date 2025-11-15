import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OperazioneService, Operazione, PaginationData } from '../../services/operazione.service';
import { OperazioneFormComponent } from '../operazione-form/operazione-form';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-operazioni-list',
  imports: [CommonModule, OperazioneFormComponent],
  templateUrl: './operazioni-list.html',
  styleUrl: './operazioni-list.css',
})
export class OperazioniList implements OnInit, OnDestroy {
  
  operazioni: Operazione[] = [];
  loading: boolean = true;
  loadingMore: boolean = false;
  error: string | null = null;
  
  // Paginazione
  pagination: PaginationData | null = null;
  currentPage: number = 1;
  perPage: number = 50;

  // Modal
  isFormOpen: boolean = false;
  operazioneEdit: Operazione | null = null;

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

    this.operazioneService.getOperazioni({
      page: this.currentPage,
      per_page: this.perPage
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Operazioni ricevute:', response);
          
          if (response.success) {
            // Se è la prima pagina, sostituisci; altrimenti aggiungi
            if (this.currentPage === 1) {
              this.operazioni = response.data as Operazione[];
            } else {
              this.operazioni.push(...(response.data as Operazione[]));
            }
            
            // Salva i dati di paginazione
            if (response.pagination) {
              this.pagination = response.pagination;
            }
          } else {
            this.error = response.message;
          }
          
          this.loading = false;
          this.loadingMore = false;
        },
        
        error: (error) => {
          console.error('Errore nel caricamento operazioni:', error);
          this.error = `Errore: ${error.message || 'Impossibile caricare le operazioni'}`;
          this.loading = false;
          this.loadingMore = false;
        },
        
        complete: () => {
          console.log('Caricamento operazioni completato');
        }
      });
  }

  /**
   * Carica più operazioni (pagina successiva)
   */
  loadMore(): void {
    if (!this.pagination || !this.pagination.has_more || this.loadingMore) {
      return;
    }

    this.currentPage++;
    this.loadingMore = true;
    this.loadOperazioni();
  }

  /**
   * Apre il form per creare una nuova operazione
   */
  openFormNew(): void {
    this.operazioneEdit = null;
    this.isFormOpen = true;
  }

  /**
   * Apre il form per modificare un'operazione
   */
  editOperazione(operazione: Operazione): void {
    this.operazioneEdit = operazione;
    this.isFormOpen = true;
  }

  /**
   * Chiude il form modale
   */
  closeForm(): void {
    this.isFormOpen = false;
    this.operazioneEdit = null;
  }

  /**
   * Chiamato quando un'operazione viene salvata dal form
   */
  onOperazioneSaved(): void {
    // Ricarica da pagina 1
    this.currentPage = 1;
    this.loadOperazioni();
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
          
          // Ricarica la prima pagina
          this.currentPage = 1;
          this.loadOperazioni();
        },
        
        error: (error) => {
          console.error('Errore eliminazione operazione:', error);
          this.error = `Errore: ${error.message || 'Impossibile eliminare l\'operazione'}`;
        }
      });
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

  /**
   * Calcola le operazioni caricate finora
   */
  getLoadedCount(): number {
    return this.operazioni.length;
  }

  /**
   * Calcola il totale delle operazioni
   */
  getTotalCount(): number {
    return this.pagination?.total || 0;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
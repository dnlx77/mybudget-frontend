import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OperazioneService, Operazione } from '../../services/operazione.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface PaginatedResponse {
  success: boolean;
  data: Operazione[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    has_more: boolean;
  };
  count: number;
  message: string;
}

@Component({
  selector: 'app-operazioni-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './operazioni-panel.html',
  styleUrl: './operazioni-panel.css',
})
export class OperazioniPanelComponent implements OnInit, OnDestroy {
  
  // Operazioni per pagina corrente (NON accumulate)
  operazioni: Operazione[] = [];
  
  currentPage: number = 1;
  totalPages: number = 1;
  totalCount: number = 0;
  perPage: number = 10;
  
  loading: boolean = true;
  error: string | null = null;

  // Form Modal
  isFormOpen: boolean = false;
  operazioneEdit: Operazione | null = null;

  // Filtri
  filterData: string = '';
  filterConto: string = '';
  filterTag: string = '';

  private destroy$ = new Subject<void>();

  constructor(private operazioneService: OperazioneService) { }

  ngOnInit(): void {
    console.log('🟢 OperazioniPanel inizializzato');
    this.loadOperazioni();
  }

  /**
   * Carica le operazioni per la pagina corrente
   */
  loadOperazioni(): void {
    console.log('📥 loadOperazioni - Pagina:', this.currentPage);
    this.loading = true;
    this.error = null;
    
    const params: any = {
      page: this.currentPage,
      per_page: this.perPage,
    };

    if (this.filterData) params.data = this.filterData;
    if (this.filterConto) params.conto_id = this.filterConto;
    if (this.filterTag) params.tag = this.filterTag;

    console.log('🔄 Richiesta API con params:', params);

    this.operazioneService.getOperazioni(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PaginatedResponse) => {
          console.log('✅ Risposta ricevuta:', response);
          
          if (response.success) {
            // ✅ SOSTITUISCI i dati (paginazione tradizionale)
            this.operazioni = response.data as Operazione[];
            
            // ✅ MAP i campi dal backend (last_page → totalPages, total → totalCount)
            this.totalPages = response.pagination?.last_page || 1;
            this.totalCount = response.pagination?.total || 0;
            this.currentPage = response.pagination?.current_page || 1;
            
            console.log('📄 Pagina:', this.currentPage, 'di', this.totalPages);
            console.log('📋 Operazioni caricate:', this.operazioni.length);
            console.log('📊 Totale nel DB:', this.totalCount);
          }
          
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Errore API:', error);
          this.error = 'Errore nel caricamento delle operazioni';
          this.loading = false;
        }
      });
  }

  /**
   * Vai a una pagina specifica
   */
  goToPage(page: number): void {
    console.log('🔄 goToPage:', page, '- valid range: 1 to', this.totalPages);
    
    if (page > 0 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadOperazioni();
    } else {
      console.log('❌ Pagina non valida:', page);
    }
  }

  /**
   * Pagina precedente
   */
  previousPage(): void {
    console.log('⬅️ previousPage - da', this.currentPage, 'a', this.currentPage - 1);
    this.goToPage(this.currentPage - 1);
  }

  /**
   * Pagina successiva
   */
  nextPage(): void {
    console.log('➡️ nextPage - da', this.currentPage, 'a', this.currentPage + 1);
    this.goToPage(this.currentPage + 1);
  }

  /**
   * Numeri pagine da mostrare
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    
    console.log('📊 getPageNumbers - start:', start, 'end:', end);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  /**
   * Quando filtri cambiano, ricomincia da pagina 1
   */
  onFilterChange(): void {
    console.log('🔎 Filtri cambiati, ricomincia da pagina 1');
    this.currentPage = 1;
    this.loadOperazioni();
  }

  /**
   * Apri form per NUOVA operazione
   */
  openFormNew(): void {
    console.log('➕ Apri form NUOVA operazione');
    this.operazioneEdit = null;
    this.isFormOpen = true;
  }

  /**
   * Apri form per MODIFICARE operazione
   */
  editOperazione(operazione: Operazione): void {
    console.log('✏️ Modifica operazione:', operazione.id);
    this.operazioneEdit = operazione;
    this.isFormOpen = true;
  }

  /**
   * Chiudi il form modal
   */
  closeForm(): void {
    console.log('❌ Chiudi form');
    this.isFormOpen = false;
    this.operazioneEdit = null;
  }

  /**
   * Quando il form salva, ricarica la lista dalla pagina 1
   */
  onOperazioneSaved(): void {
    console.log('💾 Operazione salvata, ricarica lista');
    this.currentPage = 1;
    this.loadOperazioni();
    this.closeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
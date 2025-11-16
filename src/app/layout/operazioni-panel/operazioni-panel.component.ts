import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OperazioneService, Operazione } from '../../services/operazione.service';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { OperazioneFormComponent } from '../../components/operazione-form/operazione-form';
import { CurrencyEuroPipe } from '../../pipes/currency-euro-pipe';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface PaginatedResponse {
  success: boolean;
  data: Operazione[];
  pagination: {
    current_page: number;
    total_pages?: number;
    last_page: number;
    total: number;
    per_page: number;
  };
  message: string;
}

@Component({
  selector: 'app-operazioni-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, OperazioneFormComponent, CurrencyEuroPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './operazioni-panel.html',
  styleUrl: './operazioni-panel.css',
})
export class OperazioniPanelComponent implements OnInit, OnDestroy {
  
  operazioni: Operazione[] = [];
  
  // Statistiche
  guadagno: number = 0;
  spese: number = 0;
  saldo: number = 0;

  currentPage: number = 1;
  totalPages: number = 1;
  totalCount: number = 0;
  perPage: number = 50;
  
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
    this.loadStatistiche();  // ← Chiama statistiche
  }

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
            this.operazioni = response.data as Operazione[];
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

  loadStatistiche(): void {
  const params: any = {};
  
  // Applica gli stessi filtri della tabella
  if (this.filterData) params.data = this.filterData;
  if (this.filterConto) params.conto_id = this.filterConto;
  if (this.filterTag) params.tag = this.filterTag;

  this.operazioneService.getStatistiche(params)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        if (response.success) {
          this.guadagno = response.data.guadagno;
          this.spese = response.data.spese;
          this.saldo = response.data.saldo;
          console.log('📊 Statistiche totali:', response.data);
        }
      },
      error: (error) => console.error('Errore statistiche:', error)
    });
}

  goToPage(page: number): void {
    console.log('🔄 goToPage:', page);
    
    if (page > 0 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadOperazioni();
    }
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  onFilterChange(): void {
    console.log('🔎 Filtri cambiati, ricomincia da pagina 1');
    this.currentPage = 1;
    this.loadOperazioni();
    this.loadStatistiche();  // Ricarica statistiche con i nuovi filtri
  }

  openFormNew(): void {
    console.log('➕ Apri form NUOVA operazione');
    this.operazioneEdit = null;
    this.isFormOpen = true;
  }

  editOperazione(operazione: Operazione): void {
    console.log('✏️ Modifica operazione:', operazione.id);
    this.operazioneEdit = operazione;
    this.isFormOpen = true;
  }

  closeForm(): void {
    console.log('❌ Chiudi form');
    this.isFormOpen = false;
    this.operazioneEdit = null;
  }

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
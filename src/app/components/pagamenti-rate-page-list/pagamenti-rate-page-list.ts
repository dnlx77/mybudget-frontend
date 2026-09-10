import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagamentoRataModel, PagamentoRataService } from '../../services/pagamento-rata.service';
import { PagamentiRatePageForm } from '../pagamenti-rate-page-form/pagamenti-rate-page-form';
import { PaginationComponent } from '../pagination/pagination.component';
import { CurrencyEuroPipe } from '../../pipes/currency-euro-pipe';

const PER_PAGE = 15;

type FiltroStato = '' | 'attivo' | 'completato';

@Component({
  selector: 'app-pagamenti-rate-page-list',
  standalone: true,
  imports: [CommonModule, PagamentiRatePageForm, PaginationComponent, CurrencyEuroPipe],
  templateUrl: './pagamenti-rate-page-list.html',
  styleUrl: './pagamenti-rate-page-list.css',
})
export class PagamentiRatePageList implements OnInit {

  private pagamentoRataService = inject(PagamentoRataService);

  pagamenti = signal<PagamentoRataModel[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  paginationState = signal({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: PER_PAGE
  });

  isFormOpen = signal(false);
  pagamentoEdit = signal<PagamentoRataModel | null>(null);

  filterStato = signal<FiltroStato>('');

  ngOnInit(): void {
    this.loadPagamenti();
  }

  loadPagamenti(page: number = this.paginationState().current_page): void {
    this.loading.set(true);
    const stato = this.filterStato() || undefined;
    this.pagamentoRataService.getPagamenti({ page, per_page: PER_PAGE, stato }).subscribe({
      next: (res) => {
        if (res.success) {
          this.pagamenti.set(res.data);
          this.paginationState.set({
            current_page: res.pagination.current_page,
            last_page: res.pagination.last_page,
            total: res.pagination.total,
            per_page: res.pagination.per_page
          });
          this.error.set(null);
        } else {
          this.error.set('Errore caricamento pagamenti a rate');
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossibile caricare i pagamenti a rate.');
        this.loading.set(false);
      }
    });
  }

  goToPage(page: number): void {
    if (page > 0 && page <= this.paginationState().last_page) {
      this.loadPagamenti(page);
    }
  }

  setFilterStato(stato: FiltroStato): void {
    if (this.filterStato() === stato) return;
    this.filterStato.set(stato);
    this.loadPagamenti(1);
  }

  percentualeCompletamento(p: PagamentoRataModel): number {
    if (!p.importo_totale) return 0;
    return Math.min(100, Math.round((p.importo_pagato / p.importo_totale) * 100));
  }

  openFormNew(): void {
    this.pagamentoEdit.set(null);
    this.isFormOpen.set(true);
  }

  editPagamento(p: PagamentoRataModel): void {
    this.pagamentoEdit.set(p);
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.pagamentoEdit.set(null);
  }

  onPagamentoSaved(): void {
    // Una nuova creazione compare in cima (ordinata per data creazione): torna a pagina 1
    const eraNuovoInserimento = !this.pagamentoEdit();
    this.loadPagamenti(eraNuovoInserimento ? 1 : this.paginationState().current_page);
  }

  deletePagamento(p: PagamentoRataModel): void {
    if (p.rate_pagate > 0) {
      alert('Non puoi eliminare un pagamento a rate con operazioni collegate. Scollegale prima dalle operazioni.');
      return;
    }

    if (!confirm(`Sei sicuro di voler eliminare "${p.nome}"?`)) return;

    this.pagamentoRataService.deletePagamento(p.id).subscribe({
      next: () => {
        // Se era l'ultimo elemento della pagina (e non siamo sulla prima), torna indietro di una pagina
        const { current_page } = this.paginationState();
        const nuovaPagina = this.pagamenti().length === 1 && current_page > 1 ? current_page - 1 : current_page;
        this.loadPagamenti(nuovaPagina);
      },
      error: () => alert('Errore: impossibile eliminare il pagamento a rate.')
    });
  }
}

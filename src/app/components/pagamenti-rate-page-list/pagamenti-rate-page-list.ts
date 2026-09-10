import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagamentoRataModel, PagamentoRataService } from '../../services/pagamento-rata.service';
import { PagamentiRatePageForm } from '../pagamenti-rate-page-form/pagamenti-rate-page-form';
import { CurrencyEuroPipe } from '../../pipes/currency-euro-pipe';

@Component({
  selector: 'app-pagamenti-rate-page-list',
  standalone: true,
  imports: [CommonModule, PagamentiRatePageForm, CurrencyEuroPipe],
  templateUrl: './pagamenti-rate-page-list.html',
  styleUrl: './pagamenti-rate-page-list.css',
})
export class PagamentiRatePageList implements OnInit {

  private pagamentoRataService = inject(PagamentoRataService);

  pagamenti = signal<PagamentoRataModel[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  isFormOpen = signal(false);
  pagamentoEdit = signal<PagamentoRataModel | null>(null);

  ngOnInit(): void {
    this.loadPagamenti();
  }

  loadPagamenti(): void {
    this.loading.set(true);
    this.pagamentoRataService.getPagamenti().subscribe({
      next: (res) => {
        if (res.success) {
          this.pagamenti.set(res.data);
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
    this.loadPagamenti();
  }

  deletePagamento(p: PagamentoRataModel): void {
    if (p.rate_pagate > 0) {
      alert('Non puoi eliminare un pagamento a rate con operazioni collegate. Scollegale prima dalle operazioni.');
      return;
    }

    if (!confirm(`Sei sicuro di voler eliminare "${p.nome}"?`)) return;

    this.pagamentoRataService.deletePagamento(p.id).subscribe({
      next: () => {
        this.pagamenti.update(list => list.filter(x => x.id !== p.id));
      },
      error: () => alert('Errore: impossibile eliminare il pagamento a rate.')
    });
  }
}

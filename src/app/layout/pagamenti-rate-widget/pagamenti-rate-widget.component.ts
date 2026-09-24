import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PagamentoRataModel, PagamentoRataService } from '../../services/pagamento-rata.service';
import { EventService } from '../../services/event';
import { CurrencyEuroPipe } from '../../pipes/currency-euro-pipe';

@Component({
  selector: 'app-pagamenti-rate-widget',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyEuroPipe],
  templateUrl: './pagamenti-rate-widget.html',
  styleUrl: './pagamenti-rate-widget.css',
})
export class PagamentiRateWidgetComponent implements OnInit {

  private pagamentoRataService = inject(PagamentoRataService);
  private eventService = inject(EventService);

  pagamenti = signal<PagamentoRataModel[]>([]);
  loading = signal(true);

  pagamentiAttivi = computed(() => this.pagamenti().filter(p => p.stato === 'attivo'));

  residuoTotale = computed(() =>
    this.pagamentiAttivi().reduce((acc, p) => acc + Number(p.importo_residuo), 0)
  );

  // Somma delle rate mensili dei piani attivi (importo_totale / numero_rate di ciascuno):
  // quanto continuerai a pagare ogni mese finché non completano.
  spesaMensileResidua = computed(() =>
    this.pagamentiAttivi().reduce((acc, p) => acc + (Number(p.importo_totale) / p.numero_rate), 0)
  );

  constructor() {
    // Un'operazione collegata a un pagamento a rate ne cambia il residuo
    this.eventService.operazioneChanged$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.loadPagamenti());
  }

  ngOnInit(): void {
    this.loadPagamenti();
  }

  loadPagamenti(): void {
    // per_page alto: il widget calcola conteggio/residuo sull'elenco completo, non su una pagina
    this.pagamentoRataService.getPagamenti({ per_page: 1000 }).subscribe({
      next: (res) => {
        if (res.success) this.pagamenti.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}

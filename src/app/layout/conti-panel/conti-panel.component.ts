import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContoService, Conto } from '../../services/conto.service';
import { EventService } from '../../services/event';
import { CurrencyEuroPipe } from '../../pipes/currency-euro-pipe';

@Component({
  selector: 'app-conti-panel',
  standalone: true, // Assicurati che sia standalone
  imports: [CommonModule, CurrencyEuroPipe],
  templateUrl: './conti-panel.html',
  styleUrl: './conti-panel.css',
})
export class ContiPanelComponent implements OnInit {
  
  // SERVICES
  private contoService = inject(ContoService);
  private eventService = inject(EventService);

  // STATE (Signals)
  conti = signal<Conto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // COMPUTED: Il totale si aggiorna da solo se 'conti' cambia!
  totaleSaldi = computed(() => {
    return this.conti().reduce((acc, c) => acc + (Number(c.saldo_totale) || 0), 0);
  });

  constructor() {
    // ASCOLTA EVENTO CAMBIO OPERAZIONE
    // Quando aggiungi/modifichi un'operazione, ricarichiamo i conti per aggiornare i saldi
    this.eventService.operazioneChanged$
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.loadConti();
      });
  }

  ngOnInit(): void {
    this.loadConti();
  }

  loadConti(): void {
    // Non settiamo loading a true qui per evitare "flash" fastidiosi durante gli aggiornamenti background
    // this.loading.set(true); 

    this.contoService.getConti().subscribe({
      next: (res) => {
        if (res.success) {
          this.conti.set(res.data);
          this.error.set(null);
        } else {
          this.error.set('Errore caricamento saldi');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Impossibile caricare i conti');
        this.loading.set(false);
      }
    });
  }
}
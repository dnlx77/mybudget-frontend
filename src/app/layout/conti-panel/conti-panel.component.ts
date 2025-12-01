import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContoService, Conto } from '../../services/conto.service';
import { CurrencyEuroPipe } from '../../pipes/currency-euro-pipe';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EventService } from '../../services/event';

@Component({
  selector: 'app-conti-panel',
  imports: [CommonModule, CurrencyEuroPipe],
  templateUrl: './conti-panel.html',
  styleUrl: './conti-panel.css',
})
export class ContiPanelComponent implements OnInit, OnDestroy {
  
  conti: Conto[] = [];
  totaleSaldi: number = 0;
  loading: boolean = true;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private contoService: ContoService,
    private eventService: EventService
  ) { }

  ngOnInit(): void {
    this.loadConti();

    // Quando un'operazione cambia, ricarica i conti
    this.eventService.operazioneChanged$
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      this.loadConti();
    });
  }

  loadConti(): void {
    this.contoService.getConti()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.conti = response.data as Conto[];
            this.calculateTotale();
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Errore caricamento conti:', error);
          this.error = 'Errore nel caricamento dei conti';
          this.loading = false;
        }
      });
  }

  calculateTotale(): void {
    this.totaleSaldi = this.conti.reduce((total, conto) => {
      return total + (Number(conto.saldo_totale) || 0);
    }, 0);
    console.log('Totale saldi ==>' + this.totaleSaldi)
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

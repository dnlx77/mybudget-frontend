import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContoService, Conto } from '../../services/conto.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-conti-panel',
  imports: [CommonModule],
  templateUrl: './conti-panel.html',
  styleUrl: './conti-panel.css',
})
export class ContiPanelComponent implements OnInit, OnDestroy {
  
  conti: Conto[] = [];
  totaleSaldi: number = 0;
  loading: boolean = true;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(private contoService: ContoService) { }

  ngOnInit(): void {
    this.loadConti();
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
      return total + (conto.saldo_totale || 0);
    }, 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

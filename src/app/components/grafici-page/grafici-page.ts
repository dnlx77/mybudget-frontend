import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { Subject, combineLatest, switchMap, forkJoin, of, tap, catchError } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

// Services
import { GraficiService, FiltriGraficiParams } from '../../services/grafici'; // Assumiamo esista
import { ContoService } from '../../services/conto.service';
import { EventService } from '../../services/event';

@Component({
  selector: 'app-grafici-page',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule, FormsModule],
  templateUrl: './grafici-page.html',
  styleUrls: ['./grafici-page.css'] // Uso il tuo CSS esistente
})
export class GraficiPage implements OnInit {
  
  // INJECT SERVICES
  private graficiService = inject(GraficiService);
  private contoService = inject(ContoService);
  private eventService = inject(EventService);

  // ============================================================
  // STATO (SIGNALS)
  // ============================================================
  
  // Filtri
  dataInizio = signal(this.getDataInizioDefault());
  dataFine = signal(this.getDataFineDefault());
  contoId = signal<number | null>(null);
  
  // UI State
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Dati di supporto
  conti = signal<any[]>([]);

  // Dati Grafici (Options pronte per ECharts)
  pieChartOption = signal<EChartsOption>({});
  barChartOption = signal<EChartsOption>({});
  lineChartOption = signal<EChartsOption>({});

  // Statistiche e Metadati per la UI
  statsSpeseTag = signal({ totale: 0, distribuito: 0, numGiorni: 0, periodo: '' });
  statsGuadagniVsSpese = signal<{totale_guadagni: number, totale_spese: number, saldo_netto: number} | null>(null);
  statsAndamento = signal<{saldo_iniziale: number, saldo_finale: number, variazione: number} | null>(null);
  
  // Trigger per reload manuali o esterni (EventService)
  private reloadTrigger$ = new Subject<void>();

  constructor() {
    // 1. CARICAMENTO CONTI
    this.contoService.getConti().pipe(takeUntilDestroyed()).subscribe(res => {
      if(res.success) this.conti.set(res.data);
    });

    // 2. SYNC CON EVENT SERVICE (Se cambi un'operazione altrove, ricarica i grafici)
    this.eventService.operazioneChanged$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.reloadTrigger$.next());

    // 3. PIPELINE REATTIVA PRINCIPALE
    combineLatest([
      toObservable(this.dataInizio),
      toObservable(this.dataFine),
      toObservable(this.contoId),
      this.reloadTrigger$.pipe(catchError(() => of(null))) // Fallback sicuro
    ]).pipe(
      tap(() => {
        this.loading.set(true);
        this.error.set(null);
      }),
      switchMap(([start, end, conto, _]) => {
        
        const params: FiltriGraficiParams = {
          data_inizio: start,
          data_fine: end,
          conto_id: conto
        };

        // Prepariamo le richieste
        const requests: any = {
          spese: this.graficiService.getSpesePerTag(params).pipe(catchError(() => of({ success: false }))),
          guadagni: this.graficiService.getGuadagniVsSpese(params).pipe(catchError(() => of({ success: false }))),
          // ORA CHIEDIAMO SEMPRE L'ANDAMENTO (anche se conto è null)
          andamento: this.graficiService.getAndamentoSaldo(params).pipe(catchError(() => of({ success: false })))
        };

        return forkJoin(requests);
      }),
      takeUntilDestroyed()
    ).subscribe((results: any) => {
      this.loading.set(false);
      
      // ELABORAZIONE RISULTATI
      
      // 1. Spese per Tag
      if (results.spese.success && results.spese.data.length > 0) {
        this.pieChartOption.set(this.buildPieChartOption(results.spese.data));
        this.statsSpeseTag.set({
          totale: Number(results.spese.totale_generale) || 0,
          distribuito: Number(results.spese.totale_distribuito) || 0,
          numGiorni: results.spese.filtri.giorni,
          periodo: `${this.formatDateIT(this.dataInizio())} - ${this.formatDateIT(this.dataFine())}`
        });
      } else {
         // Gestione empty state...
         this.statsSpeseTag.set({ totale: 0, distribuito: 0, numGiorni: 0, periodo: '' });
         this.pieChartOption.set({});
      }

      // 2. Guadagni vs Spese
      if (results.guadagni.success && results.guadagni.data.length > 0) {
        this.barChartOption.set(this.buildBarChartOption(results.guadagni.data));
        this.statsGuadagniVsSpese.set(results.guadagni.statistiche);
      } else {
        this.statsGuadagniVsSpese.set(null);
        this.barChartOption.set({});
      }

      // 3. Andamento (Opzionale)
      if (results.andamento && results.andamento.success && results.andamento.data.length > 0) {
        this.lineChartOption.set(this.buildLineChartOption(results.andamento.data, results.andamento.conto?.nome));
        this.statsAndamento.set(results.andamento.statistiche);
      } else {
        this.statsAndamento.set(null);
        this.lineChartOption.set({});
      }
    });

    // Trigger iniziale
    setTimeout(() => this.reloadTrigger$.next(), 0);
  }

  ngOnInit(): void {
    // Initialization moved to constructor for Signals pattern
  }

  // ============================================================
  // ACTIONS (Aggiornano solo i Signal -> Triggerano la Pipeline)
  // ============================================================

  impostaPeriodo(tipo: 'ultimi7' | 'ultimi30' | 'questoMese' | 'questoAnno'): void {
    const oggi = new Date();
    let start = '';
    const end = this.formatDate(oggi);

    switch (tipo) {
      case 'ultimi7':
        start = this.formatDate(new Date(oggi.getTime() - 7 * 24 * 60 * 60 * 1000));
        break;
      case 'ultimi30':
        start = this.formatDate(new Date(oggi.getTime() - 30 * 24 * 60 * 60 * 1000));
        break;
      case 'questoMese':
        start = this.formatDate(new Date(oggi.getFullYear(), oggi.getMonth(), 1));
        break;
      case 'questoAnno':
        start = this.formatDate(new Date(oggi.getFullYear(), 0, 1));
        break;
    }

    // Aggiornamento atomico (triggera 1 sola richiesta grazie al debounce/sync di combineLatest)
    this.dataInizio.set(start);
    this.dataFine.set(end);
  }

  resetFiltri(): void {
    this.dataInizio.set(this.getDataInizioDefault());
    this.dataFine.set(this.getDataFineDefault());
    this.contoId.set(null);
  }

  // ============================================================
  // HELPERS & CHART BUILDERS (Logica invariata ma ottimizzata)
  // ============================================================

  private getDataInizioDefault(): string {
    const data = new Date();
    data.setDate(data.getDate() - 30);
    return this.formatDate(data);
  }

  private getDataFineDefault(): string {
    return this.formatDate(new Date());
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDateIT(dateString: string): string {
    if(!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }

  private formatCurrency(value: number): string {
    return value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // --- CHART BUILDERS (Ho copiato la tua logica ottima, adattandola leggermente) ---

  private buildPieChartOption(data: any[]): EChartsOption {
    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e1e5e8',
        borderWidth: 1,
        textStyle: { color: '#333', fontSize: 13 },
        formatter: (params: any) => {
          const valore = this.formatCurrency(params.value);
          const percent = params.percent.toFixed(1);
          return `
            <div style="margin-bottom:4px; font-weight:700; color:${params.color}">${params.name}</div>
            <div style="display:flex; justify-content:space-between; gap:15px">
              <span>Importo:</span> <strong>€${valore}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; gap:15px">
               <span>Incidenza:</span> <strong>${percent}%</strong>
            </div>
            <div style="font-size:11px; color:#666; margin-top:4px">
               (${params.data.num_operazioni} operazioni)
            </div>
          `;
        }
      },
      legend: {
        type: 'scroll', // ⬅️ FONDAMENTALE: Rende la legenda scrollabile se ci sono troppe voci
        orient: 'horizontal',
        bottom: 0,
        left: 'center',
        itemGap: 15,
        pageIconColor: '#667eea',
        pageTextStyle: { color: '#666' }
      },
      series: [{
        name: 'Spese',
        type: 'pie',
        radius: ['40%', '65%'], // Leggermente più piccolo per lasciare spazio
        center: ['50%', '42%'], // Spostato leggermente in alto per far spazio alla legenda
        avoidLabelOverlap: true, // ⬅️ Evita che le scritte si sovrappongano
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {d}%', // Mostra "Nome: %"
          minMargin: 5,
          edgeDistance: 10,
          lineHeight: 15,
          color: '#4a5568'
        },
        labelLine: {
          length: 15,
          length2: 0,
          maxSurfaceAngle: 80
        },
        emphasis: {
          scale: true,
          scaleSize: 10,
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: data.map(item => ({
          value: item.totale,
          name: item.nome,
          num_operazioni: item.num_operazioni
        }))
      }]
    };
  }

  private buildBarChartOption(data: any[]): EChartsOption {
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { top: 'bottom' },
      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: { type: 'category', data: data.map(d => d.mese) },
      yAxis: { type: 'value' },
      series: [
        { name: 'Guadagni', type: 'bar', data: data.map(d => d.guadagni), itemStyle: { color: '#43e97b', borderRadius: [4, 4, 0, 0] } },
        { name: 'Spese', type: 'bar', data: data.map(d => d.spese), itemStyle: { color: '#f5576c', borderRadius: [4, 4, 0, 0] } }
      ]
    };
  }

  private buildLineChartOption(data: any[], nomeConto: string = ''): EChartsOption {
    // Se nomeConto è vuoto, stiamo vedendo il totale
    const serieName = nomeConto || 'Patrimonio Totale';
    
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: data.map(d => d.data) },
      yAxis: { 
          type: 'value', 
          // Scala dinamica per vedere meglio le variazioni
          min: (value) => Math.floor(value.min - (value.max - value.min) * 0.1) 
      },
      series: [{
        name: serieName,
        type: 'line',
        smooth: true,
        data: data.map(d => d.saldo),
        showSymbol: false, // Più pulito
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(102, 126, 234, 0.5)' }, { offset: 1, color: 'rgba(102, 126, 234, 0)' }]
          }
        },
        itemStyle: { color: '#667eea' }
      }]
    };
  }
}
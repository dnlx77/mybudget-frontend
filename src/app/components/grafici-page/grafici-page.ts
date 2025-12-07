import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  // ⬅️ Per ngModel
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { GraficiService, SpesePerTagData, GuadagniVsSpeseData, AndamentoSaldoData, FiltriGraficiParams } from '../../services/grafici';
import { EventService } from '../../services/event';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ContoService } from '../../services/conto.service';

@Component({
  selector: 'app-grafici-page',
  standalone: true,
  imports: [
    CommonModule,
    NgxEchartsModule,
    FormsModule  // ⬅️ Per i form con filtri
  ],
  templateUrl: './grafici-page.html',
  styleUrls: ['./grafici-page.css']
})
export class GraficiPage implements OnInit, OnDestroy {
  
  // ============================================================
  // CONFIGURAZIONE GRAFICI
  // ============================================================
  pieChartOption: EChartsOption = {};
  barChartOption: EChartsOption = {};
  lineChartOption: EChartsOption = {};
  
  // ============================================================
  // STATI
  // ============================================================
  loading = false;
  error: string | null = null;
  
  // ============================================================
  // FILTRI
  // ============================================================
  conti: any[] = [];

  filtri: FiltriGraficiParams = {
    // Default: ultimi 30 giorni
    data_inizio: this.getDataInizioDefault(),
    data_fine: this.getDataFineDefault(),
    conto_id: null
  };
  
  // ============================================================
  // METADATI - SPESE PER TAG
  // ============================================================
  periodoVisualizzato: string = '';
  totaleGenerale: number = 0;
  totaleDistribuito: number = 0; 
  numeroGiorni: number = 0;

  // ============================================================
  // METADATI - GUADAGNI VS SPESE
  // ============================================================
  guadagniVsSpeseData: GuadagniVsSpeseData[] = [];
  guadagniVsSpeseStat: {
    totale_guadagni: number;
    totale_spese: number;
    saldo_netto: number;
    num_mesi: number;
  } | null = null;

  // ============================================================
  // METADATI - ANDAMENTO SALDO
  // ============================================================
  andamentoSaldoData: AndamentoSaldoData[] = [];
  andamentoSaldoStat: {
    saldo_iniziale: number;
    saldo_finale: number;
    variazione: number;
    saldo_minimo: number;
    saldo_massimo: number;
    num_giorni: number;
  } | null = null;
  contoSelezionatoAndamento: { id: number; nome: string } | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private graficiService: GraficiService,
    private eventService: EventService,
    private contoService: ContoService
  ) {}

  ngOnInit(): void {
    console.log('📊 GraficiPage inizializzato');
    this.loadConti();
    this.loadSpesePerTag();
    this.loadGuadagniVsSpese();
    this.loadAndamentoSaldo();
    
    // Ricarica quando vengono modificate operazioni
    this.eventService.operazioneChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('🔄 Operazione modificata, ricarico grafici...');
        this.loadSpesePerTag();
        this.loadGuadagniVsSpese();
        this.loadAndamentoSaldo();
      });
  }

  /**
   * Carica i conti disponibili per i filtri
   */
  loadConti(): void {
    this.contoService.getConti().subscribe({
      next: (response) => {
        this.conti = response.data || [];
      },
      error: (err) => {
        console.error('❌ Errore caricamento conti:', err);
      }
    });
  }

  /**
   * GRAFICO 1: Spese per Tag
   */
  loadSpesePerTag(): void {
    this.loading = true;
    this.error = null;

    console.log('🔍 Carico Spese per Tag con filtri:', this.filtri);

    this.graficiService.getSpesePerTag(this.filtri)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Spese per Tag ricevute:', response);
          
          if (response.success && response.data.length > 0) {
            // Costruisci configurazione grafico
            this.pieChartOption = this.buildPieChartOption(response.data);
            
            // Formatta date in italiano (DD/MM/YYYY)
            const dataInizio = this.formatDateIT(response.filtri.data_inizio);
            const dataFine = this.formatDateIT(response.filtri.data_fine);
            
            // Plurale corretto italiano
            const giorni = response.filtri.giorni;
            const testoGiorni = giorni === 1 ? '1 giorno' : `${giorni} giorni`;
            
            // Costruisci stringa completa periodo
            this.periodoVisualizzato = `${dataInizio} - ${dataFine} (${testoGiorni})`;
            this.totaleGenerale = Number(response.totale_generale) || 0;
            this.totaleDistribuito = Number(response.totale_distribuito) || 0;
            this.numeroGiorni = giorni;
            
            console.log(`📊 Categorie totali: ${response.num_categorie_totali}`);
            console.log(`💰 Totale reale: €${this.totaleGenerale.toFixed(2)}`);
          } else {
            this.error = 'Nessun dato disponibile per il periodo selezionato';
          }
          
          this.loading = false;
        },
        error: (err) => {
          console.error('❌ Errore caricamento Spese per Tag:', err);
          this.error = 'Errore nel caricamento dei dati';
          this.loading = false;
        }
      });
  }

  /**
   * GRAFICO 2: Guadagni vs Spese (mensile)
   */
  loadGuadagniVsSpese(): void {
    console.log('📊 Carico Guadagni vs Spese con filtri:', this.filtri);

    this.graficiService.getGuadagniVsSpese(this.filtri)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Guadagni vs Spese ricevuti:', response);
          
          if (response.success && response.data.length > 0) {
            this.guadagniVsSpeseData = response.data;
            this.guadagniVsSpeseStat = response.statistiche;
            
            // Costruisci il grafico a barre
            this.barChartOption = this.buildBarChartOption(response.data);
            
            console.log(`📊 Mesi analizzati: ${response.statistiche.num_mesi}`);
            console.log(`💰 Totale guadagni: €${response.statistiche.totale_guadagni.toFixed(2)}`);
            console.log(`💰 Totale spese: €${response.statistiche.totale_spese.toFixed(2)}`);
            console.log(`💰 Saldo netto: €${response.statistiche.saldo_netto.toFixed(2)}`);
          }
        },
        error: (err) => {
          console.error('❌ Errore caricamento Guadagni vs Spese:', err);
        }
      });
  }

  /**
   * GRAFICO 3: Andamento Saldo (solo se conto selezionato)
   */
  loadAndamentoSaldo(): void {
    // Se non c'è un conto selezionato, non caricare questo grafico
    if (!this.filtri.conto_id) {
      console.log('⚠️ Andamento Saldo: nessun conto selezionato');
      this.andamentoSaldoData = [];
      this.andamentoSaldoStat = null;
      return;
    }

    console.log('📈 Carico Andamento Saldo con filtri:', this.filtri);

    this.graficiService.getAndamentoSaldo(this.filtri)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Andamento Saldo ricevuto:', response);
          
          if (response.success && response.data.length > 0) {
            this.andamentoSaldoData = response.data;
            this.andamentoSaldoStat = response.statistiche;
            this.contoSelezionatoAndamento = response.conto;
            
            // Costruisci il grafico a linee
            this.lineChartOption = this.buildLineChartOption(response.data, response.conto.nome);
            
            console.log(`📈 Giorni: ${response.statistiche.num_giorni}`);
            console.log(`💰 Saldo inizio: €${response.statistiche.saldo_iniziale.toFixed(2)}`);
            console.log(`💰 Saldo fine: €${response.statistiche.saldo_finale.toFixed(2)}`);
            console.log(`📊 Variazione: €${response.statistiche.variazione.toFixed(2)}`);
          }
        },
        error: (err) => {
          console.error('❌ Errore caricamento Andamento Saldo:', err);
        }
      });
  }

  /**
   * Applicare i filtri (chiamato quando l'utente modifica i filtri)
   */
  applicaFiltri(): void {
    console.log('🎯 Applico filtri:', this.filtri);
    this.loadSpesePerTag();
    this.loadGuadagniVsSpese();
    // ⭐ Carica andamento saldo solo se c'è un conto
    if (this.filtri.conto_id !== null && this.filtri.conto_id !== undefined && this.filtri.conto_id !== 0) {
      console.log('✅ Carico andamento saldo');
      this.loadAndamentoSaldo();
    } else {
      console.log('❌ Nessun conto, resetto');
      this.andamentoSaldoData = [];
      this.andamentoSaldoStat = null;
      this.lineChartOption = {};
    }
  }

  /**
   * Reset filtri ai default
   */
  resetFiltri(): void {
    this.filtri = {
      data_inizio: this.getDataInizioDefault(),
      data_fine: this.getDataFineDefault(),
      conto_id: null
    };
    this.applicaFiltri();
  }

  /**
   * Shortcut per periodi predefiniti
   */
  impostaPeriodo(tipo: 'ultimi7' | 'ultimi30' | 'questoMese' | 'questoAnno'): void {
    const oggi = new Date();
    
    switch (tipo) {
      case 'ultimi7':
        this.filtri.data_inizio = this.formatDate(new Date(oggi.getTime() - 7 * 24 * 60 * 60 * 1000));
        this.filtri.data_fine = this.formatDate(oggi);
        break;
        
      case 'ultimi30':
        this.filtri.data_inizio = this.formatDate(new Date(oggi.getTime() - 30 * 24 * 60 * 60 * 1000));
        this.filtri.data_fine = this.formatDate(oggi);
        break;
        
      case 'questoMese':
        this.filtri.data_inizio = this.formatDate(new Date(oggi.getFullYear(), oggi.getMonth(), 1));
        this.filtri.data_fine = this.formatDate(oggi);
        break;
        
      case 'questoAnno':
        this.filtri.data_inizio = this.formatDate(new Date(oggi.getFullYear(), 0, 1));
        this.filtri.data_fine = this.formatDate(oggi);
        break;
    }
    
    this.applicaFiltri();
  }

  /**
   * Helper: data inizio default (30 giorni fa)
   */
  private getDataInizioDefault(): string {
    const data = new Date();
    data.setDate(data.getDate() - 30);
    return this.formatDate(data);
  }

  /**
   * Helper: data fine default (oggi)
   */
  private getDataFineDefault(): string {
    return this.formatDate(new Date());
  }

  /**
   * Helper: formatta data in YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Formatta data in DD/MM/YYYY (formato italiano)
   */
  private formatDateIT(dateString: string): string {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }

  /**
   * Formatta importo in EUR
   */
  private formatCurrency(value: number): string {
    return value.toLocaleString('it-IT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // ============================================================
  // COSTRUTTORI GRAFICI
  // ============================================================

  /**
   * GRAFICO 1: Pie Chart - Spese per Tag
   */
  private buildPieChartOption(data: SpesePerTagData[]): EChartsOption {
    return {
      title: {
        text: 'Spese per Categoria',
        subtext: 'Top 10 + Altri',
        left: 'center',
        top: 20,
        textStyle: {
          fontSize: 28,
          fontWeight: 'bold',
          color: '#2c3e50'
        },
        subtextStyle: {
          fontSize: 14,
          color: '#7f8c8d'
        },
        show: false
      },
      
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(50, 50, 50, 0.95)',
        borderColor: 'transparent',
        textStyle: { color: '#fff', fontSize: 14 },
        padding: [15, 20],
        formatter: (params: any) => {
          const valore = this.formatCurrency(params.value);
          return `
            <div style="line-height: 2;">
              <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">${params.name}</div>
              <div style="font-size: 24px; font-weight: bold; color: ${params.color};">€${valore}</div>
              <div style="font-size: 16px; opacity: 0.9;">${params.percent.toFixed(1)}% del totale</div>
              <div style="font-size: 14px; opacity: 0.8; margin-top: 5px;">${params.data.num_operazioni} operazioni</div>
            </div>
          `;
        }
      },
      
      legend: {
        orient: 'vertical',
        left: '75%',
        top: 'center',
        itemGap: 18,
        textStyle: { fontSize: 14, color: '#2c3e50' }
      },
      
      series: [
        {
          name: 'Spese',
          type: 'pie',
          radius: ['35%', '70%'],
          center: ['30%', '50%'],
          data: data.map(item => ({
            value: item.totale,
            name: item.nome,
            num_operazioni: item.num_operazioni
          })),
          label: {
            show: true,
            position: 'outside',
            fontSize: 12,
            formatter: (params: any) => params.percent > 5 ? `${params.percent.toFixed(0)}%` : ''
          },
          emphasis: {
            scale: true,
            scaleSize: 15
          }
        }
      ],
      color: [
        '#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a',
        '#30cfd0', '#a8edea', '#ff6a88', '#12c2e9', '#f857a6', '#95a5a6'
      ]
    };
  }

  /**
   * GRAFICO 2: Bar Chart - Guadagni vs Spese (mensile)
   */
  private buildBarChartOption(data: GuadagniVsSpeseData[]): EChartsOption {
    return {
      title: {
        text: 'Guadagni vs Spese',
        subtext: 'Confronto mensile',
        left: 'center',
        top: 20,
        textStyle: {
          fontSize: 28,
          fontWeight: 'bold',
          color: '#2c3e50'
        },
        subtextStyle: {
          fontSize: 14,
          color: '#7f8c8d'
        },
        show: false
      },

      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(50, 50, 50, 0.95)',
        textStyle: { color: '#fff' },
        formatter: (params: any) => {
          let html = `<strong>${params[0].axisValue}</strong><br/>`;
          params.forEach((item: any) => {
            const valore = this.formatCurrency(item.value);
            html += `<span style="color: ${item.color};">● ${item.seriesName}: €${valore}</span><br/>`;
          });
          return html;
        }
      },

      legend: {
        top: 'bottom',
        data: ['Guadagni', 'Spese'],
        textStyle: { color: '#2c3e50', fontSize: 14 },
        itemGap: 30
      },

      grid: {
        left: '5%',
        right: '5%',
        top: '15%',
        bottom: '15%',
        containLabel: true
      },

      xAxis: {
        type: 'category',
        data: data.map(d => d.mese),
        axisLabel: { 
          color: '#7f8c8d',
          fontSize: 12
        },
        axisLine: { lineStyle: { color: '#ecf0f1' } }
      },

      yAxis: {
        type: 'value',
        axisLabel: { 
          color: '#7f8c8d',
          fontSize: 12,
          formatter: (value: number) => `€${(value / 1000).toFixed(0)}k`
        },
        axisLine: { lineStyle: { color: '#ecf0f1' } },
        splitLine: { lineStyle: { color: '#f0f0f0' } }
      },

      series: [
        {
          name: 'Guadagni',
          type: 'bar',
          data: data.map(d => d.guadagni),
          itemStyle: { 
            color: '#43e97b',
            borderRadius: [4, 4, 0, 0]  // ⭐ Angoli arrotondati (sintassi corretta)
          },
          barGap: '30%'
        },
        {
          name: 'Spese',
          type: 'bar',
          data: data.map(d => d.spese),
          itemStyle: { 
            color: '#f5576c',
            borderRadius: [4, 4, 0, 0]  // ⭐ Angoli arrotondati (sintassi corretta)
          }
        }
      ] as any  // ⭐ Forza il type se TypeScript continua a lamentarsi
    };
  }

  /**
   * GRAFICO 3: Line Chart - Andamento Saldo nel Tempo
   */
  private buildLineChartOption(data: AndamentoSaldoData[], nomeConto: string): EChartsOption {
    return {
      title: {
        text: `Andamento Saldo - ${nomeConto}`,
        subtext: 'Evoluzione giornaliera',
        left: 'center',
        top: 20,
        textStyle: {
          fontSize: 28,
          fontWeight: 'bold',
          color: '#2c3e50'
        },
        subtextStyle: {
          fontSize: 14,
          color: '#7f8c8d'
        },
        show: false
      },

      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(50, 50, 50, 0.95)',
        textStyle: { color: '#fff' },
        formatter: (params: any) => {
          if (params.length === 0) return '';
          const item = params[0];
          const valore = this.formatCurrency(item.value);
          return `<strong>${item.axisValue}</strong><br/>Saldo: €${valore}`;
        }
      },

      xAxis: {
        type: 'category',
        data: data.map(d => d.data),
        axisLabel: { 
          color: '#7f8c8d',
          interval: Math.floor(data.length / 10) || 0  // Mostra ogni N-esimo valore
        },
        axisLine: { lineStyle: { color: '#ecf0f1' } }
      },

      yAxis: {
        type: 'value',
        axisLabel: { color: '#7f8c8d' },
        axisLine: { lineStyle: { color: '#ecf0f1' } },
        splitLine: { lineStyle: { color: '#ecf0f1' } }
      },

      series: [
        {
          name: 'Saldo',
          type: 'line',
          data: data.map(d => d.saldo),
          smooth: true,
          itemStyle: { color: '#667eea' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
                { offset: 1, color: 'rgba(102, 126, 234, 0)' }
              ]
            }
          }
        }
      ]
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
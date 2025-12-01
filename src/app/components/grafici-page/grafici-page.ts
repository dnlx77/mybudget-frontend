import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  // ⬅️ Per ngModel
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { GraficiService, SpesePerTagData, FiltriGraficiParams } from '../../services/grafici';
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
  
  // Configurazione grafico
  pieChartOption: EChartsOption = {};
  
  // Stati
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
  
  // Metadati ricevuti dal backend
  periodoVisualizzato: string = '';
  totaleGenerale: number = 0;
  totaleDistribuito: number = 0; 
  numeroGiorni: number = 0;
  
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
    
    // Ricarica quando vengono modificate operazioni
    this.eventService.operazioneChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('🔄 Operazione modificata, ricarico grafici...');
        this.loadSpesePerTag();
      });
  }

  /**
   * Carica i dati con i filtri correnti
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

  loadSpesePerTag(): void {
  this.loading = true;
  this.error = null;

  console.log('🔍 Carico grafici con filtri:', this.filtri);

  this.graficiService.getSpesePerTag(this.filtri)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        console.log('✅ Dati ricevuti:', response);
        
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
          
          // Log info utili
          console.log(`📊 Categorie totali: ${response.num_categorie_totali}`);
          console.log(`📊 Categorie mostrate nel grafico: ${response.num_categorie_mostrate}`);
          console.log(`💰 Totale reale: €${this.totaleGenerale.toFixed(2)}`);
          console.log(`📊 Totale distribuito: €${this.totaleDistribuito.toFixed(2)}`);

          
          this.error = null;
        } else {
          this.error = 'Nessun dato disponibile per il periodo selezionato';
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Errore caricamento grafici:', err);
        this.error = 'Errore nel caricamento dei dati';
        this.loading = false;
      }
    });
}

  /**
   * Applicare i filtri (chiamato quando l'utente clicca "Applica Filtri")
   */
  applicaFiltri(): void {
    console.log('🎯 Applico filtri:', this.filtri);
    this.loadSpesePerTag();
  }

  /**
   * Reset filtri ai default
   */
  resetFiltri(): void {
    this.filtri = {
      data_inizio: this.getDataInizioDefault(),
      data_fine: this.getDataFineDefault()
    };
    this.loadSpesePerTag();
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
    
    this.loadSpesePerTag();
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
 * Formatta data in DD/MM/YYYY (formato italiano per visualizzazione)
 * 
 * @param dateString - Data in formato YYYY-MM-DD
 * @returns Data in formato DD/MM/YYYY
 */
private formatDateIT(dateString: string): string {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

  /**
   * Costruisce la configurazione ECharts
   */
  /**
 * Costruisce la configurazione ECharts per il Pie Chart
 * Ottimizzato per molte categorie:
 * - Legenda nascosta (troppo affollata)
 * - Etichette solo al passaggio del mouse
 * - Tooltip dettagliato
 */
private buildPieChartOption(data: SpesePerTagData[]): EChartsOption {
  return {
    // ============================================================
    // TITOLO
    // ============================================================
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
      }
    },
    
    // ============================================================
    // TOOLTIP
    // ============================================================
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(50, 50, 50, 0.95)',
      borderColor: 'transparent',
      textStyle: {
        color: '#fff',
        fontSize: 14
      },
      padding: [15, 20],
      extraCssText: 'border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);',
      formatter: (params: any) => {
        const valore = params.value.toLocaleString('it-IT', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        
        return `
          <div style="line-height: 2;">
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">
              ${params.name}
            </div>
            <div style="font-size: 24px; font-weight: bold; color: ${params.color}; margin-bottom: 8px;">
              €${valore}
            </div>
            <div style="font-size: 16px; opacity: 0.9;">
              ${params.percent.toFixed(1)}% del totale
            </div>
            <div style="font-size: 14px; opacity: 0.8; margin-top: 5px;">
              ${params.data.num_operazioni} operazioni
            </div>
          </div>
        `;
      }
    },
    
    // ============================================================
    // LEGENDA - Posizionata a destra
    // ============================================================
    legend: {
    show: true,
    orient: 'vertical',
    left: '75%',  // ⬅️ Buon compromesso
    top: 'center',
    itemGap: 18,
    itemWidth: 20,
    itemHeight: 20,
    textStyle: {
      fontSize: 14,
      color: '#2c3e50'
    },
    formatter: (name: string) => {
      const item = data.find(d => d.nome === name);
      if (item) {
        const valore = item.totale.toLocaleString('it-IT', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });
        return `${name}  €${valore}`;
      }
      return name;
    }
  },
    
    // ============================================================
    // SERIE - IL GRAFICO
    // ============================================================
    series: [
      {
        name: 'Spese',
        type: 'pie',
        radius: ['35%', '70%'],  // ⬅️ Buco più piccolo (35% invece di 45%)
        center: ['30%', '50%'],  // ⬅️ Spostato a sinistra per fare spazio alla legenda
        avoidLabelOverlap: true,
        padAngle: 2,  // ⬅️ Spazio tra le fette
        itemStyle: {
          borderRadius: 8,  // ⬅️ Angoli arrotondati
          borderColor: '#fff',
          borderWidth: 3
        },
        
        // Dati del grafico
        data: data.map(item => ({
          value: item.totale,
          name: item.nome,
          num_operazioni: item.num_operazioni,
          // Colore speciale per "Altri"
          itemStyle: item.nome === 'Altri' ? {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#95a5a6' },
                { offset: 1, color: '#7f8c8d' }
              ]
            }
          } : undefined
        })),
        
        // ============================================================
        // ETICHETTE
        // ============================================================
        label: {
          show: true,
          position: 'outside',
          fontSize: 13,
          fontWeight: 'bold',
          formatter: (params: any) => {
            // Mostra percentuale solo se > 5%
            if (params.percent > 5) {
              return `${params.percent.toFixed(0)}%`;
            }
            return '';
          },
          color: '#2c3e50'
        },
        
        labelLine: {
          show: true,
          length: 15,
          length2: 10,
          lineStyle: {
            width: 2
          }
        },
        
        // ============================================================
        // EMPHASIS - Effetto hover
        // ============================================================
        emphasis: {
          scale: true,
          scaleSize: 15,
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.4)',
            borderWidth: 0
          },
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        
        // ============================================================
        // ANIMAZIONE
        // ============================================================
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: (idx: number) => idx * 50
      }
    ],
    
    // ============================================================
    // PALETTE COLORI MODERNA
    // ============================================================
    color: [
      // Blu violetto gradient
      {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: '#667eea' },
          { offset: 1, color: '#764ba2' }
        ]
      },
      // Rosa fucsia gradient
      {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: '#f093fb' },
          { offset: 1, color: '#f5576c' }
        ]
      },
      // Verde acqua gradient
      {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: '#4facfe' },
          { offset: 1, color: '#00f2fe' }
        ]
      },
      // Verde lime gradient
      {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: '#43e97b' },
          { offset: 1, color: '#38f9d7' }
        ]
      },
      // Arancione gradient
      {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: '#fa709a' },
          { offset: 1, color: '#fee140' }
        ]
      },
      // Blu oceano gradient
      {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: '#30cfd0' },
          { offset: 1, color: '#330867' }
        ]
      },
      // Viola rosso gradient
      {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: '#a8edea' },
          { offset: 1, color: '#fed6e3' }
        ]
      },
      // Magenta gradient
      {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: '#ff6a88' },
          { offset: 1, color: '#ffd89b' }
        ]
      },
      // Turchese gradient
      {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: '#12c2e9' },
          { offset: 1, color: '#c471ed' }
        ]
      },
      // Rosso gradient
      {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: '#f857a6' },
          { offset: 1, color: '#ff5858' }
        ]
      },
      // Grigio per "Altri"
      {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: '#95a5a6' },
          { offset: 1, color: '#7f8c8d' }
        ]
      }
    ]
  };
}
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
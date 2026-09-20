import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { Subject, combineLatest, switchMap, forkJoin, of, tap, catchError } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

// Services
import { GraficiService, FiltriGraficiParams, PresetConfronto, ConfrontoPeriodiData } from '../../services/grafici';
import { ContoService } from '../../services/conto.service';
import { EventService } from '../../services/event';
import { TagService, TagModel } from '../../services/tag.service';
import { CurrencyEuroPipe } from '../../pipes/currency-euro-pipe';

@Component({
  selector: 'app-grafici-page',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule, FormsModule, CurrencyEuroPipe],
  templateUrl: './grafici-page.html',
  styleUrls: ['./grafici-page.css']
})
export class GraficiPage implements OnInit {
  
  private graficiService = inject(GraficiService);
  private contoService = inject(ContoService);
  private eventService = inject(EventService);
  private tagService = inject(TagService);

  // ============================================================
  // STATO (SIGNALS)
  // ============================================================
  
  // Filtri Base
  dataInizio = signal(this.getDataInizioDefault());
  dataFine = signal(this.getDataFineDefault());
  contoId = signal<number | null>(null);

  // Filtro TAGS Multiplo + Ricerca
  availableTags = signal<TagModel[]>([]); // Tutti i tag dal DB
  selectedTagIds = signal<number[]>([]);  // Quelli attivi
  searchTerm = signal<string>('');        // 🆕 Testo nella barra di ricerca

  // 🆕 LISTA CALCOLATA (FILTRO INTELLIGENTE)
  // Mostra un tag se:
  // 1. Corrisponde alla ricerca (es. "rist" -> "Ristorante")
  // 2. OPPURE è già selezionato (così non sparisce mentre cerchi altro)
  visibleTags = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const allTags = this.availableTags();
    const selected = this.selectedTagIds();

    // 1. FILTRO: Se c'è una ricerca, tieni solo quelli che matchano OPPURE sono selezionati
    // Se non c'è ricerca, prendi tutti (facendo una copia con [...allTags] per poterla ordinare)
    let filtered = term 
      ? allTags.filter(tag => tag.nome.toLowerCase().includes(term) || selected.includes(tag.id))
      : [...allTags];

    // 2. ORDINAMENTO: I selezionati vanno SEMPRE in cima
    return filtered.sort((a, b) => {
      const aSelected = selected.includes(a.id);
      const bSelected = selected.includes(b.id);

      // Se A è selezionato e B no, A vince (viene prima)
      if (aSelected && !bSelected) return -1;
      // Se A non è selezionato e B sì, B vince
      if (!aSelected && bSelected) return 1;
      
      // A parità (entrambi selezionati o entrambi no), ordina alfabeticamente
      return a.nome.localeCompare(b.nome);
    });
  });

  // UI State & Charts
  loading = signal(false);
  conti = signal<any[]>([]);
  pieChartOption = signal<EChartsOption>({});
  barChartOption = signal<EChartsOption>({});
  lineChartOption = signal<EChartsOption>({});
  
  // Stats
  statsSpeseTag = signal({ totale: 0, distribuito: 0, numGiorni: 0, periodo: '' });
  statsGuadagniVsSpese = signal<any>(null);
  statsAndamento = signal<any>(null);
  
  // ============================================================
  // CONFRONTO TRA PERIODI
  // Ha una pipeline propria: dipende da preset/parità e dai filtri conto/tag,
  // NON dal range di date scelto per gli altri grafici.
  // ============================================================
  readonly presetConfronto: { value: PresetConfronto; label: string }[] = [
    { value: 'mese_scorso', label: 'Mese corrente vs mese scorso' },
    { value: 'anno_scorso', label: 'Anno corrente vs anno scorso' },
    { value: 'stesso_mese_anno_scorso', label: 'Stesso mese, anno scorso' }
  ];

  confrontoPreset = signal<PresetConfronto>('mese_scorso');
  confrontoParita = signal(true);
  confrontoLoading = signal(false);
  confrontoErrore = signal(false);
  confrontoData = signal<ConfrontoPeriodiData | null>(null);
  confrontoTagOption = signal<EChartsOption>({});
  confrontoCumulativaOption = signal<EChartsOption>({});

  // Per le uscite un aumento è un peggioramento (rosso), per entrate e saldo è un miglioramento (verde)
  vociRiepilogo = computed(() => {
    const d = this.confrontoData();
    if (!d) return [];

    return [
      { chiave: 'entrate', label: 'Entrate', v: d.riepilogo.entrate, piuMeglio: true },
      { chiave: 'uscite', label: 'Uscite', v: d.riepilogo.uscite, piuMeglio: false },
      { chiave: 'saldo', label: 'Saldo', v: d.riepilogo.saldo, piuMeglio: true }
    ].map(voce => ({
      ...voce,
      classe: voce.v.differenza === 0 ? '' : ((voce.v.differenza > 0) === voce.piuMeglio ? 'positive' : 'negative')
    }));
  });

  confrontoVuoto = computed(() => {
    const r = this.confrontoData()?.riepilogo;
    return !!r && r.entrate.a === 0 && r.entrate.b === 0 && r.uscite.a === 0 && r.uscite.b === 0;
  });

  private reloadTrigger$ = new Subject<void>();

  constructor() {
    this.loadInitialData();

    this.eventService.operazioneChanged$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.reloadTrigger$.next());

    // PIPELINE REATTIVA
    combineLatest([
      toObservable(this.dataInizio),
      toObservable(this.dataFine),
      toObservable(this.contoId),
      toObservable(this.selectedTagIds),
      this.reloadTrigger$.pipe(catchError(() => of(null)))
    ]).pipe(
      tap(() => this.loading.set(true)),
      switchMap(([start, end, conto, tags, _]) => {
        const params: FiltriGraficiParams = {
          data_inizio: start,
          data_fine: end,
          conto_id: conto,
          tag_ids: tags.length > 0 ? tags : undefined
        };
        return forkJoin({
          spese: this.graficiService.getSpesePerTag(params).pipe(catchError(() => of({ success: false }))),
          guadagni: this.graficiService.getGuadagniVsSpese(params).pipe(catchError(() => of({ success: false }))),
          andamento: this.graficiService.getAndamentoSaldo(params).pipe(catchError(() => of({ success: false })))
        });
      }),
      takeUntilDestroyed()
    ).subscribe((results: any) => {
      this.loading.set(false);
      this.updateCharts(results);
    });

    // PIPELINE CONFRONTO PERIODI
    combineLatest([
      toObservable(this.confrontoPreset),
      toObservable(this.confrontoParita),
      toObservable(this.contoId),
      toObservable(this.selectedTagIds),
      this.reloadTrigger$.pipe(catchError(() => of(null)))
    ]).pipe(
      tap(() => {
        this.confrontoLoading.set(true);
        this.confrontoErrore.set(false);
      }),
      switchMap(([preset, parita, conto, tags]) =>
        this.graficiService.getConfrontoPeriodi({
          preset,
          parita_giorni: parita,
          conto_id: conto,
          tag_ids: tags.length > 0 ? tags : undefined
        }).pipe(catchError(() => of(null)))
      ),
      takeUntilDestroyed()
    ).subscribe(res => {
      this.confrontoLoading.set(false);

      if (res?.success) {
        this.confrontoData.set(res.data);
        this.confrontoTagOption.set(this.buildConfrontoTagOption(res.data));
        this.confrontoCumulativaOption.set(this.buildConfrontoCumulativaOption(res.data));
      } else {
        this.confrontoErrore.set(true);
      }
    });

    setTimeout(() => this.reloadTrigger$.next(), 0);
  }

  ngOnInit(): void {}

  loadInitialData() {
    this.contoService.getConti().pipe(takeUntilDestroyed()).subscribe(res => {
      if(res.success) this.conti.set(res.data);
    });
    this.tagService.getTags().pipe(takeUntilDestroyed()).subscribe(res => {
      if(res.success) this.availableTags.set(res.data);
    });
  }

  // ============================================================
  // LOGICA GESTIONE TAGS
  // ============================================================

  onSearchTag(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  toggleTag(id: number) {
    this.selectedTagIds.update(ids => {
        if (ids.includes(id)) return ids.filter(x => x !== id);
        return [...ids, id];
    });
    // Opzionale: Se vuoi pulire la ricerca dopo aver selezionato, scommenta:
    // this.searchTerm.set(''); 
  }

  isTagSelected(id: number): boolean {
    return this.selectedTagIds().includes(id);
  }

  clearTags() {
    this.selectedTagIds.set([]);
    this.searchTerm.set('');
  }

  // ============================================================
  // HELPERS DATE & CHARTS (Invariati)
  // ============================================================

  impostaPeriodo(tipo: 'ultimi7' | 'ultimi30' | 'questoMese' | 'questoAnno' | 'annoPrecedente' | 'tutto') {
    const oggi = new Date();
    oggi.setHours(12, 0, 0, 0);

    let inizio = new Date(oggi);
    let fine = new Date(oggi);

    switch(tipo) {
      case 'ultimi7': inizio.setDate(oggi.getDate() - 7); break;
      case 'ultimi30': inizio.setDate(oggi.getDate() - 30); break;
      case 'questoMese': inizio = new Date(oggi.getFullYear(), oggi.getMonth(), 1, 12, 0, 0); break;
      case 'questoAnno': inizio = new Date(oggi.getFullYear(), 0, 1, 12, 0, 0); break;
      case 'annoPrecedente':
        inizio = new Date(oggi.getFullYear() - 1, 0, 1, 12, 0, 0);
        fine = new Date(oggi.getFullYear() - 1, 11, 31, 12, 0, 0);
        break;
      case 'tutto':
        // Trucco: Impostiamo una data antichissima.
        // Il backend (GraficiController) riconoscerà che < 2000 e la sostituirà
        // con la data della prima operazione nel DB.
        inizio = new Date(1970, 0, 1, 12, 0, 0);
        break;
    }

    this.dataInizio.set(this.formatDateLocal(inizio));
    this.dataFine.set(this.formatDateLocal(fine));
  }

  resetFiltri() {
    this.contoId.set(null);
    this.impostaPeriodo('questoMese');
    this.clearTags();
  }

  private getDataInizioDefault(): string {
    const d = new Date();
    d.setDate(1); 
    return this.formatDateLocal(d);
  }

  private getDataFineDefault(): string {
    return this.formatDateLocal(new Date());
  }

  private formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDateIT(isoDate: string): string {
    if(!isoDate) return '';
    const parts = isoDate.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  
  private updateCharts(results: any) {
     if (results.spese.success) {
        this.pieChartOption.set(this.buildPieChartOption(results.spese.data));
        
        // 🆕 AGGIORNAMENTO SMART DEL CALENDARIO
        // Se il backend ha corretto la data (es. ho chiesto 1970 ma lui ha usato 2023),
        // aggiorno l'input grafico per mostrare la data reale all'utente.
        const dataRealeInizio = results.spese.filtri?.inizio;
        if (dataRealeInizio && dataRealeInizio !== this.dataInizio()) {
            // Aggiorno il signal (questo potrebbe rilanciare la query, ma i dati saranno identici, quindi si stabilizza subito)
            this.dataInizio.set(dataRealeInizio);
        }

        this.statsSpeseTag.set({
          totale: Number(results.spese.totale_generale) || 0,
          distribuito: 0, 
          numGiorni: results.spese.filtri?.giorni || 0,
          periodo: `${this.formatDateIT(this.dataInizio())} - ${this.formatDateIT(this.dataFine())}`
        });
     }
     if (results.guadagni.success) {
        this.barChartOption.set(this.buildBarChartOption(results.guadagni.data));
        this.statsGuadagniVsSpese.set(results.guadagni.statistiche);
     }
     if (results.andamento.success) {
        this.lineChartOption.set(this.buildLineChartOption(results.andamento.data, results.andamento.conto?.nome));
        this.statsAndamento.set(results.andamento.statistiche);
     }
  }

  private buildPieChartOption(data: any[]): EChartsOption {
    if (!data || data.length === 0) return {};
    return {
      tooltip: { trigger: 'item', formatter: '{b}: €{c} ({d}%)' },
      legend: { bottom: '0%', left: 'center' },
      series: [{
          name: 'Spese',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
          data: data.map(item => ({ value: item.totale, name: item.nome }))
      }]
    };
  }

  private buildBarChartOption(data: any[]): EChartsOption {
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { top: '5%' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      // 🆕 Ora usiamo d.data invece di d.mese
      xAxis: { type: 'category', data: data.map(d => d.data) },
      yAxis: { type: 'value' },
      series: [
        { name: 'Guadagni', type: 'bar', data: data.map(d => d.guadagni), itemStyle: { color: '#43e97b', borderRadius: [4, 4, 0, 0] } },
        { name: 'Spese', type: 'bar', data: data.map(d => d.spese), itemStyle: { color: '#f5576c', borderRadius: [4, 4, 0, 0] } }
      ]
    };
  }

  fmtPerc(p: number): string {
    const testo = p.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return `${p > 0 ? '+' : ''}${testo}%`;
  }

  private fmtEuro(v: number): string {
    return v.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
  }

  // Barre orizzontali affiancate: per ogni tag, periodo corrente (viola) vs periodo di confronto (grigio)
  private buildConfrontoTagOption(d: ConfrontoPeriodiData): EChartsOption {
    // l'asse categorie parte dal basso: inverto per avere il tag più speso in alto
    const righe = [...d.per_tag].reverse();

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: any) => this.fmtEuro(Number(v)) },
      legend: { top: 0, data: [d.periodo_a.etichetta, d.periodo_b.etichetta] },
      grid: { left: '3%', right: '8%', bottom: '3%', top: 40, containLabel: true },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: righe.map(r => r.nome) },
      series: [
        { name: d.periodo_a.etichetta, type: 'bar', data: righe.map(r => r.a), itemStyle: { color: '#667eea', borderRadius: [0, 4, 4, 0] } },
        { name: d.periodo_b.etichetta, type: 'bar', data: righe.map(r => r.b), itemStyle: { color: '#c3c6d8', borderRadius: [0, 4, 4, 0] } }
      ]
    };
  }

  // Spesa cumulata giorno per giorno: due linee sovrapposte ("sto spendendo più in fretta di prima?")
  private buildConfrontoCumulativaOption(d: ConfrontoPeriodiData): EChartsOption {
    const perAnno = d.preset === 'anno_scorso';

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const lista = Array.isArray(params) ? params : [params];
          const intestazione = perAnno ? lista[0].axisValue : `Giorno ${lista[0].axisValue}`;
          const righe = lista
            .filter((p: any) => p.value !== null && p.value !== undefined && p.value !== '-')
            .map((p: any) => `${p.marker} ${p.seriesName}: <b>${this.fmtEuro(Number(p.value))}</b>`);
          return [intestazione, ...righe].join('<br/>');
        }
      },
      legend: { top: 0, data: [d.periodo_a.etichetta, d.periodo_b.etichetta] },
      grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
      xAxis: { type: 'category', data: d.cumulativa.etichette, boundaryGap: false },
      yAxis: { type: 'value' },
      series: [
        {
          name: d.periodo_b.etichetta, type: 'line', data: d.cumulativa.b, symbol: 'none', connectNulls: false,
          lineStyle: { width: 2, color: '#b0b3c8', type: 'dashed' }, itemStyle: { color: '#b0b3c8' }
        },
        {
          name: d.periodo_a.etichetta, type: 'line', data: d.cumulativa.a, symbol: 'none', connectNulls: false,
          lineStyle: { width: 3, color: '#667eea' }, itemStyle: { color: '#667eea' },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(102, 126, 234, 0.25)' }, { offset: 1, color: 'rgba(102, 126, 234, 0.0)' }] } }
        }
      ]
    };
  }

  private buildLineChartOption(data: any[], nomeConto: string = ''): EChartsOption {
    const serieName = nomeConto || 'Patrimonio Totale';
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: data.map(d => d.data) },
      yAxis: { type: 'value', scale: true },
      series: [{
          name: serieName,
          type: 'line',
          data: data.map(d => d.saldo),
          smooth: true,
          symbol: 'none',
          areaStyle: {
              color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(102, 126, 234, 0.5)' }, { offset: 1, color: 'rgba(102, 126, 234, 0.0)' }] }
          },
          lineStyle: { width: 3, color: '#667eea' }
      }]
    };
  }
}
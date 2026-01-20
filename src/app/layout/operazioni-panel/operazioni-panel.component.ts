import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, combineLatest, debounceTime, distinctUntilChanged, switchMap, tap, catchError, of, forkJoin } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

// Services & Models
import { OperazioneService, Operazione, FiltriOperazioni } from '../../services/operazione.service';
import { ContoService, Conto } from '../../services/conto.service';
import { TagService, TagModel } from '../../services/tag.service';
import { EventService } from '../../services/event';

// Components & Pipes
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { OperazioneFormComponent } from '../../components/operazione-form/operazione-form';
import { CurrencyEuroPipe } from '../../pipes/currency-euro-pipe';

@Component({
  selector: 'app-operazioni-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, OperazioneFormComponent, CurrencyEuroPipe],
  templateUrl: './operazioni-panel.html',
  styleUrl: './operazioni-panel.css',
})
export class OperazioniPanelComponent implements OnInit {
  
  // INJECT SERVICES
  private operazioneService = inject(OperazioneService);
  private contoService = inject(ContoService);
  private tagService = inject(TagService);
  private eventService = inject(EventService);

  // ============================================================
  // STATO (SIGNALS)
  // ============================================================
  
  // Filtri
  currentPage = signal(1);
  filterAnno = signal<number>(new Date().getFullYear());
  filterMese = signal<number>(new Date().getMonth() + 1);
  filterConto = signal<string>('');
  filterTag = signal<string>('');
  filterData = signal<string>('');
  
  // UI State
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  // Dati
  operazioni = signal<Operazione[]>([]);
  statistiche = signal({ guadagno: 0, spese: 0, saldo: 0 });
  conti = signal<Conto[]>([]);
  tags = signal<TagModel[]>([]);

  // Paginazione response
  paginationState = signal({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 50
  });

  // Gestione Tag Search
  tagSearchInput = signal('');
  selectedTagFilter = signal<TagModel | null>(null);

  // Computed Signal: Filtra i tag in memoria mentre scrivi
  filteredTags = computed(() => {
    const term = this.tagSearchInput().toLowerCase();
    const all = this.tags();
    if (!term) return all;
    return all.filter(t => t.nome.toLowerCase().includes(term));
  });

  // Gestione Form Modale (Variabili semplici per UI)
  isFormOpen = false;
  operazioneEdit: Operazione | null = null;

  // Trigger manuale per ricaricare (es. dopo delete)
  private loadTrigger$ = new Subject<void>();

  constructor() {
    // ============================================================
    // PIPELINE REATTIVA PRINCIPALE
    // ============================================================
    // Ascolta tutti i signal dei filtri + il trigger manuale
    combineLatest([
      toObservable(this.currentPage),
      toObservable(this.filterAnno),
      toObservable(this.filterMese),
      toObservable(this.filterConto),
      toObservable(this.filterTag),
      toObservable(this.filterData),
      this.loadTrigger$.pipe(debounceTime(0)) // Trick per includere il trigger nello stream
    ]).pipe(
      debounceTime(200), // Evita doppio refresh se cambi filtri velocemente
      // distinctUntilChanged non usato sull'array intero per permettere il reload forzato
      tap(() => {
        this.isLoading.set(true);
        this.error.set(null);
      }),
      switchMap(([page, anno, mese, conto, tag, data]) => {
        
        // Costruzione filtri per API
        const filters: FiltriOperazioni = {
          page,
          per_page: this.paginationState().per_page,
          anno: anno || undefined,
          mese: mese || undefined,
          conto_id: conto || undefined,
          tag: tag || undefined,
          data: data || undefined
        };

        // Chiamata parallela: Operazioni + Statistiche
        return forkJoin({
          ops: this.operazioneService.getOperazioni(filters),
          stats: this.operazioneService.getStatistiche(filters)
        }).pipe(
          catchError(err => {
            console.error('Errore API:', err);
            this.error.set("Impossibile caricare i dati. Riprova più tardi.");
            this.isLoading.set(false);
            return of(null);
          })
        );
      }),
      takeUntilDestroyed() // Cleanup automatico Angular
    ).subscribe(result => {
      this.isLoading.set(false);
      
      if (result) {
        // Aggiorna Dati Operazioni
        this.operazioni.set(result.ops.data);
        
        // Aggiorna Paginazione
        this.paginationState.set({
          current_page: result.ops.pagination.current_page,
          last_page: result.ops.pagination.last_page,
          total: result.ops.pagination.total,
          per_page: result.ops.pagination.per_page
        });

        // Aggiorna Statistiche Totali
        if (result.stats.success) {
          this.statistiche.set(result.stats.data);
        }
      }
    });
  }

  ngOnInit(): void {
    // Caricamento dati ausiliari
    this.loadAuxData();
    // Start iniziale
    this.loadTrigger$.next(); 
  }

  loadAuxData() {
    this.contoService.getConti().subscribe(res => {
      if (res.success) this.conti.set(res.data);
    });
    this.tagService.getTags().subscribe(res => {
      if (res.success) this.tags.set(res.data);
    });
  }

  // ============================================================
  // AZIONI UTENTE (Aggiornano i Signal -> Triggerano Pipeline)
  // ============================================================

  setFilterAnno(val: number) {
    this.currentPage.set(1); // Reset pagina importante
    this.filterAnno.set(val);
  }

  setFilterMese(val: number) {
    this.currentPage.set(1);
    this.filterMese.set(val);
  }

  // Metodo generico per input
  updateFilter(type: 'data' | 'conto', val: any) {
    this.currentPage.set(1);
    if (type === 'data') this.filterData.set(val);
    if (type === 'conto') this.filterConto.set(val);
  }

  // Gestione Tag Select
  selectTag(tag: TagModel) {
    this.selectedTagFilter.set(tag);
    this.currentPage.set(1);
    this.filterTag.set(tag.id.toString());
    this.tagSearchInput.set(''); 
  }

  clearTagFilter() {
    this.selectedTagFilter.set(null);
    this.currentPage.set(1);
    this.filterTag.set('');
  }

  // Paginazione
  goToPage(page: number) {
    if (page > 0 && page <= this.paginationState().last_page) {
      this.currentPage.set(page);
    }
  }

  // ============================================================
  // CRUD
  // ============================================================

  openFormNew() {
    this.operazioneEdit = null;
    this.isFormOpen = true;
  }

  editOperazione(op: Operazione) {
    this.operazioneEdit = op;
    this.isFormOpen = true;
  }

  closeForm() {
    this.isFormOpen = false;
    this.operazioneEdit = null;
  }

  onOperazioneSaved() {
    // Basta emettere il trigger, la pipeline ricarica tutto mantenendo i filtri
    this.loadTrigger$.next();
    this.eventService.notifyOperazioneChanged();
    this.closeForm();
  }

  deleteOperazione(op: Operazione) {
    const msg = op.trasferimento === 'T' 
      ? "Attenzione: Stai cancellando un TRASFERIMENTO. Verrà eliminato anche il movimento sul conto collegato. Continuare?"
      : "Sei sicuro di voler eliminare questa operazione?";

    if (!confirm(msg)) return;

    this.operazioneService.deleteOperazione(op.id).subscribe({
      next: () => {
        this.loadTrigger$.next(); // Ricarica lista e statistiche
        this.eventService.notifyOperazioneChanged();
      },
      error: () => alert("Errore durante l'eliminazione")
    });
  }
}
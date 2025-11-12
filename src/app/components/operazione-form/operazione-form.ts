import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OperazioneService, Operazione } from '../../services/operazione.service';
import { ContoService, Conto } from '../../services/conto.service';
import { TagService, TagModel } from '../../services/tag.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-operazione-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './operazione-form.html',
  styleUrl: './operazione-form.css',
})
export class OperazioneForm implements OnInit, OnDestroy {
  
  @Input() isOpen: boolean = false;
  @Input() operazioneEdit: Operazione | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  // Form fields
  data_operazione: string = '';
  importo: number | null = null;
  descrizione: string = '';
  conto_id: number | null = null;
  conto_destinazione_id: number | null = null;
  selectedTags: TagModel[] = []; // Tag selezionati
  tagSearchInput: string = ''; // Input per la ricerca tag

  // Dati per i dropdown
  conti: Conto[] = [];
  allTags: TagModel[] = [];
  filteredTags: TagModel[] = [];
  
  loading: boolean = false;
  loadingConti: boolean = true;
  loadingTags: boolean = true;
  error: string | null = null;
  success: string | null = null;
  isEditMode: boolean = false;
  showTagSuggestions: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private operazioneService: OperazioneService,
    private contoService: ContoService,
    private tagService: TagService
  ) { }

  ngOnInit(): void {
    this.loadConti();
    this.loadTags();
  }

  /**
   * Carica la lista dei conti per il dropdown
   */
  loadConti(): void {
    this.loadingConti = true;

    this.contoService.getConti()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.conti = response.data as Conto[];
          }
          this.loadingConti = false;
        },
        error: (error) => {
          console.error('Errore caricamento conti:', error);
          this.loadingConti = false;
        }
      });
  }

  /**
   * Carica la lista dei tag
   */
  loadTags(): void {
    this.loadingTags = true;

    this.tagService.getTags()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.allTags = response.data as TagModel[];
          }
          this.loadingTags = false;
        },
        error: (error) => {
          console.error('Errore caricamento tag:', error);
          this.loadingTags = false;
        }
      });
  }

  /**
   * Quando il modal viene aperto, popola i campi se è edit mode
   */
  ngOnChanges(): void {
    if (this.isOpen) {
      if (this.operazioneEdit) {
        // EDIT MODE
        this.isEditMode = true;
        this.data_operazione = this.operazioneEdit.data_operazione;
        this.importo = this.operazioneEdit.importo;
        this.descrizione = this.operazioneEdit.descrizione;
        this.conto_id = this.operazioneEdit.conto_id;
        this.selectedTags = this.operazioneEdit.tags || [];
      } else {
        // CREATE MODE
        this.isEditMode = false;
        this.resetForm();
      }
      this.error = null;
      this.success = null;
    }
  }

  /**
   * Filtra i tag in base all'input di ricerca
   */
  onTagSearchInput(value: string): void {
    this.tagSearchInput = value;
    
    if (!value.trim()) {
      this.filteredTags = [];
      this.showTagSuggestions = false;
      return;
    }

    // Filtra i tag che NON sono già selezionati e che matchano l'input
    const searchLower = value.toLowerCase();
    this.filteredTags = this.allTags.filter(tag => 
      tag.nome.toLowerCase().includes(searchLower) &&
      !this.selectedTags.some(st => st.id === tag.id)
    );

    this.showTagSuggestions = this.filteredTags.length > 0;
  }

  /**
   * Seleziona un tag dalle suggestions
   */
  selectTag(tag: TagModel): void {
    this.selectedTags.push(tag);
    this.tagSearchInput = '';
    this.filteredTags = [];
    this.showTagSuggestions = false;
  }

  /**
   * Rimuove un tag dai selezionati
   */
  removeTag(tagId: number): void {
    this.selectedTags = this.selectedTags.filter(t => t.id !== tagId);
  }

  /**
   * Salva l'operazione (crea o modifica)
   */
  onSubmit(): void {
    // Validazione
    if (!this.data_operazione || this.importo === null || !this.descrizione || !this.conto_id) {
      this.error = 'Compilare tutti i campi obbligatori';
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    const operazione: Operazione = {
      id: 0,
      data_operazione: this.data_operazione,
      importo: this.importo,
      descrizione: this.descrizione,
      conto_id: this.conto_id,
      tags: this.selectedTags
    };

    const operation$ = this.isEditMode
      ? this.operazioneService.updateOperazione(this.operazioneEdit!.id, operazione)
      : this.operazioneService.createOperazione(operazione);

    operation$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Operazione salvata:', response);
          this.success = this.isEditMode
            ? 'Operazione modificata con successo!'
            : 'Operazione creata con successo!';
          
          this.loading = false;
          
          setTimeout(() => {
            this.onClose();
            this.saved.emit();
          }, 1000);
        },
        error: (error) => {
          console.error('Errore salvataggio operazione:', error);
          this.error = `Errore: ${error.error?.message || 'Impossibile salvare l\'operazione'}`;
          this.loading = false;
        }
      });
  }

  /**
   * Chiude il modal
   */
  onClose(): void {
    this.resetForm();
    this.close.emit();
  }

  /**
   * Resetta il form
   */
  resetForm(): void {
    this.data_operazione = '';
    this.importo = null;
    this.descrizione = '';
    this.conto_id = null;
    this.conto_destinazione_id = null;
    this.selectedTags = [];
    this.tagSearchInput = '';
    this.filteredTags = [];
    this.showTagSuggestions = false;
    this.error = null;
    this.success = null;
    this.isEditMode = false;
  }

  /**
   * Ottiene la data odierna nel formato YYYY-MM-DD
   */
  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
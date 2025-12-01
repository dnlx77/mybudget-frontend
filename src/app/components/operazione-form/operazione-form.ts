import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Operazione } from '../../services/operazione.service';
import { ContoService, Conto } from '../../services/conto.service';
import { TagService, TagModel } from '../../services/tag.service';
import { OperazioneService } from '../../services/operazione.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EventService } from '../../services/event';

@Component({
  selector: 'app-operazione-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './operazione-form.html',
  styleUrl: './operazione-form.css',
})
export class OperazioneFormComponent implements OnInit, OnChanges, OnDestroy {
  
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
  
  // Data
  conti: Conto[] = [];
  allTags: TagModel[] = [];
  selectedTags: TagModel[] = [];
  
  // Search
  tagSearchInput: string = '';
  filteredTags: TagModel[] = [];
  showTagSuggestions: boolean = false;
  
  // State
  loading: boolean = false;
  loadingConti: boolean = true;
  loadingTags: boolean = true;
  error: string | null = null;
  success: string | null = null;
  isEditMode: boolean = false;
  loadedTags: boolean = false;
  loadedConti: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private contoService: ContoService,
    private tagService: TagService,
    private operazioneService: OperazioneService,
    private eventService: EventService
  ) { }

  ngOnInit(): void {
    if (!this.loadedConti) {
    this.loadConti();
    }
    if (!this.loadedTags) {
      this.loadTags();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.error = null;
      this.success = null;
      
      if (this.operazioneEdit) {
        // EDIT MODE
        this.isEditMode = true;
        this.populateForm();
      } else {
        // CREATE MODE
        this.isEditMode = false;
        this.resetForm();
      }
    }
  }

  loadConti(): void {
    this.contoService.getConti()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.conti = response.data as Conto[];
            this.loadedConti = true;
          }
          this.loadingConti = false;
        },
        error: (error) => {
          console.error('Errore caricamento conti:', error);
          this.loadingConti = false;
        }
      });
  }

  loadTags(): void {
    this.tagService.getTags()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.allTags = response.data as TagModel[];
            this.loadedTags = true; 
          }
          this.loadingTags = false;
        },
        error: (error) => {
          console.error('Errore caricamento tag:', error);
          this.loadingTags = false;
        }
      });
  }

  populateForm(): void {
    if (this.operazioneEdit) {
      this.data_operazione = this.operazioneEdit.data_operazione;
      this.importo = this.operazioneEdit.importo;
      this.descrizione = this.operazioneEdit.descrizione;
      this.conto_id = this.operazioneEdit.conto_id;
      this.selectedTags = this.operazioneEdit.tags || [];
      this.tagSearchInput = '';
    }
  }

  resetForm(): void {
    this.data_operazione = this.getTodayDate();
    this.importo = null;
    this.descrizione = '';
    this.conto_id = null;
    this.conto_destinazione_id = null;
    this.selectedTags = [];
    this.tagSearchInput = '';
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  onTagSearchInput(value: string): void {
    this.tagSearchInput = value;
    
    if (!value.trim()) {
      this.filteredTags = [];
      this.showTagSuggestions = false;
      return;
    }

    const searchLower = value.toLowerCase();
    this.filteredTags = this.allTags.filter(tag => {
      // Controlla che il nome contenga la ricerca
      const matchesSearch = tag.nome.toLowerCase().includes(searchLower);
      
      // Controlla che non sia già selezionato
      const notSelected = !this.selectedTags.some(st => st.id === tag.id);
      
      return matchesSearch && notSelected;
    });

    this.showTagSuggestions = this.filteredTags.length > 0;
  }

  selectTag(tag: TagModel): void {
    this.selectedTags.push(tag);
    this.tagSearchInput = '';
    this.filteredTags = [];
    this.showTagSuggestions = false;
  }

  removeTag(tagId: number): void {
    this.selectedTags = this.selectedTags.filter(t => t.id !== tagId);
  }

  onSubmit(): void {
    // Validazione
    if (!this.data_operazione || this.importo === null || !this.conto_id || this.selectedTags.length === 0) {
      this.error = 'Compilare tutti i campi obbligatori (Data, Importo, Conto, almeno 1 Tag)';
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    const operazione: any = {
      id: this.operazioneEdit?.id || 0,
      data_operazione: this.data_operazione,
      importo: this.importo,
      descrizione: this.descrizione,
      conto_id: this.conto_id,
      conto_destinazione_id: this.conto_destinazione_id,
      tags: this.selectedTags.map(t => t.id),
    };

    console.log('📤 Payload inviato:', operazione);  // ← Aggiungi questo per debuggare

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
            this.eventService.notifyOperazioneChanged();
          }, 1000);
        },
        error: (error) => {
          console.error('Errore salvataggio operazione:', error);
          this.error = `Errore: ${error.error?.message || 'Impossibile salvare'}`;
          this.loading = false;
        }
      });
  }

  onClose(): void {
    this.close.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
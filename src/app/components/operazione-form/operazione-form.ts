import { Component, Input, Output, EventEmitter, OnInit, inject, signal, computed, effect, ViewChild, ViewChildren, QueryList, ElementRef, viewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Services & Models
import { OperazioneService, Operazione } from '../../services/operazione.service';
import { ContoService, Conto } from '../../services/conto.service';
import { TagService, TagModel } from '../../services/tag.service';

@Component({
  selector: 'app-operazione-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './operazione-form.html',
  styleUrl: './operazione-form.css',
})
export class OperazioneFormComponent implements OnInit {
  
  // INPUT/OUTPUT
  @Input() set isOpen(value: boolean) {
    this._isOpen.set(value);
  }
  @Input() set operazioneEdit(value: Operazione | null) {
    this._operazioneEdit.set(value);
  }
  
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  @ViewChild('tagInputRef') tagInputRef!: ElementRef<HTMLInputElement>;
  @ViewChildren('suggestionItem') suggestionItems!: QueryList<ElementRef>;

  // SIGNALS DI STATO
  private _isOpen = signal(false);
  private _operazioneEdit = signal<Operazione | null>(null);
  
  // Esposti per il template
  isOpenSignal = this._isOpen.asReadonly();
  isEditMode = computed(() => !!this._operazioneEdit());
  
  // UI State
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  
  // Dati da API
  conti = signal<Conto[]>([]);
  allTags = signal<TagModel[]>([]);
  
  // Gestione Tag (Fuori dal FormGroup per facilità UI)
  selectedTags = signal<TagModel[]>([]);
  
  // Controllo per input ricerca tag
  tagSearchControl = new FormControl('');

  // REACTIVE FORM
  private fb = inject(FormBuilder);
  
  form = this.fb.group({
    data_operazione: [this.getTodayDate(), Validators.required],
    importo: [null as number | null, Validators.required],
    descrizione: [''],
    conto_id: [null as number | null, Validators.required],
    conto_destinazione_id: [null as number | null] // Opzionale
  });

  // Services
  private operazioneService = inject(OperazioneService);
  private contoService = inject(ContoService);
  private tagService = inject(TagService);

  // COMPUTED: Filtro Tag intelligenti
  // Mostra i tag che matchano la ricerca E che NON sono già selezionati
  filteredTags = computed(() => {
    const term = this.tagSearchValue()?.toLowerCase() || '';
    if (!term) return [];
    
    return this.allTags().filter(tag => 
      tag.nome.toLowerCase().includes(term) && 
      !this.selectedTags().some(selected => selected.id === tag.id)
    );
  });
  
  // Helper per leggere valore search in modo reattivo
  private tagSearchValue = signal('');

  constructor() {
    // 1. EFFETTO: Gestione Apertura/Chiusura e Popolamento
    effect(() => {
      if (this._isOpen()) {
        this.resetState();
        if (this._operazioneEdit()) {
          this.populateForm(this._operazioneEdit()!);
        } else {
          this.form.reset({
            data_operazione: this.getTodayDate(),
            importo: null,
            descrizione: '',
            conto_id: null,
            conto_destinazione_id: null
          });
          this.selectedTags.set([]);
        }
      }
    }, { allowSignalWrites: true });

    // 2. VALIDAZIONE CROSS-FIELD: Destinazione != Origine
    this.form.controls.conto_destinazione_id.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(destId => {
        const sourceId = this.form.controls.conto_id.value;
        if (destId && destId == sourceId) {
          this.form.controls.conto_destinazione_id.setErrors({ sameAccount: true });
        } else {
          // Rimuovi errore se valido
          if (this.form.controls.conto_destinazione_id.hasError('sameAccount')) {
            this.form.controls.conto_destinazione_id.setErrors(null);
          }
        }
      });
      
    // 3. Sync input ricerca tag col signal
    this.tagSearchControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(val => this.tagSearchValue.set(val || ''));
  }

  ngOnInit(): void {
    // Carica dati necessari all'avvio
    this.contoService.getConti().subscribe(res => {
      if(res.success) this.conti.set(res.data);
    });
    this.tagService.getTags().subscribe(res => {
      if(res.success) this.allTags.set(res.data);
    });
  }

  // LOGICA FORM
  populateForm(op: Operazione) {
    this.form.patchValue({
      data_operazione: op.data_operazione,
      importo: op.importo,
      descrizione: op.descrizione,
      conto_id: op.conto_id,
      conto_destinazione_id: null // In edit non gestiamo cambio destinazione complesso per ora
    });
    
    if (op.tags) {
      this.selectedTags.set([...op.tags]);
    }
  }

  resetState() {
    this.error.set(null);
    this.success.set(null);
    this.tagSearchControl.setValue('');
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // GESTIONE TAGS
  selectTag(tag: TagModel) {
    this.selectedTags.update(tags => [...tags, tag]);
    this.tagSearchControl.setValue(''); // Pulisce input

    // NUOVO: Rimetti il focus sulla casella di input!
    // Usiamo setTimeout per assicurarci che avvenga dopo il rendering del ciclo di Angular
    setTimeout(() => {
        this.tagInputRef.nativeElement.focus();
    }, 0);
  }

  removeTag(tagId: number) {
    this.selectedTags.update(tags => tags.filter(t => t.id !== tagId));
  }

  // Gestione tastiera sull'input
  handleInputKeydown(event: KeyboardEvent) {
    // Se preme TAB e ci sono suggerimenti visibili
    if (event.key === 'Tab' && this.filteredTags().length > 0) {
      event.preventDefault(); // Ferma il salto al campo 'Descrizione'
      
      // Sposta il focus sul primo elemento della lista
      const firstItem = this.suggestionItems.first;
      if (firstItem) {
        firstItem.nativeElement.focus();
      }
    }
    // (Opzionale) Se preme INVIO e c'è solo un suggerimento, selezionalo subito
    else if (event.key === 'Enter' && this.filteredTags().length === 1) {
        event.preventDefault();
        this.selectTag(this.filteredTags()[0]);
    }
  }

  // Gestione tastiera sugli elementi della lista (per selezionare con Invio)
  handleSuggestionKeydown(event: KeyboardEvent, tag: TagModel) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectTag(tag);
    }
  }

  // SUBMIT
  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // Mostra errori in rosso
      this.error.set("Compila correttamente tutti i campi obbligatori.");
      return;
    }

    if (this.selectedTags().length === 0) {
      this.error.set("Seleziona almeno un tag.");
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // Prepara payload
    const formData = this.form.getRawValue();
    const payload: any = {
      ...formData,
      tags: this.selectedTags().map(t => t.id),
      id: this.isEditMode() ? this._operazioneEdit()!.id : undefined
    };

    const req$ = this.isEditMode()
      ? this.operazioneService.updateOperazione(payload.id, payload)
      : this.operazioneService.createOperazione(payload);

    req$.subscribe({
      next: (res) => {
        this.success.set(this.isEditMode() ? "Modificato con successo!" : "Creato con successo!");
        this.loading.set(false);
        setTimeout(() => {
          this.saved.emit();
          this.onClose();
        }, 1000);
      },
      error: (err) => {
        console.error(err);
        this.error.set(err.error?.message || "Errore durante il salvataggio.");
        this.loading.set(false);
      }
    });
  }

  onClose() {
    this.close.emit();
  }
}
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs';
import { TagService, TagModel } from '../../services/tag.service';

@Component({
  selector: 'app-tags-page-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './tags-page-form.html',
  styleUrl: './tags-page-form.css',
})
export class TagsPageForm implements OnInit, OnChanges, OnDestroy {
  
  @Input() isOpen: boolean = false;
  @Input() tagEdit: TagModel | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  // Form fields
  nomeTag: string = '';

  // State
  loading: boolean = false;
  error: string | null = null;
  success: string | null = null;
  isEditMode: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
      private tagService: TagService,
    ) { }
  
  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.error = null;
      this.success = null;
      
      if (this.tagEdit) {
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

  populateForm() : void {
    if (this.tagEdit) {
      this.nomeTag = this.tagEdit.nome;
    }
  }

  resetForm() : void {
    this.nomeTag = '';
  }

  onSubmit(): void {
    // Validazione
    if (!this.nomeTag) {
      this.error = 'Compilare il campo nome';
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    const tag: any = {
      id: this.tagEdit?.id || 0,
      nome: this.nomeTag
    };

    console.log('📤 Payload inviato:', tag);  // ← Aggiungi questo per debuggare

    const conto$ = this.isEditMode
      ? this.tagService.updateTag(this.tagEdit!.id, tag)
      : this.tagService.createTag(tag);

    conto$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Tag salvato:', response);
          this.success = this.isEditMode
            ? 'Tag modificato con successo!'
            : 'Tag creato con successo!';
          
          this.loading = false;
          
          setTimeout(() => {
            this.onClose();
            this.saved.emit();
          }, 1000);
        },
        error: (error) => {
          console.error('Errore salvataggio tag:', error);
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

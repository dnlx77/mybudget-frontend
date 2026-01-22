import { Component, Input, Output, EventEmitter, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TagService, TagModel } from '../../services/tag.service';

@Component({
  selector: 'app-tags-page-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // ⬅️ Reactive Forms
  templateUrl: './tags-page-form.html',
  styleUrl: './tags-page-form.css',
})
export class TagsPageForm {

  // INPUT / OUTPUT con setter per Signals
  @Input() set isOpen(value: boolean) {
    this._isOpen.set(value);
  }
  @Input() set tagEdit(value: TagModel | null) {
    this._tagEdit.set(value);
  }

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  // STATE SIGNALS
  _isOpen = signal(false);
  _tagEdit = signal<TagModel | null>(null);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // SERVICES & FORM
  private fb = inject(FormBuilder);
  private tagService = inject(TagService);

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]]
  });

  constructor() {
    // EFFETTO: Reset o Popolamento automatico all'apertura
    effect(() => {
      if (this._isOpen()) {
        this.error.set(null);
        this.success.set(null);
        
        const tag = this._tagEdit();
        if (tag) {
          this.form.patchValue({ nome: tag.nome });
        } else {
          this.form.reset({ nome: '' });
        }
      }
    }, { allowSignalWrites: true });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formData = this.form.getRawValue();

    // ⚠️ FIX ROBUSTO per TypeScript: id=0 se nuovo, nome='' se null
    const payload: TagModel = {
      id: this._tagEdit()?.id ?? 0,
      nome: formData.nome ?? ''
    };

    console.log('📤 Payload Tag:', payload);

    const req$ = this._tagEdit()
      ? this.tagService.updateTag(payload.id, payload)
      : this.tagService.createTag(payload);

    req$.subscribe({
      next: (res) => {
        this.success.set(this._tagEdit() ? 'Tag modificato!' : 'Tag creato!');
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
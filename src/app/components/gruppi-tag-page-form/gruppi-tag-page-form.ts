import { Component, Input, Output, EventEmitter, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { GruppoTagService, GruppoTagModel } from '../../services/gruppo-tag.service';
import { TagService, TagModel } from '../../services/tag.service';

@Component({
  selector: 'app-gruppi-tag-page-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './gruppi-tag-page-form.html',
  styleUrl: './gruppi-tag-page-form.css',
})
export class GruppiTagPageForm {

  @Input() set isOpen(value: boolean) {
    this._isOpen.set(value);
  }
  @Input() set gruppoEdit(value: GruppoTagModel | null) {
    this._gruppoEdit.set(value);
  }

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  _isOpen = signal(false);
  _gruppoEdit = signal<GruppoTagModel | null>(null);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  tagsDisponibili = signal<TagModel[]>([]);
  selectedTagIds = signal<Set<number>>(new Set());

  tagSearchInput = signal('');

  // Filtra i tag disponibili in memoria mentre l'utente digita
  filteredTagsDisponibili = computed(() => {
    const term = this.tagSearchInput().toLowerCase();
    const all = this.tagsDisponibili();
    if (!term) return all;
    return all.filter(t => t.nome.toLowerCase().includes(term));
  });

  private fb = inject(FormBuilder);
  private gruppoTagService = inject(GruppoTagService);
  private tagService = inject(TagService);

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]]
  });

  constructor() {
    effect(() => {
      if (this._isOpen()) {
        this.resetState();
        this.loadTagsDisponibili();
        this.tagSearchInput.set('');

        const gruppo = this._gruppoEdit();
        if (gruppo) {
          this.form.patchValue({ nome: gruppo.nome });
          this.selectedTagIds.set(new Set(gruppo.tags.map(t => t.id)));
        } else {
          this.form.reset({ nome: '' });
          this.selectedTagIds.set(new Set());
        }
      }
    }, { allowSignalWrites: true });
  }

  resetState() {
    this.loading.set(false);
    this.error.set(null);
    this.success.set(null);
  }

  loadTagsDisponibili() {
    this.tagService.getTags().subscribe(res => {
      if (res.success) this.tagsDisponibili.set(res.data);
    });
  }

  isTagSelected(tagId: number): boolean {
    return this.selectedTagIds().has(tagId);
  }

  toggleTag(tagId: number) {
    this.selectedTagIds.update(set => {
      const next = new Set(set);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }

  onSubmit() {
    if (this.loading()) {
      return;
    }

    if (this.form.invalid || this.selectedTagIds().size === 0) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const payload = {
      nome: this.form.getRawValue().nome ?? '',
      tags: Array.from(this.selectedTagIds())
    };

    const gruppo = this._gruppoEdit();
    const req$ = gruppo
      ? this.gruppoTagService.updateGruppo(gruppo.id, payload)
      : this.gruppoTagService.createGruppo(payload);

    req$.subscribe({
      next: () => {
        this.success.set(gruppo ? 'Gruppo modificato!' : 'Gruppo creato!');
        setTimeout(() => {
          this.saved.emit();
          this.onClose();
        }, 1000);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Errore durante il salvataggio.');
        this.loading.set(false);
      }
    });
  }

  onClose() {
    this.close.emit();
  }
}

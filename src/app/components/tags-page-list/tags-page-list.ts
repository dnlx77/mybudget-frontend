import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModel, TagService } from '../../services/tag.service';
import { TagsPageForm } from '../tags-page-form/tags-page-form';

@Component({
  selector: 'app-tags-page-list',
  standalone: true,
  imports: [CommonModule, TagsPageForm],
  templateUrl: './tags-page-list.html',
  styleUrl: './tags-page-list.css',
})
export class TagsPageList implements OnInit {

  // SERVICES
  private tagService = inject(TagService);

  // STATE SIGNALS
  tags = signal<TagModel[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  
  // MODAL STATE
  isFormOpen = signal(false);
  tagEdit = signal<TagModel | null>(null);
  
  ngOnInit(): void {
    this.loadTags();
  }
  
  loadTags(): void {
    this.loading.set(true);
    this.tagService.getTags().subscribe({
      next: (res) => {
        if (res.success) {
          this.tags.set(res.data);
          this.error.set(null);
        } else {
          this.error.set(res.message || 'Errore caricamento tags');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Impossibile caricare i tags.');
        this.loading.set(false);
      }
    });
  }

  // --- AZIONI ---

  openFormNew(): void {
    this.tagEdit.set(null);
    this.isFormOpen.set(true);
  }

  editTag(tag: TagModel): void {
    this.tagEdit.set(tag);
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.tagEdit.set(null);
  }
  
  onTagSaved(): void {
    this.loadTags(); // Ricarica lista completa
  }

  deleteTag(id: number): void {
    if (!confirm('Sei sicuro di voler eliminare questo tag?')) return;

    this.loading.set(true); // Mostra loading brevemente o usa uno spinner locale
    this.tagService.deleteTag(id).subscribe({
      next: () => {
        // Ottimizzazione: Rimuovi localmente
        this.tags.update(list => list.filter(t => t.id !== id));
        this.loading.set(false);
      },
      error: (err) => {
        alert("Errore: Impossibile eliminare il tag.");
        this.loading.set(false);
      }
    });
  }
}
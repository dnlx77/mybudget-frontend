import { Component, OnDestroy, OnInit } from '@angular/core';
import { TagModel, TagService } from '../../services/tag.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TagsPageForm } from '../tags-page-form/tags-page-form';


@Component({
  selector: 'app-tags-page-list',
  imports: [CommonModule, TagsPageForm],
  templateUrl: './tags-page-list.html',
  styleUrl: './tags-page-list.css',
})
export class TagsPageList implements OnInit, OnDestroy{
  tags: TagModel[] = [];
  loading: boolean = true;
  error: string | null = null;
  
  // Modal
  isFormOpen: boolean = false;
  tagEdit: TagModel | null = null;
  private destroy$ = new Subject<void>();
  
  constructor(private tagService: TagService) { }

  ngOnInit(): void {
    this.loadTags();
  }
  
  /**
   * Carica i conti dall'API
   */
  loadTags(): void {
    this.loading = true;
    this.error = null;

    this.tagService.getTags()
    .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Tags ricevuti:', response);
          
          if (response.success) {
            this.tags = response.data;
          } else {
            this.error = response.message;
          }
          
          this.loading = false;
        },
        
        error: (error) => {
          console.error('Errore nel caricamento tags:', error);
          this.error = `Errore: ${error.message || 'Impossibile caricare i tags'}`;
          this.loading = false;
        },
        
        complete: () => {
          console.log('Caricamento tags completato');
        }
      });
  }

  /**
   * Apre il form per creare un nuovo tag
   */
  openFormNew(): void {
    this.tagEdit = null;
    this.isFormOpen = true;
  }

  /**
   * Apre il form per modificare un tag
   */
  editTag(tag: TagModel): void {
    this.tagEdit = tag;
    this.isFormOpen = true;
  }

  /**
   * Chiude il form modale
   */
  closeForm(): void {
    this.isFormOpen = false;
    this.tagEdit = null;
  }
  
  /**
   * Chiamato quando un tag viene salvata dal form
   */
  onTagSaved(): void {
    // Ricarica da pagina 1
    this.loadTags();
  }

  /**
   * Elimina un tag
   */
  deleteTag(id: number): void {
    const conferma = confirm('Sei sicuro di voler eliminare questo tag?');
    
    if (!conferma) {
      return;
    }

    this.tagService.deleteTag(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Tag eliminato:', response);
          
          // Ricarica la pagina
          this.loadTags();
        },
        
        error: (error) => {
          console.error('Errore eliminazione tag:', error);
          this.error = `Errore: ${error.message || 'Impossibile eliminare il tag'}`;
        }
      });
  }
    
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

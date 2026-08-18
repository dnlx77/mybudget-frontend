import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GruppoTagModel, GruppoTagService } from '../../services/gruppo-tag.service';
import { GruppiTagPageForm } from '../gruppi-tag-page-form/gruppi-tag-page-form';

@Component({
  selector: 'app-gruppi-tag-page-list',
  standalone: true,
  imports: [CommonModule, GruppiTagPageForm],
  templateUrl: './gruppi-tag-page-list.html',
  styleUrl: './gruppi-tag-page-list.css',
})
export class GruppiTagPageList implements OnInit {

  private gruppoTagService = inject(GruppoTagService);

  gruppi = signal<GruppoTagModel[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  isFormOpen = signal(false);
  gruppoEdit = signal<GruppoTagModel | null>(null);

  ngOnInit(): void {
    this.loadGruppi();
  }

  loadGruppi(): void {
    this.loading.set(true);
    this.gruppoTagService.getGruppi().subscribe({
      next: (res) => {
        if (res.success) {
          this.gruppi.set(res.data);
          this.error.set(null);
        } else {
          this.error.set('Errore caricamento gruppi tag');
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossibile caricare i gruppi tag.');
        this.loading.set(false);
      }
    });
  }

  openFormNew(): void {
    this.gruppoEdit.set(null);
    this.isFormOpen.set(true);
  }

  editGruppo(gruppo: GruppoTagModel): void {
    this.gruppoEdit.set(gruppo);
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.gruppoEdit.set(null);
  }

  onGruppoSaved(): void {
    this.loadGruppi();
  }

  deleteGruppo(id: number): void {
    if (!confirm('Sei sicuro di voler eliminare questo gruppo tag?')) return;

    this.gruppoTagService.deleteGruppo(id).subscribe({
      next: () => {
        this.gruppi.update(list => list.filter(g => g.id !== id));
      },
      error: () => alert('Errore: impossibile eliminare il gruppo tag.')
    });
  }
}

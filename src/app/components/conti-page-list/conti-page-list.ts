import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conto, ContoService } from '../../services/conto.service';
import { ContiPageForm } from '../conti-page-form/conti-page-form';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'; // ⬅️ Gestione pulita destroy

@Component({
  selector: 'app-conti-page-list',
  standalone: true,
  imports: [CommonModule, ContiPageForm],
  templateUrl: './conti-page-list.html',
  styleUrl: './conti-page-list.css',
})
export class ContiPageList implements OnInit {

  // SERVICES
  private contoService = inject(ContoService);

  // STATE SIGNALS
  conti = signal<Conto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  
  // MODAL STATE
  isFormOpen = signal(false);
  contoEdit = signal<Conto | null>(null);
  
  constructor() {
    // Qui potresti mettere logiche reattive se servissero
  }

  ngOnInit(): void {
    this.loadConti();
  }
  
  loadConti(): void {
    this.loading.set(true);
    // Non serve takeUntilDestroyed qui perché l'http client di Angular completa da solo
    // ma se usassi stream continui, servirebbe.
    this.contoService.getConti().subscribe({
      next: (res) => {
        if (res.success) {
          this.conti.set(res.data);
          this.error.set(null);
        } else {
          this.error.set(res.message || 'Errore caricamento dati');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Impossibile caricare i conti.');
        this.loading.set(false);
      }
    });
  }

  // --- AZIONI ---

  openFormNew(): void {
    this.contoEdit.set(null);
    this.isFormOpen.set(true);
  }

  editConto(conto: Conto): void {
    this.contoEdit.set(conto);
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.contoEdit.set(null);
  }
  
  onContoSaved(): void {
    this.loadConti(); // Ricarica la lista
    // closeForm() viene chiamato dal componente figlio via evento
  }

  deleteConto(id: number): void {
    if (!confirm('Sei sicuro di voler eliminare questo conto?')) return;

    this.loading.set(true);
    this.contoService.deleteConto(id).subscribe({
      next: () => {
        // Ottimizzazione: Rimuoviamo dalla lista locale senza ricaricare tutto
        this.conti.update(list => list.filter(c => c.id !== id));
        this.loading.set(false);
      },
      error: (err) => {
        alert("Errore: Impossibile eliminare (forse ha delle operazioni collegate?)");
        this.loading.set(false);
      }
    });
  }
}
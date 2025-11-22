import { Component, OnDestroy, OnInit } from '@angular/core';
import { Conto, ContoService } from '../../services/conto.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ContiPageForm } from '../conti-page-form/conti-page-form';

@Component({
  selector: 'app-conti-page-list',
  imports: [CommonModule, ContiPageForm],
  templateUrl: './conti-page-list.html',
  styleUrl: './conti-page-list.css',
})
export class ContiPageList implements OnInit, OnDestroy{

  conti: Conto[] = [];
  loading: boolean = true;
  error: string | null = null;
  
  // Modal
  isFormOpen: boolean = false;
  contoEdit: Conto | null = null;
  private destroy$ = new Subject<void>();
  
  constructor(private contoService: ContoService) { }

  ngOnInit(): void {
    this.loadConti();
  }
  
  /**
   * Carica i conti dall'API
   */
  loadConti(): void {
    this.loading = true;
    this.error = null;

    this.contoService.getConti()
    .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Conti ricevuti:', response);
          
          if (response.success) {
            this.conti = response.data;
          } else {
            this.error = response.message;
          }
          
          this.loading = false;
        },
        
        error: (error) => {
          console.error('Errore nel caricamento conti:', error);
          this.error = `Errore: ${error.message || 'Impossibile caricare i conti'}`;
          this.loading = false;
        },
        
        complete: () => {
          console.log('Caricamento conti completato');
        }
      });
  }

  /**
   * Apre il form per creare un nuovo conto
   */
  openFormNew(): void {
    this.contoEdit = null;
    this.isFormOpen = true;
  }

  /**
   * Apre il form per modificare un conto
   */
  editConto(conto: Conto): void {
    this.contoEdit = conto;
    this.isFormOpen = true;
  }

  /**
   * Chiude il form modale
   */
  closeForm(): void {
    this.isFormOpen = false;
    this.contoEdit = null;
  }
  
  /**
   * Chiamato quando un conto viene salvata dal form
   */
  onContoSaved(): void {
    // Ricarica da pagina 1
    this.loadConti();
  }

  /**
   * Elimina un conto
   */
  deleteConto(id: number): void {
    const conferma = confirm('Sei sicuro di voler eliminare questo conto?');
    
    if (!conferma) {
      return;
    }

    this.contoService.deleteConto(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Conto eliminato:', response);
          
          // Ricarica la pagina
          this.loadConti();
        },
        
        error: (error) => {
          console.error('Errore eliminazione conto:', error);
          this.error = `Errore: ${error.message || 'Impossibile eliminare il conto'}`;
        }
      });
  }
    
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

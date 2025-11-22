import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs';
import { ContoService, Conto } from '../../services/conto.service';

@Component({
  selector: 'app-conti-page-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './conti-page-form.html',
  styleUrl: './conti-page-form.css',
})
export class ContiPageForm implements OnInit, OnChanges, OnDestroy{

  @Input() isOpen: boolean = false;
  @Input() contoEdit: Conto | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  // Form fields
  nomeConto: string = '';

  // State
  loading: boolean = false;
  error: string | null = null;
  success: string | null = null;
  isEditMode: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
      private contoService: ContoService,
    ) { }
  
  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.error = null;
      this.success = null;
      
      if (this.contoEdit) {
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
    if (this.contoEdit) {
      this.nomeConto = this.contoEdit.nome;
    }
  }

  resetForm() : void {
    this.nomeConto = '';
  }

  onSubmit(): void {
    // Validazione
    if (!this.nomeConto) {
      this.error = 'Compilare il campo nome';
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    const conto: any = {
      id: this.contoEdit?.id || 0,
      nome: this.nomeConto
    };

    console.log('📤 Payload inviato:', conto);  // ← Aggiungi questo per debuggare

    const conto$ = this.isEditMode
      ? this.contoService.updateConto(this.contoEdit!.id, conto)
      : this.contoService.createConto(conto);

    conto$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Conto salvato:', response);
          this.success = this.isEditMode
            ? 'Conto modificato con successo!'
            : 'Conto creato con successo!';
          
          this.loading = false;
          
          setTimeout(() => {
            this.onClose();
            this.saved.emit();
          }, 1000);
        },
        error: (error) => {
          console.error('Errore salvataggio conto:', error);
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


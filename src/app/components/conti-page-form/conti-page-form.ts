import { Component, Input, Output, EventEmitter, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ContoService, Conto } from '../../services/conto.service';

@Component({
  selector: 'app-conti-page-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // ⬅️ Passiamo a ReactiveFormsModule
  templateUrl: './conti-page-form.html', // Assicurati di aggiornare anche l'HTML (vedi sotto)
  styleUrl: './conti-page-form.css',
})
export class ContiPageForm {

  // INPUT / OUTPUT
  @Input() set isOpen(value: boolean) {
    this._isOpen.set(value);
  }
  @Input() set contoEdit(value: Conto | null) {
    this._contoEdit.set(value);
  }
  
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  // SIGNALS DI STATO
  _isOpen = signal(false);
  _contoEdit = signal<Conto | null>(null);
  
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  
  // FORM REACTIVE
  private fb = inject(FormBuilder);
  private contoService = inject(ContoService);

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]]
    // Qui in futuro potrai aggiungere: saldo_iniziale: [0], colore: ['#000000']
  });

  constructor() {
    // EFFETTO: Quando si apre il modale, popola o resetta il form
    effect(() => {
      if (this._isOpen()) {
        this.error.set(null);
        this.success.set(null);
        
        const conto = this._contoEdit();
        if (conto) {
          // Edit Mode
          this.form.patchValue({ nome: conto.nome });
        } else {
          // Create Mode
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

    // TypeScript è felice perché id è un numero (0).
    // Laravel è felice perché ignora lo 0 e crea l'ID reale.
    const payload: Conto = {
      id: this._contoEdit()?.id ?? 0, 
      nome: formData.nome ?? '',
      // saldo_totale, operazioni, ecc. sono opzionali nell'interfaccia o gestiti dal backend
    };

    console.log('📤 Payload:', payload);

    const req$ = this._contoEdit()
      ? this.contoService.updateConto(payload.id, payload)
      : this.contoService.createConto(payload);

    req$.subscribe({
      next: (res) => {
        this.success.set(this._contoEdit() ? 'Conto modificato!' : 'Conto creato!');
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
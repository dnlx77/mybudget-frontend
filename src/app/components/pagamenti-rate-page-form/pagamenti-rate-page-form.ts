import { Component, Input, Output, EventEmitter, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PagamentoRataService, PagamentoRataModel } from '../../services/pagamento-rata.service';

@Component({
  selector: 'app-pagamenti-rate-page-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './pagamenti-rate-page-form.html',
  styleUrl: './pagamenti-rate-page-form.css',
})
export class PagamentiRatePageForm {

  @Input() set isOpen(value: boolean) {
    this._isOpen.set(value);
  }
  @Input() set pagamentoEdit(value: PagamentoRataModel | null) {
    this._pagamentoEdit.set(value);
  }

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  _isOpen = signal(false);
  _pagamentoEdit = signal<PagamentoRataModel | null>(null);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  private fb = inject(FormBuilder);
  private pagamentoRataService = inject(PagamentoRataService);

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    importo_totale: [null as number | null, [Validators.required, Validators.min(0.01)]],
    numero_rate: [null as number | null, [Validators.required, Validators.min(1)]],
    data_inizio: [this.getTodayDate(), Validators.required],
  });

  constructor() {
    effect(() => {
      if (this._isOpen()) {
        this.resetState();

        const p = this._pagamentoEdit();
        if (p) {
          this.form.patchValue({
            nome: p.nome,
            importo_totale: p.importo_totale,
            numero_rate: p.numero_rate,
            data_inizio: p.data_inizio,
          });
        } else {
          this.form.reset({
            nome: '',
            importo_totale: null,
            numero_rate: null,
            data_inizio: this.getTodayDate(),
          });
        }
      }
    }, { allowSignalWrites: true });
  }

  resetState() {
    this.loading.set(false);
    this.error.set(null);
    this.success.set(null);
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  onSubmit() {
    if (this.loading()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValues = this.form.getRawValue();
    const payload = {
      nome: formValues.nome ?? '',
      importo_totale: formValues.importo_totale as number,
      numero_rate: formValues.numero_rate as number,
      data_inizio: formValues.data_inizio ?? '',
    };

    const pagamento = this._pagamentoEdit();
    const req$ = pagamento
      ? this.pagamentoRataService.updatePagamento(pagamento.id, payload)
      : this.pagamentoRataService.createPagamento(payload);

    req$.subscribe({
      next: () => {
        this.success.set(pagamento ? 'Pagamento a rate modificato!' : 'Pagamento a rate creato!');
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

import { Component, inject, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, combineLatest, debounceTime, switchMap, of, catchError, startWith, tap } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { BudgetService, BudgetData, RitmoBudget } from '../../services/budget.service';
import { EventService } from '../../services/event';
import { CurrencyEuroPipe } from '../../pipes/currency-euro-pipe';

type Andamento = 'ok' | 'attenzione' | 'superato';

interface Indicatore {
  speso: number;
  tetto: number;
  percentuale: number;     // speso / tetto, può superare 100
  riempimento: number;     // larghezza della barra, max 100
  andamento: Andamento;
  ritmo: number;           // posizione del marcatore, 0-100
  mostraRitmo: boolean;    // nascosto per mesi passati (100) e futuri (0)
  descrizioneRitmo: string;
}

/**
 * Box del budget mensile nel pannello Operazioni.
 * Segue anno/mese dei filtri e, se c'è un filtro per tag o gruppo tag,
 * mostra un secondo indicatore per quella categoria.
 */
@Component({
  selector: 'app-budget-indicator',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyEuroPipe],
  templateUrl: './budget-indicator.html',
  styleUrl: './budget-indicator.css',
})
export class BudgetIndicatorComponent {

  anno = input<number | null>(null);
  mese = input<number | null>(null);
  tag = input<string>('');               // id separati da virgola, come il filtro della dashboard
  tagNome = input<string | null>(null);

  private budgetService = inject(BudgetService);
  private eventService = inject(EventService);

  dati = signal<BudgetData | null>(null);
  errore = signal(false);
  inModifica = signal(false);
  salvataggio = signal(false);
  importoInput = signal<number | null>(null);

  private ricarica$ = new Subject<void>();

  // I campi anno/mese della dashboard possono essere vuoti o fuori range mentre si digita
  periodo = computed(() => {
    const anno = Number(this.anno());
    const mese = Number(this.mese());
    const valido = Number.isInteger(anno) && anno >= 2000 && anno <= 2100
      && Number.isInteger(mese) && mese >= 1 && mese <= 12;
    return valido ? { anno, mese } : null;
  });

  indicatoreBudget = computed(() => {
    const d = this.dati();
    return d?.budget ? this.calcolaIndicatore(d.speso, d.budget, d.ritmo, d.giorni_trascorsi) : null;
  });

  indicatoreTag = computed(() => {
    const d = this.dati();
    if (!d?.tag?.riferimento) return null;
    return this.calcolaIndicatore(d.tag.speso, d.tag.riferimento, d.tag.ritmo, d.giorni_trascorsi);
  });

  constructor() {
    combineLatest([
      toObservable(this.periodo),
      toObservable(this.tag),
      this.ricarica$.pipe(startWith(undefined)),
      this.eventService.operazioneChanged$.pipe(startWith(undefined))
    ]).pipe(
      debounceTime(150),
      tap(() => this.errore.set(false)),
      switchMap(([periodo, tag]) => {
        if (!periodo) return of(null);
        return this.budgetService.getBudget(periodo.anno, periodo.mese, tag).pipe(
          catchError(() => {
            this.errore.set(true);
            return of(null);
          })
        );
      }),
      takeUntilDestroyed()
    ).subscribe(res => {
      const precedente = this.dati();
      const nuovo = res?.success ? res.data : null;

      // Cambiando mese, un'eventuale modifica in corso non ha più senso
      if (!nuovo || !precedente || precedente.anno !== nuovo.anno || precedente.mese !== nuovo.mese) {
        this.inModifica.set(false);
      }
      this.dati.set(nuovo);
    });
  }

  apriModifica(): void {
    const d = this.dati();
    this.importoInput.set(d?.budget ?? d?.proposta ?? null);
    this.inModifica.set(true);
  }

  annullaModifica(): void {
    this.inModifica.set(false);
  }

  usaProposta(): void {
    const proposta = this.dati()?.proposta;
    if (proposta) this.salva(proposta);
  }

  salvaInput(): void {
    const importo = Number(this.importoInput());
    if (importo > 0) this.salva(importo);
  }

  private salva(importo: number): void {
    const d = this.dati();
    if (!d || this.salvataggio()) return;

    this.salvataggio.set(true);
    this.budgetService.salvaBudget(d.anno, d.mese, importo).subscribe({
      next: () => {
        this.salvataggio.set(false);
        this.inModifica.set(false);
        this.ricarica$.next();
      },
      error: () => {
        this.salvataggio.set(false);
        alert('Impossibile salvare il budget. Riprova.');
      }
    });
  }

  elencoMesi(mesi: { etichetta: string }[]): string {
    return mesi.map(m => m.etichetta.split(' ')[0]).join(', ');
  }

  // Verde se si spende più lentamente del ritmo, giallo se più in fretta, rosso oltre il tetto
  private calcolaIndicatore(speso: number, tetto: number, ritmo: RitmoBudget, giorno: number): Indicatore {
    const percentuale = (speso / tetto) * 100;
    const andamento: Andamento = percentuale > 100
      ? 'superato'
      : percentuale > ritmo.percentuale ? 'attenzione' : 'ok';

    const ritmoTesto = Math.round(ritmo.percentuale);
    const descrizioneRitmo = ritmo.tipo === 'storico'
      ? `Di solito al giorno ${giorno} hai speso il ${ritmoTesto}% del mese`
      : `Giorno ${giorno}: ${ritmoTesto}% del mese trascorso`;

    return {
      speso,
      tetto,
      percentuale,
      riempimento: Math.min(percentuale, 100),
      andamento,
      ritmo: ritmo.percentuale,
      mostraRitmo: ritmo.percentuale > 0 && ritmo.percentuale < 100,
      descrizioneRitmo
    };
  }
}

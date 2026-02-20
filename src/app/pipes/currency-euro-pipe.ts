import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyEuro',
  standalone: true
})
export class CurrencyEuroPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    // 1. Se il valore manca o è vuoto, mostra un trattino
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    // 2. Converti in numero (fondamentale se l'API manda stringhe come "100.50")
    const num = Number(value);

    // 3. Se la conversione fallisce (es. "ciao"), ritorna trattino
    if (isNaN(num)) {
      return '-';
    }

    // 4. Formattazione Nativa (Gestisce automaticamente virgole, punti e simbolo €)
    return num.toLocaleString('it-IT', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }
}
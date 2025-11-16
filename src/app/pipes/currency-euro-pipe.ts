import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyEuro',
  standalone: true
})
export class CurrencyEuroPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    return `${value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  }
}
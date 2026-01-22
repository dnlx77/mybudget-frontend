import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css',
})
export class PaginationComponent {
  
  // INPUT SIGNALS (Obbligatori e Opzionali)
  currentPage = input.required<number>();
  totalPages = input.required<number>();
  totalCount = input<number>(0);

  // OUTPUT SIGNAL (Nuova sintassi Angular)
  pageChange = output<number>();

  // COMPUTED SIGNALS (Logica di visualizzazione reattiva)
  // Calcola quali numeri di pagina mostrare (es. 4, 5, [6], 7, 8)
  visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    const pages: number[] = [];
    
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  // Logica per mostrare pulsanti "Prima" / "Ultima" / "..."
  showFirstButton = computed(() => this.currentPage() > 3);
  showEllipsisBefore = computed(() => this.currentPage() > 3);
  
  showLastButton = computed(() => this.currentPage() < this.totalPages() - 2);
  showEllipsisAfter = computed(() => this.currentPage() < this.totalPages() - 2);

  /**
   * Gestione click pagina
   */
  onPageClick(page: number): void {
    const current = this.currentPage();
    const total = this.totalPages();

    if (page > 0 && page <= total && page !== current) {
      this.pageChange.emit(page);
    }
  }
}
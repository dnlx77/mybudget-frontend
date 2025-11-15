import { Component, Input, Output, EventEmitter } from '@angular/core';

/**
 * PaginationComponent - Componente riusabile per paginazione
 * 
 * Uso:
 * <app-pagination 
 *   [currentPage]="currentPage"
 *   [totalPages]="totalPages"
 *   [totalCount]="totalCount"
 *   (pageChange)="goToPage($event)"
 * ></app-pagination>
 * 
 * Nel componente padre:
 * - currentPage: number
 * - totalPages: number
 * - totalCount: number
 * - goToPage(page: number)
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css',
})
export class PaginationComponent {
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;
  @Input() totalCount: number = 0;
  @Output() pageChange = new EventEmitter<number>();

  /**
   * Emetti il cambio pagina
   */
  goToPage(page: number): void {
    if (page > 0 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  /**
   * Ritorna le pagine vicine (currentPage ± 2)
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  /**
   * Mostra ellipsis se ci sono pagine nascoste prima
   */
  showEllipsisBefore(): boolean {
    return this.currentPage > 3;
  }

  /**
   * Mostra ellipsis se ci sono pagine nascoste dopo
   */
  showEllipsisAfter(): boolean {
    return this.currentPage < this.totalPages - 2;
  }

  /**
   * Mostra bottone "Prima"
   */
  showFirstButton(): boolean {
    return this.currentPage > 3;
  }

  /**
   * Mostra bottone "Ultima"
   */
  showLastButton(): boolean {
    return this.currentPage < this.totalPages - 2;
  }
}

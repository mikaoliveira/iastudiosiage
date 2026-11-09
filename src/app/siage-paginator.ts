import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {PageEvent} from '@angular/material/paginator';

/**
 * Componente padronizado e minimalista de paginação do SIAGE-RH V2.
 * 
 * À esquerda: "Exibindo X de Y Registros"
 * À direita: Seletor opcional de itens por página + Navegação numérica (« ‹ 1 2 3 ... › »)
 */
@Component({
  selector: 'app-siage-paginator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  host: {
    class: 'block w-full select-none'
  },
  template: `
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-siage-border/40 bg-siage-surface font-sans text-xs">
      
      <!-- À esquerda: Exibindo X de Y Registros -->
      <div class="text-xs text-siage-text-secondary font-medium order-2 sm:order-1 text-center sm:text-left">
        Exibindo {{ displayedCount() }} de {{ length() }} Registros
      </div>

      <!-- À direita: Controles de navegação numérica -->
      <div class="flex items-center flex-wrap justify-center sm:justify-end gap-2 order-1 sm:order-2">
        
        <!-- Controles de navegação numérica: visíveis quando houver pelo menos 1 registro -->
        @if (totalPages() >= 1 && length() > 0) {
          <nav aria-label="Navegação da paginação" class="inline-flex items-center gap-1">
            
            <!-- Primeira página («) -->
            @if (showFirstLastButtons()) {
              <button 
                type="button" 
                (click)="goToPage(0)"
                [disabled]="isFirstPage()"
                [class.opacity-40]="isFirstPage()"
                [class.cursor-not-allowed]="isFirstPage()"
                class="h-8 w-8 min-w-[32px] rounded-lg border border-siage-border bg-siage-surface text-siage-text-secondary hover:text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 disabled:hover:bg-transparent disabled:hover:text-siage-text-secondary transition-colors inline-flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-siage-primary"
                title="Primeira página"
                aria-label="Ir para a primeira página"
              >
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">first_page</mat-icon>
              </button>
            }

            <!-- Página anterior (‹) -->
            <button 
              type="button" 
              (click)="goToPage(pageIndex() - 1)"
              [disabled]="isFirstPage()"
              [class.opacity-40]="isFirstPage()"
              [class.cursor-not-allowed]="isFirstPage()"
              class="h-8 w-8 min-w-[32px] rounded-lg border border-siage-border bg-siage-surface text-siage-text-secondary hover:text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 disabled:hover:bg-transparent disabled:hover:text-siage-text-secondary transition-colors inline-flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-siage-primary"
              title="Página anterior"
              aria-label="Ir para a página anterior"
            >
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">chevron_left</mat-icon>
            </button>

            <!-- Páginas numeradas com reticências -->
            @for (item of paginationRange(); track $index) {
              @if (item === '...') {
                <span class="h-8 px-1.5 inline-flex items-center justify-center text-xs font-semibold text-siage-text-secondary select-none" aria-hidden="true">
                  ...
                </span>
              } @else {
                <button 
                  type="button" 
                  (click)="goToPage(+item - 1)"
                  [class]="+item - 1 === pageIndex() 
                    ? 'h-8 min-w-[32px] px-2.5 rounded-lg bg-siage-primary text-white border border-siage-primary font-semibold shadow-xs transition-colors inline-flex items-center justify-center cursor-default'
                    : 'h-8 min-w-[32px] px-2.5 rounded-lg border border-siage-border bg-siage-surface text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 font-medium transition-colors inline-flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-siage-primary'"
                  [attr.aria-current]="+item - 1 === pageIndex() ? 'page' : null"
                  [attr.aria-label]="'Página ' + item"
                >
                  {{ item }}
                </button>
              }
            }

            <!-- Próxima página (›) -->
            <button 
              type="button" 
              (click)="goToPage(pageIndex() + 1)"
              [disabled]="isLastPage()"
              [class.opacity-40]="isLastPage()"
              [class.cursor-not-allowed]="isLastPage()"
              class="h-8 w-8 min-w-[32px] rounded-lg border border-siage-border bg-siage-surface text-siage-text-secondary hover:text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 disabled:hover:bg-transparent disabled:hover:text-siage-text-secondary transition-colors inline-flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-siage-primary"
              title="Próxima página"
              aria-label="Ir para a próxima página"
            >
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">chevron_right</mat-icon>
            </button>

            <!-- Última página (») -->
            @if (showFirstLastButtons()) {
              <button 
                type="button" 
                (click)="goToPage(totalPages() - 1)"
                [disabled]="isLastPage()"
                [class.opacity-40]="isLastPage()"
                [class.cursor-not-allowed]="isLastPage()"
                class="h-8 w-8 min-w-[32px] rounded-lg border border-siage-border bg-siage-surface text-siage-text-secondary hover:text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 disabled:hover:bg-transparent disabled:hover:text-siage-text-secondary transition-colors inline-flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-siage-primary"
                title="Última página"
                aria-label="Ir para a última página"
              >
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">last_page</mat-icon>
              </button>
            }
          </nav>
        }
      </div>
    </div>
  `
})
export class SiagePaginatorComponent {
  readonly length = input<number>(0);
  readonly pageSize = input<number>(10);
  readonly pageIndex = input<number>(0);
  readonly pageSizeOptions = input<number[]>([]);
  readonly showFirstLastButtons = input<boolean>(true);

  readonly page = output<PageEvent>();

  /**
   * Quantidade de registros exibidos na página atual:
   * Na última página ou listas pequenas, exibe a contagem real restante.
   */
  readonly displayedCount = computed(() => {
    const total = this.length();
    if (total <= 0) return 0;
    const size = this.pageSize() || 10;
    const index = this.pageIndex();
    const start = index * size;
    if (start >= total) return 0;
    return Math.min(size, total - start);
  });

  readonly totalPages = computed(() => {
    const total = this.length();
    const size = this.pageSize() || 10;
    if (total <= 0) return 0;
    return Math.ceil(total / size);
  });

  readonly isFirstPage = computed(() => this.pageIndex() <= 0);
  readonly isLastPage = computed(() => {
    const total = this.totalPages();
    if (total <= 1) return true;
    return this.pageIndex() >= total - 1;
  });

  readonly paginationRange = computed<(number | string)[]>(() => {
    const total = this.totalPages();
    if (total <= 0) return [];
    const current = this.pageIndex() + 1;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }

    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, '...', current - 1, current, current + 1, '...', total];
  });

  goToPage(newIndex: number) {
    if (this.totalPages() <= 1 || newIndex < 0 || newIndex >= this.totalPages() || newIndex === this.pageIndex()) {
      return;
    }
    const oldIndex = this.pageIndex();
    this.page.emit({
      pageIndex: newIndex,
      previousPageIndex: oldIndex,
      pageSize: this.pageSize() || 10,
      length: this.length()
    });
  }
}

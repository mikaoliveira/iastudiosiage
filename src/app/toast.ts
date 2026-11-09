import {Component, Injectable, inject, signal, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastOptions {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
  timerRef?: ReturnType<typeof setTimeout>;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<ToastItem[]>([]);
  readonly toasts = this._toasts.asReadonly();

  /**
   * Dispara um toast no padrão SIAGE Design System.
   * Empilhamento: mais recente no topo, máximo 3 toasts visíveis simultaneamente.
   */
  show(
    titleOrOptions: string | ToastOptions,
    messageOrType?: string | ToastType,
    typeOrDuration?: ToastType | number,
    optDuration?: number
  ): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    let title = '';
    let message: string | undefined;
    let type: ToastType = 'success';
    let duration = 4000;

    if (typeof titleOrOptions === 'object') {
      title = titleOrOptions.title;
      message = titleOrOptions.message;
      type = titleOrOptions.type ?? 'success';
      duration = titleOrOptions.duration !== undefined
        ? titleOrOptions.duration
        : (type === 'error' ? 0 : 4000);
    } else {
      title = titleOrOptions;

      // Suporte para show(title, type, duration)
      if (
        messageOrType === 'success' ||
        messageOrType === 'info' ||
        messageOrType === 'warning' ||
        messageOrType === 'error'
      ) {
        type = messageOrType;
        if (typeof typeOrDuration === 'number') {
          duration = typeOrDuration;
        } else {
          duration = type === 'error' ? 0 : 4000;
        }
      } else {
        // Suporte para show(title, message, type, duration)
        message = messageOrType;
        if (
          typeOrDuration === 'success' ||
          typeOrDuration === 'info' ||
          typeOrDuration === 'warning' ||
          typeOrDuration === 'error'
        ) {
          type = typeOrDuration;
        }
        if (typeof optDuration === 'number') {
          duration = optDuration;
        } else {
          duration = type === 'error' ? 0 : 4000;
        }
      }
    }

    const newItem: ToastItem = {
      id,
      type,
      title,
      message,
      duration
    };

    // Auto-dismiss para success, info e warning (~4s).
    // Error permanece até fechamento manual (duration = 0).
    if (duration > 0 && type !== 'error') {
      newItem.timerRef = setTimeout(() => {
        this.dismiss(newItem.id);
      }, duration);
    }

    // Mais recente no topo. Máximo de 3 toasts visíveis simultaneamente.
    this._toasts.update(current => {
      const updated = [newItem, ...current];
      if (updated.length > 3) {
        const removed = updated.slice(3);
        removed.forEach(t => {
          if (t.timerRef) clearTimeout(t.timerRef);
        });
        return updated.slice(0, 3);
      }
      return updated;
    });

    return id;
  }

  success(title: string, message?: string, duration = 4000): string {
    return this.show({ title, message, type: 'success', duration });
  }

  info(title: string, message?: string, duration = 4000): string {
    return this.show({ title, message, type: 'info', duration });
  }

  warning(title: string, message?: string, duration = 4000): string {
    return this.show({ title, message, type: 'warning', duration });
  }

  /**
   * Toast de erro / destructive: permanece até fechamento manual (duration = 0).
   */
  error(title: string, message?: string, duration = 0): string {
    return this.show({ title, message, type: 'error', duration });
  }

  /**
   * Fallback GLOBAL de erro de requisição conforme SIAGE Design System.
   * Título: "Não foi possível concluir a solicitação"
   * Mensagem: "Tente novamente."
   * Tipo: error/destructive
   * Comportamento: permanece até fechamento manual.
   */
  showGenericError(): string {
    return this.error('Não foi possível concluir a solicitação', 'Tente novamente.', 0);
  }

  dismiss(id: string) {
    this._toasts.update(current => {
      const target = current.find(t => t.id === id);
      if (target?.timerRef) {
        clearTimeout(target.timerRef);
      }
      return current.filter(t => t.id !== id);
    });
  }

  clearAll() {
    this._toasts().forEach(t => {
      if (t.timerRef) clearTimeout(t.timerRef);
    });
    this._toasts.set([]);
  }
}

// Alias ToastManager global
export { ToastService as ToastManager };

@Component({
  selector: 'app-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <!-- Container no canto superior direito: não bloqueia cliques fora do toast -->
    <div 
      class="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none select-none font-sans"
      aria-live="polite"
      aria-atomic="true"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-[12px] border transition-all duration-300 animate-slideInRight shadow-[var(--mat-sys-level2)] opacity-100"
          [class]="getToastClasses(toast.type)"
          role="status"
        >
          <!-- Ícone e Conteúdo textual -->
          <div class="flex items-start gap-2.5 min-w-0 flex-1">
            <mat-icon 
              class="shrink-0 mt-0.5" 
              [class]="getToastIconClasses(toast.type)"
              style="font-size: 20px; width: 20px; height: 20px;"
            >
              {{ getToastIcon(toast.type) }}
            </mat-icon>

            <div class="flex flex-col min-w-0 flex-1">
              <span class="text-xs sm:text-sm font-semibold text-siage-text-primary leading-snug break-words">
                {{ toast.title }}
              </span>
              @if (toast.message) {
                <span class="text-xs text-siage-text-secondary leading-snug break-words mt-0.5">
                  {{ toast.message }}
                </span>
              }
            </div>
          </div>

          <!-- Ação de fechar quando aplicável -->
          <button 
            type="button" 
            (click)="toastService.dismiss(toast.id)"
            class="shrink-0 p-1 -mr-1 -mt-0.5 rounded-md text-siage-text-secondary hover:text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-siage-primary/40"
            aria-label="Fechar notificação"
          >
            <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(1.5rem);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    .animate-slideInRight {
      animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  getToastIcon(type: ToastType): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'warning': return 'warning_amber';
      case 'error': return 'error_outline';
      case 'info': default: return 'info';
    }
  }

  // Fundo opaco sólido sem nenhuma transparência com borda do token semântico
  getToastClasses(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'bg-[var(--toast-success-bg)] border-[var(--success)]';
      case 'warning':
        return 'bg-[var(--toast-warning-bg)] border-[var(--warning)]';
      case 'error':
        return 'bg-[var(--toast-destructive-bg)] border-[var(--destructive)]';
      case 'info':
      default:
        return 'bg-[var(--toast-info-bg)] border-[var(--info)]';
    }
  }

  getToastIconClasses(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'text-[var(--success)]';
      case 'warning':
        return 'text-[var(--warning)]';
      case 'error':
        return 'text-[var(--destructive)]';
      case 'info':
      default:
        return 'text-[var(--info)]';
    }
  }
}

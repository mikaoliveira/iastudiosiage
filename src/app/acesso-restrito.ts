import {Component, inject, ChangeDetectionStrategy, input, effect} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {Router} from '@angular/router';
import {PermissionService} from './permission';

/**
 * Componente Global e Reutilizável de Acesso Restrito do SIAGE-RH.
 * 
 * Atende às especificações:
 * - Título: “Acesso restrito”
 * - Descrição: “Você não possui permissão para acessar esta funcionalidade.”
 * - Complemento: “Solicite acesso ao responsável pela gestão de acessos.”
 * - Não utiliza modal, não exibe código HTTP cru e não menciona módulos específicos.
 * - Reutilizável por qualquer módulo do SIAGE-RH.
 */
@Component({
  selector: 'app-acesso-restrito',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div 
      class="w-full flex items-center justify-center min-h-[60vh] py-10 sm:py-16 px-4 font-sans select-none"
      role="alert"
      aria-live="polite"
    >
      <!-- Card expandido com excelente respiro, legibilidade e equilíbrio visual no padrão SIAGE-RH -->
      <div class="max-w-xl sm:max-w-2xl w-full bg-siage-surface border border-siage-border rounded-2xl shadow-sm sm:shadow-md p-8 sm:p-12 md:p-14 flex flex-col items-center text-center gap-6 transition-all duration-200">
        
        <!-- Ícone semântico destacado do Design System com halo suave -->
        <div class="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-siage-primary/10 text-siage-primary flex items-center justify-center shrink-0 ring-8 ring-siage-primary/5">
          <mat-icon style="font-size: 36px; width: 36px; height: 36px;">lock</mat-icon>
        </div>

        <!-- Textos Padronizados Globais com alta legibilidade -->
        <div class="flex flex-col gap-2.5 max-w-lg mx-auto">
          <h1 class="text-2xl sm:text-3xl font-poppins font-bold text-siage-text-primary tracking-tight">
            {{ customTitle() || 'Acesso restrito' }}
          </h1>
          
          <p class="text-sm sm:text-base text-siage-text-primary font-medium leading-relaxed">
            {{ customDescription() || 'Você não possui permissão para acessar esta funcionalidade.' }}
          </p>

          <p class="text-xs sm:text-sm text-siage-text-secondary leading-relaxed mt-1">
            {{ customComplement() || 'Solicite acesso ao responsável pela gestão de acessos.' }}
          </p>
        </div>

        <!-- Ação para voltar ao início (sempre direciona para /inicio) -->
        @if (showBackButton()) {
          <div class="pt-3 w-full flex justify-center">
            <button 
              type="button" 
              (click)="voltar()"
              aria-label="Voltar ao início"
              class="inline-flex items-center justify-center gap-2.5 h-11 px-7 rounded-lg border border-siage-border font-sans font-medium text-sm text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.99] transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
            >
              <mat-icon style="font-size: 20px; width: 20px; height: 20px;">arrow_back</mat-icon>
              <span>Voltar ao início</span>
            </button>
          </div>
        }

      </div>
    </div>
  `
})
export class AcessoRestritoComponent {
  private readonly router = inject(Router);
  private readonly permissionService = inject(PermissionService);

  readonly customTitle = input<string>();
  readonly customDescription = input<string>();
  readonly customComplement = input<string>();
  readonly showBackButton = input<boolean>(true);
  readonly backUrl = input<string>('/inicio');

  constructor() {
    effect(() => {
      if (this.permissionService.hasAccess() && this.router.url.startsWith('/acesso-restrito')) {
        const target = this.permissionService.lastBlockedUrl() || '/configuracoes/sead/cargo-comissionado';
        this.router.navigateByUrl(target);
      }
    });
  }

  voltar() {
    this.router.navigate(['/inicio']);
  }
}


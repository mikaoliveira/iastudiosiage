import {
  Component,
  inject,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';

import {PermissionService} from './permission';
import {AcessoRestritoComponent} from './acesso-restrito';
import {SimulatorService} from './simulator';
import {ToastService} from './toast';

export interface CardConfigHierarquia {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge?: string;
}

/**
 * Modal simplificado da Estrutura de Subordinação entre os tipos de unidades.
 * Apresenta caixas simples e conexões que ilustram as regras de subordinação,
 * de forma compacta, equilibrada e sem dados de unidades cadastradas.
 */
@Component({
  selector: 'app-estrutura-hierarquica-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule
  ],
  styles: [`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }
  `],
  template: `
    <div 
      class="relative w-full bg-siage-surface text-siage-text-primary font-sans flex flex-col text-left box-border"
      role="dialog"
      aria-labelledby="estrutura-subordinacao-title"
    >
      <!-- Cabeçalho do Modal: Alinhado em largura total -->
      <div class="w-full px-6 pt-5 pb-4 border-b border-siage-border/40 bg-siage-surface shrink-0 flex items-start justify-between gap-3 box-border">
        <div class="pr-2">
          <h2 id="estrutura-subordinacao-title" class="text-base sm:text-lg font-poppins font-bold text-siage-text-primary tracking-tight leading-snug text-left">
            Estrutura de subordinação
          </h2>
          <p class="text-xs sm:text-sm text-siage-text-secondary mt-0.5 leading-normal">
            Consulte as relações de subordinação entre os tipos de unidades da estrutura organizacional.
          </p>
        </div>

        <button 
          type="button" 
          (click)="fechar()" 
          class="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg flex items-center justify-center text-siage-text-secondary hover:text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40 -mr-1.5 -mt-1"
          title="Fechar"
          aria-label="Fechar modal"
        >
          <mat-icon style="font-size: 18px; width: 18px; height: 18px;">close</mat-icon>
        </button>
      </div>

      <!-- Conteúdo do Modal: Organograma com dimensões equilibradas e sem espaço excessivo -->
      <div class="w-full px-6 py-5 font-sans bg-slate-50/40 dark:bg-slate-900/20 box-border">
        
        <div class="flex flex-col items-center select-none max-w-lg mx-auto w-full">
          
          <!-- Nível 1: Secretaria Geral (Topo) -->
          <div class="px-5 py-2.5 rounded-lg border border-siage-primary/40 bg-siage-primary/5 text-siage-primary font-poppins font-semibold text-xs sm:text-sm shadow-2xs text-center min-w-[170px]">
            Secretaria Geral
          </div>

          <!-- Conector vertical de Secretaria Geral até a bifurcação principal -->
          <div class="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>

          <!-- Ramificações a partir da Secretaria Geral:
               Esquerda: Secretaria Executiva
               Direita: Gerência Regional -->
          <div class="w-full grid grid-cols-2 gap-4 sm:gap-8">
            <!-- Conexão para a coluna esquerda (Secretaria Executiva) -->
            <div class="w-full h-4 relative">
              <div class="absolute top-0 left-1/2 right-[-8px] sm:right-[-16px] h-4 border-t border-l border-slate-300 dark:border-slate-600 rounded-tl-md"></div>
            </div>
            <!-- Conexão para a coluna direita (Gerência Regional) -->
            <div class="w-full h-4 relative">
              <div class="absolute top-0 right-1/2 left-[-8px] sm:left-[-16px] h-4 border-t border-r border-slate-300 dark:border-slate-600 rounded-tr-md"></div>
            </div>
          </div>

          <!-- Duas Colunas Hierárquicas Subordinadas à Secretaria Geral -->
          <div class="w-full grid grid-cols-2 gap-4 sm:gap-8 items-start">
            
            <!-- ============================================== -->
            <!-- RAMIFICAÇÃO ESQUERDA: LINHA EXECUTIVA          -->
            <!-- Sec. Executiva → Ger. Executiva → Subgerência → Núcleo -->
            <!-- ============================================== -->
            <div class="flex flex-col items-center">
              
              <!-- 1. Secretaria Executiva -->
              <div class="w-full max-w-[175px] px-2.5 sm:px-3 py-2 rounded-lg border border-siage-border bg-siage-surface text-siage-text-primary font-sans font-medium text-xs sm:text-sm shadow-2xs text-center">
                Secretaria Executiva
              </div>

              <!-- Conector vertical de Sec. Executiva até Gerência Executiva -->
              <div class="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>

              <!-- 2. Gerência Executiva -->
              <div class="w-full max-w-[175px] px-2.5 sm:px-3 py-2 rounded-lg border border-siage-border bg-siage-surface text-siage-text-primary font-sans font-medium text-xs sm:text-sm shadow-2xs text-center">
                Gerência Executiva
              </div>

              <!-- Conector vertical de Gerência Executiva até Subgerência -->
              <div class="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>

              <!-- 3. Subgerência -->
              <div class="w-full max-w-[175px] px-2.5 sm:px-3 py-2 rounded-lg border border-siage-border bg-siage-surface text-siage-text-primary font-sans font-medium text-xs sm:text-sm shadow-2xs text-center">
                Subgerência
              </div>

              <!-- Conector vertical de Subgerência até Núcleo -->
              <div class="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>

              <!-- 4. Núcleo (subordinado à Subgerência) -->
              <div class="w-full max-w-[175px] px-2.5 sm:px-3 py-2 rounded-lg border border-siage-border bg-siage-surface text-siage-text-primary font-sans font-medium text-xs sm:text-sm shadow-2xs text-center">
                Núcleo
              </div>
            </div>

            <!-- ============================================== -->
            <!-- RAMIFICAÇÃO DIREITA: GERÊNCIA REGIONAL         -->
            <!-- Gerência Regional → (Escola / Núcleo)          -->
            <!-- ============================================== -->
            <div class="flex flex-col items-center">
              
              <!-- 1. Gerência Regional (subordinada à Secretaria Geral) -->
              <div class="w-full max-w-[175px] px-2.5 sm:px-3 py-2 rounded-lg border border-siage-border bg-siage-surface text-siage-text-primary font-sans font-medium text-xs sm:text-sm shadow-2xs text-center">
                Gerência Regional
              </div>

              <!-- Conector vertical de Gerência Regional até a bifurcação de Escola e Núcleo -->
              <div class="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>

              <!-- Bifurcação para Escola e Núcleo -->
              <div class="w-full max-w-[195px] grid grid-cols-2 gap-2 sm:gap-2.5">
                <!-- Conexão para Escola -->
                <div class="w-full h-3.5 relative">
                  <div class="absolute top-0 left-1/2 right-[-4px] sm:right-[-5px] h-3.5 border-t border-l border-slate-300 dark:border-slate-600 rounded-tl-md"></div>
                </div>
                <!-- Conexão para Núcleo -->
                <div class="w-full h-3.5 relative">
                  <div class="absolute top-0 right-1/2 left-[-4px] sm:left-[-5px] h-3.5 border-t border-r border-slate-300 dark:border-slate-600 rounded-tr-md"></div>
                </div>
              </div>

              <!-- Sub-unidades de Gerência Regional: Escola (esquerda) e Núcleo (direita) -->
              <div class="w-full max-w-[195px] grid grid-cols-2 gap-2 sm:gap-2.5">
                <div class="w-full px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-lg border border-siage-border bg-siage-surface text-siage-text-primary font-sans font-medium text-xs sm:text-sm shadow-2xs text-center">
                  Escola
                </div>
                <div class="w-full px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-lg border border-siage-border bg-siage-surface text-siage-text-primary font-sans font-medium text-xs sm:text-sm shadow-2xs text-center">
                  Núcleo
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      <!-- Rodapé do Modal com Botão Fechar -->
      <div class="w-full px-6 py-3.5 border-t border-siage-border/40 bg-siage-surface shrink-0 flex items-center justify-end box-border">
        <button 
          type="button" 
          (click)="fechar()"
          class="h-10 px-6 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
        >
          Fechar
        </button>
      </div>
    </div>
  `
})
export class EstruturaHierarquicaModal {
  private readonly dialogRef = inject(MatDialogRef<EstruturaHierarquicaModal>);

  fechar() {
    this.dialogRef.close();
  }
}

/**
 * Página principal do módulo Hierarquia de Unidades e Cargos (/configuracoes/hierarquia).
 */
@Component({
  selector: 'app-hierarquia',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    AcessoRestritoComponent
  ],
  template: `
    @if (!hasAccess()) {
      <app-acesso-restrito backUrl="/inicio" />
    } @else {
      <div class="flex flex-col gap-6 font-sans pb-10">
        
        <!-- Breadcrumb: Início > Configurações > Hierarquia de Unidades e Cargos -->
        <nav aria-label="Breadcrumb" class="flex items-center gap-2 text-xs font-sans font-medium tracking-wide text-siage-text-secondary/70">
          <span 
            (click)="goHome()" 
            (keydown.enter)="goHome()" 
            tabindex="0" 
            role="button"
            class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline"
          >
            Início
          </span>
          <span class="text-[10px] text-siage-text-secondary/40 select-none" aria-hidden="true">/</span>
          <span 
            (click)="goConfiguracoes()" 
            (keydown.enter)="goConfiguracoes()" 
            tabindex="0" 
            role="button"
            class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline"
          >
            Configurações
          </span>
          <span class="text-[10px] text-siage-text-secondary/40 select-none" aria-hidden="true">/</span>
          <span class="text-siage-primary font-semibold" aria-current="page">
            Hierarquia de Unidades e Cargos
          </span>
        </nav>

        <!-- Cabeçalho da Página: Título com Seta Voltar, Descrição e Botão Secundário "Visualizar hierarquia" -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2 sm:gap-3">
              <button 
                mat-icon-button 
                type="button"
                (click)="goConfiguracoes()" 
                class="text-siage-text-secondary hover:text-siage-primary transition-colors cursor-pointer -ml-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                title="Voltar para Configurações"
                aria-label="Voltar para Configurações"
              >
                <mat-icon style="font-size: 22px; width: 22px; height: 22px;">arrow_back</mat-icon>
              </button>
              
              <h1 class="text-2xl sm:text-3xl font-poppins font-bold tracking-tight text-siage-text-primary leading-tight">
                Hierarquia de Unidades e Cargos
              </h1>
            </div>
            
            <p class="text-xs sm:text-sm text-siage-text-secondary font-sans leading-normal pl-8 sm:pl-9 max-w-2xl">
              Gerencie as configurações de hierarquia e consulte a estrutura de subordinação das unidades.
            </p>
          </div>

          <!-- Botão Secundário Visualizar Hierarquia acompanhado de ícone de organograma -->
          <div class="pl-8 sm:pl-0 shrink-0">
            <button 
              type="button"
              (click)="onVisualizarHierarquia()"
              class="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg border border-siage-border bg-siage-surface hover:bg-siage-primary/5 hover:border-siage-primary/40 text-siage-text-primary hover:text-siage-primary font-sans font-semibold text-sm transition-all shadow-xs active:scale-[0.99] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
              title="Visualizar a estrutura organizacional e relações de subordinação das unidades"
              aria-label="Visualizar hierarquia"
            >
              <mat-icon style="font-size: 20px; width: 20px; height: 20px;" class="text-siage-primary">account_tree</mat-icon>
              <span>Visualizar hierarquia</span>
            </button>
          </div>
        </div>

        <!-- Grade de Cards de Configuração (Padrão das telas de configurações existentes) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
          @for (card of cards; track card.id) {
            <div 
              (click)="onAcessar(card)"
              (keydown.enter)="onAcessar(card)"
              tabindex="0"
              role="button"
              [attr.aria-label]="'Acessar ' + card.title"
              class="group bg-siage-surface border border-siage-border hover:border-siage-primary/40 hover:shadow-md active:scale-[0.99] rounded-xl cursor-pointer transition-all duration-200 p-5 flex flex-col justify-between h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/30"
            >
              <!-- Topo do Card: Ícone, Título e Descrição curta -->
              <div class="flex flex-col gap-3">
                
                <div class="flex items-center justify-between">
                  <!-- Ícone destacado -->
                  <div class="w-12 h-12 rounded-xl bg-siage-primary/10 text-siage-primary flex items-center justify-center shrink-0 group-hover:bg-siage-primary/15 group-hover:scale-105 transition-all duration-200">
                    <mat-icon style="font-size: 24px; width: 24px; height: 24px;">{{ card.icon }}</mat-icon>
                  </div>

                  @if (card.badge) {
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      {{ card.badge }}
                    </span>
                  }
                </div>

                <!-- Título -->
                <h2 class="text-base font-poppins font-semibold text-siage-text-primary tracking-tight leading-snug group-hover:text-siage-primary transition-colors">
                  {{ card.title }}
                </h2>

                <!-- Descrição curta -->
                <p class="text-xs sm:text-sm text-siage-text-secondary leading-relaxed line-clamp-3">
                  {{ card.description }}
                </p>
              </div>

              <!-- Rodapé do Card com Ação Acessar -->
              <div class="pt-4 mt-4 border-t border-siage-border/40 flex items-center justify-between">
                <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-siage-primary group-hover:text-siage-primary/80 transition-colors">
                  <span>Acessar</span>
                  <mat-icon style="font-size: 14px; width: 14px; height: 14px;" class="group-hover:translate-x-1 transition-transform duration-150">arrow_forward</mat-icon>
                </span>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `
})
export class HierarquiaComponent {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly toastService = inject(ToastService);
  readonly permissionService = inject(PermissionService);
  readonly simulator = inject(SimulatorService);

  readonly hasAccess = computed(() => this.permissionService.hasAccess());

  readonly cards: CardConfigHierarquia[] = [
    {
      id: 'sec_geral',
      title: 'Configurar Secretaria Geral',
      description: 'Gerencie as secretarias gerais que compõem o nível superior da estrutura organizacional.',
      icon: 'domain'
    },
    {
      id: 'sec_executiva',
      title: 'Configurar Secretaria Executiva',
      description: 'Gerencie as secretarias executivas subordinadas à Secretaria Geral.',
      icon: 'corporate_fare'
    },
    {
      id: 'ger_executiva',
      title: 'Configurar Gerência Executiva',
      description: 'Gerencie as gerências executivas vinculadas às secretarias executivas.',
      icon: 'business_center'
    },
    {
      id: 'ger_regional',
      title: 'Configurar Gerência Regional',
      description: 'Gerencie as gerências regionais vinculadas à Secretaria Geral.',
      icon: 'location_city'
    },
    {
      id: 'subgerencia',
      title: 'Configurar Subgerência',
      description: 'Gerencie as subgerências subordinadas às gerências executivas.',
      icon: 'schema'
    },
    {
      id: 'nucleo',
      title: 'Configurar Núcleo',
      description: 'Gerencie os núcleos subordinados às subgerências ou gerências regionais.',
      icon: 'device_hub'
    },
    {
      id: 'excecao_hierarquia',
      title: 'Exceção de Hierarquia',
      description: 'Configure aprovadores de exceção para atuar sempre ou quando a chefia imediata estiver indisponível ou não definida.',
      icon: 'rule'
    }
  ];

  onVisualizarHierarquia() {
    this.router.navigate(['/configuracoes/hierarquia/visualizar']);
  }

  abrirModalOrganograma() {
    this.dialog.open(EstruturaHierarquicaModal, {
      width: '680px',
      maxWidth: 'calc(100vw - 2.5rem)',
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
      autoFocus: false,
      disableClose: false
    });
  }

  onAcessar(card: CardConfigHierarquia) {
    if (card.id === 'sec_geral') {
      this.router.navigate(['/configuracoes/hierarquia/secretaria-geral']);
      return;
    }
    if (card.id === 'sec_executiva') {
      this.router.navigate(['/configuracoes/hierarquia/secretaria-executiva']);
      return;
    }
    if (card.id === 'ger_executiva') {
      this.router.navigate(['/configuracoes/hierarquia/gerencia-executiva']);
      return;
    }
    if (card.id === 'ger_regional') {
      this.router.navigate(['/configuracoes/hierarquia/gerencia-regional']);
      return;
    }
    if (card.id === 'subgerencia') {
      this.router.navigate(['/configuracoes/hierarquia/subgerencia']);
      return;
    }
    if (card.id === 'nucleo') {
      this.router.navigate(['/configuracoes/hierarquia/nucleo']);
      return;
    }
    if (card.id === 'excecao_hierarquia') {
      this.router.navigate(['/configuracoes/hierarquia/excecao-hierarquia']);
      return;
    }
    this.toastService.info(`Funcionalidade "${card.title}" em desenvolvimento.`);
  }

  goConfiguracoes() {
    this.router.navigate(['/configuracoes']);
  }

  goHome() {
    this.router.navigate(['/inicio']);
  }
}

import {Component, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import {Router} from '@angular/router';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {CommonModule} from '@angular/common';
import {PermissionService} from './permission';
import {AcessoRestritoComponent} from './acesso-restrito';
import {SimulatorService} from './simulator';
import {ToastService} from './toast';

export interface ConfigItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  route?: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hub-configuracoes',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    AcessoRestritoComponent
  ],
  template: `
    @if (!hasAccess()) {
      <app-acesso-restrito backUrl="/inicio" />
    } @else {
      <div class="flex flex-col gap-6 font-sans pb-10">
        
        <!-- Breadcrumbs: Início / Configurações -->
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
          <span class="text-siage-primary font-semibold" aria-current="page">Configurações</span>
        </nav>

        <!-- Título e Descrição da página -->
        <div>
          <h1 class="text-2xl sm:text-3xl font-poppins font-bold tracking-tight text-siage-text-primary">Configurações</h1>
          <p class="text-sm text-siage-text-secondary mt-1 max-w-2xl">
            Cadastre e mantenha as tabelas de referência e os parâmetros do SIAGE-RH.
          </p>
        </div>

        <!-- Filtro de Busca -->
        <div class="w-full form-field-group max-w-xl">
          <label for="hub-search-input" class="form-label">Buscar configuração</label>
          <mat-form-field appearance="outline" class="w-full font-sans" subscriptSizing="fixed">
            <mat-icon matPrefix class="text-siage-text-secondary mr-2">search</mat-icon>
            <input 
              matInput 
              placeholder="Digite o nome da configuração (ex.: SEAD, permissões, afastamento)"
              [formControl]="controle"
              id="hub-search-input"
            />
            @if (controle.value) {
              <button type="button" (click)="onLimpar()" class="text-siage-text-secondary hover:text-siage-text-primary p-1 cursor-pointer" aria-label="Limpar busca">
                <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
              </button>
            }
          </mat-form-field>
        </div>

        <!-- Estados da Visualização -->
        @if (isCarregando()) {
          <!-- Skeleton Loading em Grid idêntico -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 min-[1600px]:grid-cols-3 gap-5" aria-busy="true" aria-label="Carregando configurações">
            @for (i of [1, 2, 3, 4, 5, 6]; track i) {
              <div class="h-56 p-5 bg-siage-surface border border-siage-border rounded-xl shadow-xs animate-pulse flex flex-col justify-between">
                <div class="flex flex-col gap-3">
                  <div class="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700/60"></div>
                  <div class="h-5 w-40 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                  <div class="h-3 w-5/6 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
                  <div class="h-3 w-2/3 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
                </div>
                <div class="pt-3 border-t border-siage-border/40 flex justify-between items-center">
                  <div class="h-4 w-20 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                  <div class="h-4 w-4 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                </div>
              </div>
            }
          </div>
        } @else if (isErro()) {
          <div class="py-14 px-6 bg-siage-surface border border-siage-border rounded-xl flex flex-col items-center justify-center text-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-siage-destructive/10 text-siage-destructive flex items-center justify-center">
              <mat-icon style="font-size: 24px; width: 24px; height: 24px;">error_outline</mat-icon>
            </div>
            <div class="flex flex-col gap-1 max-w-md">
              <h3 class="text-base font-poppins font-semibold text-siage-text-primary">Não foi possível carregar os dados</h3>
              <p class="text-xs sm:text-sm text-siage-text-secondary">
                Verifique sua conexão e tente novamente.
              </p>
            </div>
            <button 
              type="button" 
              (click)="carregarDados()" 
              class="mt-2 inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
            >
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">refresh</mat-icon>
              <span>Tentar novamente</span>
            </button>
          </div>
        } @else if (isSemRegistros()) {
          <div class="py-16 px-6 bg-siage-surface border border-siage-border rounded-xl flex flex-col items-center justify-center text-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-siage-text-secondary/10 text-siage-text-secondary flex items-center justify-center">
              <mat-icon style="font-size: 24px; width: 24px; height: 24px;">inbox</mat-icon>
            </div>
            <div class="flex flex-col gap-1 max-w-md">
              <h3 class="text-base font-poppins font-semibold text-siage-text-primary">Nenhum registro cadastrado</h3>
              <p class="text-xs sm:text-sm text-siage-text-secondary">
                Ainda não existem configurações disponíveis neste módulo.
              </p>
            </div>
          </div>
        } @else if (isSemResultadoFiltro()) {
          <div class="py-16 px-6 bg-siage-surface border border-siage-border rounded-xl flex flex-col items-center justify-center text-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-siage-text-secondary/10 text-siage-text-secondary flex items-center justify-center">
              <mat-icon style="font-size: 24px; width: 24px; height: 24px;">search_off</mat-icon>
            </div>
            <div class="flex flex-col gap-1 max-w-md">
              <h3 class="text-base font-poppins font-semibold text-siage-text-primary">Nenhum resultado encontrado</h3>
              <p class="text-xs sm:text-sm text-siage-text-secondary">
                Nenhum registro corresponde aos filtros aplicados.
              </p>
            </div>
          </div>
        } @else {
          <!-- GRID DE CARDS INDEPENDENTES (Padrão Configurações: até 8 opções -> 3 cards por linha em desktop) -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 min-[1600px]:grid-cols-3 gap-5">
            @for (item of filteredItems(); track item.id) {
              <div 
                (click)="onItemClick(item)"
                (keydown.enter)="onItemClick(item)"
                tabindex="0"
                role="button"
                [attr.aria-label]="'Acessar ' + item.title"
                class="group bg-siage-surface border border-siage-border hover:border-siage-primary/40 hover:shadow-md active:scale-[0.99] rounded-xl cursor-pointer transition-all duration-200 p-5 flex flex-col justify-between h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/30"
              >
                <!-- Topo do Card: Ícone, Título e Descrição curta -->
                <div class="flex flex-col gap-3">
                  <!-- Ícone destacado -->
                  <div class="w-12 h-12 rounded-xl bg-siage-primary/10 text-siage-primary flex items-center justify-center shrink-0 group-hover:bg-siage-primary/15 group-hover:scale-105 transition-all duration-200">
                    <mat-icon style="font-size: 24px; width: 24px; height: 24px;">{{ item.icon }}</mat-icon>
                  </div>

                  <!-- Título -->
                  <h3 class="text-base font-poppins font-semibold text-siage-text-primary tracking-tight leading-snug group-hover:text-siage-primary transition-colors">
                    {{ item.title }}
                  </h3>

                  <!-- Descrição curta -->
                  <p class="text-xs sm:text-sm text-siage-text-secondary leading-relaxed line-clamp-3">
                    {{ item.description }}
                  </p>
                </div>

                <!-- Rodapé do Card: Botão “Acessar →” alinhado -->
                <div class="mt-5 pt-3.5 border-t border-siage-border/50 flex items-center justify-between">
                  <button 
                    type="button" 
                    (click)="onItemClick(item); $event.stopPropagation()"
                    class="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-siage-primary group-hover:text-siage-primary/80 transition-colors cursor-pointer"
                  >
                    <span>Acessar</span>
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="group-hover:translate-x-1 transition-transform duration-150">arrow_forward</mat-icon>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    }
  `
})
export class HubConfiguracoes {
  private readonly router = inject(Router);
  readonly permissionService = inject(PermissionService);
  readonly simulator = inject(SimulatorService);
  private readonly toastService = inject(ToastService);

  readonly hasAccess = computed(() => this.permissionService.hasAccess());
  readonly isLoading = signal(false);

  readonly controle = new FormControl('', {nonNullable: true});
  readonly searchQuery = signal('');

  constructor() {
    this.controle.valueChanges.subscribe(val => {
      this.searchQuery.set(val || '');
    });
  }

  // Preserve todas as configurações já existentes no protótipo:
  // Comissão de Avaliação, Notificação, Cabeçalho do Sistema, Hierarquia de Unidades e Cargos, SEAD, Permissões, Tipo de Afastamento, Ficha Financeira
  readonly items: ConfigItem[] = [
    {
      id: 'comissao',
      title: 'Comissão de Avaliação',
      description: 'Membros e composição das comissões avaliadoras.',
      icon: 'groups'
    },
    {
      id: 'notificacao',
      title: 'Notificação',
      description: 'Modelos e canais de aviso do sistema.',
      icon: 'notifications'
    },
    {
      id: 'cabecalho',
      title: 'Cabeçalho do Sistema',
      description: 'Identidade e textos institucionais.',
      icon: 'view_headline'
    },
    {
      id: 'hierarquia',
      title: 'Hierarquia de Unidades e Cargos',
      description: 'Unidades organizacionais e vínculos.',
      icon: 'account_tree',
      route: '/configuracoes/hierarquia'
    },
    {
      id: 'sead',
      title: 'SEAD',
      description: 'Tabelas que tipificam os profissionais importados.',
      icon: 'account_balance',
      route: '/configuracoes/sead'
    },
    {
      id: 'permissoes',
      title: 'Permissões',
      description: 'Perfis e controle de acesso.',
      icon: 'lock'
    },
    {
      id: 'afastamento',
      title: 'Tipo de Afastamento',
      description: 'Categorias de afastamento de servidores.',
      icon: 'event_busy'
    },
    {
      id: 'ficha_financeira',
      title: 'Ficha Financeira',
      description: 'Parâmetros da ficha financeira.',
      icon: 'request_quote'
    }
  ];

  readonly isCarregando = computed(() => {
    return this.simulator.currentScenario() === 'loading' || this.isLoading();
  });

  readonly isErro = computed(() => {
    return this.simulator.currentScenario() === 'error';
  });

  readonly isSemRegistros = computed(() => {
    return this.simulator.currentScenario() === 'empty';
  });

  readonly isSemResultadoFiltro = computed(() => {
    if (this.simulator.currentScenario() === 'no_filter_results') return true;
    return this.filteredItems().length === 0 && !!this.searchQuery().trim();
  });

  readonly filteredItems = computed(() => {
    if (!this.permissionService.canLoadProtectedData()) return [];
    if (this.simulator.currentScenario() === 'no_filter_results' || this.simulator.currentScenario() === 'empty') {
      return [];
    }
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.items;
    return this.items.filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.description.toLowerCase().includes(query)
    );
  });

  carregarDados() {
    if (!this.permissionService.canLoadProtectedData()) return;
    if (this.simulator.currentScenario() === 'error') {
      this.simulator.setScenario('normal');
    }
    this.isLoading.set(true);
    setTimeout(() => {
      this.isLoading.set(false);
    }, 350);
  }

  onLimpar() {
    this.controle.setValue('');
    this.searchQuery.set('');
    if (this.simulator.currentScenario() === 'no_filter_results') {
      this.simulator.setScenario('normal');
    }
    this.carregarDados();
  }

  goHome() {
    this.router.navigate(['/inicio']);
  }

  onItemClick(item: ConfigItem) {
    if (item.route) {
      this.router.navigate([item.route]);
    } else {
      this.toastService.info(`Funcionalidade "${item.title}" em desenvolvimento.`);
    }
  }
}

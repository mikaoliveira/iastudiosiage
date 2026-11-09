import {Component, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import {Router} from '@angular/router';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {CommonModule} from '@angular/common';
import {PermissionService} from './permission';
import {AcessoRestritoComponent} from './acesso-restrito';
import {SimulatorService} from './simulator';
import {ToastService} from './toast';

export interface SeadItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  route?: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-indice-sead',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    AcessoRestritoComponent
  ],
  template: `
    @if (!hasAccess()) {
      <app-acesso-restrito backUrl="/inicio" />
    } @else {
      <div class="flex flex-col gap-6 font-sans pb-10">
        
        <!-- Breadcrumbs: Início / Configurações / SEAD -->
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
            (click)="goBack()" 
            (keydown.enter)="goBack()" 
            tabindex="0" 
            role="button"
            class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline"
          >
            Configurações
          </span>
          <span class="text-[10px] text-siage-text-secondary/40 select-none" aria-hidden="true">/</span>
          <span class="text-siage-primary font-semibold" aria-current="page">SEAD</span>
        </nav>

        <!-- Título com botão Voltar e Descrição -->
        <div>
          <div class="flex items-center gap-3">
            <button 
              mat-icon-button 
              type="button"
              (click)="goBack()" 
              class="text-siage-text-secondary hover:text-siage-primary transition-colors cursor-pointer"
              aria-label="Voltar para Configurações"
              title="Voltar para Configurações"
            >
              <mat-icon>arrow_back</mat-icon>
            </button>
            <h1 class="text-2xl sm:text-3xl font-poppins font-bold tracking-tight text-siage-text-primary">SEAD</h1>
          </div>
          
          <p class="text-sm text-siage-text-secondary mt-1 max-w-2xl">
            Tabelas que tipificam os profissionais importados pelo SEAD.
          </p>
        </div>

        <!-- Filtro de Busca -->
        <div class="w-full form-field-group max-w-xl">
          <label for="sead-search-input" class="form-label">Buscar tabela</label>
          <mat-form-field appearance="outline" class="w-full font-sans" subscriptSizing="fixed">
            <mat-icon matPrefix class="text-siage-text-secondary mr-2">search</mat-icon>
            <input 
              matInput 
              placeholder="Digite o nome da tabela (ex.: Cargo Comissionado, Admissão)"
              [formControl]="controle"
              id="sead-search-input"
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
          <!-- Skeleton Loading em Grid Compacto de Sublista -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5" aria-busy="true" aria-label="Carregando tabelas SEAD">
            @for (i of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; track i) {
              <div class="h-[142px] p-4 bg-siage-surface border border-siage-border rounded-xl shadow-xs animate-pulse flex flex-col justify-between">
                <div class="flex flex-col gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700/60"></div>
                  <div class="h-4 w-28 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                </div>
                <div class="pt-2 border-t border-siage-border/40 flex justify-between items-center">
                  <div class="h-3 w-14 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                  <div class="h-3 w-3 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
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
                Ainda não existem tabelas cadastradas para esta funcionalidade.
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
          <!-- GRID DE CARDS COMPACTOS (PADRÃO SUBLISTA: 5 cards/linha em desktop largo, 4 em desktop padrão, 2-3 em telas menores) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
            @for (item of filteredItems(); track item.id) {
              <div 
                (click)="onItemClick(item)"
                (keydown.enter)="onItemClick(item)"
                tabindex="0"
                role="button"
                [attr.aria-label]="'Acessar ' + item.title"
                class="group bg-siage-surface border border-siage-border hover:border-siage-primary/40 hover:shadow-md active:scale-[0.99] rounded-xl cursor-pointer transition-all duration-200 p-4 flex flex-col justify-between h-[142px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/30"
              >
                <!-- Topo: Pequeno container visual de ícone + Título em destaque (SEM descrição) -->
                <div class="flex flex-col gap-2.5">
                  <!-- Ícone em pequeno container visual no topo -->
                  <div class="w-8 h-8 rounded-lg bg-siage-primary/10 text-siage-primary flex items-center justify-center shrink-0 group-hover:bg-siage-primary/15 group-hover:scale-105 transition-all duration-200">
                    <mat-icon style="font-size: 18px; width: 18px; height: 18px;">{{ item.icon }}</mat-icon>
                  </div>

                  <!-- Nome da funcionalidade (Título em destaque) -->
                  <h3 class="text-sm font-poppins font-semibold text-siage-text-primary tracking-tight leading-snug group-hover:text-siage-primary transition-colors line-clamp-2">
                    {{ item.title }}
                  </h3>
                </div>

                <!-- Rodapé: Ação Acessar → na parte inferior -->
                <div class="pt-2 border-t border-siage-border/40 flex items-center justify-between">
                  <button 
                    type="button" 
                    (click)="onItemClick(item); $event.stopPropagation()"
                    class="inline-flex items-center gap-1.5 text-xs font-semibold text-siage-primary group-hover:text-siage-primary/80 transition-colors cursor-pointer"
                  >
                    <span>Acessar</span>
                    <mat-icon style="font-size: 14px; width: 14px; height: 14px;" class="group-hover:translate-x-1 transition-transform duration-150">arrow_forward</mat-icon>
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
export class IndiceSead {
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

  // 17 opções do SEAD preservando todos os itens já existentes no projeto
  readonly items: SeadItem[] = [
    { 
      id: 'cargo', 
      title: 'Cargo', 
      description: 'Cadastro dos cargos efetivos e do quadro estadual.', 
      icon: 'badge',
      route: '/configuracoes/sead/cargo'
    },
    { 
      id: 'cargo_comissionado', 
      title: 'Cargo Comissionado', 
      description: 'Cargos de provimento em comissão e funções de confiança.', 
      icon: 'badge',
      route: '/configuracoes/sead/cargo-comissionado'
    },
    { 
      id: 'classificacao_funcional', 
      title: 'Classificação Funcional', 
      description: 'Grupos ocupacionais e classificações de servidores.', 
      icon: 'checklist',
      route: '/configuracoes/sead/classificacao-funcional'
    },
    { 
      id: 'forma_admissao', 
      title: 'Forma de Admissão', 
      description: 'Modalidades de admissão e formas de ingresso no serviço público.', 
      icon: 'login',
      route: '/configuracoes/sead/forma-de-admissao'
    },
    { 
      id: 'formacao_academica', 
      title: 'Formação Acadêmica', 
      description: 'Cursos superiores, áreas de formação e titulações acadêmicas.', 
      icon: 'workspace_premium',
      route: '/configuracoes/sead/formacao-academica'
    },
    { 
      id: 'funcao', 
      title: 'Função', 
      description: 'Funções gratificadas e encargos atribuídos a servidores.', 
      icon: 'account_tree',
      route: '/configuracoes/sead/funcao'
    },
    { 
      id: 'grau_instrucao', 
      title: 'Grau de Instrução', 
      description: 'Níveis de escolaridade e graus de instrução formal.', 
      icon: 'stairs',
      route: '/configuracoes/sead/grau-de-instrucao'
    },
    { 
      id: 'modalidade_ensino', 
      title: 'Modalidade de Ensino', 
      description: 'Modalidades de ensino formal e educação profissional.', 
      icon: 'school',
      route: '/configuracoes/sead/modalidade-de-ensino'
    },
    { 
      id: 'motivo_saida', 
      title: 'Motivo da Saída', 
      description: 'Motivos de vacância, exoneração, demissão e encerramento.', 
      icon: 'logout',
      route: '/configuracoes/sead/motivo-da-saida'
    },
    { 
      id: 'professores_emergencial_militares_base_tecnica', 
      title: 'Professores em contratação emergencial, Militares e Base Técnica', 
      description: 'Cadastre e mantenha os professores vinculados a estas modalidades.', 
      icon: 'assignment_ind',
      route: '/configuracoes/sead/professores-emergencial-militares-base-tecnica'
    },
    { 
      id: 'regime_contratacao', 
      title: 'Regime de Contratação', 
      description: 'Regimes jurídicos estatutário, celetista e especiais.', 
      icon: 'description',
      route: '/configuracoes/sead/regime-de-contratacao'
    },
    { 
      id: 'situacao_funcional', 
      title: 'Situação Funcional', 
      description: 'Estados e situações de atividade funcional do servidor.', 
      icon: 'how_to_reg',
      route: '/configuracoes/sead/situacao-funcional'
    },
    { 
      id: 'tipo_aposentadoria', 
      title: 'Tipo de Aposentadoria', 
      description: 'Modalidades e tipos de concessão de aposentadoria.', 
      icon: 'schedule',
      route: '/configuracoes/sead/tipo-de-aposentadoria'
    },
    { 
      id: 'tipo_cargo_comissionado', 
      title: 'Tipo de Cargo Comissionado', 
      description: 'Tipos e níveis hierárquicos de comissões.', 
      icon: 'work',
      route: '/configuracoes/sead/tipo-de-cargo-comissionado'
    },
    { 
      id: 'vinculo_funcional', 
      title: 'Vínculo Funcional', 
      description: 'Tipos de vínculo e relações de trabalho no serviço público.', 
      icon: 'link' 
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
    const list = !query ? this.items : this.items.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    );
    return [...list].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' }));
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

  goBack() {
    this.router.navigate(['/configuracoes']);
  }

  onItemClick(item: SeadItem) {
    if (item.route) {
      this.router.navigate([item.route]);
    } else {
      this.toastService.info(`Tabela "${item.title}" em fase de homologação.`);
    }
  }
}

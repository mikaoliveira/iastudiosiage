import {Component, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import {Router} from '@angular/router';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {AuthSessionService} from './auth-session';
import {PermissionService} from './permission';
import {ToastService} from './toast';

export interface FuncionalidadeItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  route?: string;
  requiresAdmin?: boolean;
}

export interface ModuloFuncionalidades {
  id: string;
  name: string;
  icon: string;
  requiresAdmin?: boolean;
  items: FuncionalidadeItem[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-busca-global',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="flex flex-col gap-6 font-sans pb-12">
      <!-- Breadcrumb: Início / Busca global -->
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
        <span class="text-siage-primary font-semibold" aria-current="page">Busca global</span>
      </nav>

      <!-- Título e Descrição da página -->
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl sm:text-3xl font-poppins font-bold tracking-tight text-siage-text-primary">
          Buscar funcionalidade
        </h1>
        <p class="text-sm text-siage-text-secondary max-w-2xl leading-relaxed">
          Busque entre as funcionalidades disponíveis no SIAGE-RH.
        </p>
      </div>

      <!-- Campo de Busca -->
      <div class="w-full max-w-2xl">
        <label for="global-search-input" class="sr-only">Buscar por módulo ou funcionalidade</label>
        <mat-form-field appearance="outline" class="w-full font-sans" subscriptSizing="fixed">
          <mat-icon matPrefix class="text-siage-text-secondary mr-2">search</mat-icon>
          <input 
            matInput 
            placeholder="Buscar por módulo ou funcionalidade"
            [formControl]="searchControl"
            id="global-search-input"
            autocomplete="off"
          />
          @if (searchControl.value) {
            <button 
              type="button" 
              (click)="clearSearch()" 
              class="text-siage-text-secondary hover:text-siage-text-primary p-1 cursor-pointer transition-colors" 
              aria-label="Limpar busca"
            >
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">close</mat-icon>
            </button>
          }
        </mat-form-field>
      </div>

      <!-- Apresentação dos Resultados Agrupados por Módulo -->
      @if (filteredModules().length > 0) {
        <div class="flex flex-col gap-8">
          @for (modulo of filteredModules(); track modulo.id) {
            <section class="flex flex-col gap-3" [attr.aria-labelledby]="'modulo-title-' + modulo.id">
              <!-- Cabeçalho do Módulo (Agrupador) -->
              <div class="flex items-center justify-between pb-2 border-b border-siage-border/60">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-siage-primary/10 text-siage-primary flex items-center justify-center shrink-0">
                    <mat-icon style="font-size: 18px; width: 18px; height: 18px;">{{ modulo.icon }}</mat-icon>
                  </div>
                  <h2 [id]="'modulo-title-' + modulo.id" class="text-base sm:text-lg font-poppins font-bold text-siage-text-primary tracking-tight">
                    {{ modulo.name }}
                  </h2>
                </div>
                <span class="text-xs font-semibold text-siage-text-secondary bg-siage-surface border border-siage-border px-2.5 py-0.5 rounded-full font-sans">
                  {{ modulo.items.length }} {{ modulo.items.length === 1 ? 'funcionalidade' : 'funcionalidades' }}
                </span>
              </div>

              <!-- Grid de Cards das Funcionalidades do Módulo -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                @for (item of modulo.items; track item.id) {
                  <div 
                    (click)="onAccessItem(item)"
                    (keydown.enter)="onAccessItem(item)"
                    tabindex="0"
                    role="button"
                    [attr.aria-label]="'Acessar funcionalidade ' + item.title"
                    class="group bg-siage-surface border border-siage-border hover:border-siage-primary/40 hover:shadow-md active:scale-[0.99] rounded-xl cursor-pointer transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/30"
                  >
                    <!-- Topo do Card -->
                    <div class="flex flex-col gap-2.5">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-siage-primary/10 text-siage-primary flex items-center justify-center shrink-0 group-hover:bg-siage-primary/15 group-hover:scale-105 transition-all duration-200">
                          <mat-icon style="font-size: 20px; width: 20px; height: 20px;">{{ item.icon }}</mat-icon>
                        </div>
                        <h3 class="text-sm sm:text-base font-poppins font-semibold text-siage-text-primary tracking-tight leading-snug group-hover:text-siage-primary transition-colors">
                          {{ item.title }}
                        </h3>
                      </div>

                      <p class="text-xs text-siage-text-secondary leading-relaxed line-clamp-2 mt-1">
                        {{ item.description }}
                      </p>
                    </div>

                    <!-- Rodapé do Card com Acessar -->
                    <div class="mt-4 pt-3 border-t border-siage-border/50 flex items-center justify-between">
                      <span class="text-[11px] text-siage-text-secondary/70 font-medium">
                        {{ modulo.name }}
                      </span>
                      <button 
                        type="button" 
                        (click)="onAccessItem(item); $event.stopPropagation()"
                        class="inline-flex items-center gap-1.5 text-xs font-semibold text-siage-primary group-hover:text-siage-primary/80 transition-colors cursor-pointer"
                      >
                        <span>Acessar</span>
                        <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="group-hover:translate-x-1 transition-transform duration-150">arrow_forward</mat-icon>
                      </button>
                    </div>
                  </div>
                }
              </div>
            </section>
          }
        </div>
      } @else {
        <!-- Estado Vazio Amigável -->
        <div class="py-14 sm:py-20 px-6 bg-siage-surface border border-siage-border rounded-2xl flex flex-col items-center justify-center text-center gap-3 max-w-md mx-auto my-4 transition-all">
          <div class="w-14 h-14 rounded-2xl bg-siage-primary/10 text-siage-primary flex items-center justify-center">
            <mat-icon style="font-size: 28px; width: 28px; height: 28px;">search_off</mat-icon>
          </div>
          <div class="flex flex-col gap-1">
            <h3 class="text-base sm:text-lg font-poppins font-semibold text-siage-text-primary">
              Nenhuma funcionalidade encontrada
            </h3>
            <p class="text-xs sm:text-sm text-siage-text-secondary leading-relaxed">
              Não encontramos resultados para <span class="font-semibold text-siage-text-primary">"{{ searchControl.value }}"</span>. 
              Verifique a grafia ou tente buscar por termos gerais como <span class="italic text-siage-text-primary">cargo</span>, <span class="italic text-siage-text-primary">sead</span> ou <span class="italic text-siage-text-primary">avaliação</span>.
            </p>
          </div>
          <button 
            mat-stroked-button 
            type="button" 
            (click)="clearSearch()"
            class="mt-2 font-sans font-semibold border border-siage-border text-siage-text-primary px-4 py-1.5 rounded-lg hover:bg-siage-primary/5 transition-all cursor-pointer"
          >
            Limpar busca
          </button>
        </div>
      }
    </div>
  `
})
export class BuscaGlobal {
  private readonly router = inject(Router);
  readonly authService = inject(AuthSessionService);
  readonly permissionService = inject(PermissionService);
  private readonly toastService = inject(ToastService);

  readonly searchControl = new FormControl('', {nonNullable: true});
  readonly searchQuery = signal('');

  constructor() {
    this.searchControl.valueChanges.subscribe(val => {
      this.searchQuery.set(val || '');
    });
  }

  goHome() {
    this.router.navigate(['/inicio']);
  }

  clearSearch() {
    this.searchControl.setValue('');
  }

  onAccessItem(item: FuncionalidadeItem) {
    if (item.route) {
      this.router.navigate([item.route]);
    } else {
      this.toastService.info(`Funcionalidade "${item.title}" em desenvolvimento.`);
    }
  }

  // Lista de todos os módulos e funcionalidades existentes no protótipo SIAGE-RH V2
  private readonly allModules: ModuloFuncionalidades[] = [
    {
      id: 'configuracoes',
      name: 'Configurações',
      icon: 'settings',
      requiresAdmin: true,
      items: [
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
          id: 'sead_geral',
          title: 'SEAD',
          description: 'Tabelas que tipificam os profissionais importados pelo SEAD.',
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
          id: 'ficha_financeira_config',
          title: 'Ficha Financeira',
          description: 'Parâmetros da ficha financeira.',
          icon: 'request_quote'
        }
      ]
    },
    {
      id: 'configuracoes_sead',
      name: 'Configurações > SEAD',
      icon: 'account_balance',
      requiresAdmin: true,
      items: [
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
          icon: 'work_history',
          route: '/configuracoes/sead/regime-de-contratacao'
        },
        { 
          id: 'situacao_funcional', 
          title: 'Situação Funcional', 
          description: 'Situações ativas, inativas e transitórias de servidores.', 
          icon: 'badge',
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
          id: 'unidade_pagamento', 
          title: 'Unidade de Pagamento', 
          description: 'Folhas de pagamento e unidades de desembolso.', 
          icon: 'payments' 
        },
        { 
          id: 'vinculo', 
          title: 'Vínculo', 
          description: 'Natureza do vínculo funcional dos servidores estaduais.', 
          icon: 'link' 
        }
      ]
    },
    {
      id: 'avaliacao',
      name: 'Avaliação de Desempenho',
      icon: 'bar_chart',
      items: [
        {
          id: 'ciclos_avaliacao',
          title: 'Ciclos de Avaliação',
          description: 'Abertura, acompanhamento e prazos dos ciclos de avaliação.',
          icon: 'event_available'
        },
        {
          id: 'autoavaliacao',
          title: 'Autoavaliação',
          description: 'Preenchimento e consulta da autoavaliação do servidor.',
          icon: 'assignment_ind'
        },
        {
          id: 'avaliacao_chefia',
          title: 'Avaliação da Chefia',
          description: 'Formulários de avaliação submetidos pela chefia imediata.',
          icon: 'rate_review'
        },
        {
          id: 'relatorios_desempenho',
          title: 'Relatórios de Desempenho',
          description: 'Consolidação de notas, metas e resultados individuais.',
          icon: 'analytics'
        }
      ]
    },
    {
      id: 'profissionais',
      name: 'Profissionais',
      icon: 'group',
      items: [
        {
          id: 'consulta_servidores',
          title: 'Consulta de Servidores',
          description: 'Pesquisa cadastral e localização de dados de servidores.',
          icon: 'person_search'
        },
        {
          id: 'lotacao_exercicio',
          title: 'Lotação e Exercício',
          description: 'Gerenciamento de lotação, unidades de ensino e exercício.',
          icon: 'domain'
        },
        {
          id: 'ficha_cadastral',
          title: 'Ficha Cadastral',
          description: 'Visualização dos registros funcionais e dados pessoais.',
          icon: 'contact_page'
        }
      ]
    },
    {
      id: 'quadro',
      name: 'Quadro Funcional',
      icon: 'assignment',
      items: [
        {
          id: 'estrutura_cargos',
          title: 'Estrutura de Cargos',
          description: 'Distribuição e quantitativo de cargos por órgão e unidade.',
          icon: 'table_chart'
        },
        {
          id: 'vagas_provimentos',
          title: 'Vagas e Provimentos',
          description: 'Controle de vagas ocupadas, disponíveis e autorizadas.',
          icon: 'domain_verification'
        },
        {
          id: 'dimensionamento',
          title: 'Dimensionamento da Força de Trabalho',
          description: 'Planejamento e alocação do efetivo educacional.',
          icon: 'hub'
        }
      ]
    },
    {
      id: 'afastamentos',
      name: 'Afastamentos',
      icon: 'event_busy',
      items: [
        {
          id: 'registro_afastamento',
          title: 'Registro de Afastamento',
          description: 'Lançamento de licenças, faltas justificadas e licença-prêmio.',
          icon: 'event_busy'
        },
        {
          id: 'historico_afastamento',
          title: 'Histórico de Ocorrências',
          description: 'Consulta detalhada aos períodos de afastamento do servidor.',
          icon: 'history'
        }
      ]
    },
    {
      id: 'ficha_financeira',
      name: 'Ficha Financeira',
      icon: 'request_quote',
      items: [
        {
          id: 'consulta_rendimentos',
          title: 'Consulta de Rendimentos',
          description: 'Histórico de contracheques e demonstrativos mensais.',
          icon: 'payments'
        },
        {
          id: 'comprovante_rendimentos',
          title: 'Comprovante de Rendimentos',
          description: 'Informe oficial para declaração de imposto de renda.',
          icon: 'receipt_long'
        }
      ]
    },
    {
      id: 'meus_dados',
      name: 'Meus Dados',
      icon: 'person',
      items: [
        {
          id: 'dados_pessoais',
          title: 'Dados Pessoais',
          description: 'Informações cadastrais, documentos e canais de contato.',
          icon: 'account_circle'
        },
        {
          id: 'vinculos_funcionais',
          title: 'Vínculos Funcionais',
          description: 'Matrículas ativas, histórico de cargos e atribuições.',
          icon: 'badge'
        }
      ]
    }
  ];

  // Normaliza strings removendo acentos para busca insensível
  private normalizeStr(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  // Permissões dinâmicas:
  // - Respeita o PermissionService (hasAccess)
  // - Respeita o perfil ativo da matrícula atual
  private userHasPermissionForModule(modulo: ModuloFuncionalidades): boolean {
    if (modulo.requiresAdmin) {
      if (!this.permissionService.hasAccess()) {
        return false;
      }
      const role = this.authService.getCurrentUserRole().toLowerCase();
      // Administrador e Gestor possuem acesso irrestrito às Configurações e SEAD
      const isAdminOrManager = role.includes('admin') || role.includes('gestor') || role.includes('técnico');
      return isAdminOrManager;
    }
    return true;
  }

  // Filtragem dinâmica por termo de busca + permissões ativas
  readonly filteredModules = computed(() => {
    const rawQuery = this.searchQuery();
    const query = this.normalizeStr(rawQuery);

    return this.allModules
      // 1. Filtra por permissão do usuário/matrícula atual
      .filter(modulo => this.userHasPermissionForModule(modulo))
      // 2. Filtra por termo de busca
      .map(modulo => {
        const moduloNameMatches = this.normalizeStr(modulo.name).includes(query);

        if (!query) {
          return modulo;
        }

        // Se o nome do módulo bate diretamente com a busca (ex.: "configurações" ou "aval"),
        // inclui todas as funcionalidades daquele módulo
        if (moduloNameMatches) {
          return modulo;
        }

        // Senão, filtra os itens cujo título ou descrição batem com o termo
        const matchingItems = modulo.items.filter(item => {
          const titleMatches = this.normalizeStr(item.title).includes(query);
          const descMatches = this.normalizeStr(item.description).includes(query);
          return titleMatches || descMatches;
        });

        return {
          ...modulo,
          items: matchingItems
        };
      })
      // 3. Remove módulos vazios
      .filter(modulo => modulo.items.length > 0);
  });
}

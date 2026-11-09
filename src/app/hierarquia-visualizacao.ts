import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {toSignal} from '@angular/core/rxjs-interop';

import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatTooltipModule} from '@angular/material/tooltip';

import {PermissionService} from './permission';
import {AcessoRestritoComponent} from './acesso-restrito';
import {EstruturaHierarquicaModal} from './hierarquia';

import {SecretariaGeralService} from './secretaria-geral';
import {SecretariaExecutivaService} from './secretaria-executiva';
import {GerenciaExecutivaService} from './gerencia-executiva';
import {GerenciaRegionalService} from './gerencia-regional';
import {SubgerenciaService} from './subgerencia';
import {NucleoService} from './nucleo';
import {ExcecaoHierarquiaService, AprovadorExcecaoVigente} from './excecao-hierarquia';

export type TipoUnidadeHierarquia =
  | 'SECRETARIA_GERAL'
  | 'SECRETARIA_EXECUTIVA'
  | 'GERENCIA_EXECUTIVA'
  | 'GERENCIA_REGIONAL'
  | 'SUBGERENCIA'
  | 'NUCLEO'
  | 'ESCOLA';

export interface UnidadeSuperiorInfo {
  id: string;
  nome: string;
  tipoLabel: string;
}

export interface ChefeInfo {
  matricula: string;
  nome: string;
  cargo?: string;
}

export interface UnidadeHierarquiaNode {
  id: string; // ID único no nó (ex.: sec-geral-1, sec-exec-sub-1, ge-ge-1, gr-gr-1, sub-subger-1, nuc-nuc-1, esc-gr-1-esc-1, grp-esc-gr-1)
  rawId: string; // ID original do CRUD ou sub-registro
  tipo: TipoUnidadeHierarquia;
  tipoLabel: string;
  nome: string;
  utbCodigo: string;
  utbNome?: string;
  status: 'ATIVO' | 'INATIVO';
  parentId?: string;
  isGroup?: boolean; // Verdadeiro para agrupamentos 'Escolas (X)' e 'Núcleos (X)'
  groupCategory?: 'ESCOLA' | 'NUCLEO';
  unidadeSuperior?: UnidadeSuperiorInfo;
  chefeImediato?: ChefeInfo;
  viewRoute: string; // Rota para tela Visualizar (vazio para Escola e agrupamentos)
  children: UnidadeHierarquiaNode[];
}

export interface FlattenedTreeNode {
  node: UnidadeHierarquiaNode;
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

/**
 * Identifica se uma unidade possui registro formal de extinção.
 * Unidades extintas não devem constar na estrutura organizacional vigente.
 */
function isUnidadeExtinta(item: { normativaExtincao?: { numero?: string; nome?: string; documento?: unknown } | null } | undefined | null): boolean {
  if (!item || !item.normativaExtincao) return false;
  const n = item.normativaExtincao;
  return !!(n.numero || n.nome || n.documento);
}

@Component({
  selector: 'app-hierarquia-visualizacao',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatTooltipModule,
    AcessoRestritoComponent
  ],
  template: `
    @if (!permissionService.hasAccess()) {
      <app-acesso-restrito backUrl="/configuracoes/hierarquia" />
    } @else {
      <div class="flex flex-col gap-6 max-w-7xl mx-auto w-full font-sans pb-16">
        
        <!-- Breadcrumb: Início > Configurações > Hierarquia de Unidades e Cargos > Visualizar Hierarquia -->
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
          <span 
            (click)="goHierarquia()" 
            (keydown.enter)="goHierarquia()" 
            tabindex="0" 
            role="button" 
            class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline"
          >
            Hierarquia de Unidades e Cargos
          </span>
          <span class="text-[10px] text-siage-text-secondary/40 select-none" aria-hidden="true">/</span>
          <span class="text-siage-primary font-semibold" aria-current="page">Visualizar Hierarquia</span>
        </nav>

        <!-- Cabeçalho Principal: Título com Voltar, Descrição e Ação "Ver estrutura geral" -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2 sm:gap-3">
              <button 
                mat-icon-button 
                type="button" 
                (click)="goHierarquia()" 
                class="text-siage-text-secondary hover:text-siage-primary transition-colors cursor-pointer -ml-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                title="Voltar para Hierarquia de Unidades e Cargos"
                aria-label="Voltar para Hierarquia de Unidades e Cargos"
              >
                <mat-icon style="font-size: 22px; width: 22px; height: 22px;">arrow_back</mat-icon>
              </button>
              
              <h1 class="text-2xl sm:text-3xl font-poppins font-bold tracking-tight text-siage-text-primary leading-tight">
                Visualizar Hierarquia
              </h1>
            </div>

            <p class="text-xs sm:text-sm text-siage-text-secondary font-sans leading-normal pl-8 sm:pl-9 max-w-2xl">
              Consulte a estrutura organizacional, as relações de subordinação e as informações das unidades cadastradas.
            </p>
          </div>

          <!-- Botão Secundário: Ver estrutura geral (abre EstruturaHierarquicaModal existente) -->
          <div class="pl-8 sm:pl-0 shrink-0">
            <button 
              type="button" 
              (click)="abrirModalEstruturaGeral()" 
              class="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-siage-border bg-siage-surface hover:bg-siage-primary/5 hover:border-siage-primary/40 text-siage-text-primary hover:text-siage-primary font-sans font-semibold text-xs sm:text-sm transition-all shadow-xs active:scale-[0.99] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
              title="Visualizar a estrutura conceitual de subordinação entre os tipos de unidades"
              aria-label="Ver estrutura geral"
            >
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;" class="text-siage-primary">account_tree</mat-icon>
              <span>Ver estrutura geral</span>
            </button>
          </div>
        </div>

        <!-- Grade Principal com Disposição Lado a Lado (~55% Esquerda, ~45% Direita) e Vertical em Mobile -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- ============================================== -->
          <!-- ÁREA ESQUERDA: ESTRUTURA ORGANIZACIONAL (55%)   -->
          <!-- ============================================== -->
          <div class="lg:col-span-7 flex flex-col gap-4 bg-siage-surface border border-siage-border rounded-lg shadow-xs p-5 sm:p-6">
            
            <!-- Cabeçalho do Card da Árvore com Ações de Expansão/Recolhimento -->
            <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-siage-border/40">
              <div class="flex items-center gap-2">
                <mat-icon style="font-size: 20px; width: 20px; height: 20px;" class="text-siage-primary">schema</mat-icon>
                <h2 class="text-sm sm:text-base font-poppins font-bold text-siage-text-primary tracking-tight">
                  Estrutura Organizacional
                </h2>
              </div>

              <!-- Controles Rápidos -->
              <div class="flex items-center gap-2 text-xs">
                <button 
                  type="button" 
                  (click)="expandirTodos()" 
                  class="text-xs text-siage-text-secondary hover:text-siage-primary font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:underline"
                  title="Expandir todos os ramos da hierarquia"
                >
                  Expandir tudo
                </button>
                <span class="text-siage-text-secondary/40 select-none">•</span>
                <button 
                  type="button" 
                  (click)="recolherTodos()" 
                  class="text-xs text-siage-text-secondary hover:text-siage-primary font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:underline"
                  title="Recolher todos os ramos para o nível inicial"
                >
                  Recolher tudo
                </button>
              </div>
            </div>

            <!-- Busca de Unidades por Nome (Autocomplete) -->
            <div class="form-field-group">
              <label for="buscar-unidade-input" class="siage-field-label">Buscar unidade</label>
              <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                <mat-icon matPrefix style="font-size: 18px; width: 18px; height: 18px; margin-right: 8px;" class="text-siage-text-secondary">search</mat-icon>
                <input 
                  id="buscar-unidade-input"
                  type="text" 
                  matInput 
                  [formControl]="buscaControl"
                  [matAutocomplete]="autoUnidades"
                  placeholder="Digite o nome da unidade" 
                  class="text-sm"
                />
                @if (buscaTexto()) {
                  <button mat-icon-button matSuffix type="button" (click)="limparBusca()" aria-label="Limpar busca">
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                  </button>
                }
                <mat-autocomplete #autoUnidades="matAutocomplete" [displayWith]="displayFn" (optionSelected)="onSelecionarSugestao($event.option.value)">
                  @for (sug of sugestoesBusca(); track sug.id) {
                    <mat-option [value]="sug" class="text-xs sm:text-sm">
                      <div class="flex items-center justify-between w-full gap-3 py-1">
                        <span class="truncate font-medium text-siage-text-primary">{{ sug.nome }}</span>
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-siage-text-secondary border border-siage-border/40 shrink-0">
                          {{ sug.tipoLabel }}
                        </span>
                      </div>
                    </mat-option>
                  }
                  @if (hasBuscaTextSemSugestoes()) {
                    <mat-option disabled class="text-xs text-siage-text-secondary">
                      Nenhuma unidade encontrada com esse nome
                    </mat-option>
                  }
                </mat-autocomplete>
              </mat-form-field>
            </div>

            <!-- Árvore Expansível de Unidades com Recuos Progressivos -->
            <div id="tree-container" class="flex flex-col gap-1 min-h-[360px] max-h-[640px] overflow-y-auto pr-1 -mr-1" role="tree" aria-label="Estrutura organizacional de unidades">
              @for (item of flattenedTree(); track item.node.id) {
                @if (item.node.isGroup) {
                  <!-- Linha de Agrupamento de Navegação (Escolas / Núcleos) -->
                  <div 
                    [id]="'tree-item-' + item.node.id"
                    tabindex="0"
                    (click)="toggleNode(item.node.id)"
                    (keydown.enter)="toggleNode(item.node.id)"
                    (keydown.space)="$event.preventDefault(); toggleNode(item.node.id)"
                    class="group flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border border-transparent transition-all cursor-pointer text-left select-none bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70 text-siage-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40 my-0.5"
                    [style.padding-left]="'calc(' + item.level + ' * 1.5rem + 0.5rem)'"
                    role="treeitem"
                    [attr.aria-selected]="false"
                    [attr.aria-expanded]="item.isExpanded"
                    [attr.aria-label]="item.node.nome"
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      <!-- Seta de Expansão -->
                      <button 
                        type="button" 
                        (click)="$event.stopPropagation(); toggleNode(item.node.id)"
                        class="w-6 h-6 rounded flex items-center justify-center text-siage-text-secondary hover:text-siage-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 focus-visible:outline-none"
                        [title]="item.isExpanded ? 'Recolher ' + item.node.nome : 'Expandir ' + item.node.nome"
                        [attr.aria-label]="item.isExpanded ? 'Recolher' : 'Expandir'"
                      >
                        <mat-icon style="font-size: 18px; width: 18px; height: 18px;" class="transition-transform duration-150" [class.rotate-90]="item.isExpanded">
                          chevron_right
                        </mat-icon>
                      </button>

                      <!-- Ícone de Agrupamento -->
                      <mat-icon style="font-size: 18px; width: 18px; height: 18px;" class="text-siage-primary/70 shrink-0">
                        {{ item.node.groupCategory === 'ESCOLA' ? 'school' : 'folder_open' }}
                      </mat-icon>

                      <!-- Nome do Agrupamento -->
                      <span class="text-xs sm:text-sm font-semibold text-siage-text-primary truncate">
                        {{ item.node.nome }}
                      </span>
                    </div>

                    <!-- Indicador visual sutil -->
                    <div class="flex items-center gap-1.5 shrink-0 ml-2">
                      <span class="text-[10px] font-medium text-siage-text-secondary/70">
                        {{ item.isExpanded ? 'Recolher' : 'Expandir' }}
                      </span>
                    </div>
                  </div>
                } @else {
                  <!-- Linha de Unidade Administrativa Normal -->
                  <div 
                    [id]="'tree-item-' + item.node.id"
                    tabindex="0"
                    (click)="selecionarNode(item.node)"
                    (keydown.enter)="selecionarNode(item.node)"
                    (keydown.space)="$event.preventDefault(); selecionarNode(item.node)"
                    [class.bg-siage-primary/10]="selectedNodeId() === item.node.id"
                    [class.border-siage-primary/30]="selectedNodeId() === item.node.id"
                    [class.text-siage-primary]="selectedNodeId() === item.node.id"
                    class="group flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border border-transparent transition-all cursor-pointer text-left select-none hover:bg-black/[0.03] dark:hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40 my-0.5"
                    [style.padding-left]="'calc(' + item.level + ' * 1.5rem + 0.5rem)'"
                    role="treeitem"
                    [attr.aria-selected]="selectedNodeId() === item.node.id"
                    [attr.aria-expanded]="item.hasChildren ? item.isExpanded : null"
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      <!-- Seta de Expansão / Espaçador Alinhado -->
                      @if (item.hasChildren) {
                        <button 
                          type="button" 
                          (click)="$event.stopPropagation(); toggleNode(item.node.id)"
                          class="w-6 h-6 rounded flex items-center justify-center text-siage-text-secondary hover:text-siage-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-siage-primary/40"
                          [title]="item.isExpanded ? 'Recolher ' + item.node.nome : 'Expandir ' + item.node.nome"
                          [attr.aria-label]="item.isExpanded ? 'Recolher' : 'Expandir'"
                        >
                          <mat-icon style="font-size: 18px; width: 18px; height: 18px;" class="transition-transform duration-150" [class.rotate-90]="item.isExpanded">
                            chevron_right
                          </mat-icon>
                        </button>
                      } @else {
                        <div class="w-6 h-6 flex items-center justify-center shrink-0 select-none" aria-hidden="true">
                          <span class="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        </div>
                      }

                      <!-- Ícone Semântico do Tipo de Unidade -->
                      <mat-icon style="font-size: 18px; width: 18px; height: 18px;" class="text-siage-primary/80 shrink-0">
                        {{ getIconeTipo(item.node.tipo) }}
                      </mat-icon>

                      <!-- Nome da Unidade (Texto principal, sem a tag repetitiva de tipo) -->
                      <span 
                        class="text-xs sm:text-sm font-medium truncate" 
                        [class.text-siage-primary]="selectedNodeId() === item.node.id"
                        [class.text-siage-text-primary]="selectedNodeId() !== item.node.id"
                        [title]="item.node.nome"
                      >
                        {{ item.node.nome }}
                      </span>
                    </div>

                    <!-- Identificações Discretas: Inativo e Quantidade de Subordinadas -->
                    <div class="flex items-center gap-1.5 shrink-0 ml-2">
                      @if (item.node.status === 'INATIVO') {
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20 whitespace-nowrap">
                          Inativo
                        </span>
                      }

                      @if (item.hasChildren && !item.isExpanded) {
                        <span class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-slate-200/70 dark:bg-slate-700/60 text-siage-text-secondary" [title]="item.node.children.length + ' item(ns)'">
                          {{ item.node.children.length }}
                        </span>
                      }
                    </div>
                  </div>
                }
              } @empty {
                <div class="py-12 text-center text-xs text-siage-text-secondary">
                  Nenhuma unidade cadastrada encontrada na estrutura organizacional.
                </div>
              }
            </div>

          </div>

          <!-- ============================================== -->
          <!-- ÁREA DIREITA: DETALHES DA UNIDADE (45%)        -->
          <!-- ============================================== -->
          <div class="lg:col-span-5 flex flex-col gap-5 bg-siage-surface border border-siage-border rounded-lg shadow-xs p-5 sm:p-6 lg:sticky lg:top-4">
            
            <!-- Cabeçalho do Card de Detalhes -->
            <div class="flex items-center justify-between pb-3 border-b border-siage-border/40">
              <div class="flex items-center gap-2">
                <mat-icon style="font-size: 20px; width: 20px; height: 20px;" class="text-siage-primary">info</mat-icon>
                <h2 class="text-sm sm:text-base font-poppins font-bold text-siage-text-primary tracking-tight">
                  Detalhes da Unidade
                </h2>
              </div>

              <!-- Ação Visualizar: NÃO EXIBIR PARA ESCOLA NEM PARA AGRUPAMENTOS -->
              @if (selectedNode(); as node) {
                @if (node.tipo !== 'ESCOLA' && !node.isGroup && node.viewRoute) {
                  <button 
                    type="button" 
                    (click)="onVisualizar(node)" 
                    class="inline-flex items-center justify-center gap-1.5 h-8 sm:h-9 px-3.5 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-xs transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                    title="Visualizar registro completo no módulo correspondente"
                    aria-label="Visualizar unidade"
                  >
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;">visibility</mat-icon>
                    <span>Visualizar</span>
                  </button>
                }
              }
            </div>

            <!-- Conteúdo dos Detalhes -->
            @if (selectedNode(); as node) {
              @let excecao = getExcecaoInfo(node);
              @let caminho = caminhoHierarquico();
              <div class="flex flex-col gap-5 font-sans">
                
                <!-- SEÇÃO 1: IDENTIFICAÇÃO -->
                <div class="flex flex-col gap-3">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-siage-primary flex items-center gap-1.5">
                    <mat-icon style="font-size: 14px; width: 14px; height: 14px;">domain</mat-icon>
                    <span>Identificação</span>
                  </span>

                  <div class="bg-slate-50/50 dark:bg-slate-800/30 border border-siage-border/60 rounded-lg p-3.5 flex flex-col gap-3 text-xs">
                    
                    <!-- Nome da Unidade -->
                    <div class="flex flex-col gap-0.5">
                      <span class="text-[10px] uppercase font-semibold text-siage-text-secondary">Nome Completo</span>
                      <span class="text-sm font-semibold text-siage-text-primary leading-snug">{{ node.nome }}</span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-siage-border/30">
                      <!-- Tipo de Unidade -->
                      <div class="flex flex-col gap-0.5">
                        <span class="text-[10px] uppercase font-semibold text-siage-text-secondary">Tipo de Unidade</span>
                        <div>
                          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-siage-primary/10 text-siage-primary border border-siage-primary/20">
                            {{ node.tipoLabel }}
                          </span>
                        </div>
                      </div>

                      <!-- Situação -->
                      <div class="flex flex-col gap-0.5">
                        <span class="text-[10px] uppercase font-semibold text-siage-text-secondary">Situação</span>
                        <div>
                          @if (node.status === 'ATIVO') {
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                              Ativo
                            </span>
                          } @else {
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
                              Inativo
                            </span>
                          }
                        </div>
                      </div>
                    </div>

                    <!-- Código UTB (quando disponível) -->
                    <div class="flex flex-col gap-0.5 pt-2 border-t border-siage-border/30">
                      <span class="text-[10px] uppercase font-semibold text-siage-text-secondary">Unidade de Trabalho (UTB)</span>
                      @if (node.utbCodigo) {
                        <span class="font-mono font-medium text-siage-text-primary text-xs">{{ node.utbCodigo }}</span>
                        @if (node.utbNome && node.utbNome !== node.utbCodigo) {
                          <span class="text-[11px] text-siage-text-secondary truncate">{{ node.utbNome }}</span>
                        }
                      } @else {
                        <span class="text-xs text-siage-text-secondary/70 italic">Não informado</span>
                      }
                    </div>

                  </div>
                </div>

                <!-- SEÇÃO 2: HIERARQUIA & SUBORDINAÇÃO -->
                <div class="flex flex-col gap-3">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-siage-primary flex items-center gap-1.5">
                    <mat-icon style="font-size: 14px; width: 14px; height: 14px;">account_tree</mat-icon>
                    <span>Hierarquia & Subordinação</span>
                  </span>

                  <div class="bg-slate-50/50 dark:bg-slate-800/30 border border-siage-border/60 rounded-lg p-3.5 flex flex-col gap-3 text-xs">
                    
                    <!-- Unidade Imediatamente Superior -->
                    <div class="flex flex-col gap-0.5">
                      <span class="text-[10px] uppercase font-semibold text-siage-text-secondary">Unidade Imediatamente Superior</span>
                      @if (node.unidadeSuperior; as sup) {
                        <div class="flex items-center gap-2 mt-0.5">
                          <span class="font-medium text-siage-text-primary text-xs leading-snug">{{ sup.nome }}</span>
                          <span class="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-200/60 dark:bg-slate-700/50 text-siage-text-secondary shrink-0">
                            {{ sup.tipoLabel }}
                          </span>
                        </div>
                      } @else {
                        <span class="text-xs text-siage-text-secondary/70 italic">Nível de cúpula (sem subordinação)</span>
                      }
                    </div>

                    <!-- Ação textual discreta: Ver caminho hierárquico -->
                    @if (caminho.length > 0) {
                      <div class="flex flex-col gap-1.5 pt-2 border-t border-siage-border/30">
                        <button 
                          type="button" 
                          (click)="showCaminho.set(!showCaminho())" 
                          class="inline-flex items-center gap-1 text-xs text-siage-text-secondary hover:text-siage-primary font-medium transition-colors cursor-pointer w-fit focus-visible:outline-none focus-visible:underline"
                          [attr.aria-expanded]="showCaminho()"
                          title="Exibir ou ocultar o caminho hierárquico completo"
                        >
                          <span>Ver caminho hierárquico</span>
                          <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="transition-transform duration-150">
                            {{ showCaminho() ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}
                          </mat-icon>
                        </button>

                        @if (showCaminho()) {
                          <div class="text-[11px] text-siage-text-secondary leading-relaxed bg-white/70 dark:bg-black/20 p-2.5 rounded-md border border-siage-border/50">
                            <span class="font-medium text-siage-text-primary">
                              {{ caminhoFormatado() }}
                            </span>
                          </div>
                        }
                      </div>
                    }

                    <!-- Chefia Imediata Formal -->
                    <div class="flex flex-col gap-0.5 pt-2 border-t border-siage-border/30">
                      <span class="text-[10px] uppercase font-semibold text-siage-text-secondary">Chefia Imediata Formal</span>
                      @if (node.chefeImediato; as chefe) {
                        <div class="flex items-center gap-2.5 mt-1">
                          <div class="w-8 h-8 rounded-full bg-siage-primary/10 text-siage-primary flex items-center justify-center font-bold font-poppins text-xs shrink-0">
                            {{ chefe.nome.charAt(0) }}
                          </div>
                          <div class="flex flex-col min-w-0">
                            <span class="font-semibold text-siage-text-primary truncate">{{ chefe.nome }}</span>
                            @if (chefe.matricula) {
                              <span class="text-[11px] text-siage-text-secondary">Matrícula: {{ chefe.matricula }}{{ chefe.cargo ? ' • ' + chefe.cargo : '' }}</span>
                            } @else if (chefe.cargo) {
                              <span class="text-[11px] text-siage-text-secondary">{{ chefe.cargo }}</span>
                            }
                          </div>
                        </div>
                      } @else {
                        <span class="text-xs text-siage-text-secondary/70 italic mt-0.5">Não definido</span>
                      }
                    </div>

                  </div>
                </div>

                <!-- SEÇÃO 3: EXCEÇÃO DE HIERARQUIA (SE VIGENTE) -->
                @if (excecao) {
                  <div class="flex flex-col gap-2">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <mat-icon style="font-size: 14px; width: 14px; height: 14px;">rule</mat-icon>
                      <span>Configuração de Exceção de Hierarquia</span>
                    </span>

                    <div class="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-lg p-3.5 flex flex-col gap-2 text-xs">
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-[10px] uppercase font-semibold text-amber-800 dark:text-amber-300">Aprovador de Exceção</span>
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
                          Exceção Vigente
                        </span>
                      </div>

                      <div class="flex items-center gap-2.5 mt-0.5">
                        <div class="w-8 h-8 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold font-poppins text-xs shrink-0">
                          {{ excecao.nome.charAt(0) }}
                        </div>
                        <div class="flex flex-col min-w-0">
                          <span class="font-semibold text-siage-text-primary truncate">{{ excecao.nome }}</span>
                          <span class="text-[11px] text-siage-text-secondary">Matrícula: {{ excecao.matricula }}</span>
                        </div>
                      </div>

                      @if (excecao.modalidade) {
                        <div class="text-[11px] text-siage-text-secondary pt-1 border-t border-amber-500/10">
                          Atuação: <span class="font-medium text-siage-text-primary">{{ excecao.modalidade === 'SOBREPOE_SEMPRE' ? 'Sempre sobrepõe o chefe imediato' : 'Atua apenas em caso de ausência' }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }

              </div>
            } @else {
              <!-- Estado Inicial: Nenhuma Unidade Selecionada -->
              <div class="flex flex-col items-center justify-center text-center py-16 px-4 gap-3 text-siage-text-secondary">
                <div class="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-siage-text-secondary/60">
                  <mat-icon style="font-size: 28px; width: 28px; height: 28px;">account_tree</mat-icon>
                </div>
                <p class="text-xs sm:text-sm max-w-xs leading-relaxed text-siage-text-secondary">
                  Selecione uma unidade na estrutura organizacional para visualizar suas informações.
                </p>
              </div>
            }

          </div>

        </div>

      </div>
    }
  `
})
export class HierarquiaVisualizacao {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  readonly permissionService = inject(PermissionService);

  private readonly secGeralService = inject(SecretariaGeralService);
  private readonly secExecService = inject(SecretariaExecutivaService);
  private readonly gerExecService = inject(GerenciaExecutivaService);
  private readonly gerRegService = inject(GerenciaRegionalService);
  private readonly subgerService = inject(SubgerenciaService);
  private readonly nucleoService = inject(NucleoService);
  private readonly excecaoService = inject(ExcecaoHierarquiaService);

  // Controle de busca
  readonly buscaControl = new FormControl<string | UnidadeHierarquiaNode>('');
  readonly buscaTexto = toSignal(this.buscaControl.valueChanges, { initialValue: '' });

  // Conjunto de nós expandidos (Set de IDs)
  readonly expandedNodeIds = signal<Set<string>>(new Set());

  // Nó atualmente selecionado
  readonly selectedNodeId = signal<string | null>(null);

  // Mapeamento global de Unidades vigentes (exclui unidades extintas)
  readonly treeStructure = computed<UnidadeHierarquiaNode[]>(() => {
    // Filtra apenas as unidades vigentes (sem registro formal de extinção)
    const secGerais = this.secGeralService.items().filter(sg => !isUnidadeExtinta(sg));
    const secExecs = this.secExecService.items().filter(se => !isUnidadeExtinta(se));
    const gerExecs = this.gerExecService.items().filter(ge => !isUnidadeExtinta(ge));
    const gerRegs = this.gerRegService.items().filter(gr => !isUnidadeExtinta(gr));
    const subgers = this.subgerService.items().filter(sub => !isUnidadeExtinta(sub));
    
    const allNucleos = this.nucleoService.items();
    const extinctNucleoNames = new Set(
      allNucleos.filter(n => isUnidadeExtinta(n)).map(n => n.nome.trim().toLowerCase())
    );
    const nucleos = allNucleos.filter(nuc => !isUnidadeExtinta(nuc));

    // 1. Núcleos subordinados a Subgerências (do CRUD de Núcleos)
    const nucleosPorSubgerencia: Record<string, UnidadeHierarquiaNode[]> = {};
    nucleos.filter(n => n.tipoVinculo === 'SUBGERENCIA').forEach(nuc => {
      const supKey = `sub-${nuc.unidadeSuperiorId}`;
      const node: UnidadeHierarquiaNode = {
        id: `nuc-${nuc.id}`,
        rawId: nuc.id,
        tipo: 'NUCLEO',
        tipoLabel: 'Núcleo',
        nome: nuc.nome,
        utbCodigo: nuc.utbCodigo,
        utbNome: nuc.utbNome,
        status: nuc.status,
        parentId: supKey,
        unidadeSuperior: {
          id: nuc.unidadeSuperiorId,
          nome: nuc.unidadeSuperiorNome,
          tipoLabel: 'Subgerência'
        },
        chefeImediato: nuc.chefeImediato ? {
          matricula: nuc.chefeImediato.matricula,
          nome: nuc.chefeImediato.nome,
          cargo: nuc.chefeImediato.cargo
        } : undefined,
        viewRoute: `/configuracoes/hierarquia/nucleo/${nuc.id}`,
        children: []
      };

      if (!nucleosPorSubgerencia[supKey]) {
        nucleosPorSubgerencia[supKey] = [];
      }
      nucleosPorSubgerencia[supKey].push(node);
    });

    // 2. Monta nós de Subgerências (e anexa Núcleos vinculados a elas)
    const subgerPorGerExec: Record<string, UnidadeHierarquiaNode[]> = {};
    subgers.forEach(sub => {
      const parentKey = `ge-${sub.gerenciaExecutivaId}`;
      const myKey = `sub-${sub.id}`;
      const children = nucleosPorSubgerencia[myKey] || [];

      const node: UnidadeHierarquiaNode = {
        id: myKey,
        rawId: sub.id,
        tipo: 'SUBGERENCIA',
        tipoLabel: 'Subgerência',
        nome: sub.nome,
        utbCodigo: sub.utbCodigo,
        utbNome: sub.utbNome,
        status: sub.status,
        parentId: parentKey,
        unidadeSuperior: {
          id: sub.gerenciaExecutivaId,
          nome: sub.gerenciaExecutivaNome,
          tipoLabel: 'Gerência Executiva'
        },
        chefeImediato: sub.chefeImediato ? {
          matricula: sub.chefeImediato.matricula,
          nome: sub.chefeImediato.nome,
          cargo: sub.chefeImediato.cargo
        } : undefined,
        viewRoute: `/configuracoes/hierarquia/subgerencia/${sub.id}`,
        children
      };

      if (!subgerPorGerExec[parentKey]) {
        subgerPorGerExec[parentKey] = [];
      }
      subgerPorGerExec[parentKey].push(node);
    });

    // 3. Monta nós de Gerências Executivas (e anexa Subgerências)
    const gerExecPorSecExec: Record<string, UnidadeHierarquiaNode[]> = {};
    gerExecs.forEach(ge => {
      const parentKey = `se-${ge.secretariaExecutivaId}`;
      const myKey = `ge-${ge.id}`;
      const children = subgerPorGerExec[myKey] || [];

      const node: UnidadeHierarquiaNode = {
        id: myKey,
        rawId: ge.id,
        tipo: 'GERENCIA_EXECUTIVA',
        tipoLabel: 'Gerência Executiva',
        nome: ge.nome,
        utbCodigo: ge.utbCodigo,
        utbNome: ge.utbNome,
        status: ge.status,
        parentId: parentKey,
        unidadeSuperior: {
          id: ge.secretariaExecutivaId,
          nome: ge.secretariaExecutivaNome,
          tipoLabel: 'Secretaria Executiva'
        },
        chefeImediato: ge.chefeImediato ? {
          matricula: ge.chefeImediato.matricula,
          nome: ge.chefeImediato.nome,
          cargo: ge.chefeImediato.cargo
        } : undefined,
        viewRoute: `/configuracoes/hierarquia/gerencia-executiva/${ge.id}`,
        children
      };

      if (!gerExecPorSecExec[parentKey]) {
        gerExecPorSecExec[parentKey] = [];
      }
      gerExecPorSecExec[parentKey].push(node);
    });

    // 4. Monta nós de Gerências Regionais com Agrupamentos de Escolas e Núcleos
    const gerRegPorSecGeral: Record<string, UnidadeHierarquiaNode[]> = {};
    gerRegs.forEach(gr => {
      const parentKey = `sg-${gr.secretariaGeralId}`;
      const myKey = `gr-${gr.id}`;

      // A) Escolas subordinadas à GRE (a partir de gr.subordinadas)
      const escolasRaw = (gr.subordinadas || []).filter(s => s.tipo === 'Escola');
      const escolasNodes: UnidadeHierarquiaNode[] = escolasRaw.map(esc => {
        const utbPartes = esc.utb ? esc.utb.split(' - ') : [];
        const utbCod = utbPartes[0] || '';
        const utbDesc = utbPartes[1] || esc.utb || '';

        return {
          id: `esc-${gr.id}-${esc.id}`,
          rawId: esc.id,
          tipo: 'ESCOLA',
          tipoLabel: 'Escola',
          nome: esc.nome,
          utbCodigo: utbCod,
          utbNome: utbDesc,
          status: 'ATIVO',
          parentId: `grp-esc-${gr.id}`,
          unidadeSuperior: {
            id: gr.id,
            nome: gr.nome,
            tipoLabel: 'Gerência Regional'
          },
          chefeImediato: esc.chefiaImediata ? {
            nome: esc.chefiaImediata,
            matricula: '',
            cargo: 'Diretor Escolar'
          } : undefined,
          viewRoute: '', // Escolas não possuem CRUD próprio nesta versão
          children: []
        };
      });

      // B) Núcleos subordinados à GRE: mescla CRUD de Núcleos e gr.subordinadas sem duplicidade
      const nucleosDoCrud = nucleos.filter(n => n.tipoVinculo === 'GERENCIA_REGIONAL' && n.unidadeSuperiorId === gr.id);
      const nucleosDaGre = (gr.subordinadas || []).filter(s => s.tipo === 'Núcleo');

      const nucleosNodes: UnidadeHierarquiaNode[] = [];
      const nucleoNamesSeen = new Set<string>();

      // Prioriza registros do CRUD
      nucleosDoCrud.forEach(nuc => {
        nucleoNamesSeen.add(nuc.nome.trim().toLowerCase());
        nucleosNodes.push({
          id: `nuc-${nuc.id}`,
          rawId: nuc.id,
          tipo: 'NUCLEO',
          tipoLabel: 'Núcleo',
          nome: nuc.nome,
          utbCodigo: nuc.utbCodigo,
          utbNome: nuc.utbNome,
          status: nuc.status,
          parentId: `grp-nuc-${gr.id}`,
          unidadeSuperior: {
            id: gr.id,
            nome: gr.nome,
            tipoLabel: 'Gerência Regional'
          },
          chefeImediato: nuc.chefeImediato ? {
            matricula: nuc.chefeImediato.matricula,
            nome: nuc.chefeImediato.nome,
            cargo: nuc.chefeImediato.cargo
          } : undefined,
          viewRoute: `/configuracoes/hierarquia/nucleo/${nuc.id}`,
          children: []
        });
      });

      // Adiciona núcleos das subordinadas se não existirem no CRUD e não forem extintos
      nucleosDaGre.forEach(nuc => {
        const normName = nuc.nome.trim().toLowerCase();
        if (extinctNucleoNames.has(normName)) {
          return;
        }
        if (!nucleoNamesSeen.has(normName)) {
          nucleoNamesSeen.add(normName);
          const utbPartes = nuc.utb ? nuc.utb.split(' - ') : [];
          nucleosNodes.push({
            id: `nuc-sub-${gr.id}-${nuc.id}`,
            rawId: nuc.id,
            tipo: 'NUCLEO',
            tipoLabel: 'Núcleo',
            nome: nuc.nome,
            utbCodigo: utbPartes[0] || '',
            utbNome: utbPartes[1] || nuc.utb || '',
            status: 'ATIVO',
            parentId: `grp-nuc-${gr.id}`,
            unidadeSuperior: {
              id: gr.id,
              nome: gr.nome,
              tipoLabel: 'Gerência Regional'
            },
            chefeImediato: nuc.chefiaImediata ? {
              nome: nuc.chefiaImediata,
              matricula: '',
              cargo: 'Chefe de Núcleo'
            } : undefined,
            viewRoute: '',
            children: []
          });
        }
      });

      // C) Agrupamentos expansíveis para a GRE
      const greChildren: UnidadeHierarquiaNode[] = [];

      // Agrupamento Escolas (X)
      if (escolasNodes.length > 0) {
        greChildren.push({
          id: `grp-esc-${gr.id}`,
          rawId: `grp-esc-${gr.id}`,
          tipo: 'ESCOLA',
          tipoLabel: 'Agrupamento',
          nome: `Escolas (${escolasNodes.length})`,
          utbCodigo: '',
          status: 'ATIVO',
          parentId: myKey,
          isGroup: true,
          groupCategory: 'ESCOLA',
          viewRoute: '',
          children: escolasNodes
        });
      }

      // Agrupamento Núcleos (X)
      if (nucleosNodes.length > 0) {
        greChildren.push({
          id: `grp-nuc-${gr.id}`,
          rawId: `grp-nuc-${gr.id}`,
          tipo: 'NUCLEO',
          tipoLabel: 'Agrupamento',
          nome: `Núcleos (${nucleosNodes.length})`,
          utbCodigo: '',
          status: 'ATIVO',
          parentId: myKey,
          isGroup: true,
          groupCategory: 'NUCLEO',
          viewRoute: '',
          children: nucleosNodes
        });
      }

      const node: UnidadeHierarquiaNode = {
        id: myKey,
        rawId: gr.id,
        tipo: 'GERENCIA_REGIONAL',
        tipoLabel: 'Gerência Regional',
        nome: gr.nome,
        utbCodigo: gr.utbCodigo,
        utbNome: gr.utbNome,
        status: gr.status,
        parentId: parentKey,
        unidadeSuperior: {
          id: gr.secretariaGeralId,
          nome: gr.secretariaGeralNome,
          tipoLabel: 'Secretaria Geral'
        },
        chefeImediato: gr.chefeImediato ? {
          matricula: gr.chefeImediato.matricula,
          nome: gr.chefeImediato.nome,
          cargo: gr.chefeImediato.cargo
        } : undefined,
        viewRoute: `/configuracoes/hierarquia/gerencia-regional/${gr.id}`,
        children: greChildren
      };

      if (!gerRegPorSecGeral[parentKey]) {
        gerRegPorSecGeral[parentKey] = [];
      }
      gerRegPorSecGeral[parentKey].push(node);
    });

    // 5. Monta nós de Secretarias Executivas (e anexa Gerências Executivas)
    const secExecPorSecGeral: Record<string, UnidadeHierarquiaNode[]> = {};
    secExecs.forEach(se => {
      const parentKey = `sg-${se.secretariaGeralId}`;
      const myKey = `se-${se.id}`;
      const children = gerExecPorSecExec[myKey] || [];

      const node: UnidadeHierarquiaNode = {
        id: myKey,
        rawId: se.id,
        tipo: 'SECRETARIA_EXECUTIVA',
        tipoLabel: 'Secretaria Executiva',
        nome: se.nome,
        utbCodigo: se.utbCodigo,
        utbNome: se.utbNome,
        status: se.status,
        parentId: parentKey,
        unidadeSuperior: {
          id: se.secretariaGeralId,
          nome: se.secretariaGeralNome,
          tipoLabel: 'Secretaria Geral'
        },
        chefeImediato: se.chefeImediato ? {
          matricula: se.chefeImediato.matricula,
          nome: se.chefeImediato.nome,
          cargo: se.chefeImediato.cargo
        } : undefined,
        viewRoute: `/configuracoes/hierarquia/secretaria-executiva/${se.id}`,
        children
      };

      if (!secExecPorSecGeral[parentKey]) {
        secExecPorSecGeral[parentKey] = [];
      }
      secExecPorSecGeral[parentKey].push(node);
    });

    // 6. Monta raízes: Secretarias Gerais (anexando Secretarias Executivas e Gerências Regionais)
    const roots: UnidadeHierarquiaNode[] = [];
    secGerais.forEach(sg => {
      const myKey = `sg-${sg.id}`;
      const subordinadasExecutivas = secExecPorSecGeral[myKey] || [];
      const subordinadasRegionais = gerRegPorSecGeral[myKey] || [];
      const children = [...subordinadasExecutivas, ...subordinadasRegionais];

      const node: UnidadeHierarquiaNode = {
        id: myKey,
        rawId: sg.id,
        tipo: 'SECRETARIA_GERAL',
        tipoLabel: 'Secretaria Geral',
        nome: sg.nome,
        utbCodigo: sg.utbCodigo,
        utbNome: sg.utbNome,
        status: sg.status,
        chefeImediato: sg.chefeImediato ? {
          matricula: sg.chefeImediato.matricula,
          nome: sg.chefeImediato.nome,
          cargo: sg.chefeImediato.cargo
        } : undefined,
        viewRoute: `/configuracoes/hierarquia/secretaria-geral/${sg.id}`,
        children
      };

      roots.push(node);
    });

    return roots;
  });

  // Mapeamento linear de ID -> Nó para busca e navegação rápida
  readonly nodeMap = computed(() => {
    const map = new Map<string, UnidadeHierarquiaNode>();
    const traverse = (node: UnidadeHierarquiaNode) => {
      map.set(node.id, node);
      node.children.forEach(traverse);
    };
    this.treeStructure().forEach(traverse);
    return map;
  });

  // Lista linear de todas as unidades PESQUISÁVEIS (exclui agrupamentos de navegação)
  readonly allSearchableNodes = computed(() => {
    const list: UnidadeHierarquiaNode[] = [];
    const traverse = (node: UnidadeHierarquiaNode) => {
      if (!node.isGroup) {
        list.push(node);
      }
      node.children.forEach(traverse);
    };
    this.treeStructure().forEach(traverse);
    return list;
  });

  // Sugestões para o autocomplete (máximo 10, filtradas estritamente pelo nome da unidade)
  readonly sugestoesBusca = computed(() => {
    const rawVal = this.buscaTexto();
    const query = typeof rawVal === 'string' ? rawVal.trim().toLowerCase() : (rawVal?.nome || '').trim().toLowerCase();
    if (!query) return [];

    return this.allSearchableNodes()
      .filter(n => n.nome.toLowerCase().includes(query))
      .slice(0, 10);
  });

  readonly hasBuscaTextSemSugestoes = computed(() => {
    const rawVal = this.buscaTexto();
    const query = typeof rawVal === 'string' ? rawVal.trim() : (rawVal?.nome || '').trim();
    return query.length > 0 && this.sugestoesBusca().length === 0;
  });

  // Controle do caminho hierárquico textual (recolhido por padrão)
  readonly showCaminho = signal<boolean>(false);

  // Caminho hierárquico formatado textualmente: A > B > C (sem agrupamentos)
  readonly caminhoFormatado = computed<string>(() => {
    return this.caminhoHierarquico().join(' > ');
  });

  // Árvore aplanada com controle de visibilidade baseado em nós expandidos
  readonly flattenedTree = computed<FlattenedTreeNode[]>(() => {
    const roots = this.treeStructure();
    const expanded = this.expandedNodeIds();
    const result: FlattenedTreeNode[] = [];

    const traverse = (node: UnidadeHierarquiaNode, level: number) => {
      const hasChildren = !!node.children && node.children.length > 0;
      const isExpanded = expanded.has(node.id);

      result.push({
        node,
        level,
        hasChildren,
        isExpanded
      });

      if (hasChildren && isExpanded) {
        node.children.forEach(child => traverse(child, level + 1));
      }
    };

    roots.forEach(root => traverse(root, 0));
    return result;
  });

  // Nó atualmente selecionado
  readonly selectedNode = computed<UnidadeHierarquiaNode | null>(() => {
    const id = this.selectedNodeId();
    if (!id) return null;
    const node = this.nodeMap().get(id);
    if (!node || node.isGroup) return null;
    return node;
  });

  // Caminho Hierárquico Completo (exclui agrupamentos de navegação)
  readonly caminhoHierarquico = computed<string[]>(() => {
    const node = this.selectedNode();
    if (!node || node.isGroup) return [];

    const path: string[] = [];
    let current: UnidadeHierarquiaNode | undefined = node;

    while (current) {
      if (!current.isGroup) {
        path.unshift(current.nome);
      }
      current = current.parentId ? this.nodeMap().get(current.parentId) : undefined;
    }

    return path;
  });

  constructor() {
    // Inicializa expandindo os nós de nível raiz para apresentação inicial da estrutura
    const rootIds = this.treeStructure().map(r => r.id);
    if (rootIds.length > 0) {
      this.expandedNodeIds.set(new Set(rootIds));
    }
  }

  toggleNode(nodeId: string) {
    this.expandedNodeIds.update(current => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }

  selecionarNode(node: UnidadeHierarquiaNode) {
    if (node.isGroup) {
      // Agrupamentos não são unidades administrativas: apenas expande/recolhe
      this.toggleNode(node.id);
      return;
    }
    this.selectedNodeId.set(node.id);
    this.showCaminho.set(false); // Mantém recolhido por padrão ao trocar de unidade
  }

  expandirTodos() {
    const allIds = new Set<string>();
    const traverse = (node: UnidadeHierarquiaNode) => {
      if (node.children && node.children.length > 0) {
        allIds.add(node.id);
      }
      node.children.forEach(traverse);
    };
    this.treeStructure().forEach(traverse);
    this.expandedNodeIds.set(allIds);
  }

  recolherTodos() {
    this.expandedNodeIds.set(new Set());
  }

  limparBusca() {
    this.buscaControl.setValue('');
  }

  displayFn(node?: UnidadeHierarquiaNode | string): string {
    if (!node) return '';
    if (typeof node === 'string') return node;
    return node.nome || '';
  }

  onSelecionarSugestao(targetNode: UnidadeHierarquiaNode) {
    if (!targetNode) return;

    // Garante que o input mantenha o NOME da unidade, e não o ID interno
    this.buscaControl.setValue(targetNode.nome, { emitEvent: false });

    // Expande recursivamente todos os nós ancestrais (incluindo agrupamentos como Escolas/Núcleos e a GRE)
    const ancestorsToExpand = new Set(this.expandedNodeIds());
    let current: UnidadeHierarquiaNode | undefined = targetNode;
    while (current && current.parentId) {
      ancestorsToExpand.add(current.parentId);
      current = this.nodeMap().get(current.parentId);
    }

    this.expandedNodeIds.set(ancestorsToExpand);
    this.selectedNodeId.set(targetNode.id);
    this.showCaminho.set(false);

    // Rola suavemente a área da árvore até o elemento selecionado sem mover a página toda
    setTimeout(() => {
      const el = document.getElementById('tree-item-' + targetNode.id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  }

  getIconeTipo(tipo: TipoUnidadeHierarquia): string {
    switch (tipo) {
      case 'SECRETARIA_GERAL':
        return 'domain';
      case 'SECRETARIA_EXECUTIVA':
        return 'corporate_fare';
      case 'GERENCIA_EXECUTIVA':
        return 'business_center';
      case 'GERENCIA_REGIONAL':
        return 'location_city';
      case 'SUBGERENCIA':
        return 'schema';
      case 'NUCLEO':
        return 'device_hub';
      case 'ESCOLA':
        return 'school';
    }
  }

  getExcecaoInfo(node: UnidadeHierarquiaNode): AprovadorExcecaoVigente | null {
    if (node.tipo === 'ESCOLA' || node.isGroup) return null;

    // Busca se existe registro de aprovador de exceção para este setor
    const setores = this.excecaoService.setores();
    const match = setores.find(s => 
      s.id === node.rawId || 
      s.id === `sec-geral-${node.rawId}` || 
      s.id === `sec-exec-${node.rawId}` ||
      (node.utbCodigo && s.utbCodigo === node.utbCodigo)
    );

    if (match && match.aprovadorVigente && match.aprovadorVigente.situacao === 'ATIVO') {
      return match.aprovadorVigente;
    }
    return null;
  }

  abrirModalEstruturaGeral() {
    this.dialog.open(EstruturaHierarquicaModal, {
      width: '680px',
      maxWidth: 'calc(100vw - 2.5rem)',
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
      autoFocus: false,
      disableClose: false
    });
  }

  onVisualizar(node: UnidadeHierarquiaNode) {
    if (node.tipo === 'ESCOLA' || node.isGroup || !node.viewRoute) return;
    this.router.navigateByUrl(node.viewRoute);
  }

  goHierarquia() {
    this.router.navigate(['/configuracoes/hierarquia']);
  }

  goConfiguracoes() {
    this.router.navigate(['/configuracoes']);
  }

  goHome() {
    this.router.navigate(['/inicio']);
  }
}

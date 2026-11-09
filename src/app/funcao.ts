import {Component, inject, signal, computed, ChangeDetectionStrategy, Injectable} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {MatSortModule, Sort} from '@angular/material/sort';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatChipsModule} from '@angular/material/chips';
import {MatDialogModule, MatDialog} from '@angular/material/dialog';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSelectModule} from '@angular/material/select';
import {MatRadioModule} from '@angular/material/radio';
import {MatCardModule} from '@angular/material/card';
import {OverlayModule, ConnectedPosition} from '@angular/cdk/overlay';
import {CommonModule} from '@angular/common';

import {ConfirmacaoDialog, ResultadoDialog, VinculoUsoItem, VINCULOS_USO_MUITOS, ModalService} from './dialog';
import {ToastService} from './toast';
import {SimulatorService} from './simulator';
import {AcessoRestritoComponent} from './acesso-restrito';
import {PermissionService} from './permission';
import {FormCancelHandler} from './form-cancel-handler';
import {CargoService} from './cargo';
import {SiagePaginatorComponent} from './siage-paginator';

/**
 * Interface do modelo Função no SIAGE-RH V2.
 * - codigoInep: Código INEP (obrigatório, numérico, máx 2 caracteres)
 * - descricao: Descrição (obrigatória, máx 200 caracteres)
 * - detalhamento: Detalhamento da função (opcional, máx 500 caracteres)
 * - cargosIds: Cargo (obrigatório, multiselect, armazena IDs dos cargos ativos vinculados)
 * - atreladaGestao: Atrelada à gestão? (obrigatório, Sim/Não, padrão Não)
 * - ativo: Situação Ativo / Inativo
 */
export interface FuncaoItem {
  id: string;
  codigoInep: string;
  descricao: string;
  detalhamento?: string;
  cargosIds: string[];
  atreladaGestao: boolean;
  ativo: boolean;
  emUsoOriginal: boolean;
  exibindoEmUsoIndicator: boolean;
  vinculos?: VinculoUsoItem[];
}

@Injectable({
  providedIn: 'root'
})
export class FuncaoService {
  readonly defaultVinculos: VinculoUsoItem[] = [
    { schema: 'rh', tabela: 'profissional_funcao' },
    { schema: 'educacao', tabela: 'lotacao_escolar' },
    { schema: 'quadro', tabela: 'designacao_gestao' }
  ];

  readonly items = signal<FuncaoItem[]>([
    {
      id: '1',
      codigoInep: '01',
      descricao: 'Coordenador Pedagógico',
      detalhamento: 'Coordenação pedagógica nas unidades escolares, articulação com a equipe docente, elaboração e acompanhamento da proposta pedagógica curricular.',
      cargosIds: ['1'], // Professor de Educação Básica
      atreladaGestao: true,
      ativo: true,
      emUsoOriginal: true,
      exibindoEmUsoIndicator: false,
      vinculos: [
        { schema: 'rh', tabela: 'profissional_funcao' },
        { schema: 'educacao', tabela: 'lotacao_escolar' },
        { schema: 'quadro', tabela: 'designacao_gestao' }
      ]
    },
    {
      id: '2',
      codigoInep: '02',
      descricao: 'Diretor Escolar',
      detalhamento: 'Planejamento, coordenação, supervisão e execução das atividades administrativas e pedagógicas no âmbito da unidade escolar estadual.',
      cargosIds: ['1', '2'], // Professor de Educação Básica, Analista de Gestão Governamental
      atreladaGestao: true,
      ativo: true,
      emUsoOriginal: true,
      exibindoEmUsoIndicator: false,
      vinculos: VINCULOS_USO_MUITOS
    },
    {
      id: '3',
      codigoInep: '03',
      descricao: 'Secretário Escolar',
      detalhamento: 'Coordenação da documentação escolar, registro e arquivo de dados acadêmicos, controle de frequência e expedição de certificados.',
      cargosIds: ['3'], // Técnico Administrativo
      atreladaGestao: false,
      ativo: true,
      emUsoOriginal: false,
      exibindoEmUsoIndicator: false
    },
    {
      id: '4',
      codigoInep: '04',
      descricao: 'Supervisor de Ensino Regional',
      detalhamento: 'Acompanhamento do cumprimento das diretrizes educacionais, orientação técnico-pedagógica às unidades escolares e avaliação institucional.',
      cargosIds: ['1'], // Professor de Educação Básica
      atreladaGestao: true,
      ativo: true,
      emUsoOriginal: false,
      exibindoEmUsoIndicator: false
    },
    {
      id: '5',
      codigoInep: '05',
      descricao: 'Apoio Técnico Pedagógico',
      detalhamento: 'Atividades operacionais e de assistência aos programas e projetos educacionais desenvolvidos na rede de ensino.',
      cargosIds: ['1', '3'], // Professor de Educação Básica, Técnico Administrativo
      atreladaGestao: false,
      ativo: false,
      emUsoOriginal: false,
      exibindoEmUsoIndicator: false
    },
    {
      id: '6',
      codigoInep: '06',
      descricao: 'Perito Médico Avaliador',
      detalhamento: 'Avaliação médico-pericial em processos de readaptação funcional, licenças de saúde ocupacional e juntas médicas estaduais.',
      cargosIds: ['6'], // Médico do Trabalho
      atreladaGestao: false,
      ativo: true,
      emUsoOriginal: false,
      exibindoEmUsoIndicator: false
    },
    // Exemplo real com muitos cargos vinculados (13 cargos da rede estadual):
    {
      id: '7',
      codigoInep: '07',
      descricao: 'PROFESSOR REGENTE E DE APOIO PEDAGOGICO',
      detalhamento: 'Atividades letivas de regência de classe na educação básica, apoio ao ensino fundamental e médio, instrução técnica de artes industriais, dança moderna, música e acompanhamento psicopedagógico na rede estadual.',
      cargosIds: ['10', '13', '18', '11', '12', '14', '15', '16', '17', '19', '20', '21', '22'],
      atreladaGestao: false,
      ativo: true,
      emUsoOriginal: true,
      exibindoEmUsoIndicator: false,
      vinculos: [
        { schema: 'educacao', tabela: 'lotacao_docente' },
        { schema: 'rh', tabela: 'folha_pagamento_cargo' },
        { schema: 'quadro', tabela: 'grade_curricular_regencia' }
      ]
    },
    // Exemplo com 4 cargos vinculados:
    {
      id: '8',
      codigoInep: '08',
      descricao: 'DOCENTE DE ARTES E EXPRESSAO',
      detalhamento: 'Docência integrada em linguagens artísticas, oficinas de artes industriais, dança e práticas musicais na rede pública.',
      cargosIds: ['11', '12', '20', '1'],
      atreladaGestao: false,
      ativo: true,
      emUsoOriginal: false,
      exibindoEmUsoIndicator: false
    },
    // Exemplo de Função com cargo de label grande com aumento de linha na listagem:
    {
      id: '9',
      codigoInep: '09',
      descricao: 'ATENDIMENTO EM SALA DE RECURSOS MULTIFUNCIONAIS',
      detalhamento: 'Atendimento educacional especializado nas salas de recursos multifuncionais da rede estadual.',
      cargosIds: ['23'],
      atreladaGestao: false,
      ativo: true,
      emUsoOriginal: true,
      exibindoEmUsoIndicator: false
    }
  ]);

  getItem(id: string): FuncaoItem | undefined {
    return this.items().find(item => item.id === id);
  }

  add(codigoInep: string, descricao: string, detalhamento: string, cargosIds: string[], atreladaGestao: boolean, ativo: boolean) {
    const newId = String(Math.max(...this.items().map(i => Number(i.id)), 0) + 1);
    const newItem: FuncaoItem = {
      id: newId,
      codigoInep,
      descricao,
      detalhamento: detalhamento || undefined,
      cargosIds: [...cargosIds],
      atreladaGestao,
      ativo,
      emUsoOriginal: false,
      exibindoEmUsoIndicator: false
    };
    this.items.update(list => [...list, newItem]);
  }

  update(id: string, codigoInep: string, descricao: string, detalhamento: string, cargosIds: string[], atreladaGestao: boolean, ativo: boolean) {
    this.items.update(list => list.map(item => {
      if (item.id === id) {
        return {
          ...item,
          codigoInep,
          descricao,
          detalhamento: detalhamento || undefined,
          cargosIds: [...cargosIds],
          atreladaGestao,
          ativo
        };
      }
      return item;
    }));
  }

  updateStatus(id: string, ativo: boolean) {
    this.items.update(list => list.map(item => {
      if (item.id === id) {
        return { ...item, ativo };
      }
      return item;
    }));
  }

  setIndicator(id: string, show: boolean) {
    this.items.update(list => list.map(item => {
      if (item.id === id) {
        return { ...item, exibindoEmUsoIndicator: show };
      }
      return item;
    }));
  }

  resetIndicators() {
    this.items.update(list => list.map(item => ({ ...item, exibindoEmUsoIndicator: false })));
  }

  getVinculos(id: string, forceMany = false): VinculoUsoItem[] {
    if (forceMany) {
      return VINCULOS_USO_MUITOS;
    }
    const item = this.getItem(id);
    return item?.vinculos && item.vinculos.length > 0 ? item.vinculos : this.defaultVinculos;
  }

  delete(id: string) {
    this.items.update(list => list.filter(item => item.id !== id));
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-funcao-list',
  host: {
    '(document:keydown.escape)': 'onEscapeKey()',
  },
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
    MatSelectModule,
    OverlayModule,
    AcessoRestritoComponent,
    CommonModule,
    SiagePaginatorComponent
  ],
  template: `
    @if (!hasAccess()) {
      <app-acesso-restrito backUrl="/inicio" />
    } @else {
      <div class="flex flex-col gap-6 font-sans">
      
      <!-- Cabeçalho com Breadcrumbs, Título com Voltar, Descrição e Ação Principal -->
      <div class="flex flex-col gap-2">
        
        <!-- Breadcrumb: Início / Configurações / SEAD / Função -->
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
            (click)="navConfig()" 
            (keydown.enter)="navConfig()" 
            tabindex="0" 
            role="button" 
            class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline"
          >
            Configurações
          </span>
          <span class="text-[10px] text-siage-text-secondary/40 select-none" aria-hidden="true">/</span>
          <span 
            (click)="navSead()" 
            (keydown.enter)="navSead()" 
            tabindex="0" 
            role="button" 
            class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline"
          >
            SEAD
          </span>
          <span class="text-[10px] text-siage-text-secondary/40 select-none" aria-hidden="true">/</span>
          <span class="text-siage-primary font-semibold" aria-current="page">Função</span>
        </nav>

        <!-- Bloco de Título com Botão Voltar, Descrição e Botão Adicionar -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2 sm:gap-3">
              <button 
                mat-icon-button 
                (click)="goBack()" 
                class="text-siage-text-secondary hover:text-siage-primary transition-colors cursor-pointer -ml-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                title="Voltar para SEAD"
                aria-label="Voltar para SEAD"
              >
                <mat-icon style="font-size: 22px; width: 22px; height: 22px;">arrow_back</mat-icon>
              </button>
              <h1 class="text-2xl sm:text-3xl font-poppins font-bold tracking-tight text-siage-text-primary leading-tight">
                Função
              </h1>
            </div>
            
            <p class="text-xs sm:text-sm text-siage-text-secondary font-sans leading-normal pl-8 sm:pl-9 max-w-2xl">
              Cadastre e mantenha as funções e encargos fornecidos pela SEAD.
            </p>
          </div>
          
          <!-- Botão Adicionar: Condicionado a permissão de criação -->
          @if (permissionService.canCreate()) {
            <button 
              type="button"
              (click)="onAdicionar()"
              class="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs dark:shadow-none active:scale-[0.99] shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
            >
              <mat-icon style="font-size: 20px; width: 20px; height: 20px;">add</mat-icon>
              <span>Adicionar</span>
            </button>
          }
        </div>
      </div>

      <!-- CARD DE FILTROS -->
      <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs dark:shadow-none">
        <div class="flex flex-col gap-4 sm:gap-5">
          <!-- Linha superior: 3 campos maiores (Código INEP, Descrição, Cargo) -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-start">
            
            <!-- Filtro Código INEP -->
            <div class="form-field-group">
              <label for="filter-codigo-inep" class="siage-field-label">Código INEP</label>
              <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                <input 
                  matInput 
                  id="filter-codigo-inep"
                  type="text" 
                  maxlength="2"
                  [formControl]="codigoControl"
                  placeholder="Buscar código" 
                  (keydown.enter)="onBuscar()"
                  (input)="onFilterCodigoInput($event)"
                  class="font-mono text-sm"
                />
                @if (codigoControl.value) {
                  <button mat-icon-button matSuffix (click)="codigoControl.setValue(''); updateBuscarStatus()" aria-label="Limpar campo">
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                  </button>
                }
              </mat-form-field>
            </div>

            <!-- Filtro Descrição -->
            <div class="form-field-group">
              <label for="filter-descricao" class="siage-field-label">Descrição</label>
              <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                <input 
                  matInput 
                  id="filter-descricao"
                  type="text" 
                  maxlength="200"
                  [formControl]="descricaoControl"
                  placeholder="Buscar descrição" 
                  (keydown.enter)="onBuscar()"
                  class="text-sm"
                />
                @if (descricaoControl.value) {
                  <button mat-icon-button matSuffix (click)="descricaoControl.setValue(''); updateBuscarStatus()" aria-label="Limpar campo">
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                  </button>
                }
              </mat-form-field>
            </div>

            <!-- Filtro Cargo: Multiselect com suporte a até 3 nomes e 'X cargos selecionados' -->
            <div class="form-field-group">
              <label for="filter-cargo" class="siage-field-label">Cargo</label>
              <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                <mat-select 
                  [formControl]="cargosControl" 
                  id="filter-cargo" 
                  multiple 
                  placeholder="Todos" 
                  class="text-sm"
                  (openedChange)="onFilterSelectOpenedChange($event)"
                >
                  <mat-select-trigger>
                    {{ getSelectedCargosFilterText() }}
                  </mat-select-trigger>

                  <!-- Painel fixo no topo com busca e ações rápidas -->
                  <div class="p-2 border-b border-siage-border/40 bg-siage-surface dark:bg-slate-800 sticky top-0 z-10 space-y-2">
                    <!-- Campo de busca no topo das opções com placeholder "Buscar cargo" -->
                    <div class="relative flex items-center">
                      <mat-icon class="absolute left-2.5 text-siage-text-secondary pointer-events-none" style="font-size: 16px; width: 16px; height: 16px;">search</mat-icon>
                      <input 
                        type="text" 
                        [value]="cargoFilterSearch()" 
                        (input)="cargoFilterSearch.set($any($event.target).value)" 
                        (keydown)="$event.stopPropagation()" 
                        (click)="$event.stopPropagation()"
                        placeholder="Buscar cargo"
                        class="w-full h-8 pl-8 pr-7 text-xs bg-slate-50 dark:bg-slate-900/60 rounded border border-siage-border/80 focus:border-siage-primary focus:outline-none text-siage-text-primary"
                      />
                      @if (cargoFilterSearch()) {
                        <button 
                          type="button" 
                          (click)="$event.stopPropagation(); cargoFilterSearch.set('')"
                          class="absolute right-2 text-siage-text-secondary hover:text-siage-text-primary cursor-pointer"
                          aria-label="Limpar busca"
                        >
                          <mat-icon style="font-size: 14px; width: 14px; height: 14px;">close</mat-icon>
                        </button>
                      }
                    </div>

                    <!-- Barra de ações rápidas dentro do dropdown -->
                    <div class="flex items-center justify-between text-xs text-siage-text-secondary px-1">
                      <span class="font-medium text-siage-text-primary">
                        {{ cargosControl.value.length }} de {{ cargosAtivos().length }} selecionados
                      </span>
                      <div class="flex items-center gap-2">
                        <button 
                          type="button" 
                          (click)="$event.stopPropagation(); selecionarTodosCargosFiltro()" 
                          class="text-siage-primary hover:underline font-semibold cursor-pointer"
                        >
                          Marcar todos
                        </button>
                        <span class="text-siage-border select-none">|</span>
                        <button 
                          type="button" 
                          (click)="$event.stopPropagation(); limparCargosFiltro()" 
                          class="text-siage-text-secondary hover:text-siage-destructive cursor-pointer"
                        >
                          Desmarcar
                        </button>
                      </div>
                    </div>
                  </div>

                  @for (cargo of cargosAtivosFiltro(); track cargo.id) {
                    <mat-option [value]="cargo.id">{{ cargo.nome }}</mat-option>
                  } @empty {
                    <div class="py-4 px-3 text-center text-xs text-siage-text-secondary">
                      Nenhum cargo encontrado
                    </div>
                  }
                </mat-select>
                @if (cargosControl.value.length > 0) {
                  <button 
                    type="button"
                    mat-icon-button 
                    matSuffix 
                    (click)="$event.stopPropagation(); limparCargosFiltro()" 
                    aria-label="Limpar filtro de cargo"
                    title="Limpar seleção de cargos"
                    class="text-siage-text-secondary hover:text-siage-text-primary scale-75 cursor-pointer -mr-1"
                  >
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                  </button>
                }
              </mat-form-field>
            </div>
          </div>

          <!-- Linha inferior: 2 campos maiores (Atrelada à gestão?, Status) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-start">
            
            <!-- Filtro Atrelada à gestão? -->
            <div class="form-field-group">
              <label for="filter-gestao" class="siage-field-label">Atrelada à gestão?</label>
              <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                <mat-select [formControl]="gestaoControl" id="filter-gestao" class="text-sm">
                  <mat-option value="TODAS">Todas</mat-option>
                  <mat-option value="SIM">Sim</mat-option>
                  <mat-option value="NAO">Não</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <!-- Filtro Status -->
            <div class="form-field-group">
              <label for="filter-status" class="siage-field-label">Status</label>
              <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                <mat-select [formControl]="statusControl" id="filter-status" class="text-sm">
                  <mat-option value="TODOS">Todos</mat-option>
                  <mat-option value="ATIVO">Ativo</mat-option>
                  <mat-option value="INATIVO">Inativo</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>
        </div>

        <!-- Ações do Filtro -->
        <div class="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-siage-border/40">
          <button 
            type="button" 
            (click)="onLimpar()"
            class="h-10 px-5 rounded-lg border border-siage-border font-sans font-medium text-sm text-siage-text-primary hover:bg-siage-primary/5 hover:border-siage-primary/30 active:scale-[0.99] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
          >
            Limpar
          </button>
          
          <button 
            type="button" 
            [disabled]="!isBuscarEnabled()"
            (click)="onBuscar()"
            class="inline-flex items-center justify-center gap-1.5 h-10 px-6 rounded-lg bg-siage-primary hover:bg-siage-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-sans font-semibold text-sm transition-all shadow-xs dark:shadow-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
          >
            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">search</mat-icon>
            <span>Buscar</span>
          </button>
        </div>
      </div>

      <!-- CARD / TABELA DE REGISTROS COM ESTADOS EXPLÍCITOS -->
      <div class="bg-siage-surface border border-siage-border rounded-lg shadow-xs dark:shadow-none overflow-hidden">
        
        <!-- ESTADO 1: CARREGANDO -->
        @if (isCarregando()) {
          <div class="p-4 sm:p-6 space-y-4">
            <div class="h-6 w-48 bg-slate-200 dark:bg-slate-700/50 rounded animate-pulse"></div>
            <div class="space-y-3">
              @for (i of [1, 2, 3, 4, 5]; track i) {
                <div class="h-12 bg-slate-100 dark:bg-slate-800/40 rounded-lg animate-pulse flex items-center justify-between px-4">
                  <div class="h-4 w-12 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                  <div class="h-4 w-44 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                  <div class="h-4 w-32 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                  <div class="h-4 w-14 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                  <div class="h-5 w-14 bg-slate-200 dark:bg-slate-700/60 rounded-full"></div>
                  <div class="h-4 w-8 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                  <div class="h-6 w-32 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                </div>
              }
            </div>
          </div>
        }

        <!-- ESTADO 2: ERRO -->
        @else if (isErro()) {
          <div class="py-14 px-6 flex flex-col items-center justify-center text-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-siage-destructive/10 text-siage-destructive flex items-center justify-center">
              <mat-icon style="font-size: 24px; width: 24px; height: 24px;">error_outline</mat-icon>
            </div>
            <div class="flex flex-col gap-1 max-w-md">
              <h3 class="text-base font-poppins font-semibold text-siage-text-primary">Erro ao carregar dados</h3>
              <p class="text-xs sm:text-sm text-siage-text-secondary">
                Não foi possível carregar as informações desta funcionalidade. Verifique sua conexão e tente novamente.
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
        }

        <!-- ESTADO 3: SEM REGISTROS -->
        @else if (isSemRegistros()) {
          <div class="py-16 px-6 flex flex-col items-center justify-center text-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-siage-text-secondary/10 text-siage-text-secondary flex items-center justify-center">
              <mat-icon style="font-size: 24px; width: 24px; height: 24px;">inbox</mat-icon>
            </div>
            <div class="flex flex-col gap-1 max-w-md">
              <h3 class="text-base font-poppins font-semibold text-siage-text-primary">Nenhum registro cadastrado</h3>
              <p class="text-xs sm:text-sm text-siage-text-secondary">
                Ainda não existem registros cadastrados para esta funcionalidade.
              </p>
            </div>
          </div>
        }

        <!-- ESTADO 4: SEM RESULTADO DE FILTRO -->
        @else if (isSemResultadoFiltro()) {
          <div class="py-16 px-6 flex flex-col items-center justify-center text-center gap-3">
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
        }

        <!-- ESTADO REGULAR: TABELA DE DADOS -->
        @else {
          <div class="overflow-x-auto w-full">
            <table 
              mat-table 
              [dataSource]="paginatedItems()" 
              matSort 
              [matSortActive]="sortState().active" 
              [matSortDirection]="sortState().direction"
              (matSortChange)="onSortChange($event)"
              class="w-full font-sans"
            >
              
              <!-- Coluna Código INEP: alinhada à direita com fonte mono -->
              <ng-container matColumnDef="codigoInep">
                <th mat-header-cell *matHeaderCellDef mat-sort-header class="text-right font-sans font-semibold text-xs text-siage-text-secondary py-3.5 pr-6 w-28">
                  Código INEP
                </th>
                <td mat-cell *matCellDef="let row" class="text-right font-mono font-medium text-siage-text-primary py-3.5 pr-6 text-sm">
                  {{ row.codigoInep }}
                </td>
              </ng-container>

              <!-- Coluna Descrição -->
              <ng-container matColumnDef="descricao">
                <th mat-header-cell *matHeaderCellDef mat-sort-header class="text-left font-sans font-semibold text-xs text-siage-text-secondary py-3.5 pl-4">
                  Descrição
                </th>
                <td mat-cell *matCellDef="let row" class="text-left font-sans text-siage-text-primary py-3.5 pl-4 text-sm font-medium">
                  {{ row.descricao }}
                </td>
              </ng-container>

              <!-- Coluna Cargo: exibe apenas 1 cargo; se houver múltiplos, exibe o primeiro + acionador para relação completa. Aumento de linha só ocorre se a label do cargo for extensa -->
              <ng-container matColumnDef="cargo">
                <th mat-header-cell *matHeaderCellDef class="text-left font-sans font-semibold text-xs text-siage-text-secondary py-3.5 pl-4 min-w-[280px]">
                  Cargo
                </th>
                <td mat-cell *matCellDef="let row" class="text-left font-sans text-siage-text-primary py-2.5 pl-4 text-sm font-normal align-middle">
                  @if (!row.cargosIds || row.cargosIds.length === 0) {
                    <span class="text-siage-text-secondary">-</span>
                  } @else if (row.cargosIds.length === 1) {
                    <span class="leading-snug break-words font-normal">{{ getCargoNomeByIndex(row.cargosIds, 0) }}</span>
                  } @else {
                    <div class="inline-flex items-center gap-2 flex-wrap leading-snug">
                      <span class="break-words font-normal">{{ getCargoNomeByIndex(row.cargosIds, 0) }}</span>
                      <button 
                        type="button"
                        cdkOverlayOrigin
                        #cargoTrigger="cdkOverlayOrigin"
                        (click)="togglePopover(row.id, $event)"
                        [attr.aria-expanded]="activePopoverId() === row.id"
                        aria-haspopup="dialog"
                        class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold text-siage-primary hover:bg-siage-primary/10 active:bg-siage-primary/20 transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40 shrink-0"
                        title="Ver relação completa"
                      >
                        +{{ row.cargosIds.length - 1 }} {{ (row.cargosIds.length - 1) === 1 ? 'cargo' : 'cargos' }}
                      </button>

                      <ng-template
                        cdkConnectedOverlay
                        [cdkConnectedOverlayOrigin]="cargoTrigger"
                        [cdkConnectedOverlayOpen]="activePopoverId() === row.id"
                        [cdkConnectedOverlayPositions]="popoverPositions"
                        [cdkConnectedOverlayHasBackdrop]="true"
                        cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
                        (backdropClick)="closePopover()"
                        (detach)="closePopover()"
                        (overlayKeydown)="onOverlayKeydown($event)"
                      >
                        <div 
                          class="w-72 sm:w-80 max-w-[90vw] bg-siage-surface border border-siage-border rounded-lg shadow-md p-3.5 font-sans text-siage-text-primary focus:outline-none z-50 animate-in fade-in zoom-in-95 duration-100"
                          role="dialog"
                          aria-label="Cargos vinculados"
                          tabindex="-1"
                        >
                          <div class="font-semibold text-xs text-siage-text-primary pb-2 mb-2 border-b border-siage-border/50 flex items-center justify-between">
                            <span>Cargos vinculados</span>
                            <span class="text-[11px] font-normal text-siage-text-secondary">({{ row.cargosIds.length }})</span>
                          </div>

                          <ul class="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs text-siage-text-primary list-none p-0 m-0">
                            @for (cargoNome of getCargosNomesArray(row.cargosIds); track cargoNome) {
                              <li class="flex items-start gap-1.5 leading-snug">
                                <span class="text-siage-text-secondary select-none shrink-0" aria-hidden="true">-</span>
                                <span>{{ cargoNome }}</span>
                              </li>
                            }
                          </ul>
                        </div>
                      </ng-template>
                    </div>
                  }
                </td>
              </ng-container>

              <!-- Coluna Atrelada à gestão: Sim / Não (sem negrito) -->
              <ng-container matColumnDef="atreladaGestao">
                <th mat-header-cell *matHeaderCellDef mat-sort-header class="text-center font-sans font-semibold text-xs text-siage-text-secondary py-3.5 w-36">
                  Atrelada à gestão
                </th>
                <td mat-cell *matCellDef="let row" class="text-center font-sans text-siage-text-primary py-3.5 w-36 text-sm font-normal">
                  {{ row.atreladaGestao ? 'Sim' : 'Não' }}
                </td>
              </ng-container>

              <!-- Coluna Situação: centralizada com badge -->
              <ng-container matColumnDef="situacao">
                <th mat-header-cell *matHeaderCellDef class="text-center font-sans font-semibold text-xs text-siage-text-secondary py-3.5 w-28">
                  Situação
                </th>
                <td mat-cell *matCellDef="let row" class="text-center py-3.5 w-28">
                  <span 
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium transition-colors"
                    [class]="row.ativo 
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-500/20' 
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 border border-slate-300/40 dark:border-slate-700/50'"
                  >
                    {{ row.ativo ? 'Ativo' : 'Inativo' }}
                  </span>
                </td>
              </ng-container>

              <!-- Coluna Em Uso -->
              <ng-container matColumnDef="emUso">
                <th mat-header-cell *matHeaderCellDef class="text-center font-sans font-semibold text-xs text-siage-text-secondary py-3.5 w-24">
                  Em uso
                </th>
                <td mat-cell *matCellDef="let row" class="text-center py-3.5 w-24">
                  @if (row.exibindoEmUsoIndicator) {
                    <button 
                      type="button"
                      (click)="onVerDetalhesEmUso(row)"
                      matTooltip="Ver vínculos de uso" 
                      aria-label="Ver vínculos de uso"
                      class="w-10 h-10 inline-flex items-center justify-center rounded-lg text-siage-primary hover:bg-siage-primary/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-siage-primary/40 mx-auto"
                    >
                      <mat-icon style="font-size: 20px; width: 20px; height: 20px;">link</mat-icon>
                    </button>
                  }
                </td>
              </ng-container>

              <!-- Coluna Ações -->
              <ng-container matColumnDef="acoes">
                <th mat-header-cell *matHeaderCellDef class="text-center font-sans font-semibold text-xs text-siage-text-secondary py-3.5 w-48">
                  Ações
                </th>
                <td mat-cell *matCellDef="let row" class="text-center py-3.5 w-48">
                  <div class="flex items-center justify-center gap-1">
                    
                    <!-- Visualizar -->
                    <button 
                      type="button"
                      (click)="onVisualizar(row)" 
                      matTooltip="Visualizar" 
                      aria-label="Visualizar função"
                      class="w-10 h-10 inline-flex items-center justify-center rounded-lg text-siage-text-secondary hover:text-siage-primary hover:bg-siage-primary/8 dark:hover:bg-siage-primary/12 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                    >
                      <mat-icon style="font-size: 20px; width: 20px; height: 20px;">visibility</mat-icon>
                    </button>
                    
                    <!-- Editar -->
                    <button 
                      type="button"
                      (click)="onEditar(row)" 
                      matTooltip="Editar" 
                      aria-label="Editar função"
                      class="w-10 h-10 inline-flex items-center justify-center rounded-lg text-siage-text-secondary hover:text-siage-primary hover:bg-siage-primary/8 dark:hover:bg-siage-primary/12 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                    >
                      <mat-icon style="font-size: 20px; width: 20px; height: 20px;">edit</mat-icon>
                    </button>

                    <!-- Ativar / Inativar Slide Toggle -->
                    <div class="w-10 h-10 inline-flex items-center justify-center">
                      <mat-slide-toggle 
                        [checked]="row.ativo" 
                        (click)="$event.preventDefault(); onToggleStatus(row)"
                        [matTooltip]="row.ativo ? 'Inativar' : 'Ativar'"
                        aria-label="Ativar ou inativar função"
                        class="scale-90"
                      >
                      </mat-slide-toggle>
                    </div>

                    <!-- Excluir -->
                    <button 
                      type="button"
                      (click)="onExcluir(row)" 
                      matTooltip="Excluir" 
                      aria-label="Excluir função"
                      class="w-10 h-10 inline-flex items-center justify-center rounded-lg text-siage-text-secondary hover:text-siage-destructive hover:bg-siage-destructive/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-destructive/40"
                    >
                      <mat-icon style="font-size: 20px; width: 20px; height: 20px;">delete</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns" class="bg-black/[0.02] dark:bg-white/[0.02] border-b border-siage-border"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns" class="border-b border-siage-border/40 hover:bg-siage-primary/[0.04] dark:hover:bg-siage-primary/[0.06] transition-colors"></tr>
            </table>
          </div>

          <!-- Paginação -->
          <app-siage-paginator 
            [length]="sortedItems().length"
            [pageSize]="paginatorPageSize()"
            [pageIndex]="paginatorPageIndex()"
            [pageSizeOptions]="[5, 10, 20]"
            (page)="onPageChange($event)"
          ></app-siage-paginator>
        }
      </div>
    </div>
    }
  `
})
export class FuncaoList {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly toastService = inject(ToastService);
  private readonly simulator = inject(SimulatorService);
  readonly service = inject(FuncaoService);
  readonly cargoService = inject(CargoService);
  readonly permissionService = inject(PermissionService);

  readonly hasAccess = computed(() => this.permissionService.hasAccess());

  readonly cargosAtivos = computed(() => {
    return this.cargoService.items()
      .filter(c => c.ativo)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  });

  readonly cargoFilterSearch = signal<string>('');

  readonly cargosAtivosFiltro = computed(() => {
    const term = this.cargoFilterSearch().trim().toLowerCase();
    const list = this.cargosAtivos();
    if (!term) return list;
    return list.filter(c => c.nome.toLowerCase().includes(term));
  });

  onFilterSelectOpenedChange(isOpen: boolean) {
    if (!isOpen) {
      this.cargoFilterSearch.set('');
    }
  }

  readonly displayedColumns: string[] = [
    'codigoInep', 
    'descricao', 
    'cargo', 
    'atreladaGestao', 
    'situacao', 
    'emUso', 
    'acoes'
  ];

  // Filtros locais nos inputs
  readonly codigoControl = new FormControl('', {nonNullable: true});
  readonly descricaoControl = new FormControl('', {nonNullable: true});
  readonly cargosControl = new FormControl<string[]>([], {nonNullable: true});
  readonly gestaoControl = new FormControl<'TODAS' | 'SIM' | 'NAO'>('TODAS', {nonNullable: true});
  readonly statusControl = new FormControl<'TODOS' | 'ATIVO' | 'INATIVO'>('TODOS', {nonNullable: true});

  // Filtros efetivamente aplicados na listagem
  readonly appliedCodigo = signal<string>('');
  readonly appliedDescricao = signal<string>('');
  readonly appliedCargos = signal<string[]>([]);
  readonly appliedGestao = signal<'TODAS' | 'SIM' | 'NAO'>('TODAS');
  readonly appliedStatus = signal<'TODOS' | 'ATIVO' | 'INATIVO'>('TODOS');

  // Controle de ativação do botão Buscar
  readonly isBuscarEnabled = signal<boolean>(false);

  // Paginação e Ordenação
  readonly paginatorPageIndex = signal<number>(0);
  readonly paginatorPageSize = signal<number>(10);
  readonly sortState = signal<Sort>({ active: 'codigoInep', direction: 'asc' });

  // Estados da Tabela
  readonly isLoading = signal<boolean>(false);
  readonly hasError = signal<boolean>(false);

  readonly hasFiltrosAplicados = computed(() => {
    return (
      !!this.appliedCodigo().trim() ||
      !!this.appliedDescricao().trim() ||
      this.appliedCargos().length > 0 ||
      this.appliedGestao() !== 'TODAS' ||
      this.appliedStatus() !== 'TODOS'
    );
  });

  readonly isCarregando = computed(() => {
    return this.simulator.currentScenario() === 'loading' || this.isLoading();
  });

  readonly isErro = computed(() => {
    return this.simulator.currentScenario() === 'error' || this.hasError();
  });

  readonly isSemRegistros = computed(() => {
    if (this.simulator.currentScenario() === 'empty') return true;
    if (this.simulator.currentScenario() === 'no_filter_results') return false;
    return this.service.items().length === 0 && !this.hasFiltrosAplicados();
  });

  readonly isSemResultadoFiltro = computed(() => {
    if (this.simulator.currentScenario() === 'no_filter_results') return true;
    if (this.simulator.currentScenario() === 'empty') return false;
    return this.filteredItems().length === 0 && this.hasFiltrosAplicados();
  });

  readonly filteredItems = computed(() => {
    const rawItems = this.service.items();
    const fCodigo = this.appliedCodigo().trim();
    const fDescricao = this.appliedDescricao().trim().toLowerCase();
    const fCargos = this.appliedCargos();
    const fGestao = this.appliedGestao();
    const fStatus = this.appliedStatus();

    return rawItems.filter(item => {
      // Filtro Código INEP
      if (fCodigo && !item.codigoInep.toLowerCase().includes(fCodigo.toLowerCase())) {
        return false;
      }

      // Filtro Descrição
      if (fDescricao && !item.descricao.toLowerCase().includes(fDescricao)) {
        return false;
      }

      // Filtro Cargo (multiselect: item deve ter ao menos um dos cargos selecionados)
      if (fCargos.length > 0) {
        const matchesCargo = fCargos.some(cargoId => item.cargosIds.includes(cargoId));
        if (!matchesCargo) {
          return false;
        }
      }

      // Filtro Atrelada à gestão
      if (fGestao !== 'TODAS') {
        const isSim = fGestao === 'SIM';
        if (item.atreladaGestao !== isSim) {
          return false;
        }
      }

      // Filtro Status
      if (fStatus !== 'TODOS') {
        const isAtivo = fStatus === 'ATIVO';
        if (item.ativo !== isAtivo) {
          return false;
        }
      }

      return true;
    });
  });

  readonly sortedItems = computed(() => {
    const items = [...this.filteredItems()];
    const sort = this.sortState();
    if (!sort.active || sort.direction === '') {
      return items;
    }

    return items.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'codigoInep':
          return this.compare(Number(a.codigoInep) || 0, Number(b.codigoInep) || 0, isAsc);
        case 'descricao':
          return this.compare(a.descricao, b.descricao, isAsc);
        case 'atreladaGestao':
          return this.compare(a.atreladaGestao ? 1 : 0, b.atreladaGestao ? 1 : 0, isAsc);
        case 'situacao':
          return this.compare(a.ativo ? 1 : 0, b.ativo ? 1 : 0, isAsc);
        default:
          return 0;
      }
    });
  });

  readonly paginatedItems = computed(() => {
    const sorted = this.sortedItems();
    const startIndex = this.paginatorPageIndex() * this.paginatorPageSize();
    return sorted.slice(startIndex, startIndex + this.paginatorPageSize());
  });

  constructor() {
    this.codigoControl.valueChanges.subscribe(() => this.updateBuscarStatus());
    this.descricaoControl.valueChanges.subscribe(() => this.updateBuscarStatus());
    this.cargosControl.valueChanges.subscribe(() => this.updateBuscarStatus());
    this.gestaoControl.valueChanges.subscribe(() => this.updateBuscarStatus());
    this.statusControl.valueChanges.subscribe(() => this.updateBuscarStatus());

    this.carregarDados();
  }

  carregarDados() {
    if (this.simulator.currentScenario() === 'loading' || this.simulator.currentScenario() === 'error') {
      this.isLoading.set(false);
      return;
    }
    this.simulator.reset();
    this.service.resetIndicators();
    this.isLoading.set(true);
    this.hasError.set(false);
    setTimeout(() => {
      this.isLoading.set(false);
    }, 350);
  }

  updateBuscarStatus() {
    const hasValue = (
      this.codigoControl.value.trim() !== '' ||
      this.descricaoControl.value.trim() !== '' ||
      this.cargosControl.value.length > 0 ||
      this.gestaoControl.value !== 'TODAS' ||
      this.statusControl.value !== 'TODOS'
    );

    const isDifferent = (
      this.codigoControl.value.trim() !== this.appliedCodigo() ||
      this.descricaoControl.value.trim() !== this.appliedDescricao() ||
      JSON.stringify(this.cargosControl.value) !== JSON.stringify(this.appliedCargos()) ||
      this.gestaoControl.value !== this.appliedGestao() ||
      this.statusControl.value !== this.appliedStatus()
    );

    this.isBuscarEnabled.set(hasValue || isDifferent);
  }

  onFilterCodigoInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.substring(0, 2);
    }
    input.value = value;
    this.codigoControl.setValue(value, { emitEvent: true });
    this.updateBuscarStatus();
  }

  /**
   * Apresenta até 3 cargos selecionados no trigger.
   * Se selecionados > 3, apresenta "X cargos selecionados".
   */
  getSelectedCargosFilterText(): string {
    const selectedIds = this.cargosControl.value;
    if (!selectedIds || selectedIds.length === 0) return 'Todos';
    const allCargos = this.cargoService.items();
    const names = selectedIds
      .map(id => allCargos.find(c => c.id === id)?.nome)
      .filter((n): n is string => !!n);
    if (names.length === 0) return 'Todos';
    if (names.length <= 3) {
      return names.join(', ');
    }
    return `${names.length} cargos selecionados`;
  }


  selecionarTodosCargosFiltro() {
    const todosIds = this.cargosAtivos().map(c => c.id);
    this.cargosControl.setValue(todosIds);
    this.updateBuscarStatus();
  }

  limparCargosFiltro() {
    this.cargosControl.setValue([]);
    this.updateBuscarStatus();
  }

  formatCargosList(cargosIds: string[]): string {
    if (!cargosIds || cargosIds.length === 0) return '-';
    const allCargos = this.cargoService.items();
    const nomes = cargosIds
      .map(id => allCargos.find(c => c.id === id)?.nome)
      .filter((nome): nome is string => !!nome);
    return nomes.length > 0 ? nomes.join(', ') : '-';
  }

  getFirstCargosText(cargosIds: string[], count = 2): string {
    const allCargos = this.cargoService.items();
    const nomes = cargosIds
      .slice(0, count)
      .map(id => allCargos.find(c => c.id === id)?.nome)
      .filter((n): n is string => !!n);
    return nomes.join(', ');
  }

  readonly activePopoverId = signal<string | null>(null);

  readonly popoverPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 6,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -6,
    },
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 6,
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -6,
    }
  ];

  togglePopover(id: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (this.activePopoverId() === id) {
      this.closePopover();
    } else {
      this.activePopoverId.set(id);
    }
  }

  closePopover() {
    this.activePopoverId.set(null);
  }

  onEscapeKey() {
    this.closePopover();
  }

  onOverlayKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closePopover();
    }
  }

  getCargoNomeByIndex(cargosIds: string[], index: number): string {
    const allCargos = this.cargoService.items();
    const id = cargosIds[index];
    if (!id) return '';
    return allCargos.find(c => c.id === id)?.nome || '';
  }

  getFirstCargosList(cargosIds: string[], count: number): string[] {
    const allCargos = this.cargoService.items();
    return cargosIds
      .slice(0, count)
      .map(id => allCargos.find(c => c.id === id)?.nome)
      .filter((n): n is string => !!n);
  }

  getCargosNomesArray(cargosIds: string[]): string[] {
    const allCargos = this.cargoService.items();
    return cargosIds
      .map(id => allCargos.find(c => c.id === id)?.nome)
      .filter((n): n is string => !!n);
  }

  onBuscar() {
    this.appliedCodigo.set(this.codigoControl.value.trim());
    this.appliedDescricao.set(this.descricaoControl.value.trim());
    this.appliedCargos.set([...this.cargosControl.value]);
    this.appliedGestao.set(this.gestaoControl.value);
    this.appliedStatus.set(this.statusControl.value);
    this.paginatorPageIndex.set(0);
    this.updateBuscarStatus();
  }

  onLimpar() {
    this.codigoControl.setValue('');
    this.descricaoControl.setValue('');
    this.cargosControl.setValue([]);
    this.cargoFilterSearch.set('');
    this.gestaoControl.setValue('TODAS');
    this.statusControl.setValue('TODOS');
    this.appliedCodigo.set('');
    this.appliedDescricao.set('');
    this.appliedCargos.set([]);
    this.appliedGestao.set('TODAS');
    this.appliedStatus.set('TODOS');
    this.paginatorPageIndex.set(0);
    this.updateBuscarStatus();
    if (this.simulator.currentScenario() === 'no_filter_results') {
      this.simulator.reset();
    }
  }

  onSortChange(sort: Sort) {
    this.sortState.set(sort);
  }

  onPageChange(event: PageEvent) {
    this.paginatorPageIndex.set(event.pageIndex);
    this.paginatorPageSize.set(event.pageSize);
  }

  private compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  goHome() {
    this.router.navigate(['/inicio']);
  }

  navConfig() {
    this.router.navigate(['/configuracoes']);
  }

  navSead() {
    this.router.navigate(['/configuracoes/sead']);
  }

  goBack() {
    this.router.navigate(['/configuracoes/sead']);
  }

  onAdicionar() {
    this.router.navigate(['/configuracoes/sead/funcao/novo']);
  }

  onVisualizar(row: FuncaoItem) {
    this.router.navigate([`/configuracoes/sead/funcao/${row.id}`]);
  }

  onEditar(row: FuncaoItem) {
    this.router.navigate([`/configuracoes/sead/funcao/${row.id}/editar`]);
  }

  onToggleStatus(row: FuncaoItem) {
    const isAtivo = row.ativo;
    const dialogRef = this.dialog.open(ConfirmacaoDialog, {
      disableClose: true,
      data: {
        title: isAtivo ? 'Inativar registro?' : 'Ativar registro?',
        message: `Tem certeza que deseja ${isAtivo ? 'inativar' : 'ativar'} a função ${row.codigoInep} - ${row.descricao}?`,
        cancelLabel: 'Cancelar',
        actionLabel: isAtivo ? 'Sim, inativar' : 'Sim, ativar',
        actionType: 'primary',
        loadingLabel: isAtivo ? 'Inativando...' : 'Ativando...'
      }
    });

    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.service.updateStatus(row.id, !row.ativo);
        this.toastService.success(isAtivo ? 'Registro inativado com sucesso.' : 'Registro ativado com sucesso.');
      }
    });
  }

  onExcluir(row: FuncaoItem) {
    if (row.emUsoOriginal) {
      const dialogRef = this.dialog.open(ResultadoDialog, {
        disableClose: true,
        data: {
          type: 'warning',
          title: 'Não foi possível excluir o registro',
          message: 'O registro não pode ser excluído, pois está em uso em outras funcionalidades do sistema.',
          buttonLabel: 'Fechar'
        }
      });

      dialogRef.afterClosed().subscribe(() => {
        this.service.setIndicator(row.id, true);
      });
    } else {
      const dialogRef = this.dialog.open(ConfirmacaoDialog, {
        disableClose: true,
        data: {
          title: 'Excluir registro?',
          message: `Tem certeza que deseja excluir a função ${row.codigoInep} - ${row.descricao}? Esta ação não poderá ser desfeita.`,
          cancelLabel: 'Cancelar',
          actionLabel: 'Sim, excluir registro',
          actionType: 'destructive',
          loadingLabel: 'Excluindo...'
        }
      });

      dialogRef.afterClosed().subscribe((confirmado: boolean) => {
        if (confirmado) {
          this.service.delete(row.id);
          this.toastService.success('Registro excluído com sucesso.');
        }
      });
    }
  }

  onVerDetalhesEmUso(row: FuncaoItem) {
    const vinculos = this.service.getVinculos(row.id, this.simulator.manyLinksScenario());
    this.dialog.open(ResultadoDialog, {
      disableClose: true,
      data: {
        type: 'info',
        title: 'Vínculos de uso',
        vinculos,
        totalTabelas: vinculos.length,
        buttonLabel: 'Fechar'
      }
    });
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-funcao-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatSelectModule,
    MatRadioModule,
    MatCardModule,
    AcessoRestritoComponent,
    CommonModule
  ],
  template: `
    @if (!hasAccess()) {
      <app-acesso-restrito backUrl="/inicio" />
    } @else {
      <div class="flex flex-col gap-6 font-sans">
      
      <!-- Cabeçalho de Formulário / Visualização -->
      <div class="flex flex-col gap-2">
        
        <!-- Breadcrumbs: Início / Configurações / SEAD / Função / [Cadastrar | Visualizar | Editar] -->
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
            (click)="navConfig()" 
            (keydown.enter)="navConfig()" 
            tabindex="0" 
            role="button" 
            class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline"
          >
            Configurações
          </span>
          <span class="text-[10px] text-siage-text-secondary/40 select-none" aria-hidden="true">/</span>
          <span 
            (click)="navSead()" 
            (keydown.enter)="navSead()" 
            tabindex="0" 
            role="button" 
            class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline"
          >
            SEAD
          </span>
          <span class="text-[10px] text-siage-text-secondary/40 select-none" aria-hidden="true">/</span>
          <span 
            (click)="goBack()" 
            (keydown.enter)="goBack()" 
            tabindex="0" 
            role="button" 
            class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline"
          >
            Função
          </span>
          <span class="text-[10px] text-siage-text-secondary/40 select-none" aria-hidden="true">/</span>
          <span class="text-siage-primary font-semibold" aria-current="page">{{ breadcrumbModeText() }}</span>
        </nav>

        <!-- Título com Voltar e ação Editar junto ao título (se em modo visualização) -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2 sm:gap-3">
              <button 
                mat-icon-button 
                (click)="goBack()" 
                class="text-siage-text-secondary hover:text-siage-primary transition-colors cursor-pointer -ml-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                title="Voltar para a Listagem"
                aria-label="Voltar para a Listagem"
              >
                <mat-icon style="font-size: 22px; width: 22px; height: 22px;">arrow_back</mat-icon>
              </button>
              <h1 class="text-2xl sm:text-3xl font-poppins font-bold tracking-tight text-siage-text-primary leading-tight">
                {{ titleText() }}
              </h1>
            </div>

            <p class="text-xs sm:text-sm text-siage-text-secondary font-sans leading-normal pl-8 sm:pl-9 max-w-2xl">
              {{ descriptionText() }}
            </p>
          </div>

          <!-- Ação Editar junto ao título (modo Visualizar) -->
          @if (isViewMode() && permissionService.canCreate()) {
            <button 
              type="button"
              (click)="onToggleEdit()" 
              class="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs dark:shadow-none active:scale-[0.99] shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
            >
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">edit</mat-icon>
              <span>Editar</span>
            </button>
          }
        </div>
      </div>

      <!-- MODO VISUALIZAR: BLOCOS DE INFORMAÇÃO SOMENTE LEITURA -->
      @if (isViewMode()) {
        <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs dark:shadow-none">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <!-- Código INEP -->
            <div class="flex flex-col gap-1.5">
              <span class="text-xs font-semibold tracking-wider uppercase text-siage-text-secondary">Código INEP</span>
              <span class="text-base font-mono font-bold text-siage-text-primary">{{ currentItem()?.codigoInep }}</span>
            </div>

            <!-- Descrição -->
            <div class="flex flex-col gap-1.5 md:col-span-2">
              <span class="text-xs font-semibold tracking-wider uppercase text-siage-text-secondary">Descrição</span>
              <span class="text-base font-semibold text-siage-text-primary">{{ currentItem()?.descricao }}</span>
            </div>

            <!-- Situação com Badge Ativo/Inativo -->
            <div class="flex flex-col gap-1.5">
              <span class="text-xs font-semibold tracking-wider uppercase text-siage-text-secondary">Situação</span>
              <div>
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-sans font-medium transition-colors"
                  [class]="currentItem()?.ativo 
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-500/20' 
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 border border-slate-300/40 dark:border-slate-700/50'"
                >
                  {{ currentItem()?.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </div>
            </div>

            <!-- Atrelada à gestão? -->
            <div class="flex flex-col gap-1.5 md:col-span-2">
              <span class="text-xs font-semibold tracking-wider uppercase text-siage-text-secondary">Atrelada à gestão</span>
              <span class="text-base font-medium text-siage-text-primary">{{ currentItem()?.atreladaGestao ? 'Sim' : 'Não' }}</span>
            </div>

            <!-- Detalhamento da função -->
            <div class="flex flex-col gap-1.5 md:col-span-2 lg:col-span-4">
              <span class="text-xs font-semibold tracking-wider uppercase text-siage-text-secondary">Detalhamento da função</span>
              <span class="text-base font-medium text-siage-text-primary">{{ currentItem()?.detalhamento || 'Não informado' }}</span>
            </div>

            <!-- Cargo: Apresentação robusta de todos os cargos vinculados (suporta poucos ou muitos cargos) -->
            <div class="flex flex-col gap-2 md:col-span-2 lg:col-span-4 mt-2 pt-4 border-t border-siage-border/40">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold tracking-wider uppercase text-siage-text-secondary">Cargos vinculados</span>
                  <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-siage-primary/10 text-siage-primary border border-siage-primary/20">
                    {{ currentItem()?.cargosIds?.length || 0 }} {{ (currentItem()?.cargosIds?.length || 0) === 1 ? 'cargo' : 'cargos' }}
                  </span>
                </div>
              </div>
              
              <div class="flex flex-wrap gap-2 p-3 bg-siage-background rounded-lg border border-siage-border/60 max-h-56 overflow-y-auto">
                @for (cargoNome of getCargosNomesArray(currentItem()?.cargosIds || []); track cargoNome) {
                  <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-siage-surface text-siage-text-primary border border-siage-border shadow-2xs">
                    <mat-icon style="font-size: 15px; width: 15px; height: 15px;" class="text-siage-primary shrink-0">badge</mat-icon>
                    <span class="leading-tight">{{ cargoNome }}</span>
                  </span>
                } @empty {
                  <span class="text-sm text-siage-text-secondary">Não informado</span>
                }
              </div>
            </div>
          </div>

          <!-- Linha de Auditoria -->
          <div class="mt-8 pt-4 border-t border-siage-border/40 text-xs text-siage-text-secondary">
            Última atualização em 03/06/2024 às 13:44 pelo usuário Alessandra.
          </div>
        </div>
      }

      <!-- MODO CADASTRAR / EDITAR -->
      @else {
        <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs dark:shadow-none">
          <form [formGroup]="form" class="flex flex-col gap-6" (keydown.enter)="$event.preventDefault()">
            
            <div class="grid grid-cols-1 md:grid-cols-6 gap-5 items-start">
              
              <!-- Código INEP: obrigatório, numérico, máximo 2 caracteres -->
              <div class="col-span-1 md:col-span-2 form-field-group">
                <label for="form-codigo-inep" class="siage-field-label">
                  <span>Código INEP</span>
                  <span class="text-red-500 font-bold">*</span>
                  <mat-icon 
                    class="text-siage-text-secondary hover:text-siage-primary cursor-pointer text-sm w-4 h-4 flex items-center justify-center scale-90"
                    matTooltip="Este código deve ser igual ao das tabelas auxiliares do INEP."
                    matTooltipPosition="above"
                  >info</mat-icon>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="form-codigo-inep"
                    type="text" 
                    maxlength="2"
                    formControlName="codigoInep"
                    placeholder="Digite o código INEP" 
                    class="font-mono font-medium text-sm"
                    (input)="onCodigoInepInput($event)"
                  />
                  <mat-hint class="text-xs text-siage-text-secondary/70">
                    Este código deve ser igual ao das tabelas auxiliares do INEP.
                  </mat-hint>
                  @if (form.get('codigoInep')?.hasError('required') && form.get('codigoInep')?.touched) {
                    <mat-error>Código INEP é obrigatório.</mat-error>
                  } @else if (form.get('codigoInep')?.hasError('duplicado') && form.get('codigoInep')?.touched) {
                    <mat-error>Já existe função cadastrada com esta Descrição e Código INEP.</mat-error>
                  } @else if (form.get('codigoInep')?.hasError('pattern') && form.get('codigoInep')?.touched) {
                    <mat-error>Código deve conter até 2 números.</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Descrição: obrigatória, máximo 200 caracteres -->
              <div class="col-span-1 md:col-span-4 form-field-group">
                <label for="form-descricao" class="siage-field-label">
                  <span>Descrição</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="form-descricao"
                    type="text" 
                    maxlength="200"
                    formControlName="descricao"
                    placeholder="Digite a descrição da função" 
                    (blur)="onDescricaoBlur()"
                    class="text-sm"
                  />
                  <mat-hint align="end" class="text-xs text-siage-text-secondary/70">
                    {{ (form.get('descricao')?.value || '').length }} de 200
                  </mat-hint>
                  @if (form.get('descricao')?.hasError('required') && form.get('descricao')?.touched) {
                    <mat-error>Descrição é obrigatória.</mat-error>
                  } @else if (form.get('descricao')?.hasError('duplicado') && form.get('descricao')?.touched) {
                    <mat-error>Já existe função cadastrada com esta Descrição e Código INEP.</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Cargo: obrigatório, multiselect com trigger inteligente (até 3 nomes ou "X cargos selecionados") -->
              <div class="col-span-1 md:col-span-4 form-field-group">
                <label for="form-cargos" class="siage-field-label">
                  <span>Cargo</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <mat-select 
                    id="form-cargos"
                    formControlName="cargosIds" 
                    multiple 
                    placeholder="Selecione um ou mais cargos"
                    class="text-sm"
                    (openedChange)="onFormSelectOpenedChange($event)"
                  >
                    <mat-select-trigger>
                      {{ getSelectedCargosTriggerText() }}
                    </mat-select-trigger>

                    <!-- Painel fixo no topo com busca e ações rápidas -->
                    <div class="p-2 border-b border-siage-border/40 bg-siage-surface dark:bg-slate-800 sticky top-0 z-10 space-y-2">
                      <!-- Campo de busca no topo das opções com placeholder "Buscar cargo" -->
                      <div class="relative flex items-center">
                        <mat-icon class="absolute left-2.5 text-siage-text-secondary pointer-events-none" style="font-size: 16px; width: 16px; height: 16px;">search</mat-icon>
                        <input 
                          type="text" 
                          [value]="cargoFormSearch()" 
                          (input)="cargoFormSearch.set($any($event.target).value)" 
                          (keydown)="$event.stopPropagation()" 
                          (click)="$event.stopPropagation()"
                          placeholder="Buscar cargo"
                          class="w-full h-8 pl-8 pr-7 text-xs bg-slate-50 dark:bg-slate-900/60 rounded border border-siage-border/80 focus:border-siage-primary focus:outline-none text-siage-text-primary"
                        />
                        @if (cargoFormSearch()) {
                          <button 
                            type="button" 
                            (click)="$event.stopPropagation(); cargoFormSearch.set('')"
                            class="absolute right-2 text-siage-text-secondary hover:text-siage-text-primary cursor-pointer"
                            aria-label="Limpar busca"
                          >
                            <mat-icon style="font-size: 14px; width: 14px; height: 14px;">close</mat-icon>
                          </button>
                        }
                      </div>

                      <!-- Ações Rápidas no dropdown -->
                      <div class="flex items-center justify-between text-xs text-siage-text-secondary px-1">
                        <span class="font-medium text-siage-text-primary">
                          {{ form.controls.cargosIds.value.length }} de {{ cargosAtivos().length }} selecionados
                        </span>
                        <div class="flex items-center gap-2">
                          <button 
                            type="button" 
                            (click)="$event.stopPropagation(); selecionarTodosCargosForm()" 
                            class="text-siage-primary hover:underline font-semibold cursor-pointer"
                          >
                            Marcar todos
                          </button>
                          <span class="text-siage-border select-none">|</span>
                          <button 
                            type="button" 
                            (click)="$event.stopPropagation(); limparCargosForm()" 
                            class="text-siage-text-secondary hover:text-siage-destructive cursor-pointer"
                          >
                            Desmarcar
                          </button>
                        </div>
                      </div>
                    </div>

                    @for (cargo of cargosAtivosForm(); track cargo.id) {
                      <mat-option [value]="cargo.id">{{ cargo.nome }}</mat-option>
                    } @empty {
                      <div class="py-4 px-3 text-center text-xs text-siage-text-secondary">
                        Nenhum cargo encontrado
                      </div>
                    }
                  </mat-select>
                  @if (form.get('cargosIds')?.hasError('required') && form.get('cargosIds')?.touched) {
                    <mat-error>Cargo é obrigatório. Selecione ao menos um cargo.</mat-error>
                  }
                </mat-form-field>

                <!-- Resumo dos cargos selecionados com tags removíveis para transparência ao usuário -->
                @if (form.controls.cargosIds.value.length > 0) {
                  <div class="mt-2.5 p-3 rounded-lg bg-siage-background border border-siage-border/70 flex flex-col gap-2">
                    <div class="flex items-center justify-between text-xs text-siage-text-secondary font-medium">
                      <div class="flex items-center gap-1.5">
                        <mat-icon style="font-size: 14px; width: 14px; height: 14px;" class="text-siage-primary">fact_check</mat-icon>
                        <span class="font-semibold text-siage-text-primary">
                          Cargos selecionados ({{ form.controls.cargosIds.value.length }}):
                        </span>
                      </div>
                      <button 
                        type="button" 
                        (click)="limparCargosForm()" 
                        class="text-xs text-siage-primary hover:underline font-semibold cursor-pointer"
                      >
                        Limpar seleção
                      </button>
                    </div>
                    
                    <div class="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                      @for (id of form.controls.cargosIds.value; track id) {
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-siage-primary/10 text-siage-primary border border-siage-primary/20 shadow-2xs">
                          <span>{{ getCargoNome(id) }}</span>
                          <button 
                            type="button" 
                            (click)="removerCargoForm(id)" 
                            title="Remover cargo" 
                            aria-label="Remover cargo"
                            class="hover:text-siage-destructive hover:bg-siage-destructive/10 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <mat-icon style="font-size: 12px; width: 12px; height: 12px;">close</mat-icon>
                          </button>
                        </span>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Atrelada à gestão?: obrigatório, Sim / Não, iniciando por padrão como Não -->
              <div class="col-span-1 md:col-span-2 form-field-group">
                <span class="siage-field-label">
                  <span>Atrelada à gestão?</span>
                  <span class="text-red-500 font-bold">*</span>
                </span>
                <div class="h-10 flex items-center">
                  <mat-radio-group 
                    formControlName="atreladaGestao" 
                    aria-label="Atrelada à gestão?"
                    class="flex items-center gap-6"
                  >
                    <mat-radio-button [value]="true" color="primary" class="text-sm font-sans">Sim</mat-radio-button>
                    <mat-radio-button [value]="false" color="primary" class="text-sm font-sans">Não</mat-radio-button>
                  </mat-radio-group>
                </div>
                @if (form.get('atreladaGestao')?.hasError('required') && form.get('atreladaGestao')?.touched) {
                  <span class="text-xs text-red-500 font-sans mt-0.5">Campo obrigatório.</span>
                }
              </div>

              <!-- Detalhamento da função: opcional, máximo 500 caracteres -->
              <div class="col-span-1 md:col-span-6 form-field-group">
                <label for="form-detalhamento" class="siage-field-label">
                  <span>Detalhamento da função</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <textarea 
                    matInput 
                    id="form-detalhamento"
                    rows="3"
                    maxlength="500"
                    formControlName="detalhamento"
                    placeholder="Descreva as atribuições ou detalhamento desta função"
                    (blur)="onDetalhamentoBlur()"
                    class="text-sm"
                  ></textarea>
                  <mat-hint align="end" class="text-xs text-siage-text-secondary/70">
                    {{ (form.get('detalhamento')?.value || '').length }} de 500
                  </mat-hint>
                </mat-form-field>
              </div>
            </div>

            <!-- Linha de Auditoria & Rodapé de Ações: Cancelar -> Salvar/Atualizar -->
            <div class="flex flex-col gap-4 mt-2">
              @if (isEditMode()) {
                <div class="text-xs text-siage-text-secondary/80 pl-1 border-t border-siage-border/20 pt-3">
                  Última atualização em 03/06/2024 às 13:44 pelo usuário Alessandra.
                </div>
              }

              <div class="flex justify-end gap-3 pt-3 border-t border-siage-border/40">
                <button 
                  type="button" 
                  (click)="onCancelar()"
                  [disabled]="isSaving()"
                  [class.opacity-50]="isSaving()"
                  [class.pointer-events-none]="isSaving()"
                  class="h-10 px-5 rounded-lg border border-siage-border font-sans font-medium text-sm text-siage-text-primary hover:bg-siage-primary/5 hover:border-siage-primary/30 active:scale-[0.99] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                
                <button 
                  type="button" 
                  (click)="onConfirmSave()"
                  [disabled]="isSaving()"
                  [class.opacity-70]="isSaving()"
                  [class.cursor-not-allowed]="isSaving()"
                  [class.pointer-events-none]="isSaving()"
                  class="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs dark:shadow-none active:scale-[0.99] shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40 disabled:cursor-not-allowed"
                >
                  @if (isSaving()) {
                    <span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true"></span>
                    <span>Salvando...</span>
                  } @else {
                    <mat-icon style="font-size: 18px; width: 18px; height: 18px;">{{ isEditMode() ? 'check' : 'save' }}</mat-icon>
                    <span>{{ isEditMode() ? 'Atualizar' : 'Salvar' }}</span>
                  }
                </button>
              </div>
            </div>
          </form>
        </div>
      }
    </div>
    }
  `
})
export class FuncaoForm {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(FuncaoService);
  readonly cargoService = inject(CargoService);
  private readonly dialog = inject(MatDialog);
  private readonly modalService = inject(ModalService);
  private readonly toastService = inject(ToastService);
  readonly permissionService = inject(PermissionService);

  private cancelHandler!: FormCancelHandler;

  readonly isSaving = signal<boolean>(false);

  readonly hasAccess = computed(() => {
    if (!this.permissionService.hasAccess()) return false;
    if (!this.itemId && !this.permissionService.canCreate()) return false;
    return true;
  });

  readonly cargosAtivos = computed(() => {
    return this.cargoService.items()
      .filter(c => c.ativo)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  });

  readonly cargoFormSearch = signal<string>('');

  readonly cargosAtivosForm = computed(() => {
    const term = this.cargoFormSearch().trim().toLowerCase();
    const list = this.cargosAtivos();
    if (!term) return list;
    return list.filter(c => c.nome.toLowerCase().includes(term));
  });

  onFormSelectOpenedChange(isOpen: boolean) {
    if (!isOpen) {
      this.cargoFormSearch.set('');
    }
  }

  readonly form = new FormGroup({
    codigoInep: new FormControl('', {
      nonNullable: true, 
      validators: [
        Validators.required, 
        Validators.pattern(/^\d{1,2}$/)
      ]
    }),
    descricao: new FormControl('', {
      nonNullable: true, 
      validators: [
        Validators.required,
        Validators.maxLength(200)
      ]
    }),
    detalhamento: new FormControl('', {nonNullable: true}),
    cargosIds: new FormControl<string[]>([], {
      nonNullable: true,
      validators: [
        Validators.required,
        (control: AbstractControl): ValidationErrors | null => {
          const val = control.value;
          return Array.isArray(val) && val.length > 0 ? null : { required: true };
        }
      ]
    }),
    atreladaGestao: new FormControl<boolean>(false, {
      nonNullable: true,
      validators: [Validators.required]
    }),
    ativo: new FormControl(true, {nonNullable: true})
  });

  itemId: string | null = null;
  readonly isViewMode = signal(false);
  readonly isEditMode = signal(false);
  readonly currentItem = signal<FuncaoItem | undefined>(undefined);

  breadcrumbModeText = computed(() => {
    if (this.itemId && this.isViewMode()) return 'Visualizar';
    if (this.itemId && this.isEditMode()) return 'Editar';
    return 'Cadastrar';
  });

  titleText = computed(() => {
    if (this.itemId && this.isViewMode()) return 'Visualizar Função';
    if (this.itemId && this.isEditMode()) return 'Editar Função';
    return 'Adicionar Função';
  });

  descriptionText = computed(() => {
    if (this.itemId && this.isViewMode()) return 'Consulte os dados da função.';
    if (this.itemId && this.isEditMode()) return 'Altere os dados da função.';
    return 'Cadastre uma nova função.';
  });

  constructor() {
    const params = this.route.snapshot.params;
    const url = this.router.url;

    this.cancelHandler = new FormCancelHandler(
      this.form,
      this.modalService,
      () => this.goBack(true)
    );

    if (params['id']) {
      const id = params['id'] as string;
      this.itemId = id;
      const item = this.service.getItem(id);
      if (item) {
        this.currentItem.set(item);
        this.form.patchValue({
          codigoInep: item.codigoInep,
          descricao: item.descricao,
          detalhamento: item.detalhamento || '',
          cargosIds: item.cargosIds || [],
          atreladaGestao: item.atreladaGestao,
          ativo: item.ativo
        });
      }
      
      if (url.endsWith('/editar')) {
        this.isEditMode.set(true);
      } else {
        this.isViewMode.set(true);
        this.form.disable();
      }
    }

    // Captura estado limpo inicial
    this.cancelHandler.captureInitialState();
  }

  onCodigoInepInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    value = value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.substring(0, 2);
    }
    input.value = value;
    if (this.form.controls.codigoInep.hasError('duplicado')) {
      this.form.controls.codigoInep.setErrors(null);
    }
    if (this.form.controls.descricao.hasError('duplicado')) {
      this.form.controls.descricao.setErrors(null);
    }
    this.form.controls.codigoInep.setValue(value, { emitEvent: true });
  }

  onDescricaoBlur() {
    const ctrl = this.form.controls.descricao;
    const normalized = ctrl.value.trim().replace(/\s+/g, ' ');
    ctrl.setValue(normalized, { emitEvent: false });
    if (ctrl.hasError('duplicado')) {
      ctrl.setErrors(null);
    }
    if (this.form.controls.codigoInep.hasError('duplicado')) {
      this.form.controls.codigoInep.setErrors(null);
    }
  }

  onDetalhamentoBlur() {
    const ctrl = this.form.controls.detalhamento;
    const normalized = ctrl.value.trim().replace(/\s+/g, ' ');
    ctrl.setValue(normalized, { emitEvent: false });
  }

  /**
   * Apresenta até 3 cargos selecionados no trigger.
   * Se selecionados > 3, apresenta "X cargos selecionados".
   */
  getSelectedCargosTriggerText(): string {
    const selectedIds = this.form.controls.cargosIds.value;
    if (!selectedIds || selectedIds.length === 0) return '';
    const allCargos = this.cargoService.items();
    const names = selectedIds
      .map(id => allCargos.find(c => c.id === id)?.nome)
      .filter((n): n is string => !!n);
    if (names.length === 0) return '';
    if (names.length <= 3) {
      return names.join(', ');
    }
    return `${names.length} cargos selecionados`;
  }


  getCargoNome(id: string): string {
    return this.cargoService.items().find(c => c.id === id)?.nome || id;
  }

  getCargosNomesArray(cargosIds: string[]): string[] {
    const allCargos = this.cargoService.items();
    return cargosIds
      .map(id => allCargos.find(c => c.id === id)?.nome)
      .filter((nome): nome is string => !!nome);
  }

  selecionarTodosCargosForm() {
    const todosIds = this.cargosAtivos().map(c => c.id);
    this.form.controls.cargosIds.setValue(todosIds);
    this.form.controls.cargosIds.markAsTouched();
  }

  limparCargosForm() {
    this.form.controls.cargosIds.setValue([]);
    this.form.controls.cargosIds.markAsTouched();
  }

  removerCargoForm(id: string) {
    const current = this.form.controls.cargosIds.value || [];
    this.form.controls.cargosIds.setValue(current.filter(item => item !== id));
    this.form.controls.cargosIds.markAsTouched();
  }

  goBack(force = false) {
    if (!force && !this.isViewMode() && this.cancelHandler?.hasUnsavedChanges()) {
      this.cancelHandler.handleCancel();
      return;
    }
    this.router.navigate(['/configuracoes/sead/funcao']);
  }

  onCancelar() {
    this.cancelHandler.handleCancel();
  }

  goHome() {
    this.router.navigate(['/inicio']);
  }

  navConfig() {
    this.router.navigate(['/configuracoes']);
  }

  navSead() {
    this.router.navigate(['/configuracoes/sead']);
  }

  onToggleEdit() {
    if (this.itemId) {
      this.router.navigate([`/configuracoes/sead/funcao/${this.itemId}/editar`]);
    }
  }

  onConfirmSave() {
    if (this.isSaving()) {
      return;
    }

    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const {codigoInep, descricao, detalhamento, cargosIds, atreladaGestao, ativo} = this.form.getRawValue();

    // Validação de duplicidade: combinação Descrição + Código INEP
    const normalizedCodigo = codigoInep.trim();
    const normalizedDescricao = descricao.trim().toLowerCase();

    const isDuplicate = this.service.items().some(item => 
      item.id !== this.itemId &&
      item.codigoInep.trim() === normalizedCodigo &&
      item.descricao.trim().toLowerCase() === normalizedDescricao
    );

    if (isDuplicate) {
      this.form.controls.codigoInep.setErrors({ duplicado: true });
      this.form.controls.descricao.setErrors({ duplicado: true });
      this.form.controls.codigoInep.markAsTouched();
      this.form.controls.descricao.markAsTouched();
      return;
    }

    // Bloqueia novos acionamentos com estado de processamento
    this.isSaving.set(true);

    setTimeout(() => {
      try {
        if (this.itemId) {
          this.service.update(
            this.itemId, 
            codigoInep.trim(), 
            descricao.trim(), 
            detalhamento.trim(), 
            cargosIds, 
            atreladaGestao, 
            ativo
          );
          this.toastService.success('Registro atualizado com sucesso.');
        } else {
          this.service.add(
            codigoInep.trim(), 
            descricao.trim(), 
            detalhamento.trim(), 
            cargosIds, 
            atreladaGestao, 
            ativo
          );
          this.toastService.success('Registro cadastrado com sucesso.');
        }
        this.goBack(true);
      } finally {
        this.isSaving.set(false);
      }
    }, 400);
  }
}

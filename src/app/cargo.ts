import {Component, inject, signal, computed, ChangeDetectionStrategy, Injectable} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
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
import {MatCardModule} from '@angular/material/card';
import {CommonModule} from '@angular/common';
import {SEmptyStateComponent} from '@siage/siage-ui';

import {ConfirmacaoDialog, ResultadoDialog, VinculoUsoItem, VINCULOS_USO_MUITOS, ModalService} from './dialog';
import {ToastService} from './toast';
import {codigoSeadValidator, normalizarCodigoSead} from './sead-validators';
import {SimulatorService} from './simulator';
import {AcessoRestritoComponent} from './acesso-restrito';
import {PermissionService} from './permission';
import {FormCancelHandler} from './form-cancel-handler';
import {SiagePaginatorComponent} from './siage-paginator';

/**
 * Interface do modelo Cargo no SIAGE-RH V2.
 * Mapeamento visual em relação ao V1:
 * - codigo: Código SEAD (mantido)
 * - nome: internamente antigo campo Nome -> visualmente apresentado como "Descrição"
 * - descricao: internamente antigo campo Descrição -> visualmente apresentado como "Detalhamento do cargo"
 */
export interface CargoItem {
  id: string;
  codigo: string;
  nome: string;          // Descrição
  descricao?: string;     // Detalhamento do cargo
  ativo: boolean;
  emUsoOriginal: boolean;
  exibindoEmUsoIndicator: boolean;
  vinculos?: VinculoUsoItem[];
}

@Injectable({
  providedIn: 'root'
})
export class CargoService {
  readonly defaultVinculos: VinculoUsoItem[] = [
    { schema: 'rh', tabela: 'profissional_matricula' },
    { schema: 'rh', tabela: 'profissional_cargo' },
    { schema: 'quadro', tabela: 'lotacao_profissional' }
  ];

  readonly items = signal<CargoItem[]>([
    { 
      id: '1', 
      codigo: '10001', 
      nome: 'Professor de Educação Básica', 
      descricao: 'Docência na educação básica, planejamento pedagógico, execução curricular e avaliação de aprendizagem.', 
      ativo: true, 
      emUsoOriginal: true, 
      exibindoEmUsoIndicator: false, 
      vinculos: [
        { schema: 'rh', tabela: 'profissional_matricula' },
        { schema: 'rh', tabela: 'profissional_cargo' },
        { schema: 'quadro', tabela: 'lotacao_profissional' }
      ] 
    },
    { 
      id: '2', 
      codigo: '10002', 
      nome: 'Analista de Gestão Governamental', 
      descricao: 'Planejamento, organização, coordenação, supervisão e execução de atividades especializadas de gestão pública.', 
      ativo: true, 
      emUsoOriginal: true, 
      exibindoEmUsoIndicator: false, 
      vinculos: VINCULOS_USO_MUITOS 
    },
    { 
      id: '3', 
      codigo: '10003', 
      nome: 'Técnico Administrativo', 
      descricao: 'Execução de serviços e rotinas de apoio técnico-administrativo e operacional às diversas unidades do Estado.', 
      ativo: true, 
      emUsoOriginal: false, 
      exibindoEmUsoIndicator: false 
    },
    { 
      id: '4', 
      codigo: '10004', 
      nome: 'Auditor Fiscal da Receita Estadual', 
      descricao: 'Fiscalização tributária, lavratura de autos de infração e gestão dos créditos tributários estaduais.', 
      ativo: true, 
      emUsoOriginal: false, 
      exibindoEmUsoIndicator: false 
    },
    { 
      id: '5', 
      codigo: '10005', 
      nome: 'Especialista em Políticas Públicas', 
      descricao: 'Formulação, implementação, acompanhamento e avaliação de projetos e programas estratégicos setoriais.', 
      ativo: false, 
      emUsoOriginal: false, 
      exibindoEmUsoIndicator: false 
    },
    { 
      id: '6', 
      codigo: '10006', 
      nome: 'Médico do Trabalho', 
      descricao: 'Realização de perícias médicas admissionais, periódicas e pareceres técnicos de saúde ocupacional.', 
      ativo: true, 
      emUsoOriginal: false, 
      exibindoEmUsoIndicator: false 
    },
    { 
      id: '10', 
      codigo: '20001', 
      nome: 'PROFESSOR APOIO', 
      descricao: 'Atividades de suporte pedagógico e acompanhamento a estudantes com necessidades educacionais especiais.', 
      ativo: true, 
      emUsoOriginal: true, 
      exibindoEmUsoIndicator: false 
    },
    { 
      id: '11', 
      codigo: '20002', 
      nome: 'PROFESS AUX ARTE INDUSTRIAIS', 
      descricao: 'Auxílio docente e instrução técnica nas oficinas práticas de artes industriais.', 
      ativo: true, 
      emUsoOriginal: false, 
      exibindoEmUsoIndicator: false 
    },
    { 
      id: '12', 
      codigo: '20003', 
      nome: 'PROFESSOR DE DANCA MODERNA', 
      descricao: 'Instrução artística e corporal em expressão e dança moderna nos cursos especializados.', 
      ativo: true, 
      emUsoOriginal: false, 
      exibindoEmUsoIndicator: false 
    },
    { 
      id: '13', 
      codigo: '20004', 
      nome: 'PROFESSOR DE EDUCACAO BASICA 2', 
      descricao: 'Docência nos anos finais do ensino fundamental e planejamento pedagógico.', 
      ativo: true, 
      emUsoOriginal: true, 
      exibindoEmUsoIndicator: false 
    },
    { 
      id: '14', 
      codigo: '20005', 
      nome: 'PROFESSOR AUX.ENSIN PRIMARIO', 
      descricao: 'Apoio pedagógico às classes dos anos iniciais do ensino fundamental.', 
      ativo: true, 
      emUsoOriginal: false, 
      exibindoEmUsoIndicator: false 
    },
    { 
      id: '15', 
      codigo: '20006', 
      nome: 'PROFESSOR', 
      descricao: 'Atividades regulares de ensino, orientação de aprendizagem e avaliação escolar.', 
      ativo: true, 
      emUsoOriginal: true, 
      exibindoEmUsoIndicator: false 
    },
    { 
      id: '16', 
      codigo: '20007', 
      nome: 'PROFESSOR DE ENSIN PRIMARIO', 
      descricao: 'Regência de classe nos anos iniciais do ensino fundamental.', 
      ativo: true, 
      emUsoOriginal: false, 
      exibindoEmUsoIndicator: false 
    },
    { 
      id: '17', 
      codigo: '20008', 
      nome: 'PROFESSOR DE EDUCACAO BASICA 1', 
      descricao: 'Docência na educação infantil e anos iniciais do ensino fundamental.', 
      ativo: true, 
      emUsoOriginal: true, 
      exibindoEmUsoIndicator: false 
    },
    { 
      id: '18', 
      codigo: '20009', 
      nome: 'PROFESSOR DE ENSINO MEDIO', 
      descricao: 'Docência especializada nas disciplinas e itinerários formativos do ensino médio.', 
      ativo: true, 
      emUsoOriginal: true, 
      exibindoEmUsoIndicator: false 
    },
    { 
      id: '19', 
      codigo: '20010', 
      nome: 'PROFESSOR AUX. ENSINO MEDIO', 
      descricao: 'Apoio docente e laboratorial nas turmas de ensino médio e técnico.', 
      ativo: true, 
      emUsoOriginal: false, 
      exibindoEmUsoIndicator: false 
    },
    { 
      id: '20', 
      codigo: '20011', 
      nome: 'PROFESSOR DE MUSICA', 
      descricao: 'Ensino de teoria musical, canto coral e prática instrumental escolar.', 
      ativo: true, 
      emUsoOriginal: false, 
      exibindoEmUsoIndicator: false 
    },
    { 
      id: '21', 
      codigo: '20012', 
      nome: 'PROFESSOR DE EDUCACAO BASICA 3', 
      descricao: 'Docência e pesquisa aplicada à educação básica estadual.', 
      ativo: true, 
      emUsoOriginal: false, 
      exibindoEmUsoIndicator: false 
    },
    { 
      id: '22', 
      codigo: '20013', 
      nome: 'PROFESSOR ORIENTADOR', 
      descricao: 'Orientação educacional, acompanhamento psicopedagógico e mediação escolar.', 
      ativo: true, 
      emUsoOriginal: true, 
      exibindoEmUsoIndicator: false 
    },
    { 
      id: '23', 
      codigo: '20014', 
      nome: 'PROFESSOR ESPECIALISTA EM ATENDIMENTO EDUCACIONAL ESPECIALIZADO, LINGUAGEM BRASILEIRA DE SINAIS (LIBRAS) E BRAILLE', 
      descricao: 'Atendimento educacional especializado nas salas de recursos multifuncionais da rede estadual.', 
      ativo: true, 
      emUsoOriginal: true, 
      exibindoEmUsoIndicator: false 
    }
  ]);

  getItem(id: string): CargoItem | undefined {
    return this.items().find(item => item.id === id);
  }

  add(codigo: string, nome: string, descricao: string, ativo: boolean) {
    const newId = String(Math.max(...this.items().map(i => Number(i.id)), 0) + 1);
    const newItem: CargoItem = {
      id: newId,
      codigo,
      nome,
      descricao: descricao || undefined,
      ativo,
      emUsoOriginal: false,
      exibindoEmUsoIndicator: false
    };
    this.items.update(list => [...list, newItem]);
  }

  update(id: string, codigo: string, nome: string, descricao: string, ativo: boolean) {
    this.items.update(list => list.map(item => {
      if (item.id === id) {
        return { ...item, codigo, nome, descricao: descricao || undefined, ativo };
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
  selector: 'app-cargo-list',
  imports: [
    SEmptyStateComponent,
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
        
        <!-- Breadcrumb: Início / Configurações / SEAD / Cargo -->
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
          <span class="text-siage-primary font-semibold" aria-current="page">Cargo</span>
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
                Cargo
              </h1>
            </div>
            
            <p class="text-xs sm:text-sm text-siage-text-secondary font-sans leading-normal pl-8 sm:pl-9 max-w-2xl">
              Cadastre e mantenha os cargos efetivos e do quadro estadual fornecidos pela SEAD.
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
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-start">
          
          <!-- Filtro Código SEAD -->
          <div class="form-field-group">
            <label for="filter-codigo" class="siage-field-label">Código SEAD</label>
            <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
              <input 
                matInput 
                id="filter-codigo"
                type="text" 
                maxlength="5"
                [formControl]="codigoControl"
                placeholder="Buscar por código" 
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

          <!-- Filtro Descrição (mapeado para antigo campo Nome) -->
          <div class="form-field-group">
            <label for="filter-descricao" class="siage-field-label">Descrição</label>
            <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
              <input 
                matInput 
                id="filter-descricao"
                type="text" 
                maxlength="80"
                [formControl]="descricaoControl"
                placeholder="Buscar por descrição" 
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
                  <div class="h-4 w-16 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                  <div class="h-4 w-48 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
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
          <s-empty-state
            variant="error"
            title="Erro ao carregar dados"
            description="Não foi possível carregar as informações desta funcionalidade. Verifique sua conexão e tente novamente."
            actionLabel="Tentar novamente"
            (action)="carregarDados()"
          />
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
              
              <!-- Coluna Código SEAD: alinhada à direita com fonte mono -->
              <ng-container matColumnDef="codigo">
                <th mat-header-cell *matHeaderCellDef mat-sort-header class="text-right font-sans font-semibold text-xs text-siage-text-secondary py-3.5 pr-6 w-32">
                  Código SEAD
                </th>
                <td mat-cell *matCellDef="let row" class="text-right font-mono font-medium text-siage-text-primary py-3.5 pr-6 text-sm">
                  {{ row.codigo }}
                </td>
              </ng-container>

              <!-- Coluna Descrição (exibe antigo campo Nome) -->
              <ng-container matColumnDef="nome">
                <th mat-header-cell *matHeaderCellDef mat-sort-header class="text-left font-sans font-semibold text-xs text-siage-text-secondary py-3.5 pl-4">
                  Descrição
                </th>
                <td mat-cell *matCellDef="let row" class="text-left font-sans text-siage-text-primary py-3.5 pl-4 text-sm font-medium">
                  {{ row.nome }}
                </td>
              </ng-container>

              <!-- Coluna Situação: centralizada -->
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
                      aria-label="Visualizar cargo"
                      class="w-10 h-10 inline-flex items-center justify-center rounded-lg text-siage-text-secondary hover:text-siage-primary hover:bg-siage-primary/8 dark:hover:bg-siage-primary/12 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                    >
                      <mat-icon style="font-size: 20px; width: 20px; height: 20px;">visibility</mat-icon>
                    </button>
                    
                    <!-- Editar -->
                    <button 
                      type="button"
                      (click)="onEditar(row)" 
                      matTooltip="Editar" 
                      aria-label="Editar cargo"
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
                        aria-label="Ativar ou inativar cargo"
                        class="scale-90"
                      >
                      </mat-slide-toggle>
                    </div>

                    <!-- Excluir -->
                    <button 
                      type="button"
                      (click)="onExcluir(row)" 
                      matTooltip="Excluir" 
                      aria-label="Excluir cargo"
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
export class CargoList {
  private readonly router = inject(Router);
  readonly service = inject(CargoService);
  private readonly dialog = inject(MatDialog);
  private readonly toastService = inject(ToastService);
  readonly simulator = inject(SimulatorService);
  readonly permissionService = inject(PermissionService);

  readonly hasAccess = computed(() => this.permissionService.hasAccess());

  readonly codigoControl = new FormControl('', {nonNullable: true});
  readonly descricaoControl = new FormControl('', {nonNullable: true});
  readonly statusControl = new FormControl('TODOS', {nonNullable: true});
  
  readonly isBuscarEnabled = signal(false);

  readonly appliedCodigo = signal('');
  readonly appliedDescricao = signal('');
  readonly appliedStatus = signal('TODOS');

  readonly isLoading = signal(false);
  readonly hasError = signal(false);

  readonly hasFiltrosAplicados = computed(() => {
    return !!this.appliedCodigo().trim() || !!this.appliedDescricao().trim() || this.appliedStatus() !== 'TODOS';
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

  readonly displayedColumns = ['codigo', 'nome', 'situacao', 'emUso', 'acoes'];
  readonly sortState = signal<Sort>({ active: 'codigo', direction: 'asc' });
  
  readonly paginatorPageIndex = signal(0);
  readonly paginatorPageSize = signal(10);

  constructor() {
    this.service.resetIndicators();
    this.codigoControl.valueChanges.subscribe(() => this.updateBuscarStatus());
    this.descricaoControl.valueChanges.subscribe(() => this.updateBuscarStatus());
    this.statusControl.valueChanges.subscribe(() => this.updateBuscarStatus());
  }

  onFilterCodigoInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    value = value.replace(/\D/g, '');
    if (value.length > 5) {
      value = value.substring(0, 5);
    }
    input.value = value;
    this.codigoControl.setValue(value, { emitEvent: true });
  }

  carregarDados() {
    if (!this.permissionService.hasAccess()) {
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
    const hasValue = !!this.codigoControl.value.trim() || 
                     !!this.descricaoControl.value.trim() || 
                     this.statusControl.value !== 'TODOS';
    this.isBuscarEnabled.set(hasValue);
  }

  onBuscar() {
    this.appliedCodigo.set(this.codigoControl.value.trim());
    this.appliedDescricao.set(this.descricaoControl.value.trim());
    this.appliedStatus.set(this.statusControl.value);
    this.paginatorPageIndex.set(0);
  }

  onLimpar() {
    this.codigoControl.setValue('');
    this.descricaoControl.setValue('');
    this.statusControl.setValue('TODOS');
    this.appliedCodigo.set('');
    this.appliedDescricao.set('');
    this.appliedStatus.set('TODOS');
    this.paginatorPageIndex.set(0);
    this.updateBuscarStatus();
    if (this.simulator.currentScenario() === 'no_filter_results') {
      this.simulator.reset();
    }
  }

  readonly filteredItems = computed(() => {
    const codeFilter = this.appliedCodigo().trim();
    const descFilter = this.appliedDescricao().toLowerCase();
    const statusFilter = this.appliedStatus();
    
    return this.service.items().filter(item => {
      const matchesCode = !codeFilter || 
        normalizarCodigoSead(item.codigo).includes(normalizarCodigoSead(codeFilter));
      const matchesDesc = !descFilter || item.nome.toLowerCase().includes(descFilter);
      let matchesStatus = true;
      if (statusFilter === 'ATIVO') {
        matchesStatus = item.ativo === true;
      } else if (statusFilter === 'INATIVO') {
        matchesStatus = item.ativo === false;
      }
      return matchesCode && matchesDesc && matchesStatus;
    });
  });

  readonly sortedItems = computed(() => {
    const list = [...this.filteredItems()];
    const sort = this.sortState();
    if (!sort.direction) return list;
    
    return list.sort((a, b) => {
      let comparison = 0;
      if (sort.active === 'codigo') {
        comparison = Number(a.codigo) - Number(b.codigo);
      } else if (sort.active === 'nome') {
        comparison = a.nome.localeCompare(b.nome, 'pt-BR');
      }
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  });

  readonly paginatedItems = computed(() => {
    const list = this.sortedItems();
    const index = this.paginatorPageIndex();
    const size = this.paginatorPageSize();
    return list.slice(index * size, (index + 1) * size);
  });

  onSortChange(sort: Sort) {
    this.sortState.set(sort);
  }

  onPageChange(event: PageEvent) {
    this.paginatorPageIndex.set(event.pageIndex);
    this.paginatorPageSize.set(event.pageSize);
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
    this.router.navigate(['/configuracoes/sead/cargo/novo']);
  }

  onVisualizar(row: CargoItem) {
    this.router.navigate([`/configuracoes/sead/cargo/${row.id}`]);
  }

  onEditar(row: CargoItem) {
    this.router.navigate([`/configuracoes/sead/cargo/${row.id}/editar`]);
  }

  onToggleStatus(row: CargoItem) {
    const isAtivo = row.ativo;
    const dialogRef = this.dialog.open(ConfirmacaoDialog, {
      disableClose: true,
      data: {
        title: isAtivo ? 'Inativar registro?' : 'Ativar registro?',
        message: `Tem certeza que deseja ${isAtivo ? 'inativar' : 'ativar'} o cargo ${row.codigo} - ${row.nome}?`,
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

  onExcluir(row: CargoItem) {
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
          message: `Tem certeza que deseja excluir o cargo ${row.codigo} - ${row.nome}? Esta ação não poderá ser desfeita.`,
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

  onVerDetalhesEmUso(row: CargoItem) {
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
  selector: 'app-cargo-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatTooltipModule,
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
        
        <!-- Breadcrumbs: Início / Configurações / SEAD / Cargo / [Cadastrar | Visualizar | Editar] -->
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
            Cargo
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
            
            <!-- Código SEAD -->
            <div class="flex flex-col gap-1.5">
              <span class="text-xs font-semibold tracking-wider uppercase text-siage-text-secondary">Código SEAD</span>
              <span class="text-base font-mono font-bold text-siage-text-primary">{{ currentItem()?.codigo }}</span>
            </div>

            <!-- Descrição (mapeada do campo nome) -->
            <div class="flex flex-col gap-1.5 md:col-span-2">
              <span class="text-xs font-semibold tracking-wider uppercase text-siage-text-secondary">Descrição</span>
              <span class="text-base font-semibold text-siage-text-primary">{{ currentItem()?.nome }}</span>
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

            <!-- Detalhamento do cargo (mapeado do campo descricao) -->
            <div class="flex flex-col gap-1.5 md:col-span-2 lg:col-span-4">
              <span class="text-xs font-semibold tracking-wider uppercase text-siage-text-secondary">Detalhamento do cargo</span>
              <span class="text-base font-medium text-siage-text-primary">{{ currentItem()?.descricao || 'Não informado' }}</span>
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
              
              <!-- Código SEAD: obrigatório, numérico inteiro, máximo 5 caracteres -->
              <div class="col-span-1 md:col-span-2 form-field-group">
                <label for="form-codigo" class="siage-field-label">
                  <span>Código SEAD</span>
                  <span class="text-red-500 font-bold">*</span>
                  <mat-icon 
                    class="text-siage-text-secondary hover:text-siage-primary cursor-pointer text-sm w-4 h-4 flex items-center justify-center scale-90"
                    matTooltip="Este código deve ser fornecido pela SEAD (máximo 5 caracteres)."
                    matTooltipPosition="above"
                  >info</mat-icon>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="form-codigo"
                    type="text" 
                    maxlength="5"
                    formControlName="codigo"
                    placeholder="Digite o código SEAD" 
                    class="font-mono font-medium text-sm"
                    (input)="onCodigoInput($event)"
                  />
                  @if (form.get('codigo')?.hasError('required') && form.get('codigo')?.touched) {
                    <mat-error>Código é obrigatório.</mat-error>
                  } @else if (form.get('codigo')?.hasError('duplicado') && form.get('codigo')?.touched) {
                    <mat-error>Já existe um registro com o código SEAD informado.</mat-error>
                  } @else if (form.get('codigo')?.hasError('codigoSead') && form.get('codigo')?.touched) {
                    <mat-error>Código inválido. Informe de 1 a 5 números.</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Descrição: obrigatório, máximo 80 caracteres (corresponde internamente ao campo nome) -->
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
                    maxlength="80"
                    formControlName="nome"
                    placeholder="Digite a descrição do cargo" 
                    (blur)="onNomeBlur()"
                    class="text-sm"
                  />
                  <mat-hint align="end" class="text-xs text-siage-text-secondary/70">
                    {{ (form.get('nome')?.value || '').length }} de 80
                  </mat-hint>
                  @if (form.get('nome')?.hasError('required') && form.get('nome')?.touched) {
                    <mat-error>Descrição é obrigatória.</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Detalhamento do cargo: opcional, máximo 200 caracteres (corresponde internamente ao campo descricao) -->
              <div class="col-span-1 md:col-span-6 form-field-group">
                <label for="form-detalhamento" class="siage-field-label">
                  <span>Detalhamento do cargo</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <textarea 
                    matInput 
                    id="form-detalhamento"
                    rows="3"
                    maxlength="200"
                    formControlName="descricao"
                    placeholder="Descreva as atribuições ou detalhamento deste cargo"
                    (blur)="onDescricaoBlur()"
                    class="text-sm"
                  ></textarea>
                  <mat-hint align="end" class="text-xs text-siage-text-secondary/70">
                    {{ (form.get('descricao')?.value || '').length }} de 200
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
export class CargoForm {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(CargoService);
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

  readonly form = new FormGroup({
    codigo: new FormControl('', {
      nonNullable: true, 
      validators: [
        Validators.required, 
        codigoSeadValidator(5)
      ]
    }),
    nome: new FormControl('', {
      nonNullable: true, 
      validators: [Validators.required]
    }),
    descricao: new FormControl('', {nonNullable: true}),
    ativo: new FormControl(true, {nonNullable: true})
  });

  itemId: string | null = null;
  readonly isViewMode = signal(false);
  readonly isEditMode = signal(false);
  readonly currentItem = signal<CargoItem | undefined>(undefined);

  breadcrumbModeText = computed(() => {
    if (this.itemId && this.isViewMode()) return 'Visualizar';
    if (this.itemId && this.isEditMode()) return 'Editar';
    return 'Cadastrar';
  });

  titleText = computed(() => {
    if (this.itemId && this.isViewMode()) return 'Visualizar Cargo';
    if (this.itemId && this.isEditMode()) return 'Editar Cargo';
    return 'Adicionar Cargo';
  });

  descriptionText = computed(() => {
    if (this.itemId && this.isViewMode()) return 'Consulte os dados do cargo.';
    if (this.itemId && this.isEditMode()) return 'Altere os dados do cargo.';
    return 'Cadastre um novo cargo.';
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
          codigo: item.codigo,
          nome: item.nome,
          descricao: item.descricao || '',
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

  onCodigoInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    value = value.replace(/\D/g, '');
    if (value.length > 5) {
      value = value.substring(0, 5);
    }
    input.value = value;
    if (this.form.controls.codigo.hasError('duplicado')) {
      this.form.controls.codigo.setErrors(null);
    }
    this.form.controls.codigo.setValue(value, { emitEvent: true });
  }

  onNomeBlur() {
    const ctrl = this.form.controls.nome;
    const normalized = ctrl.value.trim().replace(/\s+/g, ' ');
    ctrl.setValue(normalized, { emitEvent: false });
  }

  onDescricaoBlur() {
    const ctrl = this.form.controls.descricao;
    const normalized = ctrl.value.trim().replace(/\s+/g, ' ');
    ctrl.setValue(normalized, { emitEvent: false });
  }

  goBack(force = false) {
    if (!force && !this.isViewMode() && this.cancelHandler?.hasUnsavedChanges()) {
      this.cancelHandler.handleCancel();
      return;
    }
    this.router.navigate(['/configuracoes/sead/cargo']);
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
      this.router.navigate([`/configuracoes/sead/cargo/${this.itemId}/editar`]);
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

    const {codigo, nome, descricao, ativo} = this.form.getRawValue();

    const normalizedInput = normalizarCodigoSead(codigo);
    const isDuplicate = this.service.items().some(item => 
      normalizarCodigoSead(item.codigo) === normalizedInput && item.id !== this.itemId
    );

    if (isDuplicate) {
      this.form.controls.codigo.setErrors({ duplicado: true });
      this.form.controls.codigo.markAsTouched();
      return;
    }

    // Bloqueia novos acionamentos com estado de processamento
    this.isSaving.set(true);

    setTimeout(() => {
      try {
        if (this.itemId) {
          this.service.update(this.itemId, codigo.trim(), nome.trim(), descricao.trim(), ativo);
          this.toastService.success('Registro atualizado com sucesso.');
        } else {
          this.service.add(codigo.trim(), nome.trim(), descricao.trim(), ativo);
          this.toastService.success('Registro cadastrado com sucesso.');
        }
        this.goBack(true);
      } finally {
        this.isSaving.set(false);
      }
    }, 400);
  }
}

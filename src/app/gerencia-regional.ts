import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  Injectable,
  OnInit
} from '@angular/core';
import {Router, ActivatedRoute, CanDeactivateFn} from '@angular/router';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';

import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatTableModule} from '@angular/material/table';
import {MatDialogModule, MatDialog} from '@angular/material/dialog';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSelectModule} from '@angular/material/select';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatAutocompleteModule} from '@angular/material/autocomplete';

import {SiageDatePickerComponent} from './siage-date-picker';
import {SiagePaginatorComponent} from './siage-paginator';
import {ConfirmacaoDialog, ModalService} from './dialog';
import {ToastService} from './toast';
import {PermissionService} from './permission';
import {AcessoRestritoComponent} from './acesso-restrito';
import {SimulatorService} from './simulator';
import {
  DocumentoAnexo,
  AtoGovernamental,
  HistoricoAtoItem,
  ChefeImediatoItem,
  NormativaItem,
  SecretariaGeralService,
  VisualizarDocumentoModal,
  HistoricoAtosModal,
  BuscaServidorModal,
  ImpedimentoInativacaoModal,
  AnexarNormativaExtincaoModal,
  validarDataFormato,
  normalizarDataParaBr,
  formatarDataParaExibicao,
  parseDataBrParaTimestamp,
  UtbItem,
  ServidorUtbItem
} from './secretaria-geral';
import {
  SecretariaExecutivaService
} from './secretaria-executiva';

// ==========================================
// INTERFACES E MODELOS DE GERÊNCIA REGIONAL
// ==========================================

export interface SubordinadaRegionalItem {
  id: string;
  nome: string;
  chefiaImediata: string;
  utb: string;
  tipo?: 'Núcleo' | 'Escola';
}

export interface GerenciaRegionalItem {
  id: string;
  nome: string;
  secretariaGeralId: string;
  secretariaGeralNome: string;
  utbCodigo: string;
  utbNome: string;
  criadorEditor: string;
  dataCriacao: string;
  dataAtualizacao?: string;
  status: 'ATIVO' | 'INATIVO';
  chefeImediato?: ChefeImediatoItem;
  normativaCriacao: NormativaItem;
  normativaExtincao?: NormativaItem;
  subordinadas: SubordinadaRegionalItem[];
  totalProfissionaisVinculados?: number;
  historicoAtos?: HistoricoAtoItem[];
}

// ==========================================
// SERVIÇO PRINCIPAL — GERÊNCIA REGIONAL
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class GerenciaRegionalService {
  private readonly secExecService = inject(SecretariaExecutivaService);
  private readonly secGeralService = inject(SecretariaGeralService);

  // Lista padrão de Gerências Regionais vinculadas à Secretaria Geral
  private readonly defaultGerenciasRegionais: GerenciaRegionalItem[] = [
    {
      id: 'gr-1',
      nome: 'Gerência Regional de João Pessoa - 1ª Região',
      secretariaGeralId: '1',
      secretariaGeralNome: 'Secretaria Geral de Governo e Articulação Institucional',
      utbCodigo: 'UTB-011',
      utbNome: 'UTB-011 - Gerência Regional de João Pessoa (1ª Região)',
      criadorEditor: 'Mikael Oliveira',
      dataCriacao: '15/01/2024 08:30',
      dataAtualizacao: '10/04/2024 11:20',
      status: 'ATIVO',
      chefeImediato: {
        matricula: '211',
        cpf: '123.456.789-01',
        nome: 'Dr. Roberto Sales Bezerra',
        cargo: 'Gerente Regional de Ensino',
        situacaoFuncional: 'Em exercício',
        atoGovernamental: {
          numero: 'Ato nº 3.010/2024',
          dataPublicacao: '15/01/2024',
          documento: {
            id: 'doc-ato-gr-1',
            nomeArquivo: 'ato_3010_2024_nomeacao_gr_jp.pdf',
            tamanho: '1.9 MB',
            tipo: 'pdf',
            dataUpload: '15/01/2024 09:00'
          }
        }
      },
      normativaCriacao: {
        nome: 'Decreto Estadual nº 42.180/2023 - Criação da 1ª Gerência Regional',
        numero: '42.180',
        dataPublicacao: '05/01/2023',
        documento: {
          id: 'doc-norm-cria-gr-1',
          nomeArquivo: 'decreto_42180_2023_gr1.pdf',
          tamanho: '3.2 MB',
          tipo: 'pdf',
          dataUpload: '05/01/2023 10:30'
        }
      },
      normativaExtincao: undefined,
      subordinadas: [
        {
          id: 'esc-1',
          tipo: 'Escola',
          nome: 'Escola Estadual Olivina Olívia Carneiro da Cunha',
          chefiaImediata: 'Profª Maria Clara Dantas',
          utb: 'UTB-011/ESC-01 - EEEFM Olivina Olívia'
        },
        {
          id: 'nuc-1',
          tipo: 'Núcleo',
          nome: 'Núcleo Regional de Inspeção Escolar e Acompanhamento Pedagógico',
          chefiaImediata: 'Carlos Alberto Mendonça',
          utb: 'UTB-011/NUC-01 - Núcleo de Inspeção'
        },
        {
          id: 'esc-2',
          tipo: 'Escola',
          nome: 'Escola Cidadã Integral Técnica Pastor Roberto Barbosa',
          chefiaImediata: 'Prof. Antônio Marcos Vieira',
          utb: 'UTB-011/ESC-02 - ECIT Roberto Barbosa'
        }
      ],
      totalProfissionaisVinculados: 48,
      historicoAtos: []
    },
    {
      id: 'gr-2',
      nome: 'Gerência Regional de Campina Grande - 3ª Região',
      secretariaGeralId: '1',
      secretariaGeralNome: 'Secretaria Geral de Governo e Articulação Institucional',
      utbCodigo: 'UTB-013',
      utbNome: 'UTB-013 - Gerência Regional de Campina Grande (3ª Região)',
      criadorEditor: 'Mikael Oliveira',
      dataCriacao: '18/01/2024 10:00',
      dataAtualizacao: '15/05/2024 16:45',
      status: 'ATIVO',
      chefeImediato: {
        matricula: '213',
        cpf: '345.678.901-23',
        nome: 'Dr. Valter Medeiros Albuquerque',
        cargo: 'Gerente Regional',
        situacaoFuncional: 'Em exercício',
        atoGovernamental: {
          numero: 'Ato nº 3.025/2024',
          dataPublicacao: '18/01/2024',
          documento: {
            id: 'doc-ato-gr-2',
            nomeArquivo: 'ato_3025_2024_nomeacao_gr_cg.pdf',
            tamanho: '2.1 MB',
            tipo: 'pdf',
            dataUpload: '18/01/2024 10:30'
          }
        }
      },
      normativaCriacao: {
        nome: 'Decreto Estadual nº 42.185/2023 - Criação da 3ª Gerência Regional',
        numero: '42.185',
        dataPublicacao: '08/01/2023',
        documento: {
          id: 'doc-norm-cria-gr-2',
          nomeArquivo: 'decreto_42185_2023_gr3.pdf',
          tamanho: '3.5 MB',
          tipo: 'pdf',
          dataUpload: '08/01/2023 11:00'
        }
      },
      normativaExtincao: undefined,
      subordinadas: [
        {
          id: 'esc-3',
          tipo: 'Escola',
          nome: 'Escola Estadual da Prata (EEEFM Elpídio de Almeida)',
          chefiaImediata: 'Profª Sandra Regina Ramos',
          utb: 'UTB-013/ESC-01 - EEEFM da Prata'
        },
        {
          id: 'nuc-2',
          tipo: 'Núcleo',
          nome: 'Núcleo de Apoio Administrativo e Logístico Regional',
          chefiaImediata: 'Helder Bezerra Farias',
          utb: 'UTB-013/NUC-01 - Núcleo Logístico Regional'
        }
      ],
      totalProfissionaisVinculados: 35,
      historicoAtos: []
    },
    {
      id: 'gr-3',
      nome: 'Gerência Regional de Guarabira - 2ª Região',
      secretariaGeralId: '1',
      secretariaGeralNome: 'Secretaria Geral de Governo e Articulação Institucional',
      utbCodigo: 'UTB-012',
      utbNome: 'UTB-012 - Gerência Regional de Guarabira (2ª Região)',
      criadorEditor: 'Mikael Oliveira',
      dataCriacao: '20/02/2024 09:15',
      dataAtualizacao: undefined,
      status: 'ATIVO',
      chefeImediato: undefined,
      normativaCriacao: {
        nome: 'Decreto Estadual nº 42.195/2023 - Estrutura da 2ª Gerência Regional',
        numero: '42.195',
        dataPublicacao: '15/01/2023',
        documento: {
          id: 'doc-norm-cria-gr-3',
          nomeArquivo: 'decreto_42195_2023_gr2.pdf',
          tamanho: '2.7 MB',
          tipo: 'pdf',
          dataUpload: '15/01/2023 14:00'
        }
      },
      normativaExtincao: undefined,
      subordinadas: [],
      totalProfissionaisVinculados: 0,
      historicoAtos: []
    },
    {
      id: 'gr-4',
      nome: 'Gerência Regional de Cuité - 4ª Região (Extinta)',
      secretariaGeralId: '1',
      secretariaGeralNome: 'Secretaria Geral de Governo e Articulação Institucional',
      utbCodigo: 'UTB-014',
      utbNome: 'UTB-014 - Gerência Regional do Curimataú e Seridó (4ª Região)',
      criadorEditor: 'Mikael Oliveira',
      dataCriacao: '10/02/2022 10:00',
      dataAtualizacao: '28/12/2023 15:00',
      status: 'INATIVO',
      chefeImediato: undefined,
      normativaCriacao: {
        nome: 'Lei Estadual nº 11.480/2022 - Criação da 4ª Gerência Regional',
        numero: '11.480',
        dataPublicacao: '11/02/2022',
        documento: {
          id: 'doc-norm-cria-gr-4',
          nomeArquivo: 'lei_11480_2022_gr4.pdf',
          tamanho: '2.8 MB',
          tipo: 'pdf',
          dataUpload: '11/02/2022 11:30'
        }
      },
      normativaExtincao: {
        nome: 'Lei Complementar nº 189/2023 - Extinção da 4ª Gerência Regional',
        numero: '189',
        dataPublicacao: '28/12/2023',
        documento: {
          id: 'doc-norm-ext-gr-4',
          nomeArquivo: 'lei_compl_189_2023_extincao_gr4.pdf',
          tamanho: '1.9 MB',
          tipo: 'pdf',
          dataUpload: '28/12/2023 15:30'
        }
      },
      subordinadas: [],
      totalProfissionaisVinculados: 0,
      historicoAtos: []
    }
  ];

  // Lista reativa de Gerências Regionais
  readonly items = signal<GerenciaRegionalItem[]>(JSON.parse(JSON.stringify(this.defaultGerenciasRegionais)));

  getItem(id: string): GerenciaRegionalItem | undefined {
    return this.items().find(i => i.id === id);
  }

  isNomeDuplicado(nome: string, ignoreId?: string): boolean {
    const nomeLimpo = nome.trim().toLowerCase();
    return this.items().some(i => i.nome.trim().toLowerCase() === nomeLimpo && i.id !== ignoreId);
  }

  isUtbEmUso(codigoUtb: string, ignoreId?: string): boolean {
    // Não pode estar em uso por outra Gerência Regional ativa
    const emUsoGerReg = this.items().some(i => i.utbCodigo === codigoUtb && i.status === 'ATIVO' && i.id !== ignoreId);
    if (emUsoGerReg) return true;
    // Não pode estar em uso por Secretaria Executiva ativa
    const emUsoSecExec = this.secExecService.items().some(i => i.utbCodigo === codigoUtb && i.status === 'ATIVO');
    if (emUsoSecExec) return true;
    // Não pode estar em uso por Secretaria Geral ativa
    const emUsoSecGeral = this.secGeralService.items().some(i => i.utbCodigo === codigoUtb && i.status === 'ATIVO');
    return emUsoSecGeral;
  }

  add(data: Omit<GerenciaRegionalItem, 'id' | 'criadorEditor' | 'dataCriacao'>): GerenciaRegionalItem {
    const numericIds = this.items().map(i => {
      const match = i.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const maxId = Math.max(...numericIds, 0);
    const newId = `gr-${maxId + 1}`;
    const now = new Date();
    const dataCriacao = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});

    const newItem: GerenciaRegionalItem = {
      id: newId,
      ...data,
      criadorEditor: 'Mikael Oliveira',
      dataCriacao,
      historicoAtos: []
    };

    this.items.update(list => [newItem, ...list]);
    return newItem;
  }

  update(id: string, data: Partial<GerenciaRegionalItem>) {
    const now = new Date();
    const dataAtualizacao = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});

    let updatedItem: GerenciaRegionalItem | undefined;

    this.items.update(list => list.map(item => {
      if (item.id === id) {
        const novoHistorico = item.historicoAtos ? [...item.historicoAtos] : [];
        if (
          item.chefeImediato && 
          item.chefeImediato.atoGovernamental?.documento &&
          (!data.chefeImediato || data.chefeImediato.matricula !== item.chefeImediato.matricula || data.chefeImediato.atoGovernamental.numero !== item.chefeImediato.atoGovernamental.numero)
        ) {
          const anterior = item.chefeImediato;
          if (anterior.atoGovernamental.documento) {
            novoHistorico.unshift({
              id: `hist-${id}-${Date.now()}`,
              numero: anterior.atoGovernamental.numero,
              chefeImediato: anterior.nome,
              dataPublicacao: anterior.atoGovernamental.dataPublicacao,
              dataImportacao: anterior.atoGovernamental.documento.dataUpload,
              responsavelImportacao: 'Mikael Oliveira',
              documento: anterior.atoGovernamental.documento
            });
          }
        }

        updatedItem = {
          ...item,
          ...data,
          historicoAtos: novoHistorico,
          criadorEditor: 'Mikael Oliveira',
          dataAtualizacao
        };
        return updatedItem;
      }
      return item;
    }));
  }

  inativar(id: string, normativaExtincao?: NormativaItem) {
    const now = new Date();
    const dataAtualizacao = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});

    this.items.update(list => list.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'INATIVO',
          normativaExtincao: normativaExtincao || item.normativaExtincao,
          criadorEditor: 'Mikael Oliveira',
          dataAtualizacao
        };
      }
      return item;
    }));
  }

  getHistoricoAtos(gerRegId?: string, atoAtual?: AtoGovernamental, nomeChefeAtual?: string): HistoricoAtoItem[] {
    const list: HistoricoAtoItem[] = [];

    // Inclui ato vigente se fornecido e completo
    if (atoAtual && atoAtual.numero && atoAtual.documento) {
      list.push({
        id: `hist-ger-atual-${gerRegId || 'new'}`,
        numero: atoAtual.numero,
        chefeImediato: nomeChefeAtual || 'Chefe Imediato Vigente',
        dataPublicacao: atoAtual.dataPublicacao || '15/01/2024',
        dataImportacao: atoAtual.documento.dataUpload || '15/01/2024 09:00',
        responsavelImportacao: 'Mikael Oliveira',
        documento: atoAtual.documento
      });
    }

    if (gerRegId) {
      const item = this.getItem(gerRegId);
      if (item?.historicoAtos && item.historicoAtos.length > 0) {
        list.push(...item.historicoAtos);
      }
    }

    return list;
  }
}

// ==========================================
// TELA 1: LISTAR GERÊNCIA REGIONAL
// ==========================================

@Component({
  selector: 'app-gerencia-regional-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatTooltipModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatAutocompleteModule,
    SiagePaginatorComponent,
    AcessoRestritoComponent
  ],
  template: `
    @if (!permissionService.hasAccess()) {
      <app-acesso-restrito backUrl="/configuracoes/hierarquia" />
    } @else {
      <div class="flex flex-col gap-6 max-w-7xl mx-auto w-full font-sans pb-12">
        <!-- Breadcrumb e Cabeçalho Principal -->
        <div class="flex flex-col gap-2">
          <!-- Breadcrumb -->
          <nav aria-label="Breadcrumb" class="flex items-center gap-1.5 text-xs text-siage-text-secondary">
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
            <span class="text-siage-primary font-semibold" aria-current="page">Configurar Gerência Regional</span>
          </nav>

          <!-- Título com Botão Voltar, Descrição e Botão Adicionar -->
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
                  Configurar Gerência Regional
                </h1>
              </div>

              <p class="text-xs sm:text-sm text-siage-text-secondary font-sans leading-normal pl-8 sm:pl-9 max-w-2xl">
                Gerencie as Gerências Regionais vinculadas às Secretarias Executivas, a vinculação de chefia e suas normativas.
              </p>
            </div>

            <!-- Botão Adicionar -->
            <div class="shrink-0 pl-8 sm:pl-0">
              <button 
                type="button" 
                (click)="onAdicionar()"
                [disabled]="!permissionService.canCreate()"
                [matTooltip]="!permissionService.canCreate() ? 'Você não possui permissão para cadastrar Gerência Regional' : 'Adicionar nova Gerência Regional'"
                class="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40 disabled:hover:bg-siage-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">add</mat-icon>
                <span>Adicionar</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Card de Filtros -->
        <div class="bg-siage-surface border border-siage-border rounded-lg p-5 shadow-xs flex flex-col gap-4">
          <form [formGroup]="filtroForm" (ngSubmit)="canBuscar() && onBuscar()" class="flex flex-col gap-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              
              <!-- Filtro: Nome (máximo de 200 caracteres) -->
              <div class="form-field-group">
                <label for="filter-nome" class="siage-field-label">Nome</label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="filter-nome"
                    type="text" 
                    formControlName="nome" 
                    maxlength="200"
                    placeholder="Buscar por nome" 
                    (keydown.enter)="$event.preventDefault(); canBuscar() && onBuscar()"
                    class="text-sm"
                  />
                  @if (filtroNomeVal()) {
                    <button mat-icon-button matSuffix type="button" (click)="limparFiltroNome()" aria-label="Limpar campo">
                      <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                    </button>
                  }
                </mat-form-field>
              </div>

              <!-- Filtro: Unidade de Trabalho (UTB) (Select com autocomplete contendo somente UTBs de Gerências Regionais cadastradas) -->
              <div class="form-field-group">
                <label for="filter-utb" class="siage-field-label">Unidade de Trabalho (UTB)</label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="filter-utb"
                    type="text" 
                    formControlName="utb" 
                    placeholder="Selecione ou busque uma unidade de trabalho" 
                    [matAutocomplete]="autoUtb"
                    #autoUtbTrigger="matAutocompleteTrigger"
                    (focus)="autoUtbTrigger.openPanel()"
                    (keydown.enter)="$event.preventDefault(); canBuscar() && onBuscar()"
                    class="text-sm"
                  />
                  <mat-autocomplete #autoUtb="matAutocomplete">
                    @for (utb of filteredUtbsList(); track utb.codigo) {
                      <mat-option [value]="utb.codigo + ' - ' + utb.nome">
                        {{ utb.codigo }} - {{ utb.nome }}
                      </mat-option>
                    }
                  </mat-autocomplete>
                  @if (filtroUtbVal()) {
                    <button mat-icon-button matSuffix type="button" (click)="limparFiltroUtb()" aria-label="Limpar campo">
                      <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                    </button>
                  } @else {
                    <button mat-icon-button matSuffix type="button" (click)="autoUtbTrigger.openPanel()" aria-label="Abrir opções">
                      <mat-icon class="text-siage-text-secondary">arrow_drop_down</mat-icon>
                    </button>
                  }
                </mat-form-field>
              </div>

              <!-- Filtro: Status (Todos, Ativo, Inativo) -->
              <div class="form-field-group">
                <label for="filter-status" class="siage-field-label">Status</label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <mat-select formControlName="status" id="filter-status" class="text-sm">
                    <mat-option value="TODOS">Todos</mat-option>
                    <mat-option value="ATIVO">Ativo</mat-option>
                    <mat-option value="INATIVO">Inativo</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>

            <!-- Botões Buscar e Limpar -->
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-siage-border/40">
              <button 
                type="button" 
                (click)="onLimpar()"
                class="h-10 px-5 rounded-lg border border-siage-border font-sans font-medium text-sm text-siage-text-primary hover:bg-siage-primary/5 hover:border-siage-primary/30 active:scale-[0.99] transition-all cursor-pointer"
              >
                Limpar
              </button>
              
              <button 
                type="submit" 
                [disabled]="!canBuscar()"
                [matTooltip]="!canBuscar() ? 'Informe o Nome ou a Unidade de Trabalho (UTB) para realizar a busca' : 'Executar busca'"
                class="inline-flex items-center justify-center gap-1.5 h-10 px-6 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-siage-primary"
              >
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">search</mat-icon>
                <span>Buscar</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Tabela de Listagem / Estados -->
        <div class="border border-siage-border rounded-lg overflow-hidden bg-siage-surface shadow-xs">
          @if (isCarregando()) {
            <div class="p-4 sm:p-6 space-y-4">
              <div class="h-6 w-48 bg-slate-200 dark:bg-slate-700/50 rounded animate-pulse"></div>
              <div class="space-y-3">
                @for (i of [1, 2, 3]; track i) {
                  <div class="h-14 bg-slate-100 dark:bg-slate-800/40 rounded-lg animate-pulse flex items-center justify-between px-4">
                    <div class="h-4 w-52 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                    <div class="h-4 w-44 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                    <div class="h-4 w-28 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                    <div class="h-4 w-24 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                    <div class="h-6 w-16 bg-slate-200 dark:bg-slate-700/60 rounded-full"></div>
                    <div class="h-8 w-24 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                  </div>
                }
              </div>
            </div>
          } @else if (isErro()) {
            <div class="py-14 px-6 flex flex-col items-center justify-center text-center gap-3">
              <div class="w-12 h-12 rounded-lg bg-[var(--destructive)]/10 text-[var(--destructive)] flex items-center justify-center">
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
                (click)="simulatorService.setScenario('normal')" 
                class="mt-2 inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs cursor-pointer"
              >
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">refresh</mat-icon>
                <span>Tentar novamente</span>
              </button>
            </div>
          } @else if (isSemRegistros()) {
            <div class="py-16 px-6 flex flex-col items-center justify-center text-center gap-3">
              <div class="w-12 h-12 rounded-lg bg-siage-text-secondary/10 text-siage-text-secondary flex items-center justify-center">
                <mat-icon style="font-size: 24px; width: 24px; height: 24px;">inbox</mat-icon>
              </div>
              <div class="flex flex-col gap-1 max-w-md">
                <h3 class="text-base font-poppins font-semibold text-siage-text-primary">Nenhum registro cadastrado</h3>
                <p class="text-xs sm:text-sm text-siage-text-secondary">Ainda não existem gerências regionais cadastradas.</p>
              </div>
            </div>
          } @else if (isSemResultadoFiltro()) {
            <div class="py-16 px-6 flex flex-col items-center justify-center text-center gap-3">
              <div class="w-12 h-12 rounded-lg bg-siage-text-secondary/10 text-siage-text-secondary flex items-center justify-center">
                <mat-icon style="font-size: 24px; width: 24px; height: 24px;">search_off</mat-icon>
              </div>
              <div class="flex flex-col gap-1 max-w-md">
                <h3 class="text-base font-poppins font-semibold text-siage-text-primary">Nenhum resultado encontrado</h3>
                <p class="text-xs sm:text-sm text-siage-text-secondary">Nenhum registro corresponde aos filtros aplicados.</p>
              </div>
            </div>
          } @else {
            <div class="overflow-x-auto w-full">
              <table class="w-full text-left font-sans border-collapse">
                <thead>
                  <tr class="bg-black/[0.02] dark:bg-white/[0.02] border-b border-siage-border select-none">
                    <th scope="col" class="text-left font-sans font-semibold text-xs text-siage-text-secondary py-3.5 pl-4 pr-3 min-w-[240px]">
                      <button 
                        type="button" 
                        (click)="toggleSort('nome')"
                        class="inline-flex items-center gap-1.5 text-siage-text-secondary hover:text-siage-text-primary transition-colors cursor-pointer group focus-visible:outline-none focus-visible:underline"
                        [attr.aria-label]="'Ordenar por Nome da Gerência Regional ' + (sortColumn() === 'nome' ? (sortDirection() === 'asc' ? 'decrescente' : 'crescente') : 'crescente')"
                      >
                        <span class="transition-colors" [class.text-siage-text-primary]="sortColumn() === 'nome'" [class.text-siage-text-secondary]="sortColumn() !== 'nome'">Nome da Gerência Regional</span>
                        <mat-icon 
                          class="transition-colors"
                          [class.text-siage-text-primary]="sortColumn() === 'nome'"
                          [class.text-siage-text-secondary/40]="sortColumn() !== 'nome'"
                          [class.group-hover:text-siage-text-primary]="sortColumn() !== 'nome'"
                          style="font-size: 16px; width: 16px; height: 16px;"
                        >
                          @if (sortColumn() === 'nome') {
                            {{ sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                          } @else {
                            unfold_more
                          }
                        </mat-icon>
                      </button>
                    </th>

                    <th scope="col" class="text-left font-sans font-semibold text-xs text-siage-text-secondary py-3.5 px-3 min-w-[200px]">
                      <button 
                        type="button" 
                        (click)="toggleSort('utb')"
                        class="inline-flex items-center gap-1.5 text-siage-text-secondary hover:text-siage-text-primary transition-colors cursor-pointer group focus-visible:outline-none focus-visible:underline"
                        [attr.aria-label]="'Ordenar por Unidade de Trabalho ' + (sortColumn() === 'utb' ? (sortDirection() === 'asc' ? 'decrescente' : 'crescente') : 'crescente')"
                      >
                        <span class="transition-colors" [class.text-siage-text-primary]="sortColumn() === 'utb'" [class.text-siage-text-secondary]="sortColumn() !== 'utb'">Unidade de Trabalho (UTB)</span>
                        <mat-icon 
                          class="transition-colors"
                          [class.text-siage-text-primary]="sortColumn() === 'utb'"
                          [class.text-siage-text-secondary/40]="sortColumn() !== 'utb'"
                          [class.group-hover:text-siage-text-primary]="sortColumn() !== 'utb'"
                          style="font-size: 16px; width: 16px; height: 16px;"
                        >
                          @if (sortColumn() === 'utb') {
                            {{ sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                          } @else {
                            unfold_more
                          }
                        </mat-icon>
                      </button>
                    </th>

                    <th scope="col" class="text-left font-sans font-semibold text-xs text-siage-text-secondary py-3.5 px-3">
                      Criador/Editor
                    </th>

                    <th scope="col" class="text-left font-sans font-semibold text-xs text-siage-text-secondary py-3.5 px-3">
                      <button 
                        type="button" 
                        (click)="toggleSort('dataCriacao')"
                        class="inline-flex items-center gap-1.5 text-siage-text-secondary hover:text-siage-text-primary transition-colors cursor-pointer group focus-visible:outline-none focus-visible:underline"
                        [attr.aria-label]="'Ordenar por Data de Criação ' + (sortColumn() === 'dataCriacao' ? (sortDirection() === 'asc' ? 'decrescente' : 'crescente') : 'crescente')"
                      >
                        <span class="transition-colors" [class.text-siage-text-primary]="sortColumn() === 'dataCriacao'" [class.text-siage-text-secondary]="sortColumn() !== 'dataCriacao'">Data de Criação</span>
                        <mat-icon 
                          class="transition-colors"
                          [class.text-siage-text-primary]="sortColumn() === 'dataCriacao'"
                          [class.text-siage-text-secondary/40]="sortColumn() !== 'dataCriacao'"
                          [class.group-hover:text-siage-text-primary]="sortColumn() !== 'dataCriacao'"
                          style="font-size: 16px; width: 16px; height: 16px;"
                        >
                          @if (sortColumn() === 'dataCriacao') {
                            {{ sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                          } @else {
                            unfold_more
                          }
                        </mat-icon>
                      </button>
                    </th>

                    <th scope="col" class="text-center font-sans font-semibold text-xs text-siage-text-secondary py-3.5 px-3 w-28">
                      Status
                    </th>

                    <th scope="col" class="text-center font-sans font-semibold text-xs text-siage-text-secondary py-3.5 px-3 w-44">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-siage-border/40 font-sans">
                  @for (item of paginatedItems(); track item.id) {
                    <tr class="hover:bg-siage-primary/[0.04] dark:hover:bg-siage-primary/[0.06] transition-colors">
                      <td class="text-left py-3.5 pl-4 pr-3 font-medium text-siage-text-primary">
                        <span class="font-sans text-sm font-medium text-siage-text-primary leading-tight">{{ item.nome }}</span>
                      </td>
                      <td class="text-left font-sans text-siage-text-primary py-3.5 px-3 text-sm leading-normal break-words">
                        {{ item.utbNome }}
                      </td>
                      <td class="text-left font-sans text-siage-text-secondary py-3.5 px-3 text-sm">
                        {{ item.criadorEditor }}
                      </td>
                      <td class="text-left font-sans text-siage-text-secondary py-3.5 px-3 text-sm">
                        {{ item.dataCriacao }}
                      </td>
                      <td class="text-center py-3.5 px-3 w-28">
                        <span 
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium transition-colors"
                          [class]="item.status === 'ATIVO' 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-500/20' 
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 border border-slate-300/40 dark:border-slate-700/50'"
                        >
                          {{ item.status === 'ATIVO' ? 'Ativo' : 'Inativo' }}
                        </span>
                      </td>
                      <td class="text-center py-3.5 px-3 w-44">
                        <div class="flex items-center justify-center gap-1 mx-auto">
                          <!-- Visualizar -->
                          <button 
                            type="button" 
                            (click)="onVisualizar(item)" 
                            matTooltip="Visualizar" 
                            aria-label="Visualizar Gerência Regional"
                            class="w-10 h-10 inline-flex items-center justify-center rounded-lg text-siage-text-secondary hover:text-siage-primary hover:bg-siage-primary/8 dark:hover:bg-siage-primary/12 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                          >
                            <mat-icon style="font-size: 20px; width: 20px; height: 20px;">visibility</mat-icon>
                          </button>

                          <!-- Editar (se permitido e se ativo) -->
                          @if (permissionService.canCreate() && item.status === 'ATIVO') {
                            <button 
                              type="button" 
                              (click)="onEditar(item)" 
                              matTooltip="Editar" 
                              aria-label="Editar Gerência Regional"
                              class="w-10 h-10 inline-flex items-center justify-center rounded-lg text-siage-text-secondary hover:text-siage-primary hover:bg-siage-primary/8 dark:hover:bg-siage-primary/12 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                            >
                              <mat-icon style="font-size: 20px; width: 20px; height: 20px;">edit</mat-icon>
                            </button>
                          }

                          <!-- Ativar / Inativar Slide Toggle -->
                          @if (permissionService.canCreate()) {
                            <div class="relative w-10 h-10 inline-flex items-center justify-center">
                              <div class="controlled-sec-toggle flex items-center justify-center select-none" aria-hidden="true">
                                <mat-slide-toggle 
                                  [checked]="item.status === 'ATIVO'" 
                                  tabindex="-1"
                                  aria-hidden="true"
                                  class="scale-90"
                                >
                                </mat-slide-toggle>
                              </div>

                              <button 
                                type="button" 
                                (click)="onToggleStatus(item)"
                                [matTooltip]="item.status === 'ATIVO' ? 'Inativar' : 'Ativar'"
                                [attr.aria-label]="item.status === 'ATIVO' ? 'Inativar Gerência Regional' : 'Ativar Gerência Regional'"
                                class="absolute inset-0 z-20 w-full h-full cursor-pointer bg-transparent border-0 p-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                              >
                              </button>
                            </div>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Paginação Padrão SIAGE (10 itens por página) -->
            <app-siage-paginator 
              [length]="filteredItems().length"
              [pageIndex]="pageIndex()"
              [pageSize]="10"
              (page)="onPageChange($event.pageIndex)"
            />
          }
        </div>
      </div>
    }
  `
})
export class GerenciaRegionalList {
  readonly router = inject(Router);
  readonly service = inject(GerenciaRegionalService);
  readonly secGeralService = inject(SecretariaGeralService);
  readonly permissionService = inject(PermissionService);
  readonly simulatorService = inject(SimulatorService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  readonly filtroForm = new FormGroup({
    nome: new FormControl(''),
    utb: new FormControl(''),
    status: new FormControl('TODOS')
  });

  readonly filtroNomeVal = toSignal(this.filtroForm.controls.nome.valueChanges, { initialValue: '' });
  readonly filtroUtbVal = toSignal(this.filtroForm.controls.utb.valueChanges, { initialValue: '' });
  readonly filtroStatusVal = toSignal(this.filtroForm.controls.status.valueChanges, { initialValue: 'TODOS' });

  // Filtros aplicados
  readonly appliedNome = signal('');
  readonly appliedUtb = signal('');
  readonly appliedStatus = signal('TODOS');

  // Ordenação inicial por Data de Criação decrescente
  readonly sortColumn = signal<'dataCriacao' | 'nome' | 'utb'>('dataCriacao');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');
  readonly pageIndex = signal(0);

  // UTBs únicas associadas exclusivamente às Gerências Regionais cadastradas (ordenadas por código em ordem crescente)
  readonly utbsVinculadas = computed(() => {
    const items = this.service.items();
    const allMasterUtbs = this.secGeralService.utbs();
    const codigos = Array.from(new Set(items.map(i => i.utbCodigo).filter(Boolean)));
    const list: UtbItem[] = [];
    for (const codigo of codigos) {
      const found = allMasterUtbs.find(u => u.codigo === codigo);
      if (found) {
        list.push(found);
      } else {
        const item = items.find(i => i.utbCodigo === codigo);
        list.push({
          codigo,
          nome: item?.utbNome || codigo,
          descricaoCompleta: `${codigo} - ${item?.utbNome || codigo}`
        });
      }
    }
    return list.sort((a, b) => a.codigo.localeCompare(b.codigo));
  });

  readonly filteredUtbsList = computed(() => {
    const list = this.utbsVinculadas();
    const query = (this.filtroUtbVal() || '').trim().toLowerCase();
    if (!query) return list;
    return list.filter(u => 
      u.codigo.toLowerCase().includes(query) || 
      u.nome.toLowerCase().includes(query) ||
      `${u.codigo} - ${u.nome}`.toLowerCase().includes(query)
    );
  });

  // Habilita busca se Nome, UTB ou Status diferente de Todos forem preenchidos
  readonly canBuscar = computed(() => {
    const formNome = (this.filtroNomeVal() || '').trim();
    const formUtb = (this.filtroUtbVal() || '').trim();
    const formStatus = this.filtroStatusVal() || 'TODOS';
    return formNome.length > 0 || formUtb.length > 0 || formStatus !== 'TODOS';
  });

  readonly isCarregando = computed(() => this.simulatorService.currentScenario() === 'loading');
  readonly isErro = computed(() => this.simulatorService.currentScenario() === 'error');
  readonly isSemRegistros = computed(() => this.simulatorService.currentScenario() === 'empty' || this.service.items().length === 0);

  readonly filteredItems = computed(() => {
    let result = [...this.service.items()];
    const nome = this.appliedNome().toLowerCase();
    const utb = this.appliedUtb().toLowerCase();
    const status = this.appliedStatus();

    if (nome) {
      result = result.filter(item => item.nome.toLowerCase().includes(nome));
    }
    if (utb) {
      result = result.filter(item => 
        item.utbCodigo.toLowerCase().includes(utb) || 
        item.utbNome.toLowerCase().includes(utb)
      );
    }
    if (status && status !== 'TODOS') {
      result = result.filter(item => item.status === status);
    }

    // Ordenação
    const col = this.sortColumn();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;

    result.sort((a, b) => {
      if (col === 'nome') {
        return dir * a.nome.localeCompare(b.nome, 'pt-BR');
      }
      if (col === 'utb') {
        return dir * a.utbNome.localeCompare(b.utbNome, 'pt-BR');
      }
      if (col === 'dataCriacao') {
        const tA = parseDataBrParaTimestamp(a.dataCriacao);
        const tB = parseDataBrParaTimestamp(b.dataCriacao);
        return dir * (tA - tB);
      }
      return 0;
    });

    return result;
  });

  readonly paginatedItems = computed(() => {
    const list = this.filteredItems();
    const start = this.pageIndex() * 10;
    return list.slice(start, start + 10);
  });

  readonly isSemResultadoFiltro = computed(() => {
    return !this.isSemRegistros() && this.filteredItems().length === 0;
  });

  onBuscar() {
    this.appliedNome.set((this.filtroForm.get('nome')?.value || '').trim());
    const rawUtb = (this.filtroForm.get('utb')?.value || '').trim();
    const parts = rawUtb.split(' - ');
    this.appliedUtb.set(parts[0] ? parts[0].trim() : rawUtb);
    this.appliedStatus.set(this.filtroForm.get('status')?.value || 'TODOS');
    this.pageIndex.set(0);
  }

  onLimpar() {
    this.filtroForm.setValue({
      nome: '',
      utb: '',
      status: 'TODOS'
    });
    this.appliedNome.set('');
    this.appliedUtb.set('');
    this.appliedStatus.set('TODOS');
    this.pageIndex.set(0);
  }

  limparFiltroNome() {
    this.filtroForm.get('nome')?.setValue('');
  }

  limparFiltroUtb() {
    this.filtroForm.get('utb')?.setValue('');
  }

  toggleSort(column: 'dataCriacao' | 'nome' | 'utb') {
    if (this.sortColumn() === column) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.pageIndex.set(0);
  }

  onPageChange(newIndex: number) {
    this.pageIndex.set(newIndex);
  }

  goHome() {
    this.router.navigate(['/inicio']);
  }

  goConfiguracoes() {
    this.router.navigate(['/configuracoes']);
  }

  goHierarquia() {
    this.router.navigate(['/configuracoes/hierarquia']);
  }

  onAdicionar() {
    this.router.navigate(['/configuracoes/hierarquia/gerencia-regional/novo']);
  }

  onVisualizar(item: GerenciaRegionalItem) {
    this.router.navigate(['/configuracoes/hierarquia/gerencia-regional', item.id]);
  }

  onEditar(item: GerenciaRegionalItem) {
    this.router.navigate(['/configuracoes/hierarquia/gerencia-regional', item.id, 'editar']);
  }

  onToggleStatus(item: GerenciaRegionalItem) {
    if (item.status === 'INATIVO') {
      // Inativação irreversível: proibir reativação e exibir somente toast explicativo sem modal
      this.toast.warning('A inativação de uma Gerência Regional é irreversível. O registro não pode ser reativado.');
      return;
    }

    // 1. Ao tentar inativar, abrir PRIMEIRAMENTE o modal de confirmação "Inativar registro?"
    const dialogRef = this.dialog.open(ConfirmacaoDialog, {
      disableClose: true,
      data: {
        title: 'Inativar registro?',
        message: `Deseja inativar ${item.nome}? A inativação é irreversível e o registro não poderá ser reativado.`,
        cancelLabel: 'Cancelar',
        actionLabel: 'Sim, inativar',
        actionType: 'destructive',
        loadingLabel: 'Verificando...'
      }
    });

    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (!confirmado) {
        return;
      }

      // 2. Após a confirmação, verificar Chefia Imediata, Núcleos e Escolas subordinados e profissionais vinculados
      const temNormativaExtincao = !!item.normativaExtincao?.documento;
      const totalSubordinadas = item.subordinadas?.length || 0;
      const totalProfissionais = item.totalProfissionaisVinculados || 0;
      const temChefe = !!item.chefeImediato;
      const temOutrosImpedimentos = totalSubordinadas > 0 || temChefe || totalProfissionais > 0;

      // 3. Havendo impedimentos, exibir o modal padronizado com os motivos
      if (temOutrosImpedimentos) {
        this.dialog.open(ImpedimentoInativacaoModal, {
          width: '520px',
          maxWidth: 'calc(100vw - 2.5rem)',
          hasBackdrop: true,
          backdropClass: 'cdk-overlay-dark-backdrop',
          autoFocus: false,
          data: {
            nome: item.nome,
            temNormativaExtincao,
            totalSubordinadas,
            temChefe,
            nomeChefe: item.chefeImediato?.nome,
            unidadesDescricao: 'Núcleos e Escolas',
            totalProfissionais
          }
        });
        return;
      }

      // 4. Sem outros impedimentos, exigir Normativa de Extinção.
      if (!temNormativaExtincao) {
        const anexarRef = this.dialog.open(AnexarNormativaExtincaoModal, {
          width: '560px',
          maxWidth: 'calc(100vw - 2.5rem)',
          hasBackdrop: true,
          backdropClass: 'cdk-overlay-dark-backdrop',
          autoFocus: false,
          data: {
            nome: item.nome
          }
        });

        anexarRef.afterClosed().subscribe((normativa: NormativaItem | undefined) => {
          if (normativa) {
            this.service.inativar(item.id, normativa);
            this.toast.success('Registro inativado com sucesso.');
          }
        });
        return;
      }

      // 5. Todos os critérios atendidos: inativação direta
      this.service.inativar(item.id);
      this.toast.success('Registro inativado com sucesso.');
    });
  }
}

// ==========================================
// TELA 2 & 4: ADICIONAR E EDITAR GERÊNCIA REGIONAL
// ==========================================

@Component({
  selector: 'app-gerencia-regional-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatDialogModule,
    SiageDatePickerComponent,
    SiagePaginatorComponent,
    AcessoRestritoComponent
  ],
  template: `
    @if (!permissionService.hasAccess() || (!isEditMode() && !permissionService.canCreate())) {
      <app-acesso-restrito backUrl="/configuracoes/hierarquia/gerencia-regional" />
    } @else {
      <div class="flex flex-col gap-6 max-w-7xl mx-auto w-full font-sans pb-16">
        <!-- Breadcrumb e Cabeçalho Principal -->
        <div class="flex flex-col gap-2">
          <nav class="flex items-center gap-2 text-xs text-siage-text-secondary" aria-label="Navegação estrutural">
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
            <span 
              (click)="onCancelar()" 
              (keydown.enter)="onCancelar()" 
              tabindex="0" 
              role="button" 
              class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline"
            >
              Configurar Gerência Regional
            </span>
            <span class="text-[10px] text-siage-text-secondary/40 select-none" aria-hidden="true">/</span>
            <span class="text-siage-primary font-semibold" aria-current="page">{{ isEditMode() ? 'Editar' : 'Cadastrar' }}</span>
          </nav>

          <!-- Título com Botão Voltar -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2 sm:gap-3">
                <button 
                  mat-icon-button 
                  type="button"
                  (click)="onCancelar()" 
                  class="text-siage-text-secondary hover:text-siage-primary transition-colors cursor-pointer -ml-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                  title="Voltar para a listagem"
                  aria-label="Voltar para a listagem"
                >
                  <mat-icon style="font-size: 22px; width: 22px; height: 22px;">arrow_back</mat-icon>
                </button>
                <h1 class="text-2xl sm:text-3xl font-poppins font-bold tracking-tight text-siage-text-primary leading-tight">
                  {{ isEditMode() ? 'Editar Gerência Regional' : 'Adicionar Gerência Regional' }}
                </h1>
              </div>

              <p class="text-xs sm:text-sm text-siage-text-secondary font-sans leading-normal pl-8 sm:pl-9 max-w-2xl">
                {{ isEditMode() ? 'Atualize as informações, chefia e normativas da Gerência Regional.' : 'Preencha os campos obrigatórios para estruturar a Gerência Regional.' }}
              </p>
            </div>
          </div>
        </div>

        <!-- FORMULÁRIO ORGANIZADO EM SEÇÕES -->
        <form [formGroup]="form" class="flex flex-col gap-6">

          <!-- ============================================== -->
          <!-- SEÇÃO 1: IDENTIFICAÇÃO DA GERÊNCIA REGIONAL    -->
          <!-- ============================================== -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">domain</mat-icon>
              <span>1. Identificação</span>
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              <!-- Nome da Gerência Regional -->
              <div class="md:col-span-2 form-field-group">
                <label for="form-nome" class="siage-field-label">
                  Nome da Gerência Regional <span class="required-marker">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="form-nome"
                    formControlName="nome" 
                    maxlength="200"
                    placeholder="Ex: Gerência Regional de João Pessoa - 1ª Região"
                  >
                  <mat-hint align="end" class="text-xs text-siage-text-secondary">
                    {{ (form.get('nome')?.value || '').length }} / 200
                  </mat-hint>
                  @if (form.get('nome')?.hasError('required') && form.get('nome')?.touched) {
                    <mat-error>O Nome da Gerência Regional é obrigatório.</mat-error>
                  }
                  @if (form.get('nome')?.hasError('duplicado')) {
                    <mat-error>Já existe uma Gerência Regional cadastrada com este nome.</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Campo Obrigatório: Secretaria Geral Vinculada -->
              <div class="form-field-group">
                <label for="form-sec-geral" class="siage-field-label">
                  Secretaria Geral <span class="required-marker">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="form-sec-geral"
                    type="text" 
                    [formControl]="secGeralInputControl" 
                    placeholder="Selecione ou busque a Secretaria Geral vinculada" 
                    [matAutocomplete]="autoSecGeral"
                    #autoSecGeralTrigger="matAutocompleteTrigger"
                    (focus)="autoSecGeralTrigger.openPanel()"
                    class="text-sm"
                  />
                  <mat-autocomplete #autoSecGeral="matAutocomplete" (optionSelected)="onSecGeralSelected($event.option.value)">
                    @for (sec of filteredSecsGerais(); track sec.id) {
                      <mat-option [value]="sec.id">
                        {{ sec.nome }}
                      </mat-option>
                    }
                  </mat-autocomplete>
                  @if (secGeralInputControl.value) {
                    <button mat-icon-button matSuffix type="button" (click)="limparSecGeral()" aria-label="Limpar campo">
                      <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                    </button>
                  } @else {
                    <button mat-icon-button matSuffix type="button" (click)="autoSecGeralTrigger.openPanel()" aria-label="Abrir opções">
                      <mat-icon class="text-siage-text-secondary">arrow_drop_down</mat-icon>
                    </button>
                  }
                  @if ((form.get('secretariaGeralId')?.hasError('required') || secGeralInputControl.hasError('required')) && (form.get('secretariaGeralId')?.touched || secGeralInputControl.touched)) {
                    <mat-error>A Secretaria Geral é obrigatória.</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Unidade de Trabalho (UTB) -->
              <div class="form-field-group">
                <label for="form-utb" class="siage-field-label">
                  Unidade de Trabalho (UTB) <span class="required-marker">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="form-utb"
                    type="text" 
                    [formControl]="utbInputControl" 
                    placeholder="Selecione ou busque uma unidade de trabalho" 
                    [matAutocomplete]="autoUtbForm"
                    #autoUtbFormTrigger="matAutocompleteTrigger"
                    (focus)="!isUtbBloqueada() && autoUtbFormTrigger.openPanel()"
                    (blur)="onUtbBlur()"
                    class="text-sm"
                  />
                  <mat-autocomplete #autoUtbForm="matAutocomplete" (optionSelected)="onUtbSelected($event.option.value)">
                    @for (utb of filteredUtbs(); track utb.codigo) {
                      <mat-option [value]="utb.codigo">
                        {{ utb.codigo }} - {{ utb.nome }}
                      </mat-option>
                    }
                  </mat-autocomplete>
                  @if (utbInputControl.value && !isUtbBloqueada()) {
                    <button mat-icon-button matSuffix type="button" (click)="limparUtb()" aria-label="Limpar campo">
                      <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                    </button>
                  } @else {
                    <button mat-icon-button matSuffix type="button" (click)="!isUtbBloqueada() && autoUtbFormTrigger.openPanel()" [disabled]="isUtbBloqueada()" aria-label="Abrir opções">
                      <mat-icon class="text-siage-text-secondary">arrow_drop_down</mat-icon>
                    </button>
                  }
                  @if (isUtbBloqueada()) {
                    <mat-hint class="text-xs text-siage-text-secondary">
                      <span class="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                        <mat-icon style="font-size: 14px; width: 14px; height: 14px;">lock</mat-icon>
                        A Unidade de Trabalho (UTB) não pode ser alterada porque existem chefia ou núcleos e escolas vinculados.
                      </span>
                    </mat-hint>
                  }
                  @if ((form.get('utbCodigo')?.hasError('required') || utbInputControl.hasError('required')) && (form.get('utbCodigo')?.touched || utbInputControl.touched)) {
                    <mat-error>A Unidade de Trabalho (UTB) é obrigatória.</mat-error>
                  }
                  @if (utbInputControl.hasError('emUso')) {
                    <mat-error>A Unidade de Trabalho (UTB) selecionada já está vinculada a outra unidade ativa.</mat-error>
                  }
                </mat-form-field>
              </div>
            </div>
          </div>

          <!-- ============================================== -->
          <!-- SEÇÃO 2: CHEFIA IMEDIATA E ATO GOVERNAMENTAL   -->
          <!-- ============================================== -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div class="flex items-center justify-between border-b border-siage-border/40 pb-2 flex-wrap gap-2">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">badge</mat-icon>
                <span>2. Chefia Imediata e Ato Governamental</span>
              </h3>

              <!-- Ação de Adicionar Chefe (quando ainda não houver chefe) -->
              @if (!chefeImediato()) {
                <button 
                  type="button" 
                  (click)="abrirBuscaChefe()"
                  [disabled]="!form.get('utbCodigo')?.value"
                  [matTooltip]="!form.get('utbCodigo')?.value ? 'Selecione uma Unidade de Trabalho (UTB) primeiro' : 'Buscar servidor vinculado à UTB'"
                  class="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;">person_add</mat-icon>
                  <span>Adicionar Chefe</span>
                </button>
              }
            </div>

            <!-- Bloco do Chefe Vinculado -->
            @if (chefeImediato(); as chefe) {
              <div class="bg-slate-50/70 dark:bg-slate-900/40 border border-siage-border/60 rounded-lg p-4 flex flex-col gap-4">
                <div class="flex items-start justify-between gap-3 flex-wrap">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-siage-primary/10 text-siage-primary flex items-center justify-center font-bold font-poppins text-sm">
                      {{ chefe.nome.substring(0, 2).toUpperCase() }}
                    </div>
                    <div>
                      <span class="text-xs uppercase text-siage-text-secondary font-semibold block">Chefe Imediato Selecionado</span>
                      <span class="text-sm font-medium text-siage-text-primary">{{ chefe.nome }}</span>
                    </div>
                  </div>

                  <!-- Ação sobre o chefe: Remover Chefe -->
                  <div class="flex items-center gap-2">
                    <button 
                      type="button" 
                      (click)="removerChefe()"
                      class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 text-xs font-medium text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                    >
                      <mat-icon style="font-size: 14px; width: 14px; height: 14px;">close</mat-icon>
                      <span>Remover Chefe</span>
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2 border-t border-siage-border/40">
                  <div class="flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Matrícula</span>
                    <span class="text-sm font-mono font-medium text-siage-text-primary">{{ chefe.matricula }}</span>
                  </div>
                  <div class="flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">CPF</span>
                    <span class="text-sm font-mono font-medium text-siage-text-primary">{{ chefe.cpf }}</span>
                  </div>
                  <div class="flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Cargo</span>
                    <span class="text-sm font-medium text-siage-text-primary truncate block">{{ chefe.cargo }}</span>
                  </div>
                  <div class="flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Situação Funcional</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ chefe.situacaoFuncional }}</span>
                  </div>
                </div>

                <!-- SUB-BLOCO INTEGRADO: ATO GOVERNAMENTAL -->
                <div class="mt-2 pt-4 border-t border-siage-border/40 flex flex-col gap-4">
                  <div class="flex items-center justify-between gap-2 flex-wrap">
                    <div class="flex items-center gap-2">
                      <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-siage-primary">description</mat-icon>
                      <span class="text-xs font-poppins font-bold uppercase tracking-wider text-siage-primary">
                        Ato Governamental de Nomeação *
                      </span>
                    </div>

                    @if (isEditMode()) {
                      <button 
                        type="button" 
                        (click)="abrirHistoricoAtos()"
                        class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-siage-border bg-siage-surface hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium text-siage-text-primary transition-colors cursor-pointer"
                        title="Consultar histórico de atos governamentais"
                      >
                        <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-siage-text-secondary">history</mat-icon>
                        <span>Consultar histórico</span>
                      </button>
                    }
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <!-- Número do Ato (limitado a 20 caracteres) -->
                    <div class="form-field-group">
                      <label for="form-ato-numero" class="siage-field-label">
                        Número do Ato Governamental <span class="required-marker">*</span>
                      </label>
                      <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                        <input 
                          matInput 
                          id="form-ato-numero"
                          [formControl]="atoNumeroControl" 
                          maxlength="20"
                          placeholder="Ex: Ato nº 3.010/2024"
                        >
                        @if (atoNumeroControl.hasError('required') && atoNumeroControl.touched) {
                          <mat-error>O Número do Ato Governamental é obrigatório.</mat-error>
                        } @else if (atoNumeroControl.hasError('maxlength') && atoNumeroControl.touched) {
                          <mat-error>O Número do Ato Governamental deve ter no máximo 20 caracteres.</mat-error>
                        }
                      </mat-form-field>
                    </div>

                    <!-- Data da Publicação -->
                    <div class="form-field-group">
                      <app-siage-date-picker
                        id="form-ato-data"
                        label="Data da Publicação"
                        [required]="true"
                        [formControl]="atoDataControl"
                        [control]="atoDataControl"
                        errorMessage="A Data da Publicação é obrigatória."
                      />
                    </div>
                  </div>

                  <!-- Anexo do Documento do Ato -->
                  <div class="flex flex-col gap-2">
                    <span class="text-xs font-semibold text-siage-text-secondary">
                      Documento do Ato Governamental * (PDF, JPG, JPEG, PNG até 10 MB)
                    </span>

                    @if (atoDocumento(); as doc) {
                      <div class="border border-siage-border rounded-lg overflow-hidden bg-siage-surface">
                        <div class="flex items-center justify-between p-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                          <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded bg-siage-primary/10 text-siage-primary flex items-center justify-center shrink-0">
                              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">description</mat-icon>
                            </div>
                            <div class="flex flex-col">
                              <span class="text-xs sm:text-sm font-medium text-siage-text-primary">{{ doc.nomeArquivo }}</span>
                              <span class="text-[11px] text-siage-text-secondary">{{ doc.tamanho }} • Enviado em {{ doc.dataUpload }}</span>
                            </div>
                          </div>
                          <div class="flex items-center gap-1">
                            <button 
                              type="button" 
                              (click)="visualizarDoc(doc, 'Ato Governamental')" 
                              matTooltip="Visualizar anexo" 
                              class="w-8 h-8 rounded text-siage-text-secondary hover:text-siage-primary flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">visibility</mat-icon>
                            </button>
                            <button 
                              type="button" 
                              (click)="baixarDoc(doc)" 
                              matTooltip="Baixar arquivo" 
                              class="w-8 h-8 rounded text-siage-text-secondary hover:text-siage-primary flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">download</mat-icon>
                            </button>
                            <button 
                              type="button" 
                              (click)="removerDocAto()" 
                              matTooltip="Remover anexo" 
                              class="w-8 h-8 rounded text-siage-text-secondary hover:text-red-600 flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">delete</mat-icon>
                            </button>
                          </div>
                        </div>
                      </div>
                    } @else {
                      <div 
                        id="container-anexo-ato"
                        tabindex="0"
                        class="border-2 border-dashed rounded-lg p-4 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-siage-primary/40"
                        [class.border-red-500]="atoDocInvalido()"
                        [class.bg-red-50/20]="atoDocInvalido()"
                        [class.dark:bg-red-950/20]="atoDocInvalido()"
                        [class.border-siage-border/80]="!atoDocInvalido() && canAnexarAto()"
                        [class.hover:border-siage-primary/60]="!atoDocInvalido() && canAnexarAto()"
                        [class.bg-siage-surface/50]="!atoDocInvalido() && canAnexarAto()"
                        [class.border-slate-200]="!atoDocInvalido() && !canAnexarAto()"
                        [class.dark:border-slate-800]="!atoDocInvalido() && !canAnexarAto()"
                        [class.bg-slate-100/50]="!atoDocInvalido() && !canAnexarAto()"
                        [class.dark:bg-slate-900/20]="!atoDocInvalido() && !canAnexarAto()"
                        [class.opacity-60]="!canAnexarAto()"
                        [class.cursor-not-allowed]="!canAnexarAto()"
                      >
                        <input 
                          type="file" 
                          id="file-ato-gov" 
                          class="hidden" 
                          accept=".pdf,.jpg,.jpeg,.png" 
                          [disabled]="!canAnexarAto()"
                          (change)="onFileAtoSelected($event)"
                        >
                        <label 
                          for="file-ato-gov" 
                          class="flex flex-col items-center justify-center gap-1.5"
                          [class.cursor-pointer]="canAnexarAto()"
                          [class.cursor-not-allowed]="!canAnexarAto()"
                        >
                          <mat-icon [class.text-siage-primary]="canAnexarAto()" [class.text-siage-text-secondary]="!canAnexarAto()" style="font-size: 24px; width: 24px; height: 24px;">cloud_upload</mat-icon>
                          <span class="text-xs font-semibold" [class.text-siage-primary]="canAnexarAto()" [class.text-siage-text-secondary]="!canAnexarAto()">
                            Clique para anexar o documento do Ato Governamental
                          </span>
                          <span class="text-[11px] text-siage-text-secondary">
                            @if (canAnexarAto()) {
                              PDF, JPG, JPEG ou PNG (máx. 10 MB)
                            } @else {
                              Preencha o Número do Ato e a Data da Publicação para habilitar a anexação
                            }
                          </span>
                        </label>
                      </div>
                      @if (atoDocInvalido()) {
                        <span class="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1 mt-1">
                          <mat-icon style="font-size: 14px; width: 14px; height: 14px;">error</mat-icon>
                          É obrigatório anexar o documento do Ato Governamental.
                        </span>
                      }
                    }
                  </div>
                </div>
              </div>
            } @else {
              <!-- Estado vazio quando não houver chefe imediato -->
              <div class="py-6 text-center text-xs text-siage-text-secondary border border-dashed border-siage-border rounded-lg flex flex-col items-center justify-center gap-3">
                <span>Nenhum Chefe Imediato vinculado no momento.</span>
                @if (isEditMode()) {
                  <button 
                    type="button" 
                    (click)="abrirHistoricoAtos()"
                    class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-siage-border bg-siage-surface hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium text-siage-text-primary transition-colors cursor-pointer"
                    title="Consultar histórico de atos governamentais"
                  >
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-siage-text-secondary">history</mat-icon>
                    <span>Consultar histórico</span>
                  </button>
                }
              </div>
            }
          </div>

          <!-- ============================================== -->
          <!-- SEÇÃO 3: GESTÃO DE NORMATIVAS                  -->
          <!-- ============================================== -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-6">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">gavel</mat-icon>
              <span>3. Gestão de Normativas</span>
            </h3>

            <!-- BLOCO 1: NORMATIVA DE CRIAÇÃO -->
            <div class="flex flex-col gap-4">
              <div class="flex items-center gap-2">
                <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-emerald-600">verified</mat-icon>
                <span class="text-xs font-poppins font-bold uppercase tracking-wider text-siage-text-primary">
                  Normativa de Criação *
                </span>
              </div>

              <!-- Se estiver em modo de edição, exibe apenas os dados persistidos bloqueados -->
              @if (isEditMode()) {
                <div class="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-lg border border-siage-border/60">
                  <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Nome da Normativa</span>
                    <span class="text-sm font-medium text-siage-text-primary break-words">{{ currentItem?.normativaCriacao?.nome }}</span>
                  </div>
                  <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Número da Normativa</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ currentItem?.normativaCriacao?.numero }}</span>
                  </div>
                  <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data da Publicação</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ formatarDataParaExibicao(currentItem?.normativaCriacao?.dataPublicacao) }}</span>
                  </div>

                  @if (currentItem?.normativaCriacao?.documento; as doc) {
                    <div class="col-span-12 border border-siage-border rounded-lg overflow-hidden bg-siage-surface mt-2">
                      <div class="flex items-center justify-between p-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded bg-siage-primary/10 text-siage-primary flex items-center justify-center shrink-0">
                            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">description</mat-icon>
                          </div>
                          <div class="flex flex-col">
                            <span class="text-xs sm:text-sm font-medium text-siage-text-primary">{{ doc.nomeArquivo }}</span>
                            <span class="text-[11px] text-siage-text-secondary">{{ doc.tamanho }} • Enviado em {{ doc.dataUpload }}</span>
                          </div>
                        </div>
                        <div class="flex items-center gap-1">
                          <button 
                            type="button" 
                            (click)="visualizarDoc(doc, 'Normativa de Criação')" 
                            matTooltip="Visualizar anexo" 
                            class="w-8 h-8 rounded text-siage-text-secondary hover:text-siage-primary flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">visibility</mat-icon>
                          </button>
                          <button 
                            type="button" 
                            (click)="baixarDoc(doc)" 
                            matTooltip="Baixar arquivo" 
                            class="w-8 h-8 rounded text-siage-text-secondary hover:text-siage-primary flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">download</mat-icon>
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <!-- Formulário de cadastro de Normativa de Criação -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <!-- Nome da Normativa de Criação -->
                  <div class="md:col-span-3 form-field-group">
                    <label for="form-norm-criacao-nome" class="siage-field-label">
                      Nome da Normativa de Criação <span class="required-marker">*</span>
                    </label>
                    <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                      <input 
                        matInput 
                        id="form-norm-criacao-nome"
                        [formControl]="normCriacaoNomeControl" 
                        maxlength="100"
                        placeholder="Ex: Decreto Estadual nº 42.180/2023 - Criação da 1ª Gerência Regional"
                      >
                      <mat-hint align="end" class="text-xs text-siage-text-secondary">
                        {{ (normCriacaoNomeControl.value || '').length }} / 100
                      </mat-hint>
                      @if (normCriacaoNomeControl.hasError('required') && normCriacaoNomeControl.touched) {
                        <mat-error>O Nome da Normativa de Criação é obrigatório.</mat-error>
                      } @else if (normCriacaoNomeControl.hasError('maxlength') && normCriacaoNomeControl.touched) {
                        <mat-error>O Nome da Normativa de Criação deve ter no máximo 100 caracteres.</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <!-- Número da Normativa -->
                  <div class="form-field-group">
                    <label for="form-norm-criacao-numero" class="siage-field-label">
                      Número da Normativa de Criação <span class="required-marker">*</span>
                    </label>
                    <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                      <input 
                        matInput 
                        id="form-norm-criacao-numero"
                        [formControl]="normCriacaoNumeroControl" 
                        maxlength="20"
                        placeholder="Ex: 42.180"
                      >
                      @if (normCriacaoNumeroControl.hasError('required') && normCriacaoNumeroControl.touched) {
                        <mat-error>O Número da Normativa de Criação é obrigatório.</mat-error>
                      } @else if (normCriacaoNumeroControl.hasError('maxlength') && normCriacaoNumeroControl.touched) {
                        <mat-error>O Número da Normativa de Criação deve ter no máximo 20 caracteres.</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <!-- Data da Publicação -->
                  <div class="md:col-span-2 form-field-group">
                    <app-siage-date-picker
                      id="form-norm-criacao-data"
                      label="Data da Publicação"
                      [required]="true"
                      [formControl]="normCriacaoDataControl"
                      [control]="normCriacaoDataControl"
                      errorMessage="A Data da Publicação é obrigatória."
                    />
                  </div>

                  <!-- Anexo do Documento de Criação -->
                  <div class="md:col-span-3 flex flex-col gap-2">
                    <span class="text-xs font-semibold text-siage-text-secondary">
                      Documento Anexo da Normativa de Criação *
                    </span>

                    @if (normCriacaoDoc(); as doc) {
                      <div class="border border-siage-border rounded-lg overflow-hidden bg-siage-surface">
                        <div class="flex items-center justify-between p-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                          <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded bg-siage-primary/10 text-siage-primary flex items-center justify-center shrink-0">
                              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">description</mat-icon>
                            </div>
                            <div class="flex flex-col">
                              <span class="text-xs sm:text-sm font-medium text-siage-text-primary">{{ doc.nomeArquivo }}</span>
                              <span class="text-[11px] text-siage-text-secondary">{{ doc.tamanho }} • Enviado em {{ doc.dataUpload }}</span>
                            </div>
                          </div>
                          <div class="flex items-center gap-1">
                            <button 
                              type="button" 
                              (click)="visualizarDoc(doc, 'Normativa de Criação')" 
                              matTooltip="Visualizar anexo" 
                              class="w-8 h-8 rounded text-siage-text-secondary hover:text-siage-primary flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">visibility</mat-icon>
                            </button>
                            <button 
                              type="button" 
                              (click)="baixarDoc(doc)" 
                              matTooltip="Baixar arquivo" 
                              class="w-8 h-8 rounded text-siage-text-secondary hover:text-siage-primary flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">download</mat-icon>
                            </button>
                            <button 
                              type="button" 
                              (click)="removerDocCriacao()" 
                              matTooltip="Remover anexo" 
                              class="w-8 h-8 rounded text-siage-text-secondary hover:text-red-600 flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">delete</mat-icon>
                            </button>
                          </div>
                        </div>
                      </div>
                    } @else {
                      <div 
                        id="container-anexo-criacao"
                        tabindex="0"
                        class="border-2 border-dashed rounded-lg p-4 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-siage-primary/40"
                        [class.border-red-500]="normCriacaoDocInvalido()"
                        [class.bg-red-50/20]="normCriacaoDocInvalido()"
                        [class.dark:bg-red-950/20]="normCriacaoDocInvalido()"
                        [class.border-siage-border/80]="!normCriacaoDocInvalido() && canAnexarNormCriacao()"
                        [class.hover:border-siage-primary/60]="!normCriacaoDocInvalido() && canAnexarNormCriacao()"
                        [class.bg-siage-surface/50]="!normCriacaoDocInvalido() && canAnexarNormCriacao()"
                        [class.border-slate-200]="!normCriacaoDocInvalido() && !canAnexarNormCriacao()"
                        [class.dark:border-slate-800]="!normCriacaoDocInvalido() && !canAnexarNormCriacao()"
                        [class.bg-slate-100/50]="!normCriacaoDocInvalido() && !canAnexarNormCriacao()"
                        [class.dark:bg-slate-900/20]="!normCriacaoDocInvalido() && !canAnexarNormCriacao()"
                        [class.opacity-60]="!canAnexarNormCriacao()"
                        [class.cursor-not-allowed]="!canAnexarNormCriacao()"
                      >
                        <input 
                          type="file" 
                          id="file-norm-cria" 
                          class="hidden" 
                          accept=".pdf,.jpg,.jpeg,.png" 
                          [disabled]="!canAnexarNormCriacao()"
                          (change)="onFileNormCriacaoSelected($event)"
                        >
                        <label 
                          for="file-norm-cria" 
                          class="flex flex-col items-center justify-center gap-1.5"
                          [class.cursor-pointer]="canAnexarNormCriacao()"
                          [class.cursor-not-allowed]="!canAnexarNormCriacao()"
                        >
                          <mat-icon [class.text-siage-primary]="canAnexarNormCriacao()" [class.text-siage-text-secondary]="!canAnexarNormCriacao()" style="font-size: 24px; width: 24px; height: 24px;">cloud_upload</mat-icon>
                          <span class="text-xs font-semibold" [class.text-siage-primary]="canAnexarNormCriacao()" [class.text-siage-text-secondary]="!canAnexarNormCriacao()">
                            Clique para anexar o documento da Normativa de Criação
                          </span>
                          <span class="text-[11px] text-siage-text-secondary">
                            @if (canAnexarNormCriacao()) {
                              PDF, JPG, JPEG ou PNG (máx. 10 MB)
                            } @else {
                              Preencha o Nome, Número e Data da Publicação para habilitar a anexação
                            }
                          </span>
                        </label>
                      </div>
                      @if (normCriacaoDocInvalido()) {
                        <span class="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1 mt-1">
                          <mat-icon style="font-size: 14px; width: 14px; height: 14px;">error</mat-icon>
                          É obrigatório anexar o documento da Normativa de Criação.
                        </span>
                      }
                    }
                  </div>
                </div>
              }
            </div>

            <!-- BLOCO 2: NORMATIVA DE EXTINÇÃO (OPCIONAL NO CADASTRO, NECESSÁRIA PARA INATIVAÇÃO) -->
            <div class="pt-4 border-t border-siage-border/40 flex flex-col gap-4">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-amber-600">history_edu</mat-icon>
                  <span class="text-xs font-poppins font-bold uppercase tracking-wider text-siage-text-primary">
                    Normativa de Extinção
                  </span>
                  <span class="text-[11px] text-siage-text-secondary italic font-normal">
                    (Necessária para inativação)
                  </span>
                </div>

                <!-- Botão Adicionar Normativa: quando sem normativa cadastrada e formulário não expandido -->
                @if (!temNormativaExtincao() && !expandindoNormativaExtincao()) {
                  <button 
                    type="button" 
                    (click)="abrirAdicaoNormativaExtincao()"
                    class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-siage-border bg-siage-surface hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium text-siage-text-primary transition-colors cursor-pointer"
                  >
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;">add</mat-icon>
                    <span>Adicionar Normativa de Extinção</span>
                  </button>
                }
              </div>

              <!-- Estado 1: Quando já persistida ou confirmada -->
              @if (temNormativaExtincao()) {
                <div class="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-lg border border-siage-border/60">
                  <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Nome da Normativa</span>
                    <span class="text-sm font-medium text-siage-text-primary break-words">{{ normExtincaoNomeControl.value }}</span>
                  </div>
                  <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Número da Normativa</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ normExtincaoNumeroControl.value }}</span>
                  </div>
                  <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data da Publicação</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ formatarDataParaExibicao(normExtincaoDataControl.value) }}</span>
                  </div>

                  @if (normExtincaoDoc(); as doc) {
                    <div class="col-span-12 border border-siage-border rounded-lg overflow-hidden bg-siage-surface mt-2">
                      <div class="flex items-center justify-between p-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded bg-siage-primary/10 text-siage-primary flex items-center justify-center shrink-0">
                            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">description</mat-icon>
                          </div>
                          <div class="flex flex-col">
                            <span class="text-xs sm:text-sm font-medium text-siage-text-primary">{{ doc.nomeArquivo }}</span>
                            <span class="text-[11px] text-siage-text-secondary">{{ doc.tamanho }} • Enviado em {{ doc.dataUpload }}</span>
                          </div>
                        </div>
                        <div class="flex items-center gap-1">
                          <button 
                            type="button" 
                            (click)="visualizarDoc(doc, 'Normativa de Extinção')" 
                            matTooltip="Visualizar anexo" 
                            class="w-8 h-8 rounded text-siage-text-secondary hover:text-siage-primary flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">visibility</mat-icon>
                          </button>
                          <button 
                            type="button" 
                            (click)="baixarDoc(doc)" 
                            matTooltip="Baixar arquivo" 
                            class="w-8 h-8 rounded text-siage-text-secondary hover:text-siage-primary flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">download</mat-icon>
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              } @else if (expandindoNormativaExtincao()) {
                <!-- Estado 2: Formulário Expandido para preenchimento de Normativa de Extinção -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 border border-siage-border rounded-lg p-4 bg-slate-50/30 dark:bg-slate-900/20">
                  <div class="md:col-span-3 form-field-group">
                    <label for="form-norm-ext-nome" class="siage-field-label">
                      Nome da Normativa de Extinção <span class="required-marker">*</span>
                    </label>
                    <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                      <input 
                        matInput 
                        id="form-norm-ext-nome"
                        [formControl]="normExtincaoNomeControl" 
                        maxlength="100"
                        placeholder="Ex: Lei Complementar nº 189/2023 - Extinção da Gerência"
                      >
                      <mat-hint align="end" class="text-xs text-siage-text-secondary">
                        {{ (normExtincaoNomeControl.value || '').length }} / 100
                      </mat-hint>
                      @if (normExtincaoNomeControl.hasError('required') && normExtincaoNomeControl.touched) {
                        <mat-error>O Nome da Normativa de Extinção é obrigatório.</mat-error>
                      } @else if (normExtincaoNomeControl.hasError('maxlength') && normExtincaoNomeControl.touched) {
                        <mat-error>O Nome da Normativa de Extinção deve ter no máximo 100 caracteres.</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="form-field-group">
                    <label for="form-norm-ext-numero" class="siage-field-label">
                      Número da Normativa de Extinção <span class="required-marker">*</span>
                    </label>
                    <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                      <input 
                        matInput 
                        id="form-norm-ext-numero"
                        [formControl]="normExtincaoNumeroControl" 
                        maxlength="20"
                        placeholder="Ex: 189"
                      >
                      @if (normExtincaoNumeroControl.hasError('required') && normExtincaoNumeroControl.touched) {
                        <mat-error>O Número da Normativa de Extinção é obrigatório.</mat-error>
                      } @else if (normExtincaoNumeroControl.hasError('maxlength') && normExtincaoNumeroControl.touched) {
                        <mat-error>O Número da Normativa de Extinção deve ter no máximo 20 caracteres.</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="md:col-span-2 form-field-group">
                    <app-siage-date-picker
                      id="form-norm-ext-data"
                      label="Data da Publicação"
                      [required]="true"
                      [formControl]="normExtincaoDataControl"
                      [control]="normExtincaoDataControl"
                      errorMessage="A Data da Publicação é obrigatória."
                    />
                  </div>

                  <!-- Anexo da Normativa de Extinção -->
                  <div class="md:col-span-3 flex flex-col gap-2">
                    <span class="text-xs font-semibold text-siage-text-secondary">
                      Documento da Normativa de Extinção * (PDF, JPG, JPEG ou PNG até 10 MB)
                    </span>

                    @if (normExtincaoDoc(); as doc) {
                      <div class="border border-siage-border rounded-lg overflow-hidden bg-siage-surface">
                        <div class="flex items-center justify-between p-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                          <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded bg-siage-primary/10 text-siage-primary flex items-center justify-center shrink-0">
                              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">description</mat-icon>
                            </div>
                            <div class="flex flex-col">
                              <span class="text-xs sm:text-sm font-medium text-siage-text-primary">{{ doc.nomeArquivo }}</span>
                              <span class="text-[11px] text-siage-text-secondary">{{ doc.tamanho }} • Enviado em {{ doc.dataUpload }}</span>
                            </div>
                          </div>
                          <div class="flex items-center gap-1">
                            <button 
                              type="button" 
                              (click)="visualizarDoc(doc, 'Normativa de Extinção')" 
                              matTooltip="Visualizar anexo" 
                              class="w-8 h-8 rounded text-siage-text-secondary hover:text-siage-primary flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">visibility</mat-icon>
                            </button>
                            <button 
                              type="button" 
                              (click)="baixarDoc(doc)" 
                              matTooltip="Baixar arquivo" 
                              class="w-8 h-8 rounded text-siage-text-secondary hover:text-siage-primary flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">download</mat-icon>
                            </button>
                            <button 
                              type="button" 
                              (click)="removerDocExtincao()" 
                              matTooltip="Remover anexo" 
                              class="w-8 h-8 rounded text-siage-text-secondary hover:text-red-600 flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">delete</mat-icon>
                            </button>
                          </div>
                        </div>
                      </div>
                    } @else {
                      <div 
                        id="container-anexo-extincao"
                        tabindex="0"
                        class="border-2 border-dashed rounded-lg p-4 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-siage-primary/40"
                        [class.border-red-500]="normExtincaoDocInvalido()"
                        [class.bg-red-50/20]="normExtincaoDocInvalido()"
                        [class.dark:bg-red-950/20]="normExtincaoDocInvalido()"
                        [class.border-siage-border/80]="!normExtincaoDocInvalido() && canAnexarNormExtincao()"
                        [class.hover:border-siage-primary/60]="!normExtincaoDocInvalido() && canAnexarNormExtincao()"
                        [class.bg-siage-surface/50]="!normExtincaoDocInvalido() && canAnexarNormExtincao()"
                        [class.border-slate-200]="!normExtincaoDocInvalido() && !canAnexarNormExtincao()"
                        [class.dark:border-slate-800]="!normExtincaoDocInvalido() && !canAnexarNormExtincao()"
                        [class.bg-slate-100/50]="!normExtincaoDocInvalido() && !canAnexarNormExtincao()"
                        [class.dark:bg-slate-900/20]="!normExtincaoDocInvalido() && !canAnexarNormExtincao()"
                        [class.opacity-60]="!canAnexarNormExtincao()"
                        [class.cursor-not-allowed]="!canAnexarNormExtincao()"
                      >
                        <input 
                          type="file" 
                          id="file-norm-ext" 
                          class="hidden" 
                          accept=".pdf,.jpg,.jpeg,.png" 
                          [disabled]="!canAnexarNormExtincao()"
                          (change)="onFileNormExtincaoSelected($event)"
                        >
                        <label 
                          for="file-norm-ext" 
                          class="flex flex-col items-center justify-center gap-1.5"
                          [class.cursor-pointer]="canAnexarNormExtincao()"
                          [class.cursor-not-allowed]="!canAnexarNormExtincao()"
                        >
                          <mat-icon [class.text-siage-primary]="canAnexarNormExtincao()" [class.text-siage-text-secondary]="!canAnexarNormExtincao()" style="font-size: 24px; width: 24px; height: 24px;">cloud_upload</mat-icon>
                          <span class="text-xs font-semibold" [class.text-siage-primary]="canAnexarNormExtincao()" [class.text-siage-text-secondary]="!canAnexarNormExtincao()">
                            Clique para anexar o documento da Normativa de Extinção
                          </span>
                          <span class="text-[11px] text-siage-text-secondary">
                            @if (canAnexarNormExtincao()) {
                              PDF, JPG, JPEG ou PNG (máx. 10 MB)
                            } @else {
                              Preencha o Nome, Número e Data da Publicação para habilitar a anexação
                            }
                          </span>
                        </label>
                      </div>
                      @if (normExtincaoDocInvalido()) {
                        <span class="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1 mt-1">
                          <mat-icon style="font-size: 14px; width: 14px; height: 14px;">error</mat-icon>
                          É obrigatório anexar o documento da Normativa de Extinção.
                        </span>
                      }
                    }
                  </div>

                  <!-- Botões de Ação do Formulário Expandido -->
                  <div class="md:col-span-3 flex items-center justify-end gap-2 pt-2 border-t border-siage-border/40">
                    <button 
                      type="button" 
                      (click)="cancelarAdicaoNormativaExtincao()"
                      class="h-8 px-3 rounded-lg border border-siage-border bg-siage-surface hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium text-siage-text-primary transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="button" 
                      (click)="confirmarAdicaoNormativaExtincao()"
                      class="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-xs transition-all shadow-xs cursor-pointer"
                    >
                      <mat-icon style="font-size: 16px; width: 16px; height: 16px;">check</mat-icon>
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- ============================================================== -->
          <!-- SEÇÃO 4: NÚCLEOS E ESCOLAS VINCULADOS (MODO EDIÇÃO)            -->
          <!-- ============================================================== -->
          @if (isEditMode()) {
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">account_tree</mat-icon>
                <span>4. Núcleos e Escolas Vinculados</span>
              </h3>

              <!-- Filtros de Subordinadas Vinculadas -->
              <div class="flex flex-col gap-4 pt-1">
                <span class="text-xs font-semibold text-siage-text-secondary">Buscar por:</span>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <!-- Filtro: Nome -->
                  <div class="form-field-group">
                    <label for="filtro-sub-nome" class="siage-field-label">Nome</label>
                    <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                      <input 
                        matInput 
                        id="filtro-sub-nome" 
                        type="text"
                        [formControl]="filtroSubordinadaNome" 
                        maxlength="200"
                        placeholder="Digite o nome"
                        (keydown.enter)="$event.preventDefault(); canBuscarSubordinadas() && onBuscarSubordinadas()"
                        class="text-sm"
                      />
                      @if (filtroSubNomeVal()) {
                        <button mat-icon-button matSuffix type="button" (click)="limparFiltroSubNome()" aria-label="Limpar campo">
                          <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                        </button>
                      }
                    </mat-form-field>
                  </div>

                  <!-- Filtro: Unidade de Trabalho (UTB) -->
                  <div class="form-field-group">
                    <label for="filtro-sub-utb" class="siage-field-label">Unidade de Trabalho (UTB)</label>
                    <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                      <input 
                        matInput 
                        id="filtro-sub-utb" 
                        type="text"
                        [formControl]="filtroSubordinadaUtb" 
                        placeholder="Selecione ou busque uma unidade de trabalho"
                        [matAutocomplete]="autoUtbSub"
                        #autoUtbSubTrigger="matAutocompleteTrigger"
                        (focus)="autoUtbSubTrigger.openPanel()"
                        (keydown.enter)="$event.preventDefault(); canBuscarSubordinadas() && onBuscarSubordinadas()"
                        class="text-sm"
                      />
                      <mat-autocomplete #autoUtbSub="matAutocomplete">
                        @for (utb of filteredSubUtbsList(); track utb) {
                          <mat-option [value]="utb">
                            {{ utb }}
                          </mat-option>
                        }
                      </mat-autocomplete>
                      @if (filtroSubUtbVal()) {
                        <button mat-icon-button matSuffix type="button" (click)="limparFiltroSubUtb()" aria-label="Limpar campo">
                          <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                        </button>
                      } @else {
                        <button mat-icon-button matSuffix type="button" (click)="autoUtbSubTrigger.openPanel()" aria-label="Abrir opções">
                          <mat-icon class="text-siage-text-secondary">arrow_drop_down</mat-icon>
                        </button>
                      }
                    </mat-form-field>
                  </div>
                </div>

                <!-- Botões Buscar e Limpar -->
                <div class="flex items-center justify-end gap-3 pt-3 border-t border-siage-border/40">
                  <button 
                    type="button" 
                    (click)="onLimparSubordinadas()"
                    class="h-10 px-5 rounded-lg border border-siage-border font-sans font-medium text-sm text-siage-text-primary hover:bg-siage-primary/5 hover:border-siage-primary/30 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    Limpar
                  </button>
                  
                  <button 
                    type="button" 
                    (click)="canBuscarSubordinadas() && onBuscarSubordinadas()"
                    [disabled]="!canBuscarSubordinadas()"
                    [matTooltip]="!canBuscarSubordinadas() ? 'Informe o Nome ou a Unidade de Trabalho (UTB) para realizar a busca' : 'Executar busca'"
                    class="inline-flex items-center justify-center gap-1.5 h-10 px-6 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-siage-primary"
                  >
                    <mat-icon style="font-size: 18px; width: 18px; height: 18px;">search</mat-icon>
                    <span>Buscar</span>
                  </button>
                </div>
              </div>

              <!-- Tabela de Subordinadas Vinculadas -->
              <div class="border border-siage-border rounded-lg overflow-hidden bg-siage-surface">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="bg-slate-100/70 dark:bg-slate-800/50 border-b border-siage-border text-siage-text-secondary font-semibold">
                      <th class="p-3">
                        <button 
                          type="button" 
                          (click)="toggleSortSubordinadas()"
                          class="inline-flex items-center gap-1.5 hover:text-siage-primary transition-colors cursor-pointer group"
                        >
                          <span>Tipo / Unidade Vinculada</span>
                          <mat-icon style="font-size: 16px; width: 16px; height: 16px;">
                            {{ sortSubDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                          </mat-icon>
                        </button>
                      </th>
                      <th class="p-3">Chefia Imediata</th>
                      <th class="p-3">Unidade de Trabalho (UTB)</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-siage-border/40">
                    @for (sub of paginatedSubordinadas(); track sub.id) {
                      <tr class="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <td class="p-3 font-medium text-siage-text-primary">
                          <span class="text-[10px] uppercase font-bold text-siage-primary block">{{ sub.tipo }}</span>
                          <span class="text-sm font-medium">{{ sub.nome }}</span>
                        </td>
                        <td class="p-3 text-sm text-siage-text-secondary">{{ sub.chefiaImediata }}</td>
                        <td class="p-3 text-sm text-siage-text-secondary">{{ sub.utb }}</td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="3" class="p-6 text-center text-xs text-siage-text-secondary">
                          Nenhum vínculo foi encontrado.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>

                <app-siage-paginator 
                  [length]="filteredSubordinadas().length"
                  [pageIndex]="subordinadasPageIndex()"
                  [pageSize]="10"
                  (page)="onSubordinadasPageChange($event.pageIndex)"
                />
              </div>
            </div>
          }

          <!-- RODAPÉ DE AÇÕES DO FORMULÁRIO -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-siage-border/40">
            <button 
              type="button" 
              (click)="onCancelar()" 
              class="h-10 px-5 rounded-lg border border-siage-border font-sans font-medium text-sm text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.99] transition-all cursor-pointer"
            >
              Cancelar
            </button>

            <button 
              type="button" 
              (click)="onSalvar()" 
              [disabled]="isSaving()"
              class="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              @if (isSaving()) {
                <span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Salvando...</span>
              } @else {
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">{{ isEditMode() ? 'check' : 'save' }}</mat-icon>
                <span>{{ isEditMode() ? 'Atualizar' : 'Salvar' }}</span>
              }
            </button>
          </div>
        </form>
      </div>
    }
  `
})
export class GerenciaRegionalForm implements OnInit {
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly service = inject(GerenciaRegionalService);
  readonly secGeralService = inject(SecretariaGeralService);
  readonly permissionService = inject(PermissionService);
  private readonly dialog = inject(MatDialog);
  private readonly modalService = inject(ModalService);
  private readonly toastService = inject(ToastService);

  readonly isEditMode = signal(false);
  readonly isSaving = signal(false);
  itemId: string | null = null;
  currentItem: GerenciaRegionalItem | null = null;

  // Unidade de Trabalho e Secretaria Geral
  readonly utbInputControl = new FormControl('', [Validators.required]);
  readonly secGeralInputControl = new FormControl('', [Validators.required]);
  readonly utbInputVal = toSignal(this.utbInputControl.valueChanges, { initialValue: '' });
  readonly secGeralInputVal = toSignal(this.secGeralInputControl.valueChanges, { initialValue: '' });

  readonly form = new FormGroup({
    nome: new FormControl('', [Validators.required, Validators.maxLength(200)]),
    secretariaGeralId: new FormControl('', [Validators.required]),
    utbCodigo: new FormControl('', [Validators.required])
  });

  // Chefia Imediata
  readonly chefeImediato = signal<ChefeImediatoItem | undefined>(undefined);
  readonly atoNumeroControl = new FormControl('', [Validators.maxLength(20)]);
  readonly atoDataControl = new FormControl('');
  readonly atoDocumento = signal<DocumentoAnexo | undefined>(undefined);
  readonly atoDocInvalido = signal(false);
  readonly atoNumeroVal = toSignal(this.atoNumeroControl.valueChanges, { initialValue: '' });
  readonly atoDataVal = toSignal(this.atoDataControl.valueChanges, { initialValue: '' });

  // Normativa de Criação
  readonly normCriacaoNomeControl = new FormControl('', [Validators.maxLength(100)]);
  readonly normCriacaoNumeroControl = new FormControl('', [Validators.maxLength(20)]);
  readonly normCriacaoDataControl = new FormControl('');
  readonly normCriacaoDoc = signal<DocumentoAnexo | undefined>(undefined);
  readonly normCriacaoDocInvalido = signal(false);
  readonly normCriacaoNomeVal = toSignal(this.normCriacaoNomeControl.valueChanges, { initialValue: '' });
  readonly normCriacaoNumeroVal = toSignal(this.normCriacaoNumeroControl.valueChanges, { initialValue: '' });
  readonly normCriacaoDataVal = toSignal(this.normCriacaoDataControl.valueChanges, { initialValue: '' });

  // Normativa de Extinção
  readonly temNormativaExtincao = signal(false);
  readonly hasPersistedNormativaExtincao = signal(false);
  readonly expandindoNormativaExtincao = signal(false);
  readonly normExtincaoNomeControl = new FormControl('', [Validators.maxLength(100)]);
  readonly normExtincaoNumeroControl = new FormControl('', [Validators.maxLength(20)]);
  readonly normExtincaoDataControl = new FormControl('');
  readonly normExtincaoDoc = signal<DocumentoAnexo | undefined>(undefined);
  readonly normExtincaoDocInvalido = signal(false);
  readonly normExtincaoNomeVal = toSignal(this.normExtincaoNomeControl.valueChanges, { initialValue: '' });
  readonly normExtincaoNumeroVal = toSignal(this.normExtincaoNumeroControl.valueChanges, { initialValue: '' });
  readonly normExtincaoDataVal = toSignal(this.normExtincaoDataControl.valueChanges, { initialValue: '' });

  // Subordinadas (Núcleos e Escolas) na edição
  readonly subordinadasOriginais = signal<SubordinadaRegionalItem[]>([]);
  readonly filtroSubordinadaNome = new FormControl('');
  readonly filtroSubordinadaUtb = new FormControl('');
  readonly filtroSubNomeVal = toSignal(this.filtroSubordinadaNome.valueChanges, { initialValue: '' });
  readonly filtroSubUtbVal = toSignal(this.filtroSubordinadaUtb.valueChanges, { initialValue: '' });
  readonly appliedSubordinadaNome = signal('');
  readonly appliedSubordinadaUtb = signal('');
  readonly subordinadasPageIndex = signal(0);
  readonly sortSubDirection = signal<'asc' | 'desc'>('asc');

  // Flags para controle de navegação e descarte
  private initialSnapshotJson = '';
  isSavedSuccessfully = false;
  isDiscarded = false;
  private isHandlingUtbSelection = false;

  readonly formatarDataParaExibicao = formatarDataParaExibicao;

  // Autocomplete de Secretarias Gerais (somente ativas, ordenadas alfabeticamente)
  readonly filteredSecsGerais = computed(() => {
    const list = this.secGeralService.items().filter(s => s.status === 'ATIVO');
    const sorted = [...list].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    const query = (this.secGeralInputVal() || this.secGeralInputControl.value || '').trim().toLowerCase();
    if (!query) return sorted;
    return sorted.filter(s => s.nome.toLowerCase().includes(query));
  });

  // Autocomplete de UTBs do sistema
  readonly filteredUtbs = computed(() => {
    const list = this.secGeralService.utbs();
    const query = (this.utbInputVal() || this.utbInputControl.value || '').trim().toLowerCase();
    if (!query) return list;
    return list.filter(u => 
      u.codigo.toLowerCase().includes(query) || 
      u.nome.toLowerCase().includes(query) ||
      `${u.codigo} - ${u.nome}`.toLowerCase().includes(query)
    );
  });

  // Bloqueio de alteração de UTB: se estiver em edição e possuir chefia imediata ou subordinadas vinculadas
  readonly isUtbBloqueada = computed(() => {
    if (!this.isEditMode()) return false;
    const temChefe = !!this.chefeImediato();
    const temSubordinadas = this.subordinadasOriginais().length > 0;
    return temChefe || temSubordinadas;
  });

  // Habilita anexação do Ato Governamental apenas se Chefe Imediato selecionado e Número e Data válidos
  readonly canAnexarAto = computed(() => {
    if (!this.chefeImediato()) return false;
    const num = (this.atoNumeroVal() || this.atoNumeroControl.value || '').trim();
    const data = (this.atoDataVal() || this.atoDataControl.value || '').trim();
    return num.length > 0 && num.length <= 20 && data.length > 0 && validarDataFormato(data);
  });

  // Habilita anexação da Normativa de Criação apenas se Nome, Número e Data válidos
  readonly canAnexarNormCriacao = computed(() => {
    const nome = (this.normCriacaoNomeVal() || this.normCriacaoNomeControl.value || '').trim();
    const num = (this.normCriacaoNumeroVal() || this.normCriacaoNumeroControl.value || '').trim();
    const data = (this.normCriacaoDataVal() || this.normCriacaoDataControl.value || '').trim();
    return nome.length > 0 && nome.length <= 100 && num.length > 0 && num.length <= 20 && data.length > 0 && validarDataFormato(data);
  });

  // Habilita anexação da Normativa de Extinção apenas se Nome, Número e Data válidos
  readonly canAnexarNormExtincao = computed(() => {
    const nome = (this.normExtincaoNomeVal() || this.normExtincaoNomeControl.value || '').trim();
    const num = (this.normExtincaoNumeroVal() || this.normExtincaoNumeroControl.value || '').trim();
    const data = (this.normExtincaoDataVal() || this.normExtincaoDataControl.value || '').trim();
    return nome.length > 0 && nome.length <= 100 && num.length > 0 && num.length <= 20 && data.length > 0 && validarDataFormato(data);
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const url = this.router.url;

    if (id && url.includes('/editar')) {
      this.isEditMode.set(true);
      this.itemId = id;
      this.carregarDadosEdicao(id);
    } else {
      this.isEditMode.set(false);
      this.initialSnapshotJson = this.getCurrentSnapshotJson();
    }

    // Limpa erro de duplicidade ao digitar novo nome
    this.form.get('nome')?.valueChanges.subscribe(() => {
      if (this.form.get('nome')?.hasError('duplicado')) {
        this.form.get('nome')?.setErrors(null);
      }
    });

    // Limpa erro de UTB em uso ao alterar
    this.utbInputControl.valueChanges.subscribe(() => {
      if (this.utbInputControl.hasError('emUso')) {
        this.utbInputControl.setErrors(null);
      }
    });
  }

  private carregarDadosEdicao(id: string) {
    const item = this.service.getItem(id);
    if (!item) {
      this.toastService.error('Gerência Regional não encontrada.');
      this.router.navigate(['/configuracoes/hierarquia/gerencia-regional']);
      return;
    }

    this.currentItem = item;
    this.form.patchValue({
      nome: item.nome,
      secretariaGeralId: item.secretariaGeralId,
      utbCodigo: item.utbCodigo
    });

    this.secGeralInputControl.setValue(item.secretariaGeralNome, { emitEvent: false });
    this.utbInputControl.setValue(item.utbNome, { emitEvent: false });

    if (item.chefeImediato) {
      this.chefeImediato.set(item.chefeImediato);
      this.atoNumeroControl.setValue(item.chefeImediato.atoGovernamental?.numero || '');
      this.atoDataControl.setValue(item.chefeImediato.atoGovernamental?.dataPublicacao || '');
      this.atoDocumento.set(item.chefeImediato.atoGovernamental?.documento);
    }

    if (item.normativaCriacao) {
      this.normCriacaoNomeControl.setValue(item.normativaCriacao.nome);
      this.normCriacaoNumeroControl.setValue(item.normativaCriacao.numero);
      this.normCriacaoDataControl.setValue(item.normativaCriacao.dataPublicacao);
      this.normCriacaoDoc.set(item.normativaCriacao.documento);
    }

    if (item.normativaExtincao && item.normativaExtincao.documento) {
      this.temNormativaExtincao.set(true);
      this.hasPersistedNormativaExtincao.set(true);
      this.normExtincaoNomeControl.setValue(item.normativaExtincao.nome);
      this.normExtincaoNumeroControl.setValue(item.normativaExtincao.numero);
      this.normExtincaoDataControl.setValue(item.normativaExtincao.dataPublicacao);
      this.normExtincaoDoc.set(item.normativaExtincao.documento);
    }

    this.subordinadasOriginais.set(item.subordinadas || []);

    // Congela estado inicial após carregamento completo
    this.initialSnapshotJson = this.getCurrentSnapshotJson();
  }

  private getCurrentSnapshotJson(): string {
    const raw = this.form.getRawValue();
    return JSON.stringify({
      nome: (raw.nome || '').trim(),
      secretariaGeralId: (raw.secretariaGeralId || '').trim(),
      utbCodigo: (raw.utbCodigo || '').trim(),
      chefeMatricula: this.chefeImediato()?.matricula || null,
      atoNumero: (this.atoNumeroControl.value || '').trim(),
      atoData: (this.atoDataControl.value || '').trim(),
      atoDoc: this.atoDocumento() ? `${this.atoDocumento()!.nomeArquivo}_${this.atoDocumento()!.tamanho}` : null,
      normCriaNome: (this.normCriacaoNomeControl.value || '').trim(),
      normCriaNum: (this.normCriacaoNumeroControl.value || '').trim(),
      normCriaData: (this.normCriacaoDataControl.value || '').trim(),
      normCriaDoc: this.normCriacaoDoc() ? `${this.normCriacaoDoc()!.nomeArquivo}_${this.normCriacaoDoc()!.tamanho}` : null,
      temNormExt: this.temNormativaExtincao(),
      normExtNome: (this.normExtincaoNomeControl.value || '').trim(),
      normExtNum: (this.normExtincaoNumeroControl.value || '').trim(),
      normExtData: (this.normExtincaoDataControl.value || '').trim(),
      normExtDoc: this.normExtincaoDoc() ? `${this.normExtincaoDoc()!.nomeArquivo}_${this.normExtincaoDoc()!.tamanho}` : null,
      expandindoNormExt: this.expandindoNormativaExtincao()
    });
  }

  hasUnsavedChanges(): boolean {
    if (this.isSavedSuccessfully || this.isDiscarded) {
      return false;
    }
    return this.getCurrentSnapshotJson() !== this.initialSnapshotJson;
  }

  canDeactivate(): Promise<boolean> | boolean {
    if (!this.hasUnsavedChanges()) {
      return true;
    }
    return new Promise<boolean>((resolve) => {
      const dialogRef = this.modalService.confirmarCancelamento();
      dialogRef.afterClosed().subscribe((confirmado: boolean) => {
        if (confirmado) {
          this.isDiscarded = true;
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

  onSecGeralSelected(secGeralId: string) {
    const found = this.secGeralService.items().find(s => s.id === secGeralId);
    if (found) {
      this.form.get('secretariaGeralId')?.setValue(found.id);
      this.form.get('secretariaGeralId')?.markAsDirty();
      this.secGeralInputControl.setValue(found.nome, { emitEvent: false });
    }
  }

  limparSecGeral() {
    this.form.get('secretariaGeralId')?.setValue('');
    this.form.get('secretariaGeralId')?.markAsDirty();
    this.secGeralInputControl.setValue('');
  }

  onUtbSelected(codigo: string) {
    if (this.isUtbBloqueada()) return;
    const utb = this.secGeralService.utbs().find(u => u.codigo === codigo);
    if (!utb) return;

    const currentCodigo = this.form.get('utbCodigo')?.value;
    if (currentCodigo === codigo) return;

    // Verifica exclusividade da UTB
    if (this.service.isUtbEmUso(codigo, this.itemId || undefined)) {
      this.utbInputControl.setErrors({ emUso: true });
      this.utbInputControl.markAsTouched();
      return;
    }

    const requiresConfirmation = this.isEditMode()
      ? !!currentCodigo
      : !!this.chefeImediato();

    const aplicarNovaUtb = () => {
      this.form.get('utbCodigo')?.setValue(codigo);
      this.form.get('utbCodigo')?.markAsDirty();
      this.utbInputControl.setValue(`${utb.codigo} - ${utb.nome}`, { emitEvent: false });

      // Se houver chefe vinculado e a UTB mudou, desvincula chefia e ato
      if (this.chefeImediato()) {
        this.chefeImediato.set(undefined);
        this.atoNumeroControl.reset('');
        this.atoDataControl.reset('');
        this.atoDocumento.set(undefined);
        this.atoDocInvalido.set(false);
      }
    };

    if (requiresConfirmation) {
      this.isHandlingUtbSelection = true;
      this.confirmarTrocaUtb(codigo, aplicarNovaUtb);
    } else {
      aplicarNovaUtb();
    }
  }

  confirmarTrocaUtb(novoCodigo: string, callbackConfirmado: () => void) {
    const currentCodigo = this.form.get('utbCodigo')?.value;
    const existing = this.secGeralService.utbs().find((u: UtbItem) => u.codigo === currentCodigo);
    const existingLabel = existing ? `${existing.codigo} - ${existing.nome}` : '';

    const dialogRef = this.dialog.open(ConfirmacaoDialog, {
      disableClose: true,
      data: {
        title: 'Alterar Unidade de Trabalho?',
        message: 'Ao alterar a Unidade de Trabalho (UTB), os vínculos de chefia existentes poderão ser removidos. Deseja continuar?',
        cancelLabel: 'Não',
        actionLabel: 'Sim, alterar',
        actionType: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      this.isHandlingUtbSelection = false;
      if (confirmado) {
        callbackConfirmado();
      } else {
        // Preserva a UTB original e todos os dados vinculados
        this.utbInputControl.setValue(existingLabel, { emitEvent: false });
      }
    });
  }

  limparUtb() {
    if (this.isUtbBloqueada()) return;
    const currentCodigo = this.form.get('utbCodigo')?.value;
    if (!currentCodigo && !this.utbInputControl.value) return;

    const requiresConfirmation = this.isEditMode()
      ? !!currentCodigo
      : !!this.chefeImediato();

    const aplicarLimpeza = () => {
      this.form.get('utbCodigo')?.setValue('');
      this.form.get('utbCodigo')?.markAsDirty();
      this.utbInputControl.setValue('');
      if (this.chefeImediato()) {
        this.chefeImediato.set(undefined);
        this.atoNumeroControl.reset('');
        this.atoDataControl.reset('');
        this.atoDocumento.set(undefined);
        this.atoDocInvalido.set(false);
      }
    };

    if (requiresConfirmation) {
      this.isHandlingUtbSelection = true;
      this.confirmarTrocaUtb('', aplicarLimpeza);
    } else {
      aplicarLimpeza();
    }
  }

  onUtbBlur() {
    if (this.isHandlingUtbSelection || this.dialog.openDialogs.length > 0) {
      return;
    }
    if (this.isUtbBloqueada()) return;

    const currentSelectedCodigo = this.form.get('utbCodigo')?.value;
    const text = (this.utbInputControl.value || '').trim();
    if (!text) {
      if (currentSelectedCodigo) {
        this.limparUtb();
      }
      return;
    }

    const found = this.secGeralService.utbs().find(u => 
      u.codigo.toLowerCase() === text.toLowerCase() ||
      `${u.codigo} - ${u.nome}`.toLowerCase() === text.toLowerCase()
    );

    if (found) {
      if (found.codigo !== currentSelectedCodigo) {
        this.onUtbSelected(found.codigo);
      }
    } else if (currentSelectedCodigo) {
      const existing = this.secGeralService.utbs().find(u => u.codigo === currentSelectedCodigo);
      this.utbInputControl.setValue(existing ? `${existing.codigo} - ${existing.nome}` : '', { emitEvent: false });
    } else {
      this.utbInputControl.setValue('');
    }
  }

  abrirBuscaChefe() {
    const utbCodigo = this.form.get('utbCodigo')?.value;
    if (!utbCodigo) {
      this.toastService.warning('Selecione primeiro uma Unidade de Trabalho (UTB).');
      return;
    }

    const dialogRef = this.dialog.open(BuscaServidorModal, {
      width: '820px',
      maxWidth: 'calc(100vw - 2.5rem)',
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
      autoFocus: false,
      data: {
        utbCodigo,
        unidadeNome: 'Gerência Regional'
      }
    });

    dialogRef.afterClosed().subscribe((servidor: ServidorUtbItem | undefined) => {
      if (servidor) {
        const isSubstituicao = !!this.chefeImediato();
        this.chefeImediato.set({
          matricula: servidor.matricula,
          cpf: servidor.cpf,
          nome: servidor.nome,
          cargo: servidor.cargo,
          situacaoFuncional: servidor.situacaoFuncional,
          atoGovernamental: {
            numero: '',
            dataPublicacao: ''
          }
        });

        // Limpa campos do ato para exigir nova comprovação documental
        this.atoNumeroControl.reset('');
        this.atoDataControl.reset('');
        this.atoDocumento.set(undefined);
        this.atoDocInvalido.set(false);

        this.toastService.success(
          isSubstituicao 
            ? `Chefia substituída com sucesso por "${servidor.nome}". Anexe o novo Ato Governamental.`
            : `Chefe Imediato "${servidor.nome}" vinculado com sucesso.`
        );
      }
    });
  }

  removerChefe() {
    const dialogRef = this.dialog.open(ConfirmacaoDialog, {
      disableClose: true,
      data: {
        title: 'Remover Chefe Imediato?',
        message: 'Deseja remover o vínculo da chefia imediata desta Gerência Regional? O Ato Governamental associado também será desvinculado.',
        cancelLabel: 'Cancelar',
        actionLabel: 'Sim, remover',
        actionType: 'destructive'
      }
    });

    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.chefeImediato.set(undefined);
        this.atoNumeroControl.reset('');
        this.atoDataControl.reset('');
        this.atoDocumento.set(undefined);
        this.atoDocInvalido.set(false);
        this.toastService.info('Chefe Imediato removido.');
      }
    });
  }

  abrirHistoricoAtos() {
    const atos = this.service.getHistoricoAtos(
      this.itemId || undefined,
      this.chefeImediato()?.atoGovernamental,
      this.chefeImediato()?.nome
    );

    this.dialog.open(HistoricoAtosModal, {
      width: '900px',
      maxWidth: 'calc(100vw - 2.5rem)',
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
      autoFocus: false,
      data: {
        atos
      }
    });
  }

  onFileAtoSelected(event: Event) {
    if (!this.canAnexarAto()) {
      this.toastService.warning('Preencha os campos obrigatórios do Ato Governamental com valores válidos antes de anexar o documento.');
      return;
    }
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    // Validação de Tamanho (máx 10 MB)
    if (file.size > 10 * 1024 * 1024) {
      this.toastService.warning('O arquivo excede o limite máximo permitido de 10 MB.');
      input.value = '';
      return;
    }

    // Validação de Extensão (.pdf, .jpg, .jpeg, .png)
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext || '')) {
      this.toastService.warning('Formato não suportado. Utilize PDF, JPG, JPEG ou PNG.');
      input.value = '';
      return;
    }

    const doc: DocumentoAnexo = {
      id: `doc-ato-${Date.now()}`,
      nomeArquivo: file.name,
      tamanho: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      tipo: ext as 'pdf' | 'jpg' | 'jpeg' | 'png',
      dataUpload: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
      blobUrl: URL.createObjectURL(file)
    };

    this.atoDocumento.set(doc);
    this.atoDocInvalido.set(false);
    input.value = '';
    this.toastService.success(`Documento "${file.name}" anexado com sucesso.`);
  }

  removerDocAto() {
    this.atoDocumento.set(undefined);
  }

  onFileNormCriacaoSelected(event: Event) {
    if (!this.canAnexarNormCriacao()) {
      this.toastService.warning('Preencha os campos obrigatórios da Normativa de Criação com valores válidos antes de anexar o documento.');
      return;
    }
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (file.size > 10 * 1024 * 1024) {
      this.toastService.warning('O arquivo excede o limite máximo permitido de 10 MB.');
      input.value = '';
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext || '')) {
      this.toastService.warning('Formato não suportado. Utilize PDF, JPG, JPEG ou PNG.');
      input.value = '';
      return;
    }

    const doc: DocumentoAnexo = {
      id: `doc-norm-cria-${Date.now()}`,
      nomeArquivo: file.name,
      tamanho: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      tipo: ext as 'pdf' | 'jpg' | 'jpeg' | 'png',
      dataUpload: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
      blobUrl: URL.createObjectURL(file)
    };

    this.normCriacaoDoc.set(doc);
    this.normCriacaoDocInvalido.set(false);
    input.value = '';
    this.toastService.success(`Normativa de Criação "${file.name}" anexada com sucesso.`);
  }

  removerDocCriacao() {
    this.normCriacaoDoc.set(undefined);
  }

  abrirAdicaoNormativaExtincao() {
    this.expandindoNormativaExtincao.set(true);
  }

  cancelarAdicaoNormativaExtincao() {
    this.expandindoNormativaExtincao.set(false);
    this.normExtincaoNomeControl.reset('');
    this.normExtincaoNumeroControl.reset('');
    this.normExtincaoDataControl.reset('');
    this.normExtincaoDoc.set(undefined);
    this.normExtincaoDocInvalido.set(false);
  }

  confirmarAdicaoNormativaExtincao() {
    let hasError = false;
    let firstInvalidId = '';

    const nome = (this.normExtincaoNomeControl.value || '').trim();
    const numero = (this.normExtincaoNumeroControl.value || '').trim();
    const data = (this.normExtincaoDataControl.value || '').trim();
    const doc = this.normExtincaoDoc();

    if (!nome) {
      this.normExtincaoNomeControl.setErrors({ required: true });
      this.normExtincaoNomeControl.markAsTouched();
      hasError = true;
      if (!firstInvalidId) firstInvalidId = 'form-norm-ext-nome';
    } else if (nome.length > 100) {
      this.normExtincaoNomeControl.setErrors({ maxlength: { requiredLength: 100, actualLength: nome.length } });
      this.normExtincaoNomeControl.markAsTouched();
      hasError = true;
      if (!firstInvalidId) firstInvalidId = 'form-norm-ext-nome';
    }

    if (!numero) {
      this.normExtincaoNumeroControl.setErrors({ required: true });
      this.normExtincaoNumeroControl.markAsTouched();
      hasError = true;
      if (!firstInvalidId) firstInvalidId = 'form-norm-ext-numero';
    } else if (numero.length > 20) {
      this.normExtincaoNumeroControl.setErrors({ maxlength: { requiredLength: 20, actualLength: numero.length } });
      this.normExtincaoNumeroControl.markAsTouched();
      hasError = true;
      if (!firstInvalidId) firstInvalidId = 'form-norm-ext-numero';
    }

    if (!data) {
      this.normExtincaoDataControl.setErrors({ required: true });
      this.normExtincaoDataControl.markAsTouched();
      hasError = true;
      if (!firstInvalidId) firstInvalidId = 'form-norm-ext-data';
    } else if (!validarDataFormato(data)) {
      this.normExtincaoDataControl.setErrors({ dataFormato: 'Informe uma data válida no formato DD/MM/AAAA.' });
      this.normExtincaoDataControl.markAsTouched();
      hasError = true;
      if (!firstInvalidId) firstInvalidId = 'form-norm-ext-data';
    }

    if (!doc) {
      this.normExtincaoDocInvalido.set(true);
      hasError = true;
      if (!firstInvalidId) firstInvalidId = 'container-anexo-extincao';
    } else {
      this.normExtincaoDocInvalido.set(false);
    }

    if (hasError) {
      this.focusPrimeiroCampoInvalido(firstInvalidId);
      this.toastService.warning('Verifique os campos obrigatórios destacados no formulário.');
      return;
    }

    this.normExtincaoDataControl.setValue(normalizarDataParaBr(data), { emitEvent: false });
    this.temNormativaExtincao.set(true);
    this.expandindoNormativaExtincao.set(false);
    this.toastService.success('Normativa de Extinção adicionada com sucesso.');
  }

  onFileNormExtincaoSelected(event: Event) {
    if (!this.canAnexarNormExtincao()) {
      this.toastService.warning('Preencha os campos obrigatórios da Normativa de Extinção com valores válidos antes de anexar o documento.');
      return;
    }
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (file.size > 10 * 1024 * 1024) {
      this.toastService.warning('O arquivo excede o limite máximo permitido de 10 MB.');
      input.value = '';
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext || '')) {
      this.toastService.warning('Formato não suportado. Utilize PDF, JPG, JPEG ou PNG.');
      input.value = '';
      return;
    }

    const doc: DocumentoAnexo = {
      id: `doc-norm-ext-${Date.now()}`,
      nomeArquivo: file.name,
      tamanho: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      tipo: ext as 'pdf' | 'jpg' | 'jpeg' | 'png',
      dataUpload: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
      blobUrl: URL.createObjectURL(file)
    };

    this.normExtincaoDoc.set(doc);
    this.normExtincaoDocInvalido.set(false);
    input.value = '';
    this.toastService.success(`Normativa de Extinção "${file.name}" anexada com sucesso.`);
  }

  removerDocExtincao() {
    this.normExtincaoDoc.set(undefined);
  }

  visualizarDoc(doc: DocumentoAnexo, tipo?: string) {
    this.dialog.open(VisualizarDocumentoModal, {
      disableClose: true,
      width: '780px',
      maxWidth: 'calc(100vw - 2.5rem)',
      height: '620px',
      maxHeight: '82vh',
      panelClass: 'siage-pdf-dialog-panel',
      data: {
        documento: doc,
        titulo: 'Visualizar anexo',
        tipoDocumento: tipo
      }
    });
  }

  baixarDoc(doc: DocumentoAnexo) {
    this.toastService.success(`Download de "${doc.nomeArquivo}" iniciado.`);
  }

  // Métodos de Subordinadas (Núcleos e Escolas) no modo edição
  readonly filteredSubUtbsList = computed(() => {
    const list = this.subordinadasOriginais();
    const set = new Set<string>();
    list.forEach(item => {
      if (item.utb) set.add(item.utb);
    });
    const all = Array.from(set);
    const query = (this.filtroSubUtbVal() || '').trim().toLowerCase();
    if (!query) return all;
    return all.filter(u => u.toLowerCase().includes(query));
  });

  readonly canBuscarSubordinadas = computed(() => {
    const nome = (this.filtroSubNomeVal() || '').trim();
    const utb = (this.filtroSubUtbVal() || '').trim();
    return nome.length > 0 || utb.length > 0;
  });

  readonly filteredSubordinadas = computed(() => {
    let list = [...this.subordinadasOriginais()];
    const nome = this.appliedSubordinadaNome().toLowerCase();
    const utb = this.appliedSubordinadaUtb().toLowerCase();

    if (nome) {
      list = list.filter(i => i.nome.toLowerCase().includes(nome));
    }
    if (utb) {
      list = list.filter(i => i.utb.toLowerCase().includes(utb));
    }

    const dir = this.sortSubDirection() === 'asc' ? 1 : -1;
    list.sort((a, b) => dir * a.nome.localeCompare(b.nome, 'pt-BR'));
    return list;
  });

  readonly paginatedSubordinadas = computed(() => {
    const list = this.filteredSubordinadas();
    const start = this.subordinadasPageIndex() * 10;
    return list.slice(start, start + 10);
  });

  toggleSortSubordinadas() {
    this.sortSubDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    this.subordinadasPageIndex.set(0);
  }

  onBuscarSubordinadas() {
    this.appliedSubordinadaNome.set((this.filtroSubordinadaNome.value || '').trim());
    this.appliedSubordinadaUtb.set((this.filtroSubordinadaUtb.value || '').trim());
    this.subordinadasPageIndex.set(0);
  }

  onLimparSubordinadas() {
    this.filtroSubordinadaNome.setValue('');
    this.filtroSubordinadaUtb.setValue('');
    this.appliedSubordinadaNome.set('');
    this.appliedSubordinadaUtb.set('');
    this.subordinadasPageIndex.set(0);
  }

  limparFiltroSubNome() {
    this.filtroSubordinadaNome.setValue('');
  }

  limparFiltroSubUtb() {
    this.filtroSubordinadaUtb.setValue('');
  }

  onSubordinadasPageChange(newPageIndex: number) {
    this.subordinadasPageIndex.set(newPageIndex);
  }

  goHome() {
    this.router.navigate(['/inicio']);
  }

  goConfiguracoes() {
    this.router.navigate(['/configuracoes']);
  }

  goHierarquia() {
    this.router.navigate(['/configuracoes/hierarquia']);
  }

  goBack() {
    this.router.navigate(['/configuracoes/hierarquia/gerencia-regional']);
  }

  onCancelar() {
    if (!this.hasUnsavedChanges()) {
      this.goBack();
      return;
    }

    const dialogRef = this.modalService.confirmarCancelamento();
    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.isDiscarded = true;
        this.goBack();
      }
    });
  }

  focusPrimeiroCampoInvalido(idPrimeiroInvalido?: string) {
    setTimeout(() => {
      let el: HTMLElement | null = null;
      if (idPrimeiroInvalido) {
        const target = document.getElementById(idPrimeiroInvalido);
        if (target) {
          el = target.querySelector('input') || target;
        }
      }
      if (!el) {
        const firstError = document.querySelector('mat-error, .border-red-500, input.ng-invalid, [aria-invalid="true"]');
        if (firstError) {
          const container = firstError.closest('.form-field-group, mat-form-field, .border-red-500');
          el = (container?.querySelector('input, [tabindex="0"]') || firstError) as HTMLElement;
        }
      }
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }, 100);
  }

  onSalvar() {
    if (this.isSaving()) return;

    let hasError = false;
    let firstInvalidId = '';

    // Se estiver expandido o formulário da Normativa de Extinção
    if (this.expandindoNormativaExtincao()) {
      const extNome = (this.normExtincaoNomeControl.value || '').trim();
      const extNum = (this.normExtincaoNumeroControl.value || '').trim();
      const extData = (this.normExtincaoDataControl.value || '').trim();
      const extDoc = this.normExtincaoDoc();

      if (!extNome) {
        this.normExtincaoNomeControl.setErrors({ required: true });
        this.normExtincaoNomeControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-norm-ext-nome';
      } else if (extNome.length > 100) {
        this.normExtincaoNomeControl.setErrors({ maxlength: { requiredLength: 100, actualLength: extNome.length } });
        this.normExtincaoNomeControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-norm-ext-nome';
      }
      if (!extNum) {
        this.normExtincaoNumeroControl.setErrors({ required: true });
        this.normExtincaoNumeroControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-norm-ext-numero';
      } else if (extNum.length > 20) {
        this.normExtincaoNumeroControl.setErrors({ maxlength: { requiredLength: 20, actualLength: extNum.length } });
        this.normExtincaoNumeroControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-norm-ext-numero';
      }
      if (!extData) {
        this.normExtincaoDataControl.setErrors({ required: true });
        this.normExtincaoDataControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-norm-ext-data';
      } else if (!validarDataFormato(extData)) {
        this.normExtincaoDataControl.setErrors({ dataFormato: 'Informe uma data válida no formato DD/MM/AAAA.' });
        this.normExtincaoDataControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-norm-ext-data';
      }
      if (!extDoc) {
        this.normExtincaoDocInvalido.set(true);
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'container-anexo-extincao';
      } else {
        this.normExtincaoDocInvalido.set(false);
      }
    }

    // 1. Identificação: Nome, Secretaria Geral e UTB
    const nome = (this.form.get('nome')?.value || '').trim();
    const secGeralId = (this.form.get('secretariaGeralId')?.value || '').trim();
    const utbCodigo = this.form.get('utbCodigo')?.value;

    if (!nome) {
      this.form.get('nome')?.setErrors({ required: true });
      this.form.get('nome')?.markAsTouched();
      hasError = true;
      if (!firstInvalidId) firstInvalidId = 'form-nome';
    } else if (this.service.isNomeDuplicado(nome, this.itemId || undefined)) {
      this.form.get('nome')?.setErrors({ duplicado: true });
      this.form.get('nome')?.markAsTouched();
      hasError = true;
      if (!firstInvalidId) firstInvalidId = 'form-nome';
    }

    if (!secGeralId) {
      this.form.get('secretariaGeralId')?.setErrors({ required: true });
      this.form.get('secretariaGeralId')?.markAsTouched();
      this.secGeralInputControl.setErrors({ required: true });
      this.secGeralInputControl.markAsTouched();
      hasError = true;
      if (!firstInvalidId) firstInvalidId = 'form-sec-geral';
    }

    if (!utbCodigo) {
      this.form.get('utbCodigo')?.setErrors({ required: true });
      this.form.get('utbCodigo')?.markAsTouched();
      this.utbInputControl.setErrors({ required: true });
      this.utbInputControl.markAsTouched();
      hasError = true;
      if (!firstInvalidId) firstInvalidId = 'form-utb';
    } else if (this.service.isUtbEmUso(utbCodigo, this.itemId || undefined)) {
      this.utbInputControl.setErrors({ emUso: true });
      this.utbInputControl.markAsTouched();
      hasError = true;
      if (!firstInvalidId) firstInvalidId = 'form-utb';
    }

    // 2. Chefia Imediata: se houver chefe vinculado, Ato Governamental é obrigatório
    if (this.chefeImediato()) {
      const atoNum = (this.atoNumeroControl.value || '').trim();
      const atoData = (this.atoDataControl.value || '').trim();
      const atoDoc = this.atoDocumento();

      if (!atoNum) {
        this.atoNumeroControl.setErrors({ required: true });
        this.atoNumeroControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-ato-numero';
      } else if (atoNum.length > 20) {
        this.atoNumeroControl.setErrors({ maxlength: { requiredLength: 20, actualLength: atoNum.length } });
        this.atoNumeroControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-ato-numero';
      }

      if (!atoData) {
        this.atoDataControl.setErrors({ required: true });
        this.atoDataControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-ato-data';
      } else if (!validarDataFormato(atoData)) {
        this.atoDataControl.setErrors({ dataFormato: 'Informe uma data válida no formato DD/MM/AAAA.' });
        this.atoDataControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-ato-data';
      }

      if (!atoDoc) {
        this.atoDocInvalido.set(true);
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'container-anexo-ato';
      } else {
        this.atoDocInvalido.set(false);
      }
    } else {
      this.atoDocInvalido.set(false);
    }

    // 3. Normativa de Criação: obrigatória no momento do cadastro
    if (!this.isEditMode()) {
      const normCriaNome = (this.normCriacaoNomeControl.value || '').trim();
      const normCriaNum = (this.normCriacaoNumeroControl.value || '').trim();
      const normCriaData = (this.normCriacaoDataControl.value || '').trim();
      const normCriaDoc = this.normCriacaoDoc();

      if (!normCriaNome) {
        this.normCriacaoNomeControl.setErrors({ required: true });
        this.normCriacaoNomeControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-norm-criacao-nome';
      } else if (normCriaNome.length > 100) {
        this.normCriacaoNomeControl.setErrors({ maxlength: { requiredLength: 100, actualLength: normCriaNome.length } });
        this.normCriacaoNomeControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-norm-criacao-nome';
      }

      if (!normCriaNum) {
        this.normCriacaoNumeroControl.setErrors({ required: true });
        this.normCriacaoNumeroControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-norm-criacao-numero';
      } else if (normCriaNum.length > 20) {
        this.normCriacaoNumeroControl.setErrors({ maxlength: { requiredLength: 20, actualLength: normCriaNum.length } });
        this.normCriacaoNumeroControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-norm-criacao-numero';
      }

      if (!normCriaData) {
        this.normCriacaoDataControl.setErrors({ required: true });
        this.normCriacaoDataControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-norm-criacao-data';
      } else if (!validarDataFormato(normCriaData)) {
        this.normCriacaoDataControl.setErrors({ dataFormato: 'Informe uma data válida no formato DD/MM/AAAA.' });
        this.normCriacaoDataControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-norm-criacao-data';
      }

      if (!normCriaDoc) {
        this.normCriacaoDocInvalido.set(true);
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'container-anexo-criacao';
      } else {
        this.normCriacaoDocInvalido.set(false);
      }
    }

    // Se houver erros de validação, foca o primeiro campo inválido e exibe um ÚNICO toast geral
    if (hasError) {
      this.focusPrimeiroCampoInvalido(firstInvalidId);
      this.toastService.warning('Verifique os campos obrigatórios destacados no formulário.');
      return;
    }

    // Se a normativa de extinção estava expandida e válida, conclui a adição
    if (this.expandindoNormativaExtincao()) {
      this.temNormativaExtincao.set(true);
      this.expandindoNormativaExtincao.set(false);
    }

    // Montar Chefe Imediato
    let chefeFinal: ChefeImediatoItem | undefined = undefined;
    if (this.chefeImediato()) {
      chefeFinal = {
        ...this.chefeImediato()!,
        atoGovernamental: {
          numero: (this.atoNumeroControl.value || '').trim(),
          dataPublicacao: normalizarDataParaBr((this.atoDataControl.value || '').trim()),
          documento: this.atoDocumento()
        }
      };
    }

    // Montar Normativa de Criação
    const normativaCriacaoFinal: NormativaItem = (this.isEditMode() && this.currentItem?.normativaCriacao)
      ? this.currentItem.normativaCriacao
      : {
          nome: (this.normCriacaoNomeControl.value || '').trim(),
          numero: (this.normCriacaoNumeroControl.value || '').trim(),
          dataPublicacao: normalizarDataParaBr((this.normCriacaoDataControl.value || '').trim()),
          documento: this.normCriacaoDoc()
        };

    // Montar Normativa de Extinção
    let normativaExtincaoFinal: NormativaItem | undefined = undefined;
    if (this.hasPersistedNormativaExtincao() && this.currentItem?.normativaExtincao) {
      normativaExtincaoFinal = this.currentItem.normativaExtincao;
    } else if (this.temNormativaExtincao() && this.normExtincaoDoc()) {
      normativaExtincaoFinal = {
        nome: (this.normExtincaoNomeControl.value || '').trim() || 'Normativa de Extinção',
        numero: (this.normExtincaoNumeroControl.value || '').trim() || '-',
        dataPublicacao: normalizarDataParaBr((this.normExtincaoDataControl.value || '').trim() || new Date().toLocaleDateString('pt-BR')),
        documento: this.normExtincaoDoc()
      };
    }

    const secGeral = this.secGeralService.items().find(s => s.id === secGeralId);
    const secGeralNome = secGeral ? secGeral.nome : '';

    const utbCodigoStr = (utbCodigo || '').trim();
    const utbItem = this.secGeralService.utbs().find((u: UtbItem) => u.codigo === utbCodigoStr);
    const utbNome = utbItem ? `${utbItem.codigo} - ${utbItem.nome}` : utbCodigoStr;

    this.isSaving.set(true);

    setTimeout(() => {
      if (this.isEditMode() && this.itemId) {
        this.service.update(this.itemId, {
          nome,
          secretariaGeralId: secGeralId,
          secretariaGeralNome: secGeralNome,
          utbCodigo: utbCodigoStr,
          utbNome,
          chefeImediato: chefeFinal,
          normativaCriacao: normativaCriacaoFinal,
          normativaExtincao: normativaExtincaoFinal
        });
        this.toastService.success('Registro atualizado com sucesso.');
      } else {
        this.service.add({
          nome,
          secretariaGeralId: secGeralId,
          secretariaGeralNome: secGeralNome,
          utbCodigo: utbCodigoStr,
          utbNome,
          status: 'ATIVO',
          chefeImediato: chefeFinal,
          normativaCriacao: normativaCriacaoFinal,
          normativaExtincao: normativaExtincaoFinal,
          subordinadas: []
        });
        this.toastService.success('Registro cadastrado com sucesso.');
      }

      this.isSavedSuccessfully = true;
      this.isSaving.set(false);
      this.goBack();
    }, 400);
  }
}

// ==========================================
// TELA 3: VISUALIZAR GERÊNCIA REGIONAL
// ==========================================

@Component({
  selector: 'app-gerencia-regional-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    SiagePaginatorComponent,
    AcessoRestritoComponent
  ],
  template: `
    @if (!permissionService.hasAccess()) {
      <app-acesso-restrito backUrl="/configuracoes/hierarquia/gerencia-regional" />
    } @else {
      <div class="flex flex-col gap-6 max-w-7xl mx-auto w-full font-sans pb-16">
        <!-- Breadcrumb e Cabeçalho Principal -->
        <div class="flex flex-col gap-2">
          <nav class="flex items-center gap-2 text-xs text-siage-text-secondary" aria-label="Navegação estrutural">
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
            <span 
              (click)="goBack()" 
              (keydown.enter)="goBack()" 
              tabindex="0" 
              role="button" 
              class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline"
            >
              Configurar Gerência Regional
            </span>
            <span class="text-[10px] text-siage-text-secondary/40 select-none" aria-hidden="true">/</span>
            <span class="text-siage-primary font-semibold" aria-current="page">Visualizar</span>
          </nav>

          <!-- Título com Botão Voltar e Botão Editar -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2 sm:gap-3">
                <button 
                  mat-icon-button 
                  type="button"
                  (click)="goBack()" 
                  class="text-siage-text-secondary hover:text-siage-primary transition-colors cursor-pointer -ml-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                  title="Voltar para a listagem"
                  aria-label="Voltar para a listagem"
                >
                  <mat-icon style="font-size: 22px; width: 22px; height: 22px;">arrow_back</mat-icon>
                </button>
                <h1 class="text-2xl sm:text-3xl font-poppins font-bold tracking-tight text-siage-text-primary leading-tight">
                  Visualizar Gerência Regional
                </h1>
              </div>

              <p class="text-xs sm:text-sm text-siage-text-secondary font-sans leading-normal pl-8 sm:pl-9 max-w-2xl">
                Consulte as informações, dados de chefia, normativas e núcleos e escolas vinculados da Gerência Regional.
              </p>
            </div>

            <!-- Ação Editar (somente se ativo e com permissão) -->
            @if (permissionService.canCreate() && item()?.status === 'ATIVO') {
              <div class="shrink-0 pl-8 sm:pl-0">
                <button 
                  type="button" 
                  (click)="onEditar()"
                  class="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                >
                  <mat-icon style="font-size: 18px; width: 18px; height: 18px;">edit</mat-icon>
                  <span>Editar</span>
                </button>
              </div>
            }
          </div>
        </div>

        @if (item(); as gr) {
          <div class="flex flex-col gap-6">

            <!-- Card 1: Identificação da Gerência Regional -->
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">domain</mat-icon>
                <span>1. Identificação da Gerência Regional</span>
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                <!-- Primeira linha: Nome (4 cols) | Secretaria Executiva (4 cols) | UTB (4 cols) -->
                <div class="flex flex-col gap-1 col-span-12 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Nome da Gerência Regional</span>
                  <span class="text-sm font-medium text-siage-text-primary break-words">{{ gr.nome }}</span>
                </div>

                <div class="flex flex-col gap-1 col-span-12 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Secretaria Geral</span>
                  <span class="text-sm font-medium text-siage-text-primary break-words">{{ gr.secretariaGeralNome }}</span>
                </div>

                <div class="flex flex-col gap-1 col-span-12 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Unidade de Trabalho (UTB)</span>
                  <span class="text-sm font-medium text-siage-text-primary break-words leading-relaxed">{{ gr.utbNome }}</span>
                </div>

                <!-- Segunda linha: Situação | Criador / Editor | Data de Criação -->
                <div class="flex flex-col gap-1 col-span-12 sm:col-span-4 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Situação</span>
                  <span class="text-sm font-medium text-siage-text-primary">{{ gr.status === 'ATIVO' ? 'Ativo' : 'Inativo' }}</span>
                </div>

                <div class="flex flex-col gap-1 col-span-12 sm:col-span-4 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Criador / Editor</span>
                  <span class="text-sm font-medium text-siage-text-primary break-words">{{ gr.criadorEditor }}</span>
                </div>

                <div class="flex flex-col gap-1 col-span-12 sm:col-span-4 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data de Criação</span>
                  <span class="text-sm font-medium text-siage-text-primary">{{ gr.dataCriacao }}</span>
                </div>
              </div>
            </div>

            <!-- Card 2: Chefia Imediata e Ato Governamental -->
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">badge</mat-icon>
                <span>2. Chefia Imediata e Ato Governamental</span>
              </h3>

              @if (gr.chefeImediato; as chefe) {
                <!-- Card do Chefe Imediato Vinculado -->
                <div class="border border-siage-border rounded-lg p-4 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col gap-4">
                  <!-- Identificação do Servidor com Avatar -->
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-siage-primary/10 text-siage-primary flex items-center justify-center font-bold font-poppins shrink-0">
                      {{ chefe.nome.charAt(0) }}
                    </div>
                    <div>
                      <span class="text-sm font-semibold text-siage-text-primary block">{{ chefe.nome }}</span>
                      <span class="text-xs text-siage-text-secondary">{{ chefe.cargo }}</span>
                    </div>
                  </div>

                  <!-- Dados do Servidor em Grid (4 colunas) -->
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2 border-t border-siage-border/40">
                    <div class="flex flex-col gap-1">
                      <span class="text-xs uppercase text-siage-text-secondary font-semibold">Matrícula</span>
                      <span class="text-sm font-mono font-medium text-siage-text-primary">{{ chefe.matricula }}</span>
                    </div>
                    <div class="flex flex-col gap-1">
                      <span class="text-xs uppercase text-siage-text-secondary font-semibold">CPF</span>
                      <span class="text-sm font-mono font-medium text-siage-text-primary">{{ chefe.cpf }}</span>
                    </div>
                    <div class="flex flex-col gap-1">
                      <span class="text-xs uppercase text-siage-text-secondary font-semibold">Cargo</span>
                      <span class="text-sm font-medium text-siage-text-primary break-words">{{ chefe.cargo }}</span>
                    </div>
                    <div class="flex flex-col gap-1">
                      <span class="text-xs uppercase text-siage-text-secondary font-semibold">Situação Funcional</span>
                      <span class="text-sm font-medium text-siage-text-primary">{{ chefe.situacaoFuncional }}</span>
                    </div>
                  </div>

                  <!-- Sub-bloco Integrado: Ato Governamental -->
                  <div class="mt-2 pt-4 border-t border-siage-border/40 flex flex-col gap-4">
                    <div class="flex items-center justify-between gap-2 flex-wrap">
                      <div class="flex items-center gap-2">
                        <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-siage-primary">description</mat-icon>
                        <span class="text-xs font-poppins font-bold uppercase tracking-wider text-siage-primary">
                          Ato Governamental de Nomeação
                        </span>
                      </div>

                      <button 
                        type="button" 
                        (click)="abrirHistoricoAtos()"
                        class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-siage-border bg-siage-surface hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium text-siage-text-primary transition-colors cursor-pointer"
                        title="Consultar histórico de atos governamentais"
                      >
                        <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-siage-text-secondary">history</mat-icon>
                        <span>Consultar histórico</span>
                      </button>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div class="flex flex-col gap-1">
                        <span class="text-xs uppercase text-siage-text-secondary font-semibold">Número do Ato Governamental</span>
                        <span class="text-sm font-medium text-siage-text-primary">{{ chefe.atoGovernamental.numero }}</span>
                      </div>
                      <div class="flex flex-col gap-1">
                        <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data da Publicação</span>
                        <span class="text-sm font-medium text-siage-text-primary">{{ formatarDataParaExibicao(chefe.atoGovernamental.dataPublicacao) }}</span>
                      </div>
                    </div>

                    <!-- Anexo do Documento com Visualizar e Baixar -->
                    @if (chefe.atoGovernamental.documento; as doc) {
                      <div class="border border-siage-border rounded-lg overflow-hidden bg-siage-surface">
                        <div class="flex items-center justify-between p-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                          <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded bg-siage-primary/10 text-siage-primary flex items-center justify-center shrink-0">
                              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">description</mat-icon>
                            </div>
                            <div class="flex flex-col">
                              <span class="text-xs sm:text-sm font-medium text-siage-text-primary">{{ doc.nomeArquivo }}</span>
                              <span class="text-[11px] text-siage-text-secondary">{{ doc.tamanho }} • Enviado em {{ doc.dataUpload }}</span>
                            </div>
                          </div>
                          <div class="flex items-center gap-1">
                            <button 
                              type="button" 
                              (click)="visualizarDoc(doc, 'Ato Governamental')" 
                              matTooltip="Visualizar anexo" 
                              class="w-8 h-8 rounded text-siage-text-secondary hover:text-siage-primary flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">visibility</mat-icon>
                            </button>
                            <button 
                              type="button" 
                              (click)="baixarDoc(doc)" 
                              matTooltip="Baixar arquivo" 
                              class="w-8 h-8 rounded text-siage-text-secondary hover:text-siage-primary flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">download</mat-icon>
                            </button>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              } @else {
                <div class="py-6 text-center text-xs text-siage-text-secondary border border-dashed border-siage-border rounded-lg flex flex-col items-center justify-center gap-3">
                  <span>Nenhum Chefe Imediato vinculado no momento.</span>
                  <button 
                    type="button" 
                    (click)="abrirHistoricoAtos()"
                    class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-siage-border bg-siage-surface hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium text-siage-text-primary transition-colors cursor-pointer"
                    title="Consultar histórico de atos governamentais"
                  >
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-siage-text-secondary">history</mat-icon>
                    <span>Consultar histórico</span>
                  </button>
                </div>
              }
            </div>

            <!-- Card 3: Núcleos e Escolas Vinculados -->
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">account_tree</mat-icon>
                <span>3. Núcleos e Escolas Vinculados</span>
              </h3>

              <!-- Filtros de Subordinadas Vinculadas -->
              <div class="flex flex-col gap-4 pt-1">
                <span class="text-xs font-semibold text-siage-text-secondary">Buscar por:</span>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <!-- Filtro: Nome -->
                  <div class="form-field-group">
                    <label for="view-filtro-sub-nome" class="siage-field-label">Nome</label>
                    <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                      <input 
                        matInput 
                        id="view-filtro-sub-nome" 
                        type="text"
                        [formControl]="filtroNome" 
                        maxlength="200"
                        placeholder="Digite o nome"
                        (keydown.enter)="$event.preventDefault(); canBuscar() && onBuscar()"
                        class="text-sm"
                      />
                      @if (filtroNomeVal()) {
                        <button mat-icon-button matSuffix type="button" (click)="limparFiltroNome()" aria-label="Limpar campo">
                          <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                        </button>
                      }
                    </mat-form-field>
                  </div>

                  <!-- Filtro: Unidade de Trabalho (UTB) (Select com autocomplete contendo somente UTBs das subordinadas vinculadas) -->
                  <div class="form-field-group">
                    <label for="view-filtro-sub-utb" class="siage-field-label">Unidade de Trabalho (UTB)</label>
                    <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                      <input 
                        matInput 
                        id="view-filtro-sub-utb" 
                        type="text"
                        [formControl]="filtroUtb" 
                        placeholder="Selecione ou busque uma unidade de trabalho"
                        [matAutocomplete]="autoUtbView"
                        #autoUtbViewTrigger="matAutocompleteTrigger"
                        (focus)="autoUtbViewTrigger.openPanel()"
                        (keydown.enter)="$event.preventDefault(); canBuscar() && onBuscar()"
                        class="text-sm"
                      />
                      <mat-autocomplete #autoUtbView="matAutocomplete">
                        @for (utb of filteredUtbOptions(); track utb) {
                          <mat-option [value]="utb">
                            {{ utb }}
                          </mat-option>
                        }
                      </mat-autocomplete>
                      @if (filtroUtbVal()) {
                        <button mat-icon-button matSuffix type="button" (click)="limparFiltroUtb()" aria-label="Limpar campo">
                          <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                        </button>
                      } @else {
                        <button mat-icon-button matSuffix type="button" (click)="autoUtbViewTrigger.openPanel()" aria-label="Abrir opções">
                          <mat-icon class="text-siage-text-secondary">arrow_drop_down</mat-icon>
                        </button>
                      }
                    </mat-form-field>
                  </div>
                </div>

                <!-- Botões Buscar e Limpar -->
                <div class="flex items-center justify-end gap-3 pt-3 border-t border-siage-border/40">
                  <button 
                    type="button" 
                    (click)="onLimpar()"
                    class="h-10 px-5 rounded-lg border border-siage-border font-sans font-medium text-sm text-siage-text-primary hover:bg-siage-primary/5 hover:border-siage-primary/30 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    Limpar
                  </button>
                  
                  <button 
                    type="button" 
                    (click)="canBuscar() && onBuscar()"
                    [disabled]="!canBuscar()"
                    [matTooltip]="!canBuscar() ? 'Informe o Nome ou a Unidade de Trabalho (UTB) para realizar a busca' : 'Executar busca'"
                    class="inline-flex items-center justify-center gap-1.5 h-10 px-6 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-siage-primary"
                  >
                    <mat-icon style="font-size: 18px; width: 18px; height: 18px;">search</mat-icon>
                    <span>Buscar</span>
                  </button>
                </div>
              </div>

              <!-- Tabela de Núcleos e Escolas Vinculados -->
              <div class="border border-siage-border rounded-lg overflow-hidden bg-siage-surface">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="bg-slate-100/70 dark:bg-slate-800/50 border-b border-siage-border text-siage-text-secondary font-semibold">
                      <th class="p-3">
                        <button 
                          type="button" 
                          (click)="toggleSortSubordinadas()"
                          class="inline-flex items-center gap-1.5 hover:text-siage-primary transition-colors cursor-pointer group"
                        >
                          <span>Tipo / Unidade Vinculada</span>
                          <mat-icon style="font-size: 16px; width: 16px; height: 16px;">
                            {{ sortSubDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                          </mat-icon>
                        </button>
                      </th>
                      <th class="p-3">Chefia Imediata</th>
                      <th class="p-3">Unidade de Trabalho (UTB)</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-siage-border/40">
                    @for (sub of paginatedSubordinadas(); track sub.id) {
                      <tr class="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <td class="p-3 font-medium text-siage-text-primary">
                          <span class="text-[10px] uppercase font-bold text-siage-primary block">{{ sub.tipo }}</span>
                          <span class="text-sm font-medium">{{ sub.nome }}</span>
                        </td>
                        <td class="p-3 text-sm text-siage-text-secondary">{{ sub.chefiaImediata }}</td>
                        <td class="p-3 text-sm text-siage-text-secondary">{{ sub.utb }}</td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="3" class="p-6 text-center text-xs text-siage-text-secondary">
                          Nenhum vínculo foi encontrado.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>

                <app-siage-paginator 
                  [length]="filteredSubordinadas().length"
                  [pageIndex]="pageIndex()"
                  [pageSize]="10"
                  (page)="onPageChange($event.pageIndex)"
                />
              </div>
            </div>

            <!-- Card 4: Gestão de Normativas -->
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-6">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">gavel</mat-icon>
                <span>4. Gestão de Normativas</span>
              </h3>

              <!-- BLOCO 1: NORMATIVA DE CRIAÇÃO -->
              <div class="flex flex-col gap-4">
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-emerald-600">verified</mat-icon>
                  <span class="text-xs font-poppins font-bold uppercase tracking-wider text-siage-text-primary">
                    Normativa de Criação
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Nome da Normativa</span>
                    <span class="text-sm font-medium text-siage-text-primary break-words">{{ gr.normativaCriacao.nome }}</span>
                  </div>
                  <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Número da Normativa</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ gr.normativaCriacao.numero }}</span>
                  </div>
                  <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data da Publicação</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ formatarDataParaExibicao(gr.normativaCriacao.dataPublicacao) }}</span>
                  </div>

                  @if (gr.normativaCriacao.documento; as doc) {
                    <div class="col-span-12 border border-siage-border rounded-lg overflow-hidden bg-siage-surface mt-2">
                      <div class="flex items-center justify-between p-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded bg-siage-primary/10 text-siage-primary flex items-center justify-center shrink-0">
                            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">description</mat-icon>
                          </div>
                          <div class="flex flex-col">
                            <span class="text-xs sm:text-sm font-medium text-siage-text-primary">{{ doc.nomeArquivo }}</span>
                            <span class="text-[11px] text-siage-text-secondary">{{ doc.tamanho }} • Enviado em {{ doc.dataUpload }}</span>
                          </div>
                        </div>
                        <div class="flex items-center gap-1">
                          <button 
                            type="button" 
                            (click)="visualizarDoc(doc, 'Normativa de Criação')" 
                            matTooltip="Visualizar anexo" 
                            class="w-8 h-8 rounded text-siage-text-secondary hover:text-siage-primary flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">visibility</mat-icon>
                          </button>
                          <button 
                            type="button" 
                            (click)="baixarDoc(doc)" 
                            matTooltip="Baixar arquivo" 
                            class="w-8 h-8 rounded text-siage-text-secondary hover:text-siage-primary flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">download</mat-icon>
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- BLOCO 2: NORMATIVA DE EXTINÇÃO (SE CADASTRADA) -->
              @if (gr.normativaExtincao && gr.normativaExtincao.documento) {
                <div class="pt-4 border-t border-siage-border/40 flex flex-col gap-4">
                  <div class="flex items-center gap-2">
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-amber-600">history_edu</mat-icon>
                    <span class="text-xs font-poppins font-bold uppercase tracking-wider text-siage-text-primary">
                      Normativa de Extinção
                    </span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
                      <span class="text-xs uppercase text-siage-text-secondary font-semibold">Nome da Normativa</span>
                      <span class="text-sm font-medium text-siage-text-primary break-words">{{ gr.normativaExtincao.nome }}</span>
                    </div>
                    <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                      <span class="text-xs uppercase text-siage-text-secondary font-semibold">Número da Normativa</span>
                      <span class="text-sm font-medium text-siage-text-primary">{{ gr.normativaExtincao.numero }}</span>
                    </div>
                    <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                      <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data da Publicação</span>
                      <span class="text-sm font-medium text-siage-text-primary">{{ formatarDataParaExibicao(gr.normativaExtincao.dataPublicacao) }}</span>
                    </div>

                    @if (gr.normativaExtincao.documento; as docExt) {
                      <div class="col-span-12 border border-siage-border rounded-lg overflow-hidden bg-siage-surface mt-2">
                        <div class="flex items-center justify-between p-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                          <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded bg-siage-primary/10 text-siage-primary flex items-center justify-center shrink-0">
                              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">description</mat-icon>
                            </div>
                            <div class="flex flex-col">
                              <span class="text-xs sm:text-sm font-medium text-siage-text-primary">{{ docExt.nomeArquivo }}</span>
                              <span class="text-[11px] text-siage-text-secondary">{{ docExt.tamanho }} • Enviado em {{ docExt.dataUpload }}</span>
                            </div>
                          </div>
                          <div class="flex items-center gap-1">
                            <button 
                              type="button" 
                              (click)="visualizarDoc(docExt, 'Normativa de Extinção')" 
                              matTooltip="Visualizar anexo" 
                              class="w-8 h-8 rounded text-siage-text-secondary hover:text-siage-primary flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">visibility</mat-icon>
                            </button>
                            <button 
                              type="button" 
                              (click)="baixarDoc(docExt)" 
                              matTooltip="Baixar arquivo" 
                              class="w-8 h-8 rounded text-siage-text-secondary hover:text-siage-primary flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">download</mat-icon>
                            </button>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    }
  `
})
export class GerenciaRegionalView implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly service = inject(GerenciaRegionalService);
  readonly permissionService = inject(PermissionService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  readonly item = signal<GerenciaRegionalItem | undefined>(undefined);

  // Filtros de Núcleos e Escolas vinculados
  readonly filtroNome = new FormControl('');
  readonly filtroUtb = new FormControl('');
  readonly filtroNomeVal = toSignal(this.filtroNome.valueChanges, { initialValue: '' });
  readonly filtroUtbVal = toSignal(this.filtroUtb.valueChanges, { initialValue: '' });
  readonly appliedNome = signal('');
  readonly appliedUtb = signal('');
  readonly pageIndex = signal(0);
  readonly sortSubDirection = signal<'asc' | 'desc'>('asc');

  readonly formatarDataParaExibicao = formatarDataParaExibicao;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const found = this.service.getItem(id);
      if (found) {
        this.item.set(found);
      } else {
        this.toast.error('Gerência Regional não encontrada.');
        this.goBack();
      }
    }
  }

  readonly filteredUtbOptions = computed(() => {
    const subs = this.item()?.subordinadas || [];
    const set = new Set<string>();
    subs.forEach(s => {
      if (s.utb) set.add(s.utb);
    });
    const all = Array.from(set);
    const query = (this.filtroUtbVal() || '').trim().toLowerCase();
    if (!query) return all;
    return all.filter(u => u.toLowerCase().includes(query));
  });

  readonly canBuscar = computed(() => {
    const nome = (this.filtroNomeVal() || '').trim();
    const utb = (this.filtroUtbVal() || '').trim();
    return nome.length > 0 || utb.length > 0;
  });

  readonly filteredSubordinadas = computed(() => {
    let list = this.item()?.subordinadas ? [...this.item()!.subordinadas] : [];
    const nome = this.appliedNome().toLowerCase();
    const utb = this.appliedUtb().toLowerCase();

    if (nome) {
      list = list.filter(s => s.nome.toLowerCase().includes(nome));
    }
    if (utb) {
      list = list.filter(s => s.utb.toLowerCase().includes(utb));
    }

    const dir = this.sortSubDirection() === 'asc' ? 1 : -1;
    list.sort((a, b) => dir * a.nome.localeCompare(b.nome, 'pt-BR'));
    return list;
  });

  readonly paginatedSubordinadas = computed(() => {
    const list = this.filteredSubordinadas();
    const start = this.pageIndex() * 10;
    return list.slice(start, start + 10);
  });

  toggleSortSubordinadas() {
    this.sortSubDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    this.pageIndex.set(0);
  }

  onBuscar() {
    this.appliedNome.set((this.filtroNome.value || '').trim());
    this.appliedUtb.set((this.filtroUtb.value || '').trim());
    this.pageIndex.set(0);
  }

  onLimpar() {
    this.filtroNome.setValue('');
    this.filtroUtb.setValue('');
    this.appliedNome.set('');
    this.appliedUtb.set('');
    this.pageIndex.set(0);
  }

  limparFiltroNome() {
    this.filtroNome.setValue('');
  }

  limparFiltroUtb() {
    this.filtroUtb.setValue('');
  }

  onPageChange(newIndex: number) {
    this.pageIndex.set(newIndex);
  }

  goHome() {
    this.router.navigate(['/inicio']);
  }

  goConfiguracoes() {
    this.router.navigate(['/configuracoes']);
  }

  goHierarquia() {
    this.router.navigate(['/configuracoes/hierarquia']);
  }

  goBack() {
    this.router.navigate(['/configuracoes/hierarquia/gerencia-regional']);
  }

  onEditar() {
    const gr = this.item();
    if (gr) {
      this.router.navigate(['/configuracoes/hierarquia/gerencia-regional', gr.id, 'editar']);
    }
  }

  abrirHistoricoAtos() {
    const gr = this.item();
    const atos = this.service.getHistoricoAtos(gr?.id, gr?.chefeImediato?.atoGovernamental, gr?.chefeImediato?.nome);
    this.dialog.open(HistoricoAtosModal, {
      width: '900px',
      maxWidth: 'calc(100vw - 2.5rem)',
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
      autoFocus: false,
      data: { atos }
    });
  }

  visualizarDoc(doc: DocumentoAnexo, tipo?: string) {
    this.dialog.open(VisualizarDocumentoModal, {
      disableClose: true,
      width: '780px',
      maxWidth: 'calc(100vw - 2.5rem)',
      height: '620px',
      maxHeight: '82vh',
      panelClass: 'siage-pdf-dialog-panel',
      data: {
        documento: doc,
        titulo: 'Visualizar anexo',
        tipoDocumento: tipo
      }
    });
  }

  baixarDoc(doc: DocumentoAnexo) {
    this.toast.success(`Download de "${doc.nomeArquivo}" iniciado.`);
  }
}

// ==========================================
// CAN DEACTIVATE GUARD PARA O FORMULÁRIO
// ==========================================

export const gerenciaRegionalFormDeactivateGuard: CanDeactivateFn<GerenciaRegionalForm> = (
  component: GerenciaRegionalForm
) => {
  return component.canDeactivate();
};

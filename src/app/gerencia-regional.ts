import {STableAction, STableActionEvent, STableSort} from '@siage/siage-ui';
import {from} from 'rxjs';
import {SModalService, SToastService, SFilterCardComponent, STableComponent, STableCellDirective, STableColumn, SFileUploadComponent, SFileError} from '@siage/siage-ui';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import {MatDatepickerIntl} from '@angular/material/datepicker';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormsModule, NgModel} from '@angular/forms';
import {effect} from '@angular/core';
import {SPageHeaderComponent, SFieldComponent, SInputComponent, SIconButtonComponent, SAutocompleteComponent, SSelectComponent, SIconComponent, SSwitchComponent, STooltipDirective, SButtonComponent, SDatepickerComponent, SAutocompleteSelection, SDateAdapter, S_DATE_FORMATS, SDatepickerIntl} from '@siage/siage-ui';
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






import {MatDialogModule, MatDialog} from '@angular/material/dialog';









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
  dataFutura,
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
    AcessoRestritoComponent,
    SPageHeaderComponent,
    SFieldComponent,
    SInputComponent,
    SIconButtonComponent,
    SSelectComponent,
    SSwitchComponent,
    STooltipDirective,
    SButtonComponent,
    FormsModule,
    SFilterCardComponent,
    STableComponent,
    STableCellDirective
  ],
  template: `
    @if (!permissionService.hasAccess()) {
      <app-acesso-restrito backUrl="/configuracoes/hierarquia" />
    } @else {
      <div class="flex flex-col gap-6 max-w-7xl mx-auto w-full font-sans pb-12">
        <!-- Breadcrumb e Cabeçalho Principal -->
        <s-page-header [breadcrumbs]="[{label: 'Início', routerLink: '/inicio'}, {label: 'Configurações', routerLink: '/configuracoes'}, {label: 'Hierarquia de Unidades e Cargos', routerLink: '/configuracoes/hierarquia'}, {label: 'Configurar Gerência Regional'}]" title="Configurar Gerência Regional" description="Gerencie as Gerências Regionais vinculadas às Secretarias Executivas, a vinculação de chefia e suas normativas." showBack (back)="goHierarquia()"><s-button action="" type="button" (click)="onAdicionar()" [disabled]="!permissionService.canCreate()" [sTooltip]="!permissionService.canCreate() ? 'Você não possui permissão para cadastrar Gerência Regional' : 'Adicionar nova Gerência Regional'" icon="add" variant="primary" >

                <span>Adicionar</span>
              </s-button></s-page-header>

        <!-- Card de Filtros -->
        <s-filter-card [form]="filtroCardForm" disableSearchWithoutValue [showActiveFilters]="false" (search)="onBuscar()" (clear)="onLimpar()"><ng-container [formGroup]="filtroForm">
              
              <!-- Filtro: Nome (máximo de 200 caracteres) -->
              <div class="form-field-group">

                <s-field label="Nome" controlId="filter-nome"><s-input type="text" formControlName="nome" [maxlength]="200" placeholder="Buscar por Nome" (keydown.enter)="$event.preventDefault(); canBuscar() &amp;&amp; onBuscar()" (focusout)="filtroForm.controls.nome.markAsTouched(); " />
@if (filtroForm.controls.nome.value) { <s-icon-button icon="close" label="Limpar campo" text size="sm" (click)="limparFiltroNome()" /> }</s-field>
              </div>

              <!-- Filtro: Unidade de Trabalho (UTB) (Select com autocomplete contendo somente UTBs de Gerências Regionais cadastradas) -->
              <div class="form-field-group">

                <s-field label="Unidade de Trabalho (UTB)" controlId="filter-utb"><s-select formControlName="utb" [options]="opcoesfilter_utb()" [clearable]="false" filterable filterPlaceholder="Pesquisar unidade de trabalho..." /></s-field>
              </div>

              <!-- Filtro: Status (Todos, Ativo, Inativo) -->
              <div class="form-field-group">

                <s-field label="Status" controlId="filter-status"><s-select formControlName="status" [options]="[{label: 'Todos', value: 'TODOS'}, {label: 'Ativo', value: 'ATIVO'}, {label: 'Inativo', value: 'INATIVO'}]" [clearable]="false" /></s-field>
              </div>
            </ng-container></s-filter-card>

        <!-- Tabela de Listagem / Estados -->
        <s-table label="Registros" [columns]="colunasVinculos" [actions]="tableActions()" (actionClick)="onTableAction($event)" [rows]="isErro() || isSemRegistros() || isSemResultadoFiltro() ? [] : paginatedItems()" [loading]="isCarregando()" (emptyAction)="simulatorService.setScenario('normal')"
      [empty]="isErro() ? {variant: 'error', title: 'Erro ao carregar dados', description: 'Não foi possível carregar as informações desta funcionalidade. Verifique sua conexão e tente novamente.', actionLabel: 'Tentar novamente'} : isSemRegistros() ? {variant: 'no-results', title: 'Nenhum registro cadastrado', description: 'Ainda não existem gerências regionais cadastradas.', actionLabel: ''} : isSemResultadoFiltro() ? {variant: 'no-results', title: 'Nenhum resultado encontrado', description: 'Nenhum registro corresponde aos filtros aplicados.', actionLabel: ''} : {variant: 'no-results', title: 'Nenhum resultado encontrado', description: 'Nenhum registro corresponde aos filtros aplicados.', actionLabel: ''}"
      [page]="pageIndex() + 1" [pageSize]="pageIndexSize()" [total]="filteredItems().length"
      (pageChange)="pageIndex.set($event - 1)" (pageSizeChange)="pageIndexSize.set($event); pageIndex.set(0)" [sort]="{key: sortColumn() === 'utb' ? 'utbNome' : sortColumn(), direction: sortDirection()}" (sortChange)="onSortChange($event)">
      <ng-template sTableCell="nome" let-item>
                        <span class="font-sans text-sm font-medium text-siage-text-primary leading-tight">{{ item['nome'] }}</span>
                      </ng-template>
<ng-template sTableCell="utbNome" let-item>
                        {{ item['utbNome'] }}
                      </ng-template>
<ng-template sTableCell="criadorEditor" let-item>
                        {{ item['criadorEditor'] }}
                      </ng-template>
<ng-template sTableCell="dataCriacao" let-item>
                        {{ item['dataCriacao'] }}
                      </ng-template>
<ng-template #customActions let-item>@if (permissionService.canCreate()) {<s-switch #chave="ngModel" [ngModel]="item['status'] === 'ATIVO'" [ngModelOptions]="{standalone: true}" [ariaLabel]="item['status'] === 'ATIVO' ? 'Inativar' : 'Ativar'" [sTooltip]="item['status'] === 'ATIVO' ? 'Inativar' : 'Ativar'" (ngModelChange)="onSwitchOficial(item, chave)" />}</ng-template>
    </s-table>
      </div>
    }
  `
})
export class GerenciaRegionalList {
  private readonly modalService = inject(SModalService);
  readonly router = inject(Router);
  readonly service = inject(GerenciaRegionalService);
  readonly secGeralService = inject(SecretariaGeralService);
  readonly permissionService = inject(PermissionService);
  readonly simulatorService = inject(SimulatorService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(SToastService);

  readonly filtroForm = new FormGroup({
    nome: new FormControl(''),
    utb: new FormControl(''),
    status: new FormControl('TODOS')
  });

  readonly filtroNomeVal = toSignal(this.filtroForm.controls.nome.valueChanges, { initialValue: '' });
  readonly filtroUtbVal = toSignal(this.filtroForm.controls.utb.valueChanges, { initialValue: '' });
  readonly filtroStatusVal = toSignal(this.filtroForm.controls.status.valueChanges, { initialValue: 'TODOS' });
  readonly utbTextoDigitado = signal('');

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
        const rawNome = item?.utbNome || codigo;
        const prefix = `${codigo} - `;
        const nomeSemCodigo = rawNome.startsWith(prefix) ? rawNome.slice(prefix.length) : rawNome;
        list.push({
          codigo,
          nome: nomeSemCodigo,
          descricaoCompleta: `${codigo} - ${nomeSemCodigo}`
        });
      }
    }
    return list.sort((a, b) => a.codigo.localeCompare(b.codigo));
  });

  readonly filteredUtbsList = computed(() => {
    const list = this.utbsVinculadas();
    const query = (this.utbTextoDigitado() || this.filtroUtbVal() || '').trim().toLowerCase();
    if (!query) return list;
    return list.filter(u => 
      u.codigo.toLowerCase().includes(query) || 
      u.nome.toLowerCase().includes(query) ||
      `${u.codigo} - ${u.nome}`.toLowerCase().includes(query)
    );
  });

  // Habilita busca se Nome, UTB ou Status diferente de Todos forem preenchidos
  readonly canBuscar = computed(() => {
    this.valoresFiltroOficial();
    const formNome = (this.filtroNomeVal() || '').trim();
    const formUtb = (this.filtroUtbVal() || this.utbTextoDigitado() || '').trim();
    const formStatus = this.filtroStatusVal() || 'TODOS';
    return formNome.length > 0 || formUtb.length > 0 || formStatus !== 'TODOS' || !!this.appliedUtb();
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
    const start = this.pageIndex() * this.pageIndexSize();
    return list.slice(start, start + this.pageIndexSize());
  });

  readonly isSemResultadoFiltro = computed(() => {
    return !this.isSemRegistros() && this.filteredItems().length === 0;
  });

    readonly opcoesfilter_utb = computed(() => [{label: 'Todos', value: ''}, ...this.utbsVinculadas().map(utb => ({label: `${ utb.codigo } - ${ utb.nome }`, value: utb.codigo + ' - ' + utb.nome}))]);
    readonly filtroCardForm = new FormGroup({ativo: new FormControl('')});
  readonly valoresFiltroOficial = toSignal(this.filtroForm.valueChanges, {initialValue: this.filtroForm.value});
  private readonly estadoFiltroOficial = effect(() => {
    const value = this.valoresFiltroOficial();
    const ativo = (value.nome || '').trim() || (value.utb || this.utbTextoDigitado() || '').trim() || value.status !== 'TODOS' || this.appliedUtb() ? '1' : '';
    if (this.filtroCardForm.controls.ativo.value !== ativo) this.filtroCardForm.controls.ativo.setValue(ativo);
  });
  readonly pageIndexSize = signal(10);
  readonly colunasVinculos: readonly STableColumn<GerenciaRegionalItem>[] = [{key: 'nome', label: 'Nome da Gerência Regional', sortable: true},
    {key: 'utbNome', label: 'Unidade de Trabalho (UTB)', sortable: true},
    {key: 'criadorEditor', label: 'Criador/Editor'},
    {key: 'dataCriacao', label: 'Data de Criação', sortable: true},
    {key: 'status', label: 'Status', badge: (item) => ({label: item.status === 'ATIVO' ? 'Ativo' : 'Inativo', tone: item.status === 'ATIVO' ? 'success' : 'secondary'})}];
  readonly tableActions = computed<readonly STableAction<GerenciaRegionalItem>[]>(() => [
    {id: 'view', icon: 'visibility', label: 'Visualizar Gerência Regional'},
    {id: 'edit', icon: 'edit', label: 'Editar Gerência Regional', hidden: item => !this.permissionService.canCreate() || item.status !== 'ATIVO'}
  ]);

  onTableAction(event: STableActionEvent<GerenciaRegionalItem>) {
    if (event.action === 'view') this.onVisualizar(event.row);
    else if (event.action === 'edit') this.onEditar(event.row);
  }

  onSortChange(sort: STableSort | null) {
    if (!sort) {
      this.sortColumn.set('dataCriacao');
      this.sortDirection.set('desc');
    } else {
      this.sortColumn.set(sort.key === 'utbNome' ? 'utb' : sort.key as 'dataCriacao' | 'nome');
      this.sortDirection.set(sort.direction);
    }
    this.pageIndex.set(0);
  }

    readonly estadoFormularioOficial = toSignal(this.filtroForm.valueChanges, {initialValue: this.filtroForm.value});
  onUtbInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    this.utbTextoDigitado.set(target?.value ?? '');
  }

  onUtbSelectionChange(selection: SAutocompleteSelection | null) {
    this.utbTextoDigitado.set(selection?.label ?? '');
  }

  onBuscar() {
    this.appliedNome.set((this.filtroForm.get('nome')?.value || '').trim());
    const rawUtb = (this.filtroForm.get('utb')?.value || this.utbTextoDigitado() || '').trim();
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
    this.utbTextoDigitado.set('');
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
    this.utbTextoDigitado.set('');
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

  onSwitchOficial(item: GerenciaRegionalItem, chave: NgModel) {
    chave.control.setValue(item.status === 'ATIVO', {emitViewToModelChange: false});
    this.onToggleStatus(item, chave);
  }

  onToggleStatus(item: GerenciaRegionalItem, chave?: NgModel) {
    if (item.status === 'INATIVO') {
      // Inativação irreversível: proibir reativação e exibir somente toast explicativo sem modal
      this.toast.warning('A inativação de uma Gerência Regional é irreversível. O registro não pode ser reativado.');
      return;
    }

    // 1. Ao tentar inativar, abrir PRIMEIRAMENTE o modal de confirmação "Inativar registro?"
    const dialogRef = from(this.modalService.confirm({title: 'Inativar registro?', description: `Deseja inativar ${item.nome}? A inativação é irreversível e o registro não poderá ser reativado.`, cancelLabel: 'Cancelar', confirmLabel: 'Sim, inativar', variant: 'destructive'}));

    dialogRef.subscribe((confirmado: boolean) => {
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
        this.modalService.open(ImpedimentoInativacaoModal, {width: '520px',
maxWidth: 'calc(100vw - 2.5rem)',
autoFocus: false,
data: {
            nome: item.nome,
            temNormativaExtincao,
            totalSubordinadas,
            temChefe,
            nomeChefe: item.chefeImediato?.nome,
            unidadesDescricao: 'Núcleos e Escolas',
            totalProfissionais
          }});
        return;
      }

      // 4. Sem outros impedimentos, exigir Normativa de Extinção.
      if (!temNormativaExtincao) {
        const anexarRef = this.modalService.open<AnexarNormativaExtincaoModal, unknown, NormativaItem>(AnexarNormativaExtincaoModal, {width: '560px',
maxWidth: 'calc(100vw - 2.5rem)',
autoFocus: false,
data: {
            nome: item.nome
          }});

        anexarRef.afterClosed().subscribe((normativa: NormativaItem | undefined) => {
          if (normativa) {
            this.service.inativar(item.id, normativa);
            chave?.control.setValue(false, {emitViewToModelChange: false});
            this.toast.success('Registro inativado com sucesso.');
          }
        });
        return;
      }

      // 5. Todos os critérios atendidos: inativação direta
      this.service.inativar(item.id);
            chave?.control.setValue(false, {emitViewToModelChange: false});
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
  providers: [
    {provide: DateAdapter, useClass: SDateAdapter},
    {provide: MAT_DATE_FORMATS, useValue: S_DATE_FORMATS},
    {provide: MAT_DATE_LOCALE, useValue: 'pt-BR'},
    {provide: MatDatepickerIntl, useClass: SDatepickerIntl}
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    AcessoRestritoComponent,
    SFieldComponent,
    SInputComponent,
    SIconButtonComponent,
    SAutocompleteComponent,
    SIconComponent,
    STooltipDirective,
    SButtonComponent,
    SDatepickerComponent,
    SFileUploadComponent,
    STableComponent,
    STableCellDirective
  ,
    SPageHeaderComponent
  ],
  styles: [`
    :host .sg-anexo-com-arquivo {
      flex-wrap: nowrap;
      gap: var(--space-8, 8px);
      min-height: var(--s-field-h, var(--field-h, 48px));
      padding: 0 var(--space-4, 4px) 0 var(--field-px, 16px);
      background: color-mix(in srgb, var(--text-primary) 4%, transparent);
      border-radius: var(--radius-control, 8px);
    }
    :host .sg-anexo-com-arquivo > s-file-upload,
    :host ::ng-deep .sg-anexo-com-arquivo .s-file-upload__arquivo {
      display: contents;
    }
    :host ::ng-deep .sg-anexo-com-arquivo .s-file-upload__icone,
    :host ::ng-deep .sg-anexo-com-arquivo .s-file-upload__nome,
    :host ::ng-deep .sg-anexo-com-arquivo .s-file-upload__tamanho {
      order: -1;
    }
  `],
  template: `
    @if (!permissionService.hasAccess() || (!isEditMode() && !permissionService.canCreate())) {
      <app-acesso-restrito backUrl="/configuracoes/hierarquia/gerencia-regional" />
    } @else {
      <div class="flex flex-col gap-6 max-w-7xl mx-auto w-full font-sans pb-16">
        <!-- Breadcrumb e Cabeçalho Principal -->
        <s-page-header [breadcrumbs]="[{label: 'Início', routerLink: '/inicio'}, {label: 'Configurações', routerLink: '/configuracoes'}, {label: 'Hierarquia de Unidades e Cargos', routerLink: '/configuracoes/hierarquia'}, {label: 'Configurar Gerência Regional', routerLink: '/configuracoes/hierarquia/gerencia-regional'}, {label: isEditMode() ? 'Editar' : 'Cadastrar'}]"
        [title]="isEditMode() ? 'Editar Gerência Regional' : 'Adicionar Gerência Regional'" [description]="isEditMode() ? 'Atualize as informações, chefia e normativas da Gerência Regional.' : 'Preencha os campos obrigatórios para estruturar a Gerência Regional.'"
        showBack (back)="onCancelar()">

      </s-page-header>

        <!-- FORMULÁRIO ORGANIZADO EM SEÇÕES -->
        <form [formGroup]="form" class="flex flex-col gap-6">

          <!-- ============================================== -->
          <!-- SEÇÃO 1: IDENTIFICAÇÃO DA GERÊNCIA REGIONAL    -->
          <!-- ============================================== -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <s-icon name="domain" size="xs"  />
              <span>1. Identificação</span>
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              <!-- Nome da Gerência Regional -->
              <div class="md:col-span-2 form-field-group">

                <s-field label="Nome da Gerência Regional" controlId="form-nome" required [error]="(form.get('nome')?.hasError('required') &amp;&amp; form.get('nome')?.touched) ? 'O Nome da Gerência Regional é obrigatório.' : (form.get('nome')?.hasError('duplicado')) ? 'Já existe uma Gerência Regional cadastrada com este nome.' : ''"><s-input formControlName="nome" [maxlength]="200" placeholder="Digite o Nome da Gerência Regional" (focusout)="form.controls.nome.markAsTouched(); " /></s-field><span align="end" class="text-xs text-siage-text-secondary">
                    {{ (form.get('nome')?.value || '').length }} / 200
                  </span>
              </div>

              <!-- Campo Obrigatório: Secretaria Geral Vinculada -->
              <div class="form-field-group">

                <s-field label="Secretaria Geral" controlId="form-sec-geral" required [error]="((form.get('secretariaGeralId')?.hasError('required') || secGeralInputControl.hasError('required')) &amp;&amp; (form.get('secretariaGeralId')?.touched || secGeralInputControl.touched)) ? 'A Secretaria Geral é obrigatória.' : ''"><s-autocomplete [formControl]="secGeralInputControlOficial" placeholder="Selecione ou busque a Secretaria Geral vinculada" [options]="opcoesform_sec_geral()" (selectionChange)="selecionarform_sec_geral($event)" (input)="secGeralInputControl.setValue($any($event.target).value)" (focusout)="secGeralInputControl.markAsTouched(); " /></s-field>
              </div>

              <!-- Unidade de Trabalho (UTB) -->
              <div class="form-field-group">

                <s-field label="Unidade de Trabalho (UTB)" controlId="form-utb" required [error]="(utbInputControl.hasError('emUso') || form.get('utbCodigo')?.hasError('emUso')) ? 'A Unidade de Trabalho (UTB) selecionada já está vinculada a outra unidade ativa.' : ((form.get('utbCodigo')?.hasError('required') || utbInputControl.hasError('required')) &amp;&amp; (form.get('utbCodigo')?.touched || utbInputControl.touched)) ? 'A Unidade de Trabalho (UTB) é obrigatória.' : ''"><s-autocomplete [formControl]="utbInputControlOficial" placeholder="Selecione ou busque uma unidade de trabalho" [options]="opcoesform_utb()" (selectionChange)="selecionarform_utb($event)" (input)="utbInputControl.setValue($any($event.target).value)" (focusout)="utbInputControl.markAsTouched(); onUtbBlur()" /></s-field>@if (isUtbBloqueada()) {<span class="text-xs text-siage-text-secondary">
                      <span class="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                        <s-icon name="lock" size="xs"  />
                        A Unidade de Trabalho (UTB) não pode ser alterada porque existem chefia ou núcleos e escolas vinculados.
                      </span>
                    </span>}
              </div>
            </div>
          </div>

          <!-- ============================================== -->
          <!-- SEÇÃO 2: CHEFIA IMEDIATA E ATO GOVERNAMENTAL   -->
          <!-- ============================================== -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div class="flex items-center justify-between border-b border-siage-border/40 pb-2 flex-wrap gap-2">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2">
                <s-icon name="badge" size="xs"  />
                <span>2. Chefia Imediata e Ato Governamental</span>
              </h3>

              <!-- Ação de Adicionar Chefe (quando ainda não houver chefe) -->
              @if (!chefeImediato()) {
                <s-button type="button" (click)="abrirBuscaChefe()" [disabled]="!form.get('utbCodigo')?.value" [sTooltip]="!form.get('utbCodigo')?.value ? 'Selecione uma Unidade de Trabalho (UTB) primeiro' : 'Buscar servidor vinculado à UTB'" icon="person_add" variant="primary" >

                  <span>Adicionar Chefe</span>
                </s-button>
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
                    <s-button type="button" (click)="removerChefe()" icon="close" variant="destructive" outlined>

                      <span>Remover Chefe</span>
                    </s-button>
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
                      <s-icon name="description" size="xs" class="text-siage-primary" />
                      <span class="text-xs font-poppins font-bold uppercase tracking-wider text-siage-primary">
                        Ato Governamental de Nomeação *
                      </span>
                    </div>

                    @if (isEditMode()) {
                      <s-button type="button" (click)="abrirHistoricoAtos()" title="Consultar histórico de atos governamentais" icon="history" variant="secondary" outlined>

                        <span>Consultar histórico</span>
                      </s-button>
                    }
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <!-- Número do Ato (limitado a 20 caracteres) -->
                    <div class="form-field-group">

                      <s-field label="Número do Ato Governamental" controlId="form-ato-numero" required [error]="(atoNumeroControl.hasError('required') &amp;&amp; atoNumeroControl.touched) ? 'O Número do Ato Governamental é obrigatório.' : (atoNumeroControl.hasError('maxlength') &amp;&amp; atoNumeroControl.touched) ? 'O Número do Ato Governamental deve ter no máximo 20 caracteres.' : ''"><s-input [formControl]="atoNumeroControl" [maxlength]="20" placeholder="Digite o Número do Ato Governamental" (focusout)="atoNumeroControl.markAsTouched(); " /></s-field>
                    </div>

                    <!-- Data da Publicação -->
                    <div class="form-field-group">
                      <s-field label="Data da Publicação" controlId="form-ato-data" required [error]="atoDataControl.touched &amp;&amp; atoDataControl.invalid ? (atoDataControl.getError('dataFormato') || atoDataControl.getError('dataRange') || 'A Data da Publicação é obrigatória.') : ''"><s-datepicker [formControl]="atoDataPicker.dateControl" [min]="dataMinima" [max]="dataMaxima" [openOnClick]="false" placeholder="DD/MM/AAAA" (input)="atoDataPicker.onInput($event)" (focusout)="atoDataPicker.onFocusOut($event)" /></s-field>
                    </div>
                  </div>

                  <!-- Anexo do Documento do Ato -->
                  <s-field id="container-anexo-ato" label="Documento do Ato Governamental (PDF, JPG, JPEG, PNG até 10 MB)" required [error]="atoDocInvalido() ? 'É obrigatório anexar o documento do Ato Governamental.' : ''" class="flex flex-col gap-2">
      <div class="flex items-center gap-2 flex-wrap" [class.sg-anexo-com-arquivo]="!!atoDocumento()">
        @if (atoDocumento(); as doc) { <s-icon-button icon="visibility" label="Visualizar anexo" text sTooltip="Visualizar anexo" (click)="visualizarDoc(doc, 'Ato Governamental')" /> }
        <s-file-upload appearance="button" buttonLabel="Selecionar arquivo" [formControl]="arquivoAtoControl"
          [fileName]="atoDocumento()?.nomeArquivo" [fileId]="atoDocumento()?.id" [allowDownload]="true"
          [accept]="['pdf', 'jpg', 'jpeg', 'png']" [maxSizeMb]="10" [showErrorDialog]="false"
          (fileSelected)="onFileAtoSelected($event)" (fileRemoved)="removerDocAto()"
          (fileError)="onFileUploadError($event)" (download)="baixarDoc(atoDocumento()!)"  (click)="onCliqueDownloadLocal($event, arquivoAtoControl.value, atoDocumento())" />
      </div>
      @if (!canAnexarAto() && !atoDocumento()) { <span class="text-xs text-siage-text-secondary">Preencha o Número do Ato e a Data da Publicação para habilitar a anexação</span> }
    </s-field>
                </div>
              </div>
            } @else {
              <!-- Estado vazio quando não houver chefe imediato -->
              <div class="py-6 text-center text-xs text-siage-text-secondary border border-dashed border-siage-border rounded-lg flex flex-col items-center justify-center gap-3">
                <span>Nenhum Chefe Imediato vinculado no momento.</span>
                @if (isEditMode()) {
                  <s-button type="button" (click)="abrirHistoricoAtos()" title="Consultar histórico de atos governamentais" icon="history" variant="secondary" outlined>

                    <span>Consultar histórico</span>
                  </s-button>
                }
              </div>
            }
          </div>

          <!-- ============================================== -->
          <!-- SEÇÃO 3: GESTÃO DE NORMATIVAS                  -->
          <!-- ============================================== -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-6">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <s-icon name="gavel" size="xs"  />
              <span>3. Gestão de Normativas</span>
            </h3>

            <!-- BLOCO 1: NORMATIVA DE CRIAÇÃO -->
            <div class="flex flex-col gap-4">
              <div class="flex items-center gap-2">
                <s-icon name="verified" size="xs" class="text-emerald-600" />
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
                    <div class="col-span-12">
                      <div class="sg-anexo-com-arquivo flex items-center gap-2">
                        <s-icon-button icon="visibility" type="button" (click)="visualizarDoc(doc, 'Normativa de Criação')" sTooltip="Visualizar anexo" label="Visualizar anexo" text size="sm" variant="info" />
                      <s-file-upload appearance="button" [fileName]="doc.nomeArquivo" [fileId]="doc.id" [allowDownload]="true" [allowRemove]="false" (download)="baixarDoc(doc)" />
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <!-- Formulário de cadastro de Normativa de Criação -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <!-- Nome da Normativa de Criação -->
                  <div class="md:col-span-3 form-field-group">

                    <s-field label="Nome da Normativa de Criação" controlId="form-norm-criacao-nome" required [error]="(normCriacaoNomeControl.hasError('required') &amp;&amp; normCriacaoNomeControl.touched) ? 'O Nome da Normativa de Criação é obrigatório.' : (normCriacaoNomeControl.hasError('maxlength') &amp;&amp; normCriacaoNomeControl.touched) ? 'O Nome da Normativa de Criação deve ter no máximo 100 caracteres.' : ''"><s-input [formControl]="normCriacaoNomeControl" [maxlength]="100" placeholder="Digite o Nome da Normativa de Criação" (focusout)="normCriacaoNomeControl.markAsTouched(); " /></s-field><span align="end" class="text-xs text-siage-text-secondary">
                        {{ (normCriacaoNomeControl.value || '').length }} / 100
                      </span>
                  </div>

                  <!-- Número da Normativa -->
                  <div class="form-field-group">

                    <s-field label="Número da Normativa de Criação" controlId="form-norm-criacao-numero" required [error]="(normCriacaoNumeroControl.hasError('required') &amp;&amp; normCriacaoNumeroControl.touched) ? 'O Número da Normativa de Criação é obrigatório.' : (normCriacaoNumeroControl.hasError('maxlength') &amp;&amp; normCriacaoNumeroControl.touched) ? 'O Número da Normativa de Criação deve ter no máximo 20 caracteres.' : ''"><s-input [formControl]="normCriacaoNumeroControl" [maxlength]="20" placeholder="Digite o Número da Normativa de Criação" (focusout)="normCriacaoNumeroControl.markAsTouched(); " /></s-field>
                  </div>

                  <!-- Data da Publicação -->
                  <div class="md:col-span-2 form-field-group">
                    <s-field label="Data da Publicação" controlId="form-norm-criacao-data" required [error]="normCriacaoDataControl.touched &amp;&amp; normCriacaoDataControl.invalid ? (normCriacaoDataControl.getError('dataFormato') || normCriacaoDataControl.getError('dataRange') || 'A Data da Publicação é obrigatória.') : ''"><s-datepicker [formControl]="normCriacaoDataPicker.dateControl" [min]="dataMinima" [max]="dataMaxima" [openOnClick]="false" placeholder="DD/MM/AAAA" (input)="normCriacaoDataPicker.onInput($event)" (focusout)="normCriacaoDataPicker.onFocusOut($event)" /></s-field>
                  </div>

                  <!-- Anexo do Documento de Criação -->
                  <s-field id="container-anexo-criacao" label="Documento da Normativa de Criação (PDF, JPG, JPEG, PNG até 10 MB)" required [error]="normCriacaoDocInvalido() ? 'É obrigatório anexar o documento da Normativa de Criação.' : ''" class="md:col-span-3 flex flex-col gap-2">
      <div class="flex items-center gap-2 flex-wrap" [class.sg-anexo-com-arquivo]="!!normCriacaoDoc()">
        @if (normCriacaoDoc(); as doc) { <s-icon-button icon="visibility" label="Visualizar anexo" text sTooltip="Visualizar anexo" (click)="visualizarDoc(doc, 'Normativa de Criação')" /> }
        <s-file-upload appearance="button" buttonLabel="Selecionar arquivo" [formControl]="arquivoCriacaoControl"
          [fileName]="normCriacaoDoc()?.nomeArquivo" [fileId]="normCriacaoDoc()?.id" [allowDownload]="true"
          [accept]="['pdf', 'jpg', 'jpeg', 'png']" [maxSizeMb]="10" [showErrorDialog]="false"
          (fileSelected)="onFileNormCriacaoSelected($event)" (fileRemoved)="removerDocCriacao()"
          (fileError)="onFileUploadError($event)" (download)="baixarDoc(normCriacaoDoc()!)"  (click)="onCliqueDownloadLocal($event, arquivoCriacaoControl.value, normCriacaoDoc())" />
      </div>
      @if (!canAnexarNormCriacao() && !normCriacaoDoc()) { <span class="text-xs text-siage-text-secondary">Preencha o Nome, Número e Data da Publicação para habilitar a anexação</span> }
    </s-field>
                </div>
              }
            </div>

            <!-- BLOCO 2: NORMATIVA DE EXTINÇÃO (OPCIONAL NO CADASTRO, NECESSÁRIA PARA INATIVAÇÃO) -->
            <div class="pt-4 border-t border-siage-border/40 flex flex-col gap-4">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-2">
                  <s-icon name="history_edu" size="xs" class="text-amber-600" />
                  <span class="text-xs font-poppins font-bold uppercase tracking-wider text-siage-text-primary">
                    Normativa de Extinção
                  </span>
                  <span class="text-[11px] text-siage-text-secondary italic font-normal">
                    (Necessária para inativação)
                  </span>
                </div>

                <!-- Botão Adicionar Normativa: quando sem normativa cadastrada e formulário não expandido -->
                @if (!temNormativaExtincao() && !expandindoNormativaExtincao()) {
                  <s-button type="button" (click)="abrirAdicaoNormativaExtincao()" icon="add" variant="secondary" outlined>

                    <span>Adicionar Normativa de Extinção</span>
                  </s-button>
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
                    <div class="col-span-12">
                      <div class="sg-anexo-com-arquivo flex items-center gap-2">
                        <s-icon-button icon="visibility" type="button" (click)="visualizarDoc(doc, 'Normativa de Extinção')" sTooltip="Visualizar anexo" label="Visualizar anexo" text size="sm" variant="info" />
                      <s-file-upload appearance="button" [fileName]="doc.nomeArquivo" [fileId]="doc.id" [allowDownload]="true" [allowRemove]="false" (download)="baixarDoc(doc)" />
                      </div>
                    </div>
                  }
                </div>
              } @else if (expandindoNormativaExtincao()) {
                <!-- Estado 2: Formulário Expandido para preenchimento de Normativa de Extinção -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 border border-siage-border rounded-lg p-4 bg-slate-50/30 dark:bg-slate-900/20">
                  <div class="md:col-span-3 form-field-group">

                    <s-field label="Nome da Normativa de Extinção" controlId="form-norm-ext-nome" required [error]="(normExtincaoNomeControl.hasError('required') &amp;&amp; normExtincaoNomeControl.touched) ? 'O Nome da Normativa de Extinção é obrigatório.' : (normExtincaoNomeControl.hasError('maxlength') &amp;&amp; normExtincaoNomeControl.touched) ? 'O Nome da Normativa de Extinção deve ter no máximo 100 caracteres.' : ''"><s-input [formControl]="normExtincaoNomeControl" [maxlength]="100" placeholder="Digite o Nome da Normativa de Extinção" (focusout)="normExtincaoNomeControl.markAsTouched(); " /></s-field><span align="end" class="text-xs text-siage-text-secondary">
                        {{ (normExtincaoNomeControl.value || '').length }} / 100
                      </span>
                  </div>

                  <div class="form-field-group">

                    <s-field label="Número da Normativa de Extinção" controlId="form-norm-ext-numero" required [error]="(normExtincaoNumeroControl.hasError('required') &amp;&amp; normExtincaoNumeroControl.touched) ? 'O Número da Normativa de Extinção é obrigatório.' : (normExtincaoNumeroControl.hasError('maxlength') &amp;&amp; normExtincaoNumeroControl.touched) ? 'O Número da Normativa de Extinção deve ter no máximo 20 caracteres.' : ''"><s-input [formControl]="normExtincaoNumeroControl" [maxlength]="20" placeholder="Digite o Número da Normativa de Extinção" (focusout)="normExtincaoNumeroControl.markAsTouched(); " /></s-field>
                  </div>

                  <div class="md:col-span-2 form-field-group">
                    <s-field label="Data da Publicação" controlId="form-norm-ext-data" required [error]="normExtincaoDataControl.touched &amp;&amp; normExtincaoDataControl.invalid ? (normExtincaoDataControl.getError('dataFormato') || normExtincaoDataControl.getError('dataRange') || 'A Data da Publicação é obrigatória.') : ''"><s-datepicker [formControl]="normExtincaoDataPicker.dateControl" [min]="dataMinima" [max]="dataMaxima" [openOnClick]="false" placeholder="DD/MM/AAAA" (input)="normExtincaoDataPicker.onInput($event)" (focusout)="normExtincaoDataPicker.onFocusOut($event)" /></s-field>
                  </div>

                  <!-- Anexo da Normativa de Extinção -->
                  <s-field id="container-anexo-extincao" label="Documento da Normativa de Extinção (PDF, JPG, JPEG, PNG até 10 MB)" required [error]="normExtincaoDocInvalido() ? 'É obrigatório anexar o documento da Normativa de Extinção.' : ''" class="md:col-span-3 flex flex-col gap-2">
      <div class="flex items-center gap-2 flex-wrap" [class.sg-anexo-com-arquivo]="!!normExtincaoDoc()">
        @if (normExtincaoDoc(); as doc) { <s-icon-button icon="visibility" label="Visualizar anexo" text sTooltip="Visualizar anexo" (click)="visualizarDoc(doc, 'Normativa de Extinção')" /> }
        <s-file-upload appearance="button" buttonLabel="Selecionar arquivo" [formControl]="arquivoExtincaoControl"
          [fileName]="normExtincaoDoc()?.nomeArquivo" [fileId]="normExtincaoDoc()?.id" [allowDownload]="true"
          [accept]="['pdf', 'jpg', 'jpeg', 'png']" [maxSizeMb]="10" [showErrorDialog]="false"
          (fileSelected)="onFileNormExtincaoSelected($event)" (fileRemoved)="removerDocExtincao()"
          (fileError)="onFileUploadError($event)" (download)="baixarDoc(normExtincaoDoc()!)"  (click)="onCliqueDownloadLocal($event, arquivoExtincaoControl.value, normExtincaoDoc())" />
      </div>
      @if (!canAnexarNormExtincao() && !normExtincaoDoc()) { <span class="text-xs text-siage-text-secondary">Preencha o Nome, Número e Data da Publicação para habilitar a anexação</span> }
    </s-field>

                  <!-- Botões de Ação do Formulário Expandido -->
                  <div class="md:col-span-3 flex items-center justify-end gap-2 pt-2 border-t border-siage-border/40">
                    <s-button type="button" (click)="cancelarAdicaoNormativaExtincao()"  variant="secondary" outlined>
                      Cancelar
                    </s-button>
                    <s-button type="button" (click)="confirmarAdicaoNormativaExtincao()" icon="check" variant="primary" >

                      <span>Adicionar</span>
                    </s-button>
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
                <s-icon name="account_tree" size="xs"  />
                <span>4. Núcleos e Escolas Vinculados</span>
              </h3>

              <!-- Filtros de Subordinadas Vinculadas -->
              <div class="flex flex-col gap-4 pt-1">
                <span class="text-xs font-semibold text-siage-text-secondary">Buscar por:</span>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <!-- Filtro: Nome -->
                  <div class="form-field-group">

                    <s-field label="Nome" controlId="filtro-sub-nome"><s-input type="text" [formControl]="filtroSubordinadaNome" [maxlength]="200" placeholder="Digite o Nome" (keydown.enter)="$event.preventDefault(); canBuscarSubordinadas() &amp;&amp; onBuscarSubordinadas()" (focusout)="filtroSubordinadaNome.markAsTouched(); " />
@if (filtroSubordinadaNome.value) { <s-icon-button icon="close" label="Limpar campo" text size="sm" (click)="limparFiltroSubNome()" /> }</s-field>
                  </div>

                  <!-- Filtro: Unidade de Trabalho (UTB) -->
                  <div class="form-field-group">

                    <s-field label="Unidade de Trabalho (UTB)" controlId="filtro-sub-utb"><s-autocomplete [formControl]="filtroSubordinadaUtb" placeholder="Selecione ou busque uma unidade de trabalho" (keydown.enter)="$event.preventDefault(); canBuscarSubordinadas() &amp;&amp; onBuscarSubordinadas()" [options]="opcoesfiltro_sub_utb()" (input)="onSubUtbInput($event)" (selectionChange)="onSubUtbSelectionChange($event)" (focusout)="filtroSubordinadaUtb.markAsTouched()" /></s-field>
                  </div>
                </div>

                <!-- Botões Buscar e Limpar -->
                <div class="flex items-center justify-end gap-3 pt-3 border-t border-siage-border/40">
                  <s-button type="button" (click)="onLimparSubordinadas()"  variant="primary" >
                    Limpar
                  </s-button>
                  
                  <s-button type="button" (click)="canBuscarSubordinadas() &amp;&amp; onBuscarSubordinadas()" [disabled]="!canBuscarSubordinadas()" [sTooltip]="!canBuscarSubordinadas() ? 'Informe o Nome ou a Unidade de Trabalho (UTB) para realizar a busca' : 'Executar busca'" icon="search" variant="primary" >

                    <span>Buscar</span>
                  </s-button>
                </div>
              </div>

              <!-- Tabela de Subordinadas Vinculadas -->
              <div class="border border-siage-border rounded-lg overflow-hidden bg-siage-surface">
                <s-table label="Unidades vinculadas" [columns]="colunasVinculos" [rows]="paginatedSubordinadas()"
      [empty]="{variant: 'no-results', title: 'Nenhum vínculo foi encontrado.', description: '', actionLabel: ''}"
      [page]="subordinadasPageIndex() + 1" [pageSize]="subordinadasPageIndexSize()" [total]="filteredSubordinadas().length"
      (pageChange)="subordinadasPageIndex.set($event - 1)" (pageSizeChange)="subordinadasPageIndexSize.set($event); subordinadasPageIndex.set(0)" (sortChange)="toggleSortSubordinadas()">
      <ng-template sTableCell="nome" let-sub>
                          <span class="text-[10px] uppercase font-bold text-siage-primary block">{{ sub['tipo'] }}</span>
                          <span class="text-sm font-medium">{{ sub['nome'] }}</span>
                        </ng-template>
<ng-template sTableCell="chefiaImediata" let-sub>{{ sub['chefiaImediata'] }}</ng-template>
<ng-template sTableCell="utb" let-sub>{{ sub['utb'] }}</ng-template>
    </s-table>


              </div>
            </div>
          }

          <!-- RODAPÉ DE AÇÕES DO FORMULÁRIO -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-siage-border/40">
            <s-button type="button" (click)="onCancelar()"  variant="secondary" outlined>
              Cancelar
            </s-button>

            <s-button type="button" (click)="onSalvar()" [disabled]="isSaving()" variant="primary" [icon]="isEditMode() ? 'check' : 'save'" [loading]="isSaving()" loadingText="Salvando...">{{ isEditMode() ? 'Atualizar' : 'Salvar' }}</s-button>
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
  private readonly modalService = inject(SModalService);
  private readonly toastService = inject(SToastService);

  readonly isEditMode = signal(false);
  readonly isSaving = signal(false);
  itemId: string | null = null;
  currentItem: GerenciaRegionalItem | null = null;

  // Unidade de Trabalho e Secretaria Geral
  readonly utbInputControl = new FormControl({ value: '', disabled: true }, [Validators.required]);
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
    this.estadosecGeralInputControl();
    const list = this.secGeralService.items().filter(s => s.status === 'ATIVO');
    const sorted = [...list].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    const query = (this.secGeralInputVal() || this.secGeralInputControl.value || '').trim().toLowerCase();
    if (!query) return sorted;
    return sorted.filter(s => s.nome.toLowerCase().includes(query));
  });

  // Autocomplete de UTBs do sistema
  readonly filteredUtbs = computed(() => {
    this.estadoutbInputControl();
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

  readonly hasSecGeralValida = computed(() => {
    this.estadoFormularioOficial();
    const id = (this.valorsecGeralInputControlOficial() || this.form.controls.secretariaGeralId.value || '').trim();
    return id.length > 0;
  });

  readonly isUtbDesabilitada = computed(() => {
    return this.isUtbBloqueada() || !this.hasSecGeralValida();
  });

  // Mantém a UTB efetivamente travada (não só o aviso) enquanto houver impedimento ou sem Secretaria Geral
  private readonly syncUtbDisableState = effect(() => {
    this.atualizarEstadoUtb();
  });

  private atualizarEstadoUtb() {
    const desabilitada = this.isUtbDesabilitada();
    if (desabilitada) {
      this.utbInputControl.disable({ emitEvent: false });
      this.utbInputControlOficial.disable({ emitEvent: false });
    } else {
      this.utbInputControl.enable({ emitEvent: false });
      this.utbInputControlOficial.enable({ emitEvent: false });
    }
  }

  // Habilita anexação do Ato Governamental apenas se Chefe Imediato selecionado e Número e Data válidos
  readonly canAnexarAto = computed(() => {
    this.estadoatoNumeroControl();
    this.estadoatoDataControl();
    if (!this.chefeImediato()) return false;
    const num = (this.atoNumeroVal() || this.atoNumeroControl.value || '').trim();
    const data = (this.atoDataVal() || this.atoDataControl.value || '').trim();
    return num.length > 0 && num.length <= 20 && data.length > 0 && validarDataFormato(data) && !dataFutura(data);
  });

  // Habilita anexação da Normativa de Criação apenas se Nome, Número e Data válidos
  readonly canAnexarNormCriacao = computed(() => {
    this.estadonormCriacaoNomeControl();
    this.estadonormCriacaoNumeroControl();
    this.estadonormCriacaoDataControl();
    const nome = (this.normCriacaoNomeVal() || this.normCriacaoNomeControl.value || '').trim();
    const num = (this.normCriacaoNumeroVal() || this.normCriacaoNumeroControl.value || '').trim();
    const data = (this.normCriacaoDataVal() || this.normCriacaoDataControl.value || '').trim();
    return nome.length > 0 && nome.length <= 100 && num.length > 0 && num.length <= 20 && data.length > 0 && validarDataFormato(data) && !dataFutura(data);
  });

  // Habilita anexação da Normativa de Extinção apenas se Nome, Número e Data válidos
  readonly canAnexarNormExtincao = computed(() => {
    this.estadonormExtincaoNomeControl();
    this.estadonormExtincaoNumeroControl();
    this.estadonormExtincaoDataControl();
    const nome = (this.normExtincaoNomeVal() || this.normExtincaoNomeControl.value || '').trim();
    const num = (this.normExtincaoNumeroVal() || this.normExtincaoNumeroControl.value || '').trim();
    const data = (this.normExtincaoDataVal() || this.normExtincaoDataControl.value || '').trim();
    return nome.length > 0 && nome.length <= 100 && num.length > 0 && num.length <= 20 && data.length > 0 && validarDataFormato(data) && !dataFutura(data);
  });

  readonly opcoesform_sec_geral = computed(() => {
    const atual = this.valorsecGeralInputControlOficial() || this.form.controls.secretariaGeralId.value;
    const base = this.secGeralService.items()
      .filter(s => s.status === 'ATIVO')
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    const opcoes = base.map(sec => ({label: sec.nome, value: sec.id}));
    if (atual && !opcoes.some(o => o.value === atual)) {
      const selecionada = this.secGeralService.getItem(atual);
      if (selecionada) return [{label: selecionada.nome, value: selecionada.id}, ...opcoes];
      if (this.currentItem && this.currentItem.secretariaGeralId === atual) {
        return [{label: this.currentItem.secretariaGeralNome, value: atual}, ...opcoes];
      }
    }
    return opcoes;
  });
    readonly arquivoAtoControl = new FormControl<File | null>({value: null, disabled: true});
  readonly uploadatoNumeroControl = toSignal(this.atoNumeroControl.valueChanges, {initialValue: this.atoNumeroControl.value});
  readonly uploadatoDataControl = toSignal(this.atoDataControl.valueChanges, {initialValue: this.atoDataControl.value});
  private readonly estadoArquivoAto = effect(() => {
    this.uploadatoNumeroControl();
    this.uploadatoDataControl();
    if (this.canAnexarAto() || this.atoDocumento()) this.arquivoAtoControl.enable({emitEvent: false});
    else this.arquivoAtoControl.disable({emitEvent: false});
    if (!this.atoDocumento() && this.arquivoAtoControl.value) this.arquivoAtoControl.reset(null, {emitEvent: false});
  });
  readonly arquivoCriacaoControl = new FormControl<File | null>({value: null, disabled: true});
  readonly uploadnormCriacaoNomeControl = toSignal(this.normCriacaoNomeControl.valueChanges, {initialValue: this.normCriacaoNomeControl.value});
  readonly uploadnormCriacaoNumeroControl = toSignal(this.normCriacaoNumeroControl.valueChanges, {initialValue: this.normCriacaoNumeroControl.value});
  readonly uploadnormCriacaoDataControl = toSignal(this.normCriacaoDataControl.valueChanges, {initialValue: this.normCriacaoDataControl.value});
  private readonly estadoArquivoCriacao = effect(() => {
    this.uploadnormCriacaoNomeControl();
    this.uploadnormCriacaoNumeroControl();
    this.uploadnormCriacaoDataControl();
    if (this.canAnexarNormCriacao() || this.normCriacaoDoc()) this.arquivoCriacaoControl.enable({emitEvent: false});
    else this.arquivoCriacaoControl.disable({emitEvent: false});
    if (!this.normCriacaoDoc() && this.arquivoCriacaoControl.value) this.arquivoCriacaoControl.reset(null, {emitEvent: false});
  });
  readonly arquivoExtincaoControl = new FormControl<File | null>({value: null, disabled: true});
  readonly uploadnormExtincaoNomeControl = toSignal(this.normExtincaoNomeControl.valueChanges, {initialValue: this.normExtincaoNomeControl.value});
  readonly uploadnormExtincaoNumeroControl = toSignal(this.normExtincaoNumeroControl.valueChanges, {initialValue: this.normExtincaoNumeroControl.value});
  readonly uploadnormExtincaoDataControl = toSignal(this.normExtincaoDataControl.valueChanges, {initialValue: this.normExtincaoDataControl.value});
  private readonly estadoArquivoExtincao = effect(() => {
    this.uploadnormExtincaoNomeControl();
    this.uploadnormExtincaoNumeroControl();
    this.uploadnormExtincaoDataControl();
    if (this.canAnexarNormExtincao() || this.normExtincaoDoc()) this.arquivoExtincaoControl.enable({emitEvent: false});
    else this.arquivoExtincaoControl.disable({emitEvent: false});
    if (!this.normExtincaoDoc() && this.arquivoExtincaoControl.value) this.arquivoExtincaoControl.reset(null, {emitEvent: false});
  });
    readonly estadoutbInputControl = toSignal(this.utbInputControl.valueChanges, {initialValue: this.utbInputControl.value});
  readonly estadosecGeralInputControl = toSignal(this.secGeralInputControl.valueChanges, {initialValue: this.secGeralInputControl.value});
  readonly estadoatoNumeroControl = toSignal(this.atoNumeroControl.valueChanges, {initialValue: this.atoNumeroControl.value});
  readonly estadoatoDataControl = toSignal(this.atoDataControl.valueChanges, {initialValue: this.atoDataControl.value});
  readonly estadonormCriacaoNomeControl = toSignal(this.normCriacaoNomeControl.valueChanges, {initialValue: this.normCriacaoNomeControl.value});
  readonly estadonormCriacaoNumeroControl = toSignal(this.normCriacaoNumeroControl.valueChanges, {initialValue: this.normCriacaoNumeroControl.value});
  readonly estadonormCriacaoDataControl = toSignal(this.normCriacaoDataControl.valueChanges, {initialValue: this.normCriacaoDataControl.value});
  readonly estadonormExtincaoNomeControl = toSignal(this.normExtincaoNomeControl.valueChanges, {initialValue: this.normExtincaoNomeControl.value});
  readonly estadonormExtincaoNumeroControl = toSignal(this.normExtincaoNumeroControl.valueChanges, {initialValue: this.normExtincaoNumeroControl.value});
  readonly estadonormExtincaoDataControl = toSignal(this.normExtincaoDataControl.valueChanges, {initialValue: this.normExtincaoDataControl.value});
  readonly estadofiltroSubordinadaNome = toSignal(this.filtroSubordinadaNome.valueChanges, {initialValue: this.filtroSubordinadaNome.value});
  readonly estadofiltroSubordinadaUtb = toSignal(this.filtroSubordinadaUtb.valueChanges, {initialValue: this.filtroSubordinadaUtb.value});
  readonly estadoFormularioOficial = toSignal(this.form.valueChanges, {initialValue: this.form.value});
  onCliqueDownloadLocal(_event: MouseEvent, _arquivo: File | null, _doc: DocumentoAnexo | undefined) {}
  onFileUploadError(error: SFileError) {
    if (error.kind === 'size') this.toastService.warning('O arquivo excede o limite máximo permitido de 10 MB.');
    else this.toastService.warning('Formato não suportado. Utilize PDF, JPG, JPEG ou PNG.');
  }
  readonly subordinadasPageIndexSize = signal(10);
  readonly colunasVinculos: readonly STableColumn<GerenciaRegionalItem['subordinadas'][number]>[] = [{key: 'nome', label: 'Tipo / Unidade Vinculada', sortable: true},
    {key: 'chefiaImediata', label: 'Chefia Imediata'},
    {key: 'utb', label: 'Unidade de Trabalho (UTB)'}];
  selecionarform_sec_geral(selection: SAutocompleteSelection | null) {
    if (selection) { this.onSecGeralSelected(String(selection.value)); } else { this.limparSecGeral(); }
  }
  readonly secGeralInputControlOficial = new FormControl<string | null>(null);
  private readonly syncsecGeralInputControlOficial = effect(() => {
    this.estadoFormularioOficial();
    this.isUtbBloqueada();
    const nextVal = this.valorsecGeralInputControlOficial() || this.form.controls.secretariaGeralId.value || null;
    if (this.secGeralInputControlOficial.value !== nextVal) {
      this.secGeralInputControlOficial.setValue(nextVal, {emitEvent: false});
    }
    const shouldDisable = this.secGeralInputControl.disabled;
    if (shouldDisable && !this.secGeralInputControlOficial.disabled) {
      this.secGeralInputControlOficial.disable({emitEvent: false});
    } else if (!shouldDisable && this.secGeralInputControlOficial.disabled) {
      this.secGeralInputControlOficial.enable({emitEvent: false});
    }
  });
  readonly valorsecGeralInputControlOficial = toSignal(this.form.controls.secretariaGeralId.valueChanges, {initialValue: this.form.controls.secretariaGeralId.value});
  readonly opcoesform_utb = computed(() => {
    const atual = this.valorutbInputControlOficial() || this.form.controls.utbCodigo.value;
    const opcoes = this.secGeralService.utbs().map(utb => ({label: `${utb.codigo} - ${utb.nome}`, value: utb.codigo}));
    if (atual && !opcoes.some(o => o.value === atual)) {
      const selecionada = this.secGeralService.utbs().find(u => u.codigo === atual);
      if (selecionada) return [{label: `${selecionada.codigo} - ${selecionada.nome}`, value: selecionada.codigo}, ...opcoes];
      if (this.currentItem && this.currentItem.utbCodigo === atual) {
        return [{label: this.currentItem.utbNome, value: atual}, ...opcoes];
      }
    }
    return opcoes;
  });
  selecionarform_utb(selection: SAutocompleteSelection | null) {
    if (selection) { this.onUtbSelected(String(selection.value)); }
  }
  readonly utbInputControlOficial = new FormControl<string | null>({ value: null, disabled: true });
  private readonly syncutbInputControlOficial = effect(() => {
    this.estadoFormularioOficial();
    const shouldDisable = this.isUtbDesabilitada();
    const nextVal = this.valorutbInputControlOficial() || this.form.controls.utbCodigo.value || null;
    if (this.utbInputControlOficial.value !== nextVal) {
      this.utbInputControlOficial.setValue(nextVal, {emitEvent: false});
      if (this.utbInputControl.hasError('emUso') || this.form.get('utbCodigo')?.hasError('emUso')) {
        this.utbInputControlOficial.setErrors({ emUso: true });
      }
    }
    if (shouldDisable && !this.utbInputControlOficial.disabled) {
      this.utbInputControlOficial.disable({emitEvent: false});
    } else if (!shouldDisable && this.utbInputControlOficial.disabled) {
      this.utbInputControlOficial.enable({emitEvent: false});
    }
  });
  readonly valorutbInputControlOficial = toSignal(this.form.controls.utbCodigo.valueChanges, {initialValue: this.form.controls.utbCodigo.value});
  readonly opcoesfiltro_sub_utb = computed(() => {
    const list = this.subordinadasOriginais();
    const set = new Set<string>();
    list.forEach(item => {
      if (item.utb) set.add(item.utb);
    });
    return Array.from(set).map(utb => ({label: utb, value: utb}));
  });
  readonly atoDataPicker = new DataFormulario(this.atoDataControl);
  readonly normCriacaoDataPicker = new DataFormulario(this.normCriacaoDataControl);
  readonly normExtincaoDataPicker = new DataFormulario(this.normExtincaoDataControl);
  readonly dataMinima = new Date(1900, 0, 1);
  readonly dataMaxima = new Date();
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
    this.atualizarEstadoUtb();

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
      const dialogRef = from(this.modalService.confirm({title: 'Tem certeza que deseja cancelar?', description: 'As alterações não salvas serão perdidas.', confirmLabel: 'Sim, cancelar', cancelLabel: 'Não', variant: 'default'}));
      dialogRef.subscribe((confirmado: boolean) => {
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
      this.secGeralInputControlOficial.setValue(found.id, { emitEvent: false });
      this.atualizarEstadoUtb();
    }
  }

  limparSecGeral() {
    this.form.get('secretariaGeralId')?.setValue('');
    this.form.get('secretariaGeralId')?.markAsDirty();
    this.secGeralInputControl.setValue('');
    this.secGeralInputControlOficial.setValue(null, { emitEvent: false });
    this.atualizarEstadoUtb();
  }

  onUtbSelected(codigo: string) {
    if (this.isUtbDesabilitada()) return;
    const utb = this.secGeralService.utbs().find(u => u.codigo === codigo);
    if (!utb) return;

    const currentCodigo = this.form.getRawValue().utbCodigo;
    if (currentCodigo === codigo && !this.utbInputControl.hasError('emUso')) return;

    // Verifica exclusividade da UTB: mantém selecionada e visível com erro até escolher uma UTB válida
    if (this.service.isUtbEmUso(codigo, this.itemId || undefined)) {
      this.form.get('utbCodigo')?.setValue(codigo);
      this.form.get('utbCodigo')?.markAsDirty();
      this.form.get('utbCodigo')?.setErrors({ emUso: true });
      this.form.get('utbCodigo')?.markAsTouched();
      this.utbInputControl.setValue(`${utb.codigo} - ${utb.nome}`, { emitEvent: false });
      this.utbInputControl.setErrors({ emUso: true });
      this.utbInputControl.markAsTouched();
      this.utbInputControlOficial.setValue(codigo, { emitEvent: false });
      this.utbInputControlOficial.setErrors({ emUso: true });
      this.utbInputControlOficial.markAsTouched();
      return;
    }

    const requiresConfirmation = this.isEditMode()
      ? !!currentCodigo
      : !!this.chefeImediato();

    const aplicarNovaUtb = () => {
      this.form.get('utbCodigo')?.setValue(codigo);
      this.form.get('utbCodigo')?.markAsDirty();
      this.form.get('utbCodigo')?.setErrors(null);
      this.utbInputControl.setValue(`${utb.codigo} - ${utb.nome}`, { emitEvent: false });
      this.utbInputControl.setErrors(null);
      this.utbInputControlOficial.setValue(codigo, { emitEvent: false });
      this.utbInputControlOficial.setErrors(null);

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
    const currentCodigo = this.form.getRawValue().utbCodigo;
    const existing = this.secGeralService.utbs().find((u: UtbItem) => u.codigo === currentCodigo);
    const existingLabel = existing
      ? `${existing.codigo} - ${existing.nome}`
      : (this.currentItem && this.currentItem.utbCodigo === currentCodigo ? this.currentItem.utbNome : '');

    const dialogRef = from(this.modalService.confirm({title: 'Alterar Unidade de Trabalho?', description: 'Ao alterar a Unidade de Trabalho (UTB), os vínculos de chefia existentes poderão ser removidos. Deseja continuar?', cancelLabel: 'Não', confirmLabel: 'Sim, alterar', variant: 'default'}));

    dialogRef.subscribe((confirmado: boolean) => {
      this.isHandlingUtbSelection = false;
      if (confirmado) {
        callbackConfirmado();
      } else {
        // Preserva a UTB original e todos os dados vinculados
        this.utbInputControl.setValue(existingLabel, { emitEvent: false });
        this.utbInputControlOficial.setValue(currentCodigo || null, { emitEvent: false });
        if (currentCodigo && this.service.isUtbEmUso(currentCodigo, this.itemId || undefined)) {
          this.form.get('utbCodigo')?.setErrors({ emUso: true });
          this.utbInputControl.setErrors({ emUso: true });
          this.utbInputControlOficial.setErrors({ emUso: true });
        }
      }
    });
  }

  limparUtb() {
    if (this.isUtbDesabilitada()) return;
    const currentCodigo = this.form.getRawValue().utbCodigo;
    if (!currentCodigo && !this.utbInputControl.value) return;

    const requiresConfirmation = this.isEditMode()
      ? !!currentCodigo
      : !!this.chefeImediato();

    const aplicarLimpeza = () => {
      this.form.get('utbCodigo')?.setValue('');
      this.form.get('utbCodigo')?.markAsDirty();
      this.utbInputControl.setValue('');
      this.utbInputControl.setErrors(null);
      this.utbInputControlOficial.setValue(null, { emitEvent: false });
      this.utbInputControlOficial.setErrors(null);
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
    if (this.isUtbDesabilitada()) return;

    const currentSelectedCodigo = this.form.getRawValue().utbCodigo;
    const text = (this.utbInputControl.value || '').trim();
    if (!text) {
      if (currentSelectedCodigo) {
        this.limparUtb();
      }
      return;
    }

    if (currentSelectedCodigo && this.service.isUtbEmUso(currentSelectedCodigo, this.itemId || undefined)) {
      const existing = this.secGeralService.utbs().find(u => u.codigo === currentSelectedCodigo);
      const fallbackLabel = existing ? `${existing.codigo} - ${existing.nome}` : text;
      this.utbInputControl.setValue(fallbackLabel, { emitEvent: false });
      this.utbInputControlOficial.setValue(currentSelectedCodigo, { emitEvent: false });
      this.form.get('utbCodigo')?.setErrors({ emUso: true });
      this.form.get('utbCodigo')?.markAsTouched();
      this.utbInputControl.setErrors({ emUso: true });
      this.utbInputControl.markAsTouched();
      this.utbInputControlOficial.setErrors({ emUso: true });
      this.utbInputControlOficial.markAsTouched();
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
      const fallbackLabel = existing
        ? `${existing.codigo} - ${existing.nome}`
        : (this.currentItem && this.currentItem.utbCodigo === currentSelectedCodigo ? this.currentItem.utbNome : '');
      this.utbInputControl.setValue(fallbackLabel, { emitEvent: false });
      this.utbInputControlOficial.setValue(currentSelectedCodigo, { emitEvent: false });
    } else {
      this.utbInputControl.setValue('');
      this.utbInputControlOficial.setValue(null, { emitEvent: false });
    }
  }

  abrirBuscaChefe() {
    const utbCodigo = this.form.getRawValue().utbCodigo;
    if (!utbCodigo) {
      this.toastService.warning('Selecione primeiro uma Unidade de Trabalho (UTB).');
      return;
    }

    const dialogRef = this.modalService.open<BuscaServidorModal, unknown, ServidorUtbItem>(BuscaServidorModal, {width: '820px',
maxWidth: 'calc(100vw - 2.5rem)',
autoFocus: false,
data: {visualSecretariaGeral: true,
        utbCodigo,
        unidadeNome: 'Gerência Regional'
      }});

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
    const dialogRef = from(this.modalService.confirm({title: 'Remover Chefe Imediato?', description: 'Deseja remover o vínculo da chefia imediata desta Gerência Regional? O Ato Governamental associado também será desvinculado.', cancelLabel: 'Cancelar', confirmLabel: 'Sim, remover', variant: 'destructive'}));

    dialogRef.subscribe((confirmado: boolean) => {
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

    this.modalService.open(HistoricoAtosModal, {width: '900px',
maxWidth: 'calc(100vw - 2.5rem)',
autoFocus: false,
data: {
        atos
      }});
  }

  onFileAtoSelected(event: Event | File | null) {
    if (!event) return;
    if (!this.canAnexarAto()) {
      this.toastService.warning('Preencha os campos obrigatórios do Ato Governamental com valores válidos antes de anexar o documento.');
      return;
    }
    const input = event instanceof File ? null : event.target as HTMLInputElement;
    const file = event instanceof File ? event : input?.files?.[0];
    if (!file) return;

    // Validação de Tamanho (máx 10 MB)
    if (file.size > 10 * 1024 * 1024) {
      this.toastService.warning('O arquivo excede o limite máximo permitido de 10 MB.');
      if (input) input.value = '';
      return;
    }

    // Validação de Extensão (.pdf, .jpg, .jpeg, .png)
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext || '')) {
      this.toastService.warning('Formato não suportado. Utilize PDF, JPG, JPEG ou PNG.');
      if (input) input.value = '';
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
    if (input) input.value = '';
    this.toastService.success(`Documento "${file.name}" anexado com sucesso.`);
  }

  removerDocAto() {
    this.atoDocumento.set(undefined);
  }

  onFileNormCriacaoSelected(event: Event | File | null) {
    if (!event) return;
    if (!this.canAnexarNormCriacao()) {
      this.toastService.warning('Preencha os campos obrigatórios da Normativa de Criação com valores válidos antes de anexar o documento.');
      return;
    }
    const input = event instanceof File ? null : event.target as HTMLInputElement;
    const file = event instanceof File ? event : input?.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.toastService.warning('O arquivo excede o limite máximo permitido de 10 MB.');
      if (input) input.value = '';
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext || '')) {
      this.toastService.warning('Formato não suportado. Utilize PDF, JPG, JPEG ou PNG.');
      if (input) input.value = '';
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
    if (input) input.value = '';
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
    } else if (!validarDataFormato(data) || dataFutura(data)) {
      this.normExtincaoDataControl.setErrors(dataFutura(data) ? { dataRange: 'A data não pode ser futura.' } : { dataFormato: 'Informe uma data válida no formato DD/MM/AAAA.' });
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

  onFileNormExtincaoSelected(event: Event | File | null) {
    if (!event) return;
    if (!this.canAnexarNormExtincao()) {
      this.toastService.warning('Preencha os campos obrigatórios da Normativa de Extinção com valores válidos antes de anexar o documento.');
      return;
    }
    const input = event instanceof File ? null : event.target as HTMLInputElement;
    const file = event instanceof File ? event : input?.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.toastService.warning('O arquivo excede o limite máximo permitido de 10 MB.');
      if (input) input.value = '';
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext || '')) {
      this.toastService.warning('Formato não suportado. Utilize PDF, JPG, JPEG ou PNG.');
      if (input) input.value = '';
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
    if (input) input.value = '';
    this.toastService.success(`Normativa de Extinção "${file.name}" anexada com sucesso.`);
  }

  removerDocExtincao() {
    this.normExtincaoDoc.set(undefined);
  }

  visualizarDoc(doc: DocumentoAnexo, tipo?: string) {
    this.modalService.open(VisualizarDocumentoModal, {disableClose: true,
width: '780px',
maxWidth: 'calc(100vw - 2.5rem)',
data: {
        documento: doc,
        titulo: 'Visualizar anexo',
        tipoDocumento: tipo
      }});
  }

  baixarDoc(_doc: DocumentoAnexo) {}

  // Métodos de Subordinadas (Núcleos e Escolas) no modo edição
  readonly filtroSubUtbTexto = signal('');

  onSubUtbInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    this.filtroSubUtbTexto.set(target?.value ?? '');
  }

  onSubUtbSelectionChange(selection: SAutocompleteSelection | null) {
    this.filtroSubUtbTexto.set(selection?.label ?? '');
  }

  readonly filteredSubUtbsList = computed(() => {
    const list = this.subordinadasOriginais();
    const set = new Set<string>();
    list.forEach(item => {
      if (item.utb) set.add(item.utb);
    });
    const all = Array.from(set);
    const query = (this.filtroSubUtbTexto() || this.filtroSubUtbVal() || '').trim().toLowerCase();
    if (!query) return all;
    return all.filter(u => u.toLowerCase().includes(query));
  });

  readonly canBuscarSubordinadas = computed(() => {
    const nome = (this.filtroSubNomeVal() || '').trim();
    const utb = (this.filtroSubUtbVal() || this.filtroSubUtbTexto() || '').trim();
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
    const start = this.subordinadasPageIndex() * this.subordinadasPageIndexSize();
    return list.slice(start, start + this.subordinadasPageIndexSize());
  });

  toggleSortSubordinadas() {
    this.sortSubDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    this.subordinadasPageIndex.set(0);
  }

  onBuscarSubordinadas() {
    this.appliedSubordinadaNome.set((this.filtroSubordinadaNome.value || '').trim());
    this.appliedSubordinadaUtb.set((this.filtroSubordinadaUtb.value || this.filtroSubUtbTexto() || '').trim());
    this.subordinadasPageIndex.set(0);
  }

  onLimparSubordinadas() {
    this.filtroSubordinadaNome.setValue('');
    this.filtroSubordinadaUtb.setValue('');
    this.filtroSubUtbTexto.set('');
    this.appliedSubordinadaNome.set('');
    this.appliedSubordinadaUtb.set('');
    this.subordinadasPageIndex.set(0);
  }

  limparFiltroSubNome() {
    this.filtroSubordinadaNome.setValue('');
  }

  limparFiltroSubUtb() {
    this.filtroSubordinadaUtb.setValue('');
    this.filtroSubUtbTexto.set('');
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

    const dialogRef = from(this.modalService.confirm({title: 'Tem certeza que deseja cancelar?', description: 'As alterações não salvas serão perdidas.', confirmLabel: 'Sim, cancelar', cancelLabel: 'Não', variant: 'default'}));
    dialogRef.subscribe((confirmado: boolean) => {
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
          el = target.querySelector('input:not([type="file"]), button, [tabindex="0"]') || target;
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
      } else if (!validarDataFormato(extData) || dataFutura(extData)) {
        this.normExtincaoDataControl.setErrors(dataFutura(extData) ? { dataRange: 'A data não pode ser futura.' } : { dataFormato: 'Informe uma data válida no formato DD/MM/AAAA.' });
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
    const utbCodigo = this.form.getRawValue().utbCodigo;

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
      this.utbInputControlOficial.setErrors({ required: true });
      this.utbInputControlOficial.markAsTouched();
      hasError = true;
      if (!firstInvalidId) firstInvalidId = 'form-utb';
    } else if (this.service.isUtbEmUso(utbCodigo, this.itemId || undefined)) {
      this.form.get('utbCodigo')?.setErrors({ emUso: true });
      this.form.get('utbCodigo')?.markAsTouched();
      this.utbInputControl.setErrors({ emUso: true });
      this.utbInputControl.markAsTouched();
      this.utbInputControlOficial.setErrors({ emUso: true });
      this.utbInputControlOficial.markAsTouched();
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
      } else if (!validarDataFormato(atoData) || dataFutura(atoData)) {
        this.atoDataControl.setErrors(dataFutura(atoData) ? { dataRange: 'A data não pode ser futura.' } : { dataFormato: 'Informe uma data válida no formato DD/MM/AAAA.' });
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
      } else if (!validarDataFormato(normCriaData) || dataFutura(normCriaData)) {
        this.normCriacaoDataControl.setErrors(dataFutura(normCriaData) ? { dataRange: 'A data não pode ser futura.' } : { dataFormato: 'Informe uma data válida no formato DD/MM/AAAA.' });
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
    MatDialogModule,
    AcessoRestritoComponent,
    SFieldComponent,
    SInputComponent,
    SIconButtonComponent,
    SAutocompleteComponent,
    SIconComponent,
    STooltipDirective,
    SButtonComponent,
    SFileUploadComponent,
    STableComponent,
    STableCellDirective
  ,
    SPageHeaderComponent
  ],
  styles: [`
    :host .sg-anexo-com-arquivo {
      flex-wrap: nowrap;
      gap: var(--space-8, 8px);
      min-height: var(--s-field-h, var(--field-h, 48px));
      padding: 0 var(--space-4, 4px) 0 var(--field-px, 16px);
      background: color-mix(in srgb, var(--text-primary) 4%, transparent);
      border-radius: var(--radius-control, 8px);
    }
    :host .sg-anexo-com-arquivo > s-file-upload,
    :host ::ng-deep .sg-anexo-com-arquivo .s-file-upload__arquivo {
      display: contents;
    }
    :host ::ng-deep .sg-anexo-com-arquivo .s-file-upload__icone,
    :host ::ng-deep .sg-anexo-com-arquivo .s-file-upload__nome,
    :host ::ng-deep .sg-anexo-com-arquivo .s-file-upload__tamanho {
      order: -1;
    }
  `],
  template: `
    @if (!permissionService.hasAccess()) {
      <app-acesso-restrito backUrl="/configuracoes/hierarquia/gerencia-regional" />
    } @else {
      <div class="flex flex-col gap-6 max-w-7xl mx-auto w-full font-sans pb-16">
        <!-- Breadcrumb e Cabeçalho Principal -->
        <s-page-header [breadcrumbs]="[{label: 'Início', routerLink: '/inicio'}, {label: 'Configurações', routerLink: '/configuracoes'}, {label: 'Hierarquia de Unidades e Cargos', routerLink: '/configuracoes/hierarquia'}, {label: 'Configurar Gerência Regional', routerLink: '/configuracoes/hierarquia/gerencia-regional'}, {label: 'Visualizar'}]"
        title="Visualizar Gerência Regional" description="Consulte as informações, dados de chefia, normativas e núcleos e escolas vinculados da Gerência Regional."
        showBack (back)="goBack()">
        @if (permissionService.canCreate() && item()?.status === 'ATIVO') {<s-button action icon="edit" (click)="onEditar()">Editar</s-button>}
      </s-page-header>

        @if (item(); as gr) {
          <div class="flex flex-col gap-6">

            <!-- Card 1: Identificação da Gerência Regional -->
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <s-icon name="domain" size="xs"  />
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
                <s-icon name="badge" size="xs"  />
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
                        <s-icon name="description" size="xs" class="text-siage-primary" />
                        <span class="text-xs font-poppins font-bold uppercase tracking-wider text-siage-primary">
                          Ato Governamental de Nomeação
                        </span>
                      </div>

                      <s-button type="button" (click)="abrirHistoricoAtos()" title="Consultar histórico de atos governamentais" icon="history" variant="secondary" outlined>

                        <span>Consultar histórico</span>
                      </s-button>
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
                      <div class="sg-anexo-com-arquivo flex items-center gap-2">
                        <s-icon-button icon="visibility" type="button" (click)="visualizarDoc(doc, 'Ato Governamental')" sTooltip="Visualizar anexo" label="Visualizar anexo" text size="sm" variant="info" />
                      <s-file-upload appearance="button" [fileName]="doc.nomeArquivo" [fileId]="doc.id" [allowDownload]="true" [allowRemove]="false" (download)="baixarDoc(doc)" />
                      </div>
                    }
                  </div>
                </div>
              } @else {
                <div class="py-6 text-center text-xs text-siage-text-secondary border border-dashed border-siage-border rounded-lg flex flex-col items-center justify-center gap-3">
                  <span>Nenhum Chefe Imediato vinculado no momento.</span>
                  <s-button type="button" (click)="abrirHistoricoAtos()" title="Consultar histórico de atos governamentais" icon="history" variant="secondary" outlined>

                    <span>Consultar histórico</span>
                  </s-button>
                </div>
              }
            </div>

            <!-- Card 3: Núcleos e Escolas Vinculados -->
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <s-icon name="account_tree" size="xs"  />
                <span>3. Núcleos e Escolas Vinculados</span>
              </h3>

              <!-- Filtros de Subordinadas Vinculadas -->
              <div class="flex flex-col gap-4 pt-1">
                <span class="text-xs font-semibold text-siage-text-secondary">Buscar por:</span>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <!-- Filtro: Nome -->
                  <div class="form-field-group">

                    <s-field label="Nome" controlId="view-filtro-sub-nome"><s-input type="text" [formControl]="filtroNome" [maxlength]="200" placeholder="Digite o Nome" (keydown.enter)="$event.preventDefault(); canBuscar() &amp;&amp; onBuscar()" (focusout)="filtroNome.markAsTouched(); " />
@if (filtroNome.value) { <s-icon-button icon="close" label="Limpar campo" text size="sm" (click)="limparFiltroNome()" /> }</s-field>
                  </div>

                  <!-- Filtro: Unidade de Trabalho (UTB) (Select com autocomplete contendo somente UTBs das subordinadas vinculadas) -->
                  <div class="form-field-group">

                    <s-field label="Unidade de Trabalho (UTB)" controlId="view-filtro-sub-utb"><s-autocomplete [formControl]="filtroUtb" placeholder="Selecione ou busque uma unidade de trabalho" (keydown.enter)="$event.preventDefault(); canBuscar() &amp;&amp; onBuscar()" [options]="opcoesview_filtro_sub_utb()" (input)="onUtbInput($event)" (selectionChange)="onUtbSelectionChange($event)" (focusout)="filtroUtb.markAsTouched()" /></s-field>
                  </div>
                </div>

                <!-- Botões Buscar e Limpar -->
                <div class="flex items-center justify-end gap-3 pt-3 border-t border-siage-border/40">
                  <s-button type="button" (click)="onLimpar()"  variant="primary" >
                    Limpar
                  </s-button>
                  
                  <s-button type="button" (click)="canBuscar() &amp;&amp; onBuscar()" [disabled]="!canBuscar()" [sTooltip]="!canBuscar() ? 'Informe o Nome ou a Unidade de Trabalho (UTB) para realizar a busca' : 'Executar busca'" icon="search" variant="primary" >

                    <span>Buscar</span>
                  </s-button>
                </div>
              </div>

              <!-- Tabela de Núcleos e Escolas Vinculados -->
              <div class="border border-siage-border rounded-lg overflow-hidden bg-siage-surface">
                <s-table label="Unidades vinculadas" [columns]="colunasVinculos" [rows]="paginatedSubordinadas()"
      [empty]="{variant: 'no-results', title: 'Nenhum vínculo foi encontrado.', description: '', actionLabel: ''}"
      [page]="pageIndex() + 1" [pageSize]="pageIndexSize()" [total]="filteredSubordinadas().length"
      (pageChange)="pageIndex.set($event - 1)" (pageSizeChange)="pageIndexSize.set($event); pageIndex.set(0)" (sortChange)="toggleSortSubordinadas()">
      <ng-template sTableCell="nome" let-sub>
                          <span class="text-[10px] uppercase font-bold text-siage-primary block">{{ sub['tipo'] }}</span>
                          <span class="text-sm font-medium">{{ sub['nome'] }}</span>
                        </ng-template>
<ng-template sTableCell="chefiaImediata" let-sub>{{ sub['chefiaImediata'] }}</ng-template>
<ng-template sTableCell="utb" let-sub>{{ sub['utb'] }}</ng-template>
    </s-table>


              </div>
            </div>

            <!-- Card 4: Gestão de Normativas -->
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-6">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <s-icon name="gavel" size="xs"  />
                <span>4. Gestão de Normativas</span>
              </h3>

              <!-- BLOCO 1: NORMATIVA DE CRIAÇÃO -->
              <div class="flex flex-col gap-4">
                <div class="flex items-center gap-2">
                  <s-icon name="verified" size="xs" class="text-emerald-600" />
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
                    <div class="col-span-12">
                      <div class="sg-anexo-com-arquivo flex items-center gap-2">
                        <s-icon-button icon="visibility" type="button" (click)="visualizarDoc(doc, 'Normativa de Criação')" sTooltip="Visualizar anexo" label="Visualizar anexo" text size="sm" variant="info" />
                      <s-file-upload appearance="button" [fileName]="doc.nomeArquivo" [fileId]="doc.id" [allowDownload]="true" [allowRemove]="false" (download)="baixarDoc(doc)" />
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- BLOCO 2: NORMATIVA DE EXTINÇÃO (SE CADASTRADA) -->
              @if (gr.normativaExtincao && gr.normativaExtincao.documento) {
                <div class="pt-4 border-t border-siage-border/40 flex flex-col gap-4">
                  <div class="flex items-center gap-2">
                    <s-icon name="history_edu" size="xs" class="text-amber-600" />
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
                      <div class="col-span-12">
                        <div class="sg-anexo-com-arquivo flex items-center gap-2">
                          <s-icon-button icon="visibility" type="button" (click)="visualizarDoc(docExt, 'Normativa de Extinção')" sTooltip="Visualizar anexo" label="Visualizar anexo" text size="sm" variant="info" />
                      <s-file-upload appearance="button" [fileName]="docExt.nomeArquivo" [fileId]="docExt.id" [allowDownload]="true" [allowRemove]="false" (download)="baixarDoc(docExt)" />
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
  private readonly modalService = inject(SModalService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly service = inject(GerenciaRegionalService);
  readonly permissionService = inject(PermissionService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(SToastService);

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

    readonly opcoesview_filtro_sub_utb = computed(() => {
      const subs = this.item()?.subordinadas || [];
      const set = new Set<string>();
      subs.forEach(s => {
        if (s.utb) set.add(s.utb);
      });
      return Array.from(set).map(utb => ({label: utb, value: utb}));
    });
    readonly pageIndexSize = signal(10);
  readonly colunasVinculos: readonly STableColumn<GerenciaRegionalItem['subordinadas'][number]>[] = [{key: 'nome', label: 'Tipo / Unidade Vinculada', sortable: true},
    {key: 'chefiaImediata', label: 'Chefia Imediata'},
    {key: 'utb', label: 'Unidade de Trabalho (UTB)'}];
    readonly estadofiltroNome = toSignal(this.filtroNome.valueChanges, {initialValue: this.filtroNome.value});
  readonly estadofiltroUtb = toSignal(this.filtroUtb.valueChanges, {initialValue: this.filtroUtb.value});
  readonly filtroUtbTexto = signal('');

  onUtbInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    this.filtroUtbTexto.set(target?.value ?? '');
  }

  onUtbSelectionChange(selection: SAutocompleteSelection | null) {
    this.filtroUtbTexto.set(selection?.label ?? '');
  }

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
    const query = (this.filtroUtbTexto() || this.filtroUtbVal() || '').trim().toLowerCase();
    if (!query) return all;
    return all.filter(u => u.toLowerCase().includes(query));
  });

  readonly canBuscar = computed(() => {
    const nome = (this.filtroNomeVal() || '').trim();
    const utb = (this.filtroUtbVal() || this.filtroUtbTexto() || '').trim();
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
    const start = this.pageIndex() * this.pageIndexSize();
    return list.slice(start, start + this.pageIndexSize());
  });

  toggleSortSubordinadas() {
    this.sortSubDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    this.pageIndex.set(0);
  }

  onBuscar() {
    this.appliedNome.set((this.filtroNome.value || '').trim());
    this.appliedUtb.set((this.filtroUtb.value || this.filtroUtbTexto() || '').trim());
    this.pageIndex.set(0);
  }

  onLimpar() {
    this.filtroNome.setValue('');
    this.filtroUtb.setValue('');
    this.filtroUtbTexto.set('');
    this.appliedNome.set('');
    this.appliedUtb.set('');
    this.pageIndex.set(0);
  }

  limparFiltroNome() {
    this.filtroNome.setValue('');
  }

  limparFiltroUtb() {
    this.filtroUtb.setValue('');
    this.filtroUtbTexto.set('');
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
    this.modalService.open(HistoricoAtosModal, {width: '900px',
maxWidth: 'calc(100vw - 2.5rem)',
autoFocus: false,
data: { atos }});
  }

  visualizarDoc(doc: DocumentoAnexo, tipo?: string) {
    this.modalService.open(VisualizarDocumentoModal, {disableClose: true,
width: '780px',
maxWidth: 'calc(100vw - 2.5rem)',
data: {
        documento: doc,
        titulo: 'Visualizar anexo',
        tipoDocumento: tipo
      }});
  }

  baixarDoc(_doc: DocumentoAnexo) {}
}

// ==========================================
// CAN DEACTIVATE GUARD PARA O FORMULÁRIO
// ==========================================

export const gerenciaRegionalFormDeactivateGuard: CanDeactivateFn<GerenciaRegionalForm> = (
  component: GerenciaRegionalForm
) => {
  return component.canDeactivate();
};

class DataFormulario {
  readonly dateControl = new FormControl<Date | null>(null);
  private digitada = '';
  private atualizando = false;
  private input: HTMLInputElement | null = null;

  constructor(readonly control: FormControl<string | null>) {
    this.aplicarErros(control.value);
    control.valueChanges.pipe(takeUntilDestroyed()).subscribe(value => {
      this.aplicarErros(value);
      if (this.atualizando) return;
      const data = normalizarDataParaBr(value || '');
      const partes = data.split('/').map(Number);
      this.dateControl.setValue(validarDataFormato(data) ? new Date(partes[2], partes[1] - 1, partes[0]) : null, {emitEvent: false});
    });
    this.dateControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(value => {
      this.atualizando = true;
      this.control.setValue(value ? value.toLocaleDateString('pt-BR') : this.digitada);
      this.control.markAsDirty();
      this.atualizando = false;
      this.digitada = '';
    });
  }

  private aplicarErros(valor: string | null) {
    const limpo = (valor || '').trim();
    const erro = !limpo ? {required: true} : !validarDataFormato(limpo) ? {dataFormato: 'Informe uma data válida no formato DD/MM/AAAA.'} : dataFutura(limpo) ? {dataRange: 'A data não pode ser futura.'} : null;
    this.control.setErrors(erro);
    this.dateControl.setErrors(erro);
  }

  onInput(event: Event) {
    this.input = event.target as HTMLInputElement;
    this.digitada = this.input.value;
    this.atualizando = true;
    this.control.setValue(this.digitada);
    this.control.markAsDirty();
    this.atualizando = false;
  }

  onFocusOut(event: FocusEvent) {
    this.control.markAsTouched();
    this.dateControl.markAsTouched();
    this.aplicarErros(this.control.value);
    if (event.target instanceof HTMLInputElement) {
      this.input = event.target;
      if (this.control.value && !validarDataFormato(this.control.value)) {
        this.input.value = this.control.value;
      }
    }
  }
}

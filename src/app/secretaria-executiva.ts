import {from} from 'rxjs';
import {SModalService, SFileUploadComponent, SFileError, STableCellDirective} from '@siage/siage-ui';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import {MatDatepickerIntl} from '@angular/material/datepicker';
import {SIconButtonComponent, SDatepickerComponent, SDateAdapter, S_DATE_FORMATS, SDatepickerIntl} from '@siage/siage-ui';
import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  Injectable,
  effect
} from '@angular/core';
import {Router, ActivatedRoute, CanDeactivateFn} from '@angular/router';
import {FormControl, FormGroup, FormsModule, NgModel, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';






import {MatDialog, MatDialogModule} from '@angular/material/dialog';


import {
  SAutocompleteComponent,
  SAutocompleteSelection,
  SButtonComponent,
  SFieldComponent,
  SFilterCardComponent,
  SIconComponent,
  SInputComponent,
  SPageHeaderComponent,
  SSelectComponent,
  SSwitchComponent,
  STableAction,
  STableActionEvent,
  STableColumn,
  STableComponent,
  STableEmpty,
  STableSort,
  SToastService,
  STooltipDirective,
  S_LOADING_DELAY
} from '@siage/siage-ui';






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

// ==========================================
// INTERFACES E MODELOS DE SECRETARIA EXECUTIVA
// ==========================================

export interface SubordinadaSecretariaExecutivaItem {
  id: string;
  tipo: 'Gerência Executiva' | 'Gerência Regional';
  nome: string;
  chefiaImediata: string;
  utb: string;
}

export interface SecretariaExecutivaItem {
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
  subordinadas: SubordinadaSecretariaExecutivaItem[];
  historicoAtos?: HistoricoAtoItem[];
}

// ==========================================
// SERVIÇO PRINCIPAL — SECRETARIA EXECUTIVA
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class SecretariaExecutivaService {
  private readonly secGeralService = inject(SecretariaGeralService);

  // Lista padrão de Secretarias Executivas com dados consistentes e realistas
  private readonly defaultSecretariasExecutivas: SecretariaExecutivaItem[] = [
    {
      id: 'sub-1',
      nome: 'Secretaria Executiva de Recursos Humanos e Folha',
      secretariaGeralId: '1',
      secretariaGeralNome: 'Secretaria Geral de Governo e Articulação Institucional',
      utbCodigo: 'UTB-003',
      utbNome: 'UTB-003 - Secretaria de Estado da Educação e da Ciência e Tecnologia (SEECT)',
      criadorEditor: 'Mikael Oliveira',
      dataCriacao: '16/01/2024 10:00',
      dataAtualizacao: '15/04/2024 11:20',
      status: 'ATIVO',
      chefeImediato: {
        matricula: '301',
        cpf: '222.333.444-55',
        nome: 'Mariana Albuquerque Feitosa',
        cargo: 'Especialista em Gestão de Pessoas',
        situacaoFuncional: 'Em exercício',
        atoGovernamental: {
          numero: 'Ato nº 1.450/2024',
          dataPublicacao: '16/01/2024',
          documento: {
            id: 'doc-ato-sec-1',
            nomeArquivo: 'ato_1450_2024_nomeacao_executiva.pdf',
            tamanho: '2.1 MB',
            tipo: 'pdf',
            dataUpload: '16/01/2024 10:30'
          }
        }
      },
      normativaCriacao: {
        nome: 'Decreto Estadual nº 42.155/2023 - Criação da Secretaria Executiva de Recursos Humanos',
        numero: '42.155',
        dataPublicacao: '03/01/2023',
        documento: {
          id: 'doc-norm-cria-sec-1',
          nomeArquivo: 'decreto_42155_2023_criacao_rh.pdf',
          tamanho: '3.8 MB',
          tipo: 'pdf',
          dataUpload: '03/01/2023 09:00'
        }
      },
      normativaExtincao: undefined,
      subordinadas: [
        {
          id: 'ge-1',
          tipo: 'Gerência Executiva',
          nome: 'Gerência Executiva de Seleção e Desenvolvimento de Talentos',
          chefiaImediata: 'Luciana Rocha Pinheiro',
          utb: 'UTB-007 - Secretaria Executiva de Gestão e Pessoas (SEGP)'
        },
        {
          id: 'gr-1',
          tipo: 'Gerência Regional',
          nome: 'Gerência Regional de João Pessoa - 1ª Região',
          chefiaImediata: 'Dr. Roberto Sales Bezerra',
          utb: 'UTB-010/JP - Coordenação Regional Metropolitana'
        }
      ],
      historicoAtos: [
        {
          id: 'hist-sub1-1',
          numero: 'Ato nº 2.890/2023',
          chefeImediato: 'Dr. Leonardo Vasconcelos',
          dataPublicacao: '15/02/2023',
          dataImportacao: '15/02/2023 11:20',
          responsavelImportacao: 'Mikael Oliveira',
          documento: {
            id: 'doc-hist-sub1-1',
            nomeArquivo: 'ato_2890_2023_nomeacao.pdf',
            tamanho: '1.7 MB',
            tipo: 'pdf',
            dataUpload: '15/02/2023 11:20'
          }
        }
      ]
    },
    {
      id: 'sub-2',
      nome: 'Secretaria Executiva de Modernização e Tecnologia',
      secretariaGeralId: '1',
      secretariaGeralNome: 'Secretaria Geral de Governo e Articulação Institucional',
      utbCodigo: 'UTB-004',
      utbNome: 'UTB-004 - Secretaria de Estado da Saúde (SES)',
      criadorEditor: 'Mikael Oliveira',
      dataCriacao: '18/01/2024 14:30',
      dataAtualizacao: '10/05/2024 15:40',
      status: 'ATIVO',
      chefeImediato: {
        matricula: '401',
        cpf: '101.202.303-44',
        nome: 'Carlos Eduardo de Morais',
        cargo: 'Diretor de Tecnologia e Informação',
        situacaoFuncional: 'Em exercício',
        atoGovernamental: {
          numero: 'Ato nº 1.510/2024',
          dataPublicacao: '18/01/2024',
          documento: {
            id: 'doc-ato-sec-2',
            nomeArquivo: 'ato_1510_2024_nomeacao_tic.pdf',
            tamanho: '1.9 MB',
            tipo: 'pdf',
            dataUpload: '18/01/2024 15:00'
          }
        }
      },
      normativaCriacao: {
        nome: 'Decreto Estadual nº 42.160/2023 - Estrutura de Tecnologia da Informação do Estado',
        numero: '42.160',
        dataPublicacao: '05/01/2023',
        documento: {
          id: 'doc-norm-cria-sec-2',
          nomeArquivo: 'decreto_42160_2023_estrutura_tic.pdf',
          tamanho: '4.2 MB',
          tipo: 'pdf',
          dataUpload: '05/01/2023 11:20'
        }
      },
      normativaExtincao: undefined,
      subordinadas: [
        {
          id: 'ge-2',
          tipo: 'Gerência Executiva',
          nome: 'Gerência Executiva de Governança Digital e Sistemas',
          chefiaImediata: 'Gabriel Menezes Silva',
          utb: 'UTB-008 - Secretaria Executiva de Inovação e Modernização (SEIM)'
        },
        {
          id: 'gr-2',
          tipo: 'Gerência Regional',
          nome: 'Gerência Regional de Campina Grande - 3ª Região',
          chefiaImediata: 'Patrícia Helena Farias',
          utb: 'UTB-015/CG - Coordenação Regional da Borborema'
        }
      ],
      historicoAtos: []
    },
    {
      id: 'sub-3',
      nome: 'Secretaria Executiva de Planejamento e Gestão Estratégica',
      secretariaGeralId: '1',
      secretariaGeralNome: 'Secretaria Geral de Governo e Articulação Institucional',
      utbCodigo: 'UTB-005',
      utbNome: 'UTB-005 - Secretaria de Estado da Segurança e da Defesa Social (SEDS)',
      criadorEditor: 'Mikael Oliveira',
      dataCriacao: '20/02/2024 09:15',
      dataAtualizacao: undefined,
      status: 'ATIVO',
      chefeImediato: undefined,
      normativaCriacao: {
        nome: 'Decreto Estadual nº 42.180/2023 - Criação da Secretaria Executiva de Planejamento',
        numero: '42.180',
        dataPublicacao: '10/01/2023',
        documento: {
          id: 'doc-norm-cria-sec-3',
          nomeArquivo: 'decreto_42180_2023_planejamento.pdf',
          tamanho: '2.7 MB',
          tipo: 'pdf',
          dataUpload: '10/01/2023 14:00'
        }
      },
      normativaExtincao: undefined,
      subordinadas: [],
      historicoAtos: []
    },
    {
      id: 'sub-4',
      nome: 'Secretaria Executiva de Articulação e Parcerias (Extinta)',
      secretariaGeralId: '1',
      secretariaGeralNome: 'Secretaria Geral de Governo e Articulação Institucional',
      utbCodigo: 'UTB-006',
      utbNome: 'UTB-006 - Secretaria de Estado da Infraestrutura e dos Recursos Hídricos (SEIRH)',
      criadorEditor: 'Mikael Oliveira',
      dataCriacao: '10/03/2022 11:00',
      dataAtualizacao: '28/12/2023 17:00',
      status: 'INATIVO',
      chefeImediato: undefined,
      normativaCriacao: {
        nome: 'Lei Estadual nº 11.450/2022 - Criação da Secretaria Executiva de Articulação',
        numero: '11.450',
        dataPublicacao: '15/03/2022',
        documento: {
          id: 'doc-norm-cria-sec-4',
          nomeArquivo: 'lei_11450_2022_articulacao.pdf',
          tamanho: '3.1 MB',
          tipo: 'pdf',
          dataUpload: '15/03/2022 14:00'
        }
      },
      normativaExtincao: {
        nome: 'Lei Complementar nº 183/2023 - Extinção da Secretaria Executiva de Articulação',
        numero: '183',
        dataPublicacao: '28/12/2023',
        documento: {
          id: 'doc-norm-ext-sec-4',
          nomeArquivo: 'lei_compl_183_2023_extincao.pdf',
          tamanho: '2.0 MB',
          tipo: 'pdf',
          dataUpload: '28/12/2023 16:30'
        }
      },
      subordinadas: [],
      historicoAtos: []
    }
  ];

  // Lista reativa de Secretarias Executivas
  readonly items = signal<SecretariaExecutivaItem[]>(JSON.parse(JSON.stringify(this.defaultSecretariasExecutivas)));

  getItem(id: string): SecretariaExecutivaItem | undefined {
    return this.items().find(i => i.id === id);
  }

  isNomeDuplicado(nome: string, ignoreId?: string): boolean {
    const nomeLimpo = nome.trim().toLowerCase();
    return this.items().some(i => i.nome.trim().toLowerCase() === nomeLimpo && i.id !== ignoreId);
  }

  isUtbEmUso(codigoUtb: string, ignoreId?: string): boolean {
    // Não pode estar em uso por outra Secretaria Executiva ativa
    const emUsoSecExec = this.items().some(i => i.utbCodigo === codigoUtb && i.status === 'ATIVO' && i.id !== ignoreId);
    if (emUsoSecExec) return true;
    // Não pode estar em uso por Secretaria Geral ativa
    const emUsoSecGeral = this.secGeralService.items().some(i => i.utbCodigo === codigoUtb && i.status === 'ATIVO');
    return emUsoSecGeral;
  }

  add(data: Omit<SecretariaExecutivaItem, 'id' | 'criadorEditor' | 'dataCriacao'>): SecretariaExecutivaItem {
    const numericIds = this.items().map(i => {
      const match = i.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const maxId = Math.max(...numericIds, 0);
    const newId = `sub-${maxId + 1}`;
    const now = new Date();
    const dataCriacao = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});

    const newItem: SecretariaExecutivaItem = {
      id: newId,
      ...data,
      criadorEditor: 'Mikael Oliveira',
      dataCriacao,
      historicoAtos: []
    };

    this.items.update(list => [newItem, ...list]);

    // Sincroniza com a Secretaria Geral correspondente
    this.secGeralService.syncAddSecretariaExecutiva({
      id: newItem.id,
      nome: newItem.nome,
      chefiaImediata: newItem.chefeImediato?.nome || '-',
      utb: newItem.utbNome || newItem.utbCodigo,
      secretariaGeralId: newItem.secretariaGeralId
    });

    return newItem;
  }

  update(id: string, data: Partial<SecretariaExecutivaItem>) {
    const now = new Date();
    const dataAtualizacao = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});

    let updatedItem: SecretariaExecutivaItem | undefined;

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

    if (updatedItem) {
      // Sincroniza com a Secretaria Geral
      this.secGeralService.syncUpdateSecretariaExecutiva(id, {
        nome: updatedItem.nome,
        chefiaImediata: updatedItem.chefeImediato?.nome || '-',
        utb: updatedItem.utbNome || updatedItem.utbCodigo,
        secretariaGeralId: updatedItem.secretariaGeralId
      });
    }
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

    // Remove do vínculo ativo na Secretaria Geral
    this.secGeralService.syncInativarSecretariaExecutiva(id);
  }

  syncAddGerenciaExecutiva(ge: { id: string; nome: string; chefiaImediata?: string; utb: string; secretariaExecutivaId: string }) {
    this.items.update(list => list.map(item => {
      if (item.id === ge.secretariaExecutivaId) {
        const existingIdx = item.subordinadas.findIndex(s => s.id === ge.id);
        const subItem: SubordinadaSecretariaExecutivaItem = {
          id: ge.id,
          tipo: 'Gerência Executiva',
          nome: ge.nome,
          chefiaImediata: ge.chefiaImediata || '-',
          utb: ge.utb
        };
        const newSubordinadas = existingIdx >= 0
          ? item.subordinadas.map(s => s.id === ge.id ? subItem : s)
          : [...item.subordinadas, subItem];
        return { ...item, subordinadas: newSubordinadas };
      }
      return item;
    }));
  }

  syncUpdateGerenciaExecutiva(id: string, data: { nome?: string; chefiaImediata?: string; utb?: string; secretariaExecutivaId?: string }) {
    this.items.update(list => list.map(item => {
      if (data.secretariaExecutivaId && item.id !== data.secretariaExecutivaId) {
        return {
          ...item,
          subordinadas: item.subordinadas.filter(s => s.id !== id)
        };
      }
      if (data.secretariaExecutivaId && item.id === data.secretariaExecutivaId) {
        const exists = item.subordinadas.some(s => s.id === id);
        if (exists) {
          return {
            ...item,
            subordinadas: item.subordinadas.map(s => s.id === id ? {
              ...s,
              nome: data.nome ?? s.nome,
              chefiaImediata: data.chefiaImediata ?? s.chefiaImediata,
              utb: data.utb ?? s.utb
            } : s)
          };
        } else {
          return {
            ...item,
            subordinadas: [...item.subordinadas, {
              id,
              tipo: 'Gerência Executiva',
              nome: data.nome || '',
              chefiaImediata: data.chefiaImediata || '-',
              utb: data.utb || ''
            }]
          };
        }
      }
      if (!data.secretariaExecutivaId) {
        return {
          ...item,
          subordinadas: item.subordinadas.map(s => s.id === id ? {
            ...s,
            nome: data.nome ?? s.nome,
            chefiaImediata: data.chefiaImediata ?? s.chefiaImediata,
            utb: data.utb ?? s.utb
          } : s)
        };
      }
      return item;
    }));
  }

  syncInativarGerenciaExecutiva(id: string) {
    this.items.update(list => list.map(item => ({
      ...item,
      subordinadas: item.subordinadas.filter(s => s.id !== id)
    })));
  }

  syncAddGerenciaRegional(gr: { id: string; nome: string; chefiaImediata?: string; utb: string; secretariaExecutivaId: string }) {
    this.items.update(list => list.map(item => {
      if (item.id === gr.secretariaExecutivaId) {
        const existingIdx = item.subordinadas.findIndex(s => s.id === gr.id);
        const subItem: SubordinadaSecretariaExecutivaItem = {
          id: gr.id,
          tipo: 'Gerência Regional',
          nome: gr.nome,
          chefiaImediata: gr.chefiaImediata || '-',
          utb: gr.utb
        };
        const newSubordinadas = existingIdx >= 0
          ? item.subordinadas.map(s => s.id === gr.id ? subItem : s)
          : [...item.subordinadas, subItem];
        return { ...item, subordinadas: newSubordinadas };
      }
      return item;
    }));
  }

  syncUpdateGerenciaRegional(id: string, data: { nome?: string; chefiaImediata?: string; utb?: string; secretariaExecutivaId?: string }) {
    this.items.update(list => list.map(item => {
      if (data.secretariaExecutivaId && item.id !== data.secretariaExecutivaId) {
        return {
          ...item,
          subordinadas: item.subordinadas.filter(s => s.id !== id)
        };
      }
      if (data.secretariaExecutivaId && item.id === data.secretariaExecutivaId) {
        const exists = item.subordinadas.some(s => s.id === id);
        if (exists) {
          return {
            ...item,
            subordinadas: item.subordinadas.map(s => s.id === id ? {
              ...s,
              nome: data.nome ?? s.nome,
              chefiaImediata: data.chefiaImediata ?? s.chefiaImediata,
              utb: data.utb ?? s.utb
            } : s)
          };
        } else {
          return {
            ...item,
            subordinadas: [...item.subordinadas, {
              id,
              tipo: 'Gerência Regional',
              nome: data.nome || '',
              chefiaImediata: data.chefiaImediata || '-',
              utb: data.utb || ''
            }]
          };
        }
      }
      if (!data.secretariaExecutivaId) {
        return {
          ...item,
          subordinadas: item.subordinadas.map(s => s.id === id ? {
            ...s,
            nome: data.nome ?? s.nome,
            chefiaImediata: data.chefiaImediata ?? s.chefiaImediata,
            utb: data.utb ?? s.utb
          } : s)
        };
      }
      return item;
    }));
  }

  syncInativarGerenciaRegional(id: string) {
    this.items.update(list => list.map(item => ({
      ...item,
      subordinadas: item.subordinadas.filter(s => s.id !== id)
    })));
  }

  getHistoricoAtos(secExecId?: string, atoAtual?: AtoGovernamental, nomeChefeAtual?: string): HistoricoAtoItem[] {
    const list: HistoricoAtoItem[] = [];

    // Inclui ato vigente se fornecido e completo
    if (atoAtual && atoAtual.numero && atoAtual.documento) {
      list.push({
        id: `hist-exec-atual-${secExecId || 'new'}`,
        numero: atoAtual.numero,
        chefeImediato: nomeChefeAtual || 'Chefe Imediato Vigente',
        dataPublicacao: atoAtual.dataPublicacao || '16/01/2024',
        dataImportacao: atoAtual.documento.dataUpload || '16/01/2024 10:30',
        responsavelImportacao: 'Mikael Oliveira',
        documento: atoAtual.documento
      });
    }

    if (secExecId) {
      const item = this.getItem(secExecId);
      if (item?.historicoAtos && item.historicoAtos.length > 0) {
        list.push(...item.historicoAtos);
      }
    }

    return list;
  }
}

// ==========================================
// TELA 1: LISTAR SECRETARIA EXECUTIVA
// ==========================================

@Component({
  selector: 'app-secretaria-executiva-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{provide: S_LOADING_DELAY, useValue: 0}],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SAutocompleteComponent,
    SButtonComponent,
    SFieldComponent,
    SFilterCardComponent,
    SInputComponent,
    SPageHeaderComponent,
    SSelectComponent,
    SSwitchComponent,
    STableComponent,
    STooltipDirective,
    AcessoRestritoComponent
  ],
  template: `
    @if (!hasAccess()) {
      <app-acesso-restrito backUrl="/configuracoes/hierarquia" />
    } @else {
      <div class="flex flex-col gap-6 font-sans">
        <s-page-header
          [breadcrumbs]="breadcrumbs"
          title="Configurar Secretaria Executiva"
          description="Gerencie as Secretarias Executivas da estrutura organizacional do SIAGE-RH, a vinculação de chefia e suas normativas."
          showBack
          (back)="goHierarquia()"
        >
          <s-button
            action
            variant="primary"
            icon="add"
            (click)="onAdicionar()"
            [disabled]="!permissionService.canCreate()"
            [sTooltip]="!permissionService.canCreate() ? 'Você não possui permissão para cadastrar Secretaria Executiva' : 'Adicionar nova Secretaria Executiva'"
          >
            Adicionar
          </s-button>
        </s-page-header>

        <!-- Card de Filtros Oficial SIAGE-UI -->
        <s-filter-card
          [form]="filtroBuscaForm"
          disableSearchWithoutValue
          [showActiveFilters]="false"
          (search)="onBuscar()"
          (clear)="onLimpar()"
        >
          <ng-container [formGroup]="filtroForm">
            <!-- Filtro: Nome -->
            <s-field label="Nome" controlId="filter-nome">
              <s-input
                formControlName="nome"
                [maxlength]="200"
                placeholder="Digite o Nome"
              />
            </s-field>

            <!-- Filtro: Unidade de Trabalho (UTB) (Autocomplete oficial) -->
            <s-field label="Unidade de Trabalho (UTB)" controlId="filter-utb">
              <s-autocomplete
                formControlName="utb"
                [options]="utbOptions()"
                placeholder="Selecione ou busque uma unidade de trabalho"
                (input)="onUtbInput($event)"
                (selectionChange)="onUtbSelectionChange($event)"
              />
            </s-field>

            <!-- Filtro: Status (Todos, Ativo, Inativo) -->
            <s-field label="Status" controlId="filter-status">
              <s-select formControlName="status" [options]="statusOptions" [clearable]="false" />
            </s-field>
          </ng-container>
        </s-filter-card>

        <!-- Tabela de Listagem e Estados Oficiais SIAGE-UI -->
        <s-table
          label="Configurar Secretaria Executiva"
          [columns]="tableColumns"
          [rows]="tableRows()"
          [actions]="tableActions()"
          [sort]="tableSort()"
          [loading]="isCarregando()"
          [empty]="tableEmpty()"
          [page]="pageIndex() + 1"
          [pageSize]="pageSize()"
          [total]="tableTotal()"
          (sortChange)="onSortChange($event)"
          (actionClick)="onTableAction($event)"
          (pageChange)="onPageChange($event - 1)"
          (pageSizeChange)="onPageSizeChange($event)"
          (emptyAction)="onEmptyAction()"
        >
          <ng-template #customActions let-item>
            @if (permissionService.canCreate()) {
              <s-switch
                #chave="ngModel"
                [ngModel]="item.status === 'ATIVO'"
                [ngModelOptions]="{standalone: true}"
                [ariaLabel]="item.status === 'ATIVO' ? 'Inativar Secretaria Executiva' : 'Ativar Secretaria Executiva'"
                [sTooltip]="item.status === 'ATIVO' ? 'Inativar' : 'Ativar'"
                (ngModelChange)="onSwitchChange(item, chave)"
              />
            }
          </ng-template>
        </s-table>
      </div>
    }
  `
})
export class SecretariaExecutivaList {
  private readonly modalService = inject(SModalService);
  readonly router = inject(Router);
  readonly service = inject(SecretariaExecutivaService);
  readonly secGeralService = inject(SecretariaGeralService);
  readonly permissionService = inject(PermissionService);
  readonly simulatorService = inject(SimulatorService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(SToastService);

  readonly hasAccess = computed(() => this.permissionService.hasAccess() && this.simulatorService.currentScenario() !== 'access_denied');
  readonly breadcrumbs = [
    {label: 'Início', routerLink: '/inicio'},
    {label: 'Configurações', routerLink: '/configuracoes'},
    {label: 'Hierarquia de Unidades e Cargos', routerLink: '/configuracoes/hierarquia'},
    {label: 'Configurar Secretaria Executiva'}
  ];
  readonly statusOptions = [
    {label: 'Todos', value: 'TODOS'},
    {label: 'Ativo', value: 'ATIVO'},
    {label: 'Inativo', value: 'INATIVO'}
  ];

  readonly filtroForm = new FormGroup({
    nome: new FormControl(''),
    utb: new FormControl(''),
    status: new FormControl('TODOS')
  });
  readonly filtroBuscaForm = new FormGroup({
    ativo: new FormControl('')
  });
  readonly utbTextoDigitado = signal('');

  readonly filtroNomeVal = toSignal(this.filtroForm.controls.nome.valueChanges, { initialValue: '' });
  readonly filtroUtbVal = toSignal(this.filtroForm.controls.utb.valueChanges, { initialValue: '' });
  readonly filtroStatusVal = toSignal(this.filtroForm.controls.status.valueChanges, { initialValue: 'TODOS' });

  // Filtros aplicados
  readonly appliedNome = signal('');
  readonly appliedUtb = signal('');
  readonly appliedStatus = signal('TODOS');

  // Ordenação inicial por Data de Criação decrescente (exatamente como na Secretaria Geral)
  readonly sortColumn = signal<'dataCriacao' | 'nome' | 'utb'>('dataCriacao');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly isCarregando = computed(() => this.simulatorService.currentScenario() === 'loading');
  readonly isErro = computed(() => this.simulatorService.currentScenario() === 'error');

  readonly tableColumns: readonly STableColumn<SecretariaExecutivaItem>[] = [
    {key: 'nome', label: 'Nome da Secretaria Executiva', sortable: true},
    {key: 'utbNome', label: 'Unidade de Trabalho (UTB)', sortable: true},
    {key: 'criadorEditor', label: 'Criador/Editor'},
    {key: 'dataCriacao', label: 'Data de Criação', sortable: true},
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      badge: (item) => ({
        label: item.status === 'ATIVO' ? 'Ativo' : 'Inativo',
        tone: item.status === 'ATIVO' ? 'success' : 'secondary'
      })
    }
  ];

  readonly tableActions = computed<readonly STableAction<SecretariaExecutivaItem>[]>(() => [
    {
      id: 'view',
      icon: 'visibility',
      label: 'Visualizar Secretaria Executiva'
    },
    {
      id: 'edit',
      icon: 'edit',
      label: 'Editar Secretaria Executiva',
      hidden: (item) => !this.permissionService.canCreate() || item.status !== 'ATIVO'
    }
  ]);

  readonly tableSort = computed<STableSort | null>(() => ({
    key: this.sortColumn() === 'utb' ? 'utbNome' : this.sortColumn(),
    direction: this.sortDirection()
  }));

    readonly estadoFormularioOficial = toSignal(this.filtroForm.valueChanges, {initialValue: this.filtroForm.value});
  constructor() {
    this.filtroForm.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.atualizarEstadoBusca();
    });
  }

  private atualizarEstadoBusca() {
    const nome = (this.filtroForm.controls.nome.value ?? '').trim();
    const utb = (this.filtroForm.controls.utb.value ?? this.utbTextoDigitado() ?? '').trim();
    const status = this.filtroForm.controls.status.value ?? 'TODOS';
    const habilitado = nome.length > 0 || utb.length > 0 || status !== 'TODOS' ? '1' : '';
    if (this.filtroBuscaForm.controls.ativo.value !== habilitado) {
      this.filtroBuscaForm.controls.ativo.setValue(habilitado);
    }
  }

  // UTBs únicas associadas exclusivamente às Secretarias Executivas cadastradas
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
        const nomeLimpo = rawNome.startsWith(`${codigo} - `) ? rawNome.slice(`${codigo} - `.length) : rawNome;
        list.push({
          codigo,
          nome: nomeLimpo,
          descricaoCompleta: `${codigo} - ${nomeLimpo}`
        });
      }
    }
    return list.sort((a, b) => a.codigo.localeCompare(b.codigo));
  });

  readonly utbOptions = computed(() =>
    this.utbsVinculadas().map(u => ({
      label: u.descricaoCompleta,
      value: u.descricaoCompleta
    }))
  );

  readonly isSemRegistros = computed(() => {
    if (this.simulatorService.currentScenario() === 'empty') return true;
    if (this.simulatorService.currentScenario() !== 'normal') return false;
    return this.service.items().length === 0 && !this.hasFiltrosAplicados();
  });

  readonly hasFiltrosAplicados = computed(() => {
    return !!this.appliedNome().trim() || !!this.appliedUtb().trim() || this.appliedStatus() !== 'TODOS';
  });

  readonly filteredItems = computed(() => {
    const nome = this.appliedNome().toLowerCase().trim();
    const utb = this.appliedUtb().toLowerCase().trim();
    const status = this.appliedStatus();

    return this.service.items().filter(item => {
      const matchNome = !nome || item.nome.toLowerCase().includes(nome);
      const matchUtb = !utb ||
        item.utbCodigo.toLowerCase().includes(utb) ||
        item.utbNome.toLowerCase().includes(utb);
      let matchStatus = true;
      if (status === 'ATIVO') matchStatus = item.status === 'ATIVO';
      else if (status === 'INATIVO') matchStatus = item.status === 'INATIVO';
      return matchNome && matchUtb && matchStatus;
    });
  });

  readonly sortedItems = computed(() => {
    const list = [...this.filteredItems()];
    const col = this.sortColumn();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;

    return list.sort((a, b) => {
      if (col === 'nome') {
        return dir * a.nome.localeCompare(b.nome, 'pt-BR');
      }
      if (col === 'utb') {
        return dir * a.utbNome.localeCompare(b.utbNome, 'pt-BR');
      }
      return dir * (parseDataBrParaTimestamp(a.dataCriacao) - parseDataBrParaTimestamp(b.dataCriacao));
    });
  });

  readonly isSemResultadoFiltro = computed(() => {
    if (this.simulatorService.currentScenario() === 'no_filter_results') return true;
    if (this.simulatorService.currentScenario() !== 'normal') return false;
    return this.sortedItems().length === 0 && (this.hasFiltrosAplicados() || this.service.items().length > 0);
  });

  readonly tableRows = computed(() => {
    if (this.isCarregando() || this.isErro() || this.isSemRegistros() || this.isSemResultadoFiltro()) {
      return [];
    }
    return this.paginatedItems();
  });

  readonly tableTotal = computed(() => {
    if (this.isCarregando() || this.isErro() || this.isSemRegistros() || this.isSemResultadoFiltro()) {
      return 0;
    }
    return this.sortedItems().length;
  });

  readonly tableEmpty = computed<STableEmpty>(() => {
    if (this.isErro()) {
      return {
        variant: 'error',
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar as informações desta funcionalidade. Verifique sua conexão e tente novamente.',
        actionLabel: 'Tentar novamente'
      };
    }
    if (this.isSemResultadoFiltro()) {
      return {
        variant: 'no-results',
        title: 'Nenhum resultado encontrado',
        description: 'Nenhum registro corresponde aos filtros aplicados.',
        actionLabel: 'Limpar filtros'
      };
    }
    return {
      variant: 'no-data',
      title: 'Nenhum registro cadastrado',
      description: 'Ainda não existem secretarias executivas cadastradas.',
      actionLabel: ''
    };
  });

  onEmptyAction() {
    if (this.isErro()) {
      this.simulatorService.setScenario('normal');
    } else if (this.isSemResultadoFiltro()) {
      if (this.simulatorService.currentScenario() === 'no_filter_results') {
        this.simulatorService.setScenario('normal');
      }
      this.onLimpar();
    }
  }

  readonly paginatedItems = computed(() => {
    const list = this.sortedItems();
    const size = this.pageSize();
    const start = this.pageIndex() * size;
    return list.slice(start, start + size);
  });

  onUtbInput(event: Event) {
    if (event.target instanceof HTMLInputElement) {
      this.utbTextoDigitado.set(event.target.value);
      this.atualizarEstadoBusca();
    }
  }

  onUtbSelectionChange(selection: SAutocompleteSelection<string>) {
    this.utbTextoDigitado.set(selection?.label ?? '');
    this.atualizarEstadoBusca();
  }

  canBuscar(): boolean {
    const nome = (this.filtroNomeVal() ?? this.filtroForm.controls.nome.value ?? '').trim();
    const utb = (this.filtroUtbVal() ?? this.filtroForm.controls.utb.value ?? this.utbTextoDigitado() ?? '').trim();
    const status = this.filtroStatusVal() ?? this.filtroForm.controls.status.value;
    return nome.length > 0 || utb.length > 0 || (!!status && status !== 'TODOS');
  }

  onBuscar() {
    if (!this.canBuscar()) {
      return;
    }
    this.appliedNome.set((this.filtroForm.get('nome')?.value || '').trim());
    this.appliedUtb.set((this.filtroForm.get('utb')?.value || this.utbTextoDigitado() || '').trim());
    this.appliedStatus.set(this.filtroForm.get('status')?.value || 'TODOS');
    this.pageIndex.set(0);
  }

  onLimpar() {
    this.utbTextoDigitado.set('');
    this.filtroForm.reset({nome: '', utb: '', status: 'TODOS'});
    this.atualizarEstadoBusca();
    this.appliedNome.set('');
    this.appliedUtb.set('');
    this.appliedStatus.set('TODOS');
    this.pageIndex.set(0);
  }

  toggleSort(column: 'dataCriacao' | 'nome' | 'utb') {
    if (this.sortColumn() === column) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set(column === 'dataCriacao' ? 'desc' : 'asc');
    }
    this.pageIndex.set(0);
  }

  onSortChange(sort: STableSort | null) {
    if (!sort) {
      if (this.sortColumn() === 'dataCriacao' && this.sortDirection() === 'desc') {
        this.sortDirection.set('asc');
      } else {
        this.sortColumn.set('dataCriacao');
        this.sortDirection.set('desc');
      }
    } else {
      this.sortColumn.set(sort.key === 'utbNome' ? 'utb' : (sort.key as 'dataCriacao' | 'nome'));
      this.sortDirection.set(sort.direction);
    }
    this.pageIndex.set(0);
  }

  onTableAction(event: STableActionEvent<SecretariaExecutivaItem>) {
    if (event.action === 'view') {
      this.onVisualizar(event.row);
    } else if (event.action === 'edit') {
      this.onEditar(event.row);
    }
  }

  onPageChange(newIndex: number) {
    this.pageIndex.set(Math.max(0, newIndex));
  }

  onPageSizeChange(newSize: number) {
    this.pageSize.set(newSize);
    this.pageIndex.set(0);
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
    this.router.navigate(['/configuracoes/hierarquia/secretaria-executiva/novo']);
  }

  // ROTA CORRETA: /configuracoes/hierarquia/secretaria-executiva/:id
  onVisualizar(item: SecretariaExecutivaItem) {
    this.router.navigate(['/configuracoes/hierarquia/secretaria-executiva', item.id]);
  }

  // ROTA CORRETA: /configuracoes/hierarquia/secretaria-executiva/:id/editar
  onEditar(item: SecretariaExecutivaItem) {
    this.router.navigate(['/configuracoes/hierarquia/secretaria-executiva', item.id, 'editar']);
  }

  onToggleStatus(item: SecretariaExecutivaItem, chave?: NgModel) {
    if (item.status === 'ATIVO') {
      this.onInativar(item, chave);
    } else {
      this.onAtivar();
    }
  }

  onSwitchChange(item: SecretariaExecutivaItem, chave: NgModel) {
    this.onToggleStatus(item, chave);
    const atual = item.status === 'ATIVO';
    chave.viewModel = atual;
    chave.control.setValue(atual, {emitViewToModelChange: false});
  }

  onAtivar() {
    // A inativação é irreversível: proibir reativação e exibir somente toast explicativo sem modal
    this.toast.warning('A inativação de uma Secretaria Executiva é irreversível. O registro não pode ser reativado.');
  }

  onInativar(item: SecretariaExecutivaItem, chave?: NgModel) {
    // 1. Ao clicar no switch de um registro ativo, apresentar PRIMEIRO o modal "Inativar registro?"
    const dialogRef = from(this.modalService.confirm({title: 'Inativar registro?', description: `Deseja inativar ${item.nome}? A inativação é irreversível e o registro não poderá ser reativado.`, cancelLabel: 'Cancelar', confirmLabel: 'Sim, inativar', variant: 'destructive'}));

    dialogRef.subscribe((confirmado: boolean) => {
      // Ao clicar em Cancelar ou X, fechar o modal sem alterar o status ou posição do switch
      if (!confirmado) {
        return;
      }

      // 2. Após a confirmação, verificar Chefia Imediata e unidades subordinadas
      const temNormativaExtincao = !!item.normativaExtincao?.documento;
      const totalSubordinadas = item.subordinadas?.length || 0;
      const temChefe = !!item.chefeImediato;
      const temOutrosImpedimentos = totalSubordinadas > 0 || temChefe;

      // 3. Havendo impedimentos, exibir o modal padronizado com os motivos efetivamente encontrados
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
            unidadesDescricao: 'Gerências Executivas e Gerências Regionais'
          }});
        return;
      }

      // 4. Sem outros impedimentos, exigir Normativa de Extinção.
      // 5. Se a normativa estiver ausente, permitir sua anexação durante o fluxo.
      if (!temNormativaExtincao) {
        const anexarRef = this.modalService.open<AnexarNormativaExtincaoModal, unknown, NormativaItem>(AnexarNormativaExtincaoModal, {width: '560px',
maxWidth: 'calc(100vw - 2.5rem)',
autoFocus: false,
data: {
            nome: item.nome
          }});

        anexarRef.afterClosed().subscribe((normativa?: NormativaItem) => {
          if (normativa) {
            // 6. Concluir a inativação após anexação válida, sem exigir uma segunda confirmação
            this.service.inativar(item.id, normativa);
            chave?.control.setValue(false, {emitViewToModelChange: false});
            this.toast.success('Registro inativado com sucesso.');
          }
        });
        return;
      }

      // Se a normativa já estiver anexada e não houver impedimentos, concluir diretamente
      this.service.inativar(item.id);
      chave?.control.setValue(false, {emitViewToModelChange: false});
      this.toast.success('Registro inativado com sucesso.');
    });
  }
}

// ==========================================
// TELA 2: FORMULÁRIO (ADICIONAR / EDITAR)
// ==========================================

@Component({
  selector: 'app-secretaria-executiva-form',
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
    SIconComponent,
    AcessoRestritoComponent,
    SPageHeaderComponent,
    SFieldComponent,
    SInputComponent,
    SAutocompleteComponent,
    SIconButtonComponent,
    SDatepickerComponent,
    SButtonComponent,
    STooltipDirective,
    SFileUploadComponent,
    STableComponent,
    STableCellDirective
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
    @if (!permissionService.canCreate()) {
      <app-acesso-restrito backUrl="/configuracoes/hierarquia/secretaria-executiva" />
    } @else {
      <div class="flex flex-col gap-6 max-w-7xl mx-auto w-full font-sans pb-16">
        <!-- Breadcrumb e Cabeçalho Principal -->
        <s-page-header [breadcrumbs]="[{label: 'Início', routerLink: '/inicio'}, {label: 'Configurações', routerLink: '/configuracoes'}, {label: 'Hierarquia de Unidades e Cargos', routerLink: '/configuracoes/hierarquia'}, {label: 'Configurar Secretaria Executiva', routerLink: '/configuracoes/hierarquia/secretaria-executiva'}, {label: isEditMode() ? 'Editar' : 'Cadastrar'}]" title="{{ isEditMode() ? 'Editar Secretaria Executiva' : 'Adicionar Secretaria Executiva' }}" description="{{ isEditMode() ? 'Atualize as informações, chefia e normativas da Secretaria Executiva.' : 'Preencha os campos obrigatórios para estruturar a Secretaria Executiva.' }}" showBack (back)="onCancelar()"></s-page-header>

        <!-- FORMULÁRIO ORGANIZADO EM SEÇÕES -->
        <form [formGroup]="form" class="flex flex-col gap-6">

          <!-- ============================================== -->
          <!-- SEÇÃO 1: IDENTIFICAÇÃO DA SECRETARIA           -->
          <!-- ============================================== -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <s-icon name="domain" size="xs" />
              <span>1. Identificação</span>
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              <!-- Nome da Secretaria Executiva -->
              <div class="md:col-span-2 form-field-group">

                <s-field label="Nome da Secretaria Executiva" controlId="form-nome" required [error]="(form.get('nome')?.hasError('required') &amp;&amp; form.get('nome')?.touched) ? 'O Nome da Secretaria Executiva é obrigatório.' : (form.get('nome')?.hasError('duplicado')) ? 'Já existe uma Secretaria Executiva cadastrada com este nome.' : ''"><s-input formControlName="nome" [maxlength]="200" placeholder="Digite o Nome da Secretaria Executiva" (focusout)="form.controls.nome.markAsTouched(); " /></s-field><span align="end" class="text-xs text-siage-text-secondary">
                    {{ (form.get('nome')?.value || '').length }} / 200
                  </span>
              </div>

              <!-- Campo Obrigatório Adicional: Secretaria Geral Vinculada -->
              <div class="form-field-group">

                <s-field label="Secretaria Geral" controlId="form-sec-geral" required [error]="((form.get('secretariaGeralId')?.hasError('required') || secGeralInputControl.hasError('required')) &amp;&amp; (form.get('secretariaGeralId')?.touched || secGeralInputControl.touched)) ? 'A Secretaria Geral é obrigatória.' : ''"><s-autocomplete [formControl]="secGeralInputControlOficial" placeholder="Selecione ou busque a Secretaria Geral vinculada" [options]="opcoesform_sec_geral()" (selectionChange)="selecionarform_sec_geral($event)" (input)="secGeralInputControl.setValue($any($event.target).value)" (focusout)="secGeralInputControl.markAsTouched(); onSecGeralBlur()" /></s-field>
              </div>

              <!-- Unidade de Trabalho (UTB) -->
              <div class="form-field-group">

                <s-field label="Unidade de Trabalho (UTB)" controlId="form-utb" required [error]="(utbInputControl.hasError('emUso') || form.get('utbCodigo')?.hasError('emUso')) ? 'A Unidade de Trabalho (UTB) selecionada já está vinculada a outra unidade ativa.' : ((form.get('utbCodigo')?.hasError('required') || utbInputControl.hasError('required')) &amp;&amp; (form.get('utbCodigo')?.touched || utbInputControl.touched)) ? 'A Unidade de Trabalho (UTB) é obrigatória.' : ''"><s-autocomplete [formControl]="utbInputControlOficial" placeholder="Selecione ou busque uma unidade de trabalho" [options]="opcoesform_utb()" (selectionChange)="selecionarform_utb($event)" (input)="utbInputControl.setValue($any($event.target).value)" (focusout)="utbInputControl.markAsTouched(); onUtbBlur()" /></s-field>@if (isUtbBloqueada()) {<span class="text-xs text-siage-text-secondary">
                      <span class="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                        <s-icon name="lock" size="xs"  />
                        A Unidade de Trabalho (UTB) não pode ser alterada porque existem chefia ou unidades subordinadas vinculadas.
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
                <s-button type="button" (click)="abrirBuscaChefe()" [disabled]="!form.get('utbCodigo')?.value || utbInputControl.hasError('emUso') || !!form.get('utbCodigo')?.hasError('emUso')" [sTooltip]="(!form.get('utbCodigo')?.value || utbInputControl.hasError('emUso') || !!form.get('utbCodigo')?.hasError('emUso')) ? 'Selecione uma Unidade de Trabalho (UTB) primeiro' : 'Buscar servidor vinculado à UTB'" icon="person_add" variant="primary" >

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
                    <!-- Número do Ato (limitado a 20 caracteres conforme padrão) -->
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
        @if (atoDocumento(); as doc) { <s-icon-button icon="visibility" label="Visualizar anexo" text size="sm" variant="info" sTooltip="Visualizar anexo" (click)="visualizarDoc(doc, 'Ato Governamental')" /> }
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
                <p>Nenhum Chefe Imediato vinculado no momento. Selecione uma Unidade de Trabalho (UTB) e clique em "Adicionar Chefe".</p>
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

            <!-- BLOCO 1: NORMATIVA DE CRIAÇÃO (OBRIGATÓRIA) -->
            <div class="flex flex-col gap-4">
              <div class="flex items-center gap-2">
                <s-icon name="verified" size="xs" class="text-emerald-600" />
                <span class="text-xs font-poppins font-bold uppercase tracking-wider text-siage-text-primary">
                  Normativa de Criação@if (!isEditMode()) { <span class="text-red-500">*</span>}
                </span>
              </div>

              <!-- No modo de edição: Somente Leitura (conforme padrão aprovado) -->
              @if (isEditMode()) {
                <div class="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-lg border border-siage-border/60">
                  <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Nome da Normativa</span>
                    <span class="text-sm font-medium text-siage-text-primary break-words">{{ normCriacaoNomeControl.value }}</span>
                  </div>
                  <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Número da Normativa</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ normCriacaoNumeroControl.value }}</span>
                  </div>
                  <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data da Publicação</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ formatarDataParaExibicao(normCriacaoDataControl.value) }}</span>
                  </div>

                  @if (normCriacaoDoc(); as doc) {
                    <div class="col-span-12 flex items-center gap-2 sg-anexo-com-arquivo">
                      <s-icon-button icon="visibility" type="button" (click)="visualizarDoc(doc, 'Normativa de Criação')" sTooltip="Visualizar anexo" label="Visualizar anexo" text size="sm" variant="info" />
                      <s-file-upload appearance="button" [fileName]="doc.nomeArquivo" [fileId]="doc.id" [allowDownload]="true" [allowRemove]="false" (download)="baixarDoc(doc)" />
                    </div>
                  }
                </div>
              } @else {
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="md:col-span-3 form-field-group">

                    <s-field label="Nome da Normativa de Criação" controlId="form-norm-criacao-nome" required [error]="(normCriacaoNomeControl.hasError('required') &amp;&amp; normCriacaoNomeControl.touched) ? 'O Nome da Normativa de Criação é obrigatório.' : (normCriacaoNomeControl.hasError('maxlength') &amp;&amp; normCriacaoNomeControl.touched) ? 'O Nome da Normativa de Criação deve ter no máximo 100 caracteres.' : ''"><s-input [formControl]="normCriacaoNomeControl" [maxlength]="100" placeholder="Digite o Nome da Normativa de Criação" (focusout)="normCriacaoNomeControl.markAsTouched(); " /></s-field><span align="end" class="text-xs text-siage-text-secondary">
                        {{ (normCriacaoNomeControl.value || '').length }} / 100
                      </span>
                  </div>

                  <div class="form-field-group">

                    <s-field label="Número da Normativa" controlId="form-norm-criacao-numero" required [error]="(normCriacaoNumeroControl.hasError('required') &amp;&amp; normCriacaoNumeroControl.touched) ? 'O Número da Normativa de Criação é obrigatório.' : (normCriacaoNumeroControl.hasError('maxlength') &amp;&amp; normCriacaoNumeroControl.touched) ? 'O Número da Normativa de Criação deve ter no máximo 20 caracteres.' : ''"><s-input [formControl]="normCriacaoNumeroControl" [maxlength]="20" placeholder="Digite o Número da Normativa" (focusout)="normCriacaoNumeroControl.markAsTouched(); " /></s-field>
                  </div>

                  <div class="form-field-group">
                    <s-field label="Data da Publicação" controlId="form-norm-criacao-data" required [error]="normCriacaoDataControl.touched &amp;&amp; normCriacaoDataControl.invalid ? (normCriacaoDataControl.getError('dataFormato') || normCriacaoDataControl.getError('dataRange') || 'A Data da Publicação é obrigatória.') : ''"><s-datepicker [formControl]="normCriacaoDataPicker.dateControl" [min]="dataMinima" [max]="dataMaxima" [openOnClick]="false" placeholder="DD/MM/AAAA" (input)="normCriacaoDataPicker.onInput($event)" (focusout)="normCriacaoDataPicker.onFocusOut($event)" /></s-field>
                  </div>

                  <!-- Anexo do Documento de Criação -->
                  <s-field id="container-anexo-criacao" label="Documento da Normativa de Criação (PDF, JPG, JPEG, PNG até 10 MB)" required [error]="normCriacaoDocInvalido() ? 'É obrigatório anexar o documento da Normativa de Criação.' : ''" class="md:col-span-3 flex flex-col gap-2">
      <div class="flex items-center gap-2 flex-wrap" [class.sg-anexo-com-arquivo]="!!normCriacaoDoc()">
        @if (normCriacaoDoc(); as doc) { <s-icon-button icon="visibility" label="Visualizar anexo" text size="sm" variant="info" sTooltip="Visualizar anexo" (click)="visualizarDoc(doc, 'Normativa de Criação')" /> }
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
                    <div class="col-span-12 flex items-center gap-2 sg-anexo-com-arquivo">
                      <s-icon-button icon="visibility" type="button" (click)="visualizarDoc(doc, 'Normativa de Extinção')" sTooltip="Visualizar anexo" label="Visualizar anexo" text size="sm" variant="info" />
                      <s-file-upload appearance="button" [fileName]="doc.nomeArquivo" [fileId]="doc.id" [allowDownload]="true" [allowRemove]="false" (download)="baixarDoc(doc)" />
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

                    <s-field label="Número da Normativa" controlId="form-norm-ext-numero" required [error]="(normExtincaoNumeroControl.hasError('required') &amp;&amp; normExtincaoNumeroControl.touched) ? 'O Número da Normativa de Extinção é obrigatório.' : (normExtincaoNumeroControl.hasError('maxlength') &amp;&amp; normExtincaoNumeroControl.touched) ? 'O Número da Normativa de Extinção deve ter no máximo 20 caracteres.' : ''"><s-input [formControl]="normExtincaoNumeroControl" [maxlength]="20" placeholder="Digite o Número da Normativa" (focusout)="normExtincaoNumeroControl.markAsTouched(); " /></s-field>
                  </div>

                  <div class="form-field-group">
                    <s-field label="Data da Publicação" controlId="form-norm-ext-data" required [error]="normExtincaoDataControl.touched &amp;&amp; normExtincaoDataControl.invalid ? (normExtincaoDataControl.getError('dataFormato') || normExtincaoDataControl.getError('dataRange') || 'A Data da Publicação é obrigatória.') : ''"><s-datepicker [formControl]="normExtincaoDataPicker.dateControl" [min]="dataMinima" [max]="dataMaxima" [openOnClick]="false" placeholder="DD/MM/AAAA" (input)="normExtincaoDataPicker.onInput($event)" (focusout)="normExtincaoDataPicker.onFocusOut($event)" /></s-field>
                  </div>

                  <!-- Anexo da Normativa de Extinção -->
                  <s-field id="container-anexo-extincao" label="Documento da Normativa de Extinção (PDF, JPG, JPEG, PNG até 10 MB)" required [error]="normExtincaoDocInvalido() ? 'É obrigatório anexar o documento da Normativa de Extinção.' : ''" class="md:col-span-3 flex flex-col gap-2">
      <div class="flex items-center gap-2 flex-wrap" [class.sg-anexo-com-arquivo]="!!normExtincaoDoc()">
        @if (normExtincaoDoc(); as doc) { <s-icon-button icon="visibility" label="Visualizar anexo" text size="sm" variant="info" sTooltip="Visualizar anexo" (click)="visualizarDoc(doc, 'Normativa de Extinção')" /> }
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
          <!-- SEÇÃO 4: GERÊNCIAS EXECUTIVAS E REGIONAIS VINCULADAS (EDIÇÃO)  -->
          <!-- ============================================================== -->
          @if (isEditMode()) {
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <s-icon name="account_tree" size="xs"  />
                <span>4. Gerências Executivas e Gerências Regionais Vinculadas</span>
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

                  <!-- Filtro: Unidade de Trabalho (UTB) (Select com autocomplete) -->
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

              <!-- Tabela de Subordinadas -->
              <div class="border border-siage-border rounded-lg overflow-hidden bg-siage-surface">
                <s-table label="Unidades vinculadas" [columns]="colunasVinculos" [rows]="paginatedSubordinadas()"
      [empty]="{variant: 'no-results', title: 'Nenhum vínculo foi encontrado.', description: '', actionLabel: ''}"
      [page]="subordinadasPageIndex() + 1" [pageSize]="subordinadasPageIndexSize()" [total]="filteredSubordinadas().length"
      (pageChange)="subordinadasPageIndex.set($event - 1)" (pageSizeChange)="subordinadasPageIndexSize.set($event); subordinadasPageIndex.set(0)" >
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
export class SecretariaExecutivaForm {
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly service = inject(SecretariaExecutivaService);
  readonly secGeralService = inject(SecretariaGeralService);
  readonly permissionService = inject(PermissionService);
  private readonly dialog = inject(MatDialog);
  private readonly modalService = inject(SModalService);
  private readonly toastService = inject(SToastService);

  readonly isEditMode = signal(false);
  readonly isSaving = signal(false);
  itemId: string | null = null;
  currentItem: SecretariaExecutivaItem | null = null;

  // Unidade de Trabalho
  readonly utbInputControl = new FormControl({ value: '', disabled: true }, [Validators.required]);
  readonly secGeralInputControl = new FormControl('', [Validators.required]);

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

  // Normativa de Criação
  readonly normCriacaoNomeControl = new FormControl('', [Validators.maxLength(100)]);
  readonly normCriacaoNumeroControl = new FormControl('', [Validators.maxLength(20)]);
  readonly normCriacaoDataControl = new FormControl('');
  readonly normCriacaoDoc = signal<DocumentoAnexo | undefined>(undefined);
  readonly normCriacaoDocInvalido = signal(false);

  // Normativa de Extinção
  readonly temNormativaExtincao = signal(false);
  readonly hasPersistedNormativaExtincao = signal(false);
  readonly expandindoNormativaExtincao = signal(false);
  readonly normExtincaoNomeControl = new FormControl('', [Validators.maxLength(100)]);
  readonly normExtincaoNumeroControl = new FormControl('', [Validators.maxLength(20)]);
  readonly normExtincaoDataControl = new FormControl('');
  readonly normExtincaoDoc = signal<DocumentoAnexo | undefined>(undefined);
  readonly normExtincaoDocInvalido = signal(false);

  // Subordinadas (Gerências Executivas e Gerências Regionais) na edição
  readonly subordinadasOriginais = signal<SubordinadaSecretariaExecutivaItem[]>([]);
  readonly filtroSubordinadaNome = new FormControl('');
  readonly filtroSubordinadaUtb = new FormControl('');
  readonly appliedSubordinadaNome = signal('');
  readonly appliedSubordinadaUtb = signal('');
  readonly subordinadasPageIndex = signal(0);

  // Flags para controle de navegação e descarte
  private initialSnapshotJson = '';
  isSavedSuccessfully = false;
  isDiscarded = false;
  private isHandlingUtbSelection = false;

  // Secretarias Gerais ativas ordenadas alfabeticamente
  readonly filteredSecsGerais = computed(() => {
    this.estadosecGeralInputControl();
    const list = this.secGeralService.items().filter(s => s.status === 'ATIVO');
    const filtro = (this.secGeralInputControl.value || '').toLowerCase().trim();
    const sorted = [...list].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    if (!filtro) return sorted;
    return sorted.filter(s => s.nome.toLowerCase().includes(filtro));
  });

  // UTBs disponíveis para seleção (filtra UTBs em uso por outras unidades ativas)
  readonly utbsDisponiveis = computed(() => {
    return this.secGeralService.utbs().filter((u: UtbItem) => !this.service.isUtbEmUso(u.codigo, this.itemId || undefined));
  });

  // Lista de UTBs para autocomplete
  readonly filteredUtbs = computed(() => {
    this.estadoutbInputControl();
    const filtro = (this.utbInputControl.value || '').toLowerCase().trim();
    const list = this.secGeralService.utbs();
    if (!filtro) return list;
    return list.filter((u: UtbItem) => 
      u.codigo.toLowerCase().includes(filtro) || 
      u.nome.toLowerCase().includes(filtro) ||
      u.descricaoCompleta.toLowerCase().includes(filtro)
    );
  });

  // Regra de bloqueio da UTB: na edição, não pode ser alterada se houver chefe ou subordinadas
  readonly isUtbBloqueada = computed(() => {
    if (!this.isEditMode() || !this.currentItem) return false;
    const hasChefe = !!this.chefeImediato();
    const hasSubs = this.subordinadasOriginais().length > 0;
    return hasChefe || hasSubs;
  });

  readonly hasSecGeralValida = computed(() => {
    this.estadoFormularioOficial();
    const id = (this.valorsecGeralInputControlOficial() || this.form.controls.secretariaGeralId.value || '').trim();
    if (!id) return false;
    const sg = this.secGeralService.getItem(id);
    if (sg) return sg.status === 'ATIVO' || (this.isEditMode() && this.currentItem?.secretariaGeralId === id);
    return this.isEditMode() && this.currentItem?.secretariaGeralId === id;
  });

  readonly isUtbDesabilitada = computed(() => {
    return this.isUtbBloqueada() || !this.hasSecGeralValida();
  });

  readonly filteredUtbSubOptions = computed(() => {
    const map = new Map<string, UtbItem>();
    for (const sub of this.subordinadasOriginais()) {
      const match = sub.utb.match(/^(UTB-[^ -]+)\s*-\s*(.+)$/);
      if (match) {
        map.set(match[1], { codigo: match[1], nome: match[2], descricaoCompleta: sub.utb });
      } else {
        map.set(sub.utb, { codigo: sub.utb, nome: sub.utb, descricaoCompleta: sub.utb });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
  });

  readonly filteredSubordinadas = computed(() => {
    let list = [...this.subordinadasOriginais()];
    const nome = this.appliedSubordinadaNome().toLowerCase().trim();
    const utb = this.appliedSubordinadaUtb().toLowerCase().trim();

    if (nome) {
      list = list.filter(s => s.nome.toLowerCase().includes(nome));
    }
    if (utb) {
      list = list.filter(s => s.utb.toLowerCase().includes(utb));
    }

    return list;
  });

  readonly paginatedSubordinadas = computed(() => {
    const start = this.subordinadasPageIndex() * this.subordinadasPageIndexSize();
    return this.filteredSubordinadas().slice(start, start + this.subordinadasPageIndexSize());
  });

  readonly opcoesform_sec_geral = computed(() => {
    const atual = this.valorsecGeralInputControlOficial() || this.form.controls.secretariaGeralId.value;
    const ativos = [...this.secGeralService.items().filter(s => s.status === 'ATIVO')]
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    const opcoes = ativos.map(sec => ({label: sec.nome, value: sec.id}));
    if (atual && !opcoes.some(o => o.value === atual)) {
      const selecionada = this.secGeralService.getItem(atual);
      if (selecionada) return [{label: selecionada.nome, value: selecionada.id}, ...opcoes];
      if (this.currentItem?.secretariaGeralId === atual) {
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
  readonly colunasVinculos: readonly STableColumn<SecretariaExecutivaItem['subordinadas'][number]>[] = [{key: 'nome', label: 'Tipo / Unidade Vinculada'},
    {key: 'chefiaImediata', label: 'Chefia Imediata'},
    {key: 'utb', label: 'Unidade de Trabalho (UTB)'}];
  selecionarform_sec_geral(selection: SAutocompleteSelection | null) {
    if (selection) { this.onSecGeralSelected(String(selection.value)); } else { this.limparSecGeral(); }
  }
  readonly secGeralInputControlOficial = new FormControl<string | null>(null);
  private readonly syncsecGeralInputControlOficial = effect(() => {
    this.estadoFormularioOficial();
    this.isUtbBloqueada();
    const nextVal = this.valorsecGeralInputControlOficial() || null;
    if (this.secGeralInputControlOficial.value !== nextVal) {
      this.secGeralInputControlOficial.setValue(nextVal, {emitEvent: false});
    }
    if (this.secGeralInputControl.disabled && !this.secGeralInputControlOficial.disabled) {
      this.secGeralInputControlOficial.disable({emitEvent: false});
    } else if (!this.secGeralInputControl.disabled && this.secGeralInputControlOficial.disabled) {
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
      if (this.currentItem?.utbCodigo === atual) {
        const label = this.currentItem.utbNome.startsWith(`${atual} - `)
          ? this.currentItem.utbNome
          : `${atual} - ${this.currentItem.utbNome}`;
        return [{label, value: atual}, ...opcoes];
      }
    }
    return opcoes;
  });
  selecionarform_utb(selection: SAutocompleteSelection | null) {
    if (selection) { this.onUtbSelected(String(selection.value)); } else { this.limparUtb(); }
  }
  readonly utbInputControlOficial = new FormControl<string | null>({ value: null, disabled: true });
  private readonly syncutbInputControlOficial = effect(() => {
    this.estadoFormularioOficial();
    const shouldDisable = this.isUtbDesabilitada() || this.utbInputControl.disabled;
    const nextVal = this.valorutbInputControlOficial() || this.form.controls.utbCodigo.value || null;
    if (this.utbInputControlOficial.value !== nextVal) {
      this.utbInputControlOficial.setValue(nextVal, {emitEvent: false});
    }
    if (nextVal && this.service.isUtbEmUso(nextVal, this.itemId || undefined)) {
      this.utbInputControl.setErrors({ emUso: true });
      this.utbInputControlOficial.setErrors({ emUso: true });
      this.form.get('utbCodigo')?.setErrors({ emUso: true });
    }
    if (shouldDisable && !this.utbInputControlOficial.disabled) {
      this.utbInputControlOficial.disable({emitEvent: false});
    } else if (!shouldDisable && this.utbInputControlOficial.disabled) {
      this.utbInputControlOficial.enable({emitEvent: false});
    }
  });
  readonly valorutbInputControlOficial = toSignal(this.form.controls.utbCodigo.valueChanges, {initialValue: this.form.controls.utbCodigo.value});
  readonly opcoesfiltro_sub_utb = computed(() => this.filteredUtbSubOptions().map(utb => ({label: `${ utb.codigo } - ${ utb.nome }`, value: utb.codigo + ' - ' + utb.nome})));
  readonly atoDataPicker = new DataFormulario(this.atoDataControl);
  readonly normCriacaoDataPicker = new DataFormulario(this.normCriacaoDataControl);
  readonly normExtincaoDataPicker = new DataFormulario(this.normExtincaoDataControl);
  readonly dataMinima = new Date(1900, 0, 1);
  readonly dataMaxima = new Date();
  private lastValidUtbCodigo = '';

  constructor() {
    const params = this.route.snapshot.params;
    const url = this.router.url;

    effect(() => {
      this.atualizarEstadoUtb();
    });

    if (params['id'] && url.endsWith('/editar')) {
      this.isEditMode.set(true);
      this.itemId = params['id'];
      this.carregarDadosEdicao(this.itemId!);
    } else {
      this.isEditMode.set(false);
      this.atualizarEstadoUtb();
      this.initialSnapshotJson = this.getCurrentSnapshotJson();
    }
  }

  private atualizarEstadoUtb() {
    if (this.isUtbDesabilitada()) {
      this.utbInputControl.disable({ emitEvent: false });
      this.utbInputControlOficial.disable({ emitEvent: false });
    } else {
      this.utbInputControl.enable({ emitEvent: false });
      this.utbInputControlOficial.enable({ emitEvent: false });
    }
  }

  private carregarDadosEdicao(id: string) {
    const item = this.service.getItem(id);
    if (!item) {
      this.toastService.error('Secretaria Executiva não encontrada.');
      this.router.navigate(['/configuracoes/hierarquia/secretaria-executiva']);
      return;
    }

    this.currentItem = item;
    this.lastValidUtbCodigo = item.utbCodigo;

    this.form.patchValue({
      nome: item.nome,
      secretariaGeralId: item.secretariaGeralId,
      utbCodigo: item.utbCodigo
    });

    this.secGeralInputControl.setValue(item.secretariaGeralNome);
    this.utbInputControl.setValue(item.utbNome);

    if (item.chefeImediato) {
      this.chefeImediato.set(JSON.parse(JSON.stringify(item.chefeImediato)));
      this.atoNumeroControl.setValue(item.chefeImediato.atoGovernamental.numero);
      this.atoDataControl.setValue(item.chefeImediato.atoGovernamental.dataPublicacao);
      this.atoDocumento.set(item.chefeImediato.atoGovernamental.documento);
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

    this.subordinadasOriginais.set(item.subordinadas ? JSON.parse(JSON.stringify(item.subordinadas)) : []);
    this.atualizarEstadoUtb();

    this.initialSnapshotJson = this.getCurrentSnapshotJson();
  }

  private getCurrentSnapshotJson(): string {
    return JSON.stringify({
      nome: (this.form.get('nome')?.value || '').trim(),
      secretariaGeralId: (this.form.get('secretariaGeralId')?.value || '').trim(),
      utbCodigo: (this.form.get('utbCodigo')?.value || '').trim(),
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

  formatarDataParaExibicao(val: string | null | undefined): string {
    return formatarDataParaExibicao(val);
  }

  onSecGeralSelected(id: string) {
    const sec = this.secGeralService.items().find(s => s.id === id);
    if (sec) {
      this.form.get('secretariaGeralId')?.setValue(sec.id);
      this.form.get('secretariaGeralId')?.markAsDirty();
      this.secGeralInputControl.setValue(sec.nome, { emitEvent: false });
      this.secGeralInputControl.setErrors(null);
      if (this.secGeralInputControlOficial.value !== sec.id) {
        this.secGeralInputControlOficial.setValue(sec.id, { emitEvent: false });
      }
      this.atualizarEstadoUtb();
    }
  }

  limparSecGeral() {
    this.form.get('secretariaGeralId')?.setValue('');
    this.form.get('secretariaGeralId')?.markAsDirty();
    this.secGeralInputControl.setValue('');
    if (this.secGeralInputControlOficial.value !== null) {
      this.secGeralInputControlOficial.setValue(null, { emitEvent: false });
    }
    this.atualizarEstadoUtb();
  }

  onSecGeralBlur() {
    const text = (this.secGeralInputControl.value || '').trim().toLowerCase();
    const currentId = this.form.get('secretariaGeralId')?.value;
    if (!text) {
      if (currentId) {
        this.limparSecGeral();
      }
      return;
    }
    const found = this.secGeralService.items().find(s => s.status === 'ATIVO' && s.nome.toLowerCase() === text);
    if (found) {
      if (found.id !== currentId) {
        this.onSecGeralSelected(found.id);
      } else {
        this.secGeralInputControl.setValue(found.nome, { emitEvent: false });
        this.secGeralInputControlOficial.setValue(found.id, { emitEvent: false });
      }
    } else if (currentId) {
      const existing = this.secGeralService.getItem(currentId);
      if (existing) {
        this.secGeralInputControl.setValue(existing.nome, { emitEvent: false });
        this.secGeralInputControlOficial.setValue(existing.id, { emitEvent: false });
      } else if (this.currentItem?.secretariaGeralId === currentId) {
        this.secGeralInputControl.setValue(this.currentItem.secretariaGeralNome, { emitEvent: false });
        this.secGeralInputControlOficial.setValue(currentId, { emitEvent: false });
      } else {
        this.limparSecGeral();
      }
    } else {
      this.limparSecGeral();
    }
  }

  onUtbSelected(codigo: string) {
    if (this.isUtbDesabilitada()) return;

    const utb = this.secGeralService.utbs().find((u: UtbItem) => u.codigo === codigo);
    if (!utb) return;

    if (this.service.isUtbEmUso(codigo, this.itemId || undefined)) {
      this.form.get('utbCodigo')?.setValue(utb.codigo);
      this.form.get('utbCodigo')?.markAsDirty();
      this.utbInputControl.setValue(`${utb.codigo} - ${utb.nome}`, { emitEvent: false });
      if (this.utbInputControlOficial.value !== utb.codigo) {
        this.utbInputControlOficial.setValue(utb.codigo, { emitEvent: false });
      }
      this.form.get('utbCodigo')?.setErrors({ emUso: true });
      this.form.get('utbCodigo')?.markAsTouched();
      this.utbInputControl.setErrors({ emUso: true });
      this.utbInputControl.markAsTouched();
      this.utbInputControlOficial.setErrors({ emUso: true });
      this.utbInputControlOficial.markAsTouched();
      return;
    }

    const currentCodigo = this.form.get('utbCodigo')?.value;
    if (codigo === currentCodigo || (this.isEditMode() && codigo === this.lastValidUtbCodigo && this.service.isUtbEmUso(currentCodigo || '', this.itemId || undefined))) {
      this.form.get('utbCodigo')?.setValue(utb.codigo);
      this.utbInputControl.setValue(`${utb.codigo} - ${utb.nome}`, { emitEvent: false });
      if (this.utbInputControlOficial.value !== utb.codigo) {
        this.utbInputControlOficial.setValue(utb.codigo, { emitEvent: false });
      }
      this.form.get('utbCodigo')?.setErrors(null);
      this.utbInputControl.setErrors(null);
      this.utbInputControlOficial.setErrors(null);
      this.lastValidUtbCodigo = utb.codigo;
      return;
    }

    // Regras de confirmação:
    // - Adicionar: com Chefe Imediato selecionado, exige confirmação. Sem chefe, troca direto.
    // - Editar: exige confirmação para qualquer troca permitida de UTB, mesmo sem chefia vinculada.
    const requiresConfirmation = this.isEditMode()
      ? !!this.lastValidUtbCodigo
      : !!this.chefeImediato();

    const aplicarNovaUtb = () => {
      this.form.get('utbCodigo')?.setValue(utb.codigo);
      this.form.get('utbCodigo')?.markAsDirty();
      this.utbInputControl.setValue(`${utb.codigo} - ${utb.nome}`, { emitEvent: false });
      if (this.utbInputControlOficial.value !== utb.codigo) {
        this.utbInputControlOficial.setValue(utb.codigo, { emitEvent: false });
      }
      this.form.get('utbCodigo')?.setErrors(null);
      this.utbInputControl.setErrors(null);
      this.utbInputControlOficial.setErrors(null);
      this.lastValidUtbCodigo = utb.codigo;
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
    const currentCodigo = this.lastValidUtbCodigo || this.form.get('utbCodigo')?.value;
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
        this.form.get('utbCodigo')?.setValue(currentCodigo || '');
        this.utbInputControl.setValue(existingLabel, { emitEvent: false });
        this.utbInputControlOficial.setValue(currentCodigo || null, { emitEvent: false });
        this.form.get('utbCodigo')?.setErrors(currentCodigo ? null : { required: true });
        this.utbInputControl.setErrors(currentCodigo ? null : { required: true });
        this.utbInputControlOficial.setErrors(null);
      }
    });
  }

  limparUtb() {
    if (this.isUtbDesabilitada()) return;
    const currentCodigo = this.form.get('utbCodigo')?.value;
    if (!currentCodigo && !this.utbInputControl.value) return;

    const isCurrentInvalid = !!currentCodigo && this.service.isUtbEmUso(currentCodigo, this.itemId || undefined);
    const requiresConfirmation = !isCurrentInvalid && (this.isEditMode()
      ? !!this.lastValidUtbCodigo
      : !!this.chefeImediato());

    const aplicarLimpeza = () => {
      this.form.get('utbCodigo')?.setValue('');
      this.form.get('utbCodigo')?.markAsDirty();
      this.utbInputControl.setValue('');
      this.utbInputControlOficial.setValue(null, { emitEvent: false });
      this.utbInputControlOficial.setErrors(null);
      this.lastValidUtbCodigo = '';
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

    const currentSelectedCodigo = this.form.get('utbCodigo')?.value;
    const text = (this.utbInputControl.value || '').trim();
    if (!text) {
      if (currentSelectedCodigo) {
        this.limparUtb();
      }
      return;
    }
    const match = this.secGeralService.utbs().find((u: UtbItem) => 
      u.codigo.toLowerCase() === text.toLowerCase() ||
      u.nome.toLowerCase() === text.toLowerCase() ||
      `${u.codigo} - ${u.nome}`.toLowerCase() === text.toLowerCase() ||
      u.descricaoCompleta.toLowerCase() === text.toLowerCase()
    );
    if (match) {
      if (match.codigo !== currentSelectedCodigo) {
        this.onUtbSelected(match.codigo);
      } else {
        this.utbInputControl.setValue(`${match.codigo} - ${match.nome}`, { emitEvent: false });
        this.utbInputControlOficial.setValue(match.codigo, { emitEvent: false });
        if (this.service.isUtbEmUso(match.codigo, this.itemId || undefined)) {
          this.form.get('utbCodigo')?.setErrors({ emUso: true });
          this.utbInputControl.setErrors({ emUso: true });
          this.utbInputControlOficial.setErrors({ emUso: true });
        }
      }
    } else {
      const existing = this.secGeralService.utbs().find((u: UtbItem) => u.codigo === currentSelectedCodigo);
      if (existing) {
        this.utbInputControl.setValue(`${existing.codigo} - ${existing.nome}`, { emitEvent: false });
        this.utbInputControlOficial.setValue(existing.codigo, { emitEvent: false });
        if (this.service.isUtbEmUso(existing.codigo, this.itemId || undefined)) {
          this.form.get('utbCodigo')?.setErrors({ emUso: true });
          this.utbInputControl.setErrors({ emUso: true });
          this.utbInputControlOficial.setErrors({ emUso: true });
        }
      } else if (currentSelectedCodigo && this.currentItem?.utbCodigo === currentSelectedCodigo) {
        this.utbInputControl.setValue(this.currentItem.utbNome, { emitEvent: false });
        this.utbInputControlOficial.setValue(currentSelectedCodigo, { emitEvent: false });
      } else {
        this.limparUtb();
      }
    }
  }

  abrirBuscaChefe() {
    const utbCodigo = this.form.get('utbCodigo')?.value;
    if (!utbCodigo || this.utbInputControl.hasError('emUso') || this.form.get('utbCodigo')?.hasError('emUso')) {
      this.toastService.warning('Selecione primeiro uma Unidade de Trabalho (UTB).');
      return;
    }

    const utb = this.secGeralService.utbs().find((u: UtbItem) => u.codigo === utbCodigo);
    const dialogRef = this.modalService.open<BuscaServidorModal, unknown, ServidorUtbItem>(BuscaServidorModal, {width: '800px',
maxWidth: 'calc(100vw - 2.5rem)',
autoFocus: false,
data: {visualSecretariaGeral: true,
        utbCodigo,
        utbDescricao: utb?.descricaoCompleta || utbCodigo
      }});

    dialogRef.afterClosed().subscribe((servidor: ServidorUtbItem | undefined) => {
      if (servidor) {
        const isSubstituicao = !!this.chefeImediato() && this.chefeImediato()?.matricula !== servidor.matricula;
        if (isSubstituicao) {
          this.atoNumeroControl.reset('');
          this.atoDataControl.reset('');
          this.atoDocumento.set(undefined);
        }

        this.chefeImediato.set({
          matricula: servidor.matricula,
          cpf: servidor.cpf,
          nome: servidor.nome,
          cargo: servidor.cargo,
          situacaoFuncional: servidor.situacaoFuncional,
          atoGovernamental: {
            numero: this.atoNumeroControl.value || '',
            dataPublicacao: this.atoDataControl.value || '',
            documento: this.atoDocumento()
          }
        });
        this.toastService.success(
          isSubstituicao
            ? `Chefia substituída por ${servidor.nome}. Informe os dados e anexe o novo Ato Governamental.`
            : `Servidor ${servidor.nome} selecionado como Chefe Imediato.`
        );
      }
    });
  }

  removerChefe() {
    const dialogRef = from(this.modalService.confirm({title: 'Remover Chefe Imediato?', description: 'Tem certeza que deseja desvincular o Chefe Imediato e seu respectivo Ato Governamental?', cancelLabel: 'Cancelar', confirmLabel: 'Sim, remover', variant: 'destructive'}));

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
    const secId = this.itemId || undefined;
    const atoAtual: AtoGovernamental = {
      numero: this.atoNumeroControl.value || '',
      dataPublicacao: this.atoDataControl.value || '',
      documento: this.atoDocumento()
    };
    const nomeChefe = this.chefeImediato()?.nome;
    const atos = this.service.getHistoricoAtos(secId, atoAtual, nomeChefe);

    this.modalService.open(HistoricoAtosModal, {width: '900px',
maxWidth: 'calc(100vw - 2.5rem)',
autoFocus: false,
data: {
        atos
      }});
  }

  canAnexarAto(): boolean {
    const num = (this.atoNumeroControl.value || '').trim();
    const data = (this.atoDataControl.value || '').trim();
    return num.length > 0 && num.length <= 20 && data.length > 0 && validarDataFormato(data) && !dataFutura(data);
  }

  onFileAtoSelected(event: Event | File | null) {
    if (!event) return;
    if (!this.canAnexarAto()) {
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

    const blobUrl = URL.createObjectURL(file);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    const now = new Date();
    const dataUpload = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});

    this.atoDocumento.set({
      id: `doc-ato-${Date.now()}`,
      nomeArquivo: file.name,
      tamanho: sizeMb,
      tipo: ext as DocumentoAnexo['tipo'],
      dataUpload,
      blobUrl
    });
    this.atoDocInvalido.set(false);
    this.toastService.success(`Documento "${file.name}" anexado com sucesso.`);
    if (input) input.value = '';
  }

  removerDocAto() {
    this.atoDocumento.set(undefined);
  }

  canAnexarNormCriacao(): boolean {
    const nome = (this.normCriacaoNomeControl.value || '').trim();
    const num = (this.normCriacaoNumeroControl.value || '').trim();
    const data = (this.normCriacaoDataControl.value || '').trim();
    return nome.length > 0 && nome.length <= 100 && num.length > 0 && num.length <= 20 && data.length > 0 && validarDataFormato(data) && !dataFutura(data);
  }

  onFileNormCriacaoSelected(event: Event | File | null) {
    if (!event) return;
    if (!this.canAnexarNormCriacao()) {
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

    const blobUrl = URL.createObjectURL(file);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    const now = new Date();
    const dataUpload = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});

    this.normCriacaoDoc.set({
      id: `doc-norm-cria-${Date.now()}`,
      nomeArquivo: file.name,
      tamanho: sizeMb,
      tipo: ext as DocumentoAnexo['tipo'],
      dataUpload,
      blobUrl
    });
    this.normCriacaoDocInvalido.set(false);
    this.toastService.success(`Normativa de Criação "${file.name}" anexada com sucesso.`);
    if (input) input.value = '';
  }

  removerDocCriacao() {
    this.normCriacaoDoc.set(undefined);
  }

  abrirAdicaoNormativaExtincao() {
    this.expandindoNormativaExtincao.set(true);
  }

  cancelarAdicaoNormativaExtincao() {
    this.normExtincaoNomeControl.reset('');
    this.normExtincaoNumeroControl.reset('');
    this.normExtincaoDataControl.reset('');
    this.normExtincaoDoc.set(undefined);
    this.normExtincaoNomeControl.setErrors(null);
    this.normExtincaoNumeroControl.setErrors(null);
    this.normExtincaoDataControl.setErrors(null);
    this.normExtincaoDocInvalido.set(false);
    this.expandindoNormativaExtincao.set(false);
  }

  confirmarAdicaoNormativaExtincao() {
    const nome = (this.normExtincaoNomeControl.value || '').trim();
    const num = (this.normExtincaoNumeroControl.value || '').trim();
    const data = (this.normExtincaoDataControl.value || '').trim();
    const doc = this.normExtincaoDoc();

    let hasError = false;
    let firstInvalidId = '';

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

    if (!num) {
      this.normExtincaoNumeroControl.setErrors({ required: true });
      this.normExtincaoNumeroControl.markAsTouched();
      hasError = true;
      if (!firstInvalidId) firstInvalidId = 'form-norm-ext-numero';
    } else if (num.length > 20) {
      this.normExtincaoNumeroControl.setErrors({ maxlength: { requiredLength: 20, actualLength: num.length } });
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

  canAnexarNormExtincao(): boolean {
    const nome = (this.normExtincaoNomeControl.value || '').trim();
    const num = (this.normExtincaoNumeroControl.value || '').trim();
    const data = (this.normExtincaoDataControl.value || '').trim();
    return nome.length > 0 && nome.length <= 100 && num.length > 0 && num.length <= 20 && data.length > 0 && validarDataFormato(data) && !dataFutura(data);
  }

  onFileNormExtincaoSelected(event: Event | File | null) {
    if (!event) return;
    if (!this.canAnexarNormExtincao()) {
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

    const blobUrl = URL.createObjectURL(file);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    const now = new Date();
    const dataUpload = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});

    this.normExtincaoDoc.set({
      id: `doc-norm-ext-${Date.now()}`,
      nomeArquivo: file.name,
      tamanho: sizeMb,
      tipo: ext as DocumentoAnexo['tipo'],
      dataUpload,
      blobUrl
    });
    this.normExtincaoDocInvalido.set(false);
    this.toastService.success(`Normativa de Extinção "${file.name}" anexada com sucesso.`);
    if (input) input.value = '';
  }

  removerDocExtincao() {
    this.normExtincaoDoc.set(undefined);
  }

  visualizarDoc(doc: DocumentoAnexo, titulo = 'Visualizar anexo') {
    this.modalService.open(VisualizarDocumentoModal, {data: {
        documento: doc,
        titulo
      },
maxWidth: '90vw',
width: '800px'});
  }

  baixarDoc(doc: DocumentoAnexo) {
    const url = doc.blobUrl || doc.urlSimulada || '/exemplo-documento-comprovacao.pdf';
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.nomeArquivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(url, '_blank');
    }
  }

  // Filtros de Subordinadas na Edição
  readonly filtroSubUtbTexto = signal('');

  onSubUtbInput(event: Event) {
    if (event.target instanceof HTMLInputElement) {
      this.filtroSubUtbTexto.set(event.target.value);
    }
  }

  onSubUtbSelectionChange(selection: SAutocompleteSelection | null) {
    this.filtroSubUtbTexto.set(selection?.label ?? '');
  }

  canBuscarSubordinadas(): boolean {
    const nome = (this.filtroSubordinadaNome.value || '').trim();
    const utb = (this.filtroSubordinadaUtb.value || this.filtroSubUtbTexto() || '').trim();
    return nome.length > 0 || utb.length > 0;
  }

  onBuscarSubordinadas() {
    this.appliedSubordinadaNome.set((this.filtroSubordinadaNome.value || '').trim());
    this.appliedSubordinadaUtb.set((this.filtroSubordinadaUtb.value || this.filtroSubUtbTexto() || '').trim());
    this.subordinadasPageIndex.set(0);
  }

  onLimparSubordinadas() {
    this.filtroSubUtbTexto.set('');
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
    this.filtroSubUtbTexto.set('');
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
    this.router.navigate(['/configuracoes/hierarquia/secretaria-executiva']);
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
    const secGeralId = this.form.get('secretariaGeralId')?.value || '';
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
// TELA 3: VISUALIZAR SECRETARIA EXECUTIVA
// ==========================================

@Component({
  selector: 'app-secretaria-executiva-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    AcessoRestritoComponent,
    SPageHeaderComponent,
    SFieldComponent,
    SInputComponent,
    SAutocompleteComponent,
    SIconButtonComponent,
    SIconComponent,
    SButtonComponent,
    STooltipDirective,
    SFileUploadComponent,
    STableComponent,
    STableCellDirective
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
      <app-acesso-restrito backUrl="/configuracoes/hierarquia/secretaria-executiva" />
    } @else {
      <div class="flex flex-col gap-6 max-w-7xl mx-auto w-full font-sans pb-16">
        <!-- Breadcrumb e Cabeçalho Principal -->
        <s-page-header [breadcrumbs]="[{label: 'Início', routerLink: '/inicio'}, {label: 'Configurações', routerLink: '/configuracoes'}, {label: 'Hierarquia de Unidades e Cargos', routerLink: '/configuracoes/hierarquia'}, {label: 'Configurar Secretaria Executiva', routerLink: '/configuracoes/hierarquia/secretaria-executiva'}, {label: 'Visualizar'}]" title="Visualizar Secretaria Executiva" description="Consulte as informações, dados de chefia, normativas e unidades subordinadas da Secretaria Executiva." showBack (back)="goBack()">@if (permissionService.canCreate() && item()?.status === 'ATIVO') {<s-button action="" type="button" (click)="onEditar()" icon="edit" variant="primary" >

                  <span>Editar</span>
                </s-button>}</s-page-header>

        @if (item(); as sec) {
          <div class="flex flex-col gap-6">

            <!-- Card 1: Identificação da Secretaria Executiva -->
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <s-icon name="domain" size="xs"  />
                <span>1. Identificação da Secretaria Executiva</span>
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                <!-- Primeira linha: Nome (4 cols) | Secretaria Geral (4 cols) | UTB (4 cols) -->
                <div class="flex flex-col gap-1 col-span-12 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Nome da Secretaria Executiva</span>
                  <span class="text-sm font-medium text-siage-text-primary break-words">{{ sec.nome }}</span>
                </div>

                <div class="flex flex-col gap-1 col-span-12 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Secretaria Geral</span>
                  <span class="text-sm font-medium text-siage-text-primary break-words">{{ sec.secretariaGeralNome }}</span>
                </div>

                <div class="flex flex-col gap-1 col-span-12 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Unidade de Trabalho (UTB)</span>
                  <span class="text-sm font-medium text-siage-text-primary break-words leading-relaxed">{{ sec.utbNome }}</span>
                </div>

                <!-- Segunda linha: Situação (plain text, NO badge) | Criador / Editor | Data de Criação -->
                <div class="flex flex-col gap-1 col-span-12 sm:col-span-4 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Situação</span>
                  <span class="text-sm font-medium text-siage-text-primary">{{ sec.status === 'ATIVO' ? 'Ativo' : 'Inativo' }}</span>
                </div>

                <div class="flex flex-col gap-1 col-span-12 sm:col-span-4 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Criador / Editor</span>
                  <span class="text-sm font-medium text-siage-text-primary break-words">{{ sec.criadorEditor }}</span>
                </div>

                <div class="flex flex-col gap-1 col-span-12 sm:col-span-4 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data de Criação</span>
                  <span class="text-sm font-medium text-siage-text-primary">{{ sec.dataCriacao }}</span>
                </div>
              </div>
            </div>

            <!-- Card 2: Chefia Imediata e Ato Governamental -->
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <s-icon name="badge" size="xs"  />
                <span>2. Chefia Imediata e Ato Governamental</span>
              </h3>

              @if (sec.chefeImediato; as chefe) {
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
                      <div class="flex items-center gap-2 sg-anexo-com-arquivo">
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

            <!-- Card 3: Gerências Executivas e Gerências Regionais Vinculadas -->
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <s-icon name="account_tree" size="xs"  />
                <span>3. Gerências Executivas e Gerências Regionais Vinculadas</span>
              </h3>

              <!-- Filtros de Unidades Vinculadas -->
              <div class="flex flex-col gap-4 pt-1">
                <span class="text-xs font-semibold text-siage-text-secondary">Buscar por:</span>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <!-- Filtro: Nome -->
                  <div class="form-field-group">

                    <s-field label="Nome" controlId="view-filtro-sub-nome"><s-input type="text" [formControl]="filtroNome" [maxlength]="200" placeholder="Digite o Nome" (keydown.enter)="$event.preventDefault(); canBuscar() &amp;&amp; onBuscar()" (focusout)="filtroNome.markAsTouched(); " />
@if (filtroNome.value) { <s-icon-button icon="close" label="Limpar campo" text size="sm" (click)="limparFiltroNome()" /> }</s-field>
                  </div>

                  <!-- Filtro: Unidade de Trabalho (UTB) (Select com autocomplete) -->
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

              <div class="border border-siage-border rounded-lg overflow-hidden bg-siage-surface">
                <s-table label="Unidades vinculadas" [columns]="colunasVinculos" [rows]="paginatedSubordinadas()"
      [empty]="{variant: 'no-results', title: 'Nenhum vínculo foi encontrado.', description: '', actionLabel: ''}"
      [page]="pageIndex() + 1" [pageSize]="pageIndexSize()" [total]="filteredSubordinadas().length"
      (pageChange)="pageIndex.set($event - 1)" (pageSizeChange)="pageIndexSize.set($event); pageIndex.set(0)" >
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
                  <!-- Nome (50%) | Número (25%) | Data Publicação (25%) -->
                  <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Nome da Normativa</span>
                    <span class="text-sm font-medium text-siage-text-primary break-words">{{ sec.normativaCriacao.nome }}</span>
                  </div>

                  <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Número da Normativa</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ sec.normativaCriacao.numero }}</span>
                  </div>

                  <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data da Publicação</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ formatarDataParaExibicao(sec.normativaCriacao.dataPublicacao) }}</span>
                  </div>

                  <!-- Anexo do documento de criação -->
                  @if (sec.normativaCriacao.documento; as doc) {
                    <div class="col-span-12 flex items-center gap-2 sg-anexo-com-arquivo">
                      <s-icon-button icon="visibility" type="button" (click)="visualizarDoc(doc, 'Normativa de Criação')" sTooltip="Visualizar anexo" label="Visualizar anexo" text size="sm" variant="info" />
                      <s-file-upload appearance="button" [fileName]="doc.nomeArquivo" [fileId]="doc.id" [allowDownload]="true" [allowRemove]="false" (download)="baixarDoc(doc)" />
                    </div>
                  }
                </div>
              </div>

              <!-- BLOCO 2: NORMATIVA DE EXTINÇÃO (Exibido apenas quando houver documento cadastrado) -->
              @if (sec.normativaExtincao?.documento; as docExt) {
                <div class="pt-4 border-t border-siage-border/40 flex flex-col gap-4">
                  <div class="flex items-center gap-2">
                    <s-icon name="history_edu" size="xs" class="text-amber-600" />
                    <span class="text-xs font-poppins font-bold uppercase tracking-wider text-siage-text-primary">
                      Normativa de Extinção
                    </span>
                    <span class="text-[11px] text-siage-text-secondary italic font-normal ml-auto">
                      Necessária para inativação
                    </span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
                      <span class="text-xs uppercase text-siage-text-secondary font-semibold">Nome da Normativa</span>
                      <span class="text-sm font-medium text-siage-text-primary break-words">{{ sec.normativaExtincao!.nome }}</span>
                    </div>

                    <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                      <span class="text-xs uppercase text-siage-text-secondary font-semibold">Número da Normativa</span>
                      <span class="text-sm font-medium text-siage-text-primary">{{ sec.normativaExtincao!.numero }}</span>
                    </div>

                    <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                      <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data da Publicação</span>
                      <span class="text-sm font-medium text-siage-text-primary">{{ formatarDataParaExibicao(sec.normativaExtincao!.dataPublicacao) }}</span>
                    </div>

                    <div class="col-span-12 flex items-center gap-2 sg-anexo-com-arquivo">
                      <s-icon-button icon="visibility" type="button" (click)="visualizarDoc(docExt, 'Normativa de Extinção')" sTooltip="Visualizar anexo" label="Visualizar anexo" text size="sm" variant="info" />
                      <s-file-upload appearance="button" [fileName]="docExt.nomeArquivo" [fileId]="docExt.id" [allowDownload]="true" [allowRemove]="false" (download)="baixarDoc(docExt)" />
                    </div>
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
export class SecretariaExecutivaView {
  private readonly modalService = inject(SModalService);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly service = inject(SecretariaExecutivaService);
  readonly permissionService = inject(PermissionService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(SToastService);

  readonly item = signal<SecretariaExecutivaItem | undefined>(undefined);

  readonly filtroNome = new FormControl('');
  readonly filtroUtb = new FormControl('');
  readonly appliedNome = signal('');
  readonly appliedUtb = signal('');
  readonly pageIndex = signal(0);

  readonly filteredUtbOptions = computed(() => {
    const subs = this.item()?.subordinadas || [];
    const map = new Map<string, UtbItem>();
    for (const sub of subs) {
      const match = sub.utb.match(/^(UTB-[^ -]+)\s*-\s*(.+)$/);
      if (match) {
        map.set(match[1], { codigo: match[1], nome: match[2], descricaoCompleta: sub.utb });
      } else {
        map.set(sub.utb, { codigo: sub.utb, nome: sub.utb, descricaoCompleta: sub.utb });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
  });

  readonly filteredSubordinadas = computed(() => {
    let list = this.item()?.subordinadas ? [...this.item()!.subordinadas] : [];
    const nome = this.appliedNome().toLowerCase().trim();
    const utb = this.appliedUtb().toLowerCase().trim();

    if (nome) {
      list = list.filter(s => s.nome.toLowerCase().includes(nome));
    }
    if (utb) {
      list = list.filter(s => s.utb.toLowerCase().includes(utb));
    }

    return list;
  });

  readonly paginatedSubordinadas = computed(() => {
    const start = this.pageIndex() * this.pageIndexSize();
    return this.filteredSubordinadas().slice(start, start + this.pageIndexSize());
  });

    readonly opcoesview_filtro_sub_utb = computed(() => this.filteredUtbOptions().map(utb => ({label: `${ utb.codigo } - ${ utb.nome }`, value: utb.codigo + ' - ' + utb.nome})));
    readonly pageIndexSize = signal(10);
  readonly colunasVinculos: readonly STableColumn<SecretariaExecutivaItem['subordinadas'][number]>[] = [{key: 'nome', label: 'Tipo / Unidade Vinculada'},
    {key: 'chefiaImediata', label: 'Chefia Imediata'},
    {key: 'utb', label: 'Unidade de Trabalho (UTB)'}];
    readonly estadofiltroNome = toSignal(this.filtroNome.valueChanges, {initialValue: this.filtroNome.value});
  readonly estadofiltroUtb = toSignal(this.filtroUtb.valueChanges, {initialValue: this.filtroUtb.value});
  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const found = this.service.getItem(id);
      if (found) {
        this.item.set(found);
      } else {
        this.toast.error('Secretaria Executiva não encontrada.');
        this.router.navigate(['/configuracoes/hierarquia/secretaria-executiva']);
      }
    }
  }

  formatarDataParaExibicao(val: string | null | undefined): string {
    return formatarDataParaExibicao(val);
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
    this.router.navigate(['/configuracoes/hierarquia/secretaria-executiva']);
  }

  // ROTA CORRETA: /configuracoes/hierarquia/secretaria-executiva/:id/editar
  onEditar() {
    const sec = this.item();
    if (sec) {
      this.router.navigate(['/configuracoes/hierarquia/secretaria-executiva', sec.id, 'editar']);
    }
  }

  abrirHistoricoAtos() {
    const sec = this.item();
    const atos = this.service.getHistoricoAtos(sec?.id, sec?.chefeImediato?.atoGovernamental, sec?.chefeImediato?.nome);
    this.modalService.open(HistoricoAtosModal, {width: '900px',
maxWidth: 'calc(100vw - 2.5rem)',
autoFocus: false,
data: {
        atos
      }});
  }

  readonly filtroUtbTexto = signal('');

  onUtbInput(event: Event) {
    if (event.target instanceof HTMLInputElement) {
      this.filtroUtbTexto.set(event.target.value);
    }
  }

  onUtbSelectionChange(selection: SAutocompleteSelection | null) {
    this.filtroUtbTexto.set(selection?.label ?? '');
  }

  canBuscar(): boolean {
    const nome = (this.filtroNome.value || '').trim();
    const utb = (this.filtroUtb.value || this.filtroUtbTexto() || '').trim();
    return nome.length > 0 || utb.length > 0;
  }

  onBuscar() {
    this.appliedNome.set((this.filtroNome.value || '').trim());
    this.appliedUtb.set((this.filtroUtb.value || this.filtroUtbTexto() || '').trim());
    this.pageIndex.set(0);
  }

  onLimpar() {
    this.filtroUtbTexto.set('');
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
    this.filtroUtbTexto.set('');
    this.filtroUtb.setValue('');
  }

  onPageChange(newPageIndex: number) {
    this.pageIndex.set(newPageIndex);
  }

  visualizarDoc(doc: DocumentoAnexo, titulo = 'Visualizar anexo') {
    this.modalService.open(VisualizarDocumentoModal, {data: {
        documento: doc,
        titulo
      },
maxWidth: '90vw',
width: '800px'});
  }

  baixarDoc(doc: DocumentoAnexo) {
    const url = doc.blobUrl || doc.urlSimulada || '/exemplo-documento-comprovacao.pdf';
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.nomeArquivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(url, '_blank');
    }
  }
}

// ==========================================
// CAN DEACTIVATE GUARD PARA O FORMULÁRIO
// ==========================================

export const secretariaExecutivaFormDeactivateGuard: CanDeactivateFn<SecretariaExecutivaForm> = (
  component: SecretariaExecutivaForm
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

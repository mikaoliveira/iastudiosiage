import {
  Component,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  Injectable
} from '@angular/core';
import {Router, ActivatedRoute, CanDeactivateFn} from '@angular/router';
import {AbstractControl, FormControl, FormGroup, FormsModule, NgModel, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {filter, takeUntil} from 'rxjs';

import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import {MatDatepickerIntl} from '@angular/material/datepicker';
import {MatDialogModule, MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {NgxExtendedPdfViewerModule} from 'ngx-extended-pdf-viewer';
import {
  SAutocompleteComponent,
  SAutocompleteSelection,
  SBadgeComponent,
  SButtonComponent,
  SDatepickerComponent,
  SDateAdapter,
  SDatepickerIntl,
  SFieldComponent,
  SFileError,
  SFileUploadComponent,
  SFilterCardComponent,
  SIconButtonComponent,
  SIconComponent,
  SInputComponent,
  SModalComponent,
  SModalFooterDirective,
  SModalService,
  SPageHeaderComponent,
  SSelectComponent,
  SSpinnerComponent,
  SSwitchComponent,
  STableAction,
  STableActionEvent,
  STableCellDirective,
  STableColumn,
  STableComponent,
  STableEmpty,
  STableSort,
  SToastService,
  STooltipDirective,
  S_DATE_FORMATS,
  S_LOADING_DELAY,
  injectModalData,
  injectModalRef
} from '@siage/siage-ui';

import {PermissionService} from './permission';
import {AcessoRestritoComponent} from './acesso-restrito';
import {SimulatorService} from './simulator';

export function formatarCpf(val: string | undefined | null): string {
  const digits = (val || '').replace(/\D/g, '').substring(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.substring(0, 3)}.${digits.substring(3)}`;
  if (digits.length <= 9) return `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6)}`;
  return `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6, 9)}-${digits.substring(9, 11)}`;
}

export function validarDataFormato(data: string | undefined | null): boolean {
  if (!data || typeof data !== 'string') return false;
  const trimmed = data.trim();
  // Formato ISO: YYYY-MM-DD (gerado pelo SiageDatePickerComponent)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parts = trimmed.split('-');
    const ano = parseInt(parts[0], 10);
    const mes = parseInt(parts[1], 10);
    const dia = parseInt(parts[2], 10);
    if (mes < 1 || mes > 12) return false;
    if (ano < 1900 || ano > 2100) return false;
    const diasNoMes = new Date(ano, mes, 0).getDate();
    return dia >= 1 && dia <= diasNoMes;
  }
  // Formato Brasileiro: DD/MM/AAAA
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const parts = trimmed.split('/');
    const dia = parseInt(parts[0], 10);
    const mes = parseInt(parts[1], 10);
    const ano = parseInt(parts[2], 10);
    if (mes < 1 || mes > 12) return false;
    if (ano < 1900 || ano > 2100) return false;
    const diasNoMes = new Date(ano, mes, 0).getDate();
    return dia >= 1 && dia <= diasNoMes;
  }
  return false;
}

export function normalizarDataParaBr(data: string | undefined | null): string {
  if (!data || typeof data !== 'string') return '';
  const trimmed = data.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [ano, mes, dia] = trimmed.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  return trimmed;
}

export function dataFutura(data: string): boolean {
  if (!validarDataFormato(data)) return false;
  const [dia, mes, ano] = normalizarDataParaBr(data).split('/').map(Number);
  const hoje = new Date();
  return new Date(ano, mes - 1, dia).getTime() > new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
}

export function formatarDataParaExibicao(data: string | undefined | null): string {
  if (!data || typeof data !== 'string') return '-';
  const trimmed = data.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [ano, mes, dia] = trimmed.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  return trimmed || '-';
}

export function parseDataBrParaTimestamp(dataStr: string | undefined | null): number {
  if (!dataStr || typeof dataStr !== 'string') return 0;
  const clean = dataStr.trim();
  const partes = clean.split(' ');
  const dataPart = partes[0];
  const horaPart = partes[1] || '00:00';

  if (dataPart.includes('/')) {
    const dParts = dataPart.split('/');
    const d = parseInt(dParts[0], 10) || 1;
    const m = parseInt(dParts[1], 10) || 1;
    const y = parseInt(dParts[2], 10) || 1970;
    const [h, min] = horaPart.split(':').map(n => parseInt(n, 10) || 0);
    return new Date(y, m - 1, d, h, min).getTime();
  } else if (dataPart.includes('-')) {
    const dParts = dataPart.split('-');
    const y = parseInt(dParts[0], 10) || 1970;
    const m = parseInt(dParts[1], 10) || 1;
    const d = parseInt(dParts[2], 10) || 1;
    const [h, min] = horaPart.split(':').map(n => parseInt(n, 10) || 0);
    return new Date(y, m - 1, d, h, min).getTime();
  }
  return 0;
}

// ==========================================
// INTERFACES E MODELOS
// ==========================================

export interface DocumentoAnexo {
  id: string;
  nomeArquivo: string;
  tamanho: string;
  tipo: 'pdf' | 'jpg' | 'jpeg' | 'png';
  dataUpload: string;
  urlSimulada?: string;
  blobUrl?: string;
}

export interface AtoGovernamental {
  numero: string;
  dataPublicacao: string;
  documento?: DocumentoAnexo;
}

export interface HistoricoAtoItem {
  id: string;
  numero: string;
  chefeImediato: string;
  dataPublicacao: string;
  dataImportacao: string;
  responsavelImportacao: string;
  documento: DocumentoAnexo;
}

export interface ChefeImediatoItem {
  matricula: string;
  cpf: string;
  nome: string;
  cargo: string;
  situacaoFuncional: 'Em exercício' | 'Afastado' | 'Licença' | 'Cedido';
  atoGovernamental: AtoGovernamental;
}

export interface NormativaItem {
  nome: string;
  numero: string;
  dataPublicacao: string;
  documento?: DocumentoAnexo;
}

export interface GerenciaRegionalItem {
  id: string;
  tipo: 'Gerência Regional';
  nome: string;
  chefiaImediata: string;
  utb: string;
  secretariaExecutivaId?: string;
}

export interface UnidadeSubordinadaItem {
  id: string;
  tipo: 'Secretaria Executiva';
  nome: string;
  chefiaImediata: string;
  utb: string;
  gerenciasRegionais?: GerenciaRegionalItem[];
}

export interface UtbItem {
  codigo: string;
  nome: string;
  descricaoCompleta: string;
}

export interface ServidorUtbItem {
  matricula: string;
  cpf: string;
  nome: string;
  cargo: string;
  situacaoFuncional: 'Em exercício' | 'Afastado' | 'Licença' | 'Cedido';
  utbCodigo: string;
}

export interface SecretariaGeralItem {
  id: string;
  nome: string;
  utbCodigo: string;
  utbNome: string;
  criadorEditor: string;
  dataCriacao: string;
  dataAtualizacao?: string;
  status: 'ATIVO' | 'INATIVO';
  chefeImediato?: ChefeImediatoItem;
  normativaCriacao: NormativaItem;
  normativaExtincao?: NormativaItem;
  subordinadas: UnidadeSubordinadaItem[];
}

// ==========================================
// SERVIÇO PRINCIPAL (SINGLETON)
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class SecretariaGeralService {
  // Lista de UTBs disponíveis para seleção
  readonly utbs = signal<UtbItem[]>([
    {
      codigo: 'UTB-001',
      nome: 'Secretaria de Estado da Administração',
      descricaoCompleta: 'UTB-001 - Secretaria de Estado da Administração (SEAD)'
    },
    {
      codigo: 'UTB-002',
      nome: 'Secretaria de Estado do Planejamento, Orçamento e Gestão',
      descricaoCompleta: 'UTB-002 - Secretaria de Estado do Planejamento, Orçamento e Gestão (SEPLAG)'
    },
    {
      codigo: 'UTB-003',
      nome: 'Secretaria de Estado da Educação e da Ciência e Tecnologia',
      descricaoCompleta: 'UTB-003 - Secretaria de Estado da Educação e da Ciência e Tecnologia (SEECT)'
    },
    {
      codigo: 'UTB-004',
      nome: 'Secretaria de Estado da Saúde',
      descricaoCompleta: 'UTB-004 - Secretaria de Estado da Saúde (SES)'
    },
    {
      codigo: 'UTB-005',
      nome: 'Secretaria de Estado da Segurança e da Defesa Social',
      descricaoCompleta: 'UTB-005 - Secretaria de Estado da Segurança e da Defesa Social (SEDS)'
    },
    {
      codigo: 'UTB-006',
      nome: 'Secretaria de Estado da Infraestrutura e dos Recursos Hídricos',
      descricaoCompleta: 'UTB-006 - Secretaria de Estado da Infraestrutura e dos Recursos Hídricos (SEIRH)'
    },
    {
      codigo: 'UTB-007',
      nome: 'Secretaria Executiva de Gestão e Pessoas',
      descricaoCompleta: 'UTB-007 - Secretaria Executiva de Gestão e Pessoas (SEGP)'
    },
    {
      codigo: 'UTB-008',
      nome: 'Secretaria Executiva de Inovação e Modernização',
      descricaoCompleta: 'UTB-008 - Secretaria Executiva de Inovação e Modernização (SEIM)'
    },
    {
      codigo: 'UTB-009',
      nome: 'Secretaria Executiva de Políticas Estratégicas',
      descricaoCompleta: 'UTB-009 - Secretaria Executiva de Políticas Estratégicas (SEPE)'
    },
    {
      codigo: 'UTB-010',
      nome: 'Secretaria Executiva de Articulação e Parcerias',
      descricaoCompleta: 'UTB-010 - Secretaria Executiva de Articulação e Parcerias (SEAP)'
    },
    {
      codigo: 'UTB-011',
      nome: 'Gerência Regional de Educação de João Pessoa (1ª Região)',
      descricaoCompleta: 'UTB-011 - Gerência Regional de Educação de João Pessoa (1ª Região)'
    },
    {
      codigo: 'UTB-012',
      nome: 'Gerência Regional de Educação de Guarabira (2ª Região)',
      descricaoCompleta: 'UTB-012 - Gerência Regional de Educação de Guarabira (2ª Região)'
    },
    {
      codigo: 'UTB-013',
      nome: 'Gerência Regional de Educação de Campina Grande (3ª Região)',
      descricaoCompleta: 'UTB-013 - Gerência Regional de Educação de Campina Grande (3ª Região)'
    },
    {
      codigo: 'UTB-014',
      nome: 'Gerência Regional de Educação de Cuité (4ª Região)',
      descricaoCompleta: 'UTB-014 - Gerência Regional de Educação de Cuité (4ª Região)'
    },
    {
      codigo: 'UTB-015',
      nome: 'Gerência Regional de Educação de Monteiro (5ª Região)',
      descricaoCompleta: 'UTB-015 - Gerência Regional de Educação de Monteiro (5ª Região)'
    }
  ]);

  // Lista de servidores por UTB para busca de chefe
  readonly servidores = signal<ServidorUtbItem[]>([
    {
      matricula: '170',
      cpf: '123.456.789-00',
      nome: 'Mikael Oliveira da Silva',
      cargo: 'Analista de Gestão Governamental',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-001'
    },
    {
      matricula: '185',
      cpf: '234.567.890-11',
      nome: 'Ana Beatriz Vasconcelos',
      cargo: 'Técnico Administrativo',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-001'
    },
    {
      matricula: '203',
      cpf: '345.678.901-22',
      nome: 'Carlos Eduardo de Morais',
      cargo: 'Especialista em Políticas Públicas',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-001'
    },
    {
      matricula: '194',
      cpf: '456.789.012-33',
      nome: 'Patrícia Helena Farias',
      cargo: 'Auditor de Controle Interno',
      situacaoFuncional: 'Afastado',
      utbCodigo: 'UTB-001'
    },
    {
      matricula: '143',
      cpf: '567.890.123-44',
      nome: 'Ricardo Mendonça Lima',
      cargo: 'Analista de Gestão Governamental',
      situacaoFuncional: 'Licença',
      utbCodigo: 'UTB-001'
    },
    {
      matricula: '190',
      cpf: '678.901.234-55',
      nome: 'Juliana Cavalcanti Costa',
      cargo: 'Técnico em Administração Pública',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-001'
    },
    {
      matricula: '131',
      cpf: '789.012.345-66',
      nome: 'Fernando Henrique Santos',
      cargo: 'Analista de Sistemas Governamentais',
      situacaoFuncional: 'Cedido',
      utbCodigo: 'UTB-001'
    },
    {
      matricula: '201',
      cpf: '890.123.456-77',
      nome: 'Renata Silveira Pinto',
      cargo: 'Analista de Gestão Governamental',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-001'
    },
    {
      matricula: '210',
      cpf: '901.234.567-88',
      nome: 'Gabriel Arcoverde Medeiros',
      cargo: 'Técnico Administrativo',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-001'
    },
    {
      matricula: '155',
      cpf: '012.345.678-99',
      nome: 'Roberta Dantas Barreto',
      cargo: 'Especialista em Gestão de Pessoas',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-001'
    },
    {
      matricula: '177',
      cpf: '111.222.333-44',
      nome: 'Thiago Moura Linhares',
      cargo: 'Analista de Planejamento',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-001'
    },
    // UTB-002 Servidores
    {
      matricula: '180',
      cpf: '333.444.555-66',
      nome: 'Mariana Duarte Gusmão',
      cargo: 'Analista de Planejamento e Orçamento',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-002'
    },
    {
      matricula: '182',
      cpf: '444.555.666-77',
      nome: 'Rodrigo Albuquerque Paiva',
      cargo: 'Técnico de Gestão Pública',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-002'
    },
    // UTB-003 Servidores (Recursos Humanos / Gestão de Pessoas)
    {
      matricula: '301',
      cpf: '222.333.444-55',
      nome: 'Mariana Albuquerque Feitosa',
      cargo: 'Especialista em Gestão de Pessoas',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-003'
    },
    {
      matricula: '302',
      cpf: '333.444.555-66',
      nome: 'Felipe Augusto Diniz',
      cargo: 'Analista de Recursos Humanos',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-003'
    },
    {
      matricula: '303',
      cpf: '444.555.666-77',
      nome: 'Juliana Beatriz Lacerda',
      cargo: 'Técnico em Gestão Pública',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-003'
    },
    {
      matricula: '304',
      cpf: '555.666.777-88',
      nome: 'Thiago Valença Brandão',
      cargo: 'Analista de Folha e Benefícios',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-003'
    },
    {
      matricula: '305',
      cpf: '666.777.888-99',
      nome: 'Patrícia Nogueira Campos',
      cargo: 'Coordenadora de Desenvolvimento Humano',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-003'
    },
    {
      matricula: '306',
      cpf: '777.888.999-00',
      nome: 'Lucas Cavalcanti Rangel',
      cargo: 'Assistente Administrativo',
      situacaoFuncional: 'Afastado',
      utbCodigo: 'UTB-003'
    },
    // UTB-004 Servidores (TIC / Modernização)
    {
      matricula: '401',
      cpf: '101.202.303-44',
      nome: 'Carlos Eduardo de Morais',
      cargo: 'Diretor de Tecnologia e Informação',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-004'
    },
    {
      matricula: '402',
      cpf: '202.303.404-55',
      nome: 'Beatriz Vasconcelos Ramos',
      cargo: 'Arquiteta de Software Governamental',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-004'
    },
    {
      matricula: '403',
      cpf: '303.404.505-66',
      nome: 'Gustavo Henrique Albuquerque',
      cargo: 'Especialista em Segurança Cibernética',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-004'
    },
    {
      matricula: '404',
      cpf: '404.505.606-77',
      nome: 'Amanda Caroline Dias',
      cargo: 'Analista de Infraestrutura de Nuvem',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-004'
    },
    {
      matricula: '405',
      cpf: '505.606.707-88',
      nome: 'Rodrigo César Meireles',
      cargo: 'Analista de Dados Públicos',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-004'
    },
    {
      matricula: '406',
      cpf: '606.707.808-99',
      nome: 'Viviane Lima Siqueira',
      cargo: 'Desenvolvedora Full-Stack',
      situacaoFuncional: 'Cedido',
      utbCodigo: 'UTB-004'
    },
    // UTB-005 Servidores (Planejamento Estratégico)
    {
      matricula: '501',
      cpf: '711.822.933-04',
      nome: 'Helena Montenegro Guimarães',
      cargo: 'Analista de Planejamento Governamental',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-005'
    },
    {
      matricula: '502',
      cpf: '822.933.044-15',
      nome: 'Marcelo Tavares de Souza',
      cargo: 'Especialista em Políticas Públicas',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-005'
    },
    {
      matricula: '503',
      cpf: '933.044.155-26',
      nome: 'Cláudia Regina Fontes',
      cargo: 'Coordenadora de Gestão de Projetos',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-005'
    },
    {
      matricula: '504',
      cpf: '044.155.266-37',
      nome: 'Diego Fernandes Paiva',
      cargo: 'Economista de Gestão Pública',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-005'
    },
    {
      matricula: '505',
      cpf: '155.266.377-48',
      nome: 'Camila Rocha Vilar',
      cargo: 'Estatística de Dados Estratégicos',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-005'
    },
    // UTB-007 / UTB-008 Servidores
    {
      matricula: '701',
      cpf: '266.377.488-59',
      nome: 'Renato Silveira Antunes',
      cargo: 'Analista de Governança Pública',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-007'
    },
    {
      matricula: '702',
      cpf: '377.488.599-60',
      nome: 'Vanessa Correia Lima',
      cargo: 'Técnica de Administração',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-007'
    },
    {
      matricula: '801',
      cpf: '488.599.600-71',
      nome: 'Eduardo Brandão Coutinho',
      cargo: 'Especialista em Modernização do Estado',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-008'
    },
    {
      matricula: '703',
      cpf: '266.377.488-88',
      nome: 'Luciana Rocha Pinheiro',
      cargo: 'Gerente de Seleção e Carreiras',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-007'
    },
    {
      matricula: '802',
      cpf: '488.599.600-99',
      nome: 'Gabriel Menezes Silva',
      cargo: 'Especialista em Modernização do Estado',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-008'
    },
    {
      matricula: '901',
      cpf: '599.600.711-02',
      nome: 'Mariana Costa Valente',
      cargo: 'Analista de Gestão Estratégica',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-009'
    },
    {
      matricula: '1001',
      cpf: '711.822.933-24',
      nome: 'Fernanda Albuquerque Lima',
      cargo: 'Coordenadora de Articulação',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-010'
    },
    {
      matricula: '211',
      cpf: '812.933.044-35',
      nome: 'Carlos Andrade Meireles',
      cargo: 'Especialista em Gestão Educacional',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-011'
    },
    {
      matricula: '212',
      cpf: '923.044.155-46',
      nome: 'Beatriz Cavalcanti Ramos',
      cargo: 'Supervisora de Ensino Regional',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-012'
    },
    {
      matricula: '213',
      cpf: '034.155.266-57',
      nome: 'Eduardo Vasconcelos Brito',
      cargo: 'Analista de Gestão Governamental',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-013'
    },
    {
      matricula: '214',
      cpf: '145.266.377-68',
      nome: 'Heloísa Maria Guimarães',
      cargo: 'Coordenadora Pedagógica Regional',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-014'
    },
    {
      matricula: '215',
      cpf: '256.377.488-79',
      nome: 'Marcos Vinícius Peixoto',
      cargo: 'Gestor Escolar Regional',
      situacaoFuncional: 'Em exercício',
      utbCodigo: 'UTB-015'
    }
  ]);

  // Lista de Secretarias Gerais padrão (cenário inicial)
  private readonly defaultSecretarias: SecretariaGeralItem[] = [
    {
      id: '1',
      nome: 'Secretaria Geral de Governo e Articulação Institucional',
      utbCodigo: 'UTB-001',
      utbNome: 'UTB-001 - Secretaria de Estado da Administração (SEAD)',
      criadorEditor: 'Mikael Oliveira',
      dataCriacao: '15/01/2024 09:30',
      dataAtualizacao: '10/05/2024 14:15',
      status: 'ATIVO',
      chefeImediato: {
        matricula: '170',
        cpf: '123.456.789-00',
        nome: 'Mikael Oliveira da Silva',
        cargo: 'Analista de Gestão Governamental',
        situacaoFuncional: 'Em exercício',
        atoGovernamental: {
          numero: '1.420/2024',
          dataPublicacao: '15/01/2024',
          documento: {
            id: 'doc-ato-1',
            nomeArquivo: 'ato_nomeacao_chefe_1420_2024.pdf',
            tamanho: '2.4 MB',
            tipo: 'pdf',
            dataUpload: '15/01/2024 10:00'
          }
        }
      },
      normativaCriacao: {
        nome: 'Decreto Estadual nº 42.150/2023 - Estrutura Organizacional do Poder Executivo',
        numero: '42.150',
        dataPublicacao: '02/01/2023',
        documento: {
          id: 'doc-norm-cria-1',
          nomeArquivo: 'decreto_42150_2023_criacao_sec_geral.pdf',
          tamanho: '4.1 MB',
          tipo: 'pdf',
          dataUpload: '02/01/2023 11:15'
        }
      },
      normativaExtincao: undefined,
      subordinadas: [
        {
          id: 'sub-1',
          tipo: 'Secretaria Executiva',
          nome: 'Secretaria Executiva de Recursos Humanos e Folha',
          chefiaImediata: 'Mariana Albuquerque Feitosa',
          utb: 'UTB-001/RH - Subunidade de Gestão de Pessoas',
          gerenciasRegionais: [
            {
              id: 'gr-1',
              tipo: 'Gerência Regional',
              nome: 'Gerência Regional de João Pessoa - 1ª Região',
              chefiaImediata: 'Dr. Roberto Sales Bezerra',
              utb: 'UTB-010/JP - Coordenação Regional Metropolitana',
              secretariaExecutivaId: 'sub-1'
            }
          ]
        },
        {
          id: 'sub-2',
          tipo: 'Secretaria Executiva',
          nome: 'Secretaria Executiva de Modernização e Tecnologia',
          chefiaImediata: 'Carlos Eduardo de Morais',
          utb: 'UTB-001/TIC - Diretoria de Tecnologia',
          gerenciasRegionais: [
            {
              id: 'gr-2',
              tipo: 'Gerência Regional',
              nome: 'Gerência Regional de Campina Grande - 3ª Região',
              chefiaImediata: 'Patrícia Helena Farias',
              utb: 'UTB-015/CG - Coordenação Regional da Borborema',
              secretariaExecutivaId: 'sub-2'
            }
          ]
        }
      ]
    },
    {
      id: '2',
      nome: 'Secretaria Geral da Governadoria do Estado (Extinta)',
      utbCodigo: 'UTB-002',
      utbNome: 'UTB-002 - Secretaria de Estado do Planejamento, Orçamento e Gestão (SEPLAG)',
      criadorEditor: 'Mikael Oliveira',
      dataCriacao: '10/02/2021 08:00',
      dataAtualizacao: '30/12/2023 16:45',
      status: 'INATIVO',
      chefeImediato: undefined,
      normativaCriacao: {
        nome: 'Lei Estadual nº 11.230/2021 - Criação da Secretaria Geral da Governadoria',
        numero: '11.230',
        dataPublicacao: '15/02/2021',
        documento: {
          id: 'doc-norm-cria-2',
          nomeArquivo: 'lei_11230_2021_criacao_sec_gov.pdf',
          tamanho: '3.2 MB',
          tipo: 'pdf',
          dataUpload: '15/02/2021 09:00'
        }
      },
      normativaExtincao: {
        nome: 'Lei Complementar nº 184/2023 - Extinção e Incorporação da Secretaria Geral',
        numero: '184',
        dataPublicacao: '30/12/2023',
        documento: {
          id: 'doc-norm-ext-2',
          nomeArquivo: 'lei_compl_184_2023_extincao_oficial.pdf',
          tamanho: '1.9 MB',
          tipo: 'pdf',
          dataUpload: '30/12/2023 14:20'
        }
      },
      subordinadas: []
    }
  ];

  // Lista de Secretarias Gerais cadastradas (reativa)
  readonly items = signal<SecretariaGeralItem[]>(JSON.parse(JSON.stringify(this.defaultSecretarias)));

  // Identificador do cenário customizado ativo
  readonly cenarioAtivo = signal<string | null>(null);

  // Mock data de Gerências Regionais vinculadas às Secretarias Executivas (preservadas para CRUD futuro)
  readonly gerenciasRegionaisSimuladas = signal<GerenciaRegionalItem[]>([
    {
      id: 'gr-1',
      tipo: 'Gerência Regional',
      nome: 'Gerência Regional de João Pessoa - 1ª Região',
      chefiaImediata: 'Dr. Roberto Sales Bezerra',
      utb: 'UTB-010/JP - Coordenação Regional Metropolitana',
      secretariaExecutivaId: 'sub-1'
    },
    {
      id: 'gr-2',
      tipo: 'Gerência Regional',
      nome: 'Gerência Regional de Campina Grande - 3ª Região',
      chefiaImediata: 'Patrícia Helena Farias',
      utb: 'UTB-015/CG - Coordenação Regional da Borborema',
      secretariaExecutivaId: 'sub-2'
    }
  ]);

  restaurarCenarioPadrao() {
    this.items.set(JSON.parse(JSON.stringify(this.defaultSecretarias)));
    this.cenarioAtivo.set(null);
  }

  aplicarCenario(cenario: string) {
    this.cenarioAtivo.set(cenario);
    const baseItems: SecretariaGeralItem[] = JSON.parse(JSON.stringify(this.defaultSecretarias));

    switch (cenario) {
      case 'cadastro_permitido':
        // 1. Cadastro permitido: nenhuma Secretaria Geral ativa
        this.items.set(baseItems.map(it => ({ ...it, status: 'INATIVO' as const })));
        break;

      case 'cadastro_bloqueado':
        // 2. Cadastro bloqueado: existe Secretaria Geral ativa
        this.items.set(baseItems.map(it => it.id === '1' ? { ...it, status: 'ATIVO' as const } : it));
        break;

      case 'inativacao_todos_impedimentos':
        // 3. Inativação — todos os impedimentos: ativo com chefe, subordinadas e sem normativa de extinção
        this.items.set(baseItems.map(it => it.id === '1' ? {
          ...it,
          status: 'ATIVO' as const,
          normativaExtincao: undefined
        } : it));
        break;

      case 'inativacao_somente_chefia':
        // 4. Inativação — somente chefia vinculada: ativo com chefe, sem subordinadas e com normativa anexada
        this.items.set(baseItems.map(it => it.id === '1' ? {
          ...it,
          status: 'ATIVO' as const,
          subordinadas: [],
          normativaExtincao: {
            nome: 'Lei Complementar nº 184/2023 - Extinção da Secretaria Geral',
            numero: '184',
            dataPublicacao: '30/12/2023',
            documento: {
              id: 'doc-norm-ext-valid',
              nomeArquivo: 'lei_compl_184_2023_extincao_oficial.pdf',
              tamanho: '1.9 MB',
              tipo: 'pdf',
              dataUpload: '30/12/2023 14:20'
            }
          }
        } : it));
        break;

      case 'inativacao_somente_unidades':
        // 5. Inativação — somente unidades vinculadas: ativo sem chefe, com subordinadas e com normativa anexada
        this.items.set(baseItems.map(it => it.id === '1' ? {
          ...it,
          status: 'ATIVO' as const,
          chefeImediato: undefined,
          normativaExtincao: {
            nome: 'Lei Complementar nº 184/2023 - Extinção da Secretaria Geral',
            numero: '184',
            dataPublicacao: '30/12/2023',
            documento: {
              id: 'doc-norm-ext-valid',
              nomeArquivo: 'lei_compl_184_2023_extincao_oficial.pdf',
              tamanho: '1.9 MB',
              tipo: 'pdf',
              dataUpload: '30/12/2023 14:20'
            }
          }
        } : it));
        break;

      case 'inativacao_anexar_normativa':
        // 6. Inativação — anexar normativa: ativo sem chefia, sem subordinadas e sem normativa de extinção
        this.items.set(baseItems.map(it => it.id === '1' ? {
          ...it,
          status: 'ATIVO' as const,
          chefeImediato: undefined,
          subordinadas: [],
          normativaExtincao: undefined
        } : it));
        break;

      case 'inativacao_permitida':
        // 7. Inativação permitida: ativo sem chefia, sem subordinadas e COM normativa de extinção anexada
        this.items.set(baseItems.map(it => it.id === '1' ? {
          ...it,
          status: 'ATIVO' as const,
          chefeImediato: undefined,
          subordinadas: [],
          normativaExtincao: {
            nome: 'Lei Complementar nº 184/2023 - Extinção da Secretaria Geral',
            numero: '184',
            dataPublicacao: '30/12/2023',
            documento: {
              id: 'doc-norm-ext-valid',
              nomeArquivo: 'lei_compl_184_2023_extincao_oficial.pdf',
              tamanho: '1.9 MB',
              tipo: 'pdf',
              dataUpload: '30/12/2023 14:20'
            }
          }
        } : it));
        break;

      case 'registro_inativo':
        // 8. Registro inativo: registro inativo para testar bloqueio de reativação
        this.items.set(baseItems.map(it => it.id === '1' ? {
          ...it,
          status: 'INATIVO' as const
        } : it));
        break;

      case 'edicao_sem_chefe':
        // 9. Edição sem Chefe Imediato: permite adicionar chefe e buscar servidor
        this.items.set(baseItems.map(it => it.id === '1' ? {
          ...it,
          status: 'ATIVO' as const,
          chefeImediato: undefined
        } : it));
        break;

      case 'edicao_sem_normativa_extincao':
        // 10. Edição sem Normativa de Extinção: permite testar expansão do formulário
        this.items.set(baseItems.map(it => it.id === '1' ? {
          ...it,
          status: 'ATIVO' as const,
          normativaExtincao: undefined
        } : it));
        break;

      default:
        this.restaurarCenarioPadrao();
        break;
    }
  }

  getItem(id: string): SecretariaGeralItem | undefined {
    return this.items().find(i => i.id === id);
  }

  hasActiveSecGeral(): boolean {
    return this.items().some(i => i.status === 'ATIVO');
  }

  isUtbEmUso(codigoUtb: string, ignoreId?: string): boolean {
    return this.items().some(i => i.utbCodigo === codigoUtb && i.status === 'ATIVO' && i.id !== ignoreId);
  }

  isNomeDuplicado(nome: string, ignoreId?: string): boolean {
    const nomeLimpo = nome.trim().toLowerCase();
    return this.items().some(i => i.nome.trim().toLowerCase() === nomeLimpo && i.id !== ignoreId);
  }

  getServidoresByUtb(codigoUtb: string): ServidorUtbItem[] {
    return this.servidores().filter(s => s.utbCodigo === codigoUtb);
  }

  add(data: Omit<SecretariaGeralItem, 'id' | 'criadorEditor' | 'dataCriacao'>): SecretariaGeralItem {
    const newId = String(Math.max(...this.items().map(i => Number(i.id)), 0) + 1);
    const now = new Date();
    const dataCriacao = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});

    const newItem: SecretariaGeralItem = {
      id: newId,
      ...data,
      criadorEditor: 'Mikael Oliveira',
      dataCriacao
    };

    this.items.update(list => [newItem, ...list]);
    return newItem;
  }

  update(id: string, data: Partial<SecretariaGeralItem>) {
    const now = new Date();
    const dataAtualizacao = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});

    this.items.update(list => list.map(item => {
      if (item.id === id) {
        return {
          ...item,
          ...data,
          criadorEditor: 'Mikael Oliveira',
          dataAtualizacao
        };
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

  ativar(id: string) {
    const now = new Date();
    const dataAtualizacao = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});

    this.items.update(list => list.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'ATIVO',
          criadorEditor: 'Mikael Oliveira',
          dataAtualizacao
        };
      }
      return item;
    }));
  }

  syncAddSecretariaExecutiva(secExec: { id: string; nome: string; chefiaImediata?: string; utb: string; secretariaGeralId: string }) {
    this.items.update(list => list.map(item => {
      if (item.id === secExec.secretariaGeralId) {
        const existingIdx = item.subordinadas.findIndex(s => s.id === secExec.id);
        const subItem: UnidadeSubordinadaItem = {
          id: secExec.id,
          tipo: 'Secretaria Executiva',
          nome: secExec.nome,
          chefiaImediata: secExec.chefiaImediata || '-',
          utb: secExec.utb
        };
        const newSubordinadas = existingIdx >= 0
          ? item.subordinadas.map(s => s.id === secExec.id ? subItem : s)
          : [...item.subordinadas, subItem];
        return { ...item, subordinadas: newSubordinadas };
      }
      return item;
    }));
  }

  syncUpdateSecretariaExecutiva(id: string, data: { nome?: string; chefiaImediata?: string; utb?: string; secretariaGeralId?: string }) {
    this.items.update(list => list.map(item => {
      if (data.secretariaGeralId && item.id !== data.secretariaGeralId) {
        return {
          ...item,
          subordinadas: item.subordinadas.filter(s => s.id !== id)
        };
      }
      if (data.secretariaGeralId && item.id === data.secretariaGeralId) {
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
              tipo: 'Secretaria Executiva',
              nome: data.nome || '',
              chefiaImediata: data.chefiaImediata || '-',
              utb: data.utb || ''
            }]
          };
        }
      }
      if (!data.secretariaGeralId) {
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

  syncInativarSecretariaExecutiva(id: string) {
    this.items.update(list => list.map(item => ({
      ...item,
      subordinadas: item.subordinadas.filter(s => s.id !== id)
    })));
  }

  getHistoricoAtos(secGeralId?: string, atoAtual?: AtoGovernamental, nomeChefeAtual?: string): HistoricoAtoItem[] {
    const list: HistoricoAtoItem[] = [];
    if (atoAtual && atoAtual.numero) {
      list.push({
        id: 'hist-atual',
        numero: atoAtual.numero,
        chefeImediato: nomeChefeAtual || 'Mikael Oliveira da Silva',
        dataPublicacao: atoAtual.dataPublicacao || '15/01/2024',
        dataImportacao: atoAtual.documento?.dataUpload || '15/01/2024 10:00',
        responsavelImportacao: 'Mikael Oliveira (SEAD)',
        documento: atoAtual.documento || {
          id: 'doc-hist-atual',
          nomeArquivo: 'ato_governamental_nomeacao_vigente.pdf',
          tamanho: '2.4 MB',
          tipo: 'pdf',
          dataUpload: '15/01/2024 10:00'
        }
      });
    }

    // Registros históricos demonstrativos ordenados do mais recente para o mais antigo
    list.push(
      {
        id: 'hist-1',
        numero: 'Ato Governamental nº 3.120/2023',
        chefeImediato: 'Carlos Eduardo de Morais',
        dataPublicacao: '10/02/2023',
        dataImportacao: '10/02/2023 14:15',
        responsavelImportacao: 'Carlos Eduardo Morais',
        documento: {
          id: 'doc-hist-1',
          nomeArquivo: 'ato_3120_2023_nomeacao.pdf',
          tamanho: '1.8 MB',
          tipo: 'pdf',
          dataUpload: '10/02/2023 14:15'
        }
      },
      {
        id: 'hist-2',
        numero: 'Ato Governamental nº 1.050/2021',
        chefeImediato: 'Mariana Duarte Gusmão',
        dataPublicacao: '05/01/2021',
        dataImportacao: '05/01/2021 10:00',
        responsavelImportacao: 'Mariana Duarte Gusmão',
        documento: {
          id: 'doc-hist-2',
          nomeArquivo: 'ato_1050_2021_nomeacao.pdf',
          tamanho: '2.1 MB',
          tipo: 'pdf',
          dataUpload: '05/01/2021 10:00'
        }
      },
      {
        id: 'hist-3',
        numero: 'Ato Governamental nº 890/2019',
        chefeImediato: 'Dr. Roberto Sales Bezerra',
        dataPublicacao: '15/03/2019',
        dataImportacao: '15/03/2019 16:45',
        responsavelImportacao: 'Sistema SIAGE-RH (Migração)',
        documento: {
          id: 'doc-hist-3',
          nomeArquivo: 'ato_890_2019_nomeacao.pdf',
          tamanho: '1.4 MB',
          tipo: 'pdf',
          dataUpload: '15/03/2019 16:45'
        }
      }
    );

    return list;
  }
}

// ==========================================
// ADAPTADOR DE DATA PARA S-DATEPICKER
// ==========================================

class DataFormulario {
  readonly dateControl = new FormControl<Date | null>(null);
  private digitada = '';
  private atualizando = false;
  private input: HTMLInputElement | null = null;

  constructor(readonly control: FormControl<string>) {
    this.aplicarErros(control.value);
    control.valueChanges.pipe(takeUntilDestroyed()).subscribe(value => {
      this.aplicarErros(value);
      if (this.atualizando) return;
      const data = normalizarDataParaBr(value);
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

  private aplicarErros(valor: string) {
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

// ==========================================
// MODAL DE VISUALIZAÇÃO DE DOCUMENTO ANEXO (PADRÃO PROFESSORES / SIAGE-RH V2)
// ==========================================

@Component({
  selector: 'app-visualizar-documento-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatDialogModule,
    MatSnackBarModule,
    NgxExtendedPdfViewerModule,
    SButtonComponent,
    SIconButtonComponent,
    SIconComponent,
    SModalComponent,
    SModalFooterDirective,
    SSpinnerComponent,
    STooltipDirective
  ],
  styles: [`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }
  `],
  template: `
    <s-modal
      [title]="data.titulo || 'Visualizar anexo'"
      [description]="descricaoDocumento()"
      width="780px"
      (cancel)="fechar()"
    >
      <!-- CORPO PRINCIPAL DO VISUALIZADOR -->
      <div class="relative w-full h-[420px] sm:h-[460px] bg-slate-100 dark:bg-slate-900 rounded-lg border border-siage-border overflow-hidden flex flex-col">
        <!-- INDICADOR DE CARREGAMENTO -->
        @if (isLoading()) {
          <div class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-siage-surface/80 dark:bg-siage-surface/90 backdrop-blur-xs">
            <s-spinner size="md" label="Carregando visualizador de documento..." />
            <span class="text-xs font-medium text-siage-text-secondary">Carregando visualizador de documento...</span>
          </div>
        }

        <!-- MENSAGEM DE ERRO COM BOTÕES DE RECUPERAÇÃO -->
        @if (hasError()) {
          <div class="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div class="w-14 h-14 rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 flex items-center justify-center mb-3">
              <s-icon name="error" size="md" variant="destructive" />
            </div>
            <h3 class="text-sm font-poppins font-bold text-siage-text-primary mb-1">
              Não foi possível exibir a pré-visualização do documento
            </h3>
            <p class="text-xs text-siage-text-secondary max-w-md mb-4 leading-relaxed">
              O arquivo pode conter restrições de formato ou estar temporariamente indisponível para renderização no navegador. Você pode tentar novamente ou realizar o download do arquivo.
            </p>
            <div class="flex items-center gap-3">
              <s-button variant="secondary" outlined (click)="tentarNovamente()">
                Tentar novamente
              </s-button>
              <s-button variant="primary" (click)="baixar()">
                Baixar arquivo
              </s-button>
            </div>
          </div>
        }

        <!-- RENDERIZADOR REAL DE PDF (NGX-EXTENDED-PDF-VIEWER) -->
        @if (isPdf() && !hasError()) {
          <div class="w-full h-full flex-1 min-h-0 overflow-hidden">
            <ngx-extended-pdf-viewer
              [src]="fileUrl()"
              [height]="'100%'"
              [handTool]="false"
              [showPagingButtons]="true"
              [showPreviousAndNextPageButtons]="true"
              [showPageNumber]="true"
              [showZoomButtons]="true"
              [showZoomDropdown]="true"
              [showPresentationModeButton]="false"
              [showOpenFileButton]="false"
              [showPrintButton]="false"
              [showDownloadButton]="false"
              [showSecondaryToolbarButton]="false"
              [showRotateButton]="false"
              [showHandToolButton]="false"
              [showEditorButtons]="false"
              [showTextEditor]="false"
              [showDrawEditor]="false"
              [showStampEditor]="false"
              [showCommentEditor]="false"
              [showHighlightEditor]="false"
              [showSignatureEditor]="false"
              [zoom]="'page-width'"
              (pdfLoaded)="onPdfLoaded()"
              (pdfLoadingFailed)="onPdfLoadingFailed()"
            >
            </ngx-extended-pdf-viewer>
          </div>
        }

        <!-- VISUALIZADOR DE IMAGEM (JPG, JPEG, PNG) -->
        @if (!isPdf() && !hasError()) {
          <div class="flex-1 flex flex-col w-full h-full min-h-0 overflow-hidden">
            <!-- Barra de Zoom para Imagem -->
            <div class="flex items-center justify-between px-4 py-2 bg-siage-surface border-b border-siage-border/40 text-xs">
              <span class="text-siage-text-secondary font-medium">Visualização de imagem</span>
              <div class="flex items-center gap-1.5">
                <s-icon-button icon="remove" label="Diminuir zoom" size="sm" sTooltip="Diminuir zoom" (click)="diminuirZoomImagem()" />
                <span class="w-12 text-center font-mono font-medium">{{ imageZoom() }}%</span>
                <s-icon-button icon="add" label="Aumentar zoom" size="sm" sTooltip="Aumentar zoom" (click)="aumentarZoomImagem()" />
                <s-button variant="secondary" outlined sTooltip="Ajustar" (click)="resetarZoomImagem()">
                  100%
                </s-button>
              </div>
            </div>

            <!-- Imagem com rolagem e zoom -->
            <div class="flex-1 overflow-auto p-4 flex items-center justify-center">
              <img 
                [src]="fileUrl()" 
                [alt]="data.documento.nomeArquivo"
                [style.transform]="'scale(' + (imageZoom() / 100) + ')'"
                class="max-w-full max-h-full object-contain rounded shadow-md transition-transform duration-150"
                (load)="onImageLoaded()"
                (error)="onImageError()"
              />
            </div>
          </div>
        }
      </div>

      <!-- RODAPÉ DE AÇÕES DO MODAL -->
      <div sModalFooter>
        <s-button
          variant="secondary"
          outlined
          icon="download"
          sTooltip="Baixar arquivo para o computador"
          (click)="baixar()"
        >
          Baixar arquivo
        </s-button>

        <s-button variant="primary" (click)="fechar()">
          Fechar
        </s-button>
      </div>
    </s-modal>
  `
})
export class VisualizarDocumentoModal {
  readonly dialogRef = injectModalRef<void, VisualizarDocumentoModal>();
  readonly data = injectModalData<{documento: DocumentoAnexo; titulo?: string; tipoDocumento?: string}>();

  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly imageZoom = signal(100);

  readonly descricaoDocumento = computed(() => {
    const doc = this.data?.documento;
    if (!doc) return '';
    return [
      doc.nomeArquivo,
      doc.tamanho,
      doc.dataUpload ? `Enviado em ${doc.dataUpload}` : ''
    ].filter(Boolean).join(' • ');
  });

  readonly isPdf = computed(() => {
    const nome = (this.data?.documento?.nomeArquivo || '').toLowerCase();
    const tipo = (this.data?.documento?.tipo || '').toLowerCase();
    return nome.endsWith('.pdf') || tipo.includes('pdf');
  });

  readonly fileUrl = computed(() => {
    const doc = this.data?.documento;
    if (doc?.blobUrl) return doc.blobUrl;
    if (doc?.urlSimulada) return doc.urlSimulada;
    if (this.isPdf()) {
      return '/exemplo-documento-comprovacao.pdf';
    }
    return '/logo-see-light.png';
  });

  onPdfLoaded() {
    this.isLoading.set(false);
    this.hasError.set(false);
  }

  onPdfLoadingFailed() {
    this.isLoading.set(false);
    this.hasError.set(true);
  }

  onImageLoaded() {
    this.isLoading.set(false);
    this.hasError.set(false);
  }

  onImageError() {
    this.isLoading.set(false);
    this.hasError.set(true);
  }

  aumentarZoomImagem() {
    this.imageZoom.update(z => Math.min(z + 25, 250));
  }

  diminuirZoomImagem() {
    this.imageZoom.update(z => Math.max(z - 25, 50));
  }

  resetarZoomImagem() {
    this.imageZoom.set(100);
  }

  tentarNovamente() {
    this.hasError.set(false);
    this.isLoading.set(true);
  }

  fechar() {
    this.dialogRef.close();
  }

  baixar() {
    const url = this.fileUrl();
    const filename = this.data?.documento?.nomeArquivo || (this.isPdf() ? 'documento-comprovacao.pdf' : 'anexo-documento.png');
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(url, '_blank');
    }
  }
}

function abrirDocumentoAninhado(dialog: MatDialog, documento: DocumentoAnexo) {
  const ref = dialog.open(VisualizarDocumentoModal, {
    disableClose: true,
    autoFocus: 'dialog',
    restoreFocus: true,
    panelClass: ['s-modal__painel', 'sg-documento-aninhado'],
    backdropClass: ['s-modal-backdrop', 'sg-documento-aninhado-backdrop'],
    width: '780px',
    maxWidth: 'calc(100vw - 2.5rem)',
    data: {documento, titulo: 'Visualizar anexo'}
  });
  ref.keydownEvents().pipe(
    filter(event => event.key === 'Escape'),
    takeUntil(ref.afterClosed())
  ).subscribe(event => {
    event.preventDefault();
    ref.close();
  });
}

// ==========================================
// MODAL DE HISTÓRICO DE ATOS GOVERNAMENTAIS
// ==========================================

@Component({
  selector: 'app-historico-atos-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{provide: S_LOADING_DELAY, useValue: 0}],
  imports: [
    CommonModule,
    MatDialogModule,
    MatSnackBarModule,
    SModalComponent,
    STableComponent
  ],
  styles: [`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }

    :host ::ng-deep s-table .s-table__tabela .s-table__cabecalho th {
      white-space: normal;
      overflow-wrap: anywhere;
    }

    :host ::ng-deep .s-table__tabela td {
      overflow-wrap: anywhere;
    }
  `],
  template: `
    <s-modal
      title="Histórico de Atos Governamentais"
      description="Consulte os atos governamentais registrados para esta Secretaria Geral."
      width="900px"
      variant="result"
      confirmLabel="Fechar"
      (confirm)="fechar()"
      (cancel)="fechar()"
    >
      <s-table
        label="Histórico de Atos Governamentais"
        [columns]="tableColumns"
        [rows]="paginatedAtos()"
        [actions]="tableActions"
        [empty]="tableEmpty"
        [page]="pageIndex() + 1"
        [pageSize]="pageSize()"
        [total]="atos().length"
        (actionClick)="onTableAction($event)"
        (pageChange)="onPageChange($event - 1)"
        (pageSizeChange)="onPageSizeChange($event)"
      />
    </s-modal>
  `
})
export class HistoricoAtosModal {
  readonly dialogRef = injectModalRef<void, HistoricoAtosModal>();
  private readonly dialog = inject(MatDialog);
  readonly data = injectModalData<{atos: HistoricoAtoItem[]}>();

  readonly atos = signal<HistoricoAtoItem[]>(this.data?.atos || []);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly tableColumns: readonly STableColumn<HistoricoAtoItem>[] = [
    {key: 'numero', label: 'Número do Ato Governamental'},
    {key: 'chefeImediato', label: 'Chefe Imediato'},
    {key: 'dataPublicacao', label: 'Data da Publicação'},
    {key: 'dataImportacao', label: 'Data do Cadastro'},
    {key: 'responsavelImportacao', label: 'Responsável pelo Cadastro'}
  ];

  readonly tableActions: readonly STableAction<HistoricoAtoItem>[] = [
    {id: 'view', icon: 'visibility', label: 'Visualizar anexo', variant: 'info', text: true},
    {id: 'download', icon: 'download', label: 'Baixar arquivo', variant: 'primary', text: true}
  ];

  readonly tableEmpty: STableEmpty = {
    variant: 'no-results',
    title: 'Nenhum ato governamental encontrado.',
    description: '',
    actionLabel: ''
  };

  readonly paginatedAtos = computed(() => {
    const size = this.pageSize();
    const start = this.pageIndex() * size;
    return this.atos().slice(start, start + size);
  });

  onPageChange(newIndex: number) {
    this.pageIndex.set(Math.max(0, newIndex));
  }

  onPageSizeChange(newSize: number) {
    this.pageSize.set(newSize);
    this.pageIndex.set(0);
  }

  onTableAction(event: STableActionEvent<HistoricoAtoItem>) {
    if (event.action === 'view') {
      this.visualizar(event.row);
    } else if (event.action === 'download') {
      this.baixar(event.row);
    }
  }

  visualizar(item: HistoricoAtoItem) {
    abrirDocumentoAninhado(this.dialog, item.documento);
  }

  baixar(item: HistoricoAtoItem) {
    const blob = new Blob([`Simulação de documento oficial: ${item.documento.nomeArquivo}`], {type: 'application/pdf'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.documento.nomeArquivo;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  fechar() {
    this.dialogRef.close();
  }
}

// ==========================================
// MODAL DE BUSCA DE SERVIDOR (CHEFIA IMEDIATA)
// ==========================================

@Component({
  selector: 'app-busca-servidor-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{provide: S_LOADING_DELAY, useValue: 0}],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatTooltipModule,
    SBadgeComponent,
    SButtonComponent,
    SFieldComponent,
    SIconButtonComponent,
    SInputComponent,
    SModalComponent,
    SModalFooterDirective,
    STableCellDirective,
    STableComponent,
    STooltipDirective
  ],
  styles: [`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }
  `],
  template: `
    <s-modal
      title="Buscar Servidor"
      width="800px"
      (cancel)="fechar()"
    >
      <div class="flex flex-col gap-4" [class.sg-busca-local]="data.visualSecretariaGeral">
        <!-- Filtros de Pesquisa -->
        <div class="w-full p-4 rounded-lg bg-slate-50/70 dark:bg-slate-900/30 border border-siage-border/40 box-border">
          <form [formGroup]="filtroForm" (ngSubmit)="buscar()" class="flex flex-col gap-3">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
              <div class="form-field-group">
                <s-field label="Matrícula" controlId="busca-mat">
                  <s-input
                    formControlName="matricula"
                    [maxlength]="7"
                    placeholder="Digite a matrícula"
                    (input)="onMatriculaInput($event)"
                  />
                </s-field>
              </div>

              <div class="form-field-group">
                <s-field label="Nome do Servidor" controlId="busca-nome">
                  <s-input
                    formControlName="nome"
                    [maxlength]="200"
                    placeholder="Digite o Nome do Servidor"
                  />
                </s-field>
              </div>

              <div class="form-field-group">
                <s-field label="CPF" controlId="busca-cpf">
                  <s-input
                    formControlName="cpf"
                    [maxlength]="14"
                    placeholder="Digite o CPF"
                    (input)="onCpfInput($event)"
                  />
                </s-field>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-siage-border/30">
              <s-button variant="secondary" outlined (click)="limparFiltros()">
                Limpar
              </s-button>
              <s-button type="submit" variant="primary" icon="search">
                Buscar
              </s-button>
            </div>
          </form>
        </div>

        <!-- Tabela Oficial de Servidores -->
        <s-table
          label="Servidores da UTB"
          [columns]="tableColumns"
          [rows]="paginatedServidores()"
          [empty]="tableEmpty"
          [page]="pageIndex() + 1"
          [pageSize]="pageSize()"
          [pageSizeOptions]="[5, 10, 25]"
          [total]="filteredServidores().length"
          (pageChange)="onPageChange($event - 1)"
          (pageSizeChange)="onPageSizeChange($event)"
        >
          <ng-template sTableCell="acao" let-servidor>
            @if (servidor['situacaoFuncional'] === 'Em exercício') {
              @if (data.visualSecretariaGeral) {
                <s-icon-button icon="add" label="Adicionar" size="md" variant="primary" text
                  sTooltip="Adicionar" (click)="selecionarServidor(servidor)" />
              } @else {
                <button type="button" (click)="selecionarServidor(servidor)" aria-label="Adicionar"
                  matTooltip="Adicionar"
                  class="w-7 h-7 inline-flex items-center justify-center rounded-lg text-siage-primary hover:bg-siage-primary/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40">
                  <mat-icon style="font-size: 18px; width: 18px; height: 18px;">add</mat-icon>
                </button>
              }
            } @else {
              @if (data.visualSecretariaGeral) {
                <span sTooltip="Apenas servidores com situação 'Em exercício' podem ser designados como Chefe Imediato.">
                  <s-badge tone="secondary">Indisponível</s-badge>
                </span>
              } @else {
                <span class="text-[11px] text-siage-text-secondary/60 italic"
                  matTooltip="Apenas servidores com situação 'Em exercício' podem ser designados como Chefe Imediato.">
                  Indisponível
                </span>
              }
            }
          </ng-template>
        </s-table>
      </div>

      <div sModalFooter>
        <s-button variant="secondary" outlined (click)="fechar()">
          Cancelar
        </s-button>
      </div>
    </s-modal>
  `
})
export class BuscaServidorModal {
  readonly dialogRef = injectModalRef<ServidorUtbItem, BuscaServidorModal>();
  readonly data = injectModalData<{utbCodigo: string; utbDescricao: string; visualSecretariaGeral?: boolean}>();
  private readonly service = inject(SecretariaGeralService);

  readonly filtroForm = new FormGroup({
    matricula: new FormControl(''),
    nome: new FormControl(''),
    cpf: new FormControl('')
  });

  readonly pageSize = signal(5);
  readonly pageIndex = signal(0);
  readonly appliedMatricula = signal('');
  readonly appliedNome = signal('');
  readonly appliedCpf = signal('');

  readonly tableColumns: readonly STableColumn<ServidorUtbItem & {acao?: never}>[] = [
    {key: 'nome', label: 'Nome'},
    {key: 'cpf', label: 'CPF'},
    {key: 'matricula', label: 'Matrícula'},
    {key: 'situacaoFuncional', label: 'Situação Funcional'},
    {key: 'acao', label: 'Ação', align: 'end'}
  ];

  readonly tableEmpty: STableEmpty = {
    variant: 'no-results',
    title: 'Nenhum servidor encontrado para os critérios informados.',
    description: '',
    actionLabel: ''
  };

  readonly allServidores = computed(() => {
    return this.service.getServidoresByUtb(this.data.utbCodigo);
  });

  readonly filteredServidores = computed(() => {
    const mat = this.appliedMatricula().trim().toLowerCase();
    const nome = this.appliedNome().trim().toLowerCase();
    const rawCpf = this.appliedCpf().trim();
    const cleanFilterCpf = rawCpf.replace(/\D/g, '');

    return this.allServidores().filter(s => {
      const matchMat = !mat || s.matricula.toLowerCase().includes(mat);
      const matchNome = !nome || s.nome.toLowerCase().includes(nome);
      let matchCpf = true;
      if (cleanFilterCpf) {
        const cleanServidorCpf = s.cpf.replace(/\D/g, '');
        matchCpf = cleanServidorCpf.includes(cleanFilterCpf) || s.cpf.toLowerCase().includes(rawCpf.toLowerCase());
      }
      return matchMat && matchNome && matchCpf;
    });
  });

  readonly paginatedServidores = computed(() => {
    const list = this.filteredServidores();
    const size = this.pageSize();
    const start = this.pageIndex() * size;
    return list.slice(start, start + size);
  });

  onMatriculaInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const clean = input.value.replace(/\D/g, '').slice(0, 7);
    input.value = clean;
    this.filtroForm.get('matricula')?.setValue(clean, {emitEvent: false});
  }

  onCpfInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 11);
    const masked = formatarCpf(digits);
    input.value = masked;
    this.filtroForm.get('cpf')?.setValue(masked, {emitEvent: false});
  }

  buscar() {
    this.appliedMatricula.set(this.filtroForm.get('matricula')?.value || '');
    this.appliedNome.set(this.filtroForm.get('nome')?.value || '');
    this.appliedCpf.set(this.filtroForm.get('cpf')?.value || '');
    this.pageIndex.set(0);
  }

  limparFiltros() {
    this.filtroForm.reset();
    this.appliedMatricula.set('');
    this.appliedNome.set('');
    this.appliedCpf.set('');
    this.pageIndex.set(0);
  }

  onPageChange(newIndex: number) {
    this.pageIndex.set(Math.max(0, newIndex));
  }

  onPageSizeChange(newSize: number) {
    this.pageSize.set(newSize);
    this.pageIndex.set(0);
  }

  selecionarServidor(servidor: ServidorUtbItem | Record<string, unknown>) {
    this.dialogRef.close(servidor as unknown as ServidorUtbItem);
  }

  fechar() {
    this.dialogRef.close();
  }
}

// ==========================================
// MODAL DE IMPEDIMENTO DE INATIVAÇÃO
// ==========================================

@Component({
  selector: 'app-impedimento-inativacao-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatDialogModule, SModalComponent],
  styles: [`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }
  `],
  template: `
    <s-modal
      title="Não é possível inativar"
      description="Para continuar, resolva as seguintes pendências:"
      width="520px"
      variant="result"
      confirmLabel="Fechar"
      (confirm)="fechar()"
      (cancel)="fechar()"
    >
      <ul class="space-y-3 pl-0 list-none font-sans m-0">
        @if (!data.temNormativaExtincao) {
          <li class="text-xs sm:text-sm text-siage-text-primary leading-relaxed flex items-start gap-2">
            <span class="text-siage-primary font-bold select-none text-base leading-none mt-0.5">•</span>
            <div>
              <strong class="font-medium text-siage-text-primary">Normativa de Extinção:</strong>
              <span class="text-siage-text-secondary"> Documento não anexado. Você poderá anexá-lo durante o processo de inativação, após resolver os demais impedimentos.</span>
            </div>
          </li>
        }

        @if (data.totalSubordinadas > 0) {
          <li class="text-xs sm:text-sm text-siage-text-primary leading-relaxed flex items-start gap-2">
            <span class="text-siage-primary font-bold select-none text-base leading-none mt-0.5">•</span>
            <div>
              <strong class="font-medium text-siage-text-primary">Unidades vinculadas:</strong>
              <span class="text-siage-text-secondary"> Existem {{ data.totalSubordinadas }} {{ data.unidadesDescricao || 'Secretarias Executivas' }} vinculadas. Desvincule as {{ data.unidadesDescricao || 'Secretarias Executivas' }} antes de inativar.</span>
            </div>
          </li>
        }

        @if (data.totalProfissionais && data.totalProfissionais > 0) {
          <li class="text-xs sm:text-sm text-siage-text-primary leading-relaxed flex items-start gap-2">
            <span class="text-siage-primary font-bold select-none text-base leading-none mt-0.5">•</span>
            <div>
              <strong class="font-medium text-siage-text-primary">Profissionais vinculados:</strong>
              <span class="text-siage-text-secondary"> Existem {{ data.totalProfissionais }} profissionais vinculados a esta unidade. Remova ou transfira os vínculos antes de inativar.</span>
            </div>
          </li>
        }

        @if (data.temChefe) {
          <li class="text-xs sm:text-sm text-siage-text-primary leading-relaxed flex items-start gap-2">
            <span class="text-siage-primary font-bold select-none text-base leading-none mt-0.5">•</span>
            <div>
              <strong class="font-medium text-siage-text-primary">Chefia Imediata:</strong>
              <span class="text-siage-text-secondary"> Existe um Chefe Imediato vinculado ({{ data.nomeChefe || 'Servidor vinculado' }}). Remova o vínculo da chefia antes de inativar.</span>
            </div>
          </li>
        }
      </ul>
    </s-modal>
  `
})
export class ImpedimentoInativacaoModal {
  readonly dialogRef = injectModalRef<void, ImpedimentoInativacaoModal>();
  readonly data = injectModalData<{
    nome: string;
    temNormativaExtincao: boolean;
    totalSubordinadas: number;
    unidadesDescricao?: string;
    totalProfissionais?: number;
    temChefe: boolean;
    nomeChefe?: string;
  }>();

  fechar() {
    this.dialogRef.close();
  }
}

// ==========================================
// MODAL DE ANEXAR NORMATIVA DE EXTINÇÃO
// ==========================================

@Component({
  selector: 'app-anexar-normativa-extincao-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'pt-BR'},
    {provide: DateAdapter, useClass: SDateAdapter},
    {provide: MAT_DATE_FORMATS, useValue: S_DATE_FORMATS},
    {provide: MatDatepickerIntl, useClass: SDatepickerIntl}
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
    SDatepickerComponent,
    SFieldComponent,
    SFileUploadComponent,
    SIconButtonComponent,
    SInputComponent,
    SModalComponent,
    STooltipDirective
  ],
  styles: [`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }
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
    <s-modal
      title="Anexar Normativa de Extinção"
      [description]="'Informe os dados da normativa e anexe o documento oficial para inativar a ' + data.nome + '.'"
      width="560px"
      variant="destructive"
      cancelLabel="Cancelar"
      confirmLabel="Sim, inativar"
      (cancel)="cancelar()"
      (confirm)="concluir()"
    >
      <form [formGroup]="form" (ngSubmit)="concluir()" class="flex flex-col gap-4 font-sans text-left">
        <!-- Nome da Normativa -->
        <div class="form-field-group">
          <s-field
            label="Nome da Normativa de Extinção"
            controlId="modal-norm-nome"
            required
            [showCharCounter]="!form.controls.nome.invalid || !form.controls.nome.touched"
            [maxlength]="100"
            [error]="erroObrigatorio(form.controls.nome, 'O Nome da Normativa é obrigatório.', 'O Nome da Normativa deve ter no máximo 100 caracteres.')"
          >
            <s-input
              formControlName="nome"
              [maxlength]="100"
              placeholder="Digite o Nome da Normativa de Extinção"
              (focusout)="form.controls.nome.markAsTouched()"
            />
          </s-field>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Número da Normativa -->
          <div class="form-field-group">
            <s-field
              label="Número da Normativa"
              controlId="modal-norm-numero"
              required
              [error]="erroObrigatorio(form.controls.numero, 'O Número da Normativa é obrigatório.', 'O Número da Normativa deve ter no máximo 20 caracteres.')"
            >
              <s-input
                formControlName="numero"
                [maxlength]="20"
                placeholder="Digite o Número da Normativa"
                (focusout)="form.controls.numero.markAsTouched()"
              />
            </s-field>
          </div>

          <!-- Data da Publicação -->
          <div class="form-field-group">
            <s-field
              label="Data da Publicação"
              controlId="modal-norm-data"
              required
              [error]="erroData(form.controls.dataPublicacao)"
            >
              <s-datepicker
                [formControl]="dataPicker.dateControl"
                [min]="dataMinima"
                [max]="dataMaxima"
                [openOnClick]="false"
                placeholder="DD/MM/AAAA"
                (input)="dataPicker.onInput($event)"
                (focusout)="dataPicker.onFocusOut($event)"
              />
            </s-field>
          </div>
        </div>

        <!-- Anexo do Documento -->
        <s-field
          id="container-anexo-modal"
          label="Documento Anexo da Normativa (PDF, JPG, JPEG ou PNG até 10 MB)"
          required
          [error]="tentouSalvarSemDoc() ? 'É obrigatório anexar o documento da normativa.' : ''"
        >
          <div
            tabindex="0"
            class="rounded-lg focus:outline-none focus:ring-2 focus:ring-siage-primary/40"
            (dragover)="$event.preventDefault()"
            (drop)="onArquivoSolto($event, !!documento())"
          >
            <div class="flex items-center gap-2 flex-wrap" [class.sg-anexo-com-arquivo]="!!documento()">
              @if (documento(); as doc) {
                <s-icon-button icon="visibility" label="Visualizar anexo" size="sm" variant="info" text sTooltip="Visualizar anexo" (click)="visualizarDoc(doc)" />
              }
              <s-file-upload
                appearance="button"
                buttonLabel="Selecionar arquivo"
                [formControl]="arquivoControl"
                [fileName]="documento()?.nomeArquivo"
                [fileId]="documento()?.id"
                [allowDownload]="true"
                [accept]="['pdf', 'jpg', 'jpeg', 'png']"
                [maxSizeMb]="10"
                [showErrorDialog]="false"
                (fileSelected)="onFileSelected($event)"
                (fileRemoved)="removerDoc()"
                (fileError)="onFileUploadError($event)"
                (download)="baixarDoc(documento()!)"
                (click)="onCliqueDownloadLocal($event, arquivoControl.value, documento())"
              />
            </div>
            @if (!canAnexarDoc() && !documento()) {
              <span class="block text-xs text-siage-text-secondary mt-1">Preencha o Nome, Número e Data da Publicação para habilitar a anexação</span>
            }
          </div>
        </s-field>
      </form>
    </s-modal>
  `
})
export class AnexarNormativaExtincaoModal {
  readonly dialogRef = injectModalRef<NormativaItem, AnexarNormativaExtincaoModal>();
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(SToastService);
  readonly data = injectModalData<{nome: string}>();

  readonly documento = signal<DocumentoAnexo | undefined>(undefined);
  readonly tentouSalvarSemDoc = signal(false);
  readonly dataMinima = new Date(1900, 0, 1);
  readonly dataMaxima = new Date();
  readonly arquivoControl = new FormControl<File | null>({value: null, disabled: true});

  readonly form = new FormGroup({
    nome: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    numero: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(20)] }),
    dataPublicacao: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });
  readonly dataPicker = new DataFormulario(this.form.controls.dataPublicacao);

  readonly nomeVal = toSignal(this.form.controls.nome.valueChanges, { initialValue: '' });
  readonly numeroVal = toSignal(this.form.controls.numero.valueChanges, { initialValue: '' });
  readonly dataVal = toSignal(this.form.controls.dataPublicacao.valueChanges, { initialValue: '' });

  readonly canAnexarDoc = computed(() => {
    const nome = (this.nomeVal() || this.form.controls.nome.value || '').trim();
    const num = (this.numeroVal() || this.form.controls.numero.value || '').trim();
    const data = (this.dataVal() || this.form.controls.dataPublicacao.value || '').trim();
    return nome.length > 0 && nome.length <= 100 && num.length > 0 && num.length <= 20 && validarDataFormato(data) && !dataFutura(data);
  });

  private readonly estadoAnexo = effect(() => {
    const habilitado = this.canAnexarDoc() || !!this.documento();
    if (habilitado && this.arquivoControl.disabled) {
      this.arquivoControl.enable({emitEvent: false});
    } else if (!habilitado && this.arquivoControl.enabled) {
      this.arquivoControl.disable({emitEvent: false});
    }
    if (this.documento() && this.tentouSalvarSemDoc()) {
      this.tentouSalvarSemDoc.set(false);
    }
  });

  erroObrigatorio(control: FormControl<string>, obrigatorio: string, tamanho: string): string {
    if (!control.touched) return '';
    return control.hasError('required') ? obrigatorio : control.hasError('maxlength') ? tamanho : '';
  }

  erroData(control: FormControl<string>): string {
    if (!control.invalid || !control.touched) return '';
    return control.getError('dataRange') || control.getError('dataFormato') || 'A Data da Publicação é obrigatória.';
  }

  onArquivoSolto(event: DragEvent, jaAnexado = false) {
    event.preventDefault();
    if (jaAnexado) return;
    const input = (event.currentTarget as HTMLElement).querySelector<HTMLInputElement>('s-file-upload input[type="file"]');
    if (!input || input.disabled || !event.dataTransfer?.files.length) return;
    input.files = event.dataTransfer.files;
    input.dispatchEvent(new Event('change', {bubbles: true}));
  }

  onFileSelected(file: File | Event | null) {
    if (!file) return;
    if (!this.canAnexarDoc()) {
      this.toast.warning('Preencha os campos obrigatórios da normativa antes de anexar o documento.');
      return;
    }
    const resolved = file instanceof File
      ? file
      : ((file.target as HTMLInputElement | null)?.files?.[0] ?? null);
    if (!resolved) return;
    if (resolved.size > 10 * 1024 * 1024) {
      this.toast.warning('O arquivo excede o limite máximo permitido de 10 MB.');
      return;
    }
    const ext = resolved.name.split('.').pop()?.toLowerCase() as 'pdf' | 'jpg' | 'jpeg' | 'png';
    const doc: DocumentoAnexo = {
      id: 'doc-extincao-' + Date.now(),
      nomeArquivo: resolved.name,
      tamanho: (resolved.size / (1024 * 1024)).toFixed(1) + ' MB',
      tipo: ext || 'pdf',
      dataUpload: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})
    };
    this.documento.set(doc);
    this.tentouSalvarSemDoc.set(false);
    this.toast.success(`Arquivo "${resolved.name}" anexado.`);
  }

  onFileUploadError(error: SFileError) {
    this.toast.warning(error.kind === 'size'
      ? 'O arquivo excede o limite máximo permitido de 10 MB.'
      : 'Formato inválido. Selecione um arquivo PDF, JPG, JPEG ou PNG.');
  }

  removerDoc() {
    this.documento.set(undefined);
    this.arquivoControl.reset();
  }

  visualizarDoc(doc: DocumentoAnexo) {
    abrirDocumentoAninhado(this.dialog, doc);
  }

  baixarDoc(doc: DocumentoAnexo) {
    const blob = new Blob([`Simulação de documento oficial: ${doc.nomeArquivo}`], {type: 'application/pdf'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.nomeArquivo;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  onCliqueDownloadLocal(event: MouseEvent, arquivo: File | null, doc: DocumentoAnexo | undefined) {
    if (arquivo && doc && (event.target as Element).closest('button[aria-label="Baixar arquivo"]')) {
      this.baixarDoc(doc);
    }
  }

  cancelar() {
    this.dialogRef.close();
  }

  focusPrimeiroCampoInvalidoModal() {
    setTimeout(() => {
      const candidateSelectors = [
        '#modal-norm-nome',
        '#modal-norm-numero',
        '#modal-norm-data',
        '#container-anexo-modal'
      ];
      for (const sel of candidateSelectors) {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (el) {
          const isInvalid = el.classList.contains('ng-invalid') ||
            el.getAttribute('aria-invalid') === 'true' ||
            el.querySelector('[aria-invalid="true"], .s-field__error:not(:empty)') !== null;
          if (isInvalid) {
            const target = (el.matches('input:not([type="file"])')
              ? el
              : el.querySelector('input:not([type="file"]), [tabindex="0"]') || el) as HTMLElement;
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.focus();
            return;
          }
        }
      }
    }, 100);
  }

  concluir() {
    this.form.markAllAsTouched();
    this.dataPicker.dateControl.markAsTouched();
    let hasError = false;

    const nome = this.form.controls.nome.value.trim();
    if (!nome) {
      this.form.controls.nome.setErrors({ required: true });
      hasError = true;
    } else if (nome.length > 100) {
      this.form.controls.nome.setErrors({ maxlength: { requiredLength: 100, actualLength: nome.length } });
      hasError = true;
    }

    const num = this.form.controls.numero.value.trim();
    if (!num) {
      this.form.controls.numero.setErrors({ required: true });
      hasError = true;
    } else if (num.length > 20) {
      this.form.controls.numero.setErrors({ maxlength: { requiredLength: 20, actualLength: num.length } });
      hasError = true;
    }

    const data = this.form.controls.dataPublicacao.value.trim();
    if (!data) {
      this.form.controls.dataPublicacao.setErrors({ required: true });
      this.dataPicker.dateControl.setErrors({ required: true });
      hasError = true;
    } else if (!validarDataFormato(data) || dataFutura(data)) {
      const erro = dataFutura(data) ? { dataRange: 'A data não pode ser futura.' } : { dataFormato: 'Informe uma data válida no formato DD/MM/AAAA.' };
      this.form.controls.dataPublicacao.setErrors(erro);
      this.dataPicker.dateControl.setErrors(erro);
      hasError = true;
    }

    if (!this.documento()) {
      this.tentouSalvarSemDoc.set(true);
      hasError = true;
    }

    if (hasError) {
      this.focusPrimeiroCampoInvalidoModal();
      this.toast.warning('Verifique os campos obrigatórios destacados no formulário.');
      return;
    }

    const normativa: NormativaItem = {
      nome,
      numero: num,
      dataPublicacao: normalizarDataParaBr(data),
      documento: this.documento()
    };

    this.dialogRef.close(normativa);
  }
}

// ==========================================
// 1. TELA DE LISTAGEM
// ==========================================

@Component({
  selector: 'app-secretaria-geral-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{provide: S_LOADING_DELAY, useValue: 0}],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatSnackBarModule,
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
          title="Configurar Secretaria Geral"
          description="Gerencie o nível superior da estrutura organizacional do SIAGE-RH, a vinculação de chefia e suas normativas."
          showBack
          (back)="goHierarquia()"
        >
          <s-button
            action
            variant="primary"
            icon="add"
            (click)="onAdicionar()"
            [disabled]="hasActiveSecGeral() || !permissionService.canCreate()"
            [sTooltip]="getAdicionarTooltip()"
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
            <!-- Filtro: Nome (limitado a 200 caracteres conforme RF001) -->
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
          label="Configurar Secretaria Geral"
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
                [ariaLabel]="item.status === 'ATIVO' ? 'Inativar Secretaria Geral' : 'Ativar Secretaria Geral'"
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
export class SecretariaGeralList {
  private readonly router = inject(Router);
  private readonly modalService = inject(SModalService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly toastService = inject(SToastService);
  readonly service = inject(SecretariaGeralService);
  readonly permissionService = inject(PermissionService);
  readonly simulatorService = inject(SimulatorService);

  readonly hasAccess = computed(() => this.permissionService.hasAccess() && this.simulatorService.currentScenario() !== 'access_denied');
  readonly hasActiveSecGeral = computed(() => this.service.hasActiveSecGeral());
  readonly breadcrumbs = [
    {label: 'Início', routerLink: '/inicio'},
    {label: 'Configurações', routerLink: '/configuracoes'},
    {label: 'Hierarquia de Unidades e Cargos', routerLink: '/configuracoes/hierarquia'},
    {label: 'Configurar Secretaria Geral'}
  ];
  readonly statusOptions = [
    {label: 'Todos', value: 'TODOS'},
    {label: 'Ativo', value: 'ATIVO'},
    {label: 'Inativo', value: 'INATIVO'}
  ];

  readonly isCarregando = computed(() => this.simulatorService.currentScenario() === 'loading');
  readonly isErro = computed(() => this.simulatorService.currentScenario() === 'error');

  readonly filtroForm = new FormGroup({
    nome: new FormControl('', [Validators.maxLength(200)]),
    utb: new FormControl(''),
    status: new FormControl('TODOS')
  });
  readonly filtroBuscaForm = new FormGroup({
    ativo: new FormControl('')
  });
  readonly utbTextoDigitado = signal('');

  readonly filtroNomeVal = toSignal(this.filtroForm.controls.nome.valueChanges, { initialValue: '' });
  readonly filtroUtbVal = toSignal(this.filtroForm.controls.utb.valueChanges, { initialValue: '' });

  // Botão Buscar habilitado apenas quando pelo menos um dos filtros Nome ou UTB possuir valor preenchido
  readonly canBuscar = computed(() => {
    const nome = (this.filtroNomeVal() ?? this.filtroForm.controls.nome.value ?? '').trim();
    const utb = (this.filtroUtbVal() ?? this.filtroForm.controls.utb.value ?? this.utbTextoDigitado() ?? '').trim();
    return nome.length > 0 || utb.length > 0;
  });

  readonly appliedNome = signal('');
  readonly appliedUtb = signal('');
  readonly appliedStatus = signal('TODOS');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  // Ordenação: inicial por Data de Criação decrescente; permite crescente/decrescente em Nome e UTB
  readonly sortColumn = signal<'dataCriacao' | 'nome' | 'utb'>('dataCriacao');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  readonly tableColumns: readonly STableColumn<SecretariaGeralItem>[] = [
    {key: 'nome', label: 'Nome da Secretaria Geral', sortable: true},
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

  readonly tableActions = computed<readonly STableAction<SecretariaGeralItem>[]>(() => [
    {
      id: 'view',
      icon: 'visibility',
      label: 'Visualizar Secretaria Geral'
    },
    {
      id: 'edit',
      icon: 'edit',
      label: 'Editar Secretaria Geral',
      hidden: (item) => !this.permissionService.canCreate() || item.status !== 'ATIVO'
    }
  ]);

  readonly tableSort = computed<STableSort | null>(() => ({
    key: this.sortColumn() === 'utb' ? 'utbNome' : this.sortColumn(),
    direction: this.sortDirection()
  }));

  constructor() {
    this.filtroForm.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.atualizarEstadoBusca();
    });
  }

  private atualizarEstadoBusca() {
    const nome = (this.filtroForm.controls.nome.value ?? '').trim();
    const utb = (this.filtroForm.controls.utb.value ?? this.utbTextoDigitado() ?? '').trim();
    const habilitado = nome.length > 0 || utb.length > 0 ? '1' : '';
    if (this.filtroBuscaForm.controls.ativo.value !== habilitado) {
      this.filtroBuscaForm.controls.ativo.setValue(habilitado);
    }
  }

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

  onTableAction(event: STableActionEvent<SecretariaGeralItem>) {
    if (event.action === 'view') {
      this.onVisualizar(event.row);
    } else if (event.action === 'edit') {
      this.onEditar(event.row);
    }
  }

  readonly hasFiltrosAplicados = computed(() => {
    return !!this.appliedNome().trim() || !!this.appliedUtb().trim() || this.appliedStatus() !== 'TODOS';
  });

  readonly isSemRegistros = computed(() => {
    if (this.simulatorService.currentScenario() === 'empty') return true;
    if (this.simulatorService.currentScenario() !== 'normal') return false;
    return this.service.items().length === 0 && !this.hasFiltrosAplicados();
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
      description: 'Ainda não existem secretarias gerais cadastradas.',
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

  // RF001: Exibir somente as UTBs vinculadas às Secretarias Gerais cadastradas (ativas e inativas), ordenadas por código crescente
  readonly utbsVinculadas = computed(() => {
    const items = this.service.items();
    const allMasterUtbs = this.service.utbs();
    
    // Coleta códigos únicos de UTBs presentes nas Secretarias Gerais cadastradas
    const codigos = Array.from(new Set(items.map(i => i.utbCodigo).filter(Boolean)));

    const list = codigos.map(codigo => {
      const found = allMasterUtbs.find(u => u.codigo === codigo);
      if (found) {
        return {
          codigo: found.codigo,
          nome: found.nome,
          descricaoCompleta: `${found.codigo} - ${found.nome}`
        };
      }
      const sec = items.find(i => i.utbCodigo === codigo);
      let nome = codigo;
      if (sec && sec.utbNome) {
        nome = sec.utbNome.replace(`${codigo} - `, '').trim();
      }
      return {
        codigo,
        nome,
        descricaoCompleta: `${codigo} - ${nome}`
      };
    });

    // Ordenar as opções pelo código da UTB em ordem crescente
    return list.sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true, sensitivity: 'base' }));
  });

  readonly utbOptions = computed(() =>
    this.utbsVinculadas().map(u => ({
      label: u.descricaoCompleta,
      value: u.descricaoCompleta
    }))
  );

  readonly filteredUtbsList = computed(() => {
    const query = (this.filtroUtbVal() || this.filtroForm.get('utb')?.value || this.utbTextoDigitado() || '').trim().toLowerCase();
    const list = this.utbsVinculadas();
    if (!query) {
      return list;
    }
    return list.filter(u => 
      u.codigo.toLowerCase().includes(query) || 
      u.nome.toLowerCase().includes(query) ||
      u.descricaoCompleta.toLowerCase().includes(query)
    );
  });

  readonly filteredItems = computed(() => {
    const nome = this.appliedNome().trim().toLowerCase();
    const utb = this.appliedUtb().trim().toLowerCase();
    const status = this.appliedStatus();

    return this.service.items().filter(item => {
      const matchNome = !nome || item.nome.toLowerCase().includes(nome);
      const matchUtb = !utb || 
        item.utbNome.toLowerCase().includes(utb) || 
        item.utbCodigo.toLowerCase().includes(utb) ||
        utb.includes(item.utbCodigo.toLowerCase()) ||
        utb.includes(item.utbNome.toLowerCase());
      let matchStatus = true;
      if (status === 'ATIVO') matchStatus = item.status === 'ATIVO';
      else if (status === 'INATIVO') matchStatus = item.status === 'INATIVO';
      return matchNome && matchUtb && matchStatus;
    });
  });

  readonly sortedItems = computed(() => {
    const list = [...this.filteredItems()];
    const col = this.sortColumn();
    const dir = this.sortDirection();

    return list.sort((a, b) => {
      let comparison = 0;
      if (col === 'nome') {
        comparison = a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
      } else if (col === 'utb') {
        comparison = a.utbNome.localeCompare(b.utbNome, 'pt-BR', { sensitivity: 'base' });
      } else {
        // Padrão inicial: dataCriacao decrescente
        comparison = parseDataBrParaTimestamp(a.dataCriacao) - parseDataBrParaTimestamp(b.dataCriacao);
      }

      if (comparison === 0) {
        // Desempate estável
        comparison = parseDataBrParaTimestamp(b.dataCriacao) - parseDataBrParaTimestamp(a.dataCriacao) || Number(b.id) - Number(a.id);
      }

      return dir === 'asc' ? comparison : -comparison;
    });
  });

  readonly paginatedItems = computed(() => {
    const list = this.sortedItems();
    const size = this.pageSize();
    const start = this.pageIndex() * size;
    return list.slice(start, start + size);
  });

  getAdicionarTooltip(): string {
    if (this.hasActiveSecGeral()) {
      return 'Já existe uma Secretaria Geral ativa. Para cadastrar uma nova, é necessário inativar a anterior.';
    }
    if (!this.permissionService.canCreate()) {
      return 'Perfil sem permissão para adicionar registros.';
    }
    return 'Cadastrar nova Secretaria Geral';
  }

  limparFiltroNome() {
    this.filtroForm.get('nome')?.setValue('');
    this.atualizarEstadoBusca();
    if (this.canBuscar()) {
      this.onBuscar();
    } else {
      this.onLimpar();
    }
  }

  limparFiltroUtb() {
    this.utbTextoDigitado.set('');
    this.filtroForm.get('utb')?.setValue('');
    this.atualizarEstadoBusca();
    if (this.canBuscar()) {
      this.onBuscar();
    } else {
      this.onLimpar();
    }
  }

  onBuscar() {
    if (!this.canBuscar()) {
      return;
    }
    this.appliedNome.set(this.filtroForm.get('nome')?.value || '');
    this.appliedUtb.set(this.filtroForm.get('utb')?.value || this.utbTextoDigitado() || '');
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

  onPageChange(newIndex: number) {
    this.pageIndex.set(Math.max(0, newIndex));
  }

  onPageSizeChange(newSize: number) {
    this.pageSize.set(newSize);
    this.pageIndex.set(0);
  }

  onAdicionar() {
    if (this.hasActiveSecGeral()) {
      this.toastService.warning('Já existe uma Secretaria Geral ativa. Não é possível cadastrar outra.');
      return;
    }
    this.router.navigate(['/configuracoes/hierarquia/secretaria-geral/novo']);
  }

  onVisualizar(item: SecretariaGeralItem) {
    this.router.navigate([`/configuracoes/hierarquia/secretaria-geral/${item.id}`]);
  }

  onEditar(item: SecretariaGeralItem) {
    this.router.navigate([`/configuracoes/hierarquia/secretaria-geral/${item.id}/editar`]);
  }

  onToggleStatus(item: SecretariaGeralItem, chave?: NgModel) {
    if (item.status === 'ATIVO') {
      this.onInativar(item, chave);
    } else {
      this.onAtivar();
    }
  }

  onSwitchChange(item: SecretariaGeralItem, chave: NgModel) {
    this.changeDetector.detectChanges();
    this.onToggleStatus(item, chave);
    const atual = item.status === 'ATIVO';
    chave.viewModel = atual;
    chave.control.setValue(atual, {emitViewToModelChange: false});
    this.changeDetector.detectChanges();
  }

  onAtivar() {
    this.toastService.warning('A inativação de uma Secretaria Geral é irreversível. O registro não pode ser reativado.');
  }

  onInativar(item: SecretariaGeralItem, chave?: NgModel) {
    // 1. Apresentar SEMPRE o modal de confirmação antes de verificar os impedimentos
    void this.modalService.confirm({
      variant: 'destructive',
      title: 'Inativar registro?',
      description: `Deseja inativar ${item.nome}? A inativação é irreversível e o registro não poderá ser reativado.`,
      cancelLabel: 'Cancelar',
      confirmLabel: 'Sim, inativar'
    }).then((confirmado: boolean) => {
      // Ao clicar em Cancelar ou X, fechar o modal sem alterar o status ou a posição do switch
      if (!confirmado) {
        return;
      }

      // 2. Ao clicar em Sim, inativar, verificar as condições necessárias para a inativação
      const temNormativaExtincao = !!item.normativaExtincao?.documento;
      const totalSubordinadas = item.subordinadas?.length || 0;
      const temChefe = !!item.chefeImediato;
      const temOutrosImpedimentos = totalSubordinadas > 0 || temChefe;

      // Se houver unidades subordinadas ou Chefe Imediato vinculados,
      // apresentar o modal de impedimentos com as orientações correspondentes
      if (temOutrosImpedimentos) {
        this.modalService.open(ImpedimentoInativacaoModal, {
          width: '520px',
          maxWidth: 'calc(100vw - 2.5rem)',
          autoFocus: false,
          data: {
            nome: item.nome,
            temNormativaExtincao,
            totalSubordinadas,
            temChefe,
            nomeChefe: item.chefeImediato?.nome
          }
        });
        return;
      }

      // Se NÃO houver outros impedimentos e a Normativa de Extinção estiver ausente,
      // abrir uma etapa de anexação no próprio fluxo
      if (!temNormativaExtincao) {
        const anexarRef = this.modalService.open<AnexarNormativaExtincaoModal, {nome: string}, NormativaItem>(AnexarNormativaExtincaoModal, {
          width: '560px',
          maxWidth: 'calc(100vw - 2.5rem)',
          autoFocus: false,
          data: {
            nome: item.nome
          }
        });

        anexarRef.afterClosed().subscribe((normativa?: NormativaItem) => {
          if (normativa) {
            // Concluir a inativação diretamente sem exigir nova confirmação
            this.service.inativar(item.id, normativa);
            chave?.control.setValue(false, {emitViewToModelChange: false});
            this.toastService.success('Registro inativado com sucesso.');
          }
        });
        return;
      }

      // Se a normativa já estiver anexada e não houver impedimentos,
      // concluir diretamente a inativação após a confirmação inicial
      this.service.inativar(item.id);
      chave?.control.setValue(false, {emitViewToModelChange: false});
      this.toastService.success('Registro inativado com sucesso.');
    });
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
}

// ==========================================
// 2. TELA DE ADICIONAR E EDITAR
// ==========================================

@Component({
  selector: 'app-secretaria-geral-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
    SAutocompleteComponent,
    SButtonComponent,
    SDatepickerComponent,
    SFieldComponent,
    SFileUploadComponent,
    SIconButtonComponent,
    SIconComponent,
    SInputComponent,
    SPageHeaderComponent,
    STableCellDirective,
    STableComponent,
    STooltipDirective,
    AcessoRestritoComponent
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
    @if (!hasAccess()) {
      <app-acesso-restrito backUrl="/configuracoes/hierarquia/secretaria-geral" />
    } @else {
      <div class="flex flex-col gap-6 font-sans pb-20">
        
        <s-page-header
          [breadcrumbs]="breadcrumbs()"
          [title]="isEditMode() ? 'Editar Secretaria Geral' : 'Adicionar Secretaria Geral'"
          [description]="isEditMode() ? 'Atualize as informações, chefia e normativas da Secretaria Geral.' : 'Preencha os campos obrigatórios para estruturar a Secretaria Geral.'"
          showBack
          (back)="onCancelar()"
        />

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
              <!-- Nome da Secretaria Geral -->
              <div class="md:col-span-2 form-field-group">
                <s-field
                  label="Nome da Secretaria Geral"
                  controlId="form-nome"
                  required
                  [showCharCounter]="!form.controls.nome.invalid || !form.controls.nome.touched"
                  [maxlength]="200"
                  [error]="form.controls.nome.hasError('duplicado') ? 'Já existe uma Secretaria Geral cadastrada com este nome.' : form.controls.nome.hasError('required') && form.controls.nome.touched ? 'O Nome da Secretaria Geral é obrigatório.' : ''"
                  (focusout)="form.controls.nome.markAsTouched()"
                >
                  <s-input formControlName="nome" [maxlength]="200" placeholder="Digite o Nome da Secretaria Geral" />
                </s-field>
              </div>

              <!-- Unidade de Trabalho (UTB) -->
              <div class="md:col-span-2 form-field-group">
                <s-field
                  label="Unidade de Trabalho (UTB)"
                  controlId="form-utb"
                  required
                  [error]="(form.get('utbCodigo')?.hasError('required') || utbInputControl.hasError('required')) && (form.get('utbCodigo')?.touched || utbInputControl.touched) ? 'A Unidade de Trabalho (UTB) é obrigatória.' : ''"
                >
                  <s-autocomplete
                    [formControl]="utbAutocompleteControl"
                    [options]="utbOptionsForm()"
                    placeholder="Selecione ou busque uma unidade de trabalho"
                    (input)="onUtbInputForm($event)"
                    (selectionChange)="onUtbAutocompleteSelection($event)"
                    (focusout)="onUtbBlur()"
                  />
                </s-field>
                @if (isUtbBloqueada()) {
                  <span class="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                    <s-icon name="lock" size="xs" />
                    A Unidade de Trabalho (UTB) não pode ser alterada porque existem chefia ou Secretarias Executivas vinculadas.
                  </span>
                }
              </div>
            </div>
          </div>

          <!-- ============================================== -->
          <!-- SEÇÃO 2: CHEFIA IMEDIATA E ATO GOVERNAMENTAL   -->
          <!-- ============================================== -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div class="flex items-center justify-between border-b border-siage-border/40 pb-2 flex-wrap gap-2">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2">
                <s-icon name="badge" size="xs" />
                <span>2. Chefia Imediata e Ato Governamental</span>
              </h3>

              <!-- Ação de Adicionar Chefe (quando ainda não houver chefe) -->
              @if (!chefeImediato()) {
                <s-button
                  variant="primary"
                  icon="person_add"
                  (click)="abrirBuscaChefe()"
                  [disabled]="!form.getRawValue().utbCodigo"
                  [sTooltip]="!form.getRawValue().utbCodigo ? 'Selecione uma Unidade de Trabalho (UTB) primeiro' : 'Buscar servidor vinculado à UTB'"
                >
                  Adicionar Chefe
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
                    <s-button variant="destructive" outlined icon="close" (click)="removerChefe()">
                      Remover Chefe
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
                      <s-icon name="description" size="xs" variant="primary" />
                      <span class="text-xs font-poppins font-bold uppercase tracking-wider text-siage-primary">
                        Ato Governamental de Nomeação *
                      </span>
                    </div>

                    @if (isEditMode()) {
                      <s-button
                        variant="secondary"
                        outlined
                        icon="history"
                        (click)="abrirHistoricoAtos()"
                        sTooltip="Consultar histórico de atos governamentais"
                      >
                        Consultar histórico
                      </s-button>
                    }
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <!-- Número do Ato -->
                    <div class="form-field-group">
                      <s-field label="Número do Ato Governamental" controlId="form-ato-numero" required
                        [error]="erroObrigatorio(atoNumeroControl, 'O Número do Ato Governamental é obrigatório.', 'O Número do Ato Governamental deve ter no máximo 20 caracteres.')">
                        <s-input [formControl]="atoNumeroControl" [maxlength]="20" placeholder="Digite o Número do Ato Governamental" (focusout)="atoNumeroControl.markAsTouched()" />
                      </s-field>
                    </div>

                    <!-- Data da Publicação -->
                    <div class="form-field-group">
                      <s-field label="Data da Publicação" controlId="form-ato-data" required [error]="erroData(atoDataControl)">
                        <s-datepicker [formControl]="atoDataPicker.dateControl" [min]="dataMinima" [max]="dataMaxima" [openOnClick]="false" placeholder="DD/MM/AAAA"
                          (input)="atoDataPicker.onInput($event)" (focusout)="atoDataPicker.onFocusOut($event)" />
                      </s-field>
                    </div>
                  </div>

                  <!-- Anexo do Documento do Ato -->
                  <s-field
                    id="container-anexo-ato"
                    label="Documento do Ato Governamental (PDF, JPG, JPEG, PNG até 10 MB)"
                    required
                    [error]="atoDocInvalido() ? 'É obrigatório anexar o documento do Ato Governamental.' : ''"
                  >
                    <div
                      tabindex="0"
                      class="rounded-lg focus:outline-none focus:ring-2 focus:ring-siage-primary/40"
                      (dragover)="$event.preventDefault()"
                      (drop)="onArquivoSolto($event, !!atoDocumento())"
                    >
                      <div class="flex items-center gap-2 flex-wrap" [class.sg-anexo-com-arquivo]="!!atoDocumento()">
                        @if (atoDocumento(); as doc) {
                          <s-icon-button icon="visibility" label="Visualizar anexo" size="sm" variant="info" text sTooltip="Visualizar anexo" (click)="visualizarDoc(doc, 'Ato Governamental')" />
                        }
                        <s-file-upload
                          appearance="button" buttonLabel="Selecionar arquivo"
                          [formControl]="atoArquivoControl"
                          [fileName]="atoDocumento()?.nomeArquivo" [fileId]="atoDocumento()?.id"
                          [allowDownload]="true"
                          [accept]="['pdf', 'jpg', 'jpeg', 'png']" [maxSizeMb]="10"
                          [showErrorDialog]="false"
                          (fileSelected)="onFileAtoSelected($event)" (fileRemoved)="removerDocAto()"
                          (fileError)="onFileUploadError($event)" (download)="baixarDoc(atoDocumento()!)"
                          (click)="onCliqueDownloadLocal($event, atoArquivoControl.value, atoDocumento())"
                        />
                      </div>
                      @if (!canAnexarAto() && !atoDocumento()) {
                        <span class="block text-xs text-siage-text-secondary mt-1">Preencha o Número do Ato e a Data da Publicação para habilitar a anexação</span>
                      }
                    </div>
                  </s-field>
                </div>
              </div>
            } @else {
              <!-- Estado vazio quando não houver chefe imediato -->
              <div class="py-6 text-center text-xs text-siage-text-secondary border border-dashed border-siage-border rounded-lg flex flex-col items-center justify-center gap-3">
                <p>Nenhum Chefe Imediato vinculado no momento. Selecione uma Unidade de Trabalho (UTB) e clique em "Adicionar Chefe".</p>
                @if (isEditMode()) {
                  <s-button
                    variant="secondary"
                    outlined
                    icon="history"
                    (click)="abrirHistoricoAtos()"
                    sTooltip="Consultar histórico de atos governamentais"
                  >
                    Consultar histórico
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
              <s-icon name="gavel" size="xs" />
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

              @if (isEditMode()) {
                <div class="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <!-- Primeira linha: Nome da Normativa (50%) | Número da Normativa (25%) | Data da Publicação (25%) -->
                  <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Nome da Normativa</span>
                    <span class="text-sm font-medium text-siage-text-primary break-words">{{ normCriacaoNomeControl.value || '-' }}</span>
                  </div>

                  <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Número da Normativa</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ normCriacaoNumeroControl.value || '-' }}</span>
                  </div>

                  <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data da Publicação</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ formatarDataParaExibicao(normCriacaoDataControl.value) }}</span>
                  </div>

                  <!-- Segunda linha: documento anexado ocupando toda a largura -->
                  @if (normCriacaoDoc(); as doc) {
                    <div class="col-span-12 flex items-center gap-2 flex-wrap sg-anexo-com-arquivo">
                      <s-icon-button icon="visibility" label="Visualizar anexo" size="sm" variant="info" text sTooltip="Visualizar anexo" (click)="visualizarDoc(doc, 'Normativa de Criação')" />
                      <s-file-upload [fileName]="doc.nomeArquivo" [fileId]="doc.id" [allowDownload]="true" [allowRemove]="false" (download)="baixarDoc(doc)" />
                    </div>
                  }
                </div>
              } @else {
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="md:col-span-3 form-field-group">
                    <s-field label="Nome da Normativa de Criação" controlId="form-norm-criacao-nome" required
                      [showCharCounter]="!normCriacaoNomeControl.invalid || !normCriacaoNomeControl.touched" [maxlength]="100"
                      [error]="erroObrigatorio(normCriacaoNomeControl, 'O Nome da Normativa de Criação é obrigatório.', 'O Nome da Normativa de Criação deve ter no máximo 100 caracteres.')">
                      <s-input [formControl]="normCriacaoNomeControl" [maxlength]="100" placeholder="Digite o Nome da Normativa de Criação" (focusout)="normCriacaoNomeControl.markAsTouched()" />
                    </s-field>
                  </div>

                  <div class="form-field-group">
                    <s-field label="Número da Normativa" controlId="form-norm-criacao-numero" required
                      [error]="erroObrigatorio(normCriacaoNumeroControl, 'O Número da Normativa de Criação é obrigatório.', 'O Número da Normativa de Criação deve ter no máximo 20 caracteres.')">
                      <s-input [formControl]="normCriacaoNumeroControl" [maxlength]="20" placeholder="Digite o Número da Normativa" (focusout)="normCriacaoNumeroControl.markAsTouched()" />
                    </s-field>
                  </div>

                  <div class="form-field-group">
                    <s-field label="Data da Publicação" controlId="form-norm-criacao-data" required [error]="erroData(normCriacaoDataControl)">
                      <s-datepicker [formControl]="normCriacaoDataPicker.dateControl" [min]="dataMinima" [max]="dataMaxima" [openOnClick]="false" placeholder="DD/MM/AAAA"
                        (input)="normCriacaoDataPicker.onInput($event)" (focusout)="normCriacaoDataPicker.onFocusOut($event)" />
                    </s-field>
                  </div>

                  <!-- Anexo do Documento de Criação -->
                  <s-field
                    id="container-anexo-criacao"
                    class="md:col-span-3"
                    label="Documento Anexo da Normativa de Criação (PDF, JPG, JPEG ou PNG até 10 MB)"
                    required
                    [error]="normCriacaoDocInvalido() ? 'É obrigatório anexar o documento da Normativa de Criação.' : ''"
                  >
                    <div
                      tabindex="0"
                      class="rounded-lg focus:outline-none focus:ring-2 focus:ring-siage-primary/40"
                      (dragover)="$event.preventDefault()"
                      (drop)="onArquivoSolto($event, !!normCriacaoDoc())"
                    >
                      <div class="flex items-center gap-2 flex-wrap" [class.sg-anexo-com-arquivo]="!!normCriacaoDoc()">
                        @if (normCriacaoDoc(); as doc) {
                          <s-icon-button icon="visibility" label="Visualizar anexo" size="sm" variant="info" text sTooltip="Visualizar anexo" (click)="visualizarDoc(doc, 'Normativa de Criação')" />
                        }
                        <s-file-upload
                          appearance="button"
                          buttonLabel="Selecionar arquivo"
                          [formControl]="normCriacaoArquivoControl"
                          [fileName]="normCriacaoDoc()?.nomeArquivo" [fileId]="normCriacaoDoc()?.id"
                          [allowDownload]="true"
                          [accept]="['pdf', 'jpg', 'jpeg', 'png']" [maxSizeMb]="10"
                          [showErrorDialog]="false"
                          (fileSelected)="onFileNormCriacaoSelected($event)"
                          (fileRemoved)="removerDocCriacao()"
                          (fileError)="onFileUploadError($event)"
                          (download)="baixarDoc(normCriacaoDoc()!)"
                          (click)="onCliqueDownloadLocal($event, normCriacaoArquivoControl.value, normCriacaoDoc())"
                        />
                      </div>
                      @if (!canAnexarNormCriacao() && !normCriacaoDoc()) {
                        <span class="block text-xs text-siage-text-secondary mt-1">Preencha o Nome, Número e Data da Publicação para habilitar a anexação</span>
                      }
                    </div>
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
                  <s-button variant="primary" icon="add" (click)="iniciarAdicaoNormativaExtincao()">
                    Adicionar Normativa
                  </s-button>
                }
              </div>

              <!-- CENÁRIO 1: COM NORMATIVA CADASTRADA (já persistida ou recém-adicionada) -->
              @if (temNormativaExtincao()) {
                <div class="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <!-- Primeira linha: Nome da Normativa (50%) | Número da Normativa (25%) | Data da Publicação (25%) -->
                  <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Nome da Normativa</span>
                    <span class="text-sm font-medium text-siage-text-primary break-words">{{ normExtincaoNomeControl.value || '-' }}</span>
                  </div>

                  <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Número da Normativa</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ normExtincaoNumeroControl.value || '-' }}</span>
                  </div>

                  <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data da Publicação</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ formatarDataParaExibicao(normExtincaoDataControl.value) }}</span>
                  </div>

                  <!-- Segunda linha: anexo da Normativa de Extinção ocupando toda a largura -->
                  @if (normExtincaoDoc(); as doc) {
                    <div class="col-span-12 flex items-center gap-2 flex-wrap sg-anexo-com-arquivo">
                      <s-icon-button icon="visibility" label="Visualizar anexo" size="sm" variant="info" text sTooltip="Visualizar anexo" (click)="visualizarDoc(doc, 'Normativa de Extinção')" />
                      <s-file-upload [formControl]="normExtincaoArquivoControl" [fileName]="doc.nomeArquivo" [fileId]="doc.id" [allowDownload]="true" [allowRemove]="false" (download)="baixarDoc(doc)" (click)="onCliqueDownloadLocal($event, normExtincaoArquivoControl.value, doc)" />
                    </div>
                  }
                </div>
              } @else if (expandindoNormativaExtincao()) {
                <!-- CENÁRIO 2: FORMULÁRIO EXPANDIDO (após clicar em Adicionar Normativa) -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 border border-siage-border/60 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-900/30">
                  <div class="md:col-span-3 form-field-group">
                    <s-field label="Nome da Normativa de Extinção" controlId="form-norm-ext-nome" required
                      [showCharCounter]="!normExtincaoNomeControl.invalid || !normExtincaoNomeControl.touched" [maxlength]="100"
                      [error]="erroObrigatorio(normExtincaoNomeControl, 'O Nome da Normativa de Extinção é obrigatório.', 'O Nome da Normativa de Extinção deve ter no máximo 100 caracteres.')">
                      <s-input [formControl]="normExtincaoNomeControl" [maxlength]="100" placeholder="Digite o Nome da Normativa de Extinção" (focusout)="normExtincaoNomeControl.markAsTouched()" />
                    </s-field>
                  </div>

                  <div class="form-field-group">
                    <s-field label="Número da Normativa" controlId="form-norm-ext-numero" required
                      [error]="erroObrigatorio(normExtincaoNumeroControl, 'O Número da Normativa de Extinção é obrigatório.', 'O Número da Normativa de Extinção deve ter no máximo 20 caracteres.')">
                      <s-input [formControl]="normExtincaoNumeroControl" [maxlength]="20" placeholder="Digite o Número da Normativa" (focusout)="normExtincaoNumeroControl.markAsTouched()" />
                    </s-field>
                  </div>

                  <div class="form-field-group">
                    <s-field label="Data da Publicação" controlId="form-norm-ext-data" required [error]="erroData(normExtincaoDataControl)">
                      <s-datepicker [formControl]="normExtincaoDataPicker.dateControl" [min]="dataMinima" [max]="dataMaxima" [openOnClick]="false" placeholder="DD/MM/AAAA"
                        (input)="normExtincaoDataPicker.onInput($event)" (focusout)="normExtincaoDataPicker.onFocusOut($event)" />
                    </s-field>
                  </div>

                  <!-- Anexo da Normativa de Extinção -->
                  <s-field
                    id="container-anexo-extincao"
                    class="md:col-span-3"
                    label="Documento Anexo da Normativa de Extinção (PDF, JPG, JPEG ou PNG até 10 MB)"
                    required
                    [error]="normExtincaoDocInvalido() ? 'É obrigatório anexar o documento da Normativa de Extinção.' : ''"
                  >
                    <div
                      tabindex="0"
                      class="rounded-lg focus:outline-none focus:ring-2 focus:ring-siage-primary/40"
                      (dragover)="$event.preventDefault()"
                      (drop)="onArquivoSolto($event, !!normExtincaoDoc())"
                    >
                      <div class="flex items-center gap-2 flex-wrap" [class.sg-anexo-com-arquivo]="!!normExtincaoDoc()">
                        @if (normExtincaoDoc(); as doc) {
                          <s-icon-button icon="visibility" label="Visualizar anexo" size="sm" variant="info" text sTooltip="Visualizar anexo" (click)="visualizarDoc(doc, 'Normativa de Extinção')" />
                        }
                        <s-file-upload
                          appearance="button" buttonLabel="Selecionar arquivo"
                          [formControl]="normExtincaoArquivoControl"
                          [fileName]="normExtincaoDoc()?.nomeArquivo" [fileId]="normExtincaoDoc()?.id"
                          [allowDownload]="true"
                          [accept]="['pdf', 'jpg', 'jpeg', 'png']" [maxSizeMb]="10"
                          [showErrorDialog]="false"
                          (fileSelected)="onFileNormExtincaoSelected($event)" (fileRemoved)="removerDocExtincao()"
                          (fileError)="onFileUploadError($event)" (download)="baixarDoc(normExtincaoDoc()!)"
                          (click)="onCliqueDownloadLocal($event, normExtincaoArquivoControl.value, normExtincaoDoc())"
                        />
                      </div>
                      @if (!canAnexarNormExtincao() && !normExtincaoDoc()) {
                        <span class="block text-xs text-siage-text-secondary mt-1">Preencha o Nome, Número e Data da Publicação para habilitar a anexação</span>
                      }
                    </div>
                  </s-field>

                  <!-- Botões de Ação do Formulário Expandido -->
                  <div class="md:col-span-3 flex items-center justify-end gap-2 pt-2 border-t border-siage-border/40">
                    <s-button variant="secondary" outlined (click)="cancelarAdicaoNormativaExtincao()">
                      Cancelar
                    </s-button>
                    <s-button variant="primary" icon="check" (click)="confirmarAdicaoNormativaExtincao()">
                      Adicionar
                    </s-button>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- ============================================== -->
          <!-- SEÇÃO 4: SECRETARIAS EXECUTIVAS VINCULADAS     -->
          <!-- ============================================== -->
          @if (isEditMode()) {
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <s-icon name="account_tree" size="xs" />
                <span>4. Secretarias Executivas Vinculadas</span>
              </h3>

              <!-- Filtros de Secretarias Executivas Vinculadas -->
              <div class="flex flex-col gap-4 pt-1">
                <span class="text-xs font-semibold text-siage-text-secondary">Buscar por:</span>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <!-- Filtro: Nome -->
                  <div class="form-field-group">
                    <s-field label="Nome" controlId="filtro-sub-nome">
                      <s-input
                        [formControl]="filtroSubordinadaNome"
                        [maxlength]="200"
                        placeholder="Digite o Nome"
                        (keydown.enter)="$event.preventDefault(); canBuscarSubordinadas() && onBuscarSubordinadas()"
                      />
                    </s-field>
                  </div>

                  <!-- Filtro: Unidade de Trabalho (UTB) (Autocomplete oficial) -->
                  <div class="form-field-group">
                    <s-field label="Unidade de Trabalho (UTB)" controlId="filtro-sub-utb">
                      <s-autocomplete
                        [formControl]="filtroSubordinadaUtb"
                        [options]="utbSubAutocompleteOptions()"
                        placeholder="Selecione ou busque uma unidade de trabalho"
                        (input)="onSubUtbInput($event)"
                        (selectionChange)="onSubUtbSelectionChange($event)"
                        (keydown.enter)="$event.preventDefault(); canBuscarSubordinadas() && onBuscarSubordinadas()"
                      />
                    </s-field>
                  </div>
                </div>

                <!-- Botões Buscar e Limpar -->
                <div class="flex items-center justify-end gap-3 pt-3 border-t border-siage-border/40">
                  <s-button variant="secondary" outlined (click)="onLimparSubordinadas()">Limpar</s-button>
                  <s-button variant="primary" icon="search"
                    (click)="canBuscarSubordinadas() && onBuscarSubordinadas()"
                    [disabled]="!canBuscarSubordinadas()"
                    [sTooltip]="!canBuscarSubordinadas() ? 'Informe o Nome ou a Unidade de Trabalho (UTB) para realizar a busca' : 'Executar busca'"
                  >
                    Buscar
                  </s-button>
                </div>
              </div>

              <!-- Tabela de Subordinadas Oficial SIAGE-UI -->
              <s-table
                label="Secretarias Executivas Vinculadas"
                [columns]="subordinadasColumns"
                [rows]="paginatedSubordinadas()"
                [empty]="subordinadasEmpty"
                [page]="subordinadasPageIndex() + 1"
                [pageSize]="subordinadasPageSize()"
                [total]="filteredSubordinadas().length"
                (pageChange)="onSubordinadasPageChange($event - 1)"
                (pageSizeChange)="onSubordinadasPageSizeChange($event)"
              >
                <ng-template sTableCell="nome" let-sub>
                  <div class="flex flex-col">
                    <span class="text-[10px] uppercase font-bold text-siage-primary block">{{ sub['tipo'] }}</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ sub['nome'] }}</span>
                  </div>
                </ng-template>
              </s-table>
            </div>
          }

          <!-- RODAPÉ DE AÇÕES DO FORMULÁRIO -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-siage-border/40">
            <s-button variant="secondary" outlined (click)="onCancelar()">Cancelar</s-button>
            <s-button
              variant="primary"
              [icon]="isEditMode() ? 'check' : 'save'"
              (click)="onSalvar()"
              [disabled]="isSaving()"
              [loading]="isSaving()"
              loadingText="Salvando..."
            >
              {{ isEditMode() ? 'Atualizar' : 'Salvar' }}
            </s-button>
          </div>
        </form>
      </div>
    }
  `
})
export class SecretariaGeralForm {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly modalService = inject(SModalService);
  private readonly toastService = inject(SToastService);
  readonly service = inject(SecretariaGeralService);
  readonly permissionService = inject(PermissionService);

  readonly isEditMode = signal(false);
  readonly breadcrumbs = computed(() => [
    {label: 'Início', routerLink: '/inicio'},
    {label: 'Configurações', routerLink: '/configuracoes'},
    {label: 'Hierarquia de Unidades e Cargos', routerLink: '/configuracoes/hierarquia'},
    {label: 'Configurar Secretaria Geral', routerLink: '/configuracoes/hierarquia/secretaria-geral'},
    {label: this.isEditMode() ? 'Editar' : 'Cadastrar'}
  ]);
  readonly isSaving = signal(false);
  readonly hasPersistedNormativaExtincao = signal(false);
  itemId: string | null = null;
  currentItem: SecretariaGeralItem | null = null;

  readonly hasAccess = computed(() => {
    if (!this.permissionService.hasAccess()) return false;
    if (!this.isEditMode() && !this.permissionService.canCreate()) return false;
    return true;
  });

  // Formulário de Identificação
  readonly form = new FormGroup({
    nome: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    utbCodigo: new FormControl('', {nonNullable: true, validators: [Validators.required]})
  });
  readonly utbInputControl = new FormControl('', {nonNullable: true});
  readonly utbAutocompleteControl = new FormControl<string | null>(null);
  readonly utbInputVal = toSignal(this.utbInputControl.valueChanges, { initialValue: '' });

  private static readonly obrigatorio = (control: AbstractControl) => control.value?.trim() ? null : {required: true};

  // Chefia Imediata
  readonly chefeImediato = signal<ChefeImediatoItem | undefined>(undefined);
  readonly atoNumeroControl = new FormControl('', {nonNullable: true, validators: [SecretariaGeralForm.obrigatorio, Validators.maxLength(20)]});
  readonly atoDataControl = new FormControl('', {nonNullable: true});
  readonly atoDataPicker = new DataFormulario(this.atoDataControl);
  readonly atoArquivoControl = new FormControl<File | null>({value: null, disabled: true});
  readonly atoDocumento = signal<DocumentoAnexo | undefined>(undefined);
  readonly atoNumeroVal = toSignal(this.atoNumeroControl.valueChanges, { initialValue: '' });
  readonly atoDataVal = toSignal(this.atoDataControl.valueChanges, { initialValue: '' });

  // Normativa de Criação
  readonly normCriacaoNomeControl = new FormControl('', {nonNullable: true, validators: [SecretariaGeralForm.obrigatorio, Validators.maxLength(100)]});
  readonly normCriacaoNumeroControl = new FormControl('', {nonNullable: true, validators: [SecretariaGeralForm.obrigatorio, Validators.maxLength(20)]});
  readonly normCriacaoDataControl = new FormControl('', {nonNullable: true});
  readonly normCriacaoDataPicker = new DataFormulario(this.normCriacaoDataControl);
  readonly normCriacaoArquivoControl = new FormControl<File | null>({value: null, disabled: true});
  readonly dataMinima = new Date(1900, 0, 1);
  readonly dataMaxima = new Date();
  readonly normCriacaoDoc = signal<DocumentoAnexo | undefined>(undefined);
  readonly normCriacaoNomeVal = toSignal(this.normCriacaoNomeControl.valueChanges, { initialValue: '' });
  readonly normCriacaoNumeroVal = toSignal(this.normCriacaoNumeroControl.valueChanges, { initialValue: '' });
  readonly normCriacaoDataVal = toSignal(this.normCriacaoDataControl.valueChanges, { initialValue: '' });

  // Normativa de Extinção
  readonly normExtincaoNomeControl = new FormControl('', {nonNullable: true, validators: [SecretariaGeralForm.obrigatorio, Validators.maxLength(100)]});
  readonly normExtincaoNumeroControl = new FormControl('', {nonNullable: true, validators: [SecretariaGeralForm.obrigatorio, Validators.maxLength(20)]});
  readonly normExtincaoDataControl = new FormControl('', {nonNullable: true});
  readonly normExtincaoDataPicker = new DataFormulario(this.normExtincaoDataControl);
  readonly normExtincaoArquivoControl = new FormControl<File | null>({value: null, disabled: true});
  readonly normExtincaoDoc = signal<DocumentoAnexo | undefined>(undefined);
  readonly normativaExtincaoAdicionada = signal(false);
  readonly expandindoNormativaExtincao = signal(false);
  readonly normExtincaoNomeVal = toSignal(this.normExtincaoNomeControl.valueChanges, { initialValue: '' });
  readonly normExtincaoNumeroVal = toSignal(this.normExtincaoNumeroControl.valueChanges, { initialValue: '' });
  readonly normExtincaoDataVal = toSignal(this.normExtincaoDataControl.valueChanges, { initialValue: '' });

  readonly formatarDataParaExibicao = formatarDataParaExibicao;
  erroObrigatorio(control: FormControl<string>, obrigatorio: string, tamanho: string): string {
    if (!control.touched) return '';
    return control.hasError('required') ? obrigatorio : control.hasError('maxlength') ? tamanho : '';
  }
  erroData(control: FormControl<string>): string {
    if (!control.invalid || !control.touched) return '';
    return control.getError('dataRange') || control.getError('dataFormato') || 'A Data da Publicação é obrigatória.';
  }
  readonly atoDocInvalido = signal(false);
  readonly normCriacaoDocInvalido = signal(false);
  readonly normExtincaoDocInvalido = signal(false);

  readonly temNormativaExtincao = computed(() => {
    return this.hasPersistedNormativaExtincao() || this.normativaExtincaoAdicionada();
  });

  // Habilitação da anexação de documentos conforme preenchimento válido dos campos
  readonly canAnexarAto = computed(() => {
    if (!this.chefeImediato()) return false;
    const num = (this.atoNumeroVal() || this.atoNumeroControl.value || '').trim();
    const data = (this.atoDataVal() || this.atoDataControl.value || '').trim();
    return num.length > 0 && num.length <= 20 && data.length > 0 && validarDataFormato(data) && !dataFutura(data);
  });

  readonly canAnexarNormCriacao = computed(() => {
    const nome = (this.normCriacaoNomeVal() || this.normCriacaoNomeControl.value || '').trim();
    const num = (this.normCriacaoNumeroVal() || this.normCriacaoNumeroControl.value || '').trim();
    const data = (this.normCriacaoDataVal() || this.normCriacaoDataControl.value || '').trim();
    return nome.length > 0 && nome.length <= 100 && num.length > 0 && num.length <= 20 && data.length > 0 && validarDataFormato(data) && !dataFutura(data);
  });

  readonly canAnexarNormExtincao = computed(() => {
    const nome = (this.normExtincaoNomeVal() || this.normExtincaoNomeControl.value || '').trim();
    const num = (this.normExtincaoNumeroVal() || this.normExtincaoNumeroControl.value || '').trim();
    const data = (this.normExtincaoDataVal() || this.normExtincaoDataControl.value || '').trim();
    return nome.length > 0 && nome.length <= 100 && num.length > 0 && num.length <= 20 && data.length > 0 && validarDataFormato(data) && !dataFutura(data);
  });

  private readonly estadoAnexos = effect(() => {
    const campos = [
      [this.atoArquivoControl, this.canAnexarAto(), !!this.atoDocumento(), this.atoDocInvalido],
      [this.normCriacaoArquivoControl, this.canAnexarNormCriacao(), !!this.normCriacaoDoc(), this.normCriacaoDocInvalido],
      [this.normExtincaoArquivoControl, this.canAnexarNormExtincao(), !!this.normExtincaoDoc(), this.normExtincaoDocInvalido]
    ] as const;
    for (const [control, podeAnexar, temDoc, invalido] of campos) {
      const habilitado = podeAnexar || temDoc;
      if (habilitado && control.disabled) control.enable({emitEvent: false});
      else if (!habilitado && control.enabled) control.disable({emitEvent: false});
      if ((!podeAnexar || temDoc) && invalido()) invalido.set(false);
    }
  });

  // Subordinadas (Edição)
  readonly subordinadas = signal<UnidadeSubordinadaItem[]>([]);
  readonly filtroSubordinadaNome = new FormControl('', [Validators.maxLength(200)]);
  readonly filtroSubordinadaUtb = new FormControl<string | null>(null);
  readonly filtroSubUtbTexto = signal('');
  readonly filtroSubNomeVal = toSignal(this.filtroSubordinadaNome.valueChanges, { initialValue: '' });
  readonly filtroSubUtbVal = toSignal(this.filtroSubordinadaUtb.valueChanges, { initialValue: null });
  readonly appliedSubordinadaNome = signal('');
  readonly appliedSubordinadaUtb = signal('');
  readonly subordinadasPageIndex = signal(0);
  readonly subordinadasPageSize = signal(10);

  readonly subordinadasColumns: readonly STableColumn<UnidadeSubordinadaItem>[] = [
    {key: 'nome', label: 'Tipo / Unidade Vinculada'},
    {key: 'chefiaImediata', label: 'Chefia Imediata'},
    {key: 'utb', label: 'Unidade de Trabalho (UTB)'}
  ];

  readonly subordinadasEmpty: STableEmpty = {
    variant: 'no-results',
    title: 'Nenhum vínculo foi encontrado.',
    description: '',
    actionLabel: ''
  };

  // UTBs únicas vinculadas às Secretarias Executivas subordinadas
  readonly utbSubordinadasOptions = computed(() => {
    const list = this.subordinadas();
    const unique = new Map<string, { codigo: string; nome: string; display: string }>();
    for (const s of list) {
      if (s.utb) {
        const parts = s.utb.split(' - ');
        const codigo = parts[0]?.trim() || s.utb.trim();
        const nome = parts.slice(1).join(' - ').trim();
        if (!unique.has(codigo)) {
          unique.set(codigo, {
            codigo,
            nome: nome || codigo,
            display: nome ? `${codigo} - ${nome}` : codigo
          });
        }
      }
    }
    return Array.from(unique.values()).sort((a, b) =>
      a.codigo.localeCompare(b.codigo, undefined, { numeric: true })
    );
  });

  readonly utbSubAutocompleteOptions = computed(() =>
    this.utbSubordinadasOptions().map(u => ({
      label: u.display,
      value: u.display
    }))
  );

  readonly filteredUtbSubOptions = computed(() => {
    const query = (this.filtroSubUtbVal() || this.filtroSubordinadaUtb.value || this.filtroSubUtbTexto() || '').trim().toLowerCase();
    const list = this.utbSubordinadasOptions();
    if (!query) return list;
    return list.filter(u => 
      u.codigo.toLowerCase().includes(query) ||
      u.nome.toLowerCase().includes(query) ||
      u.display.toLowerCase().includes(query)
    );
  });

  readonly canBuscarSubordinadas = computed(() => {
    const nome = (this.filtroSubNomeVal() ?? this.filtroSubordinadaNome.value ?? '').trim();
    const utb = (this.filtroSubUtbVal() ?? this.filtroSubordinadaUtb.value ?? this.filtroSubUtbTexto() ?? '').trim();
    return nome.length > 0 || utb.length > 0;
  });

  onSubUtbInput(event: Event) {
    if (event.target instanceof HTMLInputElement) {
      this.filtroSubUtbTexto.set(event.target.value);
    }
  }

  onSubUtbSelectionChange(selection: SAutocompleteSelection<string>) {
    this.filtroSubUtbTexto.set(selection?.label ?? '');
  }

  onBuscarSubordinadas() {
    if (!this.canBuscarSubordinadas()) return;
    this.appliedSubordinadaNome.set((this.filtroSubordinadaNome.value || '').trim());
    this.appliedSubordinadaUtb.set((this.filtroSubordinadaUtb.value || this.filtroSubUtbTexto() || '').trim());
    this.subordinadasPageIndex.set(0);
  }

  onLimparSubordinadas() {
    this.filtroSubUtbTexto.set('');
    this.filtroSubordinadaNome.setValue('');
    this.filtroSubordinadaUtb.setValue(null);
    this.appliedSubordinadaNome.set('');
    this.appliedSubordinadaUtb.set('');
    this.subordinadasPageIndex.set(0);
  }

  limparFiltroSubNome() {
    this.filtroSubordinadaNome.setValue('');
  }

  limparFiltroSubUtb() {
    this.filtroSubUtbTexto.set('');
    this.filtroSubordinadaUtb.setValue(null);
  }

  readonly filteredSubordinadas = computed(() => {
    const nome = this.appliedSubordinadaNome().toLowerCase();
    const utb = this.appliedSubordinadaUtb().toLowerCase();
    return this.subordinadas().filter(s => {
      const matchNome = !nome || s.nome.toLowerCase().includes(nome);
      const matchUtb = !utb || s.utb.toLowerCase().includes(utb);
      return matchNome && matchUtb;
    });
  });

  readonly paginatedSubordinadas = computed(() => {
    const list = this.filteredSubordinadas();
    const size = this.subordinadasPageSize();
    const start = this.subordinadasPageIndex() * size;
    return list.slice(start, start + size);
  });

  readonly utbsDisponiveis = computed(() => {
    // Exibe apenas UTBs que não estão em uso por outra Secretaria Geral ativa
    return this.service.utbs().filter(u => !this.service.isUtbEmUso(u.codigo, this.itemId || undefined));
  });

  readonly utbOptionsForm = computed(() =>
    this.utbsDisponiveis().map(u => ({
      label: `${u.codigo} - ${u.nome}`,
      value: u.codigo
    }))
  );

  readonly filteredUtbs = computed(() => {
    const query = (this.utbInputVal() || '').toLowerCase().trim();
    const list = this.utbsDisponiveis();
    if (!query) return list;
    return list.filter(u => 
      u.codigo.toLowerCase().includes(query) ||
      u.nome.toLowerCase().includes(query) ||
      u.descricaoCompleta.toLowerCase().includes(query)
    );
  });

  readonly isUtbBloqueada = computed(() => {
    if (!this.isEditMode() || !this.currentItem) return false;
    // Bloqueia alteração se houver chefe ou subordinadas
    return !!this.chefeImediato() || (this.currentItem.subordinadas && this.currentItem.subordinadas.length > 0);
  });

  private initialSnapshotJson = '';
  isSavedSuccessfully = false;
  isDiscarded = false;

  private getCurrentSnapshotJson(): string {
    const atoDoc = this.atoDocumento();
    const normCriaDoc = this.normCriacaoDoc();
    const normExtDoc = this.normExtincaoDoc();
    const chefe = this.chefeImediato();
    return JSON.stringify({
      nome: (this.form.get('nome')?.value || '').trim(),
      utbCodigo: (this.form.get('utbCodigo')?.value || '').trim(),
      chefeMatricula: chefe?.matricula || null,
      atoNumero: (this.atoNumeroControl.value || '').trim(),
      atoData: (this.atoDataControl.value || '').trim(),
      atoDoc: atoDoc ? `${atoDoc.nomeArquivo}_${atoDoc.tamanho}` : null,
      normCriacaoNome: (this.normCriacaoNomeControl.value || '').trim(),
      normCriacaoNumero: (this.normCriacaoNumeroControl.value || '').trim(),
      normCriacaoData: (this.normCriacaoDataControl.value || '').trim(),
      normCriacaoDoc: normCriaDoc ? `${normCriaDoc.nomeArquivo}_${normCriaDoc.tamanho}` : null,
      normExtincaoNome: (this.normExtincaoNomeControl.value || '').trim(),
      normExtincaoNumero: (this.normExtincaoNumeroControl.value || '').trim(),
      normExtincaoData: (this.normExtincaoDataControl.value || '').trim(),
      normExtincaoDoc: normExtDoc ? `${normExtDoc.nomeArquivo}_${normExtDoc.tamanho}` : null,
      normativaExtincaoAdicionada: this.normativaExtincaoAdicionada(),
      hasPersistedNormativaExtincao: this.hasPersistedNormativaExtincao()
    });
  }

  hasUnsavedChanges(): boolean {
    if (this.isSavedSuccessfully || this.isDiscarded) {
      return false;
    }
    return this.getCurrentSnapshotJson() !== this.initialSnapshotJson;
  }

  private confirmarCancelamento(): Promise<boolean> {
    return this.modalService.confirm({
      variant: 'default',
      title: 'Tem certeza que deseja cancelar?',
      description: 'As alterações não salvas serão perdidas.',
      cancelLabel: 'Não',
      confirmLabel: 'Sim, cancelar'
    });
  }

  canDeactivate(): Promise<boolean> | boolean {
    if (!this.hasUnsavedChanges()) {
      return true;
    }
    return this.confirmarCancelamento().then((confirmado: boolean) => {
      if (confirmado) {
        this.isDiscarded = true;
        return true;
      }
      return false;
    });
  }

  constructor() {
    const params = this.route.snapshot.params;
    const url = this.router.url;

    this.form.get('nome')?.valueChanges.subscribe(() => {
      if (this.form.get('nome')?.hasError('duplicado')) {
        this.form.get('nome')?.setErrors(null);
      }
    });

    effect(() => {
      if (this.isUtbBloqueada()) {
        this.utbInputControl.disable({ emitEvent: false });
        this.utbAutocompleteControl.disable({ emitEvent: false });
        this.form.get('utbCodigo')?.disable({ emitEvent: false });
      } else {
        this.utbInputControl.enable({ emitEvent: false });
        this.utbAutocompleteControl.enable({ emitEvent: false });
        this.form.get('utbCodigo')?.enable({ emitEvent: false });
      }
    });

    if (params['id'] && url.endsWith('/editar')) {
      this.isEditMode.set(true);
      this.itemId = params['id'];
      const item = this.service.getItem(this.itemId!);
      if (item) {
        this.currentItem = item;
        this.form.patchValue({
          nome: item.nome,
          utbCodigo: item.utbCodigo
        });

        if (item.utbCodigo) {
          const utbObj = this.service.utbs().find(u => u.codigo === item.utbCodigo);
          const utbLabel = utbObj ? `${utbObj.codigo} - ${utbObj.nome}` : item.utbCodigo;
          this.utbInputControl.setValue(utbLabel, { emitEvent: false });
          this.utbAutocompleteControl.setValue(item.utbCodigo, { emitEvent: false });
        }

        if (item.chefeImediato) {
          this.chefeImediato.set(item.chefeImediato);
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
          this.hasPersistedNormativaExtincao.set(true);
          this.normExtincaoNomeControl.setValue(item.normativaExtincao.nome);
          this.normExtincaoNumeroControl.setValue(item.normativaExtincao.numero);
          this.normExtincaoDataControl.setValue(item.normativaExtincao.dataPublicacao);
          this.normExtincaoDoc.set(item.normativaExtincao.documento);
        } else if (item.normativaExtincao) {
          this.normExtincaoNomeControl.setValue(item.normativaExtincao.nome);
          this.normExtincaoNumeroControl.setValue(item.normativaExtincao.numero);
          this.normExtincaoDataControl.setValue(item.normativaExtincao.dataPublicacao);
        }

        this.subordinadas.set(item.subordinadas || []);
        this.initialSnapshotJson = this.getCurrentSnapshotJson();
      }
    } else {
      this.initialSnapshotJson = this.getCurrentSnapshotJson();
    }
  }

  private isHandlingUtbSelection = false;

  onUtbInputForm(event: Event) {
    if (event.target instanceof HTMLInputElement) {
      this.utbInputControl.setValue(event.target.value);
    }
  }

  onUtbAutocompleteSelection(selection: SAutocompleteSelection<string>) {
    if (selection) {
      this.onUtbSelected(selection.value);
    }
  }

  confirmarTrocaUtb(novoCodigo: string, callbackConfirmado: () => void) {
    const currentCodigo = this.form.get('utbCodigo')?.value;
    const existing = this.service.utbs().find(u => u.codigo === currentCodigo);
    const existingLabel = existing ? `${existing.codigo} - ${existing.nome}` : '';

    void this.modalService.confirm({
      variant: 'default',
      title: 'Alterar Unidade de Trabalho?',
      description: 'Ao alterar a Unidade de Trabalho (UTB), os vínculos de chefia existentes poderão ser removidos. Deseja continuar?',
      cancelLabel: 'Não',
      confirmLabel: 'Sim, alterar'
    }).then((confirmado: boolean) => {
      this.isHandlingUtbSelection = false;
      if (confirmado) {
        callbackConfirmado();
      } else {
        this.utbInputControl.setValue(existingLabel, { emitEvent: false });
        this.utbAutocompleteControl.setValue(currentCodigo || null, { emitEvent: false });
      }
    });
  }

  onUtbSelected(codigo: string) {
    if (this.isUtbBloqueada()) return;
    const currentCodigo = this.form.get('utbCodigo')?.value;
    if (codigo === currentCodigo) {
      const existing = this.service.utbs().find(u => u.codigo === currentCodigo);
      if (existing) {
        this.utbInputControl.setValue(`${existing.codigo} - ${existing.nome}`, { emitEvent: false });
        this.utbAutocompleteControl.setValue(existing.codigo, { emitEvent: false });
      }
      return;
    }

    const utb = this.service.utbs().find(u => u.codigo === codigo);
    if (!utb) return;

    const requiresConfirmation = this.isEditMode()
      ? !!currentCodigo
      : !!this.chefeImediato();

    const aplicarNovaUtb = () => {
      this.form.get('utbCodigo')?.setValue(utb.codigo);
      this.form.get('utbCodigo')?.markAsDirty();
      this.utbInputControl.setValue(`${utb.codigo} - ${utb.nome}`, { emitEvent: false });
      this.utbAutocompleteControl.setValue(utb.codigo, { emitEvent: false });
      this.onUtbChange();
    };

    if (requiresConfirmation) {
      this.isHandlingUtbSelection = true;
      this.confirmarTrocaUtb(codigo, aplicarNovaUtb);
    } else {
      aplicarNovaUtb();
    }
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
      this.utbAutocompleteControl.setValue(null, { emitEvent: false });
      this.onUtbChange();
    };

    if (requiresConfirmation) {
      this.isHandlingUtbSelection = true;
      this.confirmarTrocaUtb('', aplicarLimpeza);
    } else {
      aplicarLimpeza();
    }
  }

  onUtbBlur() {
    this.form.get('utbCodigo')?.markAsTouched();
    this.utbInputControl.markAsTouched();
    if (this.isHandlingUtbSelection || this.dialog.openDialogs.length > 0) {
      return;
    }
    if (this.isUtbBloqueada()) return;

    const currentSelectedCodigo = this.form.get('utbCodigo')?.value;
    const text = this.utbInputControl.value.trim();
    if (!text) {
      if (currentSelectedCodigo) {
        this.limparUtb();
      }
      return;
    }
    const match = this.utbsDisponiveis().find(u => 
      u.codigo.toLowerCase() === text.toLowerCase() ||
      `${u.codigo} - ${u.nome}`.toLowerCase() === text.toLowerCase()
    );
    if (match) {
      if (match.codigo !== currentSelectedCodigo) {
        this.onUtbSelected(match.codigo);
      } else {
        this.utbInputControl.setValue(`${match.codigo} - ${match.nome}`, { emitEvent: false });
        this.utbAutocompleteControl.setValue(match.codigo, { emitEvent: false });
      }
    } else {
      const existing = this.service.utbs().find(u => u.codigo === currentSelectedCodigo);
      if (existing) {
        this.utbInputControl.setValue(`${existing.codigo} - ${existing.nome}`, { emitEvent: false });
        this.utbAutocompleteControl.setValue(existing.codigo, { emitEvent: false });
      } else {
        this.limparUtb();
      }
    }
  }

  onSubordinadasPageChange(newIndex: number) {
    this.subordinadasPageIndex.set(Math.max(0, newIndex));
  }

  onSubordinadasPageSizeChange(newSize: number) {
    this.subordinadasPageSize.set(newSize);
    this.subordinadasPageIndex.set(0);
  }

  onUtbChange() {
    // Se mudou de UTB e já havia chefe que pertencia à outra UTB, avisa
    if (this.chefeImediato()) {
      this.chefeImediato.set(undefined);
      this.atoNumeroControl.reset('');
      this.atoDataControl.reset('');
      this.atoDocumento.set(undefined);
      this.toastService.info('Como a Unidade de Trabalho (UTB) foi alterada, a chefia imediata foi desvinculada.');
    }
  }

  abrirBuscaChefe() {
    const utbCodigo = this.form.get('utbCodigo')?.value;
    if (!utbCodigo) {
      this.toastService.warning('Selecione primeiro uma Unidade de Trabalho (UTB).');
      return;
    }

    const utb = this.service.utbs().find(u => u.codigo === utbCodigo);
    const dialogRef = this.modalService.open<BuscaServidorModal, {utbCodigo: string; utbDescricao: string; visualSecretariaGeral?: boolean}, ServidorUtbItem>(BuscaServidorModal, {
      width: '800px',
      maxWidth: 'calc(100vw - 2.5rem)',
      autoFocus: false,
      data: {
        utbCodigo,
        utbDescricao: utb?.descricaoCompleta || utbCodigo,
        visualSecretariaGeral: true
      }
    });

    dialogRef.afterClosed().subscribe((servidor: ServidorUtbItem | undefined) => {
      if (servidor) {
        const isSubstituicao = !!this.chefeImediato() && this.chefeImediato()?.matricula !== servidor.matricula;
        if (isSubstituicao) {
          this.atoNumeroControl.reset('');
          this.atoDataControl.reset('');
          this.atoDocumento.set(undefined);
          this.atoArquivoControl.reset();
        }

        const chefe: ChefeImediatoItem = {
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
        };

        this.chefeImediato.set(chefe);
        this.toastService.success(
          isSubstituicao 
            ? `Chefia substituída por ${servidor.nome}. Informe os dados e anexe o novo Ato Governamental.`
            : `Servidor ${servidor.nome} selecionado. Preencha os dados e anexe o Ato Governamental de Nomeação.`
        );
      }
    });
  }

  removerChefe() {
    void this.modalService.confirm({
      variant: 'destructive',
      title: 'Remover Chefe Imediato?',
      description: 'Tem certeza que deseja desvincular o Chefe Imediato e seu respectivo Ato Governamental?',
      cancelLabel: 'Cancelar',
      confirmLabel: 'Sim, remover'
    }).then((confirma: boolean) => {
      if (confirma) {
        this.chefeImediato.set(undefined);
        this.atoNumeroControl.reset();
        this.atoDataControl.reset();
        this.atoDocumento.set(undefined);
        this.toastService.info('Chefe Imediato removido.');
      }
    });
  }

  onArquivoSolto(event: DragEvent, jaAnexado = false) {
    event.preventDefault();
    if (jaAnexado) return;
    const input = (event.currentTarget as HTMLElement).querySelector<HTMLInputElement>('s-file-upload input[type="file"]');
    if (!input || input.disabled || !event.dataTransfer?.files.length) return;
    input.files = event.dataTransfer.files;
    input.dispatchEvent(new Event('change', {bubbles: true}));
  }

  onFileAtoSelected(file: File | null) {
    if (!file) return;
    if (!this.canAnexarAto()) {
      this.toastService.warning('Preencha os campos obrigatórios do Ato Governamental com valores válidos antes de anexar o documento.');
      return;
    }
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        this.toastService.warning('O arquivo excede o limite máximo permitido de 10 MB.');
        return;
      }
      const ext = file.name.split('.').pop()?.toLowerCase() as 'pdf' | 'jpg' | 'jpeg' | 'png';
      const doc: DocumentoAnexo = {
        id: 'doc-ato-' + Date.now(),
        nomeArquivo: file.name,
        tamanho: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        tipo: ext || 'pdf',
        dataUpload: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})
      };
      this.atoDocumento.set(doc);
      this.atoDocInvalido.set(false);
      this.toastService.success(`Documento "${file.name}" anexado com sucesso.`);
    }
  }

  removerDocAto() {
    this.atoDocumento.set(undefined);
    this.atoArquivoControl.reset();
  }

  onFileUploadError(error: SFileError) {
    this.toastService.warning(error.kind === 'size'
      ? 'O arquivo excede o limite máximo permitido de 10 MB.'
      : 'Formato inválido. Selecione um arquivo PDF, JPG, JPEG ou PNG.');
  }

  onFileNormCriacaoSelected(file: File | null) {
    if (!file) return;
    if (!this.canAnexarNormCriacao()) {
      this.toastService.warning('Preencha os campos obrigatórios da Normativa de Criação com valores válidos antes de anexar o documento.');
      return;
    }
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        this.toastService.warning('O arquivo excede o limite máximo permitido de 10 MB.');
        return;
      }
      const ext = file.name.split('.').pop()?.toLowerCase() as 'pdf' | 'jpg' | 'jpeg' | 'png';
      const doc: DocumentoAnexo = {
        id: 'doc-criacao-' + Date.now(),
        nomeArquivo: file.name,
        tamanho: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        tipo: ext || 'pdf',
        dataUpload: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})
      };
      this.normCriacaoDoc.set(doc);
      this.normCriacaoDocInvalido.set(false);
      this.toastService.success(`Normativa de Criação "${file.name}" anexada com sucesso.`);
    }
  }

  removerDocCriacao() {
    this.normCriacaoDoc.set(undefined);
    this.normCriacaoArquivoControl.reset();
  }

  onFileNormExtincaoSelected(file: File | null) {
    if (!file) return;
    if (!this.canAnexarNormExtincao()) {
      this.toastService.warning('Preencha os campos obrigatórios da Normativa de Extinção com valores válidos antes de anexar o documento.');
      return;
    }
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        this.toastService.warning('O arquivo excede o limite máximo permitido de 10 MB.');
        return;
      }
      const ext = file.name.split('.').pop()?.toLowerCase() as 'pdf' | 'jpg' | 'jpeg' | 'png';
      const doc: DocumentoAnexo = {
        id: 'doc-extincao-' + Date.now(),
        nomeArquivo: file.name,
        tamanho: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        tipo: ext || 'pdf',
        dataUpload: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})
      };
      this.normExtincaoDoc.set(doc);
      this.normExtincaoDocInvalido.set(false);
      this.toastService.success(`Normativa de Extinção "${file.name}" anexada com sucesso.`);
    }
  }

  removerDocExtincao() {
    this.normExtincaoDoc.set(undefined);
    this.normExtincaoArquivoControl.reset();
  }

  iniciarAdicaoNormativaExtincao() {
    this.expandindoNormativaExtincao.set(true);
  }

  cancelarAdicaoNormativaExtincao() {
    this.normExtincaoNomeControl.reset('');
    this.normExtincaoNumeroControl.reset('');
    this.normExtincaoDataControl.reset('');
    this.normExtincaoDataPicker.dateControl.reset(null);
    this.normExtincaoDoc.set(undefined);
    this.normExtincaoArquivoControl.reset();
    this.normExtincaoDocInvalido.set(false);
    this.expandindoNormativaExtincao.set(false);
  }

  focusPrimeiroCampoInvalido(idPrimeiroInvalido?: string) {
    setTimeout(() => {
      let el: HTMLElement | null = null;
      if (idPrimeiroInvalido) {
        const target = document.getElementById(idPrimeiroInvalido);
        if (target) {
          el = target.querySelector('input:not([type="file"]), [tabindex="0"]') || target;
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

  confirmarAdicaoNormativaExtincao() {
    const nome = this.normExtincaoNomeControl.value.trim();
    const num = this.normExtincaoNumeroControl.value.trim();
    const data = this.normExtincaoDataControl.value.trim();
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
      this.normExtincaoDataPicker.dateControl.markAsTouched();
      hasError = true;
      if (!firstInvalidId) firstInvalidId = 'form-norm-ext-data';
    } else if (!validarDataFormato(data) || dataFutura(data)) {
      this.normExtincaoDataControl.setErrors(dataFutura(data) ? { dataRange: 'A data não pode ser futura.' } : { dataFormato: 'Informe uma data válida no formato DD/MM/AAAA.' });
      this.normExtincaoDataControl.markAsTouched();
      this.normExtincaoDataPicker.dateControl.markAsTouched();
      hasError = true;
      if (!firstInvalidId) firstInvalidId = 'form-norm-ext-data';
    }

    if (!doc) {
      this.normExtincaoDocInvalido.set(this.canAnexarNormExtincao());
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

    // Normaliza formato da data para exibição / persistência
    this.normExtincaoDataControl.setValue(normalizarDataParaBr(data), { emitEvent: false });
    this.normativaExtincaoAdicionada.set(true);
    this.expandindoNormativaExtincao.set(false);
    this.toastService.success('Normativa de Extinção adicionada com sucesso.');
  }

  visualizarDoc(doc: DocumentoAnexo, tipo?: string) {
    this.modalService.open(VisualizarDocumentoModal, {
      disableClose: true,
      width: '780px',
      maxWidth: 'calc(100vw - 2.5rem)',
      data: {
        documento: doc,
        titulo: 'Visualizar anexo',
        tipoDocumento: tipo
      }
    });
  }

  baixarDoc(_doc: DocumentoAnexo) {}

  onCliqueDownloadLocal(event: MouseEvent, arquivo: File | null, doc: DocumentoAnexo | undefined) {
    if (arquivo && doc && (event.target as Element).closest('button[aria-label="Baixar arquivo"]')) {
      this.baixarDoc(doc);
    }
  }

  abrirHistoricoAtos() {
    const chefe = this.chefeImediato();
    let atoAtual: AtoGovernamental | undefined = undefined;
    if (this.atoNumeroControl.value || this.atoDocumento()) {
      atoAtual = {
        numero: this.atoNumeroControl.value || '',
        dataPublicacao: this.atoDataControl.value || '',
        documento: this.atoDocumento()
      };
    } else if (chefe?.atoGovernamental) {
      atoAtual = chefe.atoGovernamental;
    }

    const atos = this.service.getHistoricoAtos(this.itemId || undefined, atoAtual, chefe?.nome);
    this.modalService.open(HistoricoAtosModal, {
      width: '900px',
      maxWidth: 'calc(100vw - 2.5rem)',
      autoFocus: false,
      data: { atos }
    });
  }

  onCancelar() {
    if (!this.hasUnsavedChanges()) {
      this.router.navigate(['/configuracoes/hierarquia/secretaria-geral']);
      return;
    }
    void this.confirmarCancelamento().then((confirmado: boolean) => {
      if (confirmado) {
        this.isDiscarded = true;
        this.router.navigate(['/configuracoes/hierarquia/secretaria-geral']);
      }
    });
  }

  onSalvar() {
    let hasError = false;
    let firstInvalidId = '';

    // Se estiver expandido o formulário da Normativa de Extinção
    if (this.expandindoNormativaExtincao()) {
      const extNome = this.normExtincaoNomeControl.value.trim();
      const extNum = this.normExtincaoNumeroControl.value.trim();
      const extData = this.normExtincaoDataControl.value.trim();
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
        this.normExtincaoDataPicker.dateControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-norm-ext-data';
      } else if (!validarDataFormato(extData) || dataFutura(extData)) {
        this.normExtincaoDataControl.setErrors(dataFutura(extData) ? { dataRange: 'A data não pode ser futura.' } : { dataFormato: 'Informe uma data válida no formato DD/MM/AAAA.' });
        this.normExtincaoDataControl.markAsTouched();
        this.normExtincaoDataPicker.dateControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-norm-ext-data';
      }
      if (!extDoc) {
        this.normExtincaoDocInvalido.set(this.canAnexarNormExtincao());
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'container-anexo-extincao';
      } else {
        this.normExtincaoDocInvalido.set(false);
      }
    }

    // 1. Identificação: Nome e UTB
    const nome = this.form.get('nome')?.value.trim() || '';
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

    if (!utbCodigo) {
      this.form.get('utbCodigo')?.setErrors({ required: true });
      this.form.get('utbCodigo')?.markAsTouched();
      this.utbInputControl.setErrors({ required: true });
      this.utbInputControl.markAsTouched();
      hasError = true;
      if (!firstInvalidId) firstInvalidId = 'form-utb';
    }

    // 2. Chefia Imediata: se houver chefe vinculado, Ato Governamental é obrigatório
    if (this.chefeImediato()) {
      const atoNum = this.atoNumeroControl.value.trim();
      const atoData = this.atoDataControl.value.trim();
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
        this.atoDataPicker.dateControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-ato-data';
      } else if (!validarDataFormato(atoData) || dataFutura(atoData)) {
        this.atoDataControl.setErrors(dataFutura(atoData) ? { dataRange: 'A data não pode ser futura.' } : { dataFormato: 'Informe uma data válida no formato DD/MM/AAAA.' });
        this.atoDataControl.markAsTouched();
        this.atoDataPicker.dateControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-ato-data';
      }

      if (!atoDoc) {
        this.atoDocInvalido.set(this.canAnexarAto());
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
      const normCriaNome = this.normCriacaoNomeControl.value.trim();
      const normCriaNum = this.normCriacaoNumeroControl.value.trim();
      const normCriaData = this.normCriacaoDataControl.value.trim();
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
        this.normCriacaoDataPicker.dateControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-norm-criacao-data';
      } else if (!validarDataFormato(normCriaData) || dataFutura(normCriaData)) {
        this.normCriacaoDataControl.setErrors(dataFutura(normCriaData) ? { dataRange: 'A data não pode ser futura.' } : { dataFormato: 'Informe uma data válida no formato DD/MM/AAAA.' });
        this.normCriacaoDataControl.markAsTouched();
        this.normCriacaoDataPicker.dateControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-norm-criacao-data';
      }

      if (!normCriaDoc) {
        this.normCriacaoDocInvalido.set(this.canAnexarNormCriacao());
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'container-anexo-criacao';
      } else {
        this.normCriacaoDocInvalido.set(false);
      }
    }

    // Se houver erros de validação
    if (hasError) {
      this.focusPrimeiroCampoInvalido(firstInvalidId);
      this.toastService.warning('Verifique os campos obrigatórios destacados no formulário.');
      return;
    }

    // Se a normativa de extinção estava expandida e válida, conclui a adição
    if (this.expandindoNormativaExtincao()) {
      this.normativaExtincaoAdicionada.set(true);
      this.expandindoNormativaExtincao.set(false);
    }

    // Montar Chefe Imediato
    let chefeFinal: ChefeImediatoItem | undefined = undefined;
    if (this.chefeImediato()) {
      chefeFinal = {
        ...this.chefeImediato()!,
        atoGovernamental: {
          numero: this.atoNumeroControl.value.trim(),
          dataPublicacao: normalizarDataParaBr(this.atoDataControl.value.trim()),
          documento: this.atoDocumento()
        }
      };
    }

    // Montar Normativa de Criação (após o cadastro, a normativa de criação não pode ser alterada)
    const normativaCriacaoFinal: NormativaItem = (this.isEditMode() && this.currentItem?.normativaCriacao)
      ? this.currentItem.normativaCriacao
      : {
          nome: this.normCriacaoNomeControl.value.trim(),
          numero: this.normCriacaoNumeroControl.value.trim(),
          dataPublicacao: normalizarDataParaBr(this.normCriacaoDataControl.value.trim()),
          documento: this.normCriacaoDoc()
        };

    // Montar Normativa de Extinção
    let normativaExtincaoFinal: NormativaItem | undefined = undefined;
    if (this.hasPersistedNormativaExtincao() && this.currentItem?.normativaExtincao) {
      normativaExtincaoFinal = this.currentItem.normativaExtincao;
    } else if (this.temNormativaExtincao() && this.normExtincaoDoc()) {
      normativaExtincaoFinal = {
        nome: this.normExtincaoNomeControl.value.trim() || 'Normativa de Extinção',
        numero: this.normExtincaoNumeroControl.value.trim() || '-',
        dataPublicacao: normalizarDataParaBr(this.normExtincaoDataControl.value.trim() || new Date().toLocaleDateString('pt-BR')),
        documento: this.normExtincaoDoc()
      };
    } else if (!this.isEditMode() && (this.normExtincaoNomeControl.value.trim() || this.normExtincaoDoc())) {
      normativaExtincaoFinal = {
        nome: this.normExtincaoNomeControl.value.trim() || 'Normativa de Extinção',
        numero: this.normExtincaoNumeroControl.value.trim() || '-',
        dataPublicacao: normalizarDataParaBr(this.normExtincaoDataControl.value.trim() || new Date().toLocaleDateString('pt-BR')),
        documento: this.normExtincaoDoc()
      };
    }

    const utb = this.service.utbs().find(u => u.codigo === utbCodigo);
    const utbNome = utb?.descricaoCompleta || utbCodigo;

    this.isSaving.set(true);

    setTimeout(() => {
      if (this.isEditMode() && this.itemId) {
        this.service.update(this.itemId, {
          nome,
          utbCodigo,
          utbNome,
          chefeImediato: chefeFinal,
          normativaCriacao: normativaCriacaoFinal,
          normativaExtincao: normativaExtincaoFinal
        });
        this.toastService.success('Registro atualizado com sucesso.');
      } else {
        this.service.add({
          nome,
          utbCodigo,
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
      this.router.navigate(['/configuracoes/hierarquia/secretaria-geral']);
    }, 400);
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
    this.router.navigate(['/configuracoes/hierarquia/secretaria-geral']);
  }
}

export const secretariaGeralFormDeactivateGuard: CanDeactivateFn<SecretariaGeralForm> = (component) => {
  return component.canDeactivate();
};

// ==========================================
// 3. TELA DE VISUALIZAR (EXCLUSIVAMENTE LEITURA)
// ==========================================

@Component({
  selector: 'app-secretaria-geral-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{provide: S_LOADING_DELAY, useValue: 0}],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
    SAutocompleteComponent,
    SButtonComponent,
    SFieldComponent,
    SFileUploadComponent,
    SIconButtonComponent,
    SIconComponent,
    SInputComponent,
    SPageHeaderComponent,
    STableCellDirective,
    STableComponent,
    STooltipDirective,
    AcessoRestritoComponent
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
    @if (!hasAccess()) {
      <app-acesso-restrito backUrl="/configuracoes/hierarquia/secretaria-geral" />
    } @else {
      <div class="flex flex-col gap-6 font-sans">
        
        <s-page-header
          [breadcrumbs]="breadcrumbs"
          title="Visualizar Secretaria Geral"
          description="Consulte as informações, dados de chefia, normativas e unidades subordinadas da Secretaria Geral."
          showBack
          (back)="goBack()"
        >
          <!-- Ação Editar -->
          @if (permissionService.canCreate()) {
            <s-button action variant="primary" icon="edit" (click)="onEditar()">Editar</s-button>
          }
        </s-page-header>

        @if (item(); as sec) {
          <div class="flex flex-col gap-6">

            <!-- Card 1: Identificação da Secretaria Geral -->
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <s-icon name="domain" size="xs" />
                <span>1. Identificação da Secretaria Geral</span>
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                <!-- Primeira linha: Nome da Secretaria Geral (50%) | Unidade de Trabalho (UTB) (50%) -->
                <div class="flex flex-col gap-1 col-span-12 md:col-span-6">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Nome da Secretaria Geral</span>
                  <span class="text-sm font-medium text-siage-text-primary break-words">{{ sec.nome }}</span>
                </div>

                <div class="flex flex-col gap-1 col-span-12 md:col-span-6">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Unidade de Trabalho (UTB)</span>
                  <span class="text-sm font-medium text-siage-text-primary break-words leading-relaxed">{{ sec.utbNome }}</span>
                </div>

                <!-- Segunda linha: Situação | Criador / Editor | Data de Criação (três colunas alinhadas) -->
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
                <s-icon name="badge" size="xs" />
                <span>2. Chefia Imediata e Ato Governamental</span>
              </h3>

              @if (sec.chefeImediato; as chefe) {
                <!-- Card do Chefe Imediato Vinculado -->
                <div class="border border-siage-border rounded-lg p-4 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col gap-4">
                  <!-- Identificação do Servidor com Avatar (sem badge) -->
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
                        <s-icon name="description" size="xs" variant="primary" />
                        <span class="text-xs font-poppins font-bold uppercase tracking-wider text-siage-primary">
                          Ato Governamental de Nomeação
                        </span>
                      </div>

                      <s-button
                        variant="secondary"
                        outlined
                        icon="history"
                        (click)="abrirHistoricoAtos()"
                        sTooltip="Consultar histórico de atos governamentais"
                      >
                        Consultar histórico
                      </s-button>
                    </div>

                    <!-- Data da Publicação alinhada horizontalmente com CPF na mesma referência de colunas -->
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

                    <!-- Anexo do Documento (com ações de consulta: visualizar e baixar) -->
                    @if (chefe.atoGovernamental.documento; as doc) {
                      <div class="flex items-center gap-2 flex-wrap sg-anexo-com-arquivo">
                        <s-icon-button icon="visibility" label="Visualizar anexo" size="sm" variant="info" text sTooltip="Visualizar anexo" (click)="visualizarDoc(doc, 'Ato Governamental')" />
                        <s-file-upload [fileName]="doc.nomeArquivo" [fileId]="doc.id" [allowDownload]="true" [allowRemove]="false" (download)="baixarDoc(doc)" />
                      </div>
                    }
                  </div>
                </div>
              } @else {
                <div class="py-6 text-center text-xs text-siage-text-secondary border border-dashed border-siage-border rounded-lg flex flex-col items-center justify-center gap-3">
                  <span>Nenhum Chefe Imediato vinculado no momento.</span>
                  <s-button
                    variant="secondary"
                    outlined
                    icon="history"
                    (click)="abrirHistoricoAtos()"
                    sTooltip="Consultar histórico de atos governamentais"
                  >
                    Consultar histórico
                  </s-button>
                </div>
              }
            </div>

            <!-- Card 3: Secretarias Executivas Vinculadas -->
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <s-icon name="account_tree" size="xs" />
                <span>3. Secretarias Executivas Vinculadas</span>
              </h3>

              <!-- Filtros de Secretarias Executivas Vinculadas -->
              <div class="flex flex-col gap-4 pt-1">
                <span class="text-xs font-semibold text-siage-text-secondary">Buscar por:</span>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <!-- Filtro: Nome -->
                  <div class="form-field-group">
                    <s-field label="Nome" controlId="view-filtro-sub-nome">
                      <s-input
                        [formControl]="filtroNome"
                        [maxlength]="200"
                        placeholder="Digite o Nome"
                        (keydown.enter)="$event.preventDefault(); canBuscar() && onBuscar()"
                      />
                    </s-field>
                  </div>

                  <!-- Filtro: Unidade de Trabalho (UTB) (Select com autocomplete) -->
                  <div class="form-field-group">
                    <s-field label="Unidade de Trabalho (UTB)" controlId="view-filtro-sub-utb">
                      <s-autocomplete
                        [formControl]="filtroUtb"
                        [options]="utbSubAutocompleteOptions()"
                        placeholder="Selecione ou busque uma unidade de trabalho"
                        (input)="onUtbInput($event)"
                        (selectionChange)="onUtbSelectionChange($event)"
                        (keydown.enter)="$event.preventDefault(); canBuscar() && onBuscar()"
                      />
                    </s-field>
                  </div>
                </div>

                <!-- Botões Buscar e Limpar -->
                <div class="flex items-center justify-end gap-3 pt-3 border-t border-siage-border/40">
                  <s-button variant="secondary" outlined (click)="onLimpar()">Limpar</s-button>
                  <s-button variant="primary" icon="search"
                    (click)="canBuscar() && onBuscar()"
                    [disabled]="!canBuscar()"
                    [sTooltip]="!canBuscar() ? 'Informe o Nome ou a Unidade de Trabalho (UTB) para realizar a busca' : 'Executar busca'"
                  >
                    Buscar
                  </s-button>
                </div>
              </div>

              <s-table
                label="Secretarias Executivas Vinculadas"
                [columns]="subordinadasColumns"
                [rows]="paginatedSubordinadas()"
                [empty]="subordinadasEmpty"
                [page]="pageIndex() + 1"
                [pageSize]="pageSize()"
                [total]="filteredSubordinadas().length"
                (pageChange)="onPageChange($event - 1)"
                (pageSizeChange)="onPageSizeChange($event)"
              >
                <ng-template sTableCell="nome" let-sub>
                  <div class="flex flex-col">
                    <span class="text-[10px] uppercase font-bold text-siage-primary block">{{ sub['tipo'] }}</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ sub['nome'] }}</span>
                  </div>
                </ng-template>
              </s-table>
            </div>

            <!-- Card 4: Gestão de Normativas -->
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-6">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <s-icon name="gavel" size="xs" />
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
                  <!-- Primeira linha: Nome da Normativa (50%) | Número da Normativa (25%) | Data da Publicação (25%) -->
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

                  <!-- Segunda linha: documento anexado ocupando toda a largura -->
                  @if (sec.normativaCriacao.documento; as doc) {
                    <div class="col-span-12 flex items-center gap-2 flex-wrap sg-anexo-com-arquivo">
                      <s-icon-button icon="visibility" label="Visualizar anexo" size="sm" variant="info" text sTooltip="Visualizar anexo" (click)="visualizarDoc(doc, 'Normativa de Criação')" />
                      <s-file-upload [fileName]="doc.nomeArquivo" [fileId]="doc.id" [allowDownload]="true" [allowRemove]="false" (download)="baixarDoc(doc)" />
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
                    <!-- Primeira linha: Nome da Normativa (50%) | Número da Normativa (25%) | Data da Publicação (25%) -->
                    <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
                      <span class="text-xs uppercase text-siage-text-secondary font-semibold">Nome da Normativa</span>
                      <span class="text-sm font-medium text-siage-text-primary break-words">{{ sec.normativaExtincao?.nome }}</span>
                    </div>

                    <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                      <span class="text-xs uppercase text-siage-text-secondary font-semibold">Número da Normativa</span>
                      <span class="text-sm font-medium text-siage-text-primary">{{ sec.normativaExtincao?.numero }}</span>
                    </div>

                    <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                      <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data da Publicação</span>
                      <span class="text-sm font-medium text-siage-text-primary">{{ formatarDataParaExibicao(sec.normativaExtincao?.dataPublicacao) }}</span>
                    </div>

                    <!-- Segunda linha: documento anexado ocupando toda a largura -->
                    <div class="col-span-12 flex items-center gap-2 flex-wrap sg-anexo-com-arquivo">
                      <s-icon-button icon="visibility" label="Visualizar anexo" size="sm" variant="info" text sTooltip="Visualizar anexo" (click)="visualizarDoc(docExt, 'Normativa de Extinção')" />
                      <s-file-upload [fileName]="docExt.nomeArquivo" [fileId]="docExt.id" [allowDownload]="true" [allowRemove]="false" (download)="baixarDoc(docExt)" />
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Auditoria (Padrão Visualizar Professor) -->
            <div class="p-4 border-t border-siage-border/40 text-xs text-siage-text-secondary">
              {{ textoAuditoria() }}
            </div>
          </div>
        }
      </div>
    }
  `
})
export class SecretariaGeralView {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly modalService = inject(SModalService);
  private readonly toastService = inject(SToastService);
  readonly service = inject(SecretariaGeralService);
  readonly permissionService = inject(PermissionService);

  readonly hasAccess = computed(() => this.permissionService.hasAccess());
  readonly breadcrumbs = [
    {label: 'Início', routerLink: '/inicio'},
    {label: 'Configurações', routerLink: '/configuracoes'},
    {label: 'Hierarquia de Unidades e Cargos', routerLink: '/configuracoes/hierarquia'},
    {label: 'Configurar Secretaria Geral', routerLink: '/configuracoes/hierarquia/secretaria-geral'},
    {label: 'Visualizar'}
  ];
  readonly item = signal<SecretariaGeralItem | undefined>(undefined);
  readonly formatarDataParaExibicao = formatarDataParaExibicao;

  readonly textoAuditoria = computed(() => {
    const sec = this.item();
    if (!sec) return '';
    if (sec.dataAtualizacao) {
      return `Última atualização em ${sec.dataAtualizacao} pelo usuário ${sec.criadorEditor}.`;
    }
    return `Cadastrado em ${sec.dataCriacao} pelo usuário ${sec.criadorEditor}.`;
  });

  readonly filtroNome = new FormControl('', [Validators.maxLength(200)]);
  readonly filtroUtb = new FormControl<string | null>(null);
  readonly filtroUtbTexto = signal('');
  readonly filtroNomeVal = toSignal(this.filtroNome.valueChanges, { initialValue: '' });
  readonly filtroUtbVal = toSignal(this.filtroUtb.valueChanges, { initialValue: null });
  readonly appliedNome = signal('');
  readonly appliedUtb = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly subordinadasColumns: readonly STableColumn<UnidadeSubordinadaItem>[] = [
    {key: 'nome', label: 'Tipo / Unidade Vinculada'},
    {key: 'chefiaImediata', label: 'Chefia Imediata'},
    {key: 'utb', label: 'Unidade de Trabalho (UTB)'}
  ];

  readonly subordinadasEmpty: STableEmpty = {
    variant: 'no-results',
    title: 'Nenhum vínculo foi encontrado.',
    description: '',
    actionLabel: ''
  };

  // UTBs únicas vinculadas às Secretarias Executivas subordinadas
  readonly utbSubordinadasOptions = computed(() => {
    const list = this.item()?.subordinadas || [];
    const unique = new Map<string, { codigo: string; nome: string; display: string }>();
    for (const s of list) {
      if (s.utb) {
        const parts = s.utb.split(' - ');
        const codigo = parts[0]?.trim() || s.utb.trim();
        const nome = parts.slice(1).join(' - ').trim();
        if (!unique.has(codigo)) {
          unique.set(codigo, {
            codigo,
            nome: nome || codigo,
            display: nome ? `${codigo} - ${nome}` : codigo
          });
        }
      }
    }
    return Array.from(unique.values()).sort((a, b) =>
      a.codigo.localeCompare(b.codigo, undefined, { numeric: true })
    );
  });

  readonly utbSubAutocompleteOptions = computed(() =>
    this.utbSubordinadasOptions().map(u => ({
      label: u.display,
      value: u.display
    }))
  );

  readonly filteredUtbOptions = computed(() => {
    const query = (this.filtroUtbVal() || this.filtroUtb.value || this.filtroUtbTexto() || '').trim().toLowerCase();
    const list = this.utbSubordinadasOptions();
    if (!query) return list;
    return list.filter(u => 
      u.codigo.toLowerCase().includes(query) ||
      u.nome.toLowerCase().includes(query) ||
      u.display.toLowerCase().includes(query)
    );
  });

  readonly canBuscar = computed(() => {
    const nome = (this.filtroNomeVal() ?? this.filtroNome.value ?? '').trim();
    const utb = (this.filtroUtbVal() ?? this.filtroUtb.value ?? this.filtroUtbTexto() ?? '').trim();
    return nome.length > 0 || utb.length > 0;
  });

  onUtbInput(event: Event) {
    if (event.target instanceof HTMLInputElement) {
      this.filtroUtbTexto.set(event.target.value);
    }
  }

  onUtbSelectionChange(selection: SAutocompleteSelection<string>) {
    this.filtroUtbTexto.set(selection?.label ?? '');
  }

  onBuscar() {
    if (!this.canBuscar()) return;
    this.appliedNome.set((this.filtroNome.value || '').trim());
    this.appliedUtb.set((this.filtroUtb.value || this.filtroUtbTexto() || '').trim());
    this.pageIndex.set(0);
  }

  onLimpar() {
    this.filtroUtbTexto.set('');
    this.filtroNome.setValue('');
    this.filtroUtb.setValue(null);
    this.appliedNome.set('');
    this.appliedUtb.set('');
    this.pageIndex.set(0);
  }

  limparFiltroNome() {
    this.filtroNome.setValue('');
  }

  limparFiltroUtb() {
    this.filtroUtbTexto.set('');
    this.filtroUtb.setValue(null);
  }

  readonly filteredSubordinadas = computed(() => {
    const list = this.item()?.subordinadas || [];
    const nome = this.appliedNome().toLowerCase();
    const utb = this.appliedUtb().toLowerCase();
    return list.filter(s => {
      const matchNome = !nome || s.nome.toLowerCase().includes(nome);
      const matchUtb = !utb || s.utb.toLowerCase().includes(utb);
      return matchNome && matchUtb;
    });
  });

  readonly paginatedSubordinadas = computed(() => {
    const list = this.filteredSubordinadas();
    const size = this.pageSize();
    const start = this.pageIndex() * size;
    return list.slice(start, start + size);
  });

  constructor() {
    const id = this.route.snapshot.params['id'];
    if (id) {
      const found = this.service.getItem(id);
      if (found) {
        this.item.set(found);
      } else {
        this.toastService.warning('Secretaria Geral não encontrada.');
        this.goBack();
      }
    }
  }

  onPageChange(newIndex: number) {
    this.pageIndex.set(Math.max(0, newIndex));
  }

  onPageSizeChange(newSize: number) {
    this.pageSize.set(newSize);
    this.pageIndex.set(0);
  }

  visualizarDoc(doc: DocumentoAnexo, tipo?: string) {
    this.modalService.open(VisualizarDocumentoModal, {
      disableClose: true,
      width: '780px',
      maxWidth: 'calc(100vw - 2.5rem)',
      data: {
        documento: doc,
        titulo: 'Visualizar anexo',
        tipoDocumento: tipo
      }
    });
  }

  baixarDoc(_doc: DocumentoAnexo) {}

  abrirHistoricoAtos() {
    const sec = this.item();
    const atos = this.service.getHistoricoAtos(sec?.id, sec?.chefeImediato?.atoGovernamental, sec?.chefeImediato?.nome);
    this.modalService.open(HistoricoAtosModal, {
      width: '900px',
      maxWidth: 'calc(100vw - 2.5rem)',
      autoFocus: false,
      data: { atos }
    });
  }

  onEditar() {
    const it = this.item();
    if (it) {
      this.router.navigate([`/configuracoes/hierarquia/secretaria-geral/${it.id}/editar`]);
    }
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
    this.router.navigate(['/configuracoes/hierarquia/secretaria-geral']);
  }
}
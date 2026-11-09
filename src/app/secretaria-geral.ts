import {
  Component,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  Injectable
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
import {MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSelectModule} from '@angular/material/select';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {NgxExtendedPdfViewerModule} from 'ngx-extended-pdf-viewer';

import {SiageDatePickerComponent} from './siage-date-picker';
import {SiagePaginatorComponent} from './siage-paginator';
import {ConfirmacaoDialog, ModalService} from './dialog';
import {ToastService} from './toast';
import {PermissionService} from './permission';
import {AcessoRestritoComponent} from './acesso-restrito';
import {FormCancelHandler} from './form-cancel-handler';
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
          numero: 'Ato Governamental nº 1.420/2024',
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
// MODAL DE VISUALIZAÇÃO DE DOCUMENTO ANEXO (PADRÃO PROFESSORES / SIAGE-RH V2)
// ==========================================

@Component({
  selector: 'app-visualizar-documento-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatButtonModule, 
    MatTooltipModule,
    MatDialogModule,
    NgxExtendedPdfViewerModule
  ],
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }
  `],
  template: `
    <div class="w-full h-full bg-siage-surface text-siage-text-primary rounded-xl border border-siage-border shadow-[var(--mat-sys-level3)] font-sans flex flex-col text-left box-border overflow-hidden">
      
      <!-- CABEÇALHO DO MODAL (PADRÃO SIAGE-RH V2) -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-siage-border/40 shrink-0 bg-siage-surface">
        <div class="flex flex-col min-w-0 pr-4">
          <h2 class="text-base sm:text-lg font-poppins font-bold text-siage-text-primary leading-tight">
            Visualizar anexo
          </h2>
          <div class="flex items-center gap-2 text-xs text-siage-text-secondary mt-1 truncate">
            <span class="truncate font-medium text-siage-text-secondary" [title]="data.documento.nomeArquivo">
              {{ data.documento.nomeArquivo }}
            </span>
            @if (data.documento.tamanho) {
              <span class="text-siage-border select-none">•</span>
              <span>{{ data.documento.tamanho }}</span>
            }
            @if (data.documento.dataUpload) {
              <span class="text-siage-border select-none">•</span>
              <span>Enviado em {{ data.documento.dataUpload }}</span>
            }
          </div>
        </div>

        <!-- BOTÃO FECHAR (X) NO CABEÇALHO -->
        <button 
          type="button" 
          (click)="fechar()" 
          matTooltip="Fechar"
          class="w-8 h-8 rounded-lg flex items-center justify-center text-siage-text-secondary hover:text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
          aria-label="Fechar modal"
        >
          <mat-icon style="font-size: 20px; width: 20px; height: 20px;">close</mat-icon>
        </button>
      </div>

      <!-- CORPO PRINCIPAL DO VISUALIZADOR -->
      <div class="relative flex-1 w-full min-h-0 bg-slate-100 dark:bg-slate-900 overflow-hidden flex flex-col">
        
        <!-- INDICADOR DE CARREGAMENTO -->
        @if (isLoading()) {
          <div class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-siage-surface/80 dark:bg-siage-surface/90 backdrop-blur-xs">
            <div class="w-10 h-10 border-3 border-siage-primary/20 border-t-siage-primary rounded-full animate-spin"></div>
            <span class="text-xs font-medium text-siage-text-secondary">Carregando visualizador de documento...</span>
          </div>
        }

        <!-- MENSAGEM DE ERRO COM BOTÕES DE RECUPERAÇÃO -->
        @if (hasError()) {
          <div class="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div class="w-14 h-14 rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 flex items-center justify-center mb-3">
              <mat-icon style="font-size: 28px; width: 28px; height: 28px;">error_outline</mat-icon>
            </div>
            <h3 class="text-sm font-poppins font-bold text-siage-text-primary mb-1">
              Não foi possível exibir a pré-visualização do documento
            </h3>
            <p class="text-xs text-siage-text-secondary max-w-md mb-4 leading-relaxed">
              O arquivo pode conter restrições de formato ou estar temporariamente indisponível para renderização no navegador. Você pode tentar novamente ou realizar o download do arquivo.
            </p>
            <div class="flex items-center gap-3">
              <button 
                type="button" 
                (click)="tentarNovamente()" 
                class="h-9 px-4 rounded-lg border border-siage-border bg-siage-surface hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold text-siage-text-primary transition-all cursor-pointer"
              >
                Tentar novamente
              </button>
              <button 
                type="button" 
                (click)="baixar()" 
                class="h-9 px-4 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Baixar arquivo
              </button>
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
                <button type="button" (click)="diminuirZoomImagem()" class="w-7 h-7 rounded border border-siage-border flex items-center justify-center hover:bg-black/5" title="Diminuir zoom">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;">remove</mat-icon>
                </button>
                <span class="w-12 text-center font-mono font-medium">{{ imageZoom() }}%</span>
                <button type="button" (click)="aumentarZoomImagem()" class="w-7 h-7 rounded border border-siage-border flex items-center justify-center hover:bg-black/5" title="Aumentar zoom">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;">add</mat-icon>
                </button>
                <button type="button" (click)="resetarZoomImagem()" class="h-7 px-2 rounded border border-siage-border hover:bg-black/5 text-[11px] font-medium" title="Ajustar">
                  100%
                </button>
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

      <!-- RODAPÉ DE AÇÕES DO MODAL (PADRÃO SIAGE-RH V2) -->
      <div class="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-siage-border/40 shrink-0 bg-siage-surface">
        <button 
          type="button" 
          (click)="baixar()" 
          matTooltip="Baixar arquivo para o computador"
          class="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-siage-border bg-siage-surface hover:bg-black/5 dark:hover:bg-white/5 font-sans font-medium text-xs sm:text-sm text-siage-text-primary transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
        >
          <mat-icon style="font-size: 18px; width: 18px; height: 18px;">download</mat-icon>
          <span>Baixar arquivo</span>
        </button>

        <button 
          type="button" 
          (click)="fechar()" 
          class="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
        >
          Fechar
        </button>
      </div>
    </div>
  `
})
export class VisualizarDocumentoModal {
  readonly dialogRef = inject(MatDialogRef<VisualizarDocumentoModal>);
  readonly data = inject<{documento: DocumentoAnexo; titulo?: string; tipoDocumento?: string}>(MAT_DIALOG_DATA);
  private readonly toast = inject(ToastService);

  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly imageZoom = signal(100);

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
    this.toast.success(`Download de "${filename}" iniciado.`);
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

// ==========================================
// MODAL DE HISTÓRICO DE ATOS GOVERNAMENTAIS
// ==========================================

@Component({
  selector: 'app-historico-atos-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatTooltipModule,
    MatDialogModule,
    SiagePaginatorComponent
  ],
  styles: [`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }
  `],
  template: `
    <div class="relative w-full bg-siage-surface text-siage-text-primary font-sans flex flex-col text-left box-border" role="dialog">
      <!-- Cabeçalho -->
      <div class="w-full px-6 pt-5 pb-4 border-b border-siage-border/40 bg-siage-surface flex items-center justify-between gap-3 box-border">
        <div>
          <h2 class="text-base sm:text-lg font-poppins font-bold text-siage-text-primary tracking-tight leading-snug">
            Histórico de Atos Governamentais
          </h2>
          <p class="text-xs text-siage-text-secondary mt-0.5">
            Consulte os atos governamentais registrados para esta Secretaria Geral.
          </p>
        </div>

        <button 
          type="button" 
          (click)="fechar()" 
          matTooltip="Fechar"
          class="w-8 h-8 rounded-lg flex items-center justify-center text-siage-text-secondary hover:text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
          aria-label="Fechar modal"
        >
          <mat-icon style="font-size: 20px; width: 20px; height: 20px;">close</mat-icon>
        </button>
      </div>

      <!-- Tabela com as colunas especificadas -->
      <div class="w-full px-6 py-4 font-sans box-border overflow-x-auto">
        <div class="border border-siage-border rounded-lg overflow-hidden bg-siage-surface">
          <table class="w-full text-left font-sans text-xs border-collapse">
            <thead>
              <tr class="bg-black/[0.02] dark:bg-white/[0.02] border-b border-siage-border text-siage-text-secondary font-semibold">
                <th class="py-3.5 px-3">Número do Ato Governamental</th>
                <th class="py-3.5 px-3">Chefe Imediato</th>
                <th class="py-3.5 px-3">Data da Publicação</th>
                <th class="py-3.5 px-3">Data do Cadastro</th>
                <th class="py-3.5 px-3">Responsável pelo Cadastro</th>
                <th class="py-3.5 px-3 text-center w-28">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-siage-border/40 font-sans">
              @for (item of paginatedAtos(); track item.id) {
                <tr class="hover:bg-siage-primary/[0.04] dark:hover:bg-siage-primary/[0.06] transition-colors">
                  <td class="py-3.5 px-3 font-medium text-siage-text-primary">
                    <span class="font-medium text-sm">{{ item.numero }}</span>
                  </td>
                  <td class="py-3.5 px-3 font-medium text-siage-text-primary text-sm">{{ item.chefeImediato }}</td>
                  <td class="py-3.5 px-3 text-siage-text-secondary text-sm">{{ item.dataPublicacao }}</td>
                  <td class="py-3.5 px-3 text-siage-text-secondary text-sm">{{ item.dataImportacao }}</td>
                  <td class="py-3.5 px-3 text-siage-text-secondary text-sm">{{ item.responsavelImportacao }}</td>
                  <td class="py-3.5 px-3 text-center whitespace-nowrap w-28">
                    <div class="flex items-center justify-center gap-1 mx-auto">
                      <button 
                        type="button" 
                        (click)="visualizar(item)" 
                        matTooltip="Visualizar anexo"
                        class="w-10 h-10 inline-flex items-center justify-center rounded-lg text-siage-text-secondary hover:text-siage-primary hover:bg-siage-primary/8 dark:hover:bg-siage-primary/12 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                      >
                        <mat-icon style="font-size: 20px; width: 20px; height: 20px;">visibility</mat-icon>
                      </button>
                      <button 
                        type="button" 
                        (click)="baixar(item)" 
                        matTooltip="Baixar arquivo"
                        class="w-10 h-10 inline-flex items-center justify-center rounded-lg text-siage-text-secondary hover:text-siage-primary hover:bg-siage-primary/8 dark:hover:bg-siage-primary/12 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                      >
                        <mat-icon style="font-size: 20px; width: 20px; height: 20px;">download</mat-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="p-8 text-center text-siage-text-secondary">
                    <div class="flex flex-col items-center justify-center gap-2">
                      <mat-icon style="font-size: 32px; width: 32px; height: 32px;" class="text-siage-text-secondary/40">inbox</mat-icon>
                      <p class="font-medium text-sm">Nenhum ato governamental encontrado.</p>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <app-siage-paginator 
            [length]="atos().length"
            [pageIndex]="pageIndex()"
            [pageSize]="10"
            (page)="onPageChange($event.pageIndex)"
          />
        </div>
      </div>

      <!-- Rodapé -->
      <div class="w-full px-6 py-3.5 border-t border-siage-border/40 bg-siage-surface flex items-center justify-end box-border">
        <button 
          type="button" 
          (click)="fechar()" 
          class="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
        >
          Fechar
        </button>
      </div>
    </div>
  `
})
export class HistoricoAtosModal {
  readonly dialogRef = inject(MatDialogRef<HistoricoAtosModal>);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  readonly data = inject<{atos: HistoricoAtoItem[]}>(MAT_DIALOG_DATA);

  readonly atos = signal<HistoricoAtoItem[]>(this.data?.atos || []);
  readonly pageIndex = signal(0);

  readonly paginatedAtos = computed(() => {
    const start = this.pageIndex() * 10;
    return this.atos().slice(start, start + 10);
  });

  onPageChange(newIndex: number) {
    this.pageIndex.set(newIndex);
  }

  visualizar(item: HistoricoAtoItem) {
    this.dialog.open(VisualizarDocumentoModal, {
      disableClose: true,
      width: '780px',
      maxWidth: 'calc(100vw - 2.5rem)',
      height: '620px',
      maxHeight: '82vh',
      panelClass: 'siage-pdf-dialog-panel',
      data: {
        documento: item.documento,
        titulo: 'Visualizar anexo'
      }
    });
  }

  baixar(item: HistoricoAtoItem) {
    this.toast.success(`Download de "${item.documento.nomeArquivo}" iniciado.`);
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
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatTooltipModule,
    MatDialogModule,
    SiagePaginatorComponent
  ],
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      max-height: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }
  `],
  template: `
    <div class="relative w-full h-full bg-siage-surface text-siage-text-primary font-sans flex flex-col text-left box-border overflow-hidden" role="dialog" aria-modal="true" aria-label="Buscar Servidor">
      <!-- Cabeçalho -->
      <div class="w-full px-6 py-3.5 border-b border-siage-border/40 bg-siage-surface flex items-center justify-between gap-3 box-border shrink-0">
        <h2 class="text-base sm:text-lg font-poppins font-bold text-siage-text-primary tracking-tight leading-snug">
          Buscar Servidor
        </h2>

        <button 
          type="button" 
          (click)="fechar()" 
          matTooltip="Fechar"
          class="w-8 h-8 rounded-lg flex items-center justify-center text-siage-text-secondary hover:text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
          aria-label="Fechar modal"
        >
          <mat-icon style="font-size: 20px; width: 20px; height: 20px;">close</mat-icon>
        </button>
      </div>

      <!-- Filtros de Pesquisa -->
      <div class="w-full px-6 py-3 bg-slate-50/70 dark:bg-slate-900/30 border-b border-siage-border/40 box-border shrink-0">
        <form [formGroup]="filtroForm" (ngSubmit)="buscar()" class="flex flex-col gap-2.5">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
            <div class="form-field-group">
              <label for="busca-mat" class="siage-field-label text-xs">Matrícula</label>
              <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
                <input 
                  matInput 
                  id="busca-mat" 
                  formControlName="matricula" 
                  placeholder="Digite a matrícula" 
                  (input)="onMatriculaInput($event)"
                  maxlength="7"
                  inputmode="numeric"
                  class="text-xs sm:text-sm"
                >
              </mat-form-field>
            </div>

            <div class="form-field-group">
              <label for="busca-nome" class="siage-field-label text-xs">Nome do Servidor</label>
              <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
                <input 
                  matInput 
                  id="busca-nome" 
                  formControlName="nome" 
                  maxlength="200" 
                  placeholder="Digite o servidor" 
                  class="text-xs sm:text-sm"
                >
              </mat-form-field>
            </div>

            <div class="form-field-group">
              <label for="busca-cpf" class="siage-field-label text-xs">CPF</label>
              <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
                <input 
                  matInput 
                  id="busca-cpf" 
                  formControlName="cpf" 
                  placeholder="Digite o CPF" 
                  (input)="onCpfInput($event)"
                  maxlength="14"
                  inputmode="numeric"
                  class="text-xs sm:text-sm"
                >
              </mat-form-field>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-1.5 border-t border-siage-border/30">
            <button 
              type="button" 
              (click)="limparFiltros()" 
              class="h-8 px-3.5 rounded-lg border border-siage-border font-sans font-medium text-xs text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              Limpar
            </button>
            <button 
              type="submit" 
              class="inline-flex items-center justify-center gap-1.5 h-8 px-4 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              <mat-icon style="font-size: 15px; width: 15px; height: 15px;">search</mat-icon>
              <span>Buscar</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Tabela de Servidores com altura calculada para exibir os 5 registros sem rolagem -->
      <div class="w-full flex-1 min-h-0 px-6 py-3 font-sans box-border flex flex-col overflow-hidden">
        <div class="border border-siage-border rounded-lg overflow-hidden bg-siage-surface flex flex-col flex-1 min-h-0 shadow-xs">
          <div class="flex-1 min-h-0 overflow-y-auto">
            <table class="w-full text-left font-sans text-xs border-collapse">
              <thead class="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-siage-border text-siage-text-secondary font-semibold">
                <tr>
                  <th class="py-2.5 px-3">Nome</th>
                  <th class="py-2.5 px-3">CPF</th>
                  <th class="py-2.5 px-3">Matrícula</th>
                  <th class="py-2.5 px-3">Situação Funcional</th>
                  <th class="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-siage-border/40 font-sans">
                @for (servidor of paginatedServidores(); track servidor.matricula) {
                  <tr class="hover:bg-siage-primary/[0.04] dark:hover:bg-siage-primary/[0.06] transition-colors">
                    <td class="py-2.5 px-3 font-medium text-siage-text-primary text-xs sm:text-sm">{{ servidor.nome }}</td>
                    <td class="py-2.5 px-3 font-mono text-siage-text-secondary text-xs sm:text-sm">{{ servidor.cpf }}</td>
                    <td class="py-2.5 px-3 font-mono font-medium text-siage-text-primary text-xs sm:text-sm">{{ servidor.matricula }}</td>
                    <td class="py-2.5 px-3 text-xs sm:text-sm text-siage-text-primary">{{ servidor.situacaoFuncional }}</td>
                    <td class="py-2.5 px-3 text-right">
                      @if (servidor.situacaoFuncional === 'Em exercício') {
                        <button 
                          type="button" 
                          (click)="selecionarServidor(servidor)"
                          aria-label="Adicionar"
                          matTooltip="Adicionar"
                          class="w-7 h-7 inline-flex items-center justify-center rounded-lg text-siage-primary hover:bg-siage-primary/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                        >
                          <mat-icon style="font-size: 18px; width: 18px; height: 18px;">add</mat-icon>
                        </button>
                      } @else {
                        <span 
                          class="text-[11px] text-siage-text-secondary/60 italic"
                          matTooltip="Apenas servidores com situação 'Em exercício' podem ser designados como Chefe Imediato."
                        >
                          Indisponível
                        </span>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="p-8 text-center text-siage-text-secondary">
                      <div class="flex flex-col items-center justify-center gap-2">
                        <mat-icon style="font-size: 32px; width: 32px; height: 32px;" class="text-siage-text-secondary/40">inbox</mat-icon>
                        <p class="font-medium text-sm">Nenhum servidor encontrado para os critérios informados.</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="shrink-0 border-t border-siage-border/40 bg-siage-surface">
            <app-siage-paginator 
              [length]="filteredServidores().length"
              [pageIndex]="pageIndex()"
              [pageSize]="pageSize()"
              (page)="onPageChange($event.pageIndex)"
            />
          </div>
        </div>
      </div>

      <!-- Rodapé -->
      <div class="w-full px-6 py-3 border-t border-siage-border/40 bg-siage-surface flex items-center justify-end box-border shrink-0">
        <button 
          type="button" 
          (click)="fechar()" 
          class="h-9 px-5 rounded-lg border border-siage-border font-sans font-medium text-xs sm:text-sm text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.99] transition-all cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </div>
  `
})
export class BuscaServidorModal {
  readonly dialogRef = inject(MatDialogRef<BuscaServidorModal>);
  readonly data = inject<{utbCodigo: string; utbDescricao: string}>(MAT_DIALOG_DATA);
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
    this.pageIndex.set(newIndex);
  }

  selecionarServidor(servidor: ServidorUtbItem) {
    this.dialogRef.close(servidor);
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
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule],
  styles: [`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }
  `],
  template: `
    <div class="relative w-full bg-siage-surface text-siage-text-primary font-sans flex flex-col text-left box-border" role="dialog" aria-label="Não é possível inativar">
      <!-- Cabeçalho -->
      <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-siage-border/40 shrink-0">
        <h2 class="text-base sm:text-lg font-poppins font-bold text-siage-text-primary tracking-tight leading-snug truncate pr-3 text-left">
          Não é possível inativar
        </h2>

        <button 
          type="button" 
          (click)="fechar()" 
          class="w-8 h-8 rounded-lg flex items-center justify-center text-siage-text-secondary hover:text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
          title="Fechar"
          aria-label="Fechar modal"
        >
          <mat-icon style="font-size: 18px; width: 18px; height: 18px;">close</mat-icon>
        </button>
      </div>

      <!-- Corpo com as pendências em tópicos simples -->
      <div class="px-6 py-5 overflow-y-auto flex-1 font-sans text-left space-y-3">
        <p class="text-xs sm:text-sm text-siage-text-secondary leading-relaxed">
          Para continuar, resolva as seguintes pendências:
        </p>

        <ul class="space-y-3 pl-0 list-none font-sans">
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
      </div>

      <!-- Rodapé com somente o botão Fechar -->
      <div class="flex items-center justify-end px-6 py-3.5 border-t border-siage-border/40 shrink-0 bg-siage-surface">
        <button 
          type="button" 
          (click)="fechar()" 
          class="h-10 px-5 rounded-lg border border-siage-border font-sans font-medium text-xs sm:text-sm text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.99] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
        >
          Fechar
        </button>
      </div>
    </div>
  `
})
export class ImpedimentoInativacaoModal {
  readonly dialogRef = inject(MatDialogRef<ImpedimentoInativacaoModal>);
  readonly data = inject<{
    nome: string;
    temNormativaExtincao: boolean;
    totalSubordinadas: number;
    unidadesDescricao?: string;
    totalProfissionais?: number;
    temChefe: boolean;
    nomeChefe?: string;
  }>(MAT_DIALOG_DATA);

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
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    SiageDatePickerComponent
  ],
  styles: [`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }
  `],
  template: `
    <div class="relative w-full bg-siage-surface text-siage-text-primary font-sans flex flex-col text-left box-border" role="dialog" aria-label="Anexar Normativa de Extinção">
      <!-- Cabeçalho -->
      <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-siage-border/40 shrink-0">
        <div>
          <h2 class="text-base sm:text-lg font-poppins font-bold text-siage-text-primary tracking-tight leading-snug truncate pr-3 text-left">
            Anexar Normativa de Extinção
          </h2>
          <p class="text-xs text-siage-text-secondary mt-0.5">
            Informe os dados da normativa e anexe o documento oficial para inativar a <strong>{{ data.nome }}</strong>.
          </p>
        </div>

        <button 
          type="button" 
          (click)="cancelar()" 
          class="w-8 h-8 rounded-lg flex items-center justify-center text-siage-text-secondary hover:text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
          title="Fechar"
          aria-label="Fechar modal"
        >
          <mat-icon style="font-size: 18px; width: 18px; height: 18px;">close</mat-icon>
        </button>
      </div>

      <!-- Formulário -->
      <form [formGroup]="form" (ngSubmit)="concluir()" class="px-6 py-5 overflow-y-auto flex-1 font-sans text-left space-y-4">
        <!-- Nome da Normativa -->
        <!-- Nome da Normativa -->
        <div class="form-field-group">
          <div class="flex items-center justify-between">
            <label for="modal-norm-nome" class="siage-field-label">
              Nome da Normativa de Extinção <span class="text-red-500">*</span>
            </label>
            <span class="text-[11px] text-siage-text-secondary font-mono">
              {{ (form.get('nome')?.value || '').length }} / 100
            </span>
          </div>
          <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
            <input 
              matInput 
              id="modal-norm-nome"
              formControlName="nome" 
              maxlength="100"
              placeholder="Ex: Lei Complementar nº 184/2023 - Extinção da Secretaria"
              class="text-sm"
            >
            @if (form.get('nome')?.touched && form.get('nome')?.hasError('required')) {
              <mat-error>O Nome da Normativa é obrigatório.</mat-error>
            } @else if (form.get('nome')?.touched && form.get('nome')?.hasError('maxlength')) {
              <mat-error>O Nome da Normativa deve ter no máximo 100 caracteres.</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Número da Normativa -->
          <div class="form-field-group">
            <label for="modal-norm-numero" class="siage-field-label">
              Número da Normativa <span class="text-red-500">*</span>
            </label>
            <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
              <input 
                matInput 
                id="modal-norm-numero"
                formControlName="numero" 
                maxlength="20"
                placeholder="Ex: 184"
                class="text-sm"
              >
              @if (form.get('numero')?.touched && form.get('numero')?.hasError('required')) {
                <mat-error>O Número da Normativa é obrigatório.</mat-error>
              } @else if (form.get('numero')?.touched && form.get('numero')?.hasError('maxlength')) {
                <mat-error>O Número da Normativa deve ter no máximo 20 caracteres.</mat-error>
              }
            </mat-form-field>
          </div>

          <!-- Data da Publicação -->
          <div class="form-field-group">
            <app-siage-date-picker
              id="modal-norm-data"
              label="Data da Publicação"
              [required]="true"
              formControlName="dataPublicacao"
              [control]="form.controls.dataPublicacao"
              errorMessage="A Data da Publicação é obrigatória."
            />
          </div>
        </div>

        <!-- Anexo do Documento -->
        <div class="flex flex-col gap-2 pt-1">
          <span class="text-xs font-semibold text-siage-text-primary">
            Documento Anexo da Normativa <span class="text-red-500">*</span>
          </span>

          @if (documento(); as doc) {
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
                    (click)="visualizarDoc(doc)" 
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
                    (click)="removerDoc()" 
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
              id="container-anexo-modal"
              class="border-2 border-dashed rounded-lg p-4 text-center transition-colors"
              [class.border-red-500]="tentouSalvarSemDoc()"
              [class.bg-red-50/20]="tentouSalvarSemDoc()"
              [class.dark:bg-red-950/20]="tentouSalvarSemDoc()"
              [class.border-siage-border/80]="!tentouSalvarSemDoc() && canAnexarDoc()"
              [class.hover:border-siage-primary/60]="!tentouSalvarSemDoc() && canAnexarDoc()"
              [class.bg-siage-surface/50]="!tentouSalvarSemDoc() && canAnexarDoc()"
              [class.border-slate-200]="!tentouSalvarSemDoc() && !canAnexarDoc()"
              [class.dark:border-slate-800]="!tentouSalvarSemDoc() && !canAnexarDoc()"
              [class.bg-slate-100/50]="!tentouSalvarSemDoc() && !canAnexarDoc()"
              [class.dark:bg-slate-900/20]="!tentouSalvarSemDoc() && !canAnexarDoc()"
              [class.opacity-60]="!canAnexarDoc()"
              [class.cursor-not-allowed]="!canAnexarDoc()"
            >
              <input 
                type="file" 
                id="file-modal-ext" 
                class="hidden" 
                accept=".pdf,.jpg,.jpeg,.png" 
                [disabled]="!canAnexarDoc()"
                (change)="onFileSelected($event)"
              >
              <label 
                for="file-modal-ext" 
                class="flex flex-col items-center justify-center gap-1.5"
                [class.cursor-pointer]="canAnexarDoc()"
                [class.cursor-not-allowed]="!canAnexarDoc()"
              >
                <mat-icon [class.text-siage-primary]="canAnexarDoc()" [class.text-siage-text-secondary]="!canAnexarDoc()" style="font-size: 24px; width: 24px; height: 24px;">cloud_upload</mat-icon>
                <span class="text-xs font-semibold" [class.text-siage-primary]="canAnexarDoc()" [class.text-siage-text-secondary]="!canAnexarDoc()">
                  Clique para anexar o documento da Normativa de Extinção
                </span>
                <span class="text-[11px] text-siage-text-secondary">
                  @if (canAnexarDoc()) {
                    PDF, JPG, JPEG ou PNG (máx. 10 MB)
                  } @else {
                    Preencha o Nome, Número e Data da Publicação para habilitar a anexação
                  }
                </span>
              </label>
            </div>
            @if (tentouSalvarSemDoc()) {
              <span class="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1 mt-1">
                <mat-icon style="font-size: 14px; width: 14px; height: 14px;">error</mat-icon>
                É obrigatório anexar o documento da normativa.
              </span>
            }
          }
        </div>
      </form>

      <!-- Rodapé -->
      <div class="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-siage-border/40 shrink-0 bg-siage-surface">
        <button 
          type="button" 
          (click)="cancelar()" 
          class="h-10 px-5 rounded-lg border border-siage-border font-sans font-medium text-xs sm:text-sm text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.99] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
        >
          Cancelar
        </button>

        <button 
          type="button" 
          (click)="concluir()" 
          class="h-10 px-6 rounded-lg bg-[var(--destructive)] hover:opacity-90 text-white font-sans font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--destructive)]/40"
        >
          Sim, inativar
        </button>
      </div>
    </div>
  `
})
export class AnexarNormativaExtincaoModal {
  readonly dialogRef = inject(MatDialogRef<AnexarNormativaExtincaoModal, NormativaItem>);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  readonly data = inject<{nome: string}>(MAT_DIALOG_DATA);

  readonly documento = signal<DocumentoAnexo | undefined>(undefined);
  readonly tentouSalvarSemDoc = signal(false);

  readonly form = new FormGroup({
    nome: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    numero: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(20)] }),
    dataPublicacao: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  readonly nomeVal = toSignal(this.form.controls.nome.valueChanges, { initialValue: '' });
  readonly numeroVal = toSignal(this.form.controls.numero.valueChanges, { initialValue: '' });
  readonly dataVal = toSignal(this.form.controls.dataPublicacao.valueChanges, { initialValue: '' });

  readonly canAnexarDoc = computed(() => {
    const nome = (this.nomeVal() || this.form.controls.nome.value || '').trim();
    const num = (this.numeroVal() || this.form.controls.numero.value || '').trim();
    const data = (this.dataVal() || this.form.controls.dataPublicacao.value || '').trim();
    return nome.length > 0 && nome.length <= 100 && num.length > 0 && num.length <= 20 && validarDataFormato(data);
  });

  onFileSelected(event: Event) {
    if (!this.canAnexarDoc()) {
      this.toast.warning('Preencha os campos obrigatórios da normativa antes de anexar o documento.');
      return;
    }
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > 10 * 1024 * 1024) {
        this.toast.warning('O arquivo excede o limite máximo permitido de 10 MB.');
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
      this.documento.set(doc);
      this.tentouSalvarSemDoc.set(false);
      this.toast.success(`Arquivo "${file.name}" anexado.`);
    }
  }

  removerDoc() {
    this.documento.set(undefined);
  }

  visualizarDoc(doc: DocumentoAnexo) {
    this.dialog.open(VisualizarDocumentoModal, {
      disableClose: true,
      width: '780px',
      maxWidth: 'calc(100vw - 2.5rem)',
      height: '620px',
      maxHeight: '82vh',
      panelClass: 'siage-pdf-dialog-panel',
      data: {
        documento: doc,
        titulo: 'Visualizar anexo'
      }
    });
  }

  baixarDoc(doc: DocumentoAnexo) {
    this.toast.success(`Download de "${doc.nomeArquivo}" iniciado.`);
    const blob = new Blob([`Simulação de documento oficial: ${doc.nomeArquivo}`], {type: 'application/pdf'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.nomeArquivo;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  cancelar() {
    this.dialogRef.close();
  }

  focusPrimeiroCampoInvalidoModal() {
    setTimeout(() => {
      const candidateSelectors = [
        '#modal-norm-nome',
        '#modal-norm-numero',
        '#modal-norm-data input, #modal-norm-data',
        '#container-anexo-modal'
      ];
      for (const sel of candidateSelectors) {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (el) {
          const isInvalid = el.classList.contains('ng-invalid') ||
            el.closest('.mat-form-field-invalid') !== null ||
            el.closest('.has-date-error') !== null ||
            el.classList.contains('border-red-500');
          if (isInvalid) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
              el.focus();
            } else {
              const inner = el.querySelector('input, select, textarea, button, [tabindex="0"]') as HTMLElement | null;
              if (inner) {
                inner.focus();
              } else {
                el.focus();
              }
            }
            return;
          }
        }
      }
    }, 100);
  }

  concluir() {
    this.form.markAllAsTouched();
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
      hasError = true;
    } else if (!validarDataFormato(data)) {
      this.form.controls.dataPublicacao.setErrors({ dataFormato: 'Informe uma data válida no formato DD/MM/AAAA.' });
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
    MatDialogModule,
    MatAutocompleteModule,
    SiagePaginatorComponent,
    AcessoRestritoComponent
  ],
  styles: [`
    :host ::ng-deep .controlled-sec-toggle,
    :host ::ng-deep .controlled-sec-toggle * {
      pointer-events: none !important;
      user-select: none !important;
    }
  `],
  template: `
    @if (!hasAccess()) {
      <app-acesso-restrito backUrl="/configuracoes/hierarquia" />
    } @else {
      <div class="flex flex-col gap-6 font-sans">
        
        <!-- Breadcrumb: Início > Configurações > Hierarquia de Unidades e Cargos > Configurar Secretaria Geral -->
        <div class="flex flex-col gap-2">
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
            <span class="text-siage-primary font-semibold" aria-current="page">Configurar Secretaria Geral</span>
          </nav>

          <!-- Título com Botão Voltar, Descrição e Botão Adicionar -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2 sm:gap-3">
                <button 
                  mat-icon-button 
                  (click)="goHierarquia()" 
                  class="text-siage-text-secondary hover:text-siage-primary transition-colors cursor-pointer -ml-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                  title="Voltar para Hierarquia de Unidades e Cargos"
                >
                  <mat-icon style="font-size: 22px; width: 22px; height: 22px;">arrow_back</mat-icon>
                </button>
                <h1 class="text-2xl sm:text-3xl font-poppins font-bold tracking-tight text-siage-text-primary leading-tight">
                  Configurar Secretaria Geral
                </h1>
              </div>

              <p class="text-xs sm:text-sm text-siage-text-secondary font-sans leading-normal pl-8 sm:pl-9 max-w-2xl">
                Gerencie o nível superior da estrutura organizacional do SIAGE-RH, a vinculação de chefia e suas normativas.
              </p>
            </div>

            <!-- Botão Adicionar (com tooltip e bloqueio caso já exista Secretaria Geral ativa) -->
            <div class="shrink-0 pl-8 sm:pl-0">
              <button 
                type="button" 
                (click)="onAdicionar()"
                [disabled]="hasActiveSecGeral() || !permissionService.canCreate()"
                [matTooltip]="getAdicionarTooltip()"
                [class.opacity-50]="hasActiveSecGeral() || !permissionService.canCreate()"
                [class.cursor-not-allowed]="hasActiveSecGeral() || !permissionService.canCreate()"
                class="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40 disabled:hover:bg-siage-primary"
              >
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">add</mat-icon>
                <span>Adicionar</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Card de Filtros (Padrão Professores / SIAGE-RH V2) -->
        <div class="bg-siage-surface border border-siage-border rounded-lg p-5 shadow-xs flex flex-col gap-4">
          <form [formGroup]="filtroForm" (ngSubmit)="canBuscar() && onBuscar()" class="flex flex-col gap-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              
              <!-- Filtro: Nome (limitado a 200 caracteres conforme RF001) -->
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
                  @if (filtroForm.get('nome')?.value) {
                    <button mat-icon-button matSuffix type="button" (click)="limparFiltroNome()" aria-label="Limpar campo">
                      <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                    </button>
                  }
                </mat-form-field>
              </div>

              <!-- Filtro: Unidade de Trabalho (UTB) (Select com autocomplete) -->
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
                  @if (filtroForm.get('utb')?.value) {
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
                <p class="text-xs sm:text-sm text-siage-text-secondary">Ainda não existem secretarias gerais cadastradas.</p>
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
                        [attr.aria-label]="'Ordenar por Nome da Secretaria Geral ' + (sortColumn() === 'nome' ? (sortDirection() === 'asc' ? 'decrescente' : 'crescente') : 'crescente')"
                      >
                        <span class="transition-colors" [class.text-siage-text-primary]="sortColumn() === 'nome'" [class.text-siage-text-secondary]="sortColumn() !== 'nome'">Nome da Secretaria Geral</span>
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
                            aria-label="Visualizar Secretaria Geral"
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
                              aria-label="Editar Secretaria Geral"
                              class="w-10 h-10 inline-flex items-center justify-center rounded-lg text-siage-text-secondary hover:text-siage-primary hover:bg-siage-primary/8 dark:hover:bg-siage-primary/12 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                            >
                              <mat-icon style="font-size: 20px; width: 20px; height: 20px;">edit</mat-icon>
                            </button>
                          }

                          <!-- Ativar / Inativar Slide Toggle (Padrão Professores) -->
                          @if (permissionService.canCreate()) {
                            <div class="relative w-10 h-10 inline-flex items-center justify-center">
                              <!-- Switch visual MatSlideToggle rigorosamente controlado pelo modelo -->
                              <div class="controlled-sec-toggle flex items-center justify-center select-none" aria-hidden="true">
                                <mat-slide-toggle 
                                  [checked]="item.status === 'ATIVO'" 
                                  tabindex="-1"
                                  aria-hidden="true"
                                  class="scale-90"
                                >
                                </mat-slide-toggle>
                              </div>

                              <!-- Botão interativo que intercepta todos os cliques e ações de teclado -->
                              <button 
                                type="button"
                                (click)="onToggleStatus(item)"
                                [matTooltip]="item.status === 'ATIVO' ? 'Inativar' : 'Ativar'"
                                [attr.aria-label]="item.status === 'ATIVO' ? 'Inativar Secretaria Geral' : 'Ativar Secretaria Geral'"
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

            <!-- Paginação padronizada -->
            <app-siage-paginator 
              [length]="sortedItems().length"
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
export class SecretariaGeralList {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly toastService = inject(ToastService);
  readonly service = inject(SecretariaGeralService);
  readonly permissionService = inject(PermissionService);
  readonly simulatorService = inject(SimulatorService);

  readonly hasAccess = computed(() => this.permissionService.hasAccess() && this.simulatorService.currentScenario() !== 'access_denied');
  readonly hasActiveSecGeral = computed(() => this.service.hasActiveSecGeral());

  readonly isCarregando = computed(() => this.simulatorService.currentScenario() === 'loading');
  readonly isErro = computed(() => this.simulatorService.currentScenario() === 'error');

  readonly filtroForm = new FormGroup({
    nome: new FormControl('', [Validators.maxLength(200)]),
    utb: new FormControl(''),
    status: new FormControl('TODOS')
  });

  readonly filtroNomeVal = toSignal(this.filtroForm.controls.nome.valueChanges, { initialValue: '' });
  readonly filtroUtbVal = toSignal(this.filtroForm.controls.utb.valueChanges, { initialValue: '' });

  // Botão Buscar habilitado apenas quando pelo menos um dos filtros Nome ou UTB possuir valor preenchido
  readonly canBuscar = computed(() => {
    const nome = (this.filtroNomeVal() ?? this.filtroForm.controls.nome.value ?? '').trim();
    const utb = (this.filtroUtbVal() ?? this.filtroForm.controls.utb.value ?? '').trim();
    return nome.length > 0 || utb.length > 0;
  });

  readonly appliedNome = signal('');
  readonly appliedUtb = signal('');
  readonly appliedStatus = signal('TODOS');
  readonly pageIndex = signal(0);

  // Ordenação: inicial por Data de Criação decrescente; permite crescente/decrescente em Nome e UTB
  readonly sortColumn = signal<'dataCriacao' | 'nome' | 'utb'>('dataCriacao');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  toggleSort(column: 'dataCriacao' | 'nome' | 'utb') {
    if (this.sortColumn() === column) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set(column === 'dataCriacao' ? 'desc' : 'asc');
    }
    this.pageIndex.set(0);
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

  readonly filteredUtbsList = computed(() => {
    const query = (this.filtroUtbVal() || this.filtroForm.get('utb')?.value || '').trim().toLowerCase();
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
    const start = this.pageIndex() * 10;
    return list.slice(start, start + 10);
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
    if (this.canBuscar()) {
      this.onBuscar();
    } else {
      this.onLimpar();
    }
  }

  limparFiltroUtb() {
    this.filtroForm.get('utb')?.setValue('');
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
    this.appliedUtb.set(this.filtroForm.get('utb')?.value || '');
    this.appliedStatus.set(this.filtroForm.get('status')?.value || 'TODOS');
    this.pageIndex.set(0);
  }

  onLimpar() {
    this.filtroForm.reset({nome: '', utb: '', status: 'TODOS'});
    this.appliedNome.set('');
    this.appliedUtb.set('');
    this.appliedStatus.set('TODOS');
    this.pageIndex.set(0);
  }

  onPageChange(newIndex: number) {
    this.pageIndex.set(newIndex);
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

  onToggleStatus(item: SecretariaGeralItem) {
    if (item.status === 'ATIVO') {
      this.onInativar(item);
    } else {
      this.onAtivar();
    }
  }

  onAtivar() {
    this.toastService.warning('A inativação de uma Secretaria Geral é irreversível. O registro não pode ser reativado.');
  }

  onInativar(item: SecretariaGeralItem) {
    // 1. Apresentar SEMPRE o modal de confirmação antes de verificar os impedimentos
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
            nomeChefe: item.chefeImediato?.nome
          }
        });
        return;
      }

      // Se NÃO houver outros impedimentos e a Normativa de Extinção estiver ausente,
      // abrir uma etapa de anexação no próprio fluxo
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

        anexarRef.afterClosed().subscribe((normativa?: NormativaItem) => {
          if (normativa) {
            // Concluir a inativação diretamente sem exigir nova confirmação
            this.service.inativar(item.id, normativa);
            this.toastService.success('Registro inativado com sucesso.');
          }
        });
        return;
      }

      // Se a normativa já estiver anexada e não houver impedimentos,
      // concluir diretamente a inativação após a confirmação inicial
      this.service.inativar(item.id);
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
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatDialogModule,
    SiageDatePickerComponent,
    SiagePaginatorComponent,
    AcessoRestritoComponent
  ],
  template: `
    @if (!hasAccess()) {
      <app-acesso-restrito backUrl="/configuracoes/hierarquia/secretaria-geral" />
    } @else {
      <div class="flex flex-col gap-6 font-sans">
        
        <!-- Breadcrumb: Início > Configurações > Hierarquia de Unidades e Cargos > Configurar Secretaria Geral > [Cadastrar | Editar] -->
        <div class="flex flex-col gap-2">
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
            <span 
              (click)="goBack()" 
              (keydown.enter)="goBack()" 
              tabindex="0" 
              role="button" 
              class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline"
            >
              Configurar Secretaria Geral
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
                  (click)="onCancelar()" 
                  class="text-siage-text-secondary hover:text-siage-primary transition-colors cursor-pointer -ml-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                  title="Voltar para a listagem"
                >
                  <mat-icon style="font-size: 22px; width: 22px; height: 22px;">arrow_back</mat-icon>
                </button>
                <h1 class="text-2xl sm:text-3xl font-poppins font-bold tracking-tight text-siage-text-primary leading-tight">
                  {{ isEditMode() ? 'Editar Secretaria Geral' : 'Adicionar Secretaria Geral' }}
                </h1>
              </div>

              <p class="text-xs sm:text-sm text-siage-text-secondary font-sans leading-normal pl-8 sm:pl-9 max-w-2xl">
                {{ isEditMode() ? 'Atualize as informações, chefia e normativas da Secretaria Geral.' : 'Preencha os campos obrigatórios para estruturar a Secretaria Geral.' }}
              </p>
            </div>
          </div>
        </div>

        <!-- FORMULÁRIO ORGANIZADO EM SEÇÕES -->
        <form [formGroup]="form" class="flex flex-col gap-6">

          <!-- ============================================== -->
          <!-- SEÇÃO 1: IDENTIFICAÇÃO DA SECRETARIA           -->
          <!-- ============================================== -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">domain</mat-icon>
              <span>1. Identificação</span>
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              <!-- Nome da Secretaria Geral -->
              <div class="md:col-span-2 form-field-group">
                <label for="form-nome" class="siage-field-label">
                  Nome da Secretaria Geral <span class="required-marker">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="form-nome"
                    formControlName="nome" 
                    maxlength="200"
                    placeholder="Ex: Secretaria Geral de Governo e Articulação Institucional"
                  >
                  <mat-hint align="end" class="text-xs text-siage-text-secondary">
                    {{ (form.get('nome')?.value || '').length }} / 200
                  </mat-hint>
                  @if (form.get('nome')?.hasError('required') && form.get('nome')?.touched) {
                    <mat-error>O Nome da Secretaria Geral é obrigatório.</mat-error>
                  }
                  @if (form.get('nome')?.hasError('duplicado')) {
                    <mat-error>Já existe uma Secretaria Geral cadastrada com este nome.</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Unidade de Trabalho (UTB) -->
              <div class="md:col-span-2 form-field-group">
                <label for="form-utb" class="siage-field-label">
                  Unidade de Trabalho (UTB) <span class="required-marker">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
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
                        A Unidade de Trabalho (UTB) não pode ser alterada porque existem chefia ou Secretarias Executivas vinculadas.
                      </span>
                    </mat-hint>
                  }
                  @if ((form.get('utbCodigo')?.hasError('required') || utbInputControl.hasError('required')) && (form.get('utbCodigo')?.touched || utbInputControl.touched)) {
                    <mat-error>A Unidade de Trabalho (UTB) é obrigatória.</mat-error>
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
                    <!-- Número do Ato -->
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
                          placeholder="Ex: Ato nº 1.420/2024"
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
                <p>Nenhum Chefe Imediato vinculado no momento. Selecione uma Unidade de Trabalho (UTB) e clique em "Adicionar Chefe".</p>
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

            <!-- BLOCO 1: NORMATIVA DE CRIAÇÃO (OBRIGATÓRIA) -->
            <div class="flex flex-col gap-4">
              <div class="flex items-center gap-2">
                <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-emerald-600">verified</mat-icon>
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
                    <div class="col-span-12 border border-siage-border rounded-lg overflow-hidden bg-siage-surface">
                      <div class="flex items-center justify-between p-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded bg-siage-primary/10 text-siage-primary flex items-center justify-center shrink-0">
                            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">description</mat-icon>
                          </div>
                          <div class="flex flex-col min-w-0">
                            <span class="text-xs sm:text-sm font-medium text-siage-text-primary break-words">{{ doc.nomeArquivo }}</span>
                            <span class="text-[11px] text-siage-text-secondary">{{ doc.tamanho }} • Enviado em {{ doc.dataUpload }}</span>
                          </div>
                        </div>
                        <div class="flex items-center gap-1 shrink-0">
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
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        placeholder="Ex: Decreto Estadual nº 42.150/2023 - Estrutura Organizacional"
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

                  <div class="form-field-group">
                    <label for="form-norm-criacao-numero" class="siage-field-label">
                      Número da Normativa <span class="required-marker">*</span>
                    </label>
                    <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                      <input 
                        matInput 
                        id="form-norm-criacao-numero"
                        [formControl]="normCriacaoNumeroControl" 
                        maxlength="20"
                        placeholder="Ex: 42.150"
                      >
                      @if (normCriacaoNumeroControl.hasError('required') && normCriacaoNumeroControl.touched) {
                        <mat-error>O Número da Normativa de Criação é obrigatório.</mat-error>
                      } @else if (normCriacaoNumeroControl.hasError('maxlength') && normCriacaoNumeroControl.touched) {
                        <mat-error>O Número da Normativa de Criação deve ter no máximo 20 caracteres.</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="form-field-group">
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
                    (click)="iniciarAdicaoNormativaExtincao()"
                    class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-xs transition-all shadow-xs cursor-pointer"
                  >
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;">add</mat-icon>
                    <span>Adicionar Normativa</span>
                  </button>
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
                    <div class="col-span-12 border border-siage-border rounded-lg overflow-hidden bg-siage-surface">
                      <div class="flex items-center justify-between p-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded bg-siage-primary/10 text-siage-primary flex items-center justify-center shrink-0">
                            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">description</mat-icon>
                          </div>
                          <div class="flex flex-col min-w-0">
                            <span class="text-xs sm:text-sm font-medium text-siage-text-primary break-words">{{ doc.nomeArquivo }}</span>
                            <span class="text-[11px] text-siage-text-secondary">{{ doc.tamanho }} • Enviado em {{ doc.dataUpload }}</span>
                          </div>
                        </div>
                        <div class="flex items-center gap-1 shrink-0">
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
                <!-- CENÁRIO 2: FORMULÁRIO EXPANDIDO (após clicar em Adicionar Normativa) -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 border border-siage-border/60 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-900/30">
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
                        placeholder="Ex: Lei Complementar nº 184/2023 - Extinção da Secretaria"
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
                      Número da Normativa <span class="required-marker">*</span>
                    </label>
                    <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                      <input 
                        matInput 
                        id="form-norm-ext-numero"
                        [formControl]="normExtincaoNumeroControl" 
                        maxlength="20"
                        placeholder="Ex: 184"
                      >
                      @if (normExtincaoNumeroControl.hasError('required') && normExtincaoNumeroControl.touched) {
                        <mat-error>O Número da Normativa de Extinção é obrigatório.</mat-error>
                      } @else if (normExtincaoNumeroControl.hasError('maxlength') && normExtincaoNumeroControl.touched) {
                        <mat-error>O Número da Normativa de Extinção deve ter no máximo 20 caracteres.</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="form-field-group">
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
                      Documento Anexo da Normativa de Extinção * (PDF, JPG, JPEG ou PNG até 10 MB)
                    </span>

                    @if (normExtincaoDoc(); as doc) {
                      <div class="border border-siage-border rounded-lg overflow-hidden bg-siage-surface">
                        <div class="flex items-center justify-between p-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                          <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded bg-siage-primary/10 text-siage-primary flex items-center justify-center shrink-0">
                              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">description</mat-icon>
                            </div>
                            <div class="flex flex-col min-w-0">
                              <span class="text-xs sm:text-sm font-medium text-siage-text-primary break-words">{{ doc.nomeArquivo }}</span>
                              <span class="text-[11px] text-siage-text-secondary">{{ doc.tamanho }} • Enviado em {{ doc.dataUpload }}</span>
                            </div>
                          </div>
                          <div class="flex items-center gap-1 shrink-0">
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

          <!-- ============================================== -->
          <!-- SEÇÃO 4: SECRETARIAS EXECUTIVAS VINCULADAS     -->
          <!-- ============================================== -->
          @if (isEditMode()) {
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">account_tree</mat-icon>
                <span>4. Secretarias Executivas Vinculadas</span>
              </h3>

              <!-- Filtros de Secretarias Executivas Vinculadas -->
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
                      @if (filtroSubordinadaNome.value) {
                        <button mat-icon-button matSuffix type="button" (click)="limparFiltroSubNome()" aria-label="Limpar campo">
                          <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                        </button>
                      }
                    </mat-form-field>
                  </div>

                  <!-- Filtro: Unidade de Trabalho (UTB) (Select com autocomplete) -->
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
                        @for (utb of filteredUtbSubOptions(); track utb.codigo) {
                          <mat-option [value]="utb.codigo + ' - ' + utb.nome">
                            {{ utb.codigo }} - {{ utb.nome }}
                          </mat-option>
                        }
                      </mat-autocomplete>
                      @if (filtroSubordinadaUtb.value) {
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

              <!-- Tabela de Subordinadas -->
              <div class="border border-siage-border rounded-lg overflow-hidden bg-siage-surface">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="bg-slate-100/70 dark:bg-slate-800/50 border-b border-siage-border text-siage-text-secondary font-semibold">
                      <th class="p-3">Tipo / Unidade Vinculada</th>
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
export class SecretariaGeralForm {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly modalService = inject(ModalService);
  private readonly toastService = inject(ToastService);
  readonly service = inject(SecretariaGeralService);
  readonly permissionService = inject(PermissionService);

  readonly isEditMode = signal(false);
  readonly isSaving = signal(false);
  readonly hasPersistedNormativaExtincao = signal(false);
  itemId: string | null = null;
  currentItem: SecretariaGeralItem | null = null;

  private cancelHandler!: FormCancelHandler;

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
  readonly utbInputVal = toSignal(this.utbInputControl.valueChanges, { initialValue: '' });

  // Chefia Imediata
  readonly chefeImediato = signal<ChefeImediatoItem | undefined>(undefined);
  readonly atoNumeroControl = new FormControl('', {nonNullable: true, validators: [Validators.maxLength(20)]});
  readonly atoDataControl = new FormControl('', {nonNullable: true});
  readonly atoDocumento = signal<DocumentoAnexo | undefined>(undefined);
  readonly atoNumeroVal = toSignal(this.atoNumeroControl.valueChanges, { initialValue: '' });
  readonly atoDataVal = toSignal(this.atoDataControl.valueChanges, { initialValue: '' });

  // Normativa de Criação
  readonly normCriacaoNomeControl = new FormControl('', {nonNullable: true, validators: [Validators.maxLength(100)]});
  readonly normCriacaoNumeroControl = new FormControl('', {nonNullable: true, validators: [Validators.maxLength(20)]});
  readonly normCriacaoDataControl = new FormControl('', {nonNullable: true});
  readonly normCriacaoDoc = signal<DocumentoAnexo | undefined>(undefined);
  readonly normCriacaoNomeVal = toSignal(this.normCriacaoNomeControl.valueChanges, { initialValue: '' });
  readonly normCriacaoNumeroVal = toSignal(this.normCriacaoNumeroControl.valueChanges, { initialValue: '' });
  readonly normCriacaoDataVal = toSignal(this.normCriacaoDataControl.valueChanges, { initialValue: '' });

  // Normativa de Extinção
  readonly normExtincaoNomeControl = new FormControl('', {nonNullable: true, validators: [Validators.maxLength(100)]});
  readonly normExtincaoNumeroControl = new FormControl('', {nonNullable: true, validators: [Validators.maxLength(20)]});
  readonly normExtincaoDataControl = new FormControl('', {nonNullable: true});
  readonly normExtincaoDoc = signal<DocumentoAnexo | undefined>(undefined);
  readonly normativaExtincaoAdicionada = signal(false);
  readonly expandindoNormativaExtincao = signal(false);
  readonly normExtincaoNomeVal = toSignal(this.normExtincaoNomeControl.valueChanges, { initialValue: '' });
  readonly normExtincaoNumeroVal = toSignal(this.normExtincaoNumeroControl.valueChanges, { initialValue: '' });
  readonly normExtincaoDataVal = toSignal(this.normExtincaoDataControl.valueChanges, { initialValue: '' });

  readonly formatarDataParaExibicao = formatarDataParaExibicao;
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
    return num.length > 0 && num.length <= 20 && data.length > 0 && validarDataFormato(data);
  });

  readonly canAnexarNormCriacao = computed(() => {
    const nome = (this.normCriacaoNomeVal() || this.normCriacaoNomeControl.value || '').trim();
    const num = (this.normCriacaoNumeroVal() || this.normCriacaoNumeroControl.value || '').trim();
    const data = (this.normCriacaoDataVal() || this.normCriacaoDataControl.value || '').trim();
    return nome.length > 0 && nome.length <= 100 && num.length > 0 && num.length <= 20 && data.length > 0 && validarDataFormato(data);
  });

  readonly canAnexarNormExtincao = computed(() => {
    const nome = (this.normExtincaoNomeVal() || this.normExtincaoNomeControl.value || '').trim();
    const num = (this.normExtincaoNumeroVal() || this.normExtincaoNumeroControl.value || '').trim();
    const data = (this.normExtincaoDataVal() || this.normExtincaoDataControl.value || '').trim();
    return nome.length > 0 && nome.length <= 100 && num.length > 0 && num.length <= 20 && data.length > 0 && validarDataFormato(data);
  });

  // Subordinadas (Edição)
  readonly subordinadas = signal<UnidadeSubordinadaItem[]>([]);
  readonly filtroSubordinadaNome = new FormControl('', [Validators.maxLength(200)]);
  readonly filtroSubordinadaUtb = new FormControl('');
  readonly filtroSubNomeVal = toSignal(this.filtroSubordinadaNome.valueChanges, { initialValue: '' });
  readonly filtroSubUtbVal = toSignal(this.filtroSubordinadaUtb.valueChanges, { initialValue: '' });
  readonly appliedSubordinadaNome = signal('');
  readonly appliedSubordinadaUtb = signal('');
  readonly subordinadasPageIndex = signal(0);

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

  readonly filteredUtbSubOptions = computed(() => {
    const query = (this.filtroSubUtbVal() || this.filtroSubordinadaUtb.value || '').trim().toLowerCase();
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
    const utb = (this.filtroSubUtbVal() ?? this.filtroSubordinadaUtb.value ?? '').trim();
    return nome.length > 0 || utb.length > 0;
  });

  onBuscarSubordinadas() {
    if (!this.canBuscarSubordinadas()) return;
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
    const start = this.subordinadasPageIndex() * 10;
    return list.slice(start, start + 10);
  });

  readonly utbsDisponiveis = computed(() => {
    // Exibe apenas UTBs que não estão em uso por outra Secretaria Geral ativa
    return this.service.utbs().filter(u => !this.service.isUtbEmUso(u.codigo, this.itemId || undefined));
  });

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

  constructor() {
    const params = this.route.snapshot.params;
    const url = this.router.url;

    this.cancelHandler = new FormCancelHandler(
      this.form,
      this.modalService,
      () => this.goBack()
    );

    this.form.get('nome')?.valueChanges.subscribe(() => {
      if (this.form.get('nome')?.hasError('duplicado')) {
        this.form.get('nome')?.setErrors(null);
      }
    });

    effect(() => {
      if (this.isUtbBloqueada()) {
        this.utbInputControl.disable({ emitEvent: false });
        this.form.get('utbCodigo')?.disable({ emitEvent: false });
      } else {
        this.utbInputControl.enable({ emitEvent: false });
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
        this.cancelHandler.captureInitialState();
        this.initialSnapshotJson = this.getCurrentSnapshotJson();
      }
    } else {
      this.initialSnapshotJson = this.getCurrentSnapshotJson();
    }
  }

  private isHandlingUtbSelection = false;

  confirmarTrocaUtb(novoCodigo: string, callbackConfirmado: () => void) {
    const currentCodigo = this.form.get('utbCodigo')?.value;
    const existing = this.service.utbs().find(u => u.codigo === currentCodigo);
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

  onUtbSelected(codigo: string) {
    if (this.isUtbBloqueada()) return;
    const currentCodigo = this.form.get('utbCodigo')?.value;
    if (codigo === currentCodigo) {
      const existing = this.service.utbs().find(u => u.codigo === currentCodigo);
      if (existing) {
        this.utbInputControl.setValue(`${existing.codigo} - ${existing.nome}`, { emitEvent: false });
      }
      return;
    }

    const utb = this.service.utbs().find(u => u.codigo === codigo);
    if (!utb) return;

    // Regras de confirmação:
    // - Adicionar: com Chefe Imediato selecionado, exige confirmação. Sem chefe, troca direto.
    // - Editar: exige confirmação para qualquer troca permitida de UTB, mesmo sem chefia vinculada.
    const requiresConfirmation = this.isEditMode()
      ? !!currentCodigo
      : !!this.chefeImediato();

    const aplicarNovaUtb = () => {
      this.form.get('utbCodigo')?.setValue(utb.codigo);
      this.form.get('utbCodigo')?.markAsDirty();
      this.utbInputControl.setValue(`${utb.codigo} - ${utb.nome}`, { emitEvent: false });
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
      }
    } else {
      const existing = this.service.utbs().find(u => u.codigo === currentSelectedCodigo);
      if (existing) {
        this.utbInputControl.setValue(`${existing.codigo} - ${existing.nome}`, { emitEvent: false });
      } else {
        this.limparUtb();
      }
    }
  }

  onSubordinadasPageChange(newIndex: number) {
    this.subordinadasPageIndex.set(newIndex);
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
    const dialogRef = this.dialog.open(BuscaServidorModal, {
      width: '800px',
      maxWidth: 'calc(100vw - 2.5rem)',
      height: '690px',
      maxHeight: 'calc(100vh - 2.5rem)',
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
      autoFocus: false,
      data: {
        utbCodigo,
        utbDescricao: utb?.descricaoCompleta || utbCodigo
      }
    });

    dialogRef.afterClosed().subscribe((servidor: ServidorUtbItem | undefined) => {
      if (servidor) {
        const isSubstituicao = !!this.chefeImediato() && this.chefeImediato()?.matricula !== servidor.matricula;
        if (isSubstituicao) {
          this.atoNumeroControl.reset('');
          this.atoDataControl.reset('');
          this.atoDocumento.set(undefined);
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
    const dialogRef = this.dialog.open(ConfirmacaoDialog, {
      disableClose: true,
      data: {
        title: 'Remover Chefe Imediato?',
        message: 'Tem certeza que deseja desvincular o Chefe Imediato e seu respectivo Ato Governamental?',
        cancelLabel: 'Cancelar',
        actionLabel: 'Sim, remover',
        actionType: 'destructive'
      }
    });

    dialogRef.afterClosed().subscribe((confirma: boolean) => {
      if (confirma) {
        this.chefeImediato.set(undefined);
        this.atoNumeroControl.reset();
        this.atoDataControl.reset();
        this.atoDocumento.set(undefined);
        this.toastService.info('Chefe Imediato removido.');
      }
    });
  }

  onFileAtoSelected(event: Event) {
    if (!this.canAnexarAto()) {
      this.toastService.warning('Preencha os campos obrigatórios do Ato Governamental com valores válidos antes de anexar o documento.');
      return;
    }
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
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
  }

  onFileNormCriacaoSelected(event: Event) {
    if (!this.canAnexarNormCriacao()) {
      this.toastService.warning('Preencha os campos obrigatórios da Normativa de Criação com valores válidos antes de anexar o documento.');
      return;
    }
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
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
  }

  onFileNormExtincaoSelected(event: Event) {
    if (!this.canAnexarNormExtincao()) {
      this.toastService.warning('Preencha os campos obrigatórios da Normativa de Extinção com valores válidos antes de anexar o documento.');
      return;
    }
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
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
  }

  iniciarAdicaoNormativaExtincao() {
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

    // Normaliza formato da data para exibição / persistência
    this.normExtincaoDataControl.setValue(normalizarDataParaBr(data), { emitEvent: false });
    this.normativaExtincaoAdicionada.set(true);
    this.expandindoNormativaExtincao.set(false);
    this.toastService.success('Normativa de Extinção adicionada com sucesso.');
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
    this.dialog.open(HistoricoAtosModal, {
      width: '900px',
      maxWidth: 'calc(100vw - 2.5rem)',
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
      autoFocus: false,
      data: { atos }
    });
  }

  onCancelar() {
    if (!this.hasUnsavedChanges()) {
      this.router.navigate(['/configuracoes/hierarquia/secretaria-geral']);
      return;
    }
    const dialogRef = this.modalService.confirmarCancelamento();
    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
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
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatDialogModule,
    SiagePaginatorComponent,
    AcessoRestritoComponent
  ],
  template: `
    @if (!hasAccess()) {
      <app-acesso-restrito backUrl="/configuracoes/hierarquia/secretaria-geral" />
    } @else {
      <div class="flex flex-col gap-6 font-sans">
        
        <!-- Breadcrumb: Início > Configurações > Hierarquia de Unidades e Cargos > Configurar Secretaria Geral > Visualizar -->
        <div class="flex flex-col gap-2">
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
            <span 
              (click)="goBack()" 
              (keydown.enter)="goBack()" 
              tabindex="0" 
              role="button" 
              class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline"
            >
              Configurar Secretaria Geral
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
                  (click)="goBack()" 
                  class="text-siage-text-secondary hover:text-siage-primary transition-colors cursor-pointer -ml-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                  title="Voltar para a listagem"
                >
                  <mat-icon style="font-size: 22px; width: 22px; height: 22px;">arrow_back</mat-icon>
                </button>
                <h1 class="text-2xl sm:text-3xl font-poppins font-bold tracking-tight text-siage-text-primary leading-tight">
                  Visualizar Secretaria Geral
                </h1>
              </div>

              <p class="text-xs sm:text-sm text-siage-text-secondary font-sans leading-normal pl-8 sm:pl-9 max-w-2xl">
                Consulte as informações, dados de chefia, normativas e unidades subordinadas da Secretaria Geral.
              </p>
            </div>

            <!-- Ação Editar -->
            @if (permissionService.canCreate()) {
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

        @if (item(); as sec) {
          <div class="flex flex-col gap-6">

            <!-- Card 1: Identificação da Secretaria Geral -->
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">domain</mat-icon>
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
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">badge</mat-icon>
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

            <!-- Card 3: Secretarias Executivas Vinculadas -->
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">account_tree</mat-icon>
                <span>3. Secretarias Executivas Vinculadas</span>
              </h3>

              <!-- Filtros de Secretarias Executivas Vinculadas -->
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
                      @if (filtroNome.value) {
                        <button mat-icon-button matSuffix type="button" (click)="limparFiltroNome()" aria-label="Limpar campo">
                          <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                        </button>
                      }
                    </mat-form-field>
                  </div>

                  <!-- Filtro: Unidade de Trabalho (UTB) (Select com autocomplete) -->
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
                        @for (utb of filteredUtbOptions(); track utb.codigo) {
                          <mat-option [value]="utb.codigo + ' - ' + utb.nome">
                            {{ utb.codigo }} - {{ utb.nome }}
                          </mat-option>
                        }
                      </mat-autocomplete>
                      @if (filtroUtb.value) {
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

              <div class="border border-siage-border rounded-lg overflow-hidden bg-siage-surface">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="bg-slate-100/70 dark:bg-slate-800/50 border-b border-siage-border text-siage-text-secondary font-semibold">
                      <th class="p-3">Tipo / Unidade Vinculada</th>
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
                    <div class="col-span-12 border border-siage-border rounded-lg overflow-hidden bg-siage-surface">
                      <div class="flex items-center justify-between p-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded bg-siage-primary/10 text-siage-primary flex items-center justify-center shrink-0">
                            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">description</mat-icon>
                          </div>
                          <div class="flex flex-col min-w-0">
                            <span class="text-xs sm:text-sm font-medium text-siage-text-primary break-words">{{ doc.nomeArquivo }}</span>
                            <span class="text-[11px] text-siage-text-secondary">{{ doc.tamanho }} • Enviado em {{ doc.dataUpload }}</span>
                          </div>
                        </div>
                        <div class="flex items-center gap-1 shrink-0">
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

              <!-- BLOCO 2: NORMATIVA DE EXTINÇÃO (Exibido apenas quando houver documento cadastrado) -->
              @if (sec.normativaExtincao?.documento; as docExt) {
                <div class="pt-4 border-t border-siage-border/40 flex flex-col gap-4">
                  <div class="flex items-center gap-2">
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-amber-600">history_edu</mat-icon>
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
                    <div class="col-span-12 border border-siage-border rounded-lg overflow-hidden bg-siage-surface">
                      <div class="flex items-center justify-between p-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded bg-siage-primary/10 text-siage-primary flex items-center justify-center shrink-0">
                            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">description</mat-icon>
                          </div>
                          <div class="flex flex-col min-w-0">
                            <span class="text-xs sm:text-sm font-medium text-siage-text-primary break-words">{{ docExt.nomeArquivo }}</span>
                            <span class="text-[11px] text-siage-text-secondary">{{ docExt.tamanho }} • Enviado em {{ docExt.dataUpload }}</span>
                          </div>
                        </div>
                        <div class="flex items-center gap-1 shrink-0">
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
  private readonly dialog = inject(MatDialog);
  private readonly toastService = inject(ToastService);
  readonly service = inject(SecretariaGeralService);
  readonly permissionService = inject(PermissionService);

  readonly hasAccess = computed(() => this.permissionService.hasAccess());
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
  readonly filtroUtb = new FormControl('');
  readonly filtroNomeVal = toSignal(this.filtroNome.valueChanges, { initialValue: '' });
  readonly filtroUtbVal = toSignal(this.filtroUtb.valueChanges, { initialValue: '' });
  readonly appliedNome = signal('');
  readonly appliedUtb = signal('');
  readonly pageIndex = signal(0);

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

  readonly filteredUtbOptions = computed(() => {
    const query = (this.filtroUtbVal() || this.filtroUtb.value || '').trim().toLowerCase();
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
    const utb = (this.filtroUtbVal() ?? this.filtroUtb.value ?? '').trim();
    return nome.length > 0 || utb.length > 0;
  });

  onBuscar() {
    if (!this.canBuscar()) return;
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
    const start = this.pageIndex() * 10;
    return list.slice(start, start + 10);
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
    this.pageIndex.set(newIndex);
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

  abrirHistoricoAtos() {
    const sec = this.item();
    const atos = this.service.getHistoricoAtos(sec?.id, sec?.chefeImediato?.atoGovernamental, sec?.chefeImediato?.nome);
    this.dialog.open(HistoricoAtosModal, {
      width: '900px',
      maxWidth: 'calc(100vw - 2.5rem)',
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
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

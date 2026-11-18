import {Component, inject, signal, computed, effect, ChangeDetectionStrategy, Injectable, ChangeDetectorRef} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {PageEvent} from '@angular/material/paginator';
import {Sort} from '@angular/material/sort';
import {MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS, MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSelectModule} from '@angular/material/select';
import {MatCardModule} from '@angular/material/card';
import {CommonModule} from '@angular/common';
import {SBadgeComponent, SButtonComponent, SEmptyStateComponent, SFieldComponent, SIconButtonComponent, SInputComponent, SModalComponent, SModalFooterDirective, SPageHeaderComponent, SRadioGroupComponent, SSelectComponent, STableCellDirective, STableComponent, STextareaComponent, type STableColumn, type STableSort} from '@siage/siage-ui';

import {ConfirmacaoDialog, ResultadoDialog, RevalidarSenhaDialog, RevalidarSenhaDialogData, VinculoUsoItem, VINCULOS_USO_MUITOS, ModalService} from './dialog';
import {ToastService} from './toast';
import {SimulatorService} from './simulator';
import {AcessoRestritoComponent} from './acesso-restrito';
import {PermissionService} from './permission';
import {SiageDatePickerComponent} from './siage-date-picker';
import {SituacaoFuncionalService} from './situacao-funcional';
import {RegimeContratacaoService} from './regime-contratacao';
import {CargoService} from './cargo';
import {CargoComissionadoService} from './cargo-comissionado';
import {FormaAdmissaoService} from './forma-de-admissao';
import {ClassificacaoFuncionalService} from './classificacao-funcional';
import {GrauInstrucaoService} from './grau-de-instrucao';
import {NgxExtendedPdfViewerModule} from 'ngx-extended-pdf-viewer';
import {SiagePaginatorComponent} from './siage-paginator';

export type TipoProfessor = 'MILITAR' | 'EMERGENCIAL' | 'BASE_TECNICA';

export interface AnexoItem {
  id: string;
  nome: string;
  tamanho: string;
  dataEnvio: string;
  tipo: string;
  isNovo?: boolean;
  url?: string;
  blobUrl?: string;
}

export interface ProfessorItem {
  id: string;
  tipo: TipoProfessor;
  
  // Identificação
  cpf: string;
  matricula: string;
  nome: string;
  dataNascimento: string;

  // Documentação
  rg: string;
  ufRg: string;
  orgaoEmissor: string;
  dataExpedicao: string;
  pisPasep: string;

  // Dados funcionais
  situacaoFuncional: string;
  regime: string;
  cargo: string;
  cargoComissionado: string;
  formaAdmissao: string;
  instrucao: string;
  formacao: string;
  utb: string;
  dataInicioExercicio: string;
  dataAdmissao: string;
  dataFinalContrato?: string;
  secretaria: string;
  emailInstitucional?: string;

  // Dados pessoais
  sexo: string;
  telefone: string;
  emailPessoal: string;
  nomeMae?: string;
  nomePai?: string;

  // Endereço
  cep: string;
  estado: string;
  municipio: string;
  rua: string;
  numero: string;
  bairro: string;
  complemento?: string;

  // Anexos
  anexos: AnexoItem[];

  // Situação & Gestão
  ativo: boolean;
  emUsoOriginal?: boolean;
  exibindoEmUsoIndicator?: boolean;
  justificativaInativacao?: string;
  usuarioInativacaoNome?: string;
  usuarioInativacaoMatricula?: string;
  vinculos?: VinculoUsoItem[];
  ultimaAtualizacao?: string;
  dataUltimaAtualizacao?: string;
  horaUltimaAtualizacao?: string;
  usuarioUltimaAtualizacao?: string;
}

export function formatarDataHoraAtual(): { data: string; hora: string } {
  const now = new Date();
  const dia = String(now.getDate()).padStart(2, '0');
  const mes = String(now.getMonth() + 1).padStart(2, '0');
  const ano = now.getFullYear();
  const horas = String(now.getHours()).padStart(2, '0');
  const minutos = String(now.getMinutes()).padStart(2, '0');
  return {
    data: `${dia}/${mes}/${ano}`,
    hora: `${horas}:${minutos}`
  };
}

export function isCpfValido(cpf: string): boolean {
  const clean = (cpf || '').replace(/\D/g, '');
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(10), 10)) return false;

  return true;
}

export function formatarCpf(val: string): string {
  const digits = (val || '').replace(/\D/g, '').substring(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.substring(0, 3)}.${digits.substring(3)}`;
  if (digits.length <= 9) return `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6)}`;
  return `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6, 9)}-${digits.substring(9, 11)}`;
}

export function formatarCep(val: string): string {
  const digits = (val || '').replace(/\D/g, '').substring(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.substring(0, 5)}-${digits.substring(5, 8)}`;
}

export function formatarTelefone(val: string): string {
  const digits = (val || '').replace(/\D/g, '').substring(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
  if (digits.length <= 10) {
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
  }
  return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7, 11)}`;
}

export function formatarPis(val: string): string {
  const digits = (val || '').replace(/\D/g, '').substring(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 8) return `${digits.substring(0, 3)}.${digits.substring(3)}`;
  if (digits.length <= 10) return `${digits.substring(0, 3)}.${digits.substring(3, 8)}.${digits.substring(8)}`;
  return `${digits.substring(0, 3)}.${digits.substring(3, 8)}.${digits.substring(8, 10)}-${digits.substring(10, 11)}`;
}

export function telefoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const val = control.value;
    if (!val || typeof val !== 'string' || !val.trim()) return null;
    const digits = val.replace(/\D/g, '');
    if (digits.length !== 10 && digits.length !== 11) {
      return { telefoneInvalido: true };
    }
    return null;
  };
}

export function cepValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const val = control.value;
    if (!val || typeof val !== 'string' || !val.trim()) return null;
    const digits = val.replace(/\D/g, '');
    if (digits.length !== 8) {
      return { cepIncompleto: true };
    }
    return null;
  };
}

export function siageEmailValidator(): ValidatorFn {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
  return (control: AbstractControl): ValidationErrors | null => {
    const val = control.value;
    if (!val || typeof val !== 'string' || !val.trim()) return null;
    const clean = val.trim();
    if (!emailRegex.test(clean)) {
      return { emailInvalido: true };
    }
    return null;
  };
}

export function dataNascimentoExpedicaoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const val = control.value;
    if (!val || typeof val !== 'string' || !val.trim()) return null;

    let y = 0, m = 0, d = 0;
    if (val.includes('-')) {
      const parts = val.split('-');
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      d = parseInt(parts[2], 10);
    } else if (val.includes('/')) {
      const parts = val.split('/');
      d = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      y = parseInt(parts[2], 10);
    }
    if (!y || !m || !d || isNaN(y) || isNaN(m) || isNaN(d)) {
      return { dataFormato: 'Data inválida.' };
    }

    const date = new Date(y, m - 1, d, 0, 0, 0, 0);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 100);
    minDate.setHours(0, 0, 0, 0);

    if (date.getTime() > today.getTime()) {
      return { dataRange: 'Data não pode ser posterior à data atual.' };
    }
    if (date.getTime() < minDate.getTime()) {
      return { dataRange: 'Data não pode ser anterior a 100 anos em relação à data atual.' };
    }
    return null;
  };
}

export function dataIntervalo1950A2050Validator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const val = control.value;
    if (!val || typeof val !== 'string' || !val.trim()) return null;

    let y = 0, m = 0, d = 0;
    if (val.includes('-')) {
      const parts = val.split('-');
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      d = parseInt(parts[2], 10);
    } else if (val.includes('/')) {
      const parts = val.split('/');
      d = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      y = parseInt(parts[2], 10);
    }
    if (!y || !m || !d || isNaN(y) || isNaN(m) || isNaN(d)) {
      return { dataFormato: 'Data inválida.' };
    }

    if (y < 1950 || y > 2050) {
      return { dataRange: 'Data deve estar no intervalo de 1950 a 2050.' };
    }
    return null;
  };
}

export function getTipoProfessorDescricao(tipo: TipoProfessor): string {
  switch (tipo) {
    case 'MILITAR': return 'Professor Militar';
    case 'EMERGENCIAL': return 'Professor em contratação emergencial';
    case 'BASE_TECNICA': return 'Professor da Base Técnica';
  }
}

export function getSecretariaPadrao(tipo: TipoProfessor): string {
  return tipo === 'MILITAR'
    ? '25 - Secretaria de Segurança e Defesa Social'
    : '21 - Secretaria de Estado da Educação';
}

export function getCodigoSeadEsperado(tipo: TipoProfessor): string {
  switch (tipo) {
    case 'MILITAR': return '888888';
    case 'EMERGENCIAL': return '999999';
    case 'BASE_TECNICA': return '777777';
    default: return '888888';
  }
}

export const LISTA_27_UFS: { sigla: string; nome: string }[] = [
  { sigla: 'AC', nome: 'Acre (AC)' },
  { sigla: 'AL', nome: 'Alagoas (AL)' },
  { sigla: 'AP', nome: 'Amapá (AP)' },
  { sigla: 'AM', nome: 'Amazonas (AM)' },
  { sigla: 'BA', nome: 'Bahia (BA)' },
  { sigla: 'CE', nome: 'Ceará (CE)' },
  { sigla: 'DF', nome: 'Distrito Federal (DF)' },
  { sigla: 'ES', nome: 'Espírito Santo (ES)' },
  { sigla: 'GO', nome: 'Goiás (GO)' },
  { sigla: 'MA', nome: 'Maranhão (MA)' },
  { sigla: 'MT', nome: 'Mato Grosso (MT)' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul (MS)' },
  { sigla: 'MG', nome: 'Minas Gerais (MG)' },
  { sigla: 'PA', nome: 'Pará (PA)' },
  { sigla: 'PB', nome: 'Paraíba (PB)' },
  { sigla: 'PR', nome: 'Paraná (PR)' },
  { sigla: 'PE', nome: 'Pernambuco (PE)' },
  { sigla: 'PI', nome: 'Piauí (PI)' },
  { sigla: 'RJ', nome: 'Rio de Janeiro (RJ)' },
  { sigla: 'RN', nome: 'Rio Grande do Norte (RN)' },
  { sigla: 'RS', nome: 'Rio Grande do Sul (RS)' },
  { sigla: 'RO', nome: 'Rondônia (RO)' },
  { sigla: 'RR', nome: 'Roraima (RR)' },
  { sigla: 'SC', nome: 'Santa Catarina (SC)' },
  { sigla: 'SP', nome: 'São Paulo (SP)' },
  { sigla: 'SE', nome: 'Sergipe (SE)' },
  { sigla: 'TO', nome: 'Tocantins (TO)' }
];

export const CEP_DATABASE: Record<string, {estado: string; municipio: string; rua: string; bairro: string}> = {
  '58040000': { estado: 'PB', municipio: 'João Pessoa', rua: 'Avenida Cabo Branco', bairro: 'Cabo Branco' },
  '58051200': { estado: 'PB', municipio: 'João Pessoa', rua: 'Rua Bancário Sérgio Guerra', bairro: 'Bancários' },
  '58055000': { estado: 'PB', municipio: 'João Pessoa', rua: 'Rua Rejane Freire Correia', bairro: 'Jardim Cidade Universitária' },
  '58030000': { estado: 'PB', municipio: 'João Pessoa', rua: 'Avenida Epitácio Pessoa', bairro: 'Estados' },
  '58013000': { estado: 'PB', municipio: 'João Pessoa', rua: 'Parque Solon de Lucena', bairro: 'Centro' },
  '58400000': { estado: 'PB', municipio: 'Campina Grande', rua: 'Avenida Floriano Peixoto', bairro: 'Centro' },
  '58000000': { estado: 'PB', municipio: 'João Pessoa', rua: 'Rua das Trincheiras', bairro: 'Centro' },
  '50010000': { estado: 'PE', municipio: 'Recife', rua: 'Avenida Rio Branco', bairro: 'Bairro do Recife' },
  '59010000': { estado: 'RN', municipio: 'Natal', rua: 'Avenida Deodoro da Fonseca', bairro: 'Centro' },
  '60010000': { estado: 'CE', municipio: 'Fortaleza', rua: 'Rua Major Facundo', bairro: 'Centro' }
};

export const ESTADOS_MUNICIPIOS: Record<string, string[]> = {
  AC: ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá'],
  AL: ['Maceió', 'Arapiraca', 'Palmeira dos Índios', 'Rio Largo'],
  AP: ['Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque'],
  AM: ['Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru'],
  BA: ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari'],
  CE: ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral', 'Crato', 'Itapipoca'],
  DF: ['Brasília', 'Ceilândia', 'Taguatinga', 'Samambaia'],
  ES: ['Vitória', 'Vila Velha', 'Serra', 'Cariacica'],
  GO: ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde'],
  MA: ['São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon'],
  MT: ['Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop'],
  MS: ['Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá'],
  MG: ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora'],
  PA: ['Belém', 'Ananindeua', 'Santarém', 'Marabá'],
  PB: ['João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux', 'Sousa', 'Cajazeiras', 'Cabedelo', 'Guarabira', 'Mamanguape'],
  PR: ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa'],
  PE: ['Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina', 'Paulista', 'Cabo de Santo Agostinho'],
  PI: ['Teresina', 'Parnaíba', 'Picos', 'Floriano'],
  RJ: ['Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói'],
  RN: ['Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Macaíba', 'Ceará-Mirim', 'Caicó'],
  RS: ['Porto Alegre', 'Caxias do Sul', 'Canoas', 'Pelotas'],
  RO: ['Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena'],
  RR: ['Boa Vista', 'Rorainópolis', 'Caracaraí', 'Pacaraima'],
  SC: ['Florianópolis', 'Joinville', 'Blumenau', 'São José'],
  SP: ['São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André'],
  SE: ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana'],
  TO: ['Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional']
};

@Injectable({
  providedIn: 'root'
})
export class ProfessoresService {
  readonly defaultVinculos: VinculoUsoItem[] = [
    { schema: 'rh', tabela: 'profissional_matricula' },
    { schema: 'diario', tabela: 'diario_classe_turma_docente' },
    { schema: 'folha', tabela: 'ficha_financeira_cabecalho' }
  ];

  readonly items = signal<ProfessorItem[]>([
    {
      id: '1',
      tipo: 'MILITAR',
      cpf: '123.456.789-01',
      matricula: '5542109',
      nome: 'Capitão Marcos Vinicius da Silva Lima',
      dataNascimento: '1982-04-14',
      rg: '2451890',
      ufRg: 'PB',
      orgaoEmissor: 'SSP',
      dataExpedicao: '2000-08-10',
      pisPasep: '128.45901.23-4',
      situacaoFuncional: '1 - Efetivo em exercício',
      regime: '1 - Estatutário',
      cargo: '20009 - PROFESSOR DE ENSINO MEDIO',
      cargoComissionado: '101 - Diretor Escolar',
      formaAdmissao: '101 - Concurso Público',
      instrucao: '09 - Especialização/Pós-Graduação',
      formacao: '101 - Licenciatura em Matemática',
      utb: '1003 - Colégio da Polícia Militar da Paraíba - Unidade João Pessoa',
      dataInicioExercicio: '2012-02-01',
      dataAdmissao: '2012-01-15',
      secretaria: '25 - Secretaria de Segurança e Defesa Social',
      emailInstitucional: 'marcos.lima@seds.pb.gov.br',
      sexo: 'Masculino',
      telefone: '(83) 98877-6655',
      emailPessoal: 'marcos.vinicius.lima@gmail.com',
      cep: '58040-000',
      estado: 'PB',
      municipio: 'João Pessoa',
      rua: 'Avenida Epitácio Pessoa',
      numero: '1420',
      bairro: 'Tambauzinho',
      complemento: 'Apto 402',
      anexos: [
        { id: 'a1', nome: 'portaria_designacao_militar.pdf', tamanho: '1.2 MB', dataEnvio: '15/01/2023', tipo: 'application/pdf', url: '/exemplo-documento-comprovacao.pdf' },
        { id: 'a2', nome: 'diploma_licenciatura_matematica.pdf', tamanho: '3.4 MB', dataEnvio: '15/01/2023', tipo: 'application/pdf', url: '/exemplo-documento-comprovacao.pdf' }
      ],
      ativo: true,
      emUsoOriginal: false,
      exibindoEmUsoIndicator: false,
      ultimaAtualizacao: 'Última atualização em 03/06/2024 às 13:44 pelo usuário Alessandra.'
    },
    {
      id: '2',
      tipo: 'EMERGENCIAL',
      cpf: '234.567.890-12',
      matricula: '9804215',
      nome: 'Juliana Andrade de Vasconcelos Ribeiro',
      dataNascimento: '1988-11-20',
      rg: '3120444',
      ufRg: 'PB',
      orgaoEmissor: 'IPC',
      dataExpedicao: '2006-03-22',
      pisPasep: '170.88412.90-1',
      situacaoFuncional: '11 - Contrato temporário em vigor',
      regime: '3 - Contrato Temporário / Emergencial',
      cargo: '20006 - PROFESSOR',
      cargoComissionado: '102 - Vice-Diretor Escolar',
      formaAdmissao: '202 - Contrato Temporário',
      instrucao: '08 - Superior Completo',
      formacao: '103 - Licenciatura em Letras / Português',
      utb: '1001 - EEEFM Professor Raul Córdula - Ensino Fundamental e Médio',
      dataInicioExercicio: '2023-02-05',
      dataAdmissao: '2023-02-01',
      dataFinalContrato: '2026-12-31',
      secretaria: '21 - Secretaria de Estado da Educação',
      emailInstitucional: 'juliana.ribeiro@see.pb.gov.br',
      nomeMae: 'Maria de Lourdes Vasconcelos',
      nomePai: 'Antônio Carlos Ribeiro',
      sexo: 'Feminino',
      telefone: '(83) 99123-4567',
      emailPessoal: 'juliana.vasconcelos@hotmail.com',
      cep: '58051-200',
      estado: 'PB',
      municipio: 'João Pessoa',
      rua: 'Rua Bancário Sérgio Guerra',
      numero: '350',
      bairro: 'Bancários',
      complemento: 'Bloco B, Apto 101',
      anexos: [
        { id: 'a3', nome: 'contrato_temporario_assinado.pdf', tamanho: '2.1 MB', dataEnvio: '02/02/2023', tipo: 'application/pdf', url: '/exemplo-documento-comprovacao.pdf' }
      ],
      ativo: true,
      emUsoOriginal: false,
      exibindoEmUsoIndicator: false,
      ultimaAtualizacao: 'Última atualização em 10/05/2024 às 09:12 pelo usuário Roberto.'
    },
    {
      id: '3',
      tipo: 'BASE_TECNICA',
      cpf: '345.678.901-23',
      matricula: '9815430',
      nome: 'Eduardo Henrique Barbosa Cavalcanti dos Santos',
      dataNascimento: '1991-07-08',
      rg: '3670999',
      ufRg: 'PB',
      orgaoEmissor: 'SSP',
      dataExpedicao: '2009-12-14',
      pisPasep: '190.11223.34-5',
      situacaoFuncional: '1 - Efetivo em exercício',
      regime: '2 - Celetista (CLT)',
      cargo: '20009 - PROFESSOR DE ENSINO MEDIO',
      cargoComissionado: '103 - Coordenador Pedagógico',
      formaAdmissao: '505 - Processo Seletivo Simplificado',
      instrucao: '10 - Mestrado',
      formacao: '106 - Engenharia da Computação / Tecnologia da Informação',
      utb: '1004 - Centro Estadual de Educação Profissional e Tecnológica de Mangabeira',
      dataInicioExercicio: '2022-03-01',
      dataAdmissao: '2022-02-20',
      dataFinalContrato: '2025-12-31',
      secretaria: '21 - Secretaria de Estado da Educação',
      emailInstitucional: 'eduardo.cavalcanti@see.pb.gov.br',
      nomeMae: 'Clarice Cavalcanti dos Santos',
      nomePai: 'Rogério Barbosa dos Santos',
      sexo: 'Masculino',
      telefone: '(83) 99654-3210',
      emailPessoal: 'eduardo.cavalcanti.dev@gmail.com',
      cep: '58055-000',
      estado: 'PB',
      municipio: 'João Pessoa',
      rua: 'Rua Josefa Taveira',
      numero: '1890',
      bairro: 'Mangabeira',
      complemento: 'Sala 12',
      anexos: [
        { id: 'a4', nome: 'curriculo_lattes_comprovado.pdf', tamanho: '4.8 MB', dataEnvio: '20/02/2022', tipo: 'application/pdf', url: '/exemplo-documento-comprovacao.pdf' },
        { id: 'a5', nome: 'termo_posse_base_tecnica.pdf', tamanho: '1.5 MB', dataEnvio: '20/02/2022', tipo: 'application/pdf', url: '/exemplo-documento-comprovacao.pdf' }
      ],
      ativo: true,
      emUsoOriginal: false,
      exibindoEmUsoIndicator: false,
      ultimaAtualizacao: 'Última atualização em 28/04/2024 às 16:30 pelo usuário Marcela.'
    },
    {
      id: '4',
      tipo: 'MILITAR',
      cpf: '456.789.012-34',
      matricula: '5521876',
      nome: 'Tenente Roberto Ferreira Guimarães Neto',
      dataNascimento: '1979-02-17',
      rg: '1998231',
      ufRg: 'PB',
      orgaoEmissor: 'SSP',
      dataExpedicao: '1997-05-19',
      pisPasep: '112.99012.34-5',
      situacaoFuncional: '7 - Disponível',
      regime: '1 - Estatutário',
      cargo: '20009 - PROFESSOR DE ENSINO MEDIO',
      cargoComissionado: '101 - Diretor Escolar',
      formaAdmissao: '101 - Concurso Público',
      instrucao: '09 - Especialização/Pós-Graduação',
      formacao: '104 - Licenciatura em História',
      utb: '1003 - Colégio da Polícia Militar da Paraíba - Unidade João Pessoa',
      dataInicioExercicio: '2015-08-01',
      dataAdmissao: '2015-07-20',
      secretaria: '25 - Secretaria de Segurança e Defesa Social',
      emailInstitucional: 'roberto.guimaraes@seds.pb.gov.br',
      sexo: 'Masculino',
      telefone: '(83) 98711-2233',
      emailPessoal: 'roberto.guimaraes.neto@gmail.com',
      cep: '58030-000',
      estado: 'PB',
      municipio: 'João Pessoa',
      rua: 'Avenida Senador Ruy Carneiro',
      numero: '800',
      bairro: 'Miramar',
      anexos: [
        { id: 'a6', nome: 'retorno_batalhao_portaria.pdf', tamanho: '950 KB', dataEnvio: '15/05/2024', tipo: 'application/pdf', url: '/exemplo-documento-comprovacao.pdf' }
      ],
      ativo: false,
      emUsoOriginal: false,
      exibindoEmUsoIndicator: false,
      justificativaInativacao: 'Término de cessão para atuação no Colégio da Polícia Militar e retorno ao 1º Batalhão de Polícia Militar em 15/05/2024 conforme Boletim Interno nº 092/2024.',
      usuarioInativacaoNome: 'Coronel Antônio Dantas de Medeiros',
      usuarioInativacaoMatricula: '0189341',
      ultimaAtualizacao: 'Última atualização em 15/05/2024 às 11:00 pelo usuário Coronel Dantas.'
    },
    {
      id: '5',
      tipo: 'EMERGENCIAL',
      cpf: '567.890.123-45',
      matricula: '9834112',
      nome: 'Professora Patrícia Albuquerque Montenegro Cavalcante',
      dataNascimento: '1985-09-30',
      rg: '2890111',
      ufRg: 'PB',
      orgaoEmissor: 'IPC',
      dataExpedicao: '2003-10-12',
      pisPasep: '160.77889.90-2',
      situacaoFuncional: '11 - Contrato temporário em vigor',
      regime: '3 - Contrato Temporário / Emergencial',
      cargo: '20008 - PROFESSOR DE EDUCACAO BASICA 1',
      cargoComissionado: '102 - Vice-Diretor Escolar',
      formaAdmissao: '202 - Contrato Temporário',
      instrucao: '09 - Especialização/Pós-Graduação',
      formacao: '102 - Licenciatura em Pedagogia',
      utb: '1002 - EEEM Lyceu Paraibano - Centro Estadual de Ensino Médio Tradicional',
      dataInicioExercicio: '2021-02-10',
      dataAdmissao: '2021-02-01',
      dataFinalContrato: '2025-12-31',
      secretaria: '21 - Secretaria de Estado da Educação',
      emailInstitucional: 'patricia.albuquerque@see.pb.gov.br',
      nomeMae: 'Socorro Albuquerque Montenegro',
      nomePai: 'José Cavalcante Filho',
      sexo: 'Feminino',
      telefone: '(83) 99344-5566',
      emailPessoal: 'patricia.montenegro@gmail.com',
      cep: '58013-000',
      estado: 'PB',
      municipio: 'João Pessoa',
      rua: 'Avenida Presidente Getúlio Vargas',
      numero: '450',
      bairro: 'Centro',
      complemento: 'Edifício Paraíba, Sala 301',
      anexos: [
        { id: 'a7', nome: 'contrato_prorrogacao_2024.pdf', tamanho: '1.8 MB', dataEnvio: '10/01/2024', tipo: 'application/pdf', url: '/exemplo-documento-comprovacao.pdf' }
      ],
      ativo: true,
      emUsoOriginal: true,
      exibindoEmUsoIndicator: false,
      vinculos: [
        { schema: 'rh', tabela: 'profissional_matricula' },
        { schema: 'diario', tabela: 'diario_classe_turma_docente' },
        { schema: 'folha', tabela: 'ficha_financeira_cabecalho' }
      ],
      ultimaAtualizacao: 'Última atualização em 12/06/2024 às 14:10 pelo usuário Alessandra.'
    },
    {
      id: '6',
      tipo: 'BASE_TECNICA',
      cpf: '678.901.234-56',
      matricula: '9845920',
      nome: 'Alexandre Magno Constantino de Albuquerque e Silva Wanderley de Albuquerque',
      dataNascimento: '1976-12-05',
      rg: '1770823',
      ufRg: 'PB',
      orgaoEmissor: 'SSP',
      dataExpedicao: '1994-04-18',
      pisPasep: '133.44556.78-9',
      situacaoFuncional: '1 - Efetivo em exercício',
      regime: '2 - Celetista (CLT)',
      cargo: '20009 - PROFESSOR DE ENSINO MEDIO',
      cargoComissionado: '102 - Vice-Diretor Escolar',
      formaAdmissao: '101 - Concurso Público',
      instrucao: '11 - Doutorado',
      formacao: '105 - Licenciatura em Física',
      utb: '1005 - Escola Cidadã Integral Técnica Estadual e Intercultural de Ensino Médio e Educação Profissionalizante Prefeito Severino Cabral',
      dataInicioExercicio: '2010-03-01',
      dataAdmissao: '2010-02-15',
      dataFinalContrato: '2027-12-31',
      secretaria: '21 - Secretaria de Estado da Educação',
      emailInstitucional: 'alexandre.wanderley@see.pb.gov.br',
      nomeMae: 'Tereza Cristina Wanderley de Albuquerque',
      nomePai: 'Antônio Constantino de Albuquerque e Silva',
      sexo: 'Masculino',
      telefone: '(83) 98112-3344',
      emailPessoal: 'prof.alexandre.wanderley@yahoo.com.br',
      cep: '58400-000',
      estado: 'PB',
      municipio: 'Campina Grande',
      rua: 'Rua Floriano Peixoto',
      numero: '2100',
      bairro: 'Centenário',
      anexos: [
        { id: 'a8', nome: 'doutorado_tese_fisica.pdf', tamanho: '8.4 MB', dataEnvio: '14/02/2020', tipo: 'application/pdf' }
      ],
      ativo: true,
      emUsoOriginal: false,
      exibindoEmUsoIndicator: false,
      ultimaAtualizacao: 'Última atualização em 18/06/2024 às 17:40 pelo usuário Roberto.'
    }
  ]);

  getItem(id: string): ProfessorItem | undefined {
    return this.items().find(item => item.id === id);
  }

  add(data: Omit<ProfessorItem, 'id' | 'emUsoOriginal' | 'exibindoEmUsoIndicator'>): string {
    const newId = String(Math.max(...this.items().map(i => Number(i.id)), 0) + 1);
    
    // Auto-gera matrícula se não for Militar
    let matricula = data.matricula;
    if (data.tipo !== 'MILITAR' && (!matricula || matricula.trim() === '')) {
      matricula = `98${String(Math.floor(10000 + Math.random() * 90000))}`;
    }

    const { data: dataCriacao, hora: horaCriacao } = formatarDataHoraAtual();
    const textoAuditoria = `Última atualização em ${dataCriacao} às ${horaCriacao} pelo usuário Alessandra.`;

    const newItem: ProfessorItem = {
      ...data,
      id: newId,
      matricula,
      secretaria: getSecretariaPadrao(data.tipo),
      emUsoOriginal: false,
      exibindoEmUsoIndicator: false,
      ultimaAtualizacao: textoAuditoria,
      dataUltimaAtualizacao: dataCriacao,
      horaUltimaAtualizacao: horaCriacao,
      usuarioUltimaAtualizacao: 'Alessandra'
    };
    this.items.update(list => [...list, newItem]);
    return newId;
  }

  update(id: string, data: Partial<ProfessorItem>, usuario = 'Alessandra') {
    const { data: dataAtual, hora: horaAtual } = formatarDataHoraAtual();
    const textoAuditoria = `Última atualização em ${dataAtual} às ${horaAtual} pelo usuário ${usuario}.`;

    this.items.update(list => list.map(item => {
      if (item.id === id) {
        return {
          ...item,
          ...data,
          secretaria: data.tipo ? getSecretariaPadrao(data.tipo) : item.secretaria,
          ultimaAtualizacao: textoAuditoria,
          dataUltimaAtualizacao: dataAtual,
          horaUltimaAtualizacao: horaAtual,
          usuarioUltimaAtualizacao: usuario
        };
      }
      return item;
    }));
  }

  inativar(id: string, justificativa: string) {
    const { data: dataAtual, hora: horaAtual } = formatarDataHoraAtual();
    const textoAuditoria = `Última atualização em ${dataAtual} às ${horaAtual} pelo usuário Alessandra.`;

    this.items.update(list => list.map(item => {
      if (item.id === id) {
        return {
          ...item,
          ativo: false,
          justificativaInativacao: justificativa,
          usuarioInativacaoNome: 'Alessandra Albuquerque de Lima',
          usuarioInativacaoMatricula: '0194823',
          ultimaAtualizacao: textoAuditoria,
          dataUltimaAtualizacao: dataAtual,
          horaUltimaAtualizacao: horaAtual,
          usuarioUltimaAtualizacao: 'Alessandra'
        };
      }
      return item;
    }));
  }

  ativar(id: string) {
    const { data: dataAtual, hora: horaAtual } = formatarDataHoraAtual();
    const textoAuditoria = `Última atualização em ${dataAtual} às ${horaAtual} pelo usuário Alessandra.`;

    this.items.update(list => list.map(item => {
      if (item.id === id) {
        return {
          ...item,
          ativo: true,
          justificativaInativacao: undefined,
          ultimaAtualizacao: textoAuditoria,
          dataUltimaAtualizacao: dataAtual,
          horaUltimaAtualizacao: horaAtual,
          usuarioUltimaAtualizacao: 'Alessandra'
        };
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

// ==========================================
// MODAIS AUXILIARES ESPECÍFICOS DO CRUD
// ==========================================

export {RevalidarSenhaDialog, type RevalidarSenhaDialogData};

@Component({
  selector: 'app-justificativa-inativacao-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, SButtonComponent, SFieldComponent, SModalComponent, STextareaComponent, ReactiveFormsModule, CommonModule],
  template: `
    <s-modal title="Inativar registro?" width="500px" [showActions]="false" (cancel)="cancelar()">
      <form [formGroup]="form" (ngSubmit)="confirmar()" class="flex flex-col gap-4">
        <p class="text-xs sm:text-sm text-siage-text-secondary leading-relaxed">
          Tem certeza que deseja inativar o registro de <strong>{{ data.nome }}</strong>? Esta ação exigirá o preenchimento obrigatório da justificativa legal ou operacional.
        </p>

        <div class="flex flex-col gap-1.5">
          <s-field label="Justificativa da inativação" controlId="justificativa-input" required [error]="form.controls.justificativa.invalid && form.controls.justificativa.touched ? 'A justificativa é obrigatória (mínimo 10 caracteres).' : null">
            <s-textarea [maxlength]="500" formControlName="justificativa" placeholder="Descreva o motivo da inativação (ex.: término de contrato, remoção, aposentadoria ou retorno ao batalhão)..." />
          </s-field>
          <div class="flex justify-between items-center text-[11px] text-siage-text-secondary/70">
            <span></span>
            <span>{{ form.controls.justificativa.value.length }} de 500</span>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-3 border-t border-siage-border/40">
          <s-button variant="secondary" (click)="cancelar()">Cancelar</s-button>
          <s-button type="submit" variant="primary" [disabled]="form.invalid">Sim, inativar</s-button>
        </div>
      </form>
    </s-modal>
  `
})
export class JustificativaInativacaoDialog {
  readonly dialogRef = inject(MatDialogRef<JustificativaInativacaoDialog>);
  readonly data = inject<{ nome: string }>(MAT_DIALOG_DATA);
  readonly form = new FormGroup({
    justificativa: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10), Validators.maxLength(500)] })
  });

  cancelar() {
    this.dialogRef.close(false);
  }

  confirmar() {
    this.form.markAllAsTouched();
    if (this.form.valid) {
      this.dialogRef.close(this.form.controls.justificativa.value.trim());
    }
  }
}


export interface VisualizarJustificativaData {
  nome: string;
  justificativa?: string;
  responsavelNome?: string;
  responsavelMatricula?: string;
}

@Component({
  selector: 'app-visualizar-justificativa-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, SButtonComponent, SModalComponent, SModalFooterDirective, CommonModule],
  template: `
    <s-modal title="Justificativa da Inativação" icon="comment" width="500px" (cancel)="fechar()">
      <div class="flex flex-col gap-4">
        <!-- PROFESSOR(A) -->
        <div class="flex flex-col gap-1">
          <span class="text-xs font-semibold uppercase tracking-wider text-siage-text-secondary">Professor(a)</span>
          <span class="text-sm font-semibold text-siage-text-primary">{{ data.nome }}</span>
        </div>

        <!-- JUSTIFICATIVA REGISTRADA -->
        <div class="flex flex-col gap-1.5">
          <span class="text-xs font-semibold uppercase tracking-wider text-siage-text-secondary">Justificativa registrada</span>
          <div class="p-3.5 rounded-lg bg-siage-background border border-siage-border text-xs sm:text-sm text-siage-text-primary leading-relaxed whitespace-pre-wrap select-text">
            {{ data.justificativa || 'Nenhuma justificativa textual detalhada foi informada no momento da inativação.' }}
          </div>
        </div>

        <!-- RESPONSÁVEL PELA INATIVAÇÃO (discreto abaixo da justificativa) -->
        <div class="flex flex-col gap-0.5 pt-0.5 text-xs text-siage-text-secondary">
          <span class="text-[11px] font-medium uppercase tracking-wider text-siage-text-secondary/70">Responsável pela inativação</span>
          <span class="text-xs text-siage-text-secondary/90">
            {{ data.responsavelNome || 'Alessandra Albuquerque de Lima' }} — Matrícula: {{ data.responsavelMatricula || '0194823' }}
          </span>
        </div>
      </div>

      <div sModalFooter>
        <s-button variant="primary" (click)="fechar()">Fechar</s-button>
      </div>
    </s-modal>
  `
})
export class VisualizarJustificativaDialog {
  readonly dialogRef = inject(MatDialogRef<VisualizarJustificativaDialog>);
  readonly data = inject<VisualizarJustificativaData>(MAT_DIALOG_DATA);

  fechar() {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'app-visualizar-anexo-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTooltipModule,
    SButtonComponent,
    SIconButtonComponent,
    CommonModule, 
    NgxExtendedPdfViewerModule
  ],
  template: `
    <div class="w-full h-full bg-siage-surface text-siage-text-primary rounded-xl border border-siage-border shadow-[var(--mat-sys-level3)] font-sans flex flex-col text-left box-border overflow-hidden">
      
      <!-- CABEÇALHO DO MODAL (PADRÃO SIAGE-RH V2) -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-siage-border/40 shrink-0 bg-siage-surface">
        <div class="flex flex-col min-w-0 pr-4">
          <h2 class="text-base sm:text-lg font-poppins font-bold text-siage-text-primary leading-tight">
            Visualizar anexo
          </h2>
          <div class="flex items-center gap-2 text-xs text-siage-text-secondary mt-1 truncate">
            <span class="truncate font-medium text-siage-text-secondary" [title]="data.anexo.nome">
              {{ data.anexo.nome }}
            </span>
            @if (data.anexo.tamanho) {
              <span class="text-siage-border select-none">•</span>
              <span>{{ data.anexo.tamanho }}</span>
            }
            @if (data.anexo.dataEnvio) {
              <span class="text-siage-border select-none">•</span>
              <span>Enviado em {{ data.anexo.dataEnvio }}</span>
            }
          </div>
        </div>

        <!-- BOTÃO FECHAR (X) NO CABEÇALHO -->
        <s-icon-button icon="close" label="Fechar modal" variant="ghost" (click)="fechar()" />
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
              <s-button variant="secondary" (click)="tentarNovamente()">Tentar novamente</s-button>
              <s-button variant="primary" (click)="download()">Baixar arquivo</s-button>
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
                <s-icon-button icon="remove" label="Diminuir zoom" size="sm" variant="secondary" (click)="diminuirZoomImagem()" />
                <span class="w-12 text-center font-mono font-medium">{{ imageZoom() }}%</span>
                <s-icon-button icon="add" label="Aumentar zoom" size="sm" variant="secondary" (click)="aumentarZoomImagem()" />
                <s-button variant="secondary" (click)="resetarZoomImagem()">100%</s-button>
              </div>
            </div>

            <!-- Imagem com rolagem e zoom -->
            <div class="flex-1 overflow-auto p-4 flex items-center justify-center">
              <img 
                [src]="fileUrl()" 
                [alt]="data.anexo.nome"
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
        <s-button variant="secondary" icon="download" (click)="download()">Baixar arquivo</s-button>
        <s-button variant="primary" (click)="fechar()">Fechar</s-button>
      </div>
    </div>
  `
})
export class VisualizarAnexoDialog {
  readonly dialogRef = inject(MatDialogRef<VisualizarAnexoDialog>);
  readonly data = inject<{ anexo: AnexoItem }>(MAT_DIALOG_DATA);
  readonly toast = inject(ToastService);

  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly imageZoom = signal(100);

  readonly isPdf = computed(() => {
    const nome = (this.data?.anexo?.nome || '').toLowerCase();
    const tipo = (this.data?.anexo?.tipo || '').toLowerCase();
    return nome.endsWith('.pdf') || tipo.includes('pdf');
  });

  readonly fileUrl = computed(() => {
    const anexo = this.data?.anexo;
    if (anexo?.blobUrl) return anexo.blobUrl;
    if (anexo?.url) return anexo.url;
    if (this.isPdf()) {
      return '/exemplo-documento-comprovacao.pdf';
    }
    // Para imagens simuladas
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

  download() {
    const url = this.fileUrl();
    const filename = this.data?.anexo?.nome || (this.isPdf() ? 'documento-comprovacao.pdf' : 'anexo-documento.png');
    
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
// LISTAGEM UNIFICADA
// ==========================================

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-professores-emergencial-militares-base-tecnica-list',
  providers: [{provide: MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS, useValue: {disableToggleValue: true}}],
  imports: [
    SBadgeComponent,
    SButtonComponent,
    SEmptyStateComponent,
    SFieldComponent,
    SIconButtonComponent,
    SInputComponent,
    SPageHeaderComponent,
    SSelectComponent,
    STableCellDirective,
    STableComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
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
      <s-page-header
        [breadcrumbs]="breadcrumbs"
        title="Professores em contratação emergencial, Militares e Base Técnica"
        description="Cadastre e mantenha os professores vinculados a estas modalidades."
        showBack
        (back)="goBack()"
      >
        @if (permissionService.canCreate()) {
          <s-button action variant="primary" icon="add" (click)="onAdicionar()">Adicionar</s-button>
        }
      </s-page-header>

      <!-- CARD DE FILTROS (Organizado em duas linhas) -->
      <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs dark:shadow-none flex flex-col gap-4">
        
        <!-- Linha 1: CPF, Matrícula, Nome, Secretaria -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          
          <!-- Filtro CPF -->
          <s-field label="CPF" controlId="filter-cpf">
            <div class="flex items-center gap-1">
              <s-input class="flex-1 min-w-0" [maxlength]="14" [formControl]="cpfControl" placeholder="000.000.000-00" (input)="onCpfFilterInput($event)" (keydown.enter)="onBuscar()" />
              @if (cpfControl.value) {
                <s-icon-button icon="close" label="Limpar CPF" variant="ghost" (click)="cpfControl.setValue(''); updateBuscarStatus()" />
              }
            </div>
          </s-field>

          <!-- Filtro Matrícula -->
          <s-field label="Matrícula" controlId="filter-matricula">
            <div class="flex items-center gap-1">
              <s-input class="flex-1 min-w-0" [maxlength]="10" [formControl]="matriculaControl" placeholder="Buscar por matrícula" (keydown.enter)="onBuscar()" />
              @if (matriculaControl.value) {
                <s-icon-button icon="close" label="Limpar matrícula" variant="ghost" (click)="matriculaControl.setValue(''); updateBuscarStatus()" />
              }
            </div>
          </s-field>

          <!-- Filtro Nome -->
          <s-field label="Nome do(a) Servidor(a)" controlId="filter-nome">
            <div class="flex items-center gap-1">
              <s-input class="flex-1 min-w-0" [formControl]="nomeControl" placeholder="Buscar por nome" (keydown.enter)="onBuscar()" />
              @if (nomeControl.value) {
                <s-icon-button icon="close" label="Limpar nome" variant="ghost" (click)="nomeControl.setValue(''); updateBuscarStatus()" />
              }
            </div>
          </s-field>

          <!-- Filtro Secretaria -->
          <s-field label="Secretaria" controlId="filter-secretaria">
            <s-select [formControl]="secretariaControl" [options]="secretariaOptions" [clearable]="false" />
          </s-field>
        </div>

        <!-- Linha 2: Tipo de Professor, Unidade de Trabalho (UTB), Status -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
          
          <!-- Filtro Tipo de Professor -->
          <s-field label="Tipo de Professor" controlId="filter-tipo">
            <s-select [formControl]="tipoControl" [options]="tipoOptions" [clearable]="false" />
          </s-field>

          <!-- Filtro Unidade de Trabalho (UTB) -->
          <s-field label="Unidade de Trabalho (UTB)" controlId="filter-utb">
            <div class="flex items-center gap-1">
              <s-input class="flex-1 min-w-0" [formControl]="utbControl" placeholder="Buscar por código ou nome da UTB" (keydown.enter)="onBuscar()" />
              @if (utbControl.value) {
                <s-icon-button icon="close" label="Limpar unidade de trabalho" variant="ghost" (click)="utbControl.setValue(''); updateBuscarStatus()" />
              }
            </div>
          </s-field>

          <!-- Filtro Status -->
          <s-field label="Status" controlId="filter-status">
            <s-select [formControl]="statusControl" [options]="statusOptions" [clearable]="false" />
          </s-field>
        </div>

        <!-- Ações do Filtro: Limpar e Buscar -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-siage-border/40">
          <s-button variant="secondary" (click)="onLimpar()">Limpar</s-button>
          <s-button variant="primary" icon="search" [disabled]="!isBuscarEnabled()" (click)="onBuscar()">Buscar</s-button>
        </div>
      </div>

      <!-- CARD / TABELA DE REGISTROS -->
      <div class="bg-siage-surface border border-siage-border rounded-lg shadow-xs dark:shadow-none overflow-hidden">
        
        @if (isCarregando()) {
          <div class="p-4 sm:p-6 space-y-4">
            <div class="h-6 w-48 bg-slate-200 dark:bg-slate-700/50 rounded animate-pulse"></div>
            <div class="space-y-3">
              @for (i of [1, 2, 3, 4, 5]; track i) {
                <div class="h-10 w-full bg-slate-100 dark:bg-slate-800/40 rounded animate-pulse"></div>
              }
            </div>
          </div>
        } @else if (isErro()) {
          <s-empty-state
            variant="error"
            title="Erro ao carregar dados"
            description="Não foi possível carregar as informações. Verifique sua conexão e tente novamente."
            actionLabel="Tentar novamente"
            (action)="carregarDados()"
          />
        } @else if (isSemRegistros()) {
          <s-empty-state variant="no-data" title="Nenhum registro cadastrado" description="Ainda não existem professores cadastrados nestas modalidades." />
        } @else if (isSemResultadoFiltro()) {
          <s-empty-state variant="no-results" title="Nenhum resultado encontrado" description="Nenhum registro corresponde aos filtros aplicados." />
        } @else {
          <s-table label="Professores em contratação emergencial, Militares e Base Técnica" [columns]="tableColumns" [rows]="paginatedItems()" [sort]="tableSort()" (sortChange)="onTableSortChange($event)" frameless>
            <ng-template sTableCell="ativo" let-row>
              <s-badge [tone]="row['ativo'] ? 'success' : 'secondary'">{{ row['ativo'] ? 'Ativo' : 'Inativo' }}</s-badge>
            </ng-template>
            <ng-template sTableCell="exibindoEmUsoIndicator" let-row>
              @if (row['exibindoEmUsoIndicator']) {
                <s-icon-button icon="link" label="Ver vínculos de uso" variant="ghost" (click)="onVerDetalhesEmUso($any(row))" />
              } @else {
                <span>—</span>
              }
            </ng-template>
            <ng-template #customActions let-row>
              <s-icon-button icon="visibility" label="Visualizar professor" variant="ghost" (click)="onVisualizar(row)" />
              <s-icon-button icon="edit" label="Editar professor" variant="ghost" (click)="onEditar(row)" />
              <div class="w-10 h-10 inline-flex items-center justify-center">
                <mat-slide-toggle [checked]="row.ativo" (click)="$event.preventDefault(); onToggleStatus(row)" [matTooltip]="row.ativo ? 'Inativar' : 'Ativar'" aria-label="Ativar ou inativar professor" class="scale-90" />
              </div>
              @if (!row.ativo) {
                <s-icon-button icon="comment" label="Ver justificativa da inativação" variant="ghost" (click)="onVerJustificativa(row)" />
              }
              <s-icon-button icon="delete" label="Excluir professor" variant="destructive" text (click)="onExcluir(row)" />
            </ng-template>
          </s-table>

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
export class ProfessoresList {
  readonly breadcrumbs = [
    {label: 'Início', routerLink: '/inicio'},
    {label: 'Configurações', routerLink: '/configuracoes'},
    {label: 'SEAD', routerLink: '/configuracoes/sead'},
    {label: 'Professores em contratação emergencial, Militares e Base Técnica'}
  ];
  readonly secretariaOptions = [
    {label: 'Todas', value: 'TODAS'},
    {label: '21 - Secretaria de Estado da Educação', value: '21 - Secretaria de Estado da Educação'},
    {label: '25 - Secretaria de Segurança e Defesa Social', value: '25 - Secretaria de Segurança e Defesa Social'}
  ];
  readonly tipoOptions = [
    {label: 'Todos', value: 'TODOS'},
    {label: 'Professor Militar', value: 'MILITAR'},
    {label: 'Professor em contratação emergencial', value: 'EMERGENCIAL'},
    {label: 'Professor da Base Técnica', value: 'BASE_TECNICA'}
  ];
  readonly statusOptions = [
    {label: 'Todos', value: 'TODOS'},
    {label: 'Ativo', value: 'ATIVO'},
    {label: 'Inativo', value: 'INATIVO'}
  ];
  readonly tableColumns: readonly STableColumn<ProfessorItem>[] = [
    {key: 'nome', label: 'Servidor', sortable: true, secondary: item => `CPF: ${item.cpf}`},
    {key: 'matricula', label: 'Matrícula', sortable: true},
    {key: 'tipo', label: 'Tipo de Professor', sortable: true, value: item => getTipoProfessorDescricao(item.tipo)},
    {key: 'secretaria', label: 'Secretaria'},
    {key: 'utb', label: 'Unidade de Trabalho'},
    {key: 'ativo', label: 'Situação', align: 'center'},
    {key: 'exibindoEmUsoIndicator', label: 'Em uso', align: 'center'}
  ];
  readonly service = inject(ProfessoresService);
  readonly router = inject(Router);
  readonly dialog = inject(MatDialog);
  readonly toastService = inject(ToastService);
  readonly simulator = inject(SimulatorService);
  readonly permissionService = inject(PermissionService);

  readonly hasAccess = computed(() => this.permissionService.hasAccess());

  // Controles dos Filtros
  readonly cpfControl = new FormControl('');
  readonly matriculaControl = new FormControl('');
  readonly nomeControl = new FormControl('');
  readonly secretariaControl = new FormControl('TODAS');
  readonly tipoControl = new FormControl('TODOS');
  readonly utbControl = new FormControl('');
  readonly statusControl = new FormControl('TODOS');

  // Critérios aplicados
  readonly appliedCpf = signal('');
  readonly appliedMatricula = signal('');
  readonly appliedNome = signal('');
  readonly appliedSecretaria = signal('TODAS');
  readonly appliedTipo = signal('TODOS');
  readonly appliedUtb = signal('');
  readonly appliedStatus = signal('TODOS');

  readonly isBuscarEnabled = signal(false);

  readonly paginatorPageIndex = signal(0);
  readonly paginatorPageSize = signal(10);
  readonly sortState = signal<Sort>({ active: 'servidor', direction: 'asc' });
  readonly tableSort = computed<STableSort | null>(() => {
    const sort = this.sortState();
    return sort.direction ? {key: sort.active === 'servidor' ? 'nome' : sort.active, direction: sort.direction} : null;
  });


  readonly isLoading = signal(false);
  readonly hasError = signal(false);

  readonly hasFiltrosAplicados = computed(() => {
    return !!this.appliedCpf() || 
           !!this.appliedMatricula() || 
           !!this.appliedNome() || 
           this.appliedSecretaria() !== 'TODAS' ||
           this.appliedTipo() !== 'TODOS' ||
           !!this.appliedUtb() ||
           this.appliedStatus() !== 'TODOS';
  });

  readonly isCarregando = computed(() => this.simulator.currentScenario() === 'loading' || this.isLoading());
  readonly isErro = computed(() => this.simulator.currentScenario() === 'error' || this.hasError());
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

  constructor() {
    this.service.resetIndicators();
    this.cpfControl.valueChanges.subscribe(() => this.updateBuscarStatus());
    this.matriculaControl.valueChanges.subscribe(() => this.updateBuscarStatus());
    this.nomeControl.valueChanges.subscribe(() => this.updateBuscarStatus());
    this.secretariaControl.valueChanges.subscribe(() => this.updateBuscarStatus());
    this.tipoControl.valueChanges.subscribe(() => this.updateBuscarStatus());
    this.utbControl.valueChanges.subscribe(() => this.updateBuscarStatus());
    this.statusControl.valueChanges.subscribe(() => this.updateBuscarStatus());
  }

  getTipoDesc(tipo: TipoProfessor): string {
    return getTipoProfessorDescricao(tipo);
  }

  onCpfFilterInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = formatarCpf(input.value);
    this.cpfControl.setValue(input.value, { emitEvent: false });
    this.updateBuscarStatus();
  }

  updateBuscarStatus() {
    const hasValue = !!this.cpfControl.value?.trim() ||
                     !!this.matriculaControl.value?.trim() ||
                     !!this.nomeControl.value?.trim() ||
                     this.secretariaControl.value !== 'TODAS' ||
                     this.tipoControl.value !== 'TODOS' ||
                     !!this.utbControl.value?.trim() ||
                     this.statusControl.value !== 'TODOS';
    this.isBuscarEnabled.set(hasValue);
  }

  carregarDados() {
    this.simulator.reset();
    this.service.resetIndicators();
    this.isLoading.set(true);
    this.hasError.set(false);
    setTimeout(() => {
      this.isLoading.set(false);
    }, 400);
  }

  onBuscar() {
    this.appliedCpf.set(this.cpfControl.value?.trim() || '');
    this.appliedMatricula.set(this.matriculaControl.value?.trim() || '');
    this.appliedNome.set(this.nomeControl.value?.trim() || '');
    this.appliedSecretaria.set(this.secretariaControl.value || 'TODAS');
    this.appliedTipo.set(this.tipoControl.value || 'TODOS');
    this.appliedUtb.set(this.utbControl.value?.trim() || '');
    this.appliedStatus.set(this.statusControl.value || 'TODOS');
    this.paginatorPageIndex.set(0);
  }

  onLimpar() {
    this.cpfControl.setValue('');
    this.matriculaControl.setValue('');
    this.nomeControl.setValue('');
    this.secretariaControl.setValue('TODAS');
    this.tipoControl.setValue('TODOS');
    this.utbControl.setValue('');
    this.statusControl.setValue('TODOS');

    this.appliedCpf.set('');
    this.appliedMatricula.set('');
    this.appliedNome.set('');
    this.appliedSecretaria.set('TODAS');
    this.appliedTipo.set('TODOS');
    this.appliedUtb.set('');
    this.appliedStatus.set('TODOS');
    this.isBuscarEnabled.set(false);
    this.paginatorPageIndex.set(0);

    if (this.simulator.currentScenario() === 'no_filter_results') {
      this.simulator.reset();
    }
  }

  readonly filteredItems = computed(() => {
    const list = this.service.items();
    const cpf = this.appliedCpf().replace(/\D/g, '');
    const mat = this.appliedMatricula().toLowerCase();
    const nome = this.appliedNome().toLowerCase();
    const sec = this.appliedSecretaria();
    const tipo = this.appliedTipo();
    const utb = this.appliedUtb().toLowerCase();
    const status = this.appliedStatus();

    return list.filter(item => {
      if (cpf && !item.cpf.replace(/\D/g, '').includes(cpf)) return false;
      if (mat && !item.matricula.toLowerCase().includes(mat)) return false;
      if (nome && !item.nome.toLowerCase().includes(nome)) return false;
      if (sec !== 'TODAS' && item.secretaria !== sec) return false;
      if (tipo !== 'TODOS' && item.tipo !== tipo) return false;
      if (utb && !item.utb.toLowerCase().includes(utb)) return false;
      if (status === 'ATIVO' && !item.ativo) return false;
      if (status === 'INATIVO' && item.ativo) return false;
      return true;
    });
  });

  readonly sortedItems = computed(() => {
    const list = [...this.filteredItems()];
    const sort = this.sortState();
    if (!sort.direction) return list;

    return list.sort((a, b) => {
      let comparison = 0;
      if (sort.active === 'servidor' || sort.active === 'nome') {
        comparison = a.nome.localeCompare(b.nome, 'pt-BR');
      } else if (sort.active === 'matricula') {
        comparison = a.matricula.localeCompare(b.matricula);
      } else if (sort.active === 'tipo') {
        comparison = a.tipo.localeCompare(b.tipo);
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

  onTableSortChange(sort: STableSort | null) {
    this.onSortChange(sort ? {active: sort.key, direction: sort.direction} : {active: this.sortState().active, direction: ''});
  }

  onPageChange(event: PageEvent) {
    this.paginatorPageIndex.set(event.pageIndex);
    this.paginatorPageSize.set(event.pageSize);
  }

  goHome() { this.router.navigate(['/inicio']); }
  navConfig() { this.router.navigate(['/configuracoes']); }
  navSead() { this.router.navigate(['/configuracoes/sead']); }
  goBack() { this.router.navigate(['/configuracoes/sead']); }

  onAdicionar() {
    this.router.navigate(['/configuracoes/sead/professores-emergencial-militares-base-tecnica/novo']);
  }

  onVisualizar(row: ProfessorItem) {
    this.router.navigate([`/configuracoes/sead/professores-emergencial-militares-base-tecnica/${row.id}`]);
  }

  onEditar(row: ProfessorItem) {
    this.router.navigate(
      [`/configuracoes/sead/professores-emergencial-militares-base-tecnica/${row.id}/editar`],
      { queryParams: { from: 'list' }, state: { origin: 'list' } }
    );
  }

  onVerJustificativa(row: ProfessorItem) {
    this.dialog.open(VisualizarJustificativaDialog, {
      disableClose: true,
      data: {
        nome: row.nome,
        justificativa: row.justificativaInativacao,
        responsavelNome: row.usuarioInativacaoNome || 'Alessandra Albuquerque de Lima',
        responsavelMatricula: row.usuarioInativacaoMatricula || '0194823'
      }
    });
  }

  onToggleStatus(row: ProfessorItem) {
    const isAtivo = row.ativo;

    if (isAtivo) {
      // 1. Verificar se está em uso
      if (row.emUsoOriginal) {
        this.dialog.open(ResultadoDialog, {
          disableClose: true,
          data: {
            type: 'warning',
            title: 'Não é possível inativar o registro',
            message: 'O registro não pode ser inativado, pois possui vínculos ativos com turmas, diários ou folha de pagamento.',
            buttonLabel: 'Fechar'
          }
        });
        this.service.setIndicator(row.id, true);
        return;
      }

      // 2. Não está em uso: abrir modal solicitando justificativa obrigatória
      const dialogRef = this.dialog.open(JustificativaInativacaoDialog, {
        disableClose: true,
        data: { nome: row.nome }
      });

      dialogRef.afterClosed().subscribe((justificativa: string | false) => {
        if (justificativa) {
          this.service.inativar(row.id, justificativa);
          this.toastService.success('Registro inativado com sucesso.');
        }
      });
    } else {
      // Reativação
      const dialogRef = this.dialog.open(ConfirmacaoDialog, {
        disableClose: true,
        data: {
          title: 'Ativar registro?',
          message: `Tem certeza que deseja ativar o registro de ${row.nome}?`,
          cancelLabel: 'Cancelar',
          actionLabel: 'Sim, ativar',
          actionType: 'primary',
          loadingLabel: 'Ativando...'
        }
      });

      dialogRef.afterClosed().subscribe((confirmado: boolean) => {
        if (confirmado) {
          this.service.ativar(row.id);
          this.toastService.success('Registro ativado com sucesso.');
        }
      });
    }
  }

  onExcluir(row: ProfessorItem) {
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
          message: `Tem certeza que deseja excluir o registro de ${row.nome}? Esta ação não poderá ser desfeita.`,
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

  onVerDetalhesEmUso(row: ProfessorItem) {
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

// ==========================================
// FORMULÁRIO (ADICIONAR / EDITAR) & VISUALIZAR
// ==========================================

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-professores-emergencial-militares-base-tecnica-form',
  imports: [
    SBadgeComponent,
    SButtonComponent,
    SFieldComponent,
    SIconButtonComponent,
    SInputComponent,
    SRadioGroupComponent,
    SSelectComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatCardModule,
    MatSelectModule,
    AcessoRestritoComponent,
    CommonModule,
    SiageDatePickerComponent
  ],
  template: `
    @if (!hasAccess()) {
      <app-acesso-restrito backUrl="/inicio" />
    } @else {
      <div class="flex flex-col gap-4 font-sans max-w-6xl mx-auto w-full">
      
      <!-- Cabeçalho de Navegação e Título -->
      <div class="flex flex-col gap-2">
        <nav aria-label="Breadcrumb" class="flex items-center gap-2 text-xs font-sans font-medium tracking-wide text-siage-text-secondary/70 flex-wrap">
          <span (click)="navigateWithProtection('/inicio')" tabindex="0" role="button" class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline">Início</span>
          <span class="text-[10px] text-siage-text-secondary/40 select-none">/</span>
          <span (click)="navigateWithProtection('/configuracoes')" tabindex="0" role="button" class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline">Configurações</span>
          <span class="text-[10px] text-siage-text-secondary/40 select-none">/</span>
          <span (click)="navigateWithProtection('/configuracoes/sead')" tabindex="0" role="button" class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline">SEAD</span>
          <span class="text-[10px] text-siage-text-secondary/40 select-none">/</span>
          <span (click)="navigateWithProtection('/configuracoes/sead/professores-emergencial-militares-base-tecnica')" tabindex="0" role="button" class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline">Professores em contratação emergencial, Militares e Base Técnica</span>
          <span class="text-[10px] text-siage-text-secondary/40 select-none">/</span>
          @if (isEditMode() && editOrigin() === 'view' && itemId) {
            <span (click)="navigateWithProtection('/configuracoes/sead/professores-emergencial-militares-base-tecnica/' + itemId)" tabindex="0" role="button" class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline">Visualizar</span>
            <span class="text-[10px] text-siage-text-secondary/40 select-none">/</span>
          }
          <span class="text-siage-primary font-semibold" aria-current="page">{{ breadcrumbModeText() }}</span>
        </nav>

        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2 sm:gap-3">
              <button 
                mat-icon-button 
                (click)="goBack()" 
                class="text-siage-text-secondary hover:text-siage-primary transition-colors cursor-pointer -ml-2 shrink-0"
                [title]="isEditMode() && editOrigin() === 'view' ? 'Voltar para a Visualização' : 'Voltar para a Listagem'"
                [aria-label]="isEditMode() && editOrigin() === 'view' ? 'Voltar para a Visualização' : 'Voltar para a Listagem'"
              >
                <mat-icon style="font-size: 22px; width: 22px; height: 22px;">arrow_back</mat-icon>
              </button>
              <h1 class="text-2xl sm:text-3xl font-poppins font-bold tracking-tight text-siage-text-primary leading-tight">
                {{ titleText() }}
              </h1>
            </div>

            <p class="text-xs sm:text-sm text-siage-text-secondary font-sans leading-normal pl-8 sm:pl-9 max-w-3xl">
              {{ descriptionText() }}
            </p>
          </div>

          @if (isViewMode()) {
            <s-button variant="primary" icon="edit" (click)="onToggleEdit()">Editar</s-button>
          }
        </div>
      </div>

      <!-- MODO VISUALIZAR (Blocos informativos somente leitura) -->
      @if (isViewMode()) {
        <div class="flex flex-col gap-6">
          
          <!-- Card de Destaque Superior -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2.5">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-siage-primary/10 text-siage-primary border border-siage-primary/20">
                  {{ getTipoDesc(currentItem()?.tipo || 'MILITAR') }}
                </span>
                <s-badge [tone]="currentItem()?.ativo ? 'success' : 'secondary'">{{ currentItem()?.ativo ? 'Ativo' : 'Inativo' }}</s-badge>
              </div>
              <h2 class="text-xl sm:text-2xl font-poppins font-bold text-siage-text-primary mt-1 break-words">
                {{ currentItem()?.nome }}
              </h2>
            </div>
          </div>

          <!-- Card 1: Identificação -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">badge</mat-icon>
              <span>1. Identificação</span>
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="flex flex-col gap-1">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">CPF</span>
                <span class="text-sm font-mono font-medium text-siage-text-primary">{{ currentItem()?.cpf }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Matrícula</span>
                <span class="text-sm font-mono font-medium text-siage-text-primary">{{ currentItem()?.matricula || 'Não informado' }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data de Nascimento</span>
                <span class="text-sm font-medium text-siage-text-primary">{{ formatDataView(currentItem()?.dataNascimento) }}</span>
              </div>
              <div class="flex flex-col gap-1 md:col-span-3">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Nome do(a) Servidor(a)</span>
                <span class="text-sm font-medium text-siage-text-primary break-words">{{ currentItem()?.nome }}</span>
              </div>
            </div>
          </div>

          <!-- Card 2: Documentação -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">assignment</mat-icon>
              <span>2. Documentação</span>
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="flex flex-col gap-1">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">RG</span>
                <span class="text-sm font-medium text-siage-text-primary">{{ currentItem()?.rg || 'Não informado' }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">UF do RG</span>
                <span class="text-sm font-medium text-siage-text-primary">{{ currentItem()?.ufRg || 'Não informado' }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Órgão Emissor</span>
                <span class="text-sm font-medium text-siage-text-primary">{{ currentItem()?.orgaoEmissor || 'Não informado' }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data de Expedição</span>
                <span class="text-sm font-medium text-siage-text-primary">{{ formatDataView(currentItem()?.dataExpedicao) }}</span>
              </div>
              <div class="flex flex-col gap-1 md:col-span-2">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">PIS/PASEP</span>
                <span class="text-sm font-mono font-medium text-siage-text-primary">{{ currentItem()?.pisPasep || 'Não informado' }}</span>
              </div>
            </div>
          </div>

          <!-- Card 3: Dados Funcionais -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">work</mat-icon>
              <span>3. Dados Funcionais</span>
            </h3>

            <!-- Grade única de 12 colunas mantendo alinhamentos consistentes entre as linhas -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
              <!-- Linha 1: Situação Funcional (4), Regime (4) e Cargo (4) -->
              <div class="flex flex-col gap-1 md:col-span-4">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Situação Funcional</span>
                <span class="text-sm font-medium text-siage-text-primary break-words">{{ currentItem()?.situacaoFuncional || 'Não informado' }}</span>
              </div>
              <div class="flex flex-col gap-1 md:col-span-4">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Regime</span>
                <span class="text-sm font-medium text-siage-text-primary break-words">{{ currentItem()?.regime || 'Não informado' }}</span>
              </div>
              <div class="flex flex-col gap-1 md:col-span-4">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Cargo</span>
                <span class="text-sm font-medium text-siage-text-primary break-words">{{ currentItem()?.cargo || 'Não informado' }}</span>
              </div>

              <!-- Linha 2: Cargo Comissionado (4), Forma de Admissão (4) e Grau de Instrução (4) -->
              <div class="flex flex-col gap-1 md:col-span-4">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Cargo Comissionado</span>
                <span class="text-sm font-medium text-siage-text-primary break-words">{{ currentItem()?.cargoComissionado || 'Nenhum' }}</span>
              </div>
              <div class="flex flex-col gap-1 md:col-span-4">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Forma de Admissão</span>
                <span class="text-sm font-medium text-siage-text-primary break-words">{{ currentItem()?.formaAdmissao || 'Não informado' }}</span>
              </div>
              <div class="flex flex-col gap-1 md:col-span-4">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Grau de Instrução</span>
                <span class="text-sm font-medium text-siage-text-primary break-words">{{ currentItem()?.instrucao || 'Não informado' }}</span>
              </div>

              <!-- Linha 3: Área de Formação (4) e UTB (8) alinhada à 2ª coluna -->
              <div class="flex flex-col gap-1 md:col-span-4">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Área de Formação</span>
                <span class="text-sm font-medium text-siage-text-primary break-words">{{ currentItem()?.formacao || 'Não informado' }}</span>
              </div>
              <div class="flex flex-col gap-1 md:col-span-8">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Unidade de Trabalho (UTB)</span>
                <span class="text-sm font-medium text-siage-text-primary break-words leading-relaxed">{{ currentItem()?.utb || 'Não informado' }}</span>
              </div>

              <!-- Linha 4: Datas com início na 1ª coluna -->
              <div class="flex flex-col gap-1 md:col-span-4 md:col-start-1">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data Início Exercício</span>
                <span class="text-sm font-medium text-siage-text-primary">{{ formatDataView(currentItem()?.dataInicioExercicio) }}</span>
              </div>
              <div class="flex flex-col gap-1 md:col-span-4">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data de Admissão</span>
                <span class="text-sm font-medium text-siage-text-primary">{{ formatDataView(currentItem()?.dataAdmissao) }}</span>
              </div>
              @if (currentItem()?.tipo !== 'MILITAR') {
                <div class="flex flex-col gap-1 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data Final do Contrato</span>
                  <span class="text-sm font-medium text-siage-text-primary">{{ formatDataView(currentItem()?.dataFinalContrato) }}</span>
                </div>
              }

              <!-- Linha 5: Secretaria (4) e E-mail Institucional (8) mantendo o e-mail alinhado à 2ª coluna -->
              <div class="flex flex-col gap-1 md:col-span-4 md:col-start-1">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Secretaria</span>
                <span class="text-sm font-medium text-siage-text-primary break-words">{{ currentItem()?.secretaria || 'Não informado' }}</span>
              </div>
              <div class="flex flex-col gap-1 md:col-span-8">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">E-mail Institucional</span>
                <span class="text-sm font-medium text-siage-text-primary break-words">{{ currentItem()?.emailInstitucional || 'Não informado' }}</span>
              </div>
            </div>
          </div>

          <!-- Card 4: Dados Pessoais -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">person</mat-icon>
              <span>4. Dados Pessoais</span>
            </h3>

            <!-- Grade única de 12 colunas mantendo a mesma lógica de alinhamento -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
              @if (currentItem()?.tipo !== 'MILITAR') {
                <!-- Emergencial e Base Técnica:
                     Linha 1: Nome da Mãe (4), Nome do Pai (4), Sexo (4)
                     Linha 2: Telefone (4) e E-mail Pessoal (8) alinhado ao Nome do Pai -->
                <div class="flex flex-col gap-1 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Nome da Mãe</span>
                  <span class="text-sm font-medium text-siage-text-primary break-words">{{ currentItem()?.nomeMae || 'Não informado' }}</span>
                </div>
                <div class="flex flex-col gap-1 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Nome do Pai</span>
                  <span class="text-sm font-medium text-siage-text-primary break-words">{{ currentItem()?.nomePai || 'Não informado' }}</span>
                </div>
                <div class="flex flex-col gap-1 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Sexo</span>
                  <span class="text-sm font-medium text-siage-text-primary">{{ currentItem()?.sexo || 'Não informado' }}</span>
                </div>

                <div class="flex flex-col gap-1 md:col-span-4 md:col-start-1">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Telefone</span>
                  <span class="text-sm font-medium text-siage-text-primary">{{ currentItem()?.telefone || 'Não informado' }}</span>
                </div>
                <div class="flex flex-col gap-1 md:col-span-8">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">E-mail Pessoal</span>
                  <span class="text-sm font-medium text-siage-text-primary break-words">{{ currentItem()?.emailPessoal || 'Não informado' }}</span>
                </div>
              } @else {
                <!-- Professor Militar:
                     Linha única: Sexo (4), Telefone (4) e E-mail Pessoal (4) -->
                <div class="flex flex-col gap-1 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Sexo</span>
                  <span class="text-sm font-medium text-siage-text-primary">{{ currentItem()?.sexo || 'Não informado' }}</span>
                </div>
                <div class="flex flex-col gap-1 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Telefone</span>
                  <span class="text-sm font-medium text-siage-text-primary">{{ currentItem()?.telefone || 'Não informado' }}</span>
                </div>
                <div class="flex flex-col gap-1 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">E-mail Pessoal</span>
                  <span class="text-sm font-medium text-siage-text-primary break-words">{{ currentItem()?.emailPessoal || 'Não informado' }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Card 5: Endereço -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">home</mat-icon>
              <span>5. Endereço</span>
            </h3>

            <!-- Grade proporcional de 4 colunas distribuída em duas linhas -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <!-- Linha 1: CEP (25%), Estado (25%), Município (25%) e Bairro (25%) -->
              <div class="flex flex-col gap-1 col-span-1">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">CEP</span>
                <span class="text-sm font-mono font-medium text-siage-text-primary">{{ currentItem()?.cep || 'Não informado' }}</span>
              </div>
              <div class="flex flex-col gap-1 col-span-1">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Estado</span>
                <span class="text-sm font-medium text-siage-text-primary">{{ currentItem()?.estado || 'Não informado' }}</span>
              </div>
              <div class="flex flex-col gap-1 col-span-1">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Município</span>
                <span class="text-sm font-medium text-siage-text-primary break-words">{{ currentItem()?.municipio || 'Não informado' }}</span>
              </div>
              <div class="flex flex-col gap-1 col-span-1">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Bairro</span>
                <span class="text-sm font-medium text-siage-text-primary break-words">{{ currentItem()?.bairro || 'Não informado' }}</span>
              </div>

              <!-- Linha 2: Rua / Logradouro (50%), Número (25%) e Complemento (25%) -->
              <div class="flex flex-col gap-1 col-span-1 sm:col-span-2 md:col-span-2">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Rua / Logradouro</span>
                <span class="text-sm font-medium text-siage-text-primary break-words leading-relaxed">{{ currentItem()?.rua || 'Não informado' }}</span>
              </div>
              <div class="flex flex-col gap-1 col-span-1 sm:col-span-1 md:col-span-1">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Número</span>
                <span class="text-sm font-medium text-siage-text-primary">{{ currentItem()?.numero || 'S/N' }}</span>
              </div>
              <div class="flex flex-col gap-1 col-span-1 sm:col-span-1 md:col-span-1">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Complemento</span>
                <span class="text-sm font-medium text-siage-text-primary break-words">{{ currentItem()?.complemento || 'Não informado' }}</span>
              </div>
            </div>
          </div>

          <!-- Card 6: Anexos -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">attach_file</mat-icon>
              <span>6. Anexos</span>
            </h3>
            @if (currentItem()?.anexos && (currentItem()?.anexos)!.length > 0) {
              <div class="border border-siage-border rounded-lg divide-y divide-siage-border/50 overflow-hidden">
                @for (anexo of currentItem()?.anexos; track anexo.id) {
                  <div class="flex items-center justify-between p-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded bg-siage-primary/10 text-siage-primary flex items-center justify-center">
                        <mat-icon style="font-size: 18px; width: 18px; height: 18px;">description</mat-icon>
                      </div>
                      <div class="flex flex-col">
                        <span class="text-xs sm:text-sm font-medium text-siage-text-primary">{{ anexo.nome }}</span>
                        <span class="text-[11px] text-siage-text-secondary">{{ anexo.tamanho }} • Enviado em {{ anexo.dataEnvio }}</span>
                      </div>
                    </div>
                    <div class="flex items-center gap-1">
                      <s-icon-button icon="visibility" label="Visualizar anexo" variant="ghost" (click)="onVisualizarAnexo(anexo)" />
                      <s-icon-button icon="download" label="Baixar arquivo" variant="ghost" (click)="onDownloadAnexo(anexo)" />
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="py-6 text-center text-xs text-siage-text-secondary">Nenhum anexo foi incluído neste cadastro.</div>
            }
          </div>

          <!-- Auditoria -->
          <div class="p-4 border-t border-siage-border/40 text-xs text-siage-text-secondary">
            {{ textoAuditoria() }}
          </div>
        </div>
      }

      <!-- MODO ADICIONAR / EDITAR (Página vertical com seções sempre visíveis) -->
      @else {
        <form [formGroup]="form" (ngSubmit)="onPreSave()" class="flex flex-col gap-4" (keydown.enter)="$event.preventDefault()">
          
          <!-- SEÇÃO 1: TIPO DE PROFESSOR (Isolada no topo) -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-4 sm:p-5 shadow-xs flex flex-col gap-2.5">
            <div class="flex items-center justify-between border-b border-siage-border/40 pb-2">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">category</mat-icon>
                <span>Tipo de Professor</span>
                <span class="text-red-500 font-bold">*</span>
              </h3>
            </div>

            <div class="pt-1">
              @if (isEditMode()) {
                <div class="h-[46px] px-4 flex items-center bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-lg text-sm text-siage-text-secondary cursor-not-allowed select-none max-w-md">
                  <span class="font-normal text-siage-text-secondary">{{ getTipoDesc(tipoSelecionado()) }}</span>
                </div>
              } @else {
                <s-radio-group label="Tipo de Professor" formControlName="tipo" [options]="tipoProfessorOptions" (selectionChange)="$event && onRadioTipoChange($event)" />
              }
            </div>
          </div>

          <!-- SEÇÃO 2: IDENTIFICAÇÃO -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-4 sm:p-5 shadow-xs flex flex-col gap-3.5">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">badge</mat-icon>
              <span>1. Identificação</span>
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-4 gap-y-3 items-start">
              <!-- CPF -->
              <div class="col-span-1 sm:col-span-1 lg:col-span-4 form-field-group">
                @if (isEditMode()) {
                  <label for="form-cpf" class="siage-field-label">
                    <span>CPF</span>
                    <span class="text-red-500 font-bold">*</span>
                  </label>
                  <div class="h-[56px] px-4 flex items-center bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-lg text-sm text-siage-text-secondary font-mono cursor-not-allowed select-none">
                    <span class="font-normal text-siage-text-secondary">{{ form.controls.cpf.value }}</span>
                  </div>
                  <div class="min-h-[1.35rem] mt-[0.15rem]" aria-hidden="true"></div>
                } @else {
                  <s-field label="CPF" controlId="form-cpf" required [error]="form.controls.cpf.touched ? (form.controls.cpf.hasError('required') ? 'CPF é obrigatório.' : form.controls.cpf.hasError('cpfInvalido') ? 'Informe um CPF válido (11 dígitos).' : form.controls.cpf.hasError('duplicado') ? 'Já existe um professor cadastrado com este CPF.' : null) : null">
                    <s-input [maxlength]="14" formControlName="cpf" placeholder="000.000.000-00" (input)="onCpfInput($event)" />
                  </s-field>
                }
              </div>

              <!-- Matrícula -->
              <div class="col-span-1 sm:col-span-1 lg:col-span-4 form-field-group">
                @if (isEditMode()) {
                  <label for="form-matricula" class="siage-field-label">Matrícula</label>
                  <div class="h-[56px] px-4 flex items-center bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-lg text-sm text-siage-text-secondary font-mono cursor-not-allowed select-none">
                    <span class="font-normal text-siage-text-secondary">{{ form.controls.matricula.value || 'Não informada' }}</span>
                  </div>
                  <div class="min-h-[1.35rem] mt-[0.15rem]" aria-hidden="true"></div>
                } @else if (isTipoMilitar()) {
                  <s-field label="Matrícula" controlId="form-matricula" required [error]="form.controls.matricula.touched ? (form.controls.matricula.hasError('required') ? 'Matrícula é obrigatória para Professor Militar.' : form.controls.matricula.hasError('duplicado') ? 'Já existe um registro cadastrado para a matrícula informada.' : null) : null">
                    <s-input [maxlength]="7" formControlName="matricula" placeholder="Digite a matrícula" (input)="onMatriculaInput($event)" />
                  </s-field>
                } @else {
                  <label class="siage-field-label">Matrícula</label>
                  <div class="h-[56px] px-4 flex items-center bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-lg text-sm text-siage-text-secondary cursor-not-allowed select-none">
                    <span class="text-sm text-siage-text-secondary font-normal">Gerada automaticamente após a inclusão</span>
                  </div>
                  <div class="min-h-[1.35rem] mt-[0.15rem]" aria-hidden="true"></div>
                }
              </div>

              <!-- Data de Nascimento -->
              <div class="col-span-1 sm:col-span-2 lg:col-span-4 form-field-group">
                <app-siage-date-picker
                  id="form-data-nascimento"
                  label="Data de Nascimento"
                  [required]="true"
                  formControlName="dataNascimento"
                  [control]="form.controls.dataNascimento"
                  errorMessage="Data de nascimento é obrigatória."
                />
              </div>

              <!-- Nome do(a) Servidor(a) -->
              <div class="col-span-1 sm:col-span-2 lg:col-span-12 form-field-group">
                <s-field label="Nome do(a) Servidor(a)" controlId="form-nome" required [error]="form.controls.nome.touched && form.controls.nome.hasError('required') ? 'Nome do(a) servidor(a) é obrigatório.' : null">
                  <s-input [maxlength]="200" formControlName="nome" placeholder="Digite o nome completo do servidor" (focusout)="onNomeBlur()" />
                </s-field>
                <div class="text-right text-xs text-siage-text-secondary/70">{{ (form.get('nome')?.value || '').length }} de 200</div>
              </div>
            </div>
          </div>

          <!-- SEÇÃO 3: DOCUMENTAÇÃO -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-4 sm:p-5 shadow-xs flex flex-col gap-3.5">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">assignment</mat-icon>
              <span>2. Documentação</span>
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-4 gap-y-3 items-start">
              <!-- RG -->
              <div class="col-span-1 sm:col-span-1 lg:col-span-3 form-field-group">
                <s-field label="RG" controlId="form-rg" required [error]="form.controls.rg.touched ? (form.controls.rg.hasError('required') ? 'RG é obrigatório.' : (form.controls.rg.hasError('minlength') || form.controls.rg.hasError('maxlength')) ? 'RG deve conter entre 7 e 15 dígitos.' : null) : null">
                  <s-input [maxlength]="15" formControlName="rg" placeholder="Digite o RG" (input)="onRgInput($event)" />
                </s-field>
              </div>

              <!-- Órgão Emissor -->
              <div class="col-span-1 sm:col-span-1 lg:col-span-2 form-field-group">
                <s-field label="Órgão Emissor" controlId="form-emissor" required [error]="form.controls.orgaoEmissor.touched ? (form.controls.orgaoEmissor.hasError('required') ? 'Órgão emissor é obrigatório.' : form.controls.orgaoEmissor.hasError('minlength') ? 'O campo deve ter no mínimo 2 caracteres.' : null) : null">
                  <s-input [maxlength]="5" formControlName="orgaoEmissor" placeholder="Ex.: SSP" (input)="onOrgaoEmissorInput($event)" />
                </s-field>
              </div>

              <!-- UF do RG -->
              <div class="col-span-1 sm:col-span-1 lg:col-span-2 form-field-group">
                <s-field label="UF" controlId="form-ufrg" required [error]="form.controls.ufRg.touched && form.controls.ufRg.hasError('required') ? 'UF é obrigatória.' : null">
                  <s-select formControlName="ufRg" [options]="ufOptions" [clearable]="false" placeholder="Selecione" />
                </s-field>
              </div>

              <!-- Data de Expedição -->
              <div class="col-span-1 sm:col-span-1 lg:col-span-2 form-field-group">
                <app-siage-date-picker
                  id="form-expedicao"
                  label="Data de Expedição"
                  [required]="true"
                  formControlName="dataExpedicao"
                  [control]="form.controls.dataExpedicao"
                  errorMessage="Data de expedição é obrigatória."
                />
              </div>

              <!-- PIS/PASEP -->
              <div class="col-span-1 sm:col-span-2 lg:col-span-3 form-field-group">
                <s-field label="PIS/PASEP" controlId="form-pispasep" required [error]="form.controls.pisPasep.touched ? (form.controls.pisPasep.hasError('required') ? 'PIS/PASEP é obrigatório.' : form.controls.pisPasep.hasError('pisInvalido') ? 'PIS/PASEP deve conter 11 dígitos.' : null) : null">
                  <s-input [maxlength]="14" formControlName="pisPasep" placeholder="000.00000.00-0" (input)="onPisInput($event)" />
                </s-field>
              </div>
            </div>
          </div>

          <!-- SEÇÃO 4: DADOS FUNCIONAIS -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-4 sm:p-5 shadow-xs flex flex-col gap-3.5">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">work</mat-icon>
              <span>3. Dados Funcionais</span>
            </h3>

            <!-- Linha 1: Situação Funcional, Regime, Cargo, Cargo Comissionado (4 colunas) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3 items-start">
              <!-- Situação Funcional -->
              <div class="form-field-group">
                <s-field label="Situação Funcional" controlId="form-situacao-funcional" required [error]="form.controls.situacaoFuncional.touched && form.controls.situacaoFuncional.hasError('required') ? 'Situação funcional é obrigatória.' : null">
                  <s-select formControlName="situacaoFuncional" [options]="situacaoFuncionalOptions()" [clearable]="false" placeholder="Selecione" />
                </s-field>
              </div>

              <!-- Regime -->
              <div class="form-field-group">
                <s-field label="Regime" controlId="form-regime" required [error]="form.controls.regime.touched && form.controls.regime.hasError('required') ? 'Regime é obrigatório.' : null">
                  <s-select formControlName="regime" [options]="regimeOptions()" [clearable]="false" placeholder="Selecione" />
                </s-field>
              </div>

              <!-- Cargo -->
              <div class="form-field-group">
                <s-field label="Cargo" controlId="form-cargo" required [error]="form.controls.cargo.touched && form.controls.cargo.hasError('required') ? 'Cargo é obrigatório.' : null">
                  <s-select formControlName="cargo" [options]="cargoOptions()" [clearable]="false" placeholder="Selecione" />
                </s-field>
              </div>

              <!-- Cargo Comissionado -->
              <div class="form-field-group">
                <s-field label="Cargo Comissionado" controlId="form-cargocomiss" required [error]="form.controls.cargoComissionado.touched && form.controls.cargoComissionado.hasError('required') ? 'Cargo comissionado é obrigatório.' : null">
                  <s-select formControlName="cargoComissionado" [options]="cargoComissionadoOptions()" [clearable]="false" placeholder="Selecione" />
                </s-field>
              </div>
            </div>

            <!-- Linha 2: Forma de Admissão, Grau de Instrução, Área de Formação, UTB (4 colunas) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3 items-start">
              <!-- Forma de Admissão -->
              <div class="form-field-group">
                <s-field label="Forma de Admissão" controlId="form-admissao" required [error]="form.controls.formaAdmissao.touched && form.controls.formaAdmissao.hasError('required') ? 'Forma de admissão é obrigatória.' : null">
                  <s-select formControlName="formaAdmissao" [options]="formaAdmissaoOptions()" [clearable]="false" placeholder="Selecione" />
                </s-field>
              </div>

              <!-- Grau de Instrução -->
              <div class="form-field-group">
                <s-field label="Grau de Instrução" controlId="form-instrucao" required [error]="form.controls.instrucao.touched && form.controls.instrucao.hasError('required') ? 'Instrução é obrigatória.' : null">
                  <s-select formControlName="instrucao" [options]="grauInstrucaoOptions()" [clearable]="false" placeholder="Selecione" />
                </s-field>
              </div>

              <!-- Área de Formação -->
              <div class="form-field-group">
                <s-field label="Área de Formação" controlId="form-formacao" required [error]="form.controls.formacao.touched && form.controls.formacao.hasError('required') ? 'Formação acadêmica é obrigatória.' : null">
                  <s-select formControlName="formacao" [options]="areaFormacaoOptions" [clearable]="false" placeholder="Selecione" />
                </s-field>
              </div>

              <!-- Unidade de Trabalho (UTB) -->
              <div class="form-field-group">
                <s-field label="Unidade de Trabalho (UTB)" controlId="form-utb" required [error]="form.controls.utb.touched && form.controls.utb.hasError('required') ? 'Unidade de trabalho é obrigatória.' : null">
                  <s-select formControlName="utb" [options]="utbOptions" [clearable]="false" filterable filterPlaceholder="Pesquisar unidade de trabalho..." placeholder="Selecione" />
                </s-field>
              </div>
            </div>

            <!-- Linha 3: Datas, Secretaria e E-mail Institucional -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-4 gap-y-3 items-start">
              @if (isTipoMilitar()) {
                <!-- Professor Militar (sem Data Final de Contrato): 4 colunas proporcionais -->
                <div class="col-span-1 sm:col-span-1 lg:col-span-3 form-field-group">
                  <app-siage-date-picker
                    id="form-inicio"
                    label="Data de Início de Exercício"
                    [required]="true"
                    formControlName="dataInicioExercicio"
                    [control]="form.controls.dataInicioExercicio"
                    errorMessage="Data de início de exercício é obrigatória."
                  />
                </div>

                <div class="col-span-1 sm:col-span-1 lg:col-span-3 form-field-group">
                  <app-siage-date-picker
                    id="form-admissao-data"
                    label="Data de Admissão"
                    [required]="true"
                    formControlName="dataAdmissao"
                    [control]="form.controls.dataAdmissao"
                    errorMessage="Data de admissão é obrigatória."
                  />
                </div>

                <!-- Secretaria -->
                <div class="col-span-1 sm:col-span-1 lg:col-span-3 form-field-group">
                  <label for="form-secretaria" class="siage-field-label">
                    <span>Secretaria</span>
                  </label>
                  <div class="h-[56px] px-3.5 flex items-center bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-lg text-sm text-siage-text-secondary cursor-not-allowed select-none">
                    <span class="truncate font-normal text-siage-text-secondary text-xs sm:text-sm">{{ secretariaTexto() }}</span>
                  </div>
                  <div class="min-h-[1.35rem] mt-[0.15rem]" aria-hidden="true"></div>
                </div>

                <!-- E-mail Institucional -->
                <div class="col-span-1 sm:col-span-1 lg:col-span-3 form-field-group">
                  <s-field label="E-mail Institucional" controlId="form-email-inst" [error]="form.controls.emailInstitucional.touched && form.controls.emailInstitucional.hasError('emailInvalido') ? 'E-mail não atende aos critérios mínimos exigidos.' : null">
                    <s-input type="email" [maxlength]="200" formControlName="emailInstitucional" placeholder="servidor@see.pb.gov.br" (focusout)="onEmailBlur('emailInstitucional')" />
                  </s-field>
                </div>
              } @else {
                <!-- Professor Emergencial e Base Técnica (com Data Final de Contrato): 5 colunas distribuídas -->
                <div class="col-span-1 sm:col-span-1 lg:col-span-2 form-field-group">
                  <app-siage-date-picker
                    id="form-inicio"
                    label="Data de Início de Exercício"
                    [required]="true"
                    formControlName="dataInicioExercicio"
                    [control]="form.controls.dataInicioExercicio"
                    errorMessage="Data de início de exercício é obrigatória."
                  />
                </div>

                <div class="col-span-1 sm:col-span-1 lg:col-span-2 form-field-group">
                  <app-siage-date-picker
                    id="form-admissao-data"
                    label="Data de Admissão"
                    [required]="true"
                    formControlName="dataAdmissao"
                    [control]="form.controls.dataAdmissao"
                    errorMessage="Data de admissão é obrigatória."
                  />
                </div>

                <div class="col-span-1 sm:col-span-1 lg:col-span-2 form-field-group">
                  <app-siage-date-picker
                    id="form-data-final"
                    label="Data Final do Contrato"
                    [required]="false"
                    formControlName="dataFinalContrato"
                    [control]="form.controls.dataFinalContrato"
                  />
                </div>

                <!-- Secretaria -->
                <div class="col-span-1 sm:col-span-1 lg:col-span-3 form-field-group">
                  <label for="form-secretaria" class="siage-field-label">
                    <span>Secretaria</span>
                  </label>
                  <div class="h-[56px] px-3.5 flex items-center bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-lg text-sm text-siage-text-secondary cursor-not-allowed select-none">
                    <span class="truncate font-normal text-siage-text-secondary text-xs sm:text-sm">{{ secretariaTexto() }}</span>
                  </div>
                  <div class="min-h-[1.35rem] mt-[0.15rem]" aria-hidden="true"></div>
                </div>

                <!-- E-mail Institucional -->
                <div class="col-span-1 sm:col-span-2 lg:col-span-3 form-field-group">
                  <s-field label="E-mail Institucional" controlId="form-email-inst" [error]="form.controls.emailInstitucional.touched && form.controls.emailInstitucional.hasError('emailInvalido') ? 'E-mail não atende aos critérios mínimos exigidos.' : null">
                    <s-input type="email" [maxlength]="200" formControlName="emailInstitucional" placeholder="servidor@see.pb.gov.br" (focusout)="onEmailBlur('emailInstitucional')" />
                  </s-field>
                </div>
              }
            </div>
          </div>

          <!-- SEÇÃO 5: DADOS PESSOAIS -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-4 sm:p-5 shadow-xs flex flex-col gap-3.5">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">person</mat-icon>
              <span>4. Dados Pessoais</span>
            </h3>

            <!-- Primeira linha: Sexo, Telefone e E-mail pessoal com distribuição equilibrada -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3 items-start">
              <!-- Sexo -->
              <div class="form-field-group">
                <s-field label="Sexo" controlId="form-sexo" required [error]="form.controls.sexo.touched && form.controls.sexo.hasError('required') ? 'Sexo é obrigatório.' : null">
                  <s-select formControlName="sexo" [options]="sexoOptions" [clearable]="false" placeholder="Selecione" />
                </s-field>
              </div>

              <!-- Telefone -->
              <div class="form-field-group">
                <s-field label="Telefone" controlId="form-telefone" required [error]="form.controls.telefone.touched ? (form.controls.telefone.hasError('required') ? 'Telefone é obrigatório.' : form.controls.telefone.hasError('telefoneInvalido') ? 'Telefone deve conter 10 ou 11 dígitos.' : null) : null">
                  <s-input [maxlength]="15" formControlName="telefone" placeholder="(83) 90000-0000" (input)="onTelefoneInput($event)" />
                </s-field>
              </div>

              <!-- E-mail Pessoal -->
              <div class="form-field-group">
                <s-field label="E-mail Pessoal" controlId="form-email-pessoal" required [error]="form.controls.emailPessoal.touched ? (form.controls.emailPessoal.hasError('required') ? 'E-mail pessoal é obrigatório.' : form.controls.emailPessoal.hasError('emailInvalido') ? 'E-mail não atende aos critérios mínimos exigidos.' : null) : null">
                  <s-input type="email" [maxlength]="200" formControlName="emailPessoal" placeholder="exemplo@gmail.com" (focusout)="onEmailBlur('emailPessoal')" />
                </s-field>
              </div>
            </div>

            <!-- Abaixo: Filiação - Nome da Mãe e Nome do Pai lado a lado (Condicional: Não exibir para Militar) -->
            @if (!isTipoMilitar()) {
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 items-start">
                <!-- Nome da Mãe -->
                <div class="form-field-group">
                  <s-field label="Nome da Mãe" controlId="form-nome-mae">
                    <s-input [maxlength]="200" formControlName="nomeMae" placeholder="Nome completo da mãe" />
                  </s-field>
                </div>

                <!-- Nome do Pai -->
                <div class="form-field-group">
                  <s-field label="Nome do Pai" controlId="form-nome-pai">
                    <s-input [maxlength]="200" formControlName="nomePai" placeholder="Nome completo do pai" />
                  </s-field>
                </div>
              </div>
            }
          </div>

          <!-- SEÇÃO 6: ENDEREÇO -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-4 sm:p-5 shadow-xs flex flex-col gap-3.5">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">home</mat-icon>
              <span>5. Endereço</span>
            </h3>

            <!-- Linha 1: CEP, Estado, Município, Bairro (4 colunas) -->
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-x-4 gap-y-3 items-start">
              <div class="col-span-1 sm:col-span-3 form-field-group">
                <s-field label="CEP" controlId="form-cep" required [error]="form.controls.cep.touched ? (form.controls.cep.hasError('required') ? 'CEP é obrigatório.' : form.controls.cep.hasError('cepIncompleto') ? 'CEP deve conter 8 dígitos.' : null) : null">
                  <s-input [maxlength]="9" formControlName="cep" placeholder="00000-000" (input)="onCepInput($event)" (focusout)="onCepBlur()" />
                </s-field>
                @if (cepNaoLocalizado() && !form.get('cep')?.hasError('required') && !form.get('cep')?.hasError('cepIncompleto')) {
                  <span class="text-xs text-red-500 font-medium leading-tight mt-1 block">
                    CEP não localizado. Preencha os dados do endereço manualmente.
                  </span>
                }
              </div>

              <div class="col-span-1 sm:col-span-2 form-field-group">
                <label for="form-uf" class="siage-field-label">
                  <span>Estado</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <mat-select formControlName="estado" (selectionChange)="onEstadoChange($event.value)" id="form-uf" class="text-sm" placeholder="Selecione">
                    @for (uf of listaUfs; track uf.sigla) {
                      <mat-option [value]="uf.sigla">{{ uf.nome }}</mat-option>
                    }
                  </mat-select>
                  @if (form.get('estado')?.hasError('required') && form.get('estado')?.touched) {
                    <mat-error>Estado é obrigatório.</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="col-span-1 sm:col-span-3 form-field-group">
                <s-field label="Município" controlId="form-municipio" required [error]="form.controls.municipio.touched && form.controls.municipio.hasError('required') ? 'Município é obrigatório.' : null">
                  <s-select formControlName="municipio" [options]="municipioOptions()" [clearable]="false" placeholder="Selecione" />
                </s-field>
              </div>

              <div class="col-span-1 sm:col-span-4 form-field-group">
                <s-field label="Bairro" controlId="form-bairro" required [error]="form.controls.bairro.touched && form.controls.bairro.hasError('required') ? 'Bairro é obrigatório.' : null">
                  <s-input formControlName="bairro" placeholder="Nome do bairro" />
                </s-field>
              </div>
            </div>

            <!-- Linha 2: Rua / Logradouro (6 cols / 50%), Número (2 cols), Complemento (4 cols) -->
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-x-4 gap-y-3 items-start">
              <div class="col-span-1 sm:col-span-6 form-field-group">
                <s-field label="Rua / Logradouro" controlId="form-rua" required [error]="form.controls.rua.touched && form.controls.rua.hasError('required') ? 'Rua é obrigatória.' : null">
                  <s-input formControlName="rua" placeholder="Avenida, Rua, Travessa..." />
                </s-field>
              </div>

              <div class="col-span-1 sm:col-span-2 form-field-group">
                <s-field label="Número" controlId="form-numero" required [error]="form.controls.numero.touched && form.controls.numero.hasError('required') ? 'Número é obrigatório.' : null">
                  <s-input [maxlength]="5" formControlName="numero" placeholder="Digite o número" (input)="onNumeroInput($event)" />
                </s-field>
              </div>

              <div class="col-span-1 sm:col-span-4 form-field-group">
                <s-field label="Complemento" controlId="form-complemento" required [error]="form.controls.complemento.touched && form.controls.complemento.hasError('required') ? 'Complemento é obrigatório.' : null">
                  <s-input [maxlength]="200" formControlName="complemento" placeholder="Apartamento, bloco, ponto de referência..." />
                </s-field>
              </div>
            </div>
          </div>

          <!-- SEÇÃO 7: ANEXOS -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-4 sm:p-5 shadow-xs flex flex-col gap-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-siage-border/40 pb-2">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">attach_file</mat-icon>
                <span>6. Anexos</span>
              </h3>

              <div class="flex items-center gap-3">
                <span class="text-xs font-medium text-siage-text-secondary">
                  {{ anexosList().length }} de 5 anexos adicionados
                </span>
                <input #fileInput type="file" multiple (change)="onFileSelected($event)" accept=".pdf,.jpg,.jpeg,.png" class="hidden" />
                <s-button variant="secondary" icon="add" [disabled]="anexosList().length >= 5" (click)="fileInput.click()">Adicionar anexo</s-button>
              </div>
            </div>

            <p class="text-xs text-siage-text-secondary">
              Formatos permitidos: <strong>PDF, JPG, JPEG, PNG</strong>. Limite de até <strong>5 arquivos</strong> de no máximo <strong>10 MB</strong> cada.
            </p>

            @if (anexosList().length > 0) {
              <div class="border border-siage-border rounded-lg divide-y divide-siage-border/50 overflow-hidden">
                @for (anexo of anexosList(); track anexo.id) {
                  <div class="flex items-center justify-between p-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded bg-siage-primary/10 text-siage-primary flex items-center justify-center">
                        <mat-icon style="font-size: 18px; width: 18px; height: 18px;">description</mat-icon>
                      </div>
                      <div class="flex flex-col">
                        <div class="flex items-center gap-2">
                          <span class="text-xs sm:text-sm font-medium text-siage-text-primary">{{ anexo.nome }}</span>
                          @if (anexo.isNovo) {
                            <span class="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded font-medium border border-emerald-500/20">Novo</span>
                          }
                        </div>
                        <span class="text-[11px] text-siage-text-secondary">{{ anexo.tamanho }} • Enviado em {{ anexo.dataEnvio }}</span>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-1">
                      <s-icon-button icon="visibility" label="Visualizar anexo" variant="ghost" (click)="onVisualizarAnexo(anexo)" />
                      <s-icon-button icon="download" label="Baixar arquivo" variant="ghost" (click)="onDownloadAnexo(anexo)" />
                      
                      <!-- Exclusão: Permitida no cadastro para todos; na edição somente para anexos novos adicionados agora -->
                      @if (!isEditMode() || anexo.isNovo) {
                        <s-icon-button icon="delete" label="Remover anexo" variant="destructive" text (click)="removerAnexo(anexo.id)" />
                      }
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="py-4 border-2 border-dashed border-siage-border/80 rounded-lg text-center text-xs text-siage-text-secondary">
                Nenhum arquivo anexado até o momento. Clique em "Adicionar anexo" para fazer upload de comprovantes ou termos.
              </div>
            }
          </div>

          <!-- RODAPÉ DE AÇÕES COM CONFIRMAÇÃO E CANCELAMENTO -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <span class="text-xs text-siage-text-secondary">
              @if (isEditMode()) {
                {{ textoAuditoria() }}
              }
            </span>

            <div class="flex items-center justify-end gap-3 w-full sm:w-auto">
              <s-button variant="secondary" [disabled]="isSaving()" (click)="onCancelar()">Cancelar</s-button>
              <s-button type="submit" variant="primary" icon="save" [disabled]="isSaving()">
                {{ isSaving() ? (isEditMode() ? 'Atualizando...' : 'Salvando...') : (isEditMode() ? 'Atualizar' : 'Salvar') }}
              </s-button>
            </div>
          </div>
        </form>
      }
    </div>
    }
  `
})
export class ProfessoresForm {
  readonly service = inject(ProfessoresService);
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly dialog = inject(MatDialog);
  readonly toastService = inject(ToastService);
  readonly modalService = inject(ModalService);
  readonly permissionService = inject(PermissionService);
  readonly simulator = inject(SimulatorService);
  readonly cdr = inject(ChangeDetectorRef);

  // Injeção de serviços para selects dinâmicos e classificação funcional
  readonly situacaoFuncionalService = inject(SituacaoFuncionalService);
  readonly regimeService = inject(RegimeContratacaoService);
  readonly cargoService = inject(CargoService);
  readonly cargoComissionadoService = inject(CargoComissionadoService);
  readonly formaAdmissaoService = inject(FormaAdmissaoService);
  readonly classificacaoService = inject(ClassificacaoFuncionalService);
  readonly grauInstrucaoService = inject(GrauInstrucaoService);

  readonly hasAccess = computed(() => this.permissionService.hasAccess());

  readonly classificacaoIncompativelForcada = signal(false);
  readonly classificacaoFuncionalIncompativel = computed(() => {
    return this.classificacaoIncompativelForcada() || this.simulator.simularClassificacaoIncompativel();
  });
  readonly cepNaoLocalizado = signal(false);

  readonly isSaving = signal(false);

  itemId: string | null = null;
  readonly isViewMode = signal(false);
  readonly isEditMode = signal(false);
  readonly currentItem = signal<ProfessorItem | undefined>(undefined);

  readonly anexosList = signal<AnexoItem[]>([]);

  // Lista de 27 UFs em ordem alfabética
  readonly listaUfs = LISTA_27_UFS;
  readonly ufOptions = this.listaUfs.map(uf => ({label: uf.nome, value: uf.sigla}));
  readonly sexoOptions = [{label: 'Feminino', value: 'Feminino'}, {label: 'Masculino', value: 'Masculino'}];
  readonly tipoProfessorOptions: {label: string; value: TipoProfessor}[] = [
    {label: 'Professor Militar', value: 'MILITAR'},
    {label: 'Professor em contratação emergencial', value: 'EMERGENCIAL'},
    {label: 'Professor da Base Técnica', value: 'BASE_TECNICA'}
  ];

  // Opções dinâmicas a partir dos serviços (registros ativos, Código SEAD + Descrição)
  readonly situacaoFuncionalOpcoes = computed(() => {
    return this.situacaoFuncionalService.items()
      .filter(item => item.ativo)
      .map(item => `${item.codigo} - ${item.descricao}`);
  });
  readonly situacaoFuncionalOptions = computed(() => this.situacaoFuncionalOpcoes().map(opcao => ({label: opcao, value: opcao})));

  readonly regimeOpcoes = computed(() => {
    return this.regimeService.items()
      .filter(item => item.ativo)
      .map(item => `${item.codigo} - ${item.descricao}`);
  });

  readonly cargoOpcoes = computed(() => {
    return this.cargoService.items()
      .filter(item => item.ativo)
      .map(item => `${item.codigo} - ${item.nome}`);
  });

  readonly cargoComissionadoOpcoes = computed(() => {
    return this.cargoComissionadoService.items()
      .filter(item => item.ativo)
      .map(item => `${item.codigo} - ${item.descricao}`);
  });

  readonly formaAdmissaoOpcoes = computed(() => {
    return this.formaAdmissaoService.items()
      .filter(item => item.ativo)
      .map(item => `${item.codigo} - ${item.descricao}`);
  });

  readonly grauInstrucaoOpcoes = computed(() => {
    return this.grauInstrucaoService.items()
      .filter(item => item.ativo)
      .map(item => `${item.codigo} - ${item.descricao}`);
  });

  readonly areaFormacaoOpcoes = [
    '101 - Licenciatura em Matemática',
    '102 - Licenciatura em Língua Portuguesa',
    '103 - Licenciatura em História',
    '104 - Licenciatura em Geografia',
    '105 - Licenciatura em Física',
    '106 - Licenciatura em Química',
    '107 - Licenciatura em Biologia / Ciências Naturais',
    '108 - Licenciatura em Educação Física',
    '109 - Licenciatura em Artes / Música',
    '110 - Licenciatura em Língua Inglesa',
    '111 - Bacharelado / Engenharia com Formação Pedagógica',
    '112 - Formação Técnica e Profissionalizante Específica',
    '113 - Pedagogia / Orientação Educacional'
  ];

  readonly utbOpcoes = [
    '1001 - Colégio da Polícia Militar da Paraíba - Unidade João Pessoa',
    '1002 - Colégio da Polícia Militar da Paraíba - Unidade Campina Grande',
    '1003 - Colégio da Polícia Militar da Paraíba - Unidade Patos',
    '1004 - Centro de Educação da Polícia Militar - CE/PMPB',
    '1005 - Academia de Polícia Militar do Cabo Branco - APMCB',
    '1006 - Centro de Ensino Coronel Sarmento - CBMPB',
    '2001 - Escola Técnica Estadual Professor Agripino de Castro',
    '2002 - Escola Técnica Estadual Governador Eduardo Campos',
    '2003 - Escola Cidadã Integral Técnica Pastor Roberto',
    '3001 - Unidade Operacional Emergencial de Ensino Médio Região Metropolitana',
    '3002 - Unidade de Ensino Emergencial do Agreste',
    '3003 - Unidade de Ensino Emergencial do Sertão'
  ];

  readonly regimeOptions = computed(() => this.regimeOpcoes().map(opcao => ({label: opcao, value: opcao})));
  readonly cargoOptions = computed(() => this.cargoOpcoes().map(opcao => ({label: opcao, value: opcao})));
  readonly cargoComissionadoOptions = computed(() => this.cargoComissionadoOpcoes().map(opcao => ({label: opcao, value: opcao})));
  readonly formaAdmissaoOptions = computed(() => this.formaAdmissaoOpcoes().map(opcao => ({label: opcao, value: opcao})));
  readonly grauInstrucaoOptions = computed(() => this.grauInstrucaoOpcoes().map(opcao => ({label: opcao, value: opcao})));
  readonly areaFormacaoOptions = this.areaFormacaoOpcoes.map(opcao => ({label: opcao, value: opcao}));
  readonly utbOptions = this.utbOpcoes.map(opcao => ({label: opcao, value: opcao}));

  readonly form = new FormGroup({
    tipo: new FormControl<TipoProfessor>('MILITAR', { nonNullable: true, validators: [Validators.required] }),
    
    // Identificação
    cpf: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    matricula: new FormControl('', { nonNullable: true }),
    nome: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] }),
    dataNascimento: new FormControl('', { nonNullable: true, validators: [Validators.required, dataNascimentoExpedicaoValidator()] }),

    // Documentação
    rg: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(7), Validators.maxLength(15)] }),
    ufRg: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    orgaoEmissor: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(5)] }),
    dataExpedicao: new FormControl('', { nonNullable: true, validators: [Validators.required, dataNascimentoExpedicaoValidator()] }),
    pisPasep: new FormControl('', { nonNullable: true, validators: [Validators.required] }),

    // Dados funcionais
    situacaoFuncional: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    regime: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    cargo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    cargoComissionado: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    formaAdmissao: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    instrucao: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    formacao: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    utb: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    dataInicioExercicio: new FormControl('', { nonNullable: true, validators: [Validators.required, dataIntervalo1950A2050Validator()] }),
    dataAdmissao: new FormControl('', { nonNullable: true, validators: [Validators.required, dataIntervalo1950A2050Validator()] }),
    dataFinalContrato: new FormControl('', { nonNullable: true, validators: [dataIntervalo1950A2050Validator()] }),
    secretaria: new FormControl('25 - Secretaria de Segurança e Defesa Social', { nonNullable: true }),
    emailInstitucional: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(200), siageEmailValidator()] }),

    // Dados pessoais
    nomeMae: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(200)] }),
    nomePai: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(200)] }),
    sexo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    telefone: new FormControl('', { nonNullable: true, validators: [Validators.required, telefoneValidator()] }),
    emailPessoal: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200), siageEmailValidator()] }),

    // Endereço
    cep: new FormControl('', { nonNullable: true, validators: [Validators.required, cepValidator()] }),
    estado: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    municipio: new FormControl({ value: '', disabled: true }, { nonNullable: true, validators: [Validators.required] }),
    rua: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    numero: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(5)] }),
    bairro: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    complemento: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] }),

    ativo: new FormControl(true, { nonNullable: true })
  });

  readonly tipoSelecionado = signal<TipoProfessor>('MILITAR');
  readonly isTipoMilitar = computed(() => this.tipoSelecionado() === 'MILITAR');
  readonly secretariaTexto = computed(() => getSecretariaPadrao(this.tipoSelecionado()));

  readonly estadoSelecionado = signal<string>('');
  readonly municipiosDisponiveis = computed(() => {
    const uf = this.estadoSelecionado();
    const list = uf && ESTADOS_MUNICIPIOS[uf] ? [...ESTADOS_MUNICIPIOS[uf]] : [];
    const currentMun = this.form.controls.municipio.value;
    if (currentMun && !list.includes(currentMun)) {
      list.unshift(currentMun);
    }
    return list;
  });
  readonly municipioOptions = computed(() => this.municipiosDisponiveis().map(municipio => ({label: municipio, value: municipio})));

  readonly editOrigin = signal<'list' | 'view'>('list');

  readonly textoAuditoria = computed(() => {
    const item = this.currentItem();
    if (!item) return '';
    if (item.ultimaAtualizacao && item.ultimaAtualizacao.includes(' às ')) {
      return item.ultimaAtualizacao;
    }
    const data = item.dataUltimaAtualizacao || '03/06/2024';
    const hora = item.horaUltimaAtualizacao || '13:44';
    const usuario = item.usuarioUltimaAtualizacao || 'Alessandra';
    return `Última atualização em ${data} às ${hora} pelo usuário ${usuario}.`;
  });

  getOriginUrl(): string {
    if (this.isEditMode() && this.editOrigin() === 'view' && this.itemId) {
      return `/configuracoes/sead/professores-emergencial-militares-base-tecnica/${this.itemId}`;
    }
    return '/configuracoes/sead/professores-emergencial-militares-base-tecnica';
  }

  breadcrumbModeText = computed(() => {
    if (this.itemId && this.isViewMode()) return 'Visualizar';
    if (this.itemId && this.isEditMode()) return 'Editar';
    return 'Cadastrar';
  });

  titleText = computed(() => {
    if (this.itemId && this.isViewMode()) return 'Visualizar Professor';
    if (this.itemId && this.isEditMode()) return 'Editar Professor';
    return 'Adicionar Professor';
  });

  descriptionText = computed(() => {
    if (this.itemId && this.isViewMode()) return 'Consulte os dados do professor.';
    if (this.itemId && this.isEditMode()) return 'Altere os dados do professor.';
    return 'Cadastre um professor em contratação emergencial, militar ou da base técnica.';
  });

  // Rastreamento de alterações reais em relação ao estado inicial
  private initialFormSnapshot = '';

  private computeCurrentSnapshot(): string {
    return JSON.stringify({
      form: this.form.getRawValue(),
      anexosCount: this.anexosList().length,
      anexosIds: this.anexosList().map(a => a.id).sort()
    });
  }

  private captureInitialSnapshot() {
    this.initialFormSnapshot = this.computeCurrentSnapshot();
  }

  hasRealUnsavedChanges(): boolean {
    if (this.isViewMode()) return false;
    return this.computeCurrentSnapshot() !== this.initialFormSnapshot;
  }

  // Rastreamento para reversão de dados auto-preenchidos por consulta de CEP
  private lastCepConsultado = '';
  private autoFilledAddress: { estado: string; municipio: string; rua: string; bairro: string } | null = null;

  private checkIfEditarRoute(): boolean {
    const routeConfigPath = this.route.snapshot.routeConfig?.path || '';
    if (routeConfigPath.endsWith('editar')) {
      return true;
    }
    const hasEditarSegment = this.route.snapshot.url.some(s => s.path === 'editar');
    if (hasEditarSegment) {
      return true;
    }
    const cleanUrl = this.router.url.split('?')[0].split('#')[0];
    return cleanUrl.endsWith('/editar');
  }

  private syncRouteState() {
    const queryFrom = this.route.snapshot.queryParamMap.get('from');
    const stateOrigin = history.state?.origin;
    if (queryFrom === 'view' || stateOrigin === 'view') {
      this.editOrigin.set('view');
    } else if (queryFrom === 'list' || stateOrigin === 'list') {
      this.editOrigin.set('list');
    }

    const isEditar = this.checkIfEditarRoute();
    if (this.itemId) {
      const item = this.service.getItem(this.itemId);
      if (isEditar) {
        if (!this.isEditMode()) {
          this.isEditMode.set(true);
          this.isViewMode.set(false);
          this.form.enable();
          if (item?.estado) {
            this.form.controls.municipio.enable();
          } else {
            this.form.controls.municipio.disable();
          }
          this.captureInitialSnapshot();
          this.cdr.markForCheck();
        }
      } else {
        if (!this.isViewMode()) {
          this.isViewMode.set(true);
          this.isEditMode.set(false);
          this.form.disable();
          this.captureInitialSnapshot();
          this.cdr.markForCheck();
        }
      }
    }
  }

  constructor() {
    const queryFrom = this.route.snapshot.queryParamMap.get('from');
    const stateOrigin = history.state?.origin;
    if (queryFrom === 'view' || stateOrigin === 'view') {
      this.editOrigin.set('view');
    } else {
      this.editOrigin.set('list');
    }

    const params = this.route.snapshot.params;
    const isEditarRoute = this.checkIfEditarRoute();

    if (params['id']) {
      const id = params['id'] as string;
      this.itemId = id;
      const item = this.service.getItem(id);
      if (item) {
        this.currentItem.set(item);
        this.anexosList.set([...item.anexos]);
        this.tipoSelecionado.set(item.tipo);
        this.estadoSelecionado.set(item.estado || '');
        this.form.patchValue({
          tipo: item.tipo,
          cpf: item.cpf,
          matricula: item.matricula,
          nome: item.nome,
          dataNascimento: item.dataNascimento,
          rg: item.rg,
          ufRg: item.ufRg,
          orgaoEmissor: item.orgaoEmissor,
          dataExpedicao: item.dataExpedicao,
          pisPasep: item.pisPasep,
          situacaoFuncional: item.situacaoFuncional,
          regime: item.regime,
          cargo: item.cargo,
          cargoComissionado: item.cargoComissionado || '',
          formaAdmissao: item.formaAdmissao,
          instrucao: item.instrucao,
          formacao: item.formacao,
          utb: item.utb,
          dataInicioExercicio: item.dataInicioExercicio,
          dataAdmissao: item.dataAdmissao,
          dataFinalContrato: item.dataFinalContrato || '',
          secretaria: item.secretaria,
          emailInstitucional: item.emailInstitucional || '',
          nomeMae: item.nomeMae || '',
          nomePai: item.nomePai || '',
          sexo: item.sexo,
          telefone: item.telefone,
          emailPessoal: item.emailPessoal,
          cep: item.cep,
          estado: item.estado,
          municipio: item.municipio,
          rua: item.rua,
          numero: item.numero,
          bairro: item.bairro,
          complemento: item.complemento || '',
          ativo: item.ativo
        });

        if (item.tipo === 'MILITAR') {
          this.form.controls.matricula.setValidators([Validators.required]);
        } else {
          this.form.controls.matricula.clearValidators();
        }
        this.form.controls.matricula.updateValueAndValidity();

        if (isEditarRoute) {
          this.isEditMode.set(true);
          this.isViewMode.set(false);
          this.form.enable();
          if (item.estado) {
            this.form.controls.municipio.enable();
          } else {
            this.form.controls.municipio.disable();
          }
        } else {
          this.isViewMode.set(true);
          this.isEditMode.set(false);
          this.form.disable();
        }
      }
    } else {
      // Inicia com valor padrão Militar
      this.isEditMode.set(false);
      this.isViewMode.set(false);
      this.form.enable();
      this.tipoSelecionado.set('MILITAR');
      this.estadoSelecionado.set('');
      this.form.controls.tipo.setValue('MILITAR');
      this.form.controls.secretaria.setValue(getSecretariaPadrao('MILITAR'));
      this.form.controls.matricula.setValidators([Validators.required]);
      this.form.controls.matricula.updateValueAndValidity();
      this.form.controls.municipio.disable();
    }

    // Sincroniza o modo se houver transição de rota mantendo a mesma instância do componente
    this.route.url.subscribe(() => {
      this.syncRouteState();
    });

    // Reage dinamicamente à alteração do Tipo de Professor (sem recarregar página)
    this.form.controls.tipo.valueChanges.subscribe(tipo => {
      this.onTipoChanged(tipo);
    });

    // Reage dinamicamente à alteração do Estado para habilitar/limpar/atualizar Município
    this.form.controls.estado.valueChanges.subscribe(uf => {
      this.estadoSelecionado.set(uf || '');
      if (!this.isViewMode()) {
        if (uf) {
          this.form.controls.municipio.enable();
          const validMunicipios = ESTADOS_MUNICIPIOS[uf] ? ESTADOS_MUNICIPIOS[uf] : [];
          if (!validMunicipios.includes(this.form.controls.municipio.value)) {
            this.form.controls.municipio.setValue('');
          }
        } else {
          this.form.controls.municipio.setValue('');
          this.form.controls.municipio.disable();
        }
      }
      this.cdr.markForCheck();
    });

    // Reage dinamicamente a mudanças de status do formulário
    this.form.statusChanges.subscribe(() => {
      this.cdr.markForCheck();
    });

    // Efeito para sincronizar ações disparadas pelo Simulador de Cenários
    effect(() => {
      const acao = this.simulator.acaoCadastroProfessor();
      if (!acao) return;

      if (acao.tipo === 'preenchimento_valido') {
        this.preencherDadosValidosTeste();
      } else if (acao.tipo === 'campos_obrigatorios') {
        this.limparCamposObrigatoriosETestar();
      } else if (acao.tipo === 'validacao_cpf_matricula') {
        this.testarValidacaoCpfMatricula();
      } else if (acao.tipo === 'anexos') {
        this.adicionarAnexosTeste();
      } else if (acao.tipo === 'cep_nao_localizado') {
        this.form.controls.cep.setValue('99999-999');
        this.consultarCep('99999999');
      } else if (acao.tipo === 'confirmacao_senha') {
        this.abrirModalSenhaTeste();
      }
    });

    // Captura o estado inicial real do formulário
    this.captureInitialSnapshot();
  }

  onRadioTipoChange(tipo: TipoProfessor) {
    this.form.controls.tipo.setValue(tipo);
    this.onTipoChanged(tipo);
  }

  onEstadoChange(uf: string) {
    this.estadoSelecionado.set(uf || '');
    this.form.controls.municipio.setValue('');
    if (uf) {
      this.form.controls.municipio.enable();
    } else {
      this.form.controls.municipio.disable();
    }
    this.cdr.markForCheck();
  }

  onTipoChanged(tipo: TipoProfessor) {
    this.tipoSelecionado.set(tipo);

    if (this.isEditMode() || this.isViewMode()) {
      this.cdr.markForCheck();
      return;
    }

    if (tipo === 'MILITAR') {
      // Emergencial ou Base Técnica -> Militar:
      // - Matrícula habilitada para digitação, limpa para novo preenchimento e se torna obrigatória;
      // - Data Final do Contrato ocultada e seu valor limpo;
      // - Nome da Mãe e Nome do Pai ocultados e seus valores limpos;
      // - Secretaria definida como Secretaria de Segurança e Defesa Social.
      this.form.controls.secretaria.setValue(getSecretariaPadrao('MILITAR'));
      this.form.controls.matricula.setValue('');
      this.form.controls.matricula.setValidators([Validators.required]);
      this.form.controls.dataFinalContrato.setValue('');
      this.form.controls.nomeMae.setValue('');
      this.form.controls.nomePai.setValue('');
    } else {
      // Militar -> Emergencial ou Base Técnica, ou alternando entre Emergencial e Base Técnica:
      // - Secretaria definida como Secretaria de Estado da Educação;
      // - Data Final do Contrato opcional e visível;
      // - Nome da Mãe e Nome do Pai visíveis;
      // - Ao alternar de Militar para Emergencial ou Base Técnica, limpar qualquer Matrícula anteriormente digitada;
      // - Matrícula passa para o estado não habilitado (cinza) com a mensagem "Gerada automaticamente após a inclusão"
      this.form.controls.secretaria.setValue(getSecretariaPadrao(tipo));
      this.form.controls.matricula.setValue('');
      this.form.controls.matricula.clearValidators();
    }

    this.form.controls.matricula.updateValueAndValidity();
    this.form.controls.dataFinalContrato.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  getTipoDesc(tipo: TipoProfessor): string {
    return getTipoProfessorDescricao(tipo);
  }

  getCodigoSeadEsperado(tipo: TipoProfessor): string {
    return getCodigoSeadEsperado(tipo);
  }

  formatDataView(val?: string): string {
    if (!val) return 'Não informada';
    const parts = val.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return val;
  }

  onCpfInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = formatarCpf(input.value);
    this.form.controls.cpf.setValue(input.value, { emitEvent: false });
    if (this.form.controls.cpf.hasError('duplicado')) {
      this.form.controls.cpf.setErrors(null);
    }
  }

  onMatriculaInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').substring(0, 7);
    this.form.controls.matricula.setValue(input.value, { emitEvent: false });
    if (this.form.controls.matricula.hasError('duplicado')) {
      this.form.controls.matricula.setErrors(null);
    }
  }

  onNumeroInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').substring(0, 5);
    this.form.controls.numero.setValue(input.value, { emitEvent: false });
  }

  onOrgaoEmissorInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 5);
    this.form.controls.orgaoEmissor.setValue(input.value, { emitEvent: false });
  }

  onTelefoneInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = formatarTelefone(input.value);
    this.form.controls.telefone.setValue(input.value, { emitEvent: false });
  }

  onEmailBlur(controlName: 'emailPessoal' | 'emailInstitucional') {
    const ctrl = this.form.get(controlName);
    if (ctrl && typeof ctrl.value === 'string') {
      ctrl.setValue(ctrl.value.trim(), { emitEvent: false });
      ctrl.updateValueAndValidity();
    }
  }

  onRgInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').substring(0, 15);
    this.form.controls.rg.setValue(input.value, { emitEvent: false });
  }

  onCepInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = formatarCep(input.value);
    this.form.controls.cep.setValue(input.value, { emitEvent: false });
    const rawDigits = input.value.replace(/\D/g, '');

    // Se o CEP foi alterado em relação à consulta anterior que auto-preencheu o endereço:
    if (this.lastCepConsultado && rawDigits !== this.lastCepConsultado) {
      if (this.autoFilledAddress) {
        // Limpar somente os campos de endereço que foram preenchidos automaticamente pelo CEP anterior
        // Número e complemento permanecem inalterados!
        if (this.form.controls.estado.value === this.autoFilledAddress.estado) {
          this.form.controls.estado.setValue('');
        }
        if (this.form.controls.municipio.value === this.autoFilledAddress.municipio) {
          this.form.controls.municipio.setValue('');
        }
        if (this.form.controls.rua.value === this.autoFilledAddress.rua) {
          this.form.controls.rua.setValue('');
        }
        if (this.form.controls.bairro.value === this.autoFilledAddress.bairro) {
          this.form.controls.bairro.setValue('');
        }
        this.autoFilledAddress = null;
        if (!this.form.controls.estado.value) {
          this.form.controls.municipio.disable();
        }
      }
      this.lastCepConsultado = '';
    }

    if (rawDigits.length === 8) {
      this.consultarCep(rawDigits);
    } else {
      this.cepNaoLocalizado.set(false);
    }
  }

  onCepBlur() {
    const rawDigits = this.form.controls.cep.value.replace(/\D/g, '');
    if (rawDigits.length === 8) {
      this.consultarCep(rawDigits);
    }
  }

  consultarCep(rawDigits: string) {
    this.lastCepConsultado = rawDigits;
    if (this.simulator.simularCepNaoLocalizado() || !CEP_DATABASE[rawDigits]) {
      // CEP não localizado:
      // - exibir a mensagem de erro diretamente junto ao campo CEP: "CEP não localizado. Preencha os dados do endereço manualmente."
      // - manter Estado, Rua e Bairro disponíveis para preenchimento manual;
      // - preservar número, complemento e demais dados preenchidos;
      // - sem abrir modal e sem impedir salvamento posterior se os campos forem preenchidos.
      this.cepNaoLocalizado.set(true);
      this.autoFilledAddress = null;
      this.cdr.markForCheck();
      return;
    }

    const dados = CEP_DATABASE[rawDigits];
    this.cepNaoLocalizado.set(false);
    this.autoFilledAddress = {
      estado: dados.estado,
      municipio: dados.municipio,
      rua: dados.rua,
      bairro: dados.bairro
    };
    this.estadoSelecionado.set(dados.estado);
    this.form.patchValue({
      estado: dados.estado,
      rua: dados.rua,
      bairro: dados.bairro
    });
    this.form.controls.municipio.enable();
    this.form.controls.municipio.setValue(dados.municipio);
    this.cdr.markForCheck();
  }

  habilitarEnderecoManual() {
    this.form.controls.estado.enable();
    if (this.form.controls.estado.value) {
      this.form.controls.municipio.enable();
    }
    this.form.controls.rua.enable();
    this.form.controls.bairro.enable();
  }

  onPisInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = formatarPis(input.value);
    this.form.controls.pisPasep.setValue(input.value, { emitEvent: false });
  }

  onNomeBlur() {
    const ctrl = this.form.controls.nome;
    ctrl.setValue(ctrl.value.trim().replace(/\s+/g, ' '), { emitEvent: false });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const allowedExt = ['.pdf', '.jpg', '.jpeg', '.png'];
      const maxMb = 10;
      
      for (let i = 0; i < input.files.length; i++) {
        // Se já atingiu 5 arquivos, interrompe a adição sem Toast
        if (this.anexosList().length >= 5) {
          break;
        }

        const file = input.files[i];

        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!allowedExt.includes(ext)) {
          this.toastService.error(`Formato não suportado para "${file.name}". Utilize PDF, JPG, JPEG ou PNG.`);
          continue;
        }

        if (file.size > maxMb * 1024 * 1024) {
          this.toastService.error(`O arquivo "${file.name}" excede o tamanho máximo permitido de 10 MB.`);
          continue;
        }

        const sizeFormatted = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
        let objectUrl = '';
        try {
          objectUrl = URL.createObjectURL(file);
        } catch {
          objectUrl = '';
        }
        const newAnexo: AnexoItem = {
          id: `new_${Date.now()}_${i}`,
          nome: file.name,
          tamanho: sizeFormatted,
          dataEnvio: 'Hoje',
          tipo: file.type || (ext === '.pdf' ? 'application/pdf' : 'image/' + ext.replace('.', '')),
          blobUrl: objectUrl || undefined,
          url: objectUrl || (ext === '.pdf' ? '/exemplo-documento-comprovacao.pdf' : undefined),
          isNovo: true
        };

        this.anexosList.update(list => [...list, newAnexo]);
      }
      input.value = '';
    }
  }

  removerAnexo(id: string) {
    this.anexosList.update(list => list.filter(a => a.id !== id));
  }

  onVisualizarAnexo(anexo: AnexoItem) {
    this.dialog.open(VisualizarAnexoDialog, {
      disableClose: true,
      width: '780px',
      maxWidth: 'calc(100vw - 2.5rem)',
      height: '620px',
      maxHeight: '82vh',
      panelClass: 'siage-pdf-dialog-panel',
      data: { anexo }
    });
  }

  onDownloadAnexo(anexo: AnexoItem) {
    const fileUrl = anexo.blobUrl || anexo.url || '/exemplo-documento-comprovacao.pdf';
    const filename = anexo.nome || 'documento.pdf';
    try {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      this.toastService.error('Não foi possível realizar o download do arquivo.');
    }
  }

  // Navegação protegida que verifica alterações reais
  navigateWithProtection(url: string) {
    if (this.hasRealUnsavedChanges()) {
      this.modalService.confirmarCancelamento().afterClosed().subscribe((confirmado: boolean | undefined) => {
        if (confirmado) {
          this.router.navigate([url]);
        }
      });
    } else {
      this.router.navigate([url]);
    }
  }

  goBack(force = false) {
    const targetUrl = this.getOriginUrl();
    if (!force && this.hasRealUnsavedChanges()) {
      this.modalService.confirmarCancelamento().afterClosed().subscribe((confirmado: boolean | undefined) => {
        if (confirmado) {
          this.router.navigate([targetUrl]);
        }
      });
      return;
    }
    this.router.navigate([targetUrl]);
  }

  onCancelar() {
    this.goBack();
  }

  goHome() { this.navigateWithProtection('/inicio'); }
  navConfig() { this.navigateWithProtection('/configuracoes'); }
  navSead() { this.navigateWithProtection('/configuracoes/sead'); }

  onToggleEdit() {
    if (this.itemId) {
      this.router.navigate(
        [`/configuracoes/sead/professores-emergencial-militares-base-tecnica/${this.itemId}/editar`],
        { queryParams: { from: 'view' }, state: { origin: 'view' } }
      );
    }
  }

  onPreSave() {
    if (this.isSaving()) return;

    this.form.markAllAsTouched();

    // Validação de CPF (dígitos e algoritmo real Módulo 11)
    const cpfDigits = this.form.controls.cpf.value.replace(/\D/g, '');
    if (!cpfDigits) {
      this.form.controls.cpf.setErrors({ required: true });
    } else if (!isCpfValido(cpfDigits)) {
      this.form.controls.cpf.setErrors({ cpfInvalido: true });
    } else {
      // Validação de duplicidade de CPF
      const isCpfDuplicate = this.service.items().some(item => 
        item.cpf.replace(/\D/g, '') === cpfDigits && item.id !== this.itemId
      );
      if (isCpfDuplicate) {
        this.form.controls.cpf.setErrors({ duplicado: true });
      }
    }

    // Validação de Matrícula para Militar
    if (this.isTipoMilitar()) {
      const matValue = this.form.controls.matricula.value.trim();
      if (!matValue) {
        this.form.controls.matricula.setErrors({ required: true });
      } else {
        const isMatDuplicate = this.service.items().some(item => 
          item.matricula.trim() === matValue && item.id !== this.itemId
        );
        if (isMatDuplicate) {
          this.form.controls.matricula.setErrors({ duplicado: true });
        }
      }
    }

    // Validação de PIS/PASEP (11 dígitos)
    const pisDigits = this.form.controls.pisPasep.value.replace(/\D/g, '');
    if (!pisDigits) {
      this.form.controls.pisPasep.setErrors({ required: true });
    } else if (pisDigits.length !== 11) {
      this.form.controls.pisPasep.setErrors({ pisInvalido: true });
    }

    // Se houver campos inválidos no formulário:
    // Destacar erros, rolar até o primeiro campo inválido e exibir Toast de atenção
    if (this.form.invalid) {
      this.focusPrimeiroCampoInvalido();
      this.toastService.warning('Verifique os campos obrigatórios destacados no formulário.');
      this.cdr.markForCheck();
      return;
    }

    // SOMENTE APÓS TODAS AS VALIDAÇÕES DE CAMPOS ATENDIDAS:
    // Verificar se existe Classificação Funcional compatível no sistema
    const seadEsperado = this.getCodigoSeadEsperado(this.tipoSelecionado());
    const hasClassificacaoCompativel = !this.classificacaoFuncionalIncompativel() &&
      this.classificacaoService.items().some(c => 
        c.codigo === seadEsperado && 
        c.ativo && 
        c.categoria === 'Professor' &&
        (c.vinculo === 'Efetivo' || c.vinculo === 'Prestador')
      );

    if (!hasClassificacaoCompativel) {
      this.toastService.error(
        'Classificação Funcional não localizada',
        `Não foi localizada a Classificação Funcional correspondente ao tipo selecionado (Código SEAD: ${seadEsperado}).`
      );
      return;
    }

    // Quando não houver impedimentos, abrir modal Confirmação de Segurança (RevalidarSenhaDialog)
    const dialogRef = this.dialog.open(RevalidarSenhaDialog, {
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((senhaValida: boolean) => {
      if (senhaValida) {
        this.executeSave();
      }
    });
  }

  focusPrimeiroCampoInvalido() {
    setTimeout(() => {
      const fieldElementMap: Record<string, string> = {
        cpf: '#form-cpf',
        matricula: '#form-matricula',
        dataNascimento: '#form-data-nascimento input, #form-data-nascimento',
        nome: '#form-nome',
        rg: '#form-rg',
        orgaoEmissor: '#form-emissor',
        ufRg: '#form-ufrg',
        dataExpedicao: '#form-expedicao input, #form-expedicao',
        pisPasep: '#form-pispasep',
        situacaoFuncional: '#form-situacao-funcional',
        regime: '#form-regime',
        cargo: '#form-cargo',
        cargoComissionado: '#form-cargocomiss',
        formaAdmissao: '#form-admissao',
        instrucao: '#form-instrucao',
        formacao: '#form-formacao',
        utb: '#form-utb',
        dataInicioExercicio: '#form-inicio input, #form-inicio',
        dataAdmissao: '#form-admissao-data input, #form-admissao-data',
        dataFinalContrato: '#form-data-final input, #form-data-final',
        sexo: '#form-sexo',
        telefone: '#form-telefone',
        emailPessoal: '#form-email-pessoal',
        emailInstitucional: '#form-email-inst',
        nomeMae: '#form-nome-mae',
        nomePai: '#form-nome-pai',
        cep: '#form-cep',
        estado: '#form-uf',
        municipio: '#form-municipio',
        bairro: '#form-bairro',
        rua: '#form-rua',
        numero: '#form-numero',
        complemento: '#form-complemento'
      };

      const fieldOrder = [
        'cpf', 'matricula', 'dataNascimento', 'nome',
        'rg', 'orgaoEmissor', 'ufRg', 'dataExpedicao', 'pisPasep',
        'situacaoFuncional', 'regime', 'cargo', 'cargoComissionado',
        'formaAdmissao', 'instrucao', 'formacao', 'utb',
        'dataInicioExercicio', 'dataAdmissao', 'dataFinalContrato',
        'emailInstitucional',
        'sexo', 'telefone', 'emailPessoal', 'nomeMae', 'nomePai',
        'cep', 'estado', 'municipio', 'bairro', 'rua', 'numero', 'complemento'
      ];

      for (const fieldName of fieldOrder) {
        const ctrl = this.form.get(fieldName);
        if (ctrl && ctrl.invalid) {
          const selector = fieldElementMap[fieldName];
          if (selector) {
            const targetEl = document.querySelector(selector) as HTMLElement | null;
            if (targetEl) {
              targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              if (targetEl.tagName === 'INPUT' || targetEl.tagName === 'SELECT' || targetEl.tagName === 'TEXTAREA') {
                targetEl.focus();
              } else {
                const inner = targetEl.querySelector('input, select, textarea, [tabindex="0"], button') as HTMLElement | null;
                if (inner) {
                  inner.focus();
                } else {
                  targetEl.focus();
                }
              }
              return;
            }
          }
        }
      }

      // Fallback para qualquer elemento ng-invalid no formulário
      const genericInvalid = document.querySelector('form .ng-invalid:not(form):not(div.grid):not(div.flex)') as HTMLElement | null;
      if (genericInvalid) {
        genericInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const focusable = genericInvalid.querySelector('input, select, textarea, [tabindex="0"]') as HTMLElement | null;
        if (focusable) {
          focusable.focus();
        } else {
          genericInvalid.focus();
        }
      }
    }, 60);
  }

  preencherDadosValidosTeste() {
    this.form.patchValue({
      tipo: 'MILITAR',
      cpf: '529.982.247-25',
      matricula: '1849204',
      nome: 'Marcos Vinicius de Oliveira Lima',
      dataNascimento: '1985-04-12',
      rg: '3489201',
      ufRg: 'PB',
      orgaoEmissor: 'SSP',
      dataExpedicao: '2005-08-20',
      pisPasep: '120.49201.84-2',
      situacaoFuncional: '1 - Efetivo em exercício',
      regime: '1 - Estatutário',
      cargo: '20006 - PROFESSOR',
      cargoComissionado: '101 - Diretor Escolar',
      formaAdmissao: '101 - Concurso Público',
      instrucao: '06 - Educação Superior Completa',
      formacao: '101 - Licenciatura em Matemática',
      utb: '1001 - Colégio da Polícia Militar da Paraíba - Unidade João Pessoa',
      dataInicioExercicio: '2020-02-10',
      dataAdmissao: '2020-02-01',
      secretaria: '25 - Secretaria de Segurança e Defesa Social',
      emailInstitucional: 'marcos.vinicius@see.pb.gov.br',
      sexo: 'Masculino',
      telefone: '(83) 98844-2211',
      emailPessoal: 'marcos.v.oliveira@gmail.com',
      cep: '58013-280',
      estado: 'PB',
      rua: 'Avenida Dom Pedro II',
      numero: '1240',
      bairro: 'Centro',
      complemento: 'Apto 402',
      ativo: true
    });
    this.estadoSelecionado.set('PB');
    this.form.controls.municipio.enable();
    this.form.controls.municipio.setValue('João Pessoa');
    this.lastCepConsultado = '58013280';
    this.autoFilledAddress = {
      estado: 'PB',
      municipio: 'João Pessoa',
      rua: 'Avenida Dom Pedro II',
      bairro: 'Centro'
    };
    this.cepNaoLocalizado.set(false);
    this.form.markAsUntouched();
    this.cdr.markForCheck();
    this.toastService.info('Formulário preenchido com dados válidos de teste.');
  }

  limparCamposObrigatoriosETestar() {
    this.autoFilledAddress = null;
    this.lastCepConsultado = '';
    this.form.patchValue({
      nome: '',
      cpf: '',
      rg: '',
      orgaoEmissor: '',
      ufRg: '',
      pisPasep: '',
      dataNascimento: '',
      dataExpedicao: '',
      situacaoFuncional: '',
      regime: '',
      cargo: '',
      cargoComissionado: '',
      formaAdmissao: '',
      instrucao: '',
      formacao: '',
      utb: '',
      dataInicioExercicio: '',
      dataAdmissao: '',
      sexo: '',
      telefone: '',
      emailPessoal: '',
      cep: '',
      estado: '',
      municipio: '',
      bairro: '',
      rua: '',
      numero: '',
      complemento: ''
    });
    this.form.controls.municipio.setValue('');
    this.form.controls.municipio.disable();
    this.estadoSelecionado.set('');
    if (this.isTipoMilitar()) {
      this.form.controls.matricula.setValue('');
    }
    this.onPreSave();
  }

  testarValidacaoCpfMatricula() {
    this.form.controls.cpf.setValue('123.456.789');
    this.form.controls.cpf.markAsTouched();
    this.form.controls.cpf.setErrors({ cpfInvalido: true });

    if (this.isTipoMilitar()) {
      this.form.controls.matricula.setValue('');
      this.form.controls.matricula.markAsTouched();
      this.form.controls.matricula.setErrors({ required: true });
    }

    this.focusPrimeiroCampoInvalido();
    this.toastService.warning('Verifique os campos obrigatórios destacados no formulário.');
    this.cdr.markForCheck();
  }

  adicionarAnexosTeste() {
    const samplePdf = '/exemplo-documento-comprovacao.pdf';
    const sampleImg = 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1200&q=80';
    const anexosExemplo: AnexoItem[] = [
      { id: 'anx-1', nome: 'documento_identificacao.pdf', tamanho: '1.2 MB', dataEnvio: 'Hoje', tipo: 'application/pdf', url: samplePdf, isNovo: true },
      { id: 'anx-2', nome: 'comprovante_residencia.pdf', tamanho: '950 KB', dataEnvio: 'Hoje', tipo: 'application/pdf', url: samplePdf, isNovo: true },
      { id: 'anx-3', nome: 'diploma_licenciatura.pdf', tamanho: '2.5 MB', dataEnvio: 'Hoje', tipo: 'application/pdf', url: samplePdf, isNovo: true },
      { id: 'anx-4', nome: 'termo_posse_militar.pdf', tamanho: '800 KB', dataEnvio: 'Hoje', tipo: 'application/pdf', url: samplePdf, isNovo: true },
      { id: 'anx-5', nome: 'certidao_regularidade.png', tamanho: '1.8 MB', dataEnvio: 'Hoje', tipo: 'image/png', url: sampleImg, isNovo: true }
    ];
    this.anexosList.set(anexosExemplo);
    this.cdr.markForCheck();
  }

  abrirModalSenhaTeste() {
    this.dialog.open(RevalidarSenhaDialog, {
      disableClose: true
    });
  }

  executeSave() {
    this.isSaving.set(true);

    const raw = this.form.getRawValue();

    setTimeout(() => {
      try {
        const payload = {
          tipo: raw.tipo,
          cpf: raw.cpf.trim(),
          matricula: raw.matricula.trim(),
          nome: raw.nome.trim(),
          dataNascimento: raw.dataNascimento,
          rg: raw.rg.trim(),
          ufRg: raw.ufRg,
          orgaoEmissor: raw.orgaoEmissor.trim(),
          dataExpedicao: raw.dataExpedicao,
          pisPasep: raw.pisPasep.trim(),
          situacaoFuncional: raw.situacaoFuncional,
          regime: raw.regime,
          cargo: raw.cargo,
          cargoComissionado: raw.cargoComissionado.trim(),
          formaAdmissao: raw.formaAdmissao,
          instrucao: raw.instrucao,
          formacao: raw.formacao,
          utb: raw.utb,
          dataInicioExercicio: raw.dataInicioExercicio,
          dataAdmissao: raw.dataAdmissao,
          dataFinalContrato: (raw.tipo !== 'MILITAR' && raw.dataFinalContrato) ? raw.dataFinalContrato : undefined,
          secretaria: getSecretariaPadrao(raw.tipo),
          emailInstitucional: raw.emailInstitucional.trim() || undefined,
          nomeMae: (raw.tipo !== 'MILITAR' && raw.nomeMae) ? raw.nomeMae.trim() : undefined,
          nomePai: (raw.tipo !== 'MILITAR' && raw.nomePai) ? raw.nomePai.trim() : undefined,
          sexo: raw.sexo,
          telefone: raw.telefone.trim(),
          emailPessoal: raw.emailPessoal.trim(),
          cep: raw.cep.trim(),
          estado: raw.estado,
          municipio: raw.municipio.trim(),
          rua: raw.rua.trim(),
          numero: raw.numero.trim(),
          bairro: raw.bairro.trim(),
          complemento: raw.complemento?.trim() || undefined,
          anexos: this.anexosList().map(a => ({ ...a, isNovo: false })),
          ativo: raw.ativo
        };

        if (this.itemId) {
          this.service.update(this.itemId, payload);
          this.toastService.success('Registro atualizado com sucesso.');
        } else {
          this.service.add(payload);
          this.toastService.success('Registro cadastrado com sucesso.');
        }
        // Atualiza o snapshot para não disparar confirmação de cancelamento ao sair após salvar
        this.captureInitialSnapshot();
        this.router.navigate(['/configuracoes/sead/professores-emergencial-militares-base-tecnica']);
      } catch {
        this.toastService.error('Não foi possível concluir a solicitação', 'Tente novamente.');
      } finally {
        this.isSaving.set(false);
      }
    }, 400);
  }
}


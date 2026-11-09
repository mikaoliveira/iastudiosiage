import {Component, inject, signal, computed, effect, ChangeDetectionStrategy, Injectable, ChangeDetectorRef} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {MatSortModule, Sort} from '@angular/material/sort';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatChipsModule} from '@angular/material/chips';
import {MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSelectModule} from '@angular/material/select';
import {MatCardModule} from '@angular/material/card';
import {MatRadioModule} from '@angular/material/radio';
import {CommonModule} from '@angular/common';

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
  imports: [MatDialogModule, MatButtonModule, MatIconModule, ReactiveFormsModule, CommonModule],
  template: `
    <div class="w-[calc(100vw-2rem)] sm:w-[500px] max-w-full bg-siage-surface text-siage-text-primary rounded-lg border border-siage-border shadow-[var(--mat-sys-level3)] font-sans flex flex-col text-left box-border">
      <div class="flex items-center justify-between px-5 pt-5 pb-3 border-b border-siage-border/40">
        <h2 class="text-base font-poppins font-bold text-siage-text-primary">Inativar registro?</h2>
        <button type="button" (click)="cancelar()" class="w-8 h-8 rounded-lg flex items-center justify-center text-siage-text-secondary hover:text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
          <mat-icon style="font-size: 18px; width: 18px; height: 18px;">close</mat-icon>
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="confirmar()" class="px-5 py-4 flex flex-col gap-4">
        <p class="text-xs sm:text-sm text-siage-text-secondary leading-relaxed">
          Tem certeza que deseja inativar o registro de <strong>{{ data.nome }}</strong>? Esta ação exigirá o preenchimento obrigatório da justificativa legal ou operacional.
        </p>

        <div class="flex flex-col gap-1.5">
          <label for="justificativa-input" class="text-xs font-semibold uppercase tracking-wider text-siage-text-secondary">
            Justificativa da inativação <span class="text-red-500">*</span>
          </label>
          <textarea 
            id="justificativa-input"
            rows="4" 
            maxlength="500"
            formControlName="justificativa" 
            placeholder="Descreva o motivo da inativação (ex.: término de contrato, remoção, aposentadoria ou retorno ao batalhão)..." 
            class="w-full p-3 rounded-lg border border-siage-border bg-siage-background text-sm font-sans text-siage-text-primary focus:outline-none focus:ring-2 focus:ring-siage-primary/40 focus:border-siage-primary transition-all resize-none"
          ></textarea>
          <div class="flex justify-between items-center text-[11px] text-siage-text-secondary/70">
            @if (form.controls.justificativa.invalid && form.controls.justificativa.touched) {
              <span class="text-red-500 font-medium">A justificativa é obrigatória (mínimo 10 caracteres).</span>
            } @else {
              <span></span>
            }
            <span>{{ form.controls.justificativa.value.length }} de 500</span>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-3 border-t border-siage-border/40">
          <button type="button" (click)="cancelar()" class="h-10 px-5 rounded-lg border border-siage-border font-sans font-medium text-xs sm:text-sm text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-all">
            Cancelar
          </button>
          <button type="submit" [disabled]="form.invalid" class="h-10 px-5 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-xs sm:text-sm transition-all disabled:opacity-50">
            Sim, inativar
          </button>
        </div>
      </form>
    </div>
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
  imports: [MatDialogModule, MatButtonModule, MatIconModule, CommonModule],
  template: `
    <div class="w-[calc(100vw-2rem)] sm:w-[500px] max-w-full bg-siage-surface text-siage-text-primary rounded-lg border border-siage-border shadow-[var(--mat-sys-level3)] font-sans flex flex-col text-left box-border">
      <div class="flex items-center justify-between px-5 pt-5 pb-3 border-b border-siage-border/40">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">comment</mat-icon>
          </div>
          <h2 class="text-base font-poppins font-bold text-siage-text-primary">Justificativa da Inativação</h2>
        </div>
        <button 
          type="button" 
          (click)="fechar()" 
          class="w-8 h-8 rounded-lg flex items-center justify-center text-siage-text-secondary hover:text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="Fechar"
          aria-label="Fechar modal"
        >
          <mat-icon style="font-size: 18px; width: 18px; height: 18px;">close</mat-icon>
        </button>
      </div>

      <div class="px-5 py-4 flex flex-col gap-4">
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

      <div class="flex justify-end px-5 py-3.5 border-t border-siage-border/40 bg-siage-surface">
        <button 
          type="button" 
          (click)="fechar()" 
          class="h-10 px-6 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
        >
          Fechar
        </button>
      </div>
    </div>
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
                (click)="download()" 
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
        <button 
          type="button" 
          (click)="download()" 
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
      this.toast.success(`Download concluído: ${filename}`);
    } catch {
      window.open(url, '_blank');
      this.toast.info(`Download iniciado: ${filename}`);
    }
  }
}

// ==========================================
// LISTAGEM UNIFICADA
// ==========================================

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-professores-emergencial-militares-base-tecnica-list',
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
        
        <!-- Breadcrumb: Início / Configurações / SEAD / Professores em contratação emergencial, Militares e Base Técnica -->
        <nav aria-label="Breadcrumb" class="flex items-center gap-2 text-xs font-sans font-medium tracking-wide text-siage-text-secondary/70 flex-wrap">
          <span (click)="goHome()" tabindex="0" role="button" class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline">Início</span>
          <span class="text-[10px] text-siage-text-secondary/40 select-none">/</span>
          <span (click)="navConfig()" tabindex="0" role="button" class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline">Configurações</span>
          <span class="text-[10px] text-siage-text-secondary/40 select-none">/</span>
          <span (click)="navSead()" tabindex="0" role="button" class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline">SEAD</span>
          <span class="text-[10px] text-siage-text-secondary/40 select-none">/</span>
          <span class="text-siage-primary font-semibold" aria-current="page">Professores em contratação emergencial, Militares e Base Técnica</span>
        </nav>

        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2 sm:gap-3">
              <button 
                mat-icon-button 
                (click)="goBack()" 
                class="text-siage-text-secondary hover:text-siage-primary transition-colors cursor-pointer -ml-2 shrink-0"
                title="Voltar para SEAD"
                aria-label="Voltar para SEAD"
              >
                <mat-icon style="font-size: 22px; width: 22px; height: 22px;">arrow_back</mat-icon>
              </button>
              <h1 class="text-2xl sm:text-3xl font-poppins font-bold tracking-tight text-siage-text-primary leading-tight">
                Professores em contratação emergencial, Militares e Base Técnica
              </h1>
            </div>
            
            <p class="text-xs sm:text-sm text-siage-text-secondary font-sans leading-normal pl-8 sm:pl-9 max-w-3xl">
              Cadastre e mantenha os professores vinculados a estas modalidades.
            </p>
          </div>
          
          @if (permissionService.canCreate()) {
            <button 
              type="button"
              (click)="onAdicionar()"
              class="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs dark:shadow-none active:scale-[0.99] shrink-0 cursor-pointer"
            >
              <mat-icon style="font-size: 20px; width: 20px; height: 20px;">add</mat-icon>
              <span>Adicionar</span>
            </button>
          }
        </div>
      </div>

      <!-- CARD DE FILTROS (Organizado em duas linhas) -->
      <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs dark:shadow-none flex flex-col gap-4">
        
        <!-- Linha 1: CPF, Matrícula, Nome, Secretaria -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          
          <!-- Filtro CPF -->
          <div class="form-field-group">
            <label for="filter-cpf" class="siage-field-label">CPF</label>
            <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
              <input 
                matInput 
                id="filter-cpf"
                type="text" 
                maxlength="14"
                [formControl]="cpfControl"
                placeholder="000.000.000-00" 
                (input)="onCpfFilterInput($event)"
                (keydown.enter)="onBuscar()"
                class="font-mono text-sm"
              />
              @if (cpfControl.value) {
                <button mat-icon-button matSuffix (click)="cpfControl.setValue(''); updateBuscarStatus()" aria-label="Limpar campo">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                </button>
              }
            </mat-form-field>
          </div>

          <!-- Filtro Matrícula -->
          <div class="form-field-group">
            <label for="filter-matricula" class="siage-field-label">Matrícula</label>
            <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
              <input 
                matInput 
                id="filter-matricula"
                type="text" 
                maxlength="10"
                [formControl]="matriculaControl"
                placeholder="Buscar por matrícula" 
                (keydown.enter)="onBuscar()"
                class="font-mono text-sm"
              />
              @if (matriculaControl.value) {
                <button mat-icon-button matSuffix (click)="matriculaControl.setValue(''); updateBuscarStatus()" aria-label="Limpar campo">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                </button>
              }
            </mat-form-field>
          </div>

          <!-- Filtro Nome -->
          <div class="form-field-group">
            <label for="filter-nome" class="siage-field-label">Nome do(a) Servidor(a)</label>
            <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
              <input 
                matInput 
                id="filter-nome"
                type="text" 
                [formControl]="nomeControl"
                placeholder="Buscar por nome" 
                (keydown.enter)="onBuscar()"
                class="text-sm"
              />
              @if (nomeControl.value) {
                <button mat-icon-button matSuffix (click)="nomeControl.setValue(''); updateBuscarStatus()" aria-label="Limpar campo">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                </button>
              }
            </mat-form-field>
          </div>

          <!-- Filtro Secretaria -->
          <div class="form-field-group">
            <label for="filter-secretaria" class="siage-field-label">Secretaria</label>
            <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
              <mat-select [formControl]="secretariaControl" id="filter-secretaria" class="text-sm">
                <mat-option value="TODAS">Todas</mat-option>
                <mat-option value="21 - Secretaria de Estado da Educação">21 - Secretaria de Estado da Educação</mat-option>
                <mat-option value="25 - Secretaria de Segurança e Defesa Social">25 - Secretaria de Segurança e Defesa Social</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>

        <!-- Linha 2: Tipo de Professor, Unidade de Trabalho (UTB), Status -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
          
          <!-- Filtro Tipo de Professor -->
          <div class="form-field-group">
            <label for="filter-tipo" class="siage-field-label">Tipo de Professor</label>
            <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
              <mat-select [formControl]="tipoControl" id="filter-tipo" class="text-sm">
                <mat-option value="TODOS">Todos</mat-option>
                <mat-option value="MILITAR">Professor Militar</mat-option>
                <mat-option value="EMERGENCIAL">Professor em contratação emergencial</mat-option>
                <mat-option value="BASE_TECNICA">Professor da Base Técnica</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Filtro Unidade de Trabalho (UTB) -->
          <div class="form-field-group">
            <label for="filter-utb" class="siage-field-label">Unidade de Trabalho (UTB)</label>
            <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
              <input 
                matInput 
                id="filter-utb"
                type="text" 
                [formControl]="utbControl"
                placeholder="Buscar por código ou nome da UTB" 
                (keydown.enter)="onBuscar()"
                class="text-sm"
              />
              @if (utbControl.value) {
                <button mat-icon-button matSuffix (click)="utbControl.setValue(''); updateBuscarStatus()" aria-label="Limpar campo">
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

        <!-- Ações do Filtro: Limpar e Buscar -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-siage-border/40">
          <button 
            type="button" 
            (click)="onLimpar()"
            class="h-10 px-5 rounded-lg border border-siage-border font-sans font-medium text-sm text-siage-text-primary hover:bg-siage-primary/5 hover:border-siage-primary/30 active:scale-[0.99] transition-all cursor-pointer"
          >
            Limpar
          </button>
          
          <button 
            type="button" 
            [disabled]="!isBuscarEnabled()"
            (click)="onBuscar()"
            class="inline-flex items-center justify-center gap-1.5 h-10 px-6 rounded-lg bg-siage-primary hover:bg-siage-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-sans font-semibold text-sm transition-all shadow-xs cursor-pointer"
          >
            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">search</mat-icon>
            <span>Buscar</span>
          </button>
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
          <div class="py-14 px-6 flex flex-col items-center justify-center text-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-siage-destructive/10 text-siage-destructive flex items-center justify-center">
              <mat-icon style="font-size: 24px; width: 24px; height: 24px;">error_outline</mat-icon>
            </div>
            <div class="flex flex-col gap-1 max-w-md">
              <h3 class="text-base font-poppins font-semibold text-siage-text-primary">Erro ao carregar dados</h3>
              <p class="text-xs sm:text-sm text-siage-text-secondary">
                Não foi possível carregar as informações. Verifique sua conexão e tente novamente.
              </p>
            </div>
            <button type="button" (click)="carregarDados()" class="mt-2 inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs cursor-pointer">
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
              <p class="text-xs sm:text-sm text-siage-text-secondary">Ainda não existem professores cadastrados nestas modalidades.</p>
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
            <table 
              mat-table 
              [dataSource]="paginatedItems()" 
              matSort 
              [matSortActive]="sortState().active" 
              [matSortDirection]="sortState().direction"
              (matSortChange)="onSortChange($event)"
              class="w-full font-sans"
            >
              
              <!-- Coluna Servidor (Nome + CPF unificados) -->
              <ng-container matColumnDef="servidor">
                <th mat-header-cell *matHeaderCellDef mat-sort-header class="text-left font-sans font-semibold text-xs text-siage-text-secondary py-3.5 pl-4 pr-3 min-w-[260px]">
                  Servidor
                </th>
                <td mat-cell *matCellDef="let row" class="text-left py-3.5 pl-4 pr-3 break-words">
                  <div class="flex flex-col gap-0.5">
                    <span class="font-sans text-sm font-medium text-siage-text-primary leading-tight">{{ row.nome }}</span>
                    <span class="font-mono text-xs text-siage-text-secondary leading-normal">CPF: {{ row.cpf }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Coluna Matrícula -->
              <ng-container matColumnDef="matricula">
                <th mat-header-cell *matHeaderCellDef mat-sort-header class="text-left font-sans font-semibold text-xs text-siage-text-secondary py-3.5 px-3 w-[110px] min-w-[100px]">
                  Matrícula
                </th>
                <td mat-cell *matCellDef="let row" class="text-left font-mono text-siage-text-primary py-3.5 px-3 text-sm whitespace-nowrap">
                  {{ row.matricula }}
                </td>
              </ng-container>

              <!-- Coluna Tipo de Professor (Texto simples, sem badges ou cores) -->
              <ng-container matColumnDef="tipo">
                <th mat-header-cell *matHeaderCellDef mat-sort-header class="text-left font-sans font-semibold text-xs text-siage-text-secondary py-3.5 px-2.5 w-[14%] min-w-[130px]">
                  Tipo de Professor
                </th>
                <td mat-cell *matCellDef="let row" class="text-left font-sans text-siage-text-primary py-3.5 px-2.5 text-sm leading-normal break-words">
                  {{ getTipoDesc(row.tipo) }}
                </td>
              </ng-container>

              <!-- Coluna Secretaria -->
              <ng-container matColumnDef="secretaria">
                <th mat-header-cell *matHeaderCellDef class="text-left font-sans font-semibold text-xs text-siage-text-secondary py-3.5 px-2.5 w-[16%] min-w-[150px]">
                  Secretaria
                </th>
                <td mat-cell *matCellDef="let row" class="text-left font-sans text-siage-text-primary py-3.5 px-2.5 text-sm leading-normal break-words">
                  {{ row.secretaria }}
                </td>
              </ng-container>

              <!-- Coluna Unidade de Trabalho -->
              <ng-container matColumnDef="utb">
                <th mat-header-cell *matHeaderCellDef class="text-left font-sans font-semibold text-xs text-siage-text-secondary py-3.5 px-2.5 min-w-[170px]">
                  Unidade de Trabalho
                </th>
                <td mat-cell *matCellDef="let row" class="text-left font-sans text-siage-text-primary py-3.5 px-2.5 text-sm leading-normal break-words">
                  {{ row.utb }}
                </td>
              </ng-container>

              <!-- Coluna Situação -->
              <ng-container matColumnDef="situacao">
                <th mat-header-cell *matHeaderCellDef class="text-center font-sans font-semibold text-xs text-siage-text-secondary py-3.5 px-3 w-28">
                  Situação
                </th>
                <td mat-cell *matCellDef="let row" class="text-center py-3.5 px-3 w-28">
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
                <th mat-header-cell *matHeaderCellDef class="text-center font-sans font-semibold text-xs text-siage-text-secondary py-3.5 px-2 w-24">
                  Em uso
                </th>
                <td mat-cell *matCellDef="let row" class="text-center py-3.5 px-2 w-24">
                  @if (row.exibindoEmUsoIndicator) {
                    <button 
                      type="button"
                      (click)="onVerDetalhesEmUso(row)"
                      matTooltip="Ver vínculos de uso" 
                      aria-label="Ver vínculos de uso"
                      class="w-10 h-10 inline-flex items-center justify-center rounded-lg text-siage-primary hover:bg-siage-primary/10 transition-colors cursor-pointer mx-auto focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-siage-primary/40"
                    >
                      <mat-icon style="font-size: 20px; width: 20px; height: 20px;">link</mat-icon>
                    </button>
                  } @else {
                    <span class="text-sm text-siage-text-secondary/50 select-none inline-block">—</span>
                  }
                </td>
              </ng-container>

              <!-- Coluna Ações -->
              <ng-container matColumnDef="acoes">
                <th mat-header-cell *matHeaderCellDef class="text-center font-sans font-semibold text-xs text-siage-text-secondary py-3.5 px-3 w-48">
                  Ações
                </th>
                <td mat-cell *matCellDef="let row" class="text-center py-3.5 px-3 w-48">
                  <div class="flex items-center justify-center gap-1 mx-auto">
                    
                    <!-- Visualizar -->
                    <button 
                      type="button"
                      (click)="onVisualizar(row)" 
                      matTooltip="Visualizar" 
                      aria-label="Visualizar professor"
                      class="w-10 h-10 inline-flex items-center justify-center rounded-lg text-siage-text-secondary hover:text-siage-primary hover:bg-siage-primary/8 dark:hover:bg-siage-primary/12 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                    >
                      <mat-icon style="font-size: 20px; width: 20px; height: 20px;">visibility</mat-icon>
                    </button>
                    
                    <!-- Editar -->
                    <button 
                      type="button"
                      (click)="onEditar(row)" 
                      matTooltip="Editar" 
                      aria-label="Editar professor"
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
                        aria-label="Ativar ou inativar professor"
                        class="scale-90"
                      >
                      </mat-slide-toggle>
                    </div>

                    <!-- Ver Justificativa (Apenas quando Inativo) -->
                    @if (!row.ativo) {
                      <button 
                        type="button"
                        (click)="onVerJustificativa(row)" 
                        matTooltip="Ver justificativa" 
                        aria-label="Ver justificativa da inativação"
                        class="w-10 h-10 inline-flex items-center justify-center rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
                      >
                        <mat-icon style="font-size: 20px; width: 20px; height: 20px;">comment</mat-icon>
                      </button>
                    }

                    <!-- Excluir -->
                    <button 
                      type="button"
                      (click)="onExcluir(row)" 
                      matTooltip="Excluir" 
                      aria-label="Excluir professor"
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

  readonly displayedColumns = ['servidor', 'matricula', 'tipo', 'secretaria', 'utb', 'situacao', 'emUso', 'acoes'];

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
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatCardModule,
    MatRadioModule,
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
            <button 
              type="button"
              (click)="onToggleEdit()" 
              class="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">edit</mat-icon>
              <span>Editar</span>
            </button>
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
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  [class]="currentItem()?.ativo 
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-500/20' 
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 border border-slate-300/40'"
                >
                  {{ currentItem()?.ativo ? 'Ativo' : 'Inativo' }}
                </span>
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
                      <button type="button" (click)="onVisualizarAnexo(anexo)" matTooltip="Visualizar anexo" class="w-8 h-8 rounded text-siage-text-secondary hover:text-siage-primary flex items-center justify-center">
                        <mat-icon style="font-size: 18px; width: 18px; height: 18px;">visibility</mat-icon>
                      </button>
                      <button type="button" (click)="onDownloadAnexo(anexo)" matTooltip="Baixar arquivo" class="w-8 h-8 rounded text-siage-text-secondary hover:text-siage-primary flex items-center justify-center">
                        <mat-icon style="font-size: 18px; width: 18px; height: 18px;">download</mat-icon>
                      </button>
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
                <mat-radio-group formControlName="tipo" (change)="onRadioTipoChange($event.value)" class="flex flex-col sm:flex-row gap-4 sm:gap-8">
                  <mat-radio-button value="MILITAR">
                    <span class="text-sm font-medium">Professor Militar</span>
                  </mat-radio-button>
                  <mat-radio-button value="EMERGENCIAL">
                    <span class="text-sm font-medium">Professor em contratação emergencial</span>
                  </mat-radio-button>
                  <mat-radio-button value="BASE_TECNICA">
                    <span class="text-sm font-medium">Professor da Base Técnica</span>
                  </mat-radio-button>
                </mat-radio-group>
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
                <label for="form-cpf" class="siage-field-label">
                  <span>CPF</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                @if (isEditMode()) {
                  <div class="h-[56px] px-4 flex items-center bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-lg text-sm text-siage-text-secondary font-mono cursor-not-allowed select-none">
                    <span class="font-normal text-siage-text-secondary">{{ form.controls.cpf.value }}</span>
                  </div>
                  <div class="min-h-[1.35rem] mt-[0.15rem]" aria-hidden="true"></div>
                } @else {
                  <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                    <input 
                      matInput 
                      id="form-cpf"
                      type="text" 
                      maxlength="14"
                      formControlName="cpf"
                      placeholder="000.000.000-00" 
                      (input)="onCpfInput($event)"
                      class="font-mono text-sm"
                    />
                    @if (form.get('cpf')?.hasError('required') && form.get('cpf')?.touched) {
                      <mat-error>CPF é obrigatório.</mat-error>
                    } @else if (form.get('cpf')?.hasError('cpfInvalido') && form.get('cpf')?.touched) {
                      <mat-error>Informe um CPF válido (11 dígitos).</mat-error>
                    } @else if (form.get('cpf')?.hasError('duplicado') && form.get('cpf')?.touched) {
                      <mat-error>Já existe um professor cadastrado com este CPF.</mat-error>
                    }
                  </mat-form-field>
                }
              </div>

              <!-- Matrícula -->
              <div class="col-span-1 sm:col-span-1 lg:col-span-4 form-field-group">
                <label for="form-matricula" class="siage-field-label">
                  <span>Matrícula</span>
                  @if (isTipoMilitar() && !isEditMode()) {
                    <span class="text-red-500 font-bold">*</span>
                  }
                </label>
                @if (isEditMode()) {
                  <div class="h-[56px] px-4 flex items-center bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-lg text-sm text-siage-text-secondary font-mono cursor-not-allowed select-none">
                    <span class="font-normal text-siage-text-secondary">{{ form.controls.matricula.value || 'Não informada' }}</span>
                  </div>
                  <div class="min-h-[1.35rem] mt-[0.15rem]" aria-hidden="true"></div>
                } @else if (isTipoMilitar()) {
                  <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                    <input 
                      matInput 
                      id="form-matricula"
                      type="text" 
                      maxlength="7"
                      formControlName="matricula"
                      placeholder="Digite a matrícula" 
                      (input)="onMatriculaInput($event)"
                      class="font-mono text-sm"
                    />
                    @if (form.get('matricula')?.hasError('required') && form.get('matricula')?.touched) {
                      <mat-error>Matrícula é obrigatória para Professor Militar.</mat-error>
                    } @else if (form.get('matricula')?.hasError('duplicado') && form.get('matricula')?.touched) {
                      <mat-error>Já existe um registro cadastrado para a matrícula informada.</mat-error>
                    }
                  </mat-form-field>
                } @else {
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
                <label for="form-nome" class="siage-field-label">
                  <span>Nome do(a) Servidor(a)</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="form-nome"
                    type="text" 
                    maxlength="200"
                    formControlName="nome"
                    placeholder="Digite o nome completo do servidor" 
                    (blur)="onNomeBlur()"
                    class="text-sm font-medium"
                  />
                  <mat-hint align="end" class="text-xs text-siage-text-secondary/70">
                    {{ (form.get('nome')?.value || '').length }} de 200
                  </mat-hint>
                  @if (form.get('nome')?.hasError('required') && form.get('nome')?.touched) {
                    <mat-error>Nome do(a) servidor(a) é obrigatório.</mat-error>
                  }
                </mat-form-field>
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
                <label for="form-rg" class="siage-field-label">
                  <span>RG</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="form-rg" 
                    type="text" 
                    maxlength="15" 
                    formControlName="rg" 
                    placeholder="Digite o RG" 
                    (input)="onRgInput($event)"
                    class="text-sm font-mono" 
                  />
                  @if (form.get('rg')?.hasError('required') && form.get('rg')?.touched) {
                    <mat-error>RG é obrigatório.</mat-error>
                  } @else if ((form.get('rg')?.hasError('minlength') || form.get('rg')?.hasError('maxlength')) && form.get('rg')?.touched) {
                    <mat-error>RG deve conter entre 7 e 15 dígitos.</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Órgão Emissor -->
              <div class="col-span-1 sm:col-span-1 lg:col-span-2 form-field-group">
                <label for="form-emissor" class="siage-field-label">
                  <span>Órgão Emissor</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="form-emissor" 
                    type="text" 
                    maxlength="5" 
                    formControlName="orgaoEmissor" 
                    placeholder="Ex.: SSP" 
                    (input)="onOrgaoEmissorInput($event)"
                    class="text-sm uppercase" 
                  />
                  @if (form.get('orgaoEmissor')?.hasError('required') && form.get('orgaoEmissor')?.touched) {
                    <mat-error>Órgão emissor é obrigatório.</mat-error>
                  } @else if (form.get('orgaoEmissor')?.hasError('minlength') && form.get('orgaoEmissor')?.touched) {
                    <mat-error>O campo deve ter no mínimo 2 caracteres.</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- UF do RG -->
              <div class="col-span-1 sm:col-span-1 lg:col-span-2 form-field-group">
                <label for="form-ufrg" class="siage-field-label">
                  <span>UF</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <mat-select formControlName="ufRg" id="form-ufrg" class="text-sm" placeholder="Selecione">
                    @for (uf of listaUfs; track uf.sigla) {
                      <mat-option [value]="uf.sigla">{{ uf.nome }}</mat-option>
                    }
                  </mat-select>
                  @if (form.get('ufRg')?.hasError('required') && form.get('ufRg')?.touched) {
                    <mat-error>UF é obrigatória.</mat-error>
                  }
                </mat-form-field>
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
                <label for="form-pispasep" class="siage-field-label">
                  <span>PIS/PASEP</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="form-pispasep" 
                    type="text" 
                    maxlength="14" 
                    formControlName="pisPasep" 
                    placeholder="000.00000.00-0" 
                    (input)="onPisInput($event)"
                    class="font-mono text-sm" 
                  />
                  @if (form.get('pisPasep')?.hasError('required') && form.get('pisPasep')?.touched) {
                    <mat-error>PIS/PASEP é obrigatório.</mat-error>
                  } @else if (form.get('pisPasep')?.hasError('pisInvalido') && form.get('pisPasep')?.touched) {
                    <mat-error>PIS/PASEP deve conter 11 dígitos.</mat-error>
                  }
                </mat-form-field>
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
                <label for="form-situacao-funcional" class="siage-field-label">
                  <span>Situação Funcional</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <mat-select formControlName="situacaoFuncional" id="form-situacao-funcional" class="text-sm" placeholder="Selecione">
                    @for (opt of situacaoFuncionalOpcoes(); track opt) {
                      <mat-option [value]="opt">{{ opt }}</mat-option>
                    }
                  </mat-select>
                  @if (form.get('situacaoFuncional')?.hasError('required') && form.get('situacaoFuncional')?.touched) {
                    <mat-error>Situação funcional é obrigatória.</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Regime -->
              <div class="form-field-group">
                <label for="form-regime" class="siage-field-label">
                  <span>Regime</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <mat-select formControlName="regime" id="form-regime" class="text-sm" placeholder="Selecione">
                    @for (opt of regimeOpcoes(); track opt) {
                      <mat-option [value]="opt">{{ opt }}</mat-option>
                    }
                  </mat-select>
                  @if (form.get('regime')?.hasError('required') && form.get('regime')?.touched) {
                    <mat-error>Regime é obrigatório.</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Cargo -->
              <div class="form-field-group">
                <label for="form-cargo" class="siage-field-label">
                  <span>Cargo</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <mat-select formControlName="cargo" id="form-cargo" class="text-sm" placeholder="Selecione">
                    @for (opt of cargoOpcoes(); track opt) {
                      <mat-option [value]="opt">{{ opt }}</mat-option>
                    }
                  </mat-select>
                  @if (form.get('cargo')?.hasError('required') && form.get('cargo')?.touched) {
                    <mat-error>Cargo é obrigatório.</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Cargo Comissionado -->
              <div class="form-field-group">
                <label for="form-cargocomiss" class="siage-field-label">
                  <span>Cargo Comissionado</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <mat-select formControlName="cargoComissionado" id="form-cargocomiss" class="text-sm" placeholder="Selecione">
                    @for (opt of cargoComissionadoOpcoes(); track opt) {
                      <mat-option [value]="opt">{{ opt }}</mat-option>
                    }
                  </mat-select>
                  @if (form.get('cargoComissionado')?.hasError('required') && form.get('cargoComissionado')?.touched) {
                    <mat-error>Cargo comissionado é obrigatório.</mat-error>
                  }
                </mat-form-field>
              </div>
            </div>

            <!-- Linha 2: Forma de Admissão, Grau de Instrução, Área de Formação, UTB (4 colunas) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3 items-start">
              <!-- Forma de Admissão -->
              <div class="form-field-group">
                <label for="form-admissao" class="siage-field-label">
                  <span>Forma de Admissão</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <mat-select formControlName="formaAdmissao" id="form-admissao" class="text-sm" placeholder="Selecione">
                    @for (opt of formaAdmissaoOpcoes(); track opt) {
                      <mat-option [value]="opt">{{ opt }}</mat-option>
                    }
                  </mat-select>
                  @if (form.get('formaAdmissao')?.hasError('required') && form.get('formaAdmissao')?.touched) {
                    <mat-error>Forma de admissão é obrigatória.</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Grau de Instrução -->
              <div class="form-field-group">
                <label for="form-instrucao" class="siage-field-label">
                  <span>Grau de Instrução</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <mat-select formControlName="instrucao" id="form-instrucao" class="text-sm" placeholder="Selecione">
                    @for (opt of grauInstrucaoOpcoes(); track opt) {
                      <mat-option [value]="opt">{{ opt }}</mat-option>
                    }
                  </mat-select>
                  @if (form.get('instrucao')?.hasError('required') && form.get('instrucao')?.touched) {
                    <mat-error>Instrução é obrigatória.</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Área de Formação -->
              <div class="form-field-group">
                <label for="form-formacao" class="siage-field-label">
                  <span>Área de Formação</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <mat-select formControlName="formacao" id="form-formacao" class="text-sm" placeholder="Selecione">
                    @for (opt of areaFormacaoOpcoes; track opt) {
                      <mat-option [value]="opt">{{ opt }}</mat-option>
                    }
                  </mat-select>
                  @if (form.get('formacao')?.hasError('required') && form.get('formacao')?.touched) {
                    <mat-error>Formação acadêmica é obrigatória.</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Unidade de Trabalho (UTB) -->
              <div class="form-field-group">
                <label for="form-utb" class="siage-field-label">
                  <span>Unidade de Trabalho (UTB)</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <mat-select formControlName="utb" id="form-utb" class="text-sm" placeholder="Selecione">
                    @for (opt of utbOpcoes; track opt) {
                      <mat-option [value]="opt">{{ opt }}</mat-option>
                    }
                  </mat-select>
                  @if (form.get('utb')?.hasError('required') && form.get('utb')?.touched) {
                    <mat-error>Unidade de trabalho é obrigatória.</mat-error>
                  }
                </mat-form-field>
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
                  <label for="form-email-inst" class="siage-field-label">
                    <span>E-mail Institucional</span>
                  </label>
                  <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                    <input matInput id="form-email-inst" type="email" maxlength="200" formControlName="emailInstitucional" placeholder="servidor@see.pb.gov.br" (blur)="onEmailBlur('emailInstitucional')" class="text-sm" />
                    @if (form.get('emailInstitucional')?.hasError('emailInvalido') && form.get('emailInstitucional')?.touched) {
                      <mat-error>E-mail não atende aos critérios mínimos exigidos.</mat-error>
                    }
                  </mat-form-field>
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
                  <label for="form-email-inst" class="siage-field-label">
                    <span>E-mail Institucional</span>
                  </label>
                  <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                    <input matInput id="form-email-inst" type="email" maxlength="200" formControlName="emailInstitucional" placeholder="servidor@see.pb.gov.br" (blur)="onEmailBlur('emailInstitucional')" class="text-sm" />
                    @if (form.get('emailInstitucional')?.hasError('emailInvalido') && form.get('emailInstitucional')?.touched) {
                      <mat-error>E-mail não atende aos critérios mínimos exigidos.</mat-error>
                    }
                  </mat-form-field>
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
                <label for="form-sexo" class="siage-field-label">
                  <span>Sexo</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <mat-select formControlName="sexo" id="form-sexo" class="text-sm" placeholder="Selecione">
                    <mat-option value="Feminino">Feminino</mat-option>
                    <mat-option value="Masculino">Masculino</mat-option>
                  </mat-select>
                  @if (form.get('sexo')?.hasError('required') && form.get('sexo')?.touched) {
                    <mat-error>Sexo é obrigatório.</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Telefone -->
              <div class="form-field-group">
                <label for="form-telefone" class="siage-field-label">
                  <span>Telefone</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="form-telefone"
                    type="text" 
                    maxlength="15" 
                    formControlName="telefone"
                    placeholder="(83) 90000-0000" 
                    (input)="onTelefoneInput($event)"
                    class="font-mono text-sm"
                  />
                  @if (form.get('telefone')?.hasError('required') && form.get('telefone')?.touched) {
                    <mat-error>Telefone é obrigatório.</mat-error>
                  } @else if (form.get('telefone')?.hasError('telefoneInvalido') && form.get('telefone')?.touched) {
                    <mat-error>Telefone deve conter 10 ou 11 dígitos.</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- E-mail Pessoal -->
              <div class="form-field-group">
                <label for="form-email-pessoal" class="siage-field-label">
                  <span>E-mail Pessoal</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input matInput id="form-email-pessoal" type="email" maxlength="200" formControlName="emailPessoal" placeholder="exemplo@gmail.com" (blur)="onEmailBlur('emailPessoal')" class="text-sm" />
                  @if (form.get('emailPessoal')?.hasError('required') && form.get('emailPessoal')?.touched) {
                    <mat-error>E-mail pessoal é obrigatório.</mat-error>
                  } @else if (form.get('emailPessoal')?.hasError('emailInvalido') && form.get('emailPessoal')?.touched) {
                    <mat-error>E-mail não atende aos critérios mínimos exigidos.</mat-error>
                  }
                </mat-form-field>
              </div>
            </div>

            <!-- Abaixo: Filiação - Nome da Mãe e Nome do Pai lado a lado (Condicional: Não exibir para Militar) -->
            @if (!isTipoMilitar()) {
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 items-start">
                <!-- Nome da Mãe -->
                <div class="form-field-group">
                  <label for="form-nome-mae" class="siage-field-label">Nome da Mãe</label>
                  <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                    <input matInput id="form-nome-mae" type="text" maxlength="200" formControlName="nomeMae" placeholder="Nome completo da mãe" class="text-sm" />
                  </mat-form-field>
                </div>

                <!-- Nome do Pai -->
                <div class="form-field-group">
                  <label for="form-nome-pai" class="siage-field-label">Nome do Pai</label>
                  <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                    <input matInput id="form-nome-pai" type="text" maxlength="200" formControlName="nomePai" placeholder="Nome completo do pai" class="text-sm" />
                  </mat-form-field>
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
                <label for="form-cep" class="siage-field-label">
                  <span>CEP</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="form-cep"
                    type="text" 
                    maxlength="9"
                    formControlName="cep"
                    placeholder="00000-000" 
                    (input)="onCepInput($event)"
                    (blur)="onCepBlur()"
                    class="font-mono text-sm"
                  />
                  @if (form.get('cep')?.hasError('required') && form.get('cep')?.touched) {
                    <mat-error>CEP é obrigatório.</mat-error>
                  } @else if (form.get('cep')?.hasError('cepIncompleto') && form.get('cep')?.touched) {
                    <mat-error>CEP deve conter 8 dígitos.</mat-error>
                  }
                </mat-form-field>
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
                <label for="form-municipio" class="siage-field-label">
                  <span>Município</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <mat-select formControlName="municipio" id="form-municipio" class="text-sm" placeholder="Selecione">
                    @for (cid of municipiosDisponiveis(); track cid) {
                      <mat-option [value]="cid">{{ cid }}</mat-option>
                    }
                  </mat-select>
                  @if (form.get('municipio')?.hasError('required') && form.get('municipio')?.touched) {
                    <mat-error>Município é obrigatório.</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="col-span-1 sm:col-span-4 form-field-group">
                <label for="form-bairro" class="siage-field-label">
                  <span>Bairro</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input matInput id="form-bairro" type="text" formControlName="bairro" placeholder="Nome do bairro" class="text-sm" />
                  @if (form.get('bairro')?.hasError('required') && form.get('bairro')?.touched) {
                    <mat-error>Bairro é obrigatório.</mat-error>
                  }
                </mat-form-field>
              </div>
            </div>

            <!-- Linha 2: Rua / Logradouro (6 cols / 50%), Número (2 cols), Complemento (4 cols) -->
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-x-4 gap-y-3 items-start">
              <div class="col-span-1 sm:col-span-6 form-field-group">
                <label for="form-rua" class="siage-field-label">
                  <span>Rua / Logradouro</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input matInput id="form-rua" type="text" formControlName="rua" placeholder="Avenida, Rua, Travessa..." class="text-sm" />
                  @if (form.get('rua')?.hasError('required') && form.get('rua')?.touched) {
                    <mat-error>Rua é obrigatória.</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="col-span-1 sm:col-span-2 form-field-group">
                <label for="form-numero" class="siage-field-label">
                  <span>Número</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="form-numero" 
                    type="text" 
                    maxlength="5" 
                    formControlName="numero" 
                    placeholder="Digite o número" 
                    (input)="onNumeroInput($event)"
                    class="text-sm font-mono" 
                  />
                  @if (form.get('numero')?.hasError('required') && form.get('numero')?.touched) {
                    <mat-error>Número é obrigatório.</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="col-span-1 sm:col-span-4 form-field-group">
                <label for="form-complemento" class="siage-field-label">
                  <span>Complemento</span>
                  <span class="text-red-500 font-bold">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input matInput id="form-complemento" type="text" maxlength="200" formControlName="complemento" placeholder="Apartamento, bloco, ponto de referência..." class="text-sm" />
                  @if (form.get('complemento')?.hasError('required') && form.get('complemento')?.touched) {
                    <mat-error>Complemento é obrigatório.</mat-error>
                  }
                </mat-form-field>
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
                <button 
                  type="button" 
                  (click)="fileInput.click()" 
                  [disabled]="anexosList().length >= 5"
                  class="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-siage-primary/10 hover:bg-siage-primary/20 text-siage-primary font-sans font-semibold text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <mat-icon style="font-size: 18px; width: 18px; height: 18px;">add</mat-icon>
                  <span>Adicionar anexo</span>
                </button>
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
                      <button type="button" (click)="onVisualizarAnexo(anexo)" matTooltip="Visualizar anexo" class="w-8 h-8 rounded text-siage-text-secondary hover:text-siage-primary flex items-center justify-center">
                        <mat-icon style="font-size: 18px; width: 18px; height: 18px;">visibility</mat-icon>
                      </button>
                      <button type="button" (click)="onDownloadAnexo(anexo)" matTooltip="Baixar arquivo" class="w-8 h-8 rounded text-siage-text-secondary hover:text-siage-primary flex items-center justify-center">
                        <mat-icon style="font-size: 18px; width: 18px; height: 18px;">download</mat-icon>
                      </button>
                      
                      <!-- Exclusão: Permitida no cadastro para todos; na edição somente para anexos novos adicionados agora -->
                      @if (!isEditMode() || anexo.isNovo) {
                        <button type="button" (click)="removerAnexo(anexo.id)" matTooltip="Remover anexo" class="w-8 h-8 rounded text-siage-text-secondary hover:text-red-500 flex items-center justify-center">
                          <mat-icon style="font-size: 18px; width: 18px; height: 18px;">delete</mat-icon>
                        </button>
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
              <button 
                type="button" 
                (click)="onCancelar()" 
                [disabled]="isSaving()"
                class="h-10 px-5 rounded-lg border border-siage-border font-sans font-medium text-sm text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>

              <button 
                type="submit" 
                [disabled]="isSaving()"
                class="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs disabled:opacity-50"
              >
                @if (isSaving()) {
                  <mat-icon class="animate-spin" style="font-size: 18px; width: 18px; height: 18px;">refresh</mat-icon>
                  <span>{{ isEditMode() ? 'Atualizando...' : 'Salvando...' }}</span>
                } @else {
                  <mat-icon style="font-size: 18px; width: 18px; height: 18px;">save</mat-icon>
                  <span>{{ isEditMode() ? 'Atualizar' : 'Salvar' }}</span>
                }
              </button>
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

  // Opções dinâmicas a partir dos serviços (registros ativos, Código SEAD + Descrição)
  readonly situacaoFuncionalOpcoes = computed(() => {
    return this.situacaoFuncionalService.items()
      .filter(item => item.ativo)
      .map(item => `${item.codigo} - ${item.descricao}`);
  });

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
      this.toastService.success(`Download concluído: ${filename}`);
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


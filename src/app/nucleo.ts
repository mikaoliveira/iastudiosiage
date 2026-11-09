import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  Injectable,
  OnInit
} from '@angular/core';
import { Router, ActivatedRoute, CanDeactivateFn } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { SiageDatePickerComponent } from './siage-date-picker';
import { SiagePaginatorComponent } from './siage-paginator';
import { ConfirmacaoDialog, ModalService } from './dialog';
import { ToastService } from './toast';
import { PermissionService } from './permission';
import { AcessoRestritoComponent } from './acesso-restrito';
import { SimulatorService } from './simulator';
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
  SubgerenciaService
} from './subgerencia';
import {
  GerenciaRegionalService
} from './gerencia-regional';
import {
  GerenciaExecutivaService
} from './gerencia-executiva';
import {
  SecretariaExecutivaService
} from './secretaria-executiva';

// ==========================================
// INTERFACES E MODELOS DE NÚCLEO
// ==========================================

export type TipoVinculoSuperior = 'SUBGERENCIA' | 'GERENCIA_REGIONAL';

export interface EnderecoNucleo {
  cep: string;
  municipio: string;
  rua: string;
  numero: string;
  bairro: string;
  complemento?: string;
}

export interface NucleoItem {
  id: string;
  nome: string;
  tipoVinculo: TipoVinculoSuperior;
  unidadeSuperiorId: string;
  unidadeSuperiorNome: string;
  utbCodigo: string;
  utbNome: string;
  criadorEditor: string;
  dataCriacao: string;
  dataAtualizacao?: string;
  status: 'ATIVO' | 'INATIVO';
  endereco: EnderecoNucleo;
  chefeImediato?: ChefeImediatoItem;
  normativaCriacao: NormativaItem;
  normativaExtincao?: NormativaItem;
  historicoAtos?: HistoricoAtoItem[];
}

// ==========================================
// CONSTANTES E AUXILIARES DE ENDEREÇO / CEP
// ==========================================

export function formatarCep(val: string): string {
  const digits = (val || '').replace(/\D/g, '').substring(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.substring(0, 2)}.${digits.substring(2)}`;
  return `${digits.substring(0, 2)}.${digits.substring(2, 5)}-${digits.substring(5, 8)}`;
}

export const CEP_DATABASE: Record<string, {estado: string; municipio: string; rua: string; bairro: string}> = {
  '58040000': { estado: 'PB', municipio: 'João Pessoa', rua: 'Avenida Cabo Branco', bairro: 'Cabo Branco' },
  '58051200': { estado: 'PB', municipio: 'João Pessoa', rua: 'Rua Bancário Sérgio Guerra', bairro: 'Bancários' },
  '58055000': { estado: 'PB', municipio: 'João Pessoa', rua: 'Rua Rejane Freire Correia', bairro: 'Jardim Cidade Universitária' },
  '58030000': { estado: 'PB', municipio: 'João Pessoa', rua: 'Avenida Epitácio Pessoa', bairro: 'Estados' },
  '58013000': { estado: 'PB', municipio: 'João Pessoa', rua: 'Parque Solon de Lucena', bairro: 'Centro' },
  '58400000': { estado: 'PB', municipio: 'Campina Grande', rua: 'Avenida Floriano Peixoto', bairro: 'Centro' },
  '58000000': { estado: 'PB', municipio: 'João Pessoa', rua: 'Rua das Trincheiras', bairro: 'Centro' },
  '58300000': { estado: 'PB', municipio: 'Santa Rita', rua: 'Praça Getúlio Vargas', bairro: 'Centro' },
  '58700000': { estado: 'PB', municipio: 'Patos', rua: 'Rua Epitácio Pessoa', bairro: 'Centro' },
  '58306000': { estado: 'PB', municipio: 'Bayeux', rua: 'Avenida Liberdade', bairro: 'Centro' },
  '58800000': { estado: 'PB', municipio: 'Sousa', rua: 'Rua Coronel José Vicente', bairro: 'Centro' },
  '58900000': { estado: 'PB', municipio: 'Cajazeiras', rua: 'Avenida Presidente João Pessoa', bairro: 'Centro' },
  '58100000': { estado: 'PB', municipio: 'Cabedelo', rua: 'Avenida Pastor Anselmo Silvestre', bairro: 'Centro' },
  '58200000': { estado: 'PB', municipio: 'Guarabira', rua: 'Rua 15 de Novembro', bairro: 'Centro' },
  '58280000': { estado: 'PB', municipio: 'Mamanguape', rua: 'Rua Duque de Caxias', bairro: 'Centro' },
  // Outros estados para verificação de CEP fora da PB
  '50010000': { estado: 'PE', municipio: 'Recife', rua: 'Avenida Rio Branco', bairro: 'Bairro do Recife' },
  '59010000': { estado: 'RN', municipio: 'Natal', rua: 'Avenida Deodoro da Fonseca', bairro: 'Centro' },
  '60010000': { estado: 'CE', municipio: 'Fortaleza', rua: 'Rua Major Facundo', bairro: 'Centro' },
  '01001000': { estado: 'SP', municipio: 'São Paulo', rua: 'Praça da Sé', bairro: 'Sé' },
  '70040000': { estado: 'DF', municipio: 'Brasília', rua: 'Esplanada dos Ministérios', bairro: 'Zona Cívico-Administrativa' }
};

export const MUNICIPIOS_PARAIBA: string[] = [
  'Água Branca', 'Aguiar', 'Alagoa Grande', 'Alagoa Nova', 'Alagoinha', 'Alcantil', 'Algodão de Jandaíra', 'Alhandra',
  'Amparo', 'Aparecida', 'Araçagi', 'Arara', 'Araruna', 'Areia', 'Areia de Baraúnas', 'Areial', 'Aroeiras', 'Assunção',
  'Baía da Traição', 'Bananeiras', 'Baraúna', 'Barra de Santa Rosa', 'Barra de Santana', 'Barra de São Miguel', 'Bayeux',
  'Belém', 'Belém do Brejo do Cruz', 'Bernardino Batista', 'Boa Ventura', 'Boa Vista', 'Bom Jesus', 'Bom Sucesso',
  'Bonito de Santa Fé', 'Boqueirão', 'Borborema', 'Brejo do Cruz', 'Brejo dos Santos', 'Caaporã', 'Cabaceiras',
  'Cabedelo', 'Cachoeira dos Índios', 'Cacimba de Areia', 'Cacimba de Dentro', 'Cacimbas', 'Caiçara', 'Cajazeiras',
  'Cajazeirinhas', 'Caldas Brandão', 'Camalaú', 'Campina Grande', 'Capim', 'Caraúbas', 'Carrapateira', 'Casserengue',
  'Catingueira', 'Catolé do Rocha', 'Caturité', 'Conceição', 'Condado', 'Conde', 'Congo', 'Coremas', 'Coxixola',
  'Cruz do Espírito Santo', 'Cubati', 'Cuité', 'Cuité de Mamanguape', 'Cuitegi', 'Curral de Cima', 'Curral Velho',
  'Damião', 'Desterro', 'Diamante', 'Dona Inês', 'Duas Estradas', 'Emas', 'Esperança', 'Fagundes', 'Frei Martinho',
  'Gado Bravo', 'Guarabira', 'Gurinhém', 'Gurjão', 'Ibiara', 'Igaracy', 'Imaculada', 'Ingá', 'Itabaiana', 'Itaporanga',
  'Itapororoca', 'Itatuba', 'Jacaraú', 'Jericó', 'João Pessoa', 'Juarez Távora', 'Juazeirinho', 'Junco do Seridó',
  'Juripiranga', 'Juru', 'Lagoa', 'Lagoa de Dentro', 'Lagoa Seca', 'Lastro', 'Livramento', 'Logradouro', 'Lucena',
  'Mãe d\'Água', 'Malta', 'Mamanguape', 'Manaíra', 'Marcação', 'Mari', 'Marizópolis', 'Massaranduba', 'Mataraca',
  'Matinhas', 'Mato Grosso', 'Maturéia', 'Mogeiro', 'Montadas', 'Monte Horebe', 'Monteiro', 'Mulungu', 'Natuba',
  'Nazarezinho', 'Nova Floresta', 'Nova Olinda', 'Nova Palmeira', 'Olho d\'Água', 'Olivedos', 'Ouro Velho', 'Parari',
  'Passagem', 'Patos', 'Paulista', 'Pedra Branca', 'Pedra Lavrada', 'Pedras de Fogo', 'Pedro Régis', 'Piancó',
  'Picuí', 'Pilar', 'Pilões', 'Pilõezinhos', 'Pirpirituba', 'Pitimbu', 'Pocinhos', 'Poço Dantas', 'Poço de José de Moura',
  'Pombal', 'Prata', 'Princesa Isabel', 'Puxinanã', 'Queimadas', 'Quixabá', 'Remígio', 'Riachão', 'Riachão do Bacamarte',
  'Riachão do Poço', 'Riacho de Santo Antônio', 'Riacho dos Cavalos', 'Rio Tinto', 'Salgado de São Félix', 'Santa Cecília',
  'Santa Cruz', 'Santa Helena', 'Santa Inês', 'Santa Luzia', 'Santa Rita', 'Santa Teresinha', 'Santana de Mangueira',
  'Santana dos Garrotes', 'Santo André', 'São Bentinho', 'São Bento', 'São Domingos', 'São Domingos do Cariri',
  'São Francisco', 'São João do Cariri', 'São João do Rio do Peixe', 'São João do Tigre', 'São José da Lagoa Tapada',
  'São José de Caiana', 'São José de Espinharas', 'São José de Piranhas', 'São José de Princesa', 'São José do Bonfim',
  'São José do Brejo do Cruz', 'São José do Sabugi', 'São José dos Cordeiros', 'São José dos Ramos', 'São Mamede',
  'São Miguel de Taipu', 'São Sebastião de Lagoa de Roça', 'São Sebastião do Umbuzeiro', 'Sapé', 'Seridó', 'Serra Branca',
  'Serra da Raiz', 'Serra Grande', 'Serra Redonda', 'Serraria', 'Sertãozinho', 'Sobrado', 'Solânea', 'Soledade',
  'Sossêgo', 'Sousa', 'Sumé', 'Tacima', 'Taperoá', 'Tavares', 'Teixeira', 'Tenório', 'Triunfo', 'Uiraúna', 'Umbuzeiro',
  'Várzea', 'Vieirópolis', 'Vista Serrana', 'Zabelê'
];

// ==========================================
// SERVIÇO PRINCIPAL — NÚCLEO
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class NucleoService {
  private readonly subgerService = inject(SubgerenciaService);
  private readonly gerRegService = inject(GerenciaRegionalService);
  private readonly gerExecService = inject(GerenciaExecutivaService);
  private readonly secExecService = inject(SecretariaExecutivaService);
  private readonly secGeralService = inject(SecretariaGeralService);

  // Lista padrão inicial com base nos dados simulados da Subgerência e Gerência Regional
  private readonly defaultNucleos: NucleoItem[] = [
    {
      id: 'nuc-1',
      nome: 'Núcleo de Concursos e Processos Seletivos',
      tipoVinculo: 'SUBGERENCIA',
      unidadeSuperiorId: 'subger-1',
      unidadeSuperiorNome: 'Subgerência de Recrutamento e Seleção de Pessoal',
      utbCodigo: 'UTB-015',
      utbNome: 'UTB-015 - Setor Operacional de Exames',
      criadorEditor: 'Mikael Oliveira',
      dataCriacao: '18/01/2024 09:30',
      dataAtualizacao: '20/04/2024 14:15',
      status: 'ATIVO',
      endereco: {
        cep: '58.040-000',
        municipio: 'João Pessoa',
        rua: 'Avenida Cabo Branco',
        numero: '1200',
        bairro: 'Cabo Branco',
        complemento: 'Sala 104 - Anexo'
      },
      chefeImediato: {
        matricula: '215',
        cpf: '256.377.488-79',
        nome: 'Renato Bezerra da Costa',
        cargo: 'Chefe de Núcleo',
        situacaoFuncional: 'Em exercício',
        atoGovernamental: {
          numero: 'Ato nº 2.340/2024',
          dataPublicacao: '18/01/2024',
          documento: {
            id: 'doc-ato-nuc-1',
            nomeArquivo: 'ato_2340_2024_nomeacao_chefe_concursos.pdf',
            tamanho: '1.4 MB',
            tipo: 'pdf',
            dataUpload: '18/01/2024 10:00'
          }
        }
      },
      normativaCriacao: {
        nome: 'Portaria SEAD nº 105/2023 - Instituição do Núcleo de Concursos',
        numero: '105/2023',
        dataPublicacao: '15/01/2023',
        documento: {
          id: 'doc-norm-cria-nuc-1',
          nomeArquivo: 'portaria_105_2023_nucleo_concursos.pdf',
          tamanho: '2.2 MB',
          tipo: 'pdf',
          dataUpload: '15/01/2023 09:00'
        }
      },
      normativaExtincao: undefined,
      historicoAtos: []
    },
    {
      id: 'nuc-2',
      nome: 'Núcleo Regional de Inspeção Escolar e Acompanhamento Pedagógico',
      tipoVinculo: 'GERENCIA_REGIONAL',
      unidadeSuperiorId: 'gr-1',
      unidadeSuperiorNome: '1ª Gerência Regional de Educação - João Pessoa',
      utbCodigo: 'UTB-011',
      utbNome: 'UTB-011 - Gerência Regional de Educação de João Pessoa (1ª Região)',
      criadorEditor: 'Mikael Oliveira',
      dataCriacao: '19/01/2024 11:00',
      dataAtualizacao: '10/05/2024 16:30',
      status: 'ATIVO',
      endereco: {
        cep: '58.013-000',
        municipio: 'João Pessoa',
        rua: 'Parque Solon de Lucena',
        numero: '350',
        bairro: 'Centro',
        complemento: 'Edifício Regional, 2º Andar'
      },
      chefeImediato: {
        matricula: '218',
        cpf: '123.456.789-01',
        nome: 'Carlos Alberto Mendonça',
        cargo: 'Coordenador Pedagógico Regional',
        situacaoFuncional: 'Em exercício',
        atoGovernamental: {
          numero: 'Ato nº 2.450/2024',
          dataPublicacao: '19/01/2024',
          documento: {
            id: 'doc-ato-nuc-2',
            nomeArquivo: 'ato_2450_2024_nomeacao_inspecao.pdf',
            tamanho: '1.8 MB',
            tipo: 'pdf',
            dataUpload: '19/01/2024 11:30'
          }
        }
      },
      normativaCriacao: {
        nome: 'Decreto Estadual nº 42.200/2023 - Estrutura dos Núcleos Regionais de Educação',
        numero: '42.200',
        dataPublicacao: '10/01/2023',
        documento: {
          id: 'doc-norm-cria-nuc-2',
          nomeArquivo: 'decreto_42200_2023_nucleos_regionais.pdf',
          tamanho: '3.0 MB',
          tipo: 'pdf',
          dataUpload: '10/01/2023 10:00'
        }
      },
      normativaExtincao: undefined,
      historicoAtos: []
    },
    {
      id: 'nuc-3',
      nome: 'Núcleo de Apoio Administrativo e Logístico Regional',
      tipoVinculo: 'GERENCIA_REGIONAL',
      unidadeSuperiorId: 'gr-2',
      unidadeSuperiorNome: 'Gerência Regional de Campina Grande - 3ª Região',
      utbCodigo: 'UTB-013',
      utbNome: 'UTB-013 - Gerência Regional de Educação de Campina Grande (3ª Região)',
      criadorEditor: 'Mikael Oliveira',
      dataCriacao: '20/01/2024 14:00',
      dataAtualizacao: '05/06/2024 17:00',
      status: 'ATIVO',
      endereco: {
        cep: '58.400-000',
        municipio: 'Campina Grande',
        rua: 'Avenida Floriano Peixoto',
        numero: '820',
        bairro: 'Centro',
        complemento: 'Bloco Logístico'
      },
      chefeImediato: {
        matricula: '219',
        cpf: '234.567.890-12',
        nome: 'Helder Bezerra Farias',
        cargo: 'Chefe de Apoio e Logística',
        situacaoFuncional: 'Em exercício',
        atoGovernamental: {
          numero: 'Ato nº 2.510/2024',
          dataPublicacao: '20/01/2024',
          documento: {
            id: 'doc-ato-nuc-3',
            nomeArquivo: 'ato_2510_2024_nomeacao_logistica.pdf',
            tamanho: '1.5 MB',
            tipo: 'pdf',
            dataUpload: '20/01/2024 14:30'
          }
        }
      },
      normativaCriacao: {
        nome: 'Decreto Estadual nº 42.215/2023 - Organização Administrativa das Regionais',
        numero: '42.215',
        dataPublicacao: '12/01/2023',
        documento: {
          id: 'doc-norm-cria-nuc-3',
          nomeArquivo: 'decreto_42215_2023_organizacao.pdf',
          tamanho: '2.7 MB',
          tipo: 'pdf',
          dataUpload: '12/01/2023 11:00'
        }
      },
      normativaExtincao: undefined,
      historicoAtos: []
    }
  ];

  readonly items = signal<NucleoItem[]>(this.loadInitialItems());

  private loadInitialItems(): NucleoItem[] {
    const saved = localStorage.getItem('siage_nucleos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return this.defaultNucleos;
  }

  private persist(items: NucleoItem[]) {
    this.items.set(items);
    localStorage.setItem('siage_nucleos', JSON.stringify(items));
  }

  getItem(id: string): NucleoItem | undefined {
    return this.items().find(i => i.id === id);
  }

  isNomeDuplicado(nome: string, excludeId?: string): boolean {
    const clean = nome.trim().toLowerCase();
    return this.items().some(i => i.nome.trim().toLowerCase() === clean && i.id !== excludeId);
  }

  isUtbEmUso(utbCodigo: string, excludeId?: string): boolean {
    const clean = utbCodigo.trim().toLowerCase();
    // 1. Não pode estar em uso por outro Núcleo ativo
    const emUsoNucleo = this.items().some(i => i.utbCodigo.trim().toLowerCase() === clean && i.status === 'ATIVO' && i.id !== excludeId);
    if (emUsoNucleo) return true;
    // 2. Não pode estar em uso por Subgerência ativa
    const emUsoSubger = this.subgerService.items().some(i => i.utbCodigo.trim().toLowerCase() === clean && i.status === 'ATIVO');
    if (emUsoSubger) return true;
    // 3. Não pode estar em uso por Gerência Regional ativa
    const emUsoGerReg = this.gerRegService.items().some(i => i.utbCodigo.trim().toLowerCase() === clean && i.status === 'ATIVO');
    if (emUsoGerReg) return true;
    // 4. Não pode estar em uso por Gerência Executiva ativa
    const emUsoGerExec = this.gerExecService.items().some(i => i.utbCodigo.trim().toLowerCase() === clean && i.status === 'ATIVO');
    if (emUsoGerExec) return true;
    // 5. Não pode estar em uso por Secretaria Executiva ativa
    const emUsoSecExec = this.secExecService.items().some(i => i.utbCodigo.trim().toLowerCase() === clean && i.status === 'ATIVO');
    if (emUsoSecExec) return true;
    // 6. Não pode estar em uso por Secretaria Geral ativa
    const emUsoSecGeral = this.secGeralService.items().some(i => i.utbCodigo.trim().toLowerCase() === clean && i.status === 'ATIVO');
    return emUsoSecGeral;
  }

  add(item: Omit<NucleoItem, 'id' | 'criadorEditor' | 'dataCriacao'>): NucleoItem {
    const agora = new Date();
    const dataCriacao = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const id = `nuc-${Date.now()}`;

    const novoItem: NucleoItem = {
      ...item,
      id,
      criadorEditor: 'Mikael Oliveira',
      dataCriacao,
      status: 'ATIVO',
      historicoAtos: item.historicoAtos || []
    };

    const atual = [novoItem, ...this.items()];
    this.persist(atual);
    return novoItem;
  }

  update(id: string, changes: Partial<NucleoItem>): void {
    const agora = new Date();
    const dataAtualizacao = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const atual = this.items().map(item => {
      if (item.id !== id) return item;

      const novoHistorico = changes.historicoAtos 
        ? [...changes.historicoAtos] 
        : (item.historicoAtos ? [...item.historicoAtos] : []);

      if (
        item.chefeImediato && 
        item.chefeImediato.atoGovernamental?.documento &&
        (!changes.chefeImediato || changes.chefeImediato.matricula !== item.chefeImediato.matricula || changes.chefeImediato.atoGovernamental.numero !== item.chefeImediato.atoGovernamental.numero)
      ) {
        const anterior = item.chefeImediato;
        const jaConsta = novoHistorico.some(h => h.numero === anterior.atoGovernamental.numero && h.chefeImediato === anterior.nome);
        if (!jaConsta && anterior.atoGovernamental.documento) {
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

      return {
        ...item,
        ...changes,
        historicoAtos: novoHistorico,
        criadorEditor: 'Mikael Oliveira',
        dataAtualizacao
      };
    });

    this.persist(atual);
  }

  getHistoricoAtos(nucleoId?: string, atoAtual?: AtoGovernamental, nomeChefeAtual?: string): HistoricoAtoItem[] {
    const list: HistoricoAtoItem[] = [];

    // Inclui ato vigente se fornecido e completo
    if (atoAtual && atoAtual.numero && atoAtual.documento) {
      list.push({
        id: `hist-nuc-atual-${nucleoId || 'new'}`,
        numero: atoAtual.numero,
        chefeImediato: nomeChefeAtual || 'Chefe Imediato Vigente',
        dataPublicacao: atoAtual.dataPublicacao || '17/01/2024',
        dataImportacao: atoAtual.documento.dataUpload || '17/01/2024 10:30',
        responsavelImportacao: 'Mikael Oliveira',
        documento: atoAtual.documento
      });
    }

    if (nucleoId) {
      const item = this.getItem(nucleoId);
      if (item?.historicoAtos && item.historicoAtos.length > 0) {
        list.push(...item.historicoAtos);
      }
    }

    return list;
  }

  inativar(id: string, normativaExtincao?: NormativaItem): void {
    const agora = new Date();
    const dataAtualizacao = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const atual = this.items().map(item => {
      if (item.id !== id) return item;
      return {
        ...item,
        status: 'INATIVO' as const,
        normativaExtincao: normativaExtincao || item.normativaExtincao,
        dataAtualizacao
      };
    });

    this.persist(atual);
  }
}

// ==========================================
// TELA 1: LISTAR NÚCLEO
// ==========================================

@Component({
  selector: 'app-nucleo-list',
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
            <span class="text-siage-primary font-semibold" aria-current="page">Configurar Núcleo</span>
          </nav>

          <!-- Título com Botão Voltar -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2 sm:gap-3">
                <button 
                  mat-icon-button 
                  type="button"
                  (click)="goHierarquia()" 
                  class="text-siage-text-secondary hover:text-siage-primary transition-colors cursor-pointer -ml-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                  aria-label="Voltar para Hierarquia de Unidades e Cargos"
                  matTooltip="Voltar para Hierarquia de Unidades e Cargos"
                >
                  <mat-icon style="font-size: 24px; width: 24px; height: 24px;">arrow_back</mat-icon>
                </button>
                <h1 class="text-2xl sm:text-3xl font-poppins font-bold tracking-tight text-siage-text-primary leading-tight">
                  Configurar Núcleo
                </h1>
              </div>

              <p class="text-xs sm:text-sm text-siage-text-secondary font-sans leading-normal pl-8 sm:pl-9 max-w-2xl">
                Gerencie os núcleos subordinados a gerências regionais ou subgerências.
              </p>
            </div>

            <!-- Botão Adicionar Núcleo (alinhado aos padrões SIAGE) -->
            @if (permissionService.canCreate()) {
              <div class="flex items-center shrink-0 pl-8 sm:pl-0">
                <button 
                  type="button" 
                  (click)="onAdicionar()"
                  class="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs hover:shadow cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/50"
                  aria-label="Adicionar Núcleo"
                >
                  <mat-icon style="font-size: 20px; width: 20px; height: 20px;">add</mat-icon>
                  <span>Adicionar</span>
                </button>
              </div>
            }
          </div>
        </div>

        <!-- Seção de Filtros (Card SIAGE Padrão) -->
        <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
          <form [formGroup]="filtroForm" (ngSubmit)="onBuscar()" class="flex flex-col gap-4">
            <span class="text-xs font-semibold text-siage-text-secondary uppercase tracking-wider">Buscar por:</span>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <!-- Filtro: Nome -->
              <div class="form-field-group">
                <label for="filter-nome" class="siage-field-label">Nome</label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="filter-nome"
                    type="text" 
                    formControlName="nome" 
                    maxlength="200"
                    placeholder="Digite o nome do núcleo"
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

              <!-- Filtro: Unidade de Trabalho (UTB) (Select com autocomplete contendo somente UTBs de Núcleos cadastrados) -->
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
                <p class="text-xs sm:text-sm text-siage-text-secondary">Ainda não existem núcleos cadastrados.</p>
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
                        [attr.aria-label]="'Ordenar por Nome do Núcleo ' + (sortColumn() === 'nome' ? (sortDirection() === 'asc' ? 'decrescente' : 'crescente') : 'crescente')"
                      >
                        <span class="transition-colors" [class.text-siage-text-primary]="sortColumn() === 'nome'" [class.text-siage-text-secondary]="sortColumn() !== 'nome'">Nome do Núcleo</span>
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
                            aria-label="Visualizar Núcleo"
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
                              aria-label="Editar Núcleo"
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
                                [attr.aria-label]="item.status === 'ATIVO' ? 'Inativar Núcleo' : 'Ativar Núcleo'"
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
export class NucleoList {
  readonly service = inject(NucleoService);
  readonly router = inject(Router);
  readonly dialog = inject(MatDialog);
  readonly toast = inject(ToastService);
  readonly permissionService = inject(PermissionService);
  readonly simulatorService = inject(SimulatorService);

  readonly filtroForm = new FormGroup({
    nome: new FormControl(''),
    utb: new FormControl(''),
    status: new FormControl('TODOS')
  });

  readonly appliedNome = signal('');
  readonly appliedUtb = signal('');
  readonly appliedStatus = signal('TODOS');

  readonly pageIndex = signal(0);
  readonly sortColumn = signal<'dataCriacao' | 'nome' | 'utb'>('dataCriacao');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  // Valores reativos dos campos de filtro via toSignal
  readonly filtroNomeVal = toSignal(this.filtroForm.controls.nome.valueChanges, { initialValue: '' });
  readonly filtroUtbVal = toSignal(this.filtroForm.controls.utb.valueChanges, { initialValue: '' });
  readonly filtroStatusVal = toSignal(this.filtroForm.controls.status.valueChanges, { initialValue: 'TODOS' });

  // Autocomplete do filtro de UTBs: somente UTBs presentes nos Núcleos cadastrados
  readonly filteredUtbsList = computed(() => {
    const items = this.service.items();
    const map = new Map<string, UtbItem>();
    items.forEach(s => {
      if (s.utbCodigo && !map.has(s.utbCodigo)) {
        map.set(s.utbCodigo, { 
          codigo: s.utbCodigo, 
          nome: s.utbNome.replace(`${s.utbCodigo} - `, ''),
          descricaoCompleta: s.utbNome 
        });
      }
    });
    const list = Array.from(map.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
    const query = (this.filtroUtbVal() || this.filtroForm.controls.utb.value || '').trim().toLowerCase();
    if (!query) return list;
    return list.filter(u => 
      u.codigo.toLowerCase().includes(query) || 
      u.nome.toLowerCase().includes(query) ||
      `${u.codigo} - ${u.nome}`.toLowerCase() === query
    );
  });

  readonly canBuscar = computed(() => {
    const nome = (this.filtroNomeVal() || this.filtroForm.controls.nome.value || '').trim();
    const utb = (this.filtroUtbVal() || this.filtroForm.controls.utb.value || '').trim();
    const status = this.filtroStatusVal() || this.filtroForm.controls.status.value || 'TODOS';
    return nome.length > 0 || utb.length > 0 || status !== 'TODOS';
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
    if (status !== 'TODOS') {
      result = result.filter(item => item.status === status);
    }

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
    this.router.navigate(['/configuracoes/hierarquia/nucleo/novo']);
  }

  onVisualizar(item: NucleoItem) {
    this.router.navigate(['/configuracoes/hierarquia/nucleo', item.id]);
  }

  onEditar(item: NucleoItem) {
    this.router.navigate(['/configuracoes/hierarquia/nucleo', item.id, 'editar']);
  }

  onToggleStatus(item: NucleoItem) {
    if (item.status === 'INATIVO') {
      this.toast.warning('A inativação de um Núcleo é irreversível. O registro não pode ser reativado.');
      return;
    }

    // 1. Confirmação inicial
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
      if (!confirmado) return;

      const temNormativaExtincao = !!item.normativaExtincao?.documento;
      const temChefe = !!item.chefeImediato;

      // 2. Havendo Chefe Imediato, bloqueia com o modal de impedimento
      if (temChefe) {
        this.dialog.open(ImpedimentoInativacaoModal, {
          width: '520px',
          maxWidth: 'calc(100vw - 2.5rem)',
          hasBackdrop: true,
          backdropClass: 'cdk-overlay-dark-backdrop',
          autoFocus: false,
          data: {
            nome: item.nome,
            temNormativaExtincao,
            totalSubordinadas: 0,
            temChefe: true,
            nomeChefe: item.chefeImediato?.nome,
            unidadesDescricao: ''
          }
        });
        return;
      }

      // 3. Sem chefe, se faltar Normativa de Extinção, permite anexar
      if (!temNormativaExtincao) {
        const anexarRef = this.dialog.open(AnexarNormativaExtincaoModal, {
          width: '560px',
          maxWidth: 'calc(100vw - 2.5rem)',
          hasBackdrop: true,
          backdropClass: 'cdk-overlay-dark-backdrop',
          autoFocus: false,
          data: {
            nome: item.nome,
            entidadeTipo: 'Núcleo'
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

      // 4. Sem chefe e com normativa: conclui inativação
      this.service.inativar(item.id);
      this.toast.success('Registro inativado com sucesso.');
    });
  }
}

// ==========================================
// TELA 2 & 4: ADICIONAR E EDITAR NÚCLEO
// ==========================================

@Component({
  selector: 'app-nucleo-form',
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
    SiageDatePickerComponent,
    AcessoRestritoComponent
  ],
  template: `
    @if (!permissionService.hasAccess() || (!isEditMode() && !permissionService.canCreate())) {
      <app-acesso-restrito backUrl="/configuracoes/hierarquia/nucleo" />
    } @else {
      <div class="flex flex-col gap-6 max-w-7xl mx-auto w-full font-sans pb-16">
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
            <span 
              (click)="onCancelar()" 
              (keydown.enter)="onCancelar()" 
              tabindex="0" 
              role="button" 
              class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline"
            >
              Configurar Núcleo
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
                  aria-label="Voltar para a lista de núcleos"
                  matTooltip="Voltar para a lista de núcleos"
                >
                  <mat-icon style="font-size: 24px; width: 24px; height: 24px;">arrow_back</mat-icon>
                </button>
                <h1 class="text-2xl sm:text-3xl font-poppins font-bold tracking-tight text-siage-text-primary leading-tight">
                  {{ isEditMode() ? 'Editar Núcleo' : 'Adicionar Núcleo' }}
                </h1>
              </div>

              <p class="text-xs sm:text-sm text-siage-text-secondary font-sans leading-normal pl-8 sm:pl-9 max-w-2xl">
                {{ isEditMode() ? 'Atualize as informações, endereço, chefia e normativas do Núcleo.' : 'Preencha os campos obrigatórios para estruturar o Núcleo.' }}
              </p>
            </div>
          </div>
        </div>

        <!-- FORMULÁRIO ORGANIZADO EM SEÇÕES -->
        <form [formGroup]="form" class="flex flex-col gap-6">

          <!-- ============================================== -->
          <!-- SEÇÃO 1: IDENTIFICAÇÃO DO NÚCLEO               -->
          <!-- ============================================== -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">domain</mat-icon>
              <span>1. Identificação</span>
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              <!-- Nome do Núcleo -->
              <div class="md:col-span-2 form-field-group">
                <label for="form-nome" class="siage-field-label">
                  Nome do Núcleo <span class="required-marker">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="form-nome"
                    formControlName="nome" 
                    maxlength="200"
                    placeholder="Ex: Núcleo de Concursos e Processos Seletivos"
                  >
                  <mat-hint align="end" class="text-xs text-siage-text-secondary">
                    {{ (form.get('nome')?.value || '').length }} / 200
                  </mat-hint>
                  @if (form.get('nome')?.hasError('required') && form.get('nome')?.touched) {
                    <mat-error>O Nome do Núcleo é obrigatório.</mat-error>
                  }
                  @if (form.get('nome')?.hasError('duplicado')) {
                    <mat-error>Já existe um Núcleo cadastrado com este nome.</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Selecione o vínculo (Gerência Regional ou Subgerência) - ocupa sempre 50% da linha -->
              <div class="form-field-group">
                <label for="form-tipo-vinculo" class="siage-field-label">
                  Selecione o vínculo <span class="required-marker">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <mat-select 
                    id="form-tipo-vinculo"
                    formControlName="tipoVinculo" 
                    placeholder="Selecione"
                    (selectionChange)="onTipoVinculoChange()"
                  >
                    <mat-option value="GERENCIA_REGIONAL">Gerência Regional</mat-option>
                    <mat-option value="SUBGERENCIA">Subgerência</mat-option>
                  </mat-select>
                  @if (form.get('tipoVinculo')?.hasError('required') && form.get('tipoVinculo')?.touched) {
                    <mat-error>O tipo de vínculo é obrigatório.</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Unidade Superior: Sempre visível nos outros 50% (desabilitado se nenhum vínculo selecionado) -->
              @if (!form.get('tipoVinculo')?.value) {
                <div class="form-field-group">
                  <label for="form-unidade-superior-disabled" class="siage-field-label">
                    Unidade Superior <span class="required-marker">*</span>
                  </label>
                  <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                    <input 
                      matInput 
                      id="form-unidade-superior-disabled"
                      type="text" 
                      disabled
                      placeholder="Selecione o vínculo primeiro" 
                      class="text-sm cursor-not-allowed"
                    />
                  </mat-form-field>
                </div>
              } @else if (form.get('tipoVinculo')?.value === 'GERENCIA_REGIONAL') {
                <div class="form-field-group">
                  <label for="form-ger-reg" class="siage-field-label">
                    Gerência Regional <span class="required-marker">*</span>
                  </label>
                  <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                    <input 
                      matInput 
                      id="form-ger-reg"
                      type="text" 
                      [formControl]="gerRegInputControl" 
                      placeholder="Selecione ou busque a Gerência Regional vinculada" 
                      [matAutocomplete]="autoGerReg"
                      #autoGerRegTrigger="matAutocompleteTrigger"
                      (focus)="autoGerRegTrigger.openPanel()"
                      (blur)="onGerRegBlur()"
                      class="text-sm"
                    />
                    <mat-autocomplete #autoGerReg="matAutocomplete" (optionSelected)="onGerRegionalSelected($event.option.value)">
                      @for (gr of filteredGerRegionais(); track gr.id) {
                        <mat-option [value]="gr.id">
                          {{ gr.nome }}
                        </mat-option>
                      }
                    </mat-autocomplete>
                    @if (gerRegInputControl.value) {
                      <button mat-icon-button matSuffix type="button" (click)="limparGerReg()" aria-label="Limpar campo">
                        <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                      </button>
                    } @else {
                      <button mat-icon-button matSuffix type="button" (click)="autoGerRegTrigger.openPanel()" aria-label="Abrir opções">
                        <mat-icon class="text-siage-text-secondary">arrow_drop_down</mat-icon>
                      </button>
                    }
                    @if ((form.get('unidadeSuperiorId')?.hasError('required') || gerRegInputControl.hasError('required') || gerRegInputControl.hasError('invalido')) && (form.get('unidadeSuperiorId')?.touched || gerRegInputControl.touched)) {
                      <mat-error>A Gerência Regional é obrigatória.</mat-error>
                    }
                  </mat-form-field>
                </div>
              } @else if (form.get('tipoVinculo')?.value === 'SUBGERENCIA') {
                <div class="form-field-group">
                  <label for="form-subgerencia" class="siage-field-label">
                    Subgerência <span class="required-marker">*</span>
                  </label>
                  <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                    <input 
                      matInput 
                      id="form-subgerencia"
                      type="text" 
                      [formControl]="subgerInputControl" 
                      placeholder="Selecione ou busque a Subgerência vinculada" 
                      [matAutocomplete]="autoSubger"
                      #autoSubgerTrigger="matAutocompleteTrigger"
                      (focus)="autoSubgerTrigger.openPanel()"
                      (blur)="onSubgerBlur()"
                      class="text-sm"
                    />
                    <mat-autocomplete #autoSubger="matAutocomplete" (optionSelected)="onSubgerenciaSelected($event.option.value)">
                      @for (sub of filteredSubgerencias(); track sub.id) {
                        <mat-option [value]="sub.id">
                          {{ sub.nome }}
                        </mat-option>
                      }
                    </mat-autocomplete>
                    @if (subgerInputControl.value) {
                      <button mat-icon-button matSuffix type="button" (click)="limparSubger()" aria-label="Limpar campo">
                        <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                      </button>
                    } @else {
                      <button mat-icon-button matSuffix type="button" (click)="autoSubgerTrigger.openPanel()" aria-label="Abrir opções">
                        <mat-icon class="text-siage-text-secondary">arrow_drop_down</mat-icon>
                      </button>
                    }
                    @if ((form.get('unidadeSuperiorId')?.hasError('required') || subgerInputControl.hasError('required') || subgerInputControl.hasError('invalido')) && (form.get('unidadeSuperiorId')?.touched || subgerInputControl.touched)) {
                      <mat-error>A Subgerência é obrigatória.</mat-error>
                    }
                  </mat-form-field>
                </div>
              }

              <!-- Unidade de Trabalho (UTB) -->
              <div class="md:col-span-2 form-field-group">
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
                        A Unidade de Trabalho (UTB) não pode ser alterada porque existe chefia vinculada.
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

            <!-- SUBSEÇÃO: ENDEREÇO DO NÚCLEO (OBRIGATÓRIO NO CADASTRO DO NÚCLEO) -->
            <div class="mt-4 pt-4 border-t border-siage-border/40 flex flex-col gap-4">
              <div class="flex items-center gap-2">
                <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-siage-primary">location_on</mat-icon>
                <span class="text-xs font-poppins font-bold uppercase tracking-wider text-siage-primary">
                  Endereço
                </span>
              </div>

              <!-- Grid de Endereço em 3 linhas -->
              <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                <!-- Linha 1: CEP (4 cols) e Município (8 cols) -->
                <div class="col-span-12 md:col-span-4 form-field-group">
                  <label for="form-cep" class="siage-field-label">CEP <span class="required-marker">*</span></label>
                  <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                    <input 
                      matInput 
                      id="form-cep"
                      formControlName="cep" 
                      maxlength="10"
                      placeholder="00.000-000"
                      (input)="onCepInput($event)"
                      (blur)="onCepBlur()"
                      class="text-sm"
                    >
                    @if (form.get('cep')?.value) {
                      <button mat-icon-button matSuffix type="button" (click)="limparCep()" aria-label="Limpar CEP">
                        <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                      </button>
                    }
                    @if (form.get('cep')?.hasError('required') && form.get('cep')?.touched) {
                      <mat-error>O CEP é obrigatório.</mat-error>
                    }
                    @if (form.get('cep')?.hasError('cepIncompleto') && form.get('cep')?.touched) {
                      <mat-error>O CEP informado deve conter exatamente 8 dígitos.</mat-error>
                    }
                    @if (form.get('cep')?.hasError('cepForaPb') && form.get('cep')?.touched) {
                      <mat-error>O CEP preenchido não pertence ao estado da Paraíba. Por favor, informe um CEP vinculado a municípios do Estado da Paraíba.</mat-error>
                    }
                  </mat-form-field>
                  @if (cepFeedback() && !form.get('cep')?.hasError('cepIncompleto') && !form.get('cep')?.hasError('cepForaPb')) {
                    <span 
                      class="text-xs font-medium flex items-center gap-1 mt-1 leading-tight text-amber-600 dark:text-amber-400"
                    >
                      <mat-icon style="font-size: 14px; width: 14px; height: 14px;" class="shrink-0">
                        info
                      </mat-icon>
                      <span>{{ cepFeedback() }}</span>
                    </span>
                  }
                </div>

                <div class="col-span-12 md:col-span-8 form-field-group">
                  <label for="form-municipio" class="siage-field-label">Município <span class="required-marker">*</span></label>
                  <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                    <input 
                      matInput 
                      id="form-municipio"
                      formControlName="municipio" 
                      placeholder="Selecione ou digite o município da Paraíba"
                      [matAutocomplete]="autoMunicipio"
                      #autoMunicipioTrigger="matAutocompleteTrigger"
                      (focus)="autoMunicipioTrigger.openPanel()"
                      class="text-sm"
                    >
                    <mat-autocomplete #autoMunicipio="matAutocomplete">
                      @for (m of filteredMunicipios(); track m) {
                        <mat-option [value]="m">
                          {{ m }}
                        </mat-option>
                      }
                    </mat-autocomplete>
                    @if (form.get('municipio')?.hasError('required') && form.get('municipio')?.touched) {
                      <mat-error>O Município é obrigatório.</mat-error>
                    }
                  </mat-form-field>
                </div>

                <!-- Linha 2: Rua (9 cols) e Número (3 cols) -->
                <div class="col-span-12 md:col-span-9 form-field-group">
                  <label for="form-rua" class="siage-field-label">Rua / Logradouro <span class="required-marker">*</span></label>
                  <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                    <input 
                      matInput 
                      id="form-rua"
                      formControlName="rua" 
                      maxlength="200"
                      placeholder="Ex: Avenida Epitácio Pessoa"
                      class="text-sm"
                    >
                    @if (form.get('rua')?.hasError('required') && form.get('rua')?.touched) {
                      <mat-error>A Rua / Logradouro é obrigatória.</mat-error>
                    }
                  </mat-form-field>
                </div>

                <div class="col-span-12 md:col-span-3 form-field-group">
                  <label for="form-numero" class="siage-field-label">Número <span class="required-marker">*</span></label>
                  <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                    <input 
                      matInput 
                      id="form-numero"
                      formControlName="numero" 
                      maxlength="4"
                      placeholder="Ex: 1200"
                      (input)="onNumeroInput($event)"
                      class="text-sm"
                    >
                    @if (form.get('numero')?.hasError('required') && form.get('numero')?.touched) {
                      <mat-error>O Número é obrigatório.</mat-error>
                    }
                  </mat-form-field>
                </div>

                <!-- Linha 3: Bairro (6 cols) e Complemento (6 cols) -->
                <div class="col-span-12 md:col-span-6 form-field-group">
                  <label for="form-bairro" class="siage-field-label">Bairro <span class="required-marker">*</span></label>
                  <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                    <input 
                      matInput 
                      id="form-bairro"
                      formControlName="bairro" 
                      maxlength="200"
                      placeholder="Ex: Centro"
                      class="text-sm"
                    >
                    @if (form.get('bairro')?.hasError('required') && form.get('bairro')?.touched) {
                      <mat-error>O Bairro é obrigatório.</mat-error>
                    }
                  </mat-form-field>
                </div>

                <div class="col-span-12 md:col-span-6 form-field-group">
                  <label for="form-complemento" class="siage-field-label">Complemento</label>
                  <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                    <input 
                      matInput 
                      id="form-complemento"
                      formControlName="complemento" 
                      maxlength="200"
                      placeholder="Ex: Sala 102, Bloco A"
                      class="text-sm"
                    >
                  </mat-form-field>
                </div>
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
                  [matTooltip]="!form.get('utbCodigo')?.value ? 'Selecione uma UTB para poder vincular um Chefe Imediato' : 'Buscar servidor para chefia'"
                  class="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;">person_add</mat-icon>
                  <span>Adicionar Chefe</span>
                </button>
              }
            </div>

            <!-- Dados do Chefe Imediato Selecionado -->
            @if (chefeImediato(); as chefe) {
              <div class="border border-siage-border rounded-lg p-4 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col gap-4">
                <!-- Cabeçalho do Card de Chefe com Ações -->
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-siage-primary/10 text-siage-primary flex items-center justify-center font-bold font-poppins shrink-0">
                      {{ chefe.nome.charAt(0) }}
                    </div>
                    <div>
                      <span class="text-sm font-semibold text-siage-text-primary block">{{ chefe.nome }}</span>
                      <span class="text-xs text-siage-text-secondary">{{ chefe.cargo }}</span>
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

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Número do Ato -->
                    <div class="form-field-group">
                      <label for="form-ato-num" class="siage-field-label">
                        Número do Ato Governamental <span class="required-marker">*</span>
                      </label>
                      <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                        <input 
                          matInput 
                          id="form-ato-num"
                          [formControl]="atoNumeroControl" 
                          maxlength="20"
                          placeholder="Ex: Ato nº 2.120/2024"
                        >
                        <mat-hint align="end" class="text-xs text-siage-text-secondary">
                          {{ (atoNumeroControl.value || '').length }} / 20
                        </mat-hint>
                        @if (atoNumeroControl.hasError('required') && atoNumeroControl.touched) {
                          <mat-error>O Número do Ato é obrigatório.</mat-error>
                        } @else if (atoNumeroControl.hasError('maxlength') && atoNumeroControl.touched) {
                          <mat-error>O Número do Ato deve ter no máximo 20 caracteres.</mat-error>
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

                  <!-- Upload do Documento do Ato -->
                  <div class="flex flex-col gap-2">
                    <span class="text-xs font-semibold text-siage-text-secondary">
                      Documento do Ato Governamental * (PDF, JPG, JPEG ou PNG até 10 MB)
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
                <!-- Se estiver cadastrando novo Núcleo, exibe campos editáveis -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="md:col-span-3 form-field-group">
                    <label for="form-norm-cria-nome" class="siage-field-label">
                      Nome da Normativa de Criação <span class="required-marker">*</span>
                    </label>
                    <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                      <input 
                        matInput 
                        id="form-norm-cria-nome"
                        [formControl]="normCriacaoNomeControl" 
                        maxlength="100"
                        placeholder="Ex: Portaria SEAD nº 105/2023 - Criação do Núcleo"
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
                    <label for="form-norm-cria-numero" class="siage-field-label">
                      Número da Normativa de Criação <span class="required-marker">*</span>
                    </label>
                    <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                      <input 
                        matInput 
                        id="form-norm-cria-numero"
                        [formControl]="normCriacaoNumeroControl" 
                        maxlength="20"
                        placeholder="Ex: 105/2023"
                      >
                      @if (normCriacaoNumeroControl.hasError('required') && normCriacaoNumeroControl.touched) {
                        <mat-error>O Número da Normativa de Criação é obrigatório.</mat-error>
                      } @else if (normCriacaoNumeroControl.hasError('maxlength') && normCriacaoNumeroControl.touched) {
                        <mat-error>O Número da Normativa de Criação deve ter no máximo 20 caracteres.</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="md:col-span-2 form-field-group">
                    <app-siage-date-picker
                      id="form-norm-cria-data"
                      label="Data da Publicação"
                      [required]="true"
                      [formControl]="normCriacaoDataControl"
                      [control]="normCriacaoDataControl"
                      errorMessage="A Data da Publicação é obrigatória."
                    />
                  </div>

                  <!-- Anexo da Normativa de Criação -->
                  <div class="md:col-span-3 flex flex-col gap-2">
                    <span class="text-xs font-semibold text-siage-text-secondary">
                      Documento da Normativa de Criação * (PDF, JPG, JPEG ou PNG até 10 MB)
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

            <!-- BLOCO 2: NORMATIVA DE EXTINÇÃO (OPCIONAL NO CADASTRO/EDIÇÃO) -->
            <div class="pt-4 border-t border-siage-border/40 flex flex-col gap-4">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-amber-600">history_edu</mat-icon>
                  <span class="text-xs font-poppins font-bold uppercase tracking-wider text-siage-text-primary">
                    Normativa de Extinção
                  </span>
                </div>

                @if (!hasPersistedNormativaExtincao() && !expandindoNormativaExtincao()) {
                  <button 
                    type="button" 
                    (click)="abrirFormularioNormativaExtincao()"
                    class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-siage-primary/10 hover:bg-siage-primary/20 text-siage-primary font-medium text-xs transition-colors cursor-pointer"
                  >
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;">add</mat-icon>
                    <span>Adicionar Normativa de Extinção</span>
                  </button>
                }
              </div>

              <!-- Estado 1: Normativa já persistida (modo edição) -->
              @if (hasPersistedNormativaExtincao()) {
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
                        placeholder="Ex: Lei Complementar nº 184/2023 - Extinção do Núcleo"
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
                        placeholder="Ex: 184"
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
export class NucleoForm implements OnInit {
  readonly service = inject(NucleoService);
  readonly subgerService = inject(SubgerenciaService);
  readonly gerRegService = inject(GerenciaRegionalService);
  readonly secGeralService = inject(SecretariaGeralService);
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly dialog = inject(MatDialog);
  readonly toastService = inject(ToastService);
  readonly permissionService = inject(PermissionService);
  readonly modalService = inject(ModalService);

  readonly isEditMode = signal(false);
  readonly isSaving = signal(false);
  readonly formatarDataParaExibicao = formatarDataParaExibicao;
  itemId: string | null = null;
  currentItem?: NucleoItem;

  // Controles Autocomplete e Seletores
  readonly gerRegInputControl = new FormControl('');
  readonly subgerInputControl = new FormControl('');
  readonly utbInputControl = new FormControl('');

  readonly form = new FormGroup({
    nome: new FormControl('', [Validators.required, Validators.maxLength(200)]),
    tipoVinculo: new FormControl<TipoVinculoSuperior | ''>('', [Validators.required]),
    unidadeSuperiorId: new FormControl('', [Validators.required]),
    unidadeSuperiorNome: new FormControl(''),
    utbCodigo: new FormControl('', [Validators.required]),
    cep: new FormControl('', [Validators.required]),
    municipio: new FormControl('', [Validators.required]),
    rua: new FormControl('', [Validators.required, Validators.maxLength(200)]),
    numero: new FormControl('', [Validators.required, Validators.maxLength(4)]),
    bairro: new FormControl('', [Validators.required, Validators.maxLength(200)]),
    complemento: new FormControl('', [Validators.maxLength(200)])
  });

  // Signals para reatividade
  readonly tipoVinculoVal = toSignal(this.form.controls.tipoVinculo.valueChanges, { initialValue: '' });
  readonly gerRegInputVal = toSignal(this.gerRegInputControl.valueChanges, { initialValue: '' });
  readonly subgerInputVal = toSignal(this.subgerInputControl.valueChanges, { initialValue: '' });
  readonly utbInputVal = toSignal(this.utbInputControl.valueChanges, { initialValue: '' });
  readonly municipioVal = toSignal(this.form.controls.municipio.valueChanges, { initialValue: '' });

  // Chefia Imediata
  readonly chefeImediato = signal<ChefeImediatoItem | undefined>(undefined);
  readonly atoNumeroControl = new FormControl('', [Validators.maxLength(20)]);
  readonly atoDataControl = new FormControl('');
  readonly atoDocumento = signal<DocumentoAnexo | undefined>(undefined);
  readonly atoDocInvalido = signal(false);
  readonly historicoAtos = signal<HistoricoAtoItem[]>([]);

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
  readonly expandindoNormativaExtincao = signal(false);
  readonly temNormativaExtincao = signal(false);
  readonly hasPersistedNormativaExtincao = signal(false);
  readonly normExtincaoNomeControl = new FormControl('', [Validators.maxLength(100)]);
  readonly normExtincaoNumeroControl = new FormControl('', [Validators.maxLength(20)]);
  readonly normExtincaoDataControl = new FormControl('');
  readonly normExtincaoDoc = signal<DocumentoAnexo | undefined>(undefined);
  readonly normExtincaoDocInvalido = signal(false);

  readonly normExtincaoNomeVal = toSignal(this.normExtincaoNomeControl.valueChanges, { initialValue: '' });
  readonly normExtincaoNumeroVal = toSignal(this.normExtincaoNumeroControl.valueChanges, { initialValue: '' });
  readonly normExtincaoDataVal = toSignal(this.normExtincaoDataControl.valueChanges, { initialValue: '' });

  // Feedback do CEP
  readonly cepFeedback = signal('');

  private initialSnapshotJson = '';
  private isSavedSuccessfully = false;
  private isDiscarded = false;
  private isHandlingUtbSelection = false;

  // Lista de Gerências Regionais ativas
  readonly filteredGerRegionais = computed(() => {
    const query = (this.gerRegInputVal() || '').toLowerCase().trim();
    const list = this.gerRegService.items().filter(gr => gr.status === 'ATIVO').sort((a, b) => a.nome.localeCompare(b.nome));
    if (!query) return list;
    return list.filter(gr => gr.nome.toLowerCase().includes(query));
  });

  // Lista de Subgerências ativas
  readonly filteredSubgerencias = computed(() => {
    const query = (this.subgerInputVal() || '').toLowerCase().trim();
    const list = this.subgerService.items().filter(s => s.status === 'ATIVO').sort((a, b) => a.nome.localeCompare(b.nome));
    if (!query) return list;
    return list.filter(s => s.nome.toLowerCase().includes(query));
  });

  // Autocomplete de UTBs disponíveis
  readonly filteredUtbs = computed(() => {
    const query = (this.utbInputVal() || '').toLowerCase().trim();
    const all = this.secGeralService.utbs().filter(u => !this.service.isUtbEmUso(u.codigo, this.itemId || undefined));
    if (!query) return all;
    return all.filter(u => 
      u.codigo.toLowerCase().includes(query) ||
      u.nome.toLowerCase().includes(query) ||
      `${u.codigo} - ${u.nome}`.toLowerCase().includes(query)
    );
  });

  // Autocomplete de Municípios da PB
  readonly filteredMunicipios = computed(() => {
    const query = (this.municipioVal() || this.form.get('municipio')?.value || '').trim().toLowerCase();
    if (!query) return MUNICIPIOS_PARAIBA;
    return MUNICIPIOS_PARAIBA.filter(m => m.toLowerCase().includes(query));
  });

  // Bloqueio de alteração de UTB: se estiver em edição e possuir chefia imediata vinculada
  readonly isUtbBloqueada = computed(() => {
    if (!this.isEditMode()) return false;
    return !!this.chefeImediato();
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
  }

  private carregarDadosEdicao(id: string) {
    const item = this.service.getItem(id);
    if (!item) {
      this.toastService.error('Núcleo não encontrado.');
      this.router.navigate(['/configuracoes/hierarquia/nucleo']);
      return;
    }

    this.currentItem = item;

    this.form.patchValue({
      nome: item.nome,
      tipoVinculo: item.tipoVinculo,
      unidadeSuperiorId: item.unidadeSuperiorId,
      unidadeSuperiorNome: item.unidadeSuperiorNome,
      utbCodigo: item.utbCodigo,
      cep: item.endereco?.cep || '',
      municipio: item.endereco?.municipio || '',
      rua: item.endereco?.rua || '',
      numero: item.endereco?.numero || '',
      bairro: item.endereco?.bairro || '',
      complemento: item.endereco?.complemento || ''
    });

    if (item.tipoVinculo === 'GERENCIA_REGIONAL') {
      this.gerRegInputControl.setValue(item.unidadeSuperiorNome);
    } else if (item.tipoVinculo === 'SUBGERENCIA') {
      this.subgerInputControl.setValue(item.unidadeSuperiorNome);
    }

    this.utbInputControl.setValue(item.utbNome);

    if (item.chefeImediato) {
      this.chefeImediato.set(item.chefeImediato);
      this.atoNumeroControl.setValue(item.chefeImediato.atoGovernamental.numero);
      this.atoDataControl.setValue(item.chefeImediato.atoGovernamental.dataPublicacao);
      this.atoDocumento.set(item.chefeImediato.atoGovernamental.documento);
    }

    if (item.normativaExtincao && item.normativaExtincao.documento) {
      this.hasPersistedNormativaExtincao.set(true);
      this.temNormativaExtincao.set(true);
      this.normExtincaoNomeControl.setValue(item.normativaExtincao.nome);
      this.normExtincaoNumeroControl.setValue(item.normativaExtincao.numero);
      this.normExtincaoDataControl.setValue(item.normativaExtincao.dataPublicacao);
      this.normExtincaoDoc.set(item.normativaExtincao.documento);
    }

    this.historicoAtos.set(item.historicoAtos || []);
    this.initialSnapshotJson = this.getCurrentSnapshotJson();
  }

  // Alteração de Tipo de Vínculo
  onTipoVinculoChange() {
    this.form.get('unidadeSuperiorId')?.setValue('');
    this.form.get('unidadeSuperiorNome')?.setValue('');
    this.gerRegInputControl.setValue('');
    this.subgerInputControl.setValue('');
    this.gerRegInputControl.setErrors(null);
    this.subgerInputControl.setErrors(null);
  }

  onGerRegionalSelected(grId: string) {
    const gr = this.gerRegService.getItem(grId);
    if (gr) {
      this.form.get('unidadeSuperiorId')?.setValue(gr.id);
      this.form.get('unidadeSuperiorNome')?.setValue(gr.nome);
      this.gerRegInputControl.setValue(gr.nome);
      this.gerRegInputControl.setErrors(null);
    }
  }

  limparGerReg() {
    this.gerRegInputControl.setValue('');
    this.form.get('unidadeSuperiorId')?.setValue('');
    this.form.get('unidadeSuperiorNome')?.setValue('');
  }

  onSubgerenciaSelected(subId: string) {
    const sub = this.subgerService.getItem(subId);
    if (sub) {
      this.form.get('unidadeSuperiorId')?.setValue(sub.id);
      this.form.get('unidadeSuperiorNome')?.setValue(sub.nome);
      this.subgerInputControl.setValue(sub.nome);
      this.subgerInputControl.setErrors(null);
    }
  }

  limparSubger() {
    this.subgerInputControl.setValue('');
    this.form.get('unidadeSuperiorId')?.setValue('');
    this.form.get('unidadeSuperiorNome')?.setValue('');
  }

  onGerRegBlur() {
    const raw = (this.gerRegInputControl.value || '').trim();
    if (!raw) {
      this.form.get('unidadeSuperiorId')?.setValue('');
      this.form.get('unidadeSuperiorNome')?.setValue('');
      return;
    }
    const match = this.gerRegService.items().find(g => g.status === 'ATIVO' && g.nome.toLowerCase() === raw.toLowerCase());
    if (match) {
      this.form.get('unidadeSuperiorId')?.setValue(match.id);
      this.form.get('unidadeSuperiorNome')?.setValue(match.nome);
      this.gerRegInputControl.setValue(match.nome, { emitEvent: false });
      this.gerRegInputControl.setErrors(null);
    } else {
      const currentId = this.form.get('unidadeSuperiorId')?.value;
      const current = currentId ? this.gerRegService.getItem(currentId) : undefined;
      if (current && current.nome.toLowerCase() === raw.toLowerCase()) {
        this.gerRegInputControl.setValue(current.nome, { emitEvent: false });
        this.gerRegInputControl.setErrors(null);
      } else {
        this.form.get('unidadeSuperiorId')?.setValue('');
        this.form.get('unidadeSuperiorNome')?.setValue('');
        this.gerRegInputControl.setErrors({ required: true, invalido: true });
      }
    }
  }

  onSubgerBlur() {
    const raw = (this.subgerInputControl.value || '').trim();
    if (!raw) {
      this.form.get('unidadeSuperiorId')?.setValue('');
      this.form.get('unidadeSuperiorNome')?.setValue('');
      return;
    }
    const match = this.subgerService.items().find(s => s.status === 'ATIVO' && s.nome.toLowerCase() === raw.toLowerCase());
    if (match) {
      this.form.get('unidadeSuperiorId')?.setValue(match.id);
      this.form.get('unidadeSuperiorNome')?.setValue(match.nome);
      this.subgerInputControl.setValue(match.nome, { emitEvent: false });
      this.subgerInputControl.setErrors(null);
    } else {
      const currentId = this.form.get('unidadeSuperiorId')?.value;
      const current = currentId ? this.subgerService.getItem(currentId) : undefined;
      if (current && current.nome.toLowerCase() === raw.toLowerCase()) {
        this.subgerInputControl.setValue(current.nome, { emitEvent: false });
        this.subgerInputControl.setErrors(null);
      } else {
        this.form.get('unidadeSuperiorId')?.setValue('');
        this.form.get('unidadeSuperiorNome')?.setValue('');
        this.subgerInputControl.setErrors({ required: true, invalido: true });
      }
    }
  }

  // Tratamento do CEP e Endereço
  onCepInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const formatted = formatarCep(input.value);
    input.value = formatted;
    this.form.controls.cep.setValue(formatted, { emitEvent: false });

    const raw = formatted.replace(/\D/g, '');
    if (raw.length === 0) {
      this.form.controls.cep.setErrors(null);
      this.cepFeedback.set('');
    } else if (raw.length === 8) {
      this.validarEConsultarCep(raw);
    } else {
      this.cepFeedback.set('');
    }
  }

  onCepBlur() {
    this.form.controls.cep.markAsTouched();
    const raw = (this.form.controls.cep.value || '').replace(/\D/g, '');
    if (raw.length === 0) {
      this.form.controls.cep.setErrors({ required: true });
      this.cepFeedback.set('');
    } else if (raw.length < 8) {
      this.form.controls.cep.setErrors({ cepIncompleto: true });
      this.cepFeedback.set('');
    } else if (raw.length === 8) {
      this.validarEConsultarCep(raw);
    }
  }

  limparCep() {
    this.form.controls.cep.setValue('');
    this.form.controls.cep.setErrors({ required: true });
    this.cepFeedback.set('');
  }

  onNumeroInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').substring(0, 4);
    this.form.controls.numero.setValue(input.value, { emitEvent: false });
  }

  private validarEConsultarCep(rawDigits: string) {
    const dados = CEP_DATABASE[rawDigits];
    if (dados) {
      if (dados.estado === 'PB') {
        this.form.controls.cep.setErrors(null);
        this.cepFeedback.set('');
        if (dados.rua) this.form.controls.rua.setValue(dados.rua);
        if (dados.municipio) this.form.controls.municipio.setValue(dados.municipio);
        if (dados.bairro) this.form.controls.bairro.setValue(dados.bairro);
      } else {
        this.form.controls.cep.setErrors({ cepForaPb: true });
        this.cepFeedback.set('');
      }
    } else {
      // Regra de prefixo geral da Paraíba (58xxx-xxx)
      if (!rawDigits.startsWith('58')) {
        this.form.controls.cep.setErrors({ cepForaPb: true });
        this.cepFeedback.set('');
      } else {
        this.form.controls.cep.setErrors(null);
        this.cepFeedback.set('Não foi possível localizar o CEP informado na nossa base. Por favor, preencha manualmente os campos.');
      }
    }
  }

  // UTB Autocomplete & Confirmation Dialog
  onUtbSelected(codigo: string) {
    if (this.isUtbBloqueada()) return;
    const utb = this.secGeralService.utbs().find(u => u.codigo === codigo);
    if (!utb) return;

    const currentCodigo = this.form.get('utbCodigo')?.value;
    if (currentCodigo === codigo) return;

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

  // Chefia Imediata
  abrirBuscaChefe() {
    const utb = this.form.get('utbCodigo')?.value;
    if (!utb) {
      this.toastService.warning('Selecione primeiro uma Unidade de Trabalho (UTB).');
      return;
    }

    const dialogRef = this.dialog.open(BuscaServidorModal, {
      width: '760px',
      maxWidth: 'calc(100vw - 2.5rem)',
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
      autoFocus: false,
      data: {
        utbCodigo: utb
      }
    });

    dialogRef.afterClosed().subscribe((servidor: ServidorUtbItem | undefined) => {
      if (servidor) {
        const chefeExistente = this.chefeImediato();
        const atoNum = (this.atoNumeroControl.value || '').trim();
        const atoData = (this.atoDataControl.value || '').trim();
        const atoDoc = this.atoDocumento();

        if (chefeExistente && (chefeExistente.matricula !== servidor.matricula || chefeExistente.cpf !== servidor.cpf)) {
          // Arquivar ato anterior se possuir dados e anexo válido
          const docAto = atoDoc || chefeExistente.atoGovernamental?.documento;
          const numAto = atoNum || chefeExistente.atoGovernamental?.numero;
          if (docAto && numAto) {
            const histItem: HistoricoAtoItem = {
              id: `hist-nuc-${Date.now()}`,
              numero: numAto,
              chefeImediato: chefeExistente.nome,
              dataPublicacao: atoData || chefeExistente.atoGovernamental?.dataPublicacao || '',
              dataImportacao: docAto.dataUpload || new Date().toLocaleDateString('pt-BR'),
              responsavelImportacao: 'Mikael Oliveira',
              documento: docAto
            };
            this.historicoAtos.update(prev => [histItem, ...prev]);
          }

          // Resetar campos do ato governamental para exigir comprovação do novo titular
          this.atoNumeroControl.reset('');
          this.atoDataControl.reset('');
          this.atoDocumento.set(undefined);
          this.atoDocInvalido.set(false);
        }

        this.chefeImediato.set({
          matricula: servidor.matricula,
          cpf: servidor.cpf,
          nome: servidor.nome,
          cargo: servidor.cargo,
          situacaoFuncional: servidor.situacaoFuncional,
          atoGovernamental: {
            numero: '',
            dataPublicacao: '',
            documento: undefined
          }
        });
        this.atoDocInvalido.set(false);
      }
    });
  }

  onFileAtoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (file.size > 10 * 1024 * 1024) {
      this.toastService.error('O arquivo deve ter no máximo 10 MB.');
      input.value = '';
      return;
    }

    const agora = new Date();
    const dataUpload = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const docTipo: 'pdf' | 'jpg' | 'jpeg' | 'png' = (ext === 'png' || ext === 'jpg' || ext === 'jpeg') ? ext : 'pdf';

    this.atoDocumento.set({
      id: `doc-ato-${Date.now()}`,
      nomeArquivo: file.name,
      tamanho: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      tipo: docTipo,
      dataUpload
    });
    this.atoDocInvalido.set(false);
    input.value = '';
  }

  removerDocAto() {
    this.atoDocumento.set(undefined);
  }

  // Normativa de Criação
  onFileNormCriacaoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (file.size > 10 * 1024 * 1024) {
      this.toastService.error('O arquivo deve ter no máximo 10 MB.');
      input.value = '';
      return;
    }

    const agora = new Date();
    const dataUpload = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const docTipo: 'pdf' | 'jpg' | 'jpeg' | 'png' = (ext === 'png' || ext === 'jpg' || ext === 'jpeg') ? ext : 'pdf';

    this.normCriacaoDoc.set({
      id: `doc-cria-${Date.now()}`,
      nomeArquivo: file.name,
      tamanho: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      tipo: docTipo,
      dataUpload
    });
    this.normCriacaoDocInvalido.set(false);
    input.value = '';
  }

  removerDocCriacao() {
    this.normCriacaoDoc.set(undefined);
  }

  // Normativa de Extinção
  abrirFormularioNormativaExtincao() {
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
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (file.size > 10 * 1024 * 1024) {
      this.toastService.error('O arquivo deve ter no máximo 10 MB.');
      input.value = '';
      return;
    }

    const agora = new Date();
    const dataUpload = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const docTipo: 'pdf' | 'jpg' | 'jpeg' | 'png' = (ext === 'png' || ext === 'jpg' || ext === 'jpeg') ? ext : 'pdf';

    this.normExtincaoDoc.set({
      id: `doc-ext-${Date.now()}`,
      nomeArquivo: file.name,
      tamanho: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      tipo: docTipo,
      dataUpload
    });
    this.normExtincaoDocInvalido.set(false);
    input.value = '';
  }

  removerChefe() {
    const dialogRef = this.dialog.open(ConfirmacaoDialog, {
      disableClose: true,
      data: {
        title: 'Remover Chefe Imediato?',
        message: 'Deseja remover o vínculo da chefia imediata deste Núcleo? O Ato Governamental associado também será desvinculado.',
        cancelLabel: 'Cancelar',
        actionLabel: 'Sim, remover',
        actionType: 'destructive'
      }
    });

    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        const chefeAtual = this.chefeImediato();
        const doc = this.atoDocumento();
        const num = this.atoNumeroControl.value?.trim();
        const dt = this.atoDataControl.value?.trim();
        if (chefeAtual && doc && num && dt) {
          const novoHistItem: HistoricoAtoItem = {
            id: `hist-nuc-${Date.now()}`,
            numero: num,
            chefeImediato: chefeAtual.nome,
            dataPublicacao: dt,
            dataImportacao: doc.dataUpload || new Date().toLocaleDateString('pt-BR'),
            responsavelImportacao: 'Mikael Oliveira',
            documento: doc
          };
          this.historicoAtos.update(list => [novoHistItem, ...list]);
        }

        this.chefeImediato.set(undefined);
        this.atoNumeroControl.reset('');
        this.atoDataControl.reset('');
        this.atoDocumento.set(undefined);
        this.atoDocInvalido.set(false);
        this.toastService.info('Chefe Imediato removido.');
      }
    });
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

  abrirHistoricoAtos() {
    let atoVigente: AtoGovernamental | undefined;
    let nomeChefe: string | undefined;

    if (this.chefeImediato() && this.atoNumeroControl.value && this.atoDocumento()) {
      atoVigente = {
        numero: this.atoNumeroControl.value,
        dataPublicacao: this.atoDataControl.value || '',
        documento: this.atoDocumento()
      };
      nomeChefe = this.chefeImediato()?.nome;
    }

    const atos = this.service.getHistoricoAtos(this.itemId || undefined, atoVigente, nomeChefe);

    for (const h of this.historicoAtos()) {
      if (!atos.some(a => a.id === h.id || (a.numero === h.numero && a.documento.nomeArquivo === h.documento.nomeArquivo))) {
        atos.push(h);
      }
    }

    this.dialog.open(HistoricoAtosModal, {
      width: '900px',
      maxWidth: 'calc(100vw - 2.5rem)',
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
      autoFocus: false,
      data: { atos }
    });
  }

  // Validação Geral e Salvamento
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

    // 1. Identificação: Nome, Tipo de Vínculo, Unidade Superior e UTB
    const nome = (this.form.get('nome')?.value || '').trim();
    const tipoVinculo = this.form.get('tipoVinculo')?.value;
    const superiorId = (this.form.get('unidadeSuperiorId')?.value || '').trim();
    const superiorNome = (this.form.get('unidadeSuperiorNome')?.value || '').trim();
    const utbCodigo = (this.form.get('utbCodigo')?.value || '').trim();

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

    if (!tipoVinculo) {
      this.form.get('tipoVinculo')?.setErrors({ required: true });
      this.form.get('tipoVinculo')?.markAsTouched();
      hasError = true;
      if (!firstInvalidId) firstInvalidId = 'form-tipo-vinculo';
    }

    const typedSuperior = (tipoVinculo === 'GERENCIA_REGIONAL' ? this.gerRegInputControl.value : this.subgerInputControl.value) || '';
    const superiorValido = superiorId && typedSuperior && (
      (tipoVinculo === 'GERENCIA_REGIONAL' && this.gerRegService.getItem(superiorId)?.nome.toLowerCase() === typedSuperior.trim().toLowerCase()) ||
      (tipoVinculo === 'SUBGERENCIA' && this.subgerService.getItem(superiorId)?.nome.toLowerCase() === typedSuperior.trim().toLowerCase())
    );

    if (!superiorValido) {
      this.form.get('unidadeSuperiorId')?.setErrors({ required: true });
      this.form.get('unidadeSuperiorId')?.markAsTouched();
      if (tipoVinculo === 'GERENCIA_REGIONAL') {
        this.gerRegInputControl.setErrors({ required: true, invalido: true });
        this.gerRegInputControl.markAsTouched();
        if (!firstInvalidId) firstInvalidId = 'form-ger-reg';
      } else if (tipoVinculo === 'SUBGERENCIA') {
        this.subgerInputControl.setErrors({ required: true, invalido: true });
        this.subgerInputControl.markAsTouched();
        if (!firstInvalidId) firstInvalidId = 'form-subgerencia';
      }
      hasError = true;
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

    // 2. Validação de Endereço (OBRIGATÓRIO NO NÚCLEO: CEP, Município, Rua, Número e Bairro)
    const cepValor = (this.form.get('cep')?.value || '').trim();
    if (!cepValor) {
      this.form.get('cep')?.setErrors({ required: true });
      this.form.get('cep')?.markAsTouched();
      hasError = true;
      if (!firstInvalidId) firstInvalidId = 'form-cep';
    } else {
      const rawCep = cepValor.replace(/\D/g, '');
      if (rawCep.length !== 8) {
        this.form.get('cep')?.setErrors({ cepIncompleto: true });
        this.form.get('cep')?.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-cep';
      } else {
        const dados = CEP_DATABASE[rawCep];
        if (dados && dados.estado !== 'PB') {
          this.form.get('cep')?.setErrors({ cepForaPb: true });
          this.form.get('cep')?.markAsTouched();
          hasError = true;
          if (!firstInvalidId) firstInvalidId = 'form-cep';
        } else if (!rawCep.startsWith('58')) {
          this.form.get('cep')?.setErrors({ cepForaPb: true });
          this.form.get('cep')?.markAsTouched();
          hasError = true;
          if (!firstInvalidId) firstInvalidId = 'form-cep';
        }
      }
    }

    const munValor = (this.form.get('municipio')?.value || '').trim();
    if (!munValor) {
      this.form.get('municipio')?.setErrors({ required: true });
      this.form.get('municipio')?.markAsTouched();
      hasError = true;
      if (!firstInvalidId) firstInvalidId = 'form-municipio';
    }

    const ruaValor = (this.form.get('rua')?.value || '').trim();
    if (!ruaValor) {
      this.form.get('rua')?.setErrors({ required: true });
      this.form.get('rua')?.markAsTouched();
      hasError = true;
      if (!firstInvalidId) firstInvalidId = 'form-rua';
    }

    const numValor = (this.form.get('numero')?.value || '').trim();
    if (!numValor) {
      this.form.get('numero')?.setErrors({ required: true });
      this.form.get('numero')?.markAsTouched();
      hasError = true;
      if (!firstInvalidId) firstInvalidId = 'form-numero';
    }

    const bairroValor = (this.form.get('bairro')?.value || '').trim();
    if (!bairroValor) {
      this.form.get('bairro')?.setErrors({ required: true });
      this.form.get('bairro')?.markAsTouched();
      hasError = true;
      if (!firstInvalidId) firstInvalidId = 'form-bairro';
    }

    // 3. Chefia Imediata: se houver chefe vinculado, Ato Governamental é obrigatório
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

    // 4. Normativa de Criação: obrigatória no momento do cadastro
    if (!this.isEditMode()) {
      const normCriaNome = (this.normCriacaoNomeControl.value || '').trim();
      const normCriaNum = (this.normCriacaoNumeroControl.value || '').trim();
      const normCriaData = (this.normCriacaoDataControl.value || '').trim();
      const normCriaDoc = this.normCriacaoDoc();

      if (!normCriaNome) {
        this.normCriacaoNomeControl.setErrors({ required: true });
        this.normCriacaoNomeControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-norm-cria-nome';
      } else if (normCriaNome.length > 100) {
        this.normCriacaoNomeControl.setErrors({ maxlength: { requiredLength: 100, actualLength: normCriaNome.length } });
        this.normCriacaoNomeControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-norm-cria-nome';
      }

      if (!normCriaNum) {
        this.normCriacaoNumeroControl.setErrors({ required: true });
        this.normCriacaoNumeroControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-norm-cria-numero';
      } else if (normCriaNum.length > 20) {
        this.normCriacaoNumeroControl.setErrors({ maxlength: { requiredLength: 20, actualLength: normCriaNum.length } });
        this.normCriacaoNumeroControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-norm-cria-numero';
      }

      if (!normCriaData) {
        this.normCriacaoDataControl.setErrors({ required: true });
        this.normCriacaoDataControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-norm-cria-data';
      } else if (!validarDataFormato(normCriaData)) {
        this.normCriacaoDataControl.setErrors({ dataFormato: 'Informe uma data válida no formato DD/MM/AAAA.' });
        this.normCriacaoDataControl.markAsTouched();
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'form-norm-cria-data';
      }

      if (!normCriaDoc) {
        this.normCriacaoDocInvalido.set(true);
        hasError = true;
        if (!firstInvalidId) firstInvalidId = 'container-anexo-criacao';
      } else {
        this.normCriacaoDocInvalido.set(false);
      }
    }

    // Se houver erros, foca o primeiro campo inválido e emite um ÚNICO toast geral
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
          documento: this.atoDocumento()!
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
          documento: this.normCriacaoDoc()!
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
        documento: this.normExtincaoDoc()!
      };
    }

    const utbItem = this.secGeralService.utbs().find(u => u.codigo === utbCodigo);
    const utbNome = utbItem ? `${utbItem.codigo} - ${utbItem.nome}` : utbCodigo;

    // Monta o objeto de Endereço
    const enderecoObj: EnderecoNucleo = {
      cep: cepValor,
      municipio: munValor,
      rua: ruaValor,
      numero: numValor,
      bairro: bairroValor,
      complemento: (this.form.get('complemento')?.value || '').trim() || undefined
    };

    this.isSaving.set(true);

    setTimeout(() => {
      if (this.isEditMode() && this.itemId) {
        this.service.update(this.itemId, {
          nome,
          tipoVinculo: tipoVinculo as TipoVinculoSuperior,
          unidadeSuperiorId: superiorId,
          unidadeSuperiorNome: superiorNome,
          utbCodigo,
          utbNome,
          endereco: enderecoObj,
          chefeImediato: chefeFinal,
          normativaExtincao: normativaExtincaoFinal,
          historicoAtos: this.historicoAtos()
        });

        this.isSavedSuccessfully = true;
        this.isSaving.set(false);
        this.toastService.success('Registro atualizado com sucesso.');
        this.router.navigate(['/configuracoes/hierarquia/nucleo']);
      } else {
        this.service.add({
          nome,
          tipoVinculo: tipoVinculo as TipoVinculoSuperior,
          unidadeSuperiorId: superiorId,
          unidadeSuperiorNome: superiorNome,
          utbCodigo,
          utbNome,
          status: 'ATIVO',
          endereco: enderecoObj,
          chefeImediato: chefeFinal,
          normativaCriacao: normativaCriacaoFinal,
          normativaExtincao: normativaExtincaoFinal,
          historicoAtos: this.historicoAtos()
        });

        this.isSavedSuccessfully = true;
        this.isSaving.set(false);
        this.toastService.success('Registro cadastrado com sucesso.');
        this.router.navigate(['/configuracoes/hierarquia/nucleo']);
      }
    }, 150);
  }

  focusPrimeiroCampoInvalido(idPrimeiroInvalido?: string) {
    setTimeout(() => {
      let el: HTMLElement | null = null;
      if (idPrimeiroInvalido) {
        const target = document.getElementById(idPrimeiroInvalido);
        if (target) {
          el = target.querySelector('input, mat-select, [tabindex="0"]') || target;
        }
      }
      if (!el) {
        const firstError = document.querySelector('mat-error, .border-red-500, input.ng-invalid, [aria-invalid="true"]');
        if (firstError) {
          const container = firstError.closest('.form-field-group, mat-form-field, .border-red-500');
          el = (container?.querySelector('input, mat-select, [tabindex="0"]') || firstError) as HTMLElement;
        }
      }
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }, 100);
  }

  // Navegação e Descarte de Alterações
  goHome() {
    if (!this.hasPendingChanges()) {
      this.router.navigate(['/inicio']);
      return;
    }
    const dialogRef = this.modalService.confirmarCancelamento();
    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.isDiscarded = true;
        this.router.navigate(['/inicio']);
      }
    });
  }

  goConfiguracoes() {
    if (!this.hasPendingChanges()) {
      this.router.navigate(['/configuracoes']);
      return;
    }
    const dialogRef = this.modalService.confirmarCancelamento();
    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.isDiscarded = true;
        this.router.navigate(['/configuracoes']);
      }
    });
  }

  goHierarquia() {
    this.onCancelar();
  }

  onCancelar() {
    if (!this.hasPendingChanges()) {
      this.router.navigate(['/configuracoes/hierarquia/nucleo']);
      return;
    }

    const dialogRef = this.modalService.confirmarCancelamento();
    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.isDiscarded = true;
        this.router.navigate(['/configuracoes/hierarquia/nucleo']);
      }
    });
  }

  canDeactivate(): Promise<boolean> | boolean {
    if (this.isSavedSuccessfully || this.isDiscarded) {
      return true;
    }
    if (!this.hasPendingChanges()) {
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

  private getCurrentSnapshotJson(): string {
    return JSON.stringify({
      form: this.form.getRawValue(),
      gerReg: this.gerRegInputControl.value,
      subger: this.subgerInputControl.value,
      utb: this.utbInputControl.value,
      chefe: this.chefeImediato(),
      atoNum: this.atoNumeroControl.value,
      atoData: this.atoDataControl.value,
      atoDoc: this.atoDocumento(),
      normCriaNome: this.normCriacaoNomeControl.value,
      normCriaNum: this.normCriacaoNumeroControl.value,
      normCriaData: this.normCriacaoDataControl.value,
      normCriaDoc: this.normCriacaoDoc(),
      normExtNome: this.normExtincaoNomeControl.value,
      normExtNum: this.normExtincaoNumeroControl.value,
      normExtData: this.normExtincaoDataControl.value,
      normExtDoc: this.normExtincaoDoc()
    });
  }

  private hasPendingChanges(): boolean {
    return this.getCurrentSnapshotJson() !== this.initialSnapshotJson;
  }
}

// ==========================================
// TELA 3: VISUALIZAR NÚCLEO
// ==========================================

@Component({
  selector: 'app-nucleo-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    AcessoRestritoComponent
  ],
  template: `
    @if (!permissionService.hasAccess()) {
      <app-acesso-restrito backUrl="/configuracoes/hierarquia/nucleo" />
    } @else {
      <div class="flex flex-col gap-6 max-w-7xl mx-auto w-full font-sans pb-16">
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
            <span 
              (click)="goBack()" 
              (keydown.enter)="goBack()" 
              tabindex="0" 
              role="button" 
              class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline"
            >
              Configurar Núcleo
            </span>
            <span class="text-[10px] text-siage-text-secondary/40 select-none" aria-hidden="true">/</span>
            <span class="text-siage-primary font-semibold" aria-current="page">Visualizar</span>
          </nav>

          <!-- Título com Botão Voltar e Ação Editar -->
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
                  Visualizar Núcleo
                </h1>
              </div>

              <p class="text-xs sm:text-sm text-siage-text-secondary font-sans leading-normal pl-8 sm:pl-9 max-w-2xl">
                Consulte as informações cadastrais, endereço, chefia e normativas desta unidade.
              </p>
            </div>

            @if (permissionService.canCreate() && item()?.status === 'ATIVO') {
              <div class="flex items-center shrink-0 pl-8 sm:pl-0">
                <button 
                  type="button" 
                  (click)="onEditar()"
                  class="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs hover:shadow cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/50"
                  aria-label="Editar Núcleo"
                >
                  <mat-icon style="font-size: 18px; width: 18px; height: 18px;">edit</mat-icon>
                  <span>Editar</span>
                </button>
              </div>
            }
          </div>
        </div>

        @if (item(); as nucleo) {
          <div class="flex flex-col gap-6">

            <!-- Card 1: Identificação do Núcleo -->
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">domain</mat-icon>
                <span>1. Identificação do Núcleo</span>
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                <!-- Linha 1: Nome do Núcleo (4 cols) | Tipo de Vínculo (4 cols) | Unidade Superior (4 cols) -->
                <div class="flex flex-col gap-1 col-span-12 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Nome do Núcleo</span>
                  <span class="text-sm font-medium text-siage-text-primary break-words">{{ nucleo.nome }}</span>
                </div>

                <div class="flex flex-col gap-1 col-span-12 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Tipo de Vínculo</span>
                  <span class="text-sm font-medium text-siage-text-primary">
                    {{ nucleo.tipoVinculo === 'GERENCIA_REGIONAL' ? 'Gerência Regional' : 'Subgerência' }}
                  </span>
                </div>

                <div class="flex flex-col gap-1 col-span-12 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Unidade Superior</span>
                  <span class="text-sm font-medium text-siage-text-primary break-words">{{ nucleo.unidadeSuperiorNome }}</span>
                </div>

                <!-- Linha 2: Unidade de Trabalho (UTB) (4 cols) | Situação (4 cols) | Criador / Editor (4 cols) -->
                <div class="flex flex-col gap-1 col-span-12 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Unidade de Trabalho (UTB)</span>
                  <span class="text-sm font-medium text-siage-text-primary break-words leading-relaxed">{{ nucleo.utbNome }}</span>
                </div>

                <div class="flex flex-col gap-1 col-span-12 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Situação</span>
                  <span class="text-sm font-medium text-siage-text-primary">{{ nucleo.status === 'ATIVO' ? 'Ativo' : 'Inativo' }}</span>
                </div>

                <div class="flex flex-col gap-1 col-span-12 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Criador / Editor</span>
                  <span class="text-sm font-medium text-siage-text-primary break-words">{{ nucleo.criadorEditor }}</span>
                </div>

                <!-- Linha 3: Data de Criação (4 cols) -->
                <div class="flex flex-col gap-1 col-span-12 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data de Criação</span>
                  <span class="text-sm font-medium text-siage-text-primary">{{ nucleo.dataCriacao }}</span>
                </div>
              </div>

              <!-- Subseção Endereço na Visualização -->
              <div class="mt-4 pt-4 border-t border-siage-border/40 flex flex-col gap-3">
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-siage-primary">location_on</mat-icon>
                  <span class="text-xs font-poppins font-bold uppercase tracking-wider text-siage-primary">
                    Endereço
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-1">
                  <div class="flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">CEP</span>
                    <span class="text-sm font-mono font-medium text-siage-text-primary">{{ nucleo.endereco.cep || '-' }}</span>
                  </div>

                  <div class="flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Município</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ nucleo.endereco.municipio || '-' }}</span>
                  </div>

                  <div class="flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Rua</span>
                    <span class="text-sm font-medium text-siage-text-primary break-words">{{ nucleo.endereco.rua || '-' }}</span>
                  </div>

                  <div class="flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Número</span>
                    <span class="text-sm font-mono font-medium text-siage-text-primary">{{ nucleo.endereco.numero || '-' }}</span>
                  </div>

                  <div class="flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Bairro</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ nucleo.endereco.bairro || '-' }}</span>
                  </div>

                  <div class="flex flex-col gap-1 sm:col-span-2 md:col-span-3">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Complemento</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ nucleo.endereco.complemento || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card 2: Chefia Imediata e Ato Governamental -->
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">badge</mat-icon>
                <span>2. Chefia Imediata e Ato Governamental</span>
              </h3>

              @if (nucleo.chefeImediato; as chefe) {
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

            <!-- Card 3: Gestão de Normativas -->
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
                    Normativa de Criação
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Nome da Normativa</span>
                    <span class="text-sm font-medium text-siage-text-primary break-words">{{ nucleo.normativaCriacao.nome }}</span>
                  </div>
                  <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Número da Normativa</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ nucleo.normativaCriacao.numero }}</span>
                  </div>
                  <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data da Publicação</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ formatarDataParaExibicao(nucleo.normativaCriacao.dataPublicacao) }}</span>
                  </div>

                  @if (nucleo.normativaCriacao.documento; as doc) {
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
              @if (nucleo.normativaExtincao && nucleo.normativaExtincao.documento) {
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
                      <span class="text-sm font-medium text-siage-text-primary break-words">{{ nucleo.normativaExtincao.nome }}</span>
                    </div>
                    <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                      <span class="text-xs uppercase text-siage-text-secondary font-semibold">Número da Normativa</span>
                      <span class="text-sm font-medium text-siage-text-primary">{{ nucleo.normativaExtincao.numero }}</span>
                    </div>
                    <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                      <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data da Publicação</span>
                      <span class="text-sm font-medium text-siage-text-primary">{{ formatarDataParaExibicao(nucleo.normativaExtincao.dataPublicacao) }}</span>
                    </div>

                    @if (nucleo.normativaExtincao.documento; as docExt) {
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
export class NucleoView implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly service = inject(NucleoService);
  readonly permissionService = inject(PermissionService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  readonly item = signal<NucleoItem | undefined>(undefined);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const found = this.service.getItem(id);
      if (found) {
        this.item.set(found);
      } else {
        this.toast.error('Núcleo não encontrado.');
        this.router.navigate(['/configuracoes/hierarquia/nucleo']);
      }
    }
  }

  formatarDataParaExibicao(val?: string): string {
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
    this.router.navigate(['/configuracoes/hierarquia/nucleo']);
  }

  onEditar() {
    const n = this.item();
    if (n) {
      this.router.navigate(['/configuracoes/hierarquia/nucleo', n.id, 'editar']);
    }
  }

  abrirHistoricoAtos() {
    const n = this.item();
    const atos = this.service.getHistoricoAtos(
      n?.id,
      n?.chefeImediato?.atoGovernamental,
      n?.chefeImediato?.nome
    );

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

export const nucleoFormDeactivateGuard: CanDeactivateFn<NucleoForm> = (
  component: NucleoForm
) => {
  return component.canDeactivate();
};

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
import { Router, ActivatedRoute, CanDeactivateFn } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';






import { MatDialog } from '@angular/material/dialog';









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
  dataFutura,
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
  if (digits.length <= 5) return digits;
  return `${digits.substring(0, 5)}-${digits.substring(5, 8)}`;
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
        <s-page-header [breadcrumbs]="[{label: 'Início', routerLink: '/inicio'}, {label: 'Configurações', routerLink: '/configuracoes'}, {label: 'Hierarquia de Unidades e Cargos', routerLink: '/configuracoes/hierarquia'}, {label: 'Configurar Núcleo'}]" title="Configurar Núcleo" description="Gerencie os núcleos subordinados a gerências regionais ou subgerências." showBack (back)="goHierarquia()"><s-button action="" type="button" (click)="onAdicionar()" aria-label="Adicionar Núcleo" icon="add" variant="primary" >

                  <span>Adicionar</span>
                </s-button></s-page-header>

        <!-- Seção de Filtros (Card SIAGE Padrão) -->
        <s-filter-card [form]="filtroCardForm" disableSearchWithoutValue [showActiveFilters]="false" (search)="onBuscar()" (clear)="onLimpar()"><ng-container [formGroup]="filtroForm">
              <!-- Filtro: Nome -->
              <div class="form-field-group">

                <s-field label="Nome" controlId="filter-nome"><s-input type="text" formControlName="nome" [maxlength]="200" placeholder="Buscar por Nome" (keydown.enter)="$event.preventDefault(); canBuscar() &amp;&amp; onBuscar()" (focusout)="filtroForm.controls.nome.markAsTouched(); " />
@if (filtroForm.controls.nome.value) { <s-icon-button icon="close" label="Limpar campo" text size="sm" (click)="limparFiltroNome()" /> }</s-field>
              </div>

              <!-- Filtro: Unidade de Trabalho (UTB) (Select com autocomplete contendo somente UTBs de Núcleos cadastrados) -->
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
      [empty]="isErro() ? {variant: 'error', title: 'Erro ao carregar dados', description: 'Não foi possível carregar as informações desta funcionalidade. Verifique sua conexão e tente novamente.', actionLabel: 'Tentar novamente'} : isSemRegistros() ? {variant: 'no-results', title: 'Nenhum registro cadastrado', description: 'Ainda não existem núcleos cadastrados.', actionLabel: ''} : isSemResultadoFiltro() ? {variant: 'no-results', title: 'Nenhum resultado encontrado', description: 'Nenhum registro corresponde aos filtros aplicados.', actionLabel: ''} : {variant: 'no-results', title: 'Nenhum resultado encontrado', description: 'Nenhum registro corresponde aos filtros aplicados.', actionLabel: ''}"
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
export class NucleoList {
  private readonly modalService = inject(SModalService);
  readonly service = inject(NucleoService);
  readonly router = inject(Router);
  readonly dialog = inject(MatDialog);
  readonly toast = inject(SToastService);
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
  readonly utbTextoDigitado = signal('');

  readonly utbsVinculadas = computed(() => {
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
    return Array.from(map.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
  });

  // Autocomplete do filtro de UTBs: somente UTBs presentes nos Núcleos cadastrados
  readonly filteredUtbsList = computed(() => {
    this.estadoFormularioOficial();
    const list = this.utbsVinculadas();
    const query = (this.utbTextoDigitado() || this.filtroUtbVal() || this.filtroForm.controls.utb.value || '').trim().toLowerCase();
    if (!query) return list;
    return list.filter(u => 
      u.codigo.toLowerCase().includes(query) || 
      u.nome.toLowerCase().includes(query) ||
      `${u.codigo} - ${u.nome}`.toLowerCase() === query
    );
  });

  readonly canBuscar = computed(() => {
    this.estadoFormularioOficial();
    this.valoresFiltroOficial();
    const nome = (this.filtroNomeVal() || this.filtroForm.controls.nome.value || '').trim();
    const utb = (this.filtroUtbVal() || this.utbTextoDigitado() || this.filtroForm.controls.utb.value || '').trim();
    const status = this.filtroStatusVal() || this.filtroForm.controls.status.value || 'TODOS';
    return nome.length > 0 || utb.length > 0 || status !== 'TODOS' || !!this.appliedUtb();
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
  readonly colunasVinculos: readonly STableColumn<NucleoItem>[] = [{key: 'nome', label: 'Nome do Núcleo', sortable: true},
    {key: 'utbNome', label: 'Unidade de Trabalho (UTB)', sortable: true},
    {key: 'criadorEditor', label: 'Criador/Editor'},
    {key: 'dataCriacao', label: 'Data de Criação', sortable: true},
    {key: 'status', label: 'Status', badge: (item) => ({label: item.status === 'ATIVO' ? 'Ativo' : 'Inativo', tone: item.status === 'ATIVO' ? 'success' : 'secondary'})}];
  readonly tableActions = computed<readonly STableAction<NucleoItem>[]>(() => [
    {id: 'view', icon: 'visibility', label: 'Visualizar Núcleo'},
    {id: 'edit', icon: 'edit', label: 'Editar Núcleo', hidden: item => !this.permissionService.canCreate() || item.status !== 'ATIVO'}
  ]);

  onTableAction(event: STableActionEvent<NucleoItem>) {
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
    this.router.navigate(['/configuracoes/hierarquia/nucleo/novo']);
  }

  onVisualizar(item: NucleoItem) {
    this.router.navigate(['/configuracoes/hierarquia/nucleo', item.id]);
  }

  onEditar(item: NucleoItem) {
    this.router.navigate(['/configuracoes/hierarquia/nucleo', item.id, 'editar']);
  }

  onSwitchOficial(item: NucleoItem, chave: NgModel) {
    chave.control.setValue(item.status === 'ATIVO', {emitViewToModelChange: false});
    this.onToggleStatus(item, chave);
  }

  onToggleStatus(item: NucleoItem, chave?: NgModel) {
    if (item.status === 'INATIVO') {
      this.toast.warning('A inativação de um Núcleo é irreversível. O registro não pode ser reativado.');
      return;
    }

    // 1. Confirmação inicial
    const dialogRef = from(this.modalService.confirm({title: 'Inativar registro?', description: `Deseja inativar ${item.nome}? A inativação é irreversível e o registro não poderá ser reativado.`, cancelLabel: 'Cancelar', confirmLabel: 'Sim, inativar', variant: 'destructive'}));

    dialogRef.subscribe((confirmado: boolean) => {
      if (!confirmado) return;

      const temNormativaExtincao = !!item.normativaExtincao?.documento;
      const temChefe = !!item.chefeImediato;

      // 2. Havendo Chefe Imediato, bloqueia com o modal de impedimento
      if (temChefe) {
        this.modalService.open(ImpedimentoInativacaoModal, {width: '520px',
maxWidth: 'calc(100vw - 2.5rem)',
autoFocus: false,
data: {
            nome: item.nome,
            temNormativaExtincao,
            totalSubordinadas: 0,
            temChefe: true,
            nomeChefe: item.chefeImediato?.nome,
            unidadesDescricao: ''
          }});
        return;
      }

      // 3. Sem chefe, se faltar Normativa de Extinção, permite anexar
      if (!temNormativaExtincao) {
        const anexarRef = this.modalService.open<AnexarNormativaExtincaoModal, unknown, NormativaItem>(AnexarNormativaExtincaoModal, {width: '560px',
maxWidth: 'calc(100vw - 2.5rem)',
autoFocus: false,
data: {
            nome: item.nome,
            entidadeTipo: 'Núcleo'
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

      // 4. Sem chefe e com normativa: conclui inativação
      this.service.inativar(item.id);
            chave?.control.setValue(false, {emitViewToModelChange: false});
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
  providers: [
    {provide: DateAdapter, useClass: SDateAdapter},
    {provide: MAT_DATE_FORMATS, useValue: S_DATE_FORMATS},
    {provide: MAT_DATE_LOCALE, useValue: 'pt-BR'},
    {provide: MatDatepickerIntl, useClass: SDatepickerIntl}
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AcessoRestritoComponent,
    SPageHeaderComponent,
    SFieldComponent,
    SInputComponent,
    SIconButtonComponent,
    SAutocompleteComponent,
    SSelectComponent,
    SIconComponent,
    STooltipDirective,
    SButtonComponent,
    SDatepickerComponent,
    SFileUploadComponent
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
      <app-acesso-restrito backUrl="/configuracoes/hierarquia/nucleo" />
    } @else {
      <div class="flex flex-col gap-6 max-w-7xl mx-auto w-full font-sans pb-16">
        <!-- Breadcrumb e Cabeçalho Principal -->
        <s-page-header [breadcrumbs]="[{label: 'Início', routerLink: '/inicio'}, {label: 'Configurações', routerLink: '/configuracoes'}, {label: 'Hierarquia de Unidades e Cargos', routerLink: '/configuracoes/hierarquia'}, {label: 'Configurar Núcleo', routerLink: '/configuracoes/hierarquia/nucleo'}, {label: isEditMode() ? 'Editar' : 'Cadastrar'}]" title="{{ isEditMode() ? 'Editar Núcleo' : 'Adicionar Núcleo' }}" description="{{ isEditMode() ? 'Atualize as informações, endereço, chefia e normativas do Núcleo.' : 'Preencha os campos obrigatórios para estruturar o Núcleo.' }}" showBack (back)="onCancelar()"></s-page-header>

        <!-- FORMULÁRIO ORGANIZADO EM SEÇÕES -->
        <form [formGroup]="form" class="flex flex-col gap-6">

          <!-- ============================================== -->
          <!-- SEÇÃO 1: IDENTIFICAÇÃO DO NÚCLEO               -->
          <!-- ============================================== -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <s-icon name="domain" size="xs"  />
              <span>1. Identificação</span>
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              <!-- Nome do Núcleo -->
              <div class="md:col-span-2 form-field-group">

                <s-field label="Nome do Núcleo" controlId="form-nome" required [error]="(form.get('nome')?.hasError('required') &amp;&amp; form.get('nome')?.touched) ? 'O Nome do Núcleo é obrigatório.' : (form.get('nome')?.hasError('duplicado')) ? 'Já existe um Núcleo cadastrado com este nome.' : ''"><s-input formControlName="nome" [maxlength]="200" placeholder="Digite o Nome do Núcleo" (focusout)="form.controls.nome.markAsTouched(); " /></s-field><span align="end" class="text-xs text-siage-text-secondary">
                    {{ (form.get('nome')?.value || '').length }} / 200
                  </span>
              </div>

              <!-- Selecione o vínculo (Gerência Regional ou Subgerência) - ocupa sempre 50% da linha -->
              <div class="form-field-group">

                <s-field label="Selecione o vínculo" controlId="form-tipo-vinculo" required [error]="(form.get('tipoVinculo')?.hasError('required') &amp;&amp; form.get('tipoVinculo')?.touched) ? 'O tipo de vínculo é obrigatório.' : ''"><s-select formControlName="tipoVinculo" placeholder="Selecione" (selectionChange)="onTipoVinculoChange()" [options]="[{label: 'Gerência Regional', value: 'GERENCIA_REGIONAL'}, {label: 'Subgerência', value: 'SUBGERENCIA'}]" [clearable]="false" /></s-field>
              </div>

              <!-- Unidade Superior: Sempre visível nos outros 50% (desabilitado se nenhum vínculo selecionado) -->
              @if (!form.get('tipoVinculo')?.value) {
                <div class="form-field-group">

                  <s-field label="Unidade Superior" controlId="form-unidade-superior-disabled" required><s-input type="text" disabled="" placeholder="Selecione o vínculo primeiro"  /></s-field>
                </div>
              } @else if (form.get('tipoVinculo')?.value === 'GERENCIA_REGIONAL') {
                <div class="form-field-group">

                  <s-field label="Gerência Regional" controlId="form-ger-reg" required [error]="((form.get('unidadeSuperiorId')?.hasError('required') || gerRegInputControl.hasError('required') || gerRegInputControl.hasError('invalido')) &amp;&amp; (form.get('unidadeSuperiorId')?.touched || gerRegInputControl.touched)) ? 'A Gerência Regional é obrigatória.' : ''"><s-autocomplete [formControl]="gerRegInputControlOficial" placeholder="Selecione ou busque a Gerência Regional vinculada" [options]="opcoesform_ger_reg()" (selectionChange)="selecionarform_ger_reg($event)" (input)="gerRegInputControl.setValue($any($event.target).value)" (focusout)="gerRegInputControl.markAsTouched(); onGerRegBlur()" /></s-field>
                </div>
              } @else if (form.get('tipoVinculo')?.value === 'SUBGERENCIA') {
                <div class="form-field-group">

                  <s-field label="Subgerência" controlId="form-subgerencia" required [error]="((form.get('unidadeSuperiorId')?.hasError('required') || subgerInputControl.hasError('required') || subgerInputControl.hasError('invalido')) &amp;&amp; (form.get('unidadeSuperiorId')?.touched || subgerInputControl.touched)) ? 'A Subgerência é obrigatória.' : ''"><s-autocomplete [formControl]="subgerInputControlOficial" placeholder="Selecione ou busque a Subgerência vinculada" [options]="opcoesform_subgerencia()" (selectionChange)="selecionarform_subgerencia($event)" (input)="subgerInputControl.setValue($any($event.target).value)" (focusout)="subgerInputControl.markAsTouched(); onSubgerBlur()" /></s-field>
                </div>
              }

              <!-- Unidade de Trabalho (UTB) -->
              <div class="md:col-span-2 form-field-group">

                <s-field label="Unidade de Trabalho (UTB)" controlId="form-utb" required [error]="(utbInputControl.hasError('emUso') || form.get('utbCodigo')?.hasError('emUso')) ? 'A Unidade de Trabalho (UTB) selecionada já está vinculada a outra unidade ativa.' : ((form.get('utbCodigo')?.hasError('required') || utbInputControl.hasError('required')) &amp;&amp; (form.get('utbCodigo')?.touched || utbInputControl.touched)) ? 'A Unidade de Trabalho (UTB) é obrigatória.' : ''"><s-autocomplete [formControl]="utbInputControlOficial" placeholder="Selecione ou busque uma unidade de trabalho" [options]="opcoesform_utb()" (selectionChange)="selecionarform_utb($event)" (input)="utbInputControl.setValue($any($event.target).value)" (focusout)="utbInputControl.markAsTouched(); onUtbBlur()" /></s-field>@if (isUtbBloqueada()) {<span class="text-xs text-siage-text-secondary">
                      <span class="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                        <s-icon name="lock" size="xs"  />
                        A Unidade de Trabalho (UTB) não pode ser alterada porque existe chefia vinculada.
                      </span>
                    </span>}
              </div>
            </div>

            <!-- SUBSEÇÃO: ENDEREÇO DO NÚCLEO (OBRIGATÓRIO NO CADASTRO DO NÚCLEO) -->
            <div class="mt-4 pt-4 border-t border-siage-border/40 flex flex-col gap-4">
              <div class="flex items-center gap-2">
                <s-icon name="location_on" size="xs" class="text-siage-primary" />
                <span class="text-xs font-poppins font-bold uppercase tracking-wider text-siage-primary">
                  Endereço
                </span>
              </div>

              <!-- Grid de Endereço em 3 linhas -->
              <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                <!-- Linha 1: CEP (4 cols) e Município (8 cols) -->
                <div class="col-span-12 md:col-span-4 form-field-group">

                  <s-field label="CEP" controlId="form-cep" required [error]="(form.get('cep')?.hasError('required') &amp;&amp; form.get('cep')?.touched) ? 'O CEP é obrigatório.' : (form.get('cep')?.hasError('cepIncompleto') &amp;&amp; form.get('cep')?.touched) ? 'O CEP informado deve conter exatamente 8 dígitos.' : (form.get('cep')?.hasError('cepForaPb') &amp;&amp; form.get('cep')?.touched) ? 'O CEP preenchido não pertence ao estado da Paraíba. Por favor, informe um CEP vinculado a municípios do Estado da Paraíba.' : ''"><s-input formControlName="cep" [maxlength]="9" placeholder="00000-000" (input)="onCepInput($event)" (focusout)="form.controls.cep.markAsTouched(); onCepBlur()" /></s-field>
                  @if (cepFeedback() && !form.get('cep')?.hasError('cepIncompleto') && !form.get('cep')?.hasError('cepForaPb')) {
                    <span 
                      class="text-xs font-medium flex items-center gap-1 mt-1 leading-tight text-amber-600 dark:text-amber-400"
                    >
                      <s-icon name="info" size="xs" class="shrink-0" />
                      <span>{{ cepFeedback() }}</span>
                    </span>
                  }
                </div>

                <div class="col-span-12 md:col-span-8 form-field-group">

                  <s-field label="Município" controlId="form-municipio" required [error]="(form.get('municipio')?.hasError('required') &amp;&amp; form.get('municipio')?.touched) ? 'O Município é obrigatório.' : ''"><s-autocomplete formControlName="municipio" placeholder="Selecione ou digite o município da Paraíba" [options]="opcoesform_municipio()" (input)="onMunicipioInput($event)" (selectionChange)="onMunicipioSelectionChange($event)" (focusout)="form.controls.municipio.markAsTouched()" /></s-field>
                </div>

                <!-- Linha 2: Rua (9 cols) e Número (3 cols) -->
                <div class="col-span-12 md:col-span-9 form-field-group">

                  <s-field label="Rua / Logradouro" controlId="form-rua" required [error]="(form.get('rua')?.hasError('required') &amp;&amp; form.get('rua')?.touched) ? 'A Rua / Logradouro é obrigatória.' : ''"><s-input formControlName="rua" [maxlength]="200" placeholder="Digite a Rua / Logradouro" (focusout)="form.controls.rua.markAsTouched(); " /></s-field>
                </div>

                <div class="col-span-12 md:col-span-3 form-field-group">

                  <s-field label="Número" controlId="form-numero" required [error]="(form.get('numero')?.hasError('required') &amp;&amp; form.get('numero')?.touched) ? 'O Número é obrigatório.' : ''"><s-input formControlName="numero" [maxlength]="4" placeholder="Digite o Número" (input)="onNumeroInput($event)" (focusout)="form.controls.numero.markAsTouched(); " /></s-field>
                </div>

                <!-- Linha 3: Bairro (6 cols) e Complemento (6 cols) -->
                <div class="col-span-12 md:col-span-6 form-field-group">

                  <s-field label="Bairro" controlId="form-bairro" required [error]="(form.get('bairro')?.hasError('required') &amp;&amp; form.get('bairro')?.touched) ? 'O Bairro é obrigatório.' : ''"><s-input formControlName="bairro" [maxlength]="200" placeholder="Digite o Bairro" (focusout)="form.controls.bairro.markAsTouched(); " /></s-field>
                </div>

                <div class="col-span-12 md:col-span-6 form-field-group">

                  <s-field label="Complemento" controlId="form-complemento"><s-input formControlName="complemento" [maxlength]="200" placeholder="Digite o Complemento" (focusout)="form.controls.complemento.markAsTouched(); " /></s-field>
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
                <s-icon name="badge" size="xs"  />
                <span>2. Chefia Imediata e Ato Governamental</span>
              </h3>

              <!-- Ação de Adicionar Chefe (quando ainda não houver chefe) -->
              @if (!chefeImediato()) {
                <s-button type="button" (click)="abrirBuscaChefe()" [disabled]="!form.get('utbCodigo')?.value" [sTooltip]="!form.get('utbCodigo')?.value ? 'Selecione uma UTB para poder vincular um Chefe Imediato' : 'Buscar servidor para chefia'" icon="person_add" variant="primary" >

                  <span>Adicionar Chefe</span>
                </s-button>
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
                    <s-button type="button" (click)="removerChefe()" icon="close" variant="destructive" outlined>

                      <span>Remover Chefe</span>
                    </s-button>
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
                        Ato Governamental de Nomeação *
                      </span>
                    </div>

                    @if (isEditMode()) {
                      <s-button type="button" (click)="abrirHistoricoAtos()" title="Consultar histórico de atos governamentais" icon="history" variant="secondary" outlined>

                        <span>Consultar histórico</span>
                      </s-button>
                    }
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Número do Ato -->
                    <div class="form-field-group">

                      <s-field label="Número do Ato Governamental" controlId="form-ato-num" required [error]="(atoNumeroControl.hasError('required') &amp;&amp; atoNumeroControl.touched) ? 'O Número do Ato é obrigatório.' : (atoNumeroControl.hasError('maxlength') &amp;&amp; atoNumeroControl.touched) ? 'O Número do Ato deve ter no máximo 20 caracteres.' : ''"><s-input [formControl]="atoNumeroControl" [maxlength]="20" placeholder="Digite o Número do Ato Governamental" (focusout)="atoNumeroControl.markAsTouched(); " /></s-field><span align="end" class="text-xs text-siage-text-secondary">
                          {{ (atoNumeroControl.value || '').length }} / 20
                        </span>
                    </div>

                    <!-- Data da Publicação -->
                    <div class="form-field-group">
                      <s-field label="Data da Publicação" controlId="form-ato-data" required [error]="atoDataControl.touched &amp;&amp; atoDataControl.invalid ? (atoDataControl.getError('dataFormato') || atoDataControl.getError('dataRange') || 'A Data da Publicação é obrigatória.') : ''"><s-datepicker [formControl]="atoDataPicker.dateControl" [min]="dataMinima" [max]="dataMaxima" [openOnClick]="false" placeholder="DD/MM/AAAA" (input)="atoDataPicker.onInput($event)" (focusout)="atoDataPicker.onFocusOut($event)" /></s-field>
                    </div>
                  </div>

                  <!-- Upload do Documento do Ato -->
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
                <!-- Se estiver cadastrando novo Núcleo, exibe campos editáveis -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="md:col-span-3 form-field-group">

                    <s-field label="Nome da Normativa de Criação" controlId="form-norm-cria-nome" required [error]="(normCriacaoNomeControl.hasError('required') &amp;&amp; normCriacaoNomeControl.touched) ? 'O Nome da Normativa de Criação é obrigatório.' : (normCriacaoNomeControl.hasError('maxlength') &amp;&amp; normCriacaoNomeControl.touched) ? 'O Nome da Normativa de Criação deve ter no máximo 100 caracteres.' : ''"><s-input [formControl]="normCriacaoNomeControl" [maxlength]="100" placeholder="Digite o Nome da Normativa de Criação" (focusout)="normCriacaoNomeControl.markAsTouched(); " /></s-field><span align="end" class="text-xs text-siage-text-secondary">
                        {{ (normCriacaoNomeControl.value || '').length }} / 100
                      </span>
                  </div>

                  <div class="form-field-group">

                    <s-field label="Número da Normativa de Criação" controlId="form-norm-cria-numero" required [error]="(normCriacaoNumeroControl.hasError('required') &amp;&amp; normCriacaoNumeroControl.touched) ? 'O Número da Normativa de Criação é obrigatório.' : (normCriacaoNumeroControl.hasError('maxlength') &amp;&amp; normCriacaoNumeroControl.touched) ? 'O Número da Normativa de Criação deve ter no máximo 20 caracteres.' : ''"><s-input [formControl]="normCriacaoNumeroControl" [maxlength]="20" placeholder="Digite o Número da Normativa de Criação" (focusout)="normCriacaoNumeroControl.markAsTouched(); " /></s-field>
                  </div>

                  <div class="md:col-span-2 form-field-group">
                    <s-field label="Data da Publicação" controlId="form-norm-cria-data" required [error]="normCriacaoDataControl.touched &amp;&amp; normCriacaoDataControl.invalid ? (normCriacaoDataControl.getError('dataFormato') || normCriacaoDataControl.getError('dataRange') || 'A Data da Publicação é obrigatória.') : ''"><s-datepicker [formControl]="normCriacaoDataPicker.dateControl" [min]="dataMinima" [max]="dataMaxima" [openOnClick]="false" placeholder="DD/MM/AAAA" (input)="normCriacaoDataPicker.onInput($event)" (focusout)="normCriacaoDataPicker.onFocusOut($event)" /></s-field>
                  </div>

                  <!-- Anexo da Normativa de Criação -->
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

            <!-- BLOCO 2: NORMATIVA DE EXTINÇÃO (OPCIONAL NO CADASTRO/EDIÇÃO) -->
            <div class="pt-4 border-t border-siage-border/40 flex flex-col gap-4">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-2">
                  <s-icon name="history_edu" size="xs" class="text-amber-600" />
                  <span class="text-xs font-poppins font-bold uppercase tracking-wider text-siage-text-primary">
                    Normativa de Extinção
                  </span>
                </div>

                @if (!hasPersistedNormativaExtincao() && !temNormativaExtincao() && !expandindoNormativaExtincao()) {
                  <s-button type="button" (click)="abrirFormularioNormativaExtincao()" icon="add" variant="primary" >

                    <span>Adicionar Normativa de Extinção</span>
                  </s-button>
                }
              </div>

              <!-- Estado 1: Normativa já persistida ou confirmada -->
              @if (hasPersistedNormativaExtincao() || temNormativaExtincao()) {
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
export class NucleoForm implements OnInit {
  readonly service = inject(NucleoService);
  readonly subgerService = inject(SubgerenciaService);
  readonly gerRegService = inject(GerenciaRegionalService);
  readonly secGeralService = inject(SecretariaGeralService);
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly dialog = inject(MatDialog);
  readonly toastService = inject(SToastService);
  readonly permissionService = inject(PermissionService);
  readonly modalService = inject(SModalService);

  readonly isEditMode = signal(false);
  readonly isSaving = signal(false);
  readonly formatarDataParaExibicao = formatarDataParaExibicao;
  itemId: string | null = null;
  currentItem?: NucleoItem;

  // Controles Autocomplete e Seletores
  readonly gerRegInputControl = new FormControl('');
  readonly subgerInputControl = new FormControl('');
  readonly utbInputControl = new FormControl({ value: '', disabled: true });

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
  readonly municipioTextoDigitado = signal('');

  onMunicipioInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    const val = target?.value ?? '';
    this.municipioTextoDigitado.set(val);
    if (!val && this.form.controls.municipio.value) {
      this.form.controls.municipio.setValue('', { emitEvent: true });
    }
  }

  onMunicipioSelectionChange(selection: SAutocompleteSelection | null) {
    this.municipioTextoDigitado.set(selection?.label ?? '');
  }

  readonly filteredMunicipios = computed(() => {
    this.estadoFormularioOficial();
    const query = (this.municipioTextoDigitado() || this.municipioVal() || this.form.get('municipio')?.value || '').trim().toLowerCase();
    if (!query) return MUNICIPIOS_PARAIBA;
    return MUNICIPIOS_PARAIBA.filter(m => m.toLowerCase().includes(query));
  });

  // Bloqueio de alteração de UTB: se estiver em edição e possuir chefia imediata vinculada
  readonly isUtbBloqueada = computed(() => {
    if (!this.isEditMode()) return false;
    return !!this.chefeImediato();
  });

  // Unidade superior (Gerência Regional ou Subgerência, conforme o tipo de vínculo) selecionada e válida
  readonly hasUnidadeSuperiorValida = computed(() => {
    this.estadoFormularioOficial();
    const tipo = this.tipoVinculoVal() || this.form.controls.tipoVinculo.value;
    const id = (this.form.controls.unidadeSuperiorId.value || '').trim();
    if (!tipo || !id) return false;
    return tipo === 'GERENCIA_REGIONAL' ? !!this.gerRegService.getItem(id) : !!this.subgerService.getItem(id);
  });

  readonly isUtbDesabilitada = computed(() => this.isUtbBloqueada() || !this.hasUnidadeSuperiorValida());

  // Mantém a UTB efetivamente travada (não só o aviso) enquanto houver impedimento ou sem unidade superior
  private readonly syncUtbDisableState = effect(() => {
    this.atualizarEstadoUtb();
  });

  private atualizarEstadoUtb() {
    if (this.isUtbDesabilitada()) {
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

    readonly opcoesform_ger_reg = computed(() => {
    const atual = this.valorgerRegInputControlOficial() || this.form.controls.unidadeSuperiorId.value;
    const base = this.gerRegService.items()
      .filter(gr => gr.status === 'ATIVO')
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    const opcoes = base.map(gr => ({label: gr.nome, value: gr.id}));
    if (atual && !opcoes.some(o => o.value === atual)) {
      const selecionada = this.gerRegService.getItem(atual);
      if (selecionada) return [{label: selecionada.nome, value: selecionada.id}, ...opcoes];
      if (this.currentItem && this.currentItem.tipoVinculo === 'GERENCIA_REGIONAL' && this.currentItem.unidadeSuperiorId === atual) {
        return [{label: this.currentItem.unidadeSuperiorNome, value: atual}, ...opcoes];
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
    readonly estadogerRegInputControl = toSignal(this.gerRegInputControl.valueChanges, {initialValue: this.gerRegInputControl.value});
  readonly estadosubgerInputControl = toSignal(this.subgerInputControl.valueChanges, {initialValue: this.subgerInputControl.value});
  readonly estadoutbInputControl = toSignal(this.utbInputControl.valueChanges, {initialValue: this.utbInputControl.value});
  readonly estadoatoNumeroControl = toSignal(this.atoNumeroControl.valueChanges, {initialValue: this.atoNumeroControl.value});
  readonly estadoatoDataControl = toSignal(this.atoDataControl.valueChanges, {initialValue: this.atoDataControl.value});
  readonly estadonormCriacaoNomeControl = toSignal(this.normCriacaoNomeControl.valueChanges, {initialValue: this.normCriacaoNomeControl.value});
  readonly estadonormCriacaoNumeroControl = toSignal(this.normCriacaoNumeroControl.valueChanges, {initialValue: this.normCriacaoNumeroControl.value});
  readonly estadonormCriacaoDataControl = toSignal(this.normCriacaoDataControl.valueChanges, {initialValue: this.normCriacaoDataControl.value});
  readonly estadonormExtincaoNomeControl = toSignal(this.normExtincaoNomeControl.valueChanges, {initialValue: this.normExtincaoNomeControl.value});
  readonly estadonormExtincaoNumeroControl = toSignal(this.normExtincaoNumeroControl.valueChanges, {initialValue: this.normExtincaoNumeroControl.value});
  readonly estadonormExtincaoDataControl = toSignal(this.normExtincaoDataControl.valueChanges, {initialValue: this.normExtincaoDataControl.value});
  readonly estadoFormularioOficial = toSignal(this.form.valueChanges, {initialValue: this.form.value});
  onCliqueDownloadLocal(_event: MouseEvent, _arquivo: File | null, _doc: DocumentoAnexo | undefined) {}
  onFileUploadError(error: SFileError) {
    if (error.kind === 'size') this.toastService.error('O arquivo deve ter no máximo 10 MB.');
    else this.toastService.warning('Formato não suportado. Utilize PDF, JPG, JPEG ou PNG.');
  }
  selecionarform_ger_reg(selection: SAutocompleteSelection | null) {
    if (selection) { this.onGerRegionalSelected(String(selection.value)); } else { this.limparGerReg(); }
  }
  readonly gerRegInputControlOficial = new FormControl<string | null>(null);
  private readonly syncgerRegInputControlOficial = effect(() => {
    this.estadoFormularioOficial();
    this.isUtbBloqueada();
    const nextVal = this.valorgerRegInputControlOficial() || this.form.controls.unidadeSuperiorId.value || null;
    if (this.gerRegInputControlOficial.value !== nextVal) {
      this.gerRegInputControlOficial.setValue(nextVal, {emitEvent: false});
    }
    const shouldDisable = this.gerRegInputControl.disabled;
    if (shouldDisable && !this.gerRegInputControlOficial.disabled) {
      this.gerRegInputControlOficial.disable({emitEvent: false});
    } else if (!shouldDisable && this.gerRegInputControlOficial.disabled) {
      this.gerRegInputControlOficial.enable({emitEvent: false});
    }
  });
  readonly valorgerRegInputControlOficial = toSignal(this.form.controls.unidadeSuperiorId.valueChanges, {initialValue: this.form.controls.unidadeSuperiorId.value});
  readonly opcoesform_subgerencia = computed(() => {
    const atual = this.valorsubgerInputControlOficial() || this.form.controls.unidadeSuperiorId.value;
    const base = this.subgerService.items()
      .filter(s => s.status === 'ATIVO')
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    const opcoes = base.map(sub => ({label: sub.nome, value: sub.id}));
    if (atual && !opcoes.some(o => o.value === atual)) {
      const selecionada = this.subgerService.getItem(atual);
      if (selecionada) return [{label: selecionada.nome, value: selecionada.id}, ...opcoes];
      if (this.currentItem && this.currentItem.tipoVinculo === 'SUBGERENCIA' && this.currentItem.unidadeSuperiorId === atual) {
        return [{label: this.currentItem.unidadeSuperiorNome, value: atual}, ...opcoes];
      }
    }
    return opcoes;
  });
  selecionarform_subgerencia(selection: SAutocompleteSelection | null) {
    if (selection) { this.onSubgerenciaSelected(String(selection.value)); } else { this.limparSubger(); }
  }
  readonly subgerInputControlOficial = new FormControl<string | null>(null);
  private readonly syncsubgerInputControlOficial = effect(() => {
    this.estadoFormularioOficial();
    this.isUtbBloqueada();
    const nextVal = this.valorsubgerInputControlOficial() || this.form.controls.unidadeSuperiorId.value || null;
    if (this.subgerInputControlOficial.value !== nextVal) {
      this.subgerInputControlOficial.setValue(nextVal, {emitEvent: false});
    }
    const shouldDisable = this.subgerInputControl.disabled;
    if (shouldDisable && !this.subgerInputControlOficial.disabled) {
      this.subgerInputControlOficial.disable({emitEvent: false});
    } else if (!shouldDisable && this.subgerInputControlOficial.disabled) {
      this.subgerInputControlOficial.enable({emitEvent: false});
    }
  });
  readonly valorsubgerInputControlOficial = toSignal(this.form.controls.unidadeSuperiorId.valueChanges, {initialValue: this.form.controls.unidadeSuperiorId.value});
  readonly opcoesform_utb = computed(() => {
    const atual = this.valorutbInputControlOficial() || this.form.controls.utbCodigo.value;
    const base = this.secGeralService.utbs();
    const opcoes = base.map(utb => ({label: `${utb.codigo} - ${utb.nome}`, value: utb.codigo}));
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
  readonly opcoesform_municipio = computed(() => {
    const atual = (this.municipioVal() || this.form.controls.municipio.value || '').trim();
    const opcoes = MUNICIPIOS_PARAIBA.map(m => ({label: m, value: m}));
    if (atual && !opcoes.some(o => o.value === atual)) {
      return [{label: atual, value: atual}, ...opcoes];
    }
    return opcoes;
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
      cep: formatarCep(item.endereco?.cep || ''),
      municipio: item.endereco?.municipio || '',
      rua: item.endereco?.rua || '',
      numero: item.endereco?.numero || '',
      bairro: item.endereco?.bairro || '',
      complemento: item.endereco?.complemento || ''
    });

    if (item.tipoVinculo === 'GERENCIA_REGIONAL') {
      this.gerRegInputControl.setValue(item.unidadeSuperiorNome);
      this.gerRegInputControlOficial.setValue(item.unidadeSuperiorId, { emitEvent: false });
    } else if (item.tipoVinculo === 'SUBGERENCIA') {
      this.subgerInputControl.setValue(item.unidadeSuperiorNome);
      this.subgerInputControlOficial.setValue(item.unidadeSuperiorId, { emitEvent: false });
    }

    this.utbInputControl.setValue(item.utbNome);
    this.utbInputControlOficial.setValue(item.utbCodigo, { emitEvent: false });
    this.municipioTextoDigitado.set(item.endereco?.municipio || '');

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
    this.gerRegInputControlOficial.setValue(null, { emitEvent: false });
    this.subgerInputControl.setValue('');
    this.subgerInputControlOficial.setValue(null, { emitEvent: false });
    this.gerRegInputControl.setErrors(null);
    this.subgerInputControl.setErrors(null);
  }

  onGerRegionalSelected(grId: string) {
    const gr = this.gerRegService.getItem(grId);
    if (gr) {
      this.form.get('unidadeSuperiorId')?.setValue(gr.id);
      this.form.get('unidadeSuperiorNome')?.setValue(gr.nome);
      this.gerRegInputControl.setValue(gr.nome);
      this.gerRegInputControlOficial.setValue(gr.id, { emitEvent: false });
      this.gerRegInputControl.setErrors(null);
    }
  }

  limparGerReg() {
    this.gerRegInputControl.setValue('');
    this.gerRegInputControlOficial.setValue(null, { emitEvent: false });
    this.form.get('unidadeSuperiorId')?.setValue('');
    this.form.get('unidadeSuperiorNome')?.setValue('');
  }

  onSubgerenciaSelected(subId: string) {
    const sub = this.subgerService.getItem(subId);
    if (sub) {
      this.form.get('unidadeSuperiorId')?.setValue(sub.id);
      this.form.get('unidadeSuperiorNome')?.setValue(sub.nome);
      this.subgerInputControl.setValue(sub.nome);
      this.subgerInputControlOficial.setValue(sub.id, { emitEvent: false });
      this.subgerInputControl.setErrors(null);
    }
  }

  limparSubger() {
    this.subgerInputControl.setValue('');
    this.subgerInputControlOficial.setValue(null, { emitEvent: false });
    this.form.get('unidadeSuperiorId')?.setValue('');
    this.form.get('unidadeSuperiorNome')?.setValue('');
  }

  onGerRegBlur() {
    const raw = (this.gerRegInputControl.value || '').trim();
    if (!raw) {
      this.form.get('unidadeSuperiorId')?.setValue('');
      this.form.get('unidadeSuperiorNome')?.setValue('');
      this.gerRegInputControlOficial.setValue(null, { emitEvent: false });
      return;
    }
    const match = this.gerRegService.items().find(g => g.status === 'ATIVO' && g.nome.toLowerCase() === raw.toLowerCase());
    if (match) {
      this.form.get('unidadeSuperiorId')?.setValue(match.id);
      this.form.get('unidadeSuperiorNome')?.setValue(match.nome);
      this.gerRegInputControl.setValue(match.nome, { emitEvent: false });
      this.gerRegInputControlOficial.setValue(match.id, { emitEvent: false });
      this.gerRegInputControl.setErrors(null);
    } else {
      const currentId = this.form.get('unidadeSuperiorId')?.value;
      const current = currentId ? this.gerRegService.getItem(currentId) : undefined;
      if (current && current.nome.toLowerCase() === raw.toLowerCase()) {
        this.gerRegInputControl.setValue(current.nome, { emitEvent: false });
        this.gerRegInputControlOficial.setValue(current.id, { emitEvent: false });
        this.gerRegInputControl.setErrors(null);
      } else {
        this.form.get('unidadeSuperiorId')?.setValue('');
        this.form.get('unidadeSuperiorNome')?.setValue('');
        this.gerRegInputControlOficial.setValue(null, { emitEvent: false });
        this.gerRegInputControl.setErrors({ required: true, invalido: true });
      }
    }
  }

  onSubgerBlur() {
    const raw = (this.subgerInputControl.value || '').trim();
    if (!raw) {
      this.form.get('unidadeSuperiorId')?.setValue('');
      this.form.get('unidadeSuperiorNome')?.setValue('');
      this.subgerInputControlOficial.setValue(null, { emitEvent: false });
      return;
    }
    const match = this.subgerService.items().find(s => s.status === 'ATIVO' && s.nome.toLowerCase() === raw.toLowerCase());
    if (match) {
      this.form.get('unidadeSuperiorId')?.setValue(match.id);
      this.form.get('unidadeSuperiorNome')?.setValue(match.nome);
      this.subgerInputControl.setValue(match.nome, { emitEvent: false });
      this.subgerInputControlOficial.setValue(match.id, { emitEvent: false });
      this.subgerInputControl.setErrors(null);
    } else {
      const currentId = this.form.get('unidadeSuperiorId')?.value;
      const current = currentId ? this.subgerService.getItem(currentId) : undefined;
      if (current && current.nome.toLowerCase() === raw.toLowerCase()) {
        this.subgerInputControl.setValue(current.nome, { emitEvent: false });
        this.subgerInputControlOficial.setValue(current.id, { emitEvent: false });
        this.subgerInputControl.setErrors(null);
      } else {
        this.form.get('unidadeSuperiorId')?.setValue('');
        this.form.get('unidadeSuperiorNome')?.setValue('');
        this.subgerInputControlOficial.setValue(null, { emitEvent: false });
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
        if (dados.municipio) {
          this.form.controls.municipio.setValue(dados.municipio);
          this.municipioTextoDigitado.set(dados.municipio);
        }
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
    if (this.isUtbDesabilitada()) return;
    const utb = this.secGeralService.utbs().find(u => u.codigo === codigo);
    if (!utb) return;

    const currentCodigo = this.form.getRawValue().utbCodigo;
    if (currentCodigo === codigo && !this.utbInputControl.hasError('emUso')) return;

    // Exclusividade: mantém a UTB selecionada e visível com erro até o usuário escolher uma UTB válida
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

  // Chefia Imediata
  abrirBuscaChefe() {
    const utb = this.form.get('utbCodigo')?.value;
    if (!utb) {
      this.toastService.warning('Selecione primeiro uma Unidade de Trabalho (UTB).');
      return;
    }

    const dialogRef = this.modalService.open<BuscaServidorModal, unknown, ServidorUtbItem>(BuscaServidorModal, {width: '760px',
maxWidth: 'calc(100vw - 2.5rem)',
autoFocus: false,
data: {visualSecretariaGeral: true,
        utbCodigo: utb
      }});

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

  onFileAtoSelected(event: Event | File | null) {
    if (!event) return;
    const input = event instanceof File ? null : event.target as HTMLInputElement;
    const file = event instanceof File ? event : input?.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.toastService.error('O arquivo deve ter no máximo 10 MB.');
      if (input) input.value = '';
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
    if (input) input.value = '';
  }

  removerDocAto() {
    this.atoDocumento.set(undefined);
  }

  // Normativa de Criação
  onFileNormCriacaoSelected(event: Event | File | null) {
    if (!event) return;
    const input = event instanceof File ? null : event.target as HTMLInputElement;
    const file = event instanceof File ? event : input?.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.toastService.error('O arquivo deve ter no máximo 10 MB.');
      if (input) input.value = '';
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
    if (input) input.value = '';
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
    const input = event instanceof File ? null : event.target as HTMLInputElement;
    const file = event instanceof File ? event : input?.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.toastService.error('O arquivo deve ter no máximo 10 MB.');
      if (input) input.value = '';
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
    if (input) input.value = '';
  }

  removerChefe() {
    const dialogRef = from(this.modalService.confirm({title: 'Remover Chefe Imediato?', description: 'Deseja remover o vínculo da chefia imediata deste Núcleo? O Ato Governamental associado também será desvinculado.', cancelLabel: 'Cancelar', confirmLabel: 'Sim, remover', variant: 'destructive'}));

    dialogRef.subscribe((confirmado: boolean) => {
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

    this.modalService.open(HistoricoAtosModal, {width: '900px',
maxWidth: 'calc(100vw - 2.5rem)',
autoFocus: false,
data: { atos }});
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

    // 1. Identificação: Nome, Tipo de Vínculo, Unidade Superior e UTB
    const nome = (this.form.get('nome')?.value || '').trim();
    const tipoVinculo = this.form.get('tipoVinculo')?.value;
    const superiorId = (this.form.get('unidadeSuperiorId')?.value || '').trim();
    const superiorNome = (this.form.get('unidadeSuperiorNome')?.value || '').trim();
    const utbCodigo = (this.form.getRawValue().utbCodigo || '').trim();

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

    const munValor = (this.form.get('municipio')?.value || this.municipioTextoDigitado() || '').trim();
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
      } else if (!validarDataFormato(normCriaData) || dataFutura(normCriaData)) {
        this.normCriacaoDataControl.setErrors(dataFutura(normCriaData) ? { dataRange: 'A data não pode ser futura.' } : { dataFormato: 'Informe uma data válida no formato DD/MM/AAAA.' });
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
          el = target.querySelector('input:not([type="file"]), button, [tabindex="0"]') || target;
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
    const dialogRef = from(this.modalService.confirm({title: 'Tem certeza que deseja cancelar?', description: 'As alterações não salvas serão perdidas.', confirmLabel: 'Sim, cancelar', cancelLabel: 'Não', variant: 'default'}));
    dialogRef.subscribe((confirmado: boolean) => {
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
    const dialogRef = from(this.modalService.confirm({title: 'Tem certeza que deseja cancelar?', description: 'As alterações não salvas serão perdidas.', confirmLabel: 'Sim, cancelar', cancelLabel: 'Não', variant: 'default'}));
    dialogRef.subscribe((confirmado: boolean) => {
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

    const dialogRef = from(this.modalService.confirm({title: 'Tem certeza que deseja cancelar?', description: 'As alterações não salvas serão perdidas.', confirmLabel: 'Sim, cancelar', cancelLabel: 'Não', variant: 'default'}));
    dialogRef.subscribe((confirmado: boolean) => {
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
    AcessoRestritoComponent,
    SPageHeaderComponent,
    SIconButtonComponent,
    SIconComponent,
    STooltipDirective,
    SButtonComponent,
    SFileUploadComponent
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
      <app-acesso-restrito backUrl="/configuracoes/hierarquia/nucleo" />
    } @else {
      <div class="flex flex-col gap-6 max-w-7xl mx-auto w-full font-sans pb-16">
        <!-- Breadcrumb e Cabeçalho Principal -->
        <s-page-header [breadcrumbs]="[{label: 'Início', routerLink: '/inicio'}, {label: 'Configurações', routerLink: '/configuracoes'}, {label: 'Hierarquia de Unidades e Cargos', routerLink: '/configuracoes/hierarquia'}, {label: 'Configurar Núcleo', routerLink: '/configuracoes/hierarquia/nucleo'}, {label: 'Visualizar'}]" title="Visualizar Núcleo" description="Consulte as informações cadastrais, endereço, chefia e normativas desta unidade." showBack (back)="goBack()">@if (permissionService.canCreate() && item()?.status === 'ATIVO') {<s-button action="" type="button" (click)="onEditar()" aria-label="Editar Núcleo" icon="edit" variant="primary" >

                  <span>Editar</span>
                </s-button>}</s-page-header>

        @if (item(); as nucleo) {
          <div class="flex flex-col gap-6">

            <!-- Card 1: Identificação do Núcleo -->
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <s-icon name="domain" size="xs"  />
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
                  <s-icon name="location_on" size="xs" class="text-siage-primary" />
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
                <s-icon name="badge" size="xs"  />
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

            <!-- Card 3: Gestão de Normativas -->
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
              @if (nucleo.normativaExtincao && nucleo.normativaExtincao.documento) {
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
export class NucleoView implements OnInit {
  private readonly modalService = inject(SModalService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly service = inject(NucleoService);
  readonly permissionService = inject(PermissionService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(SToastService);

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

export const nucleoFormDeactivateGuard: CanDeactivateFn<NucleoForm> = (
  component: NucleoForm
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

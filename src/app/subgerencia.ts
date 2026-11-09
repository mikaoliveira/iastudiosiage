import {
  Component,
  inject,
  signal,
  computed,
  effect,
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
import {MatDialog} from '@angular/material/dialog';
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
import {
  GerenciaExecutivaService
} from './gerencia-executiva';
import {
  GerenciaRegionalService
} from './gerencia-regional';

// ==========================================
// INTERFACES E MODELOS DE SUBGERÊNCIA
// ==========================================

export interface SubordinadaSubgerenciaItem {
  id: string;
  nome: string;
  chefiaImediata: string;
  utb: string;
}

export interface EnderecoSubgerencia {
  cep?: string;
  municipio?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  complemento?: string;
}

export interface SubgerenciaItem {
  id: string;
  nome: string;
  gerenciaExecutivaId: string;
  gerenciaExecutivaNome: string;
  utbCodigo: string;
  utbNome: string;
  criadorEditor: string;
  dataCriacao: string;
  dataAtualizacao?: string;
  status: 'ATIVO' | 'INATIVO';
  endereco?: EnderecoSubgerencia;
  chefeImediato?: ChefeImediatoItem;
  normativaCriacao: NormativaItem;
  normativaExtincao?: NormativaItem;
  subordinadas: SubordinadaSubgerenciaItem[];
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
// SERVIÇO PRINCIPAL — SUBGERÊNCIA
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class SubgerenciaService {
  private readonly gerExecService = inject(GerenciaExecutivaService);
  private readonly gerRegService = inject(GerenciaRegionalService);
  private readonly secExecService = inject(SecretariaExecutivaService);
  private readonly secGeralService = inject(SecretariaGeralService);

  // Lista padrão inicial de Subgerências vinculadas às Gerências Executivas existentes
  private readonly defaultSubgerencias: SubgerenciaItem[] = [
    {
      id: 'subger-1',
      nome: 'Subgerência de Recrutamento e Seleção de Pessoal',
      gerenciaExecutivaId: 'ge-1',
      gerenciaExecutivaNome: 'Gerência Executiva de Seleção e Desenvolvimento de Talentos',
      utbCodigo: 'UTB-011',
      utbNome: 'UTB-011 - Subunidade de Admissão e Concursos',
      criadorEditor: 'Mikael Oliveira',
      dataCriacao: '17/01/2024 10:00',
      dataAtualizacao: '12/04/2024 15:00',
      status: 'ATIVO',
      endereco: {
        cep: '58.040-000',
        municipio: 'João Pessoa',
        rua: 'Avenida Cabo Branco',
        numero: '1200',
        bairro: 'Cabo Branco',
        complemento: 'Bloco B, Sala 102'
      },
      chefeImediato: {
        matricula: '710',
        cpf: '333.444.555-66',
        nome: 'Juliana Mendes Caldas',
        cargo: 'Subgerente de Admissão de Pessoal',
        situacaoFuncional: 'Em exercício',
        atoGovernamental: {
          numero: 'Ato nº 2.120/2024',
          dataPublicacao: '17/01/2024',
          documento: {
            id: 'doc-ato-subger-1',
            nomeArquivo: 'ato_2120_2024_nomeacao_subgerente.pdf',
            tamanho: '1.6 MB',
            tipo: 'pdf',
            dataUpload: '17/01/2024 10:30'
          }
        }
      },
      normativaCriacao: {
        nome: 'Decreto Estadual nº 42.165/2023 - Estrutura de Seleção e Recrutamento',
        numero: '42.165',
        dataPublicacao: '04/01/2023',
        documento: {
          id: 'doc-norm-cria-subger-1',
          nomeArquivo: 'decreto_42165_2023_recrutamento.pdf',
          tamanho: '3.1 MB',
          tipo: 'pdf',
          dataUpload: '04/01/2023 10:00'
        }
      },
      normativaExtincao: undefined,
      subordinadas: [
        {
          id: 'nuc-1',
          nome: 'Núcleo de Concursos e Processos Seletivos',
          chefiaImediata: 'Renato Bezerra da Costa',
          utb: 'UTB-015 - Setor Operacional de Exames'
        }
      ],
      historicoAtos: []
    },
    {
      id: 'subger-2',
      nome: 'Subgerência de Acompanhamento Funcional e Desempenho',
      gerenciaExecutivaId: 'ge-1',
      gerenciaExecutivaNome: 'Gerência Executiva de Seleção e Desenvolvimento de Talentos',
      utbCodigo: 'UTB-012',
      utbNome: 'UTB-012 - Subunidade de Avaliação Funcional',
      criadorEditor: 'Mikael Oliveira',
      dataCriacao: '18/01/2024 09:15',
      dataAtualizacao: undefined,
      status: 'ATIVO',
      endereco: {
        cep: '58.030-000',
        municipio: 'João Pessoa',
        rua: 'Avenida Epitácio Pessoa',
        numero: '250',
        bairro: 'Estados',
        complemento: 'Andar 3'
      },
      chefeImediato: {
        matricula: '715',
        cpf: '555.666.777-88',
        nome: 'Marcos Paulo Saraiva',
        cargo: 'Subgerente de Avaliação Funcional',
        situacaoFuncional: 'Em exercício',
        atoGovernamental: {
          numero: 'Ato nº 2.125/2024',
          dataPublicacao: '18/01/2024',
          documento: {
            id: 'doc-ato-subger-2',
            nomeArquivo: 'ato_2125_2024_nomeacao_desempenho.pdf',
            tamanho: '1.7 MB',
            tipo: 'pdf',
            dataUpload: '18/01/2024 10:00'
          }
        }
      },
      normativaCriacao: {
        nome: 'Decreto Estadual nº 42.166/2023 - Estrutura de Avaliação Funcional',
        numero: '42.166',
        dataPublicacao: '05/01/2023',
        documento: {
          id: 'doc-norm-cria-subger-2',
          nomeArquivo: 'decreto_42166_2023_avaliacao.pdf',
          tamanho: '2.8 MB',
          tipo: 'pdf',
          dataUpload: '05/01/2023 11:00'
        }
      },
      normativaExtincao: undefined,
      subordinadas: [],
      historicoAtos: []
    },
    {
      id: 'subger-3',
      nome: 'Subgerência de Arquitetura de Software e Dados',
      gerenciaExecutivaId: 'ge-2',
      gerenciaExecutivaNome: 'Gerência Executiva de Governança Digital e Sistemas',
      utbCodigo: 'UTB-013',
      utbNome: 'UTB-013 - Subunidade de Sistemas Corporativos',
      criadorEditor: 'Mikael Oliveira',
      dataCriacao: '20/01/2024 14:20',
      dataAtualizacao: undefined,
      status: 'ATIVO',
      endereco: {
        cep: '58.051-200',
        municipio: 'João Pessoa',
        rua: 'Rua Bancário Sérgio Guerra',
        numero: '400',
        bairro: 'Bancários',
        complemento: ''
      },
      chefeImediato: {
        matricula: '820',
        cpf: '777.888.999-00',
        nome: 'Rodrigo Tavares Lima',
        cargo: 'Subgerente de Arquitetura de Software',
        situacaoFuncional: 'Em exercício',
        atoGovernamental: {
          numero: 'Ato nº 2.150/2024',
          dataPublicacao: '20/01/2024',
          documento: {
            id: 'doc-ato-subger-3',
            nomeArquivo: 'ato_2150_2024_nomeacao_arquitetura.pdf',
            tamanho: '2.1 MB',
            tipo: 'pdf',
            dataUpload: '20/01/2024 15:00'
          }
        }
      },
      normativaCriacao: {
        nome: 'Decreto Estadual nº 42.172/2023 - Estrutura de TI e Sistemas',
        numero: '42.172',
        dataPublicacao: '07/01/2023',
        documento: {
          id: 'doc-norm-cria-subger-3',
          nomeArquivo: 'decreto_42172_2023_ti.pdf',
          tamanho: '3.0 MB',
          tipo: 'pdf',
          dataUpload: '07/01/2023 16:00'
        }
      },
      normativaExtincao: undefined,
      subordinadas: [],
      historicoAtos: []
    },
    {
      id: 'subger-4',
      nome: 'Subgerência de Apoio Operacional e Almoxarifado (Extinta)',
      gerenciaExecutivaId: 'ge-1',
      gerenciaExecutivaNome: 'Gerência Executiva de Seleção e Desenvolvimento de Talentos',
      utbCodigo: 'UTB-014',
      utbNome: 'UTB-014 - Subunidade de Suporte Logístico e Apoio',
      criadorEditor: 'Mikael Oliveira',
      dataCriacao: '10/02/2022 09:00',
      dataAtualizacao: '28/12/2023 17:00',
      status: 'INATIVO',
      endereco: {
        cep: '58.013-000',
        municipio: 'João Pessoa',
        rua: 'Parque Solon de Lucena',
        numero: '50',
        bairro: 'Centro',
        complemento: 'Anexo II'
      },
      chefeImediato: undefined,
      normativaCriacao: {
        nome: 'Lei Estadual nº 11.455/2022 - Criação da Subgerência de Apoio',
        numero: '11.455',
        dataPublicacao: '11/02/2022',
        documento: {
          id: 'doc-norm-cria-subger-4',
          nomeArquivo: 'lei_11455_2022_apoio.pdf',
          tamanho: '2.2 MB',
          tipo: 'pdf',
          dataUpload: '11/02/2022 10:00'
        }
      },
      normativaExtincao: {
        nome: 'Lei Complementar nº 184/2023 - Extinção da Subgerência de Apoio Operacional',
        numero: '184',
        dataPublicacao: '28/12/2023',
        documento: {
          id: 'doc-norm-ext-subger-4',
          nomeArquivo: 'lei_compl_184_2023_extincao_subger.pdf',
          tamanho: '1.9 MB',
          tipo: 'pdf',
          dataUpload: '28/12/2023 16:30'
        }
      },
      subordinadas: [],
      historicoAtos: []
    }
  ];

  // Lista reativa de Subgerências
  readonly items = signal<SubgerenciaItem[]>(JSON.parse(JSON.stringify(this.defaultSubgerencias)));

  getItem(id: string): SubgerenciaItem | undefined {
    return this.items().find(i => i.id === id);
  }

  isNomeDuplicado(nome: string, ignoreId?: string): boolean {
    const nomeLimpo = nome.trim().toLowerCase();
    return this.items().some(i => i.nome.trim().toLowerCase() === nomeLimpo && i.id !== ignoreId);
  }

  isUtbEmUso(codigoUtb: string, ignoreId?: string): boolean {
    // Não pode estar em uso por outra Subgerência ativa
    const emUsoSubger = this.items().some(i => i.utbCodigo === codigoUtb && i.status === 'ATIVO' && i.id !== ignoreId);
    if (emUsoSubger) return true;
    // Não pode estar em uso por Gerência Executiva ativa
    const emUsoGerExec = this.gerExecService.items().some(i => i.utbCodigo === codigoUtb && i.status === 'ATIVO');
    if (emUsoGerExec) return true;
    // Não pode estar em uso por Gerência Regional ativa
    const emUsoGerReg = this.gerRegService.items().some(i => i.utbCodigo === codigoUtb && i.status === 'ATIVO');
    if (emUsoGerReg) return true;
    // Não pode estar em uso por Secretaria Executiva ativa
    const emUsoSecExec = this.secExecService.items().some(i => i.utbCodigo === codigoUtb && i.status === 'ATIVO');
    if (emUsoSecExec) return true;
    // Não pode estar em uso por Secretaria Geral ativa
    const emUsoSecGeral = this.secGeralService.items().some(i => i.utbCodigo === codigoUtb && i.status === 'ATIVO');
    return emUsoSecGeral;
  }

  add(data: Omit<SubgerenciaItem, 'id' | 'criadorEditor' | 'dataCriacao'>): SubgerenciaItem {
    const numericIds = this.items().map(i => {
      const match = i.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const maxId = Math.max(...numericIds, 0);
    const newId = `subger-${maxId + 1}`;
    const now = new Date();
    const dataCriacao = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});

    const newItem: SubgerenciaItem = {
      id: newId,
      ...data,
      criadorEditor: 'Mikael Oliveira',
      dataCriacao,
      historicoAtos: []
    };

    this.items.update(list => [newItem, ...list]);

    // Sincroniza com a Gerência Executiva correspondente
    this.gerExecService.syncAddSubgerencia({
      id: newItem.id,
      nome: newItem.nome,
      chefiaImediata: newItem.chefeImediato?.nome || '-',
      utb: newItem.utbNome || newItem.utbCodigo,
      gerenciaExecutivaId: newItem.gerenciaExecutivaId
    });

    return newItem;
  }

  update(id: string, data: Partial<SubgerenciaItem>) {
    const now = new Date();
    const dataAtualizacao = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});

    let updatedItem: SubgerenciaItem | undefined;

    this.items.update(list => list.map(item => {
      if (item.id === id) {
        const baseHistorico = data.historicoAtos !== undefined
          ? [...data.historicoAtos]
          : (item.historicoAtos ? [...item.historicoAtos] : []);
        const novoHistorico = [...baseHistorico];
        if (
          item.chefeImediato && 
          item.chefeImediato.atoGovernamental?.documento &&
          (!data.chefeImediato || data.chefeImediato.matricula !== item.chefeImediato.matricula || data.chefeImediato.atoGovernamental.numero !== item.chefeImediato.atoGovernamental.numero)
        ) {
          const anterior = item.chefeImediato;
          if (anterior.atoGovernamental.documento) {
            const jaExiste = novoHistorico.some(h => h.numero === anterior.atoGovernamental.numero && h.documento.nomeArquivo === anterior.atoGovernamental.documento?.nomeArquivo);
            if (!jaExiste) {
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
      // Sincroniza com a Gerência Executiva
      this.gerExecService.syncUpdateSubgerencia(id, {
        nome: updatedItem.nome,
        chefiaImediata: updatedItem.chefeImediato?.nome || '-',
        utb: updatedItem.utbNome || updatedItem.utbCodigo,
        gerenciaExecutivaId: updatedItem.gerenciaExecutivaId
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

    // Remove do vínculo ativo na Gerência Executiva
    this.gerExecService.syncInativarSubgerencia(id);
  }

  getHistoricoAtos(subgerId?: string, atoAtual?: AtoGovernamental, nomeChefeAtual?: string): HistoricoAtoItem[] {
    const list: HistoricoAtoItem[] = [];

    // Inclui ato vigente se fornecido e completo
    if (atoAtual && atoAtual.numero && atoAtual.documento) {
      list.push({
        id: `hist-subger-atual-${subgerId || 'new'}`,
        numero: atoAtual.numero,
        chefeImediato: nomeChefeAtual || 'Chefe Imediato Vigente',
        dataPublicacao: atoAtual.dataPublicacao || '17/01/2024',
        dataImportacao: atoAtual.documento.dataUpload || '17/01/2024 10:30',
        responsavelImportacao: 'Mikael Oliveira',
        documento: atoAtual.documento
      });
    }

    if (subgerId) {
      const item = this.getItem(subgerId);
      if (item?.historicoAtos && item.historicoAtos.length > 0) {
        list.push(...item.historicoAtos);
      }
    }

    return list;
  }
}

// ==========================================
// TELA 1: LISTAR SUBGERÊNCIA
// ==========================================

@Component({
  selector: 'app-subgerencia-list',
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
            <span class="text-siage-primary font-semibold" aria-current="page">Configurar Subgerência</span>
          </nav>

          <!-- Título com Botão Voltar e Ação Adicionar -->
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
                  Configurar Subgerência
                </h1>
              </div>

              <p class="text-xs sm:text-sm text-siage-text-secondary font-sans leading-normal pl-8 sm:pl-9 max-w-2xl">
                Estruture as subgerências subordinadas às gerências executivas.
              </p>
            </div>

            <!-- Botão Adicionar Subgerência (alinhado aos padrões SIAGE) -->
            @if (permissionService.canCreate()) {
              <div class="flex items-center shrink-0 pl-8 sm:pl-0">
                <button 
                  type="button" 
                  (click)="onAdicionar()"
                  class="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs hover:shadow cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/50"
                  aria-label="Adicionar Subgerência"
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
              <!-- Filtro: Nome da Subgerência -->
              <div class="form-field-group">
                <label for="filter-nome" class="siage-field-label">Nome da Subgerência</label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="filter-nome"
                    type="text" 
                    formControlName="nome" 
                    maxlength="200"
                    placeholder="Digite o nome da subgerência"
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

              <!-- Filtro: Unidade de Trabalho (UTB) (Select com autocomplete contendo somente UTBs de Subgerências cadastradas) -->
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
                <p class="text-xs sm:text-sm text-siage-text-secondary">Ainda não existem subgerências cadastradas.</p>
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
                        [attr.aria-label]="'Ordenar por Nome da Subgerência ' + (sortColumn() === 'nome' ? (sortDirection() === 'asc' ? 'decrescente' : 'crescente') : 'crescente')"
                      >
                        <span class="transition-colors" [class.text-siage-text-primary]="sortColumn() === 'nome'" [class.text-siage-text-secondary]="sortColumn() !== 'nome'">Nome da Subgerência</span>
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
                            aria-label="Visualizar Subgerência"
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
                              aria-label="Editar Subgerência"
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
                                [attr.aria-label]="item.status === 'ATIVO' ? 'Inativar Subgerência' : 'Ativar Subgerência'"
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
export class SubgerenciaList {
  readonly service = inject(SubgerenciaService);
  readonly permissionService = inject(PermissionService);
  readonly simulatorService = inject(SimulatorService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  readonly filtroForm = new FormGroup({
    nome: new FormControl(''),
    utb: new FormControl(''),
    status: new FormControl('TODOS')
  });

  readonly appliedNome = signal('');
  readonly appliedUtb = signal('');
  readonly appliedStatus = signal('TODOS');
  readonly pageIndex = signal(0);

  // Ordenação
  readonly sortColumn = signal<'nome' | 'utb' | 'dataCriacao'>('dataCriacao');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  // Valores reativos dos campos de filtro via toSignal
  readonly filtroNomeVal = toSignal(this.filtroForm.controls.nome.valueChanges, { initialValue: '' });
  readonly filtroUtbVal = toSignal(this.filtroForm.controls.utb.valueChanges, { initialValue: '' });
  readonly filtroStatusVal = toSignal(this.filtroForm.controls.status.valueChanges, { initialValue: 'TODOS' });

  // Lista exclusiva de UTBs das Subgerências cadastradas para o autocomplete do filtro
  readonly filteredUtbsList = computed(() => {
    const subs = this.service.items();
    const map = new Map<string, UtbItem>();
    subs.forEach(s => {
      if (s.utbCodigo && !map.has(s.utbCodigo)) {
        map.set(s.utbCodigo, { 
          codigo: s.utbCodigo, 
          nome: s.utbNome.replace(`${s.utbCodigo} - `, ''),
          descricaoCompleta: s.utbNome 
        });
      }
    });
    const list = Array.from(map.values());
    const query = (this.filtroUtbVal() || this.filtroForm.get('utb')?.value || '').trim().toLowerCase();
    if (!query) return list;
    return list.filter(u => 
      u.codigo.toLowerCase().includes(query) || 
      u.nome.toLowerCase().includes(query) ||
      `${u.codigo} - ${u.nome}`.toLowerCase().includes(query)
    );
  });

  // Habilitação do botão Buscar quando houver critério válido
  readonly canBuscar = computed(() => {
    const nome = (this.filtroNomeVal() || this.filtroForm.get('nome')?.value || '').trim();
    const utb = (this.filtroUtbVal() || this.filtroForm.get('utb')?.value || '').trim();
    const status = this.filtroStatusVal() || this.filtroForm.get('status')?.value || 'TODOS';
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
    this.router.navigate(['/configuracoes/hierarquia/subgerencia/novo']);
  }

  onVisualizar(item: SubgerenciaItem) {
    this.router.navigate(['/configuracoes/hierarquia/subgerencia', item.id]);
  }

  onEditar(item: SubgerenciaItem) {
    this.router.navigate(['/configuracoes/hierarquia/subgerencia', item.id, 'editar']);
  }

  onToggleStatus(item: SubgerenciaItem) {
    if (item.status === 'INATIVO') {
      // Inativação irreversível: proibir reativação e exibir somente toast explicativo sem modal
      this.toast.warning('A inativação de uma Subgerência é irreversível. O registro não pode ser reativado.');
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

      // 2. Após a confirmação, verificar Chefia Imediata e Núcleos subordinados
      const temNormativaExtincao = !!item.normativaExtincao?.documento;
      const totalSubordinadas = item.subordinadas?.length || 0;
      const temChefe = !!item.chefeImediato;
      const temOutrosImpedimentos = totalSubordinadas > 0 || temChefe;

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
            unidadesDescricao: 'Núcleos'
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
// TELA 2 & 4: ADICIONAR E EDITAR SUBGERÊNCIA
// ==========================================

@Component({
  selector: 'app-subgerencia-form',
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
    SiagePaginatorComponent,
    AcessoRestritoComponent
  ],
  template: `
    @if (!permissionService.hasAccess() || (!isEditMode() && !permissionService.canCreate())) {
      <app-acesso-restrito backUrl="/configuracoes/hierarquia/subgerencia" />
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
              Configurar Subgerência
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
                  {{ isEditMode() ? 'Editar Subgerência' : 'Adicionar Subgerência' }}
                </h1>
              </div>

              <p class="text-xs sm:text-sm text-siage-text-secondary font-sans leading-normal pl-8 sm:pl-9 max-w-2xl">
                {{ isEditMode() ? 'Atualize as informações, endereço, chefia e normativas da Subgerência.' : 'Preencha os campos obrigatórios para estruturar a Subgerência.' }}
              </p>
            </div>
          </div>
        </div>

        <!-- FORMULÁRIO ORGANIZADO EM SEÇÕES -->
        <form [formGroup]="form" class="flex flex-col gap-6">

          <!-- ============================================== -->
          <!-- SEÇÃO 1: IDENTIFICAÇÃO DA SUBGERÊNCIA          -->
          <!-- ============================================== -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">domain</mat-icon>
              <span>1. Identificação</span>
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              <!-- Nome da Subgerência -->
              <div class="md:col-span-2 form-field-group">
                <label for="form-nome" class="siage-field-label">
                  Nome da Subgerência <span class="required-marker">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="form-nome"
                    formControlName="nome" 
                    maxlength="200"
                    placeholder="Ex: Subgerência de Recrutamento e Seleção de Pessoal"
                  >
                  <mat-hint align="end" class="text-xs text-siage-text-secondary">
                    {{ (form.get('nome')?.value || '').length }} / 200
                  </mat-hint>
                  @if (form.get('nome')?.hasError('required') && form.get('nome')?.touched) {
                    <mat-error>O Nome da Subgerência é obrigatório.</mat-error>
                  }
                  @if (form.get('nome')?.hasError('duplicado')) {
                    <mat-error>Já existe uma Subgerência cadastrada com este nome.</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Campo Obrigatório: Gerência Executiva Vinculada -->
              <div class="form-field-group">
                <label for="form-ger-exec" class="siage-field-label">
                  Gerência Executiva <span class="required-marker">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="form-ger-exec"
                    type="text" 
                    [formControl]="gerExecInputControl" 
                    placeholder="Selecione ou busque a Gerência Executiva vinculada" 
                    [matAutocomplete]="autoGerExec"
                    #autoGerExecTrigger="matAutocompleteTrigger"
                    (focus)="autoGerExecTrigger.openPanel()"
                    (blur)="onGerExecBlur()"
                    class="text-sm"
                  />
                  <mat-autocomplete #autoGerExec="matAutocomplete" (optionSelected)="onGerExecSelected($event.option.value)">
                    @for (ge of filteredGerExecutivas(); track ge.id) {
                      <mat-option [value]="ge.id">
                        {{ ge.nome }}
                      </mat-option>
                    }
                  </mat-autocomplete>
                  @if (gerExecInputControl.value) {
                    <button mat-icon-button matSuffix type="button" (click)="limparGerExec()" aria-label="Limpar campo">
                      <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                    </button>
                  } @else {
                    <button mat-icon-button matSuffix type="button" (click)="autoGerExecTrigger.openPanel()" aria-label="Abrir opções">
                      <mat-icon class="text-siage-text-secondary">arrow_drop_down</mat-icon>
                    </button>
                  }
                  @if ((form.get('gerenciaExecutivaId')?.hasError('required') || gerExecInputControl.hasError('required')) && (form.get('gerenciaExecutivaId')?.touched || gerExecInputControl.touched)) {
                    <mat-error>A Gerência Executiva é obrigatória.</mat-error>
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
                    (focus)="!isUtbDesabilitada() && autoUtbFormTrigger.openPanel()"
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
                  @if (utbInputControl.value && !isUtbDesabilitada()) {
                    <button mat-icon-button matSuffix type="button" (click)="limparUtb()" aria-label="Limpar campo">
                      <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                    </button>
                  } @else {
                    <button mat-icon-button matSuffix type="button" (click)="!isUtbDesabilitada() && autoUtbFormTrigger.openPanel()" [disabled]="isUtbDesabilitada()" aria-label="Abrir opções">
                      <mat-icon class="text-siage-text-secondary">arrow_drop_down</mat-icon>
                    </button>
                  }
                  @if (isUtbBloqueada()) {
                    <mat-hint class="text-xs text-siage-text-secondary">
                      <span class="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                        <mat-icon style="font-size: 14px; width: 14px; height: 14px;">lock</mat-icon>
                        A Unidade de Trabalho (UTB) não pode ser alterada porque existem chefia ou núcleos vinculados.
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

            <!-- SUBSEÇÃO: ENDEREÇO DA SUBGERÊNCIA -->
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
                  <label for="form-cep" class="siage-field-label">CEP</label>
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
                  <label for="form-municipio" class="siage-field-label">Município</label>
                  <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                    <input 
                      matInput 
                      id="form-municipio"
                      formControlName="municipio" 
                      placeholder="Selecione ou informe o município da Paraíba" 
                      [matAutocomplete]="autoMunicipio"
                      #autoMunTrigger="matAutocompleteTrigger"
                      (focus)="autoMunTrigger.openPanel()"
                      class="text-sm"
                    />
                    <mat-autocomplete #autoMunicipio="matAutocomplete">
                      @for (mun of filteredMunicipios(); track mun) {
                        <mat-option [value]="mun">
                          {{ mun }}
                        </mat-option>
                      }
                    </mat-autocomplete>
                    @if (form.get('municipio')?.value) {
                      <button mat-icon-button matSuffix type="button" (click)="form.get('municipio')?.setValue('')" aria-label="Limpar município">
                        <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                      </button>
                    } @else {
                      <button mat-icon-button matSuffix type="button" (click)="autoMunTrigger.openPanel()" aria-label="Abrir opções">
                        <mat-icon class="text-siage-text-secondary">arrow_drop_down</mat-icon>
                      </button>
                    }
                  </mat-form-field>
                </div>

                <!-- Linha 2: Rua (9 cols) e Número (3 cols) -->
                <div class="col-span-12 md:col-span-9 form-field-group">
                  <label for="form-rua" class="siage-field-label">Rua</label>
                  <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                    <input 
                      matInput 
                      id="form-rua"
                      formControlName="rua" 
                      maxlength="200"
                      placeholder="Ex: Avenida Epitácio Pessoa"
                      class="text-sm"
                    >
                    <mat-hint align="end" class="text-xs text-siage-text-secondary">
                      {{ (form.get('rua')?.value || '').length }} / 200
                    </mat-hint>
                  </mat-form-field>
                </div>

                <div class="col-span-12 md:col-span-3 form-field-group">
                  <label for="form-numero" class="siage-field-label">Número</label>
                  <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                    <input 
                      matInput 
                      id="form-numero"
                      formControlName="numero" 
                      maxlength="4"
                      (input)="onNumeroInput($event)"
                      placeholder="Ex: 120"
                      class="text-sm font-mono"
                    >
                    <mat-hint align="end" class="text-xs text-siage-text-secondary">
                      {{ (form.get('numero')?.value || '').length }} / 4
                    </mat-hint>
                  </mat-form-field>
                </div>

                <!-- Linha 3: Bairro (6 cols) e Complemento (6 cols) -->
                <div class="col-span-12 md:col-span-6 form-field-group">
                  <label for="form-bairro" class="siage-field-label">Bairro</label>
                  <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                    <input 
                      matInput 
                      id="form-bairro"
                      formControlName="bairro" 
                      maxlength="200"
                      placeholder="Ex: Centro"
                      class="text-sm"
                    >
                    <mat-hint align="end" class="text-xs text-siage-text-secondary">
                      {{ (form.get('bairro')?.value || '').length }} / 200
                    </mat-hint>
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
                      placeholder="Ex: Bloco A, Sala 204"
                      class="text-sm"
                    >
                    <mat-hint align="end" class="text-xs text-siage-text-secondary">
                      {{ (form.get('complemento')?.value || '').length }} / 200
                    </mat-hint>
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
                <!-- Se estiver cadastrando nova Subgerência, exibe campos editáveis -->
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
                        placeholder="Ex: Decreto Estadual nº 42.165/2023 - Criação da Subgerência"
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
                        placeholder="Ex: 42.165"
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
                        placeholder="Ex: Lei Complementar nº 184/2023 - Extinção da Subgerência"
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

          <!-- ============================================================== -->
          <!-- SEÇÃO 4: NÚCLEOS VINCULADOS (MODO EDIÇÃO)                      -->
          <!-- ============================================================== -->
          @if (isEditMode()) {
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">device_hub</mat-icon>
                <span>4. Núcleos Vinculados</span>
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
                      @if (filtroSubordinadaNome.value) {
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

              <!-- Tabela de Núcleos Vinculados -->
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
                          <span>Núcleo</span>
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
export class SubgerenciaForm implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly service = inject(SubgerenciaService);
  readonly gerExecService = inject(GerenciaExecutivaService);
  readonly secGeralService = inject(SecretariaGeralService);
  readonly permissionService = inject(PermissionService);
  private readonly dialog = inject(MatDialog);
  private readonly toastService = inject(ToastService);
  private readonly modalService = inject(ModalService);

  readonly isEditMode = signal(false);
  readonly isSaving = signal(false);
  itemId: string | null = null;
  currentItem?: SubgerenciaItem;

  // Form Controls de Identificação
  readonly utbInputControl = new FormControl({ value: '', disabled: true }, [Validators.required]);
  readonly gerExecInputControl = new FormControl('', [Validators.required]);
  readonly utbInputVal = toSignal(this.utbInputControl.valueChanges, { initialValue: '' });
  readonly gerExecInputVal = toSignal(this.gerExecInputControl.valueChanges, { initialValue: '' });

  readonly form = new FormGroup({
    nome: new FormControl('', [Validators.required, Validators.maxLength(200)]),
    gerenciaExecutivaId: new FormControl('', [Validators.required]),
    utbCodigo: new FormControl('', [Validators.required]),
    // Campos do Endereço
    cep: new FormControl(''),
    municipio: new FormControl(''),
    rua: new FormControl('', [Validators.maxLength(200)]),
    numero: new FormControl(''),
    bairro: new FormControl('', [Validators.maxLength(200)]),
    complemento: new FormControl('', [Validators.maxLength(200)])
  });

  readonly gerExecIdVal = toSignal(
    this.form.controls.gerenciaExecutivaId.valueChanges,
    { initialValue: '' }
  );

  // Feedback do CEP
  readonly cepFeedback = signal<string>('');
  readonly cepFeedbackTipo = signal<'warning' | 'error' | ''>('');
  readonly cepVal = toSignal(this.form.controls.cep.valueChanges, { initialValue: '' });
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

  // Subordinadas (Núcleos) na edição
  readonly subordinadasOriginais = signal<SubordinadaSubgerenciaItem[]>([]);
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
  private isHandlingGeSelection = false;
  private prevConfirmedGeId = '';
  private prevConfirmedGeNome = '';

  readonly formatarDataParaExibicao = formatarDataParaExibicao;

  // Autocomplete de Gerências Executivas (somente ativas, ordenadas alfabeticamente)
  readonly filteredGerExecutivas = computed(() => {
    const list = this.gerExecService.items().filter(ge => ge.status === 'ATIVO');
    const sorted = [...list].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    const query = (this.gerExecInputVal() || this.gerExecInputControl.value || '').trim().toLowerCase();
    if (!query) return sorted;
    return sorted.filter(ge => ge.nome.toLowerCase().includes(query));
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

  // Autocomplete de Municípios da PB
  readonly filteredMunicipios = computed(() => {
    const query = (this.municipioVal() || this.form.get('municipio')?.value || '').trim().toLowerCase();
    if (!query) return MUNICIPIOS_PARAIBA;
    return MUNICIPIOS_PARAIBA.filter(m => m.toLowerCase().includes(query));
  });

  // Validação reativa da Gerência Executiva selecionada via Signal
  readonly hasGerExecValida = computed(() => {
    const id = (this.gerExecIdVal() || this.form.controls.gerenciaExecutivaId.value || '').trim();
    if (!id) return false;
    const ge = this.gerExecService.getItem(id);
    return !!ge && ge.status === 'ATIVO';
  });

  // Bloqueio de alteração de UTB: se estiver em edição e possuir chefia imediata ou núcleos subordinados vinculados
  readonly isUtbBloqueada = computed(() => {
    if (!this.isEditMode()) return false;
    const temChefe = !!this.chefeImediato();
    const temSubordinadas = this.subordinadasOriginais().length > 0;
    return temChefe || temSubordinadas;
  });

  readonly isUtbDesabilitada = computed(() => {
    return this.isUtbBloqueada() || !this.hasGerExecValida();
  });

  atualizarEstadoUtb() {
    const desabilitada = this.isUtbDesabilitada();
    if (desabilitada) {
      if (this.utbInputControl.enabled) {
        this.utbInputControl.disable({ emitEvent: false });
      }
    } else {
      if (this.utbInputControl.disabled) {
        this.utbInputControl.enable({ emitEvent: false });
      }
    }
  }

  constructor() {
    // Garante UTB desabilitada inicialmente
    this.utbInputControl.disable({ emitEvent: false });

    effect(() => {
      this.atualizarEstadoUtb();
    });
  }

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
      this.prevConfirmedGeId = '';
      this.prevConfirmedGeNome = '';
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

    // Reação reativa para habilitar/desabilitar a UTB conforme a Gerência Executiva
    this.form.controls.gerenciaExecutivaId.valueChanges.subscribe(() => {
      this.atualizarEstadoUtb();
    });
  }

  private carregarDadosEdicao(id: string) {
    const item = this.service.getItem(id);
    if (!item) {
      this.toastService.error('Subgerência não encontrada.');
      this.router.navigate(['/configuracoes/hierarquia/subgerencia']);
      return;
    }

    this.currentItem = item;
    this.prevConfirmedGeId = item.gerenciaExecutivaId;
    this.prevConfirmedGeNome = item.gerenciaExecutivaNome;

    this.form.patchValue({
      nome: item.nome,
      gerenciaExecutivaId: item.gerenciaExecutivaId,
      utbCodigo: item.utbCodigo,
      cep: item.endereco?.cep || '',
      municipio: item.endereco?.municipio || '',
      rua: item.endereco?.rua || '',
      numero: item.endereco?.numero || '',
      bairro: item.endereco?.bairro || '',
      complemento: item.endereco?.complemento || ''
    });

    this.gerExecInputControl.setValue(item.gerenciaExecutivaNome);
    this.utbInputControl.setValue(item.utbNome);

    if (item.chefeImediato) {
      this.chefeImediato.set(item.chefeImediato);
      this.atoNumeroControl.setValue(item.chefeImediato.atoGovernamental.numero);
      this.atoDataControl.setValue(item.chefeImediato.atoGovernamental.dataPublicacao);
      this.atoDocumento.set(item.chefeImediato.atoGovernamental.documento);
    }

    if (item.historicoAtos && item.historicoAtos.length > 0) {
      this.historicoAtos.set([...item.historicoAtos]);
    }

    if (item.normativaExtincao && item.normativaExtincao.documento) {
      this.hasPersistedNormativaExtincao.set(true);
      this.temNormativaExtincao.set(true);
      this.normExtincaoNomeControl.setValue(item.normativaExtincao.nome);
      this.normExtincaoNumeroControl.setValue(item.normativaExtincao.numero);
      this.normExtincaoDataControl.setValue(item.normativaExtincao.dataPublicacao);
      this.normExtincaoDoc.set(item.normativaExtincao.documento);
    }

    this.subordinadasOriginais.set(item.subordinadas || []);

    this.initialSnapshotJson = this.getCurrentSnapshotJson();

    // Reavalia e sincroniza o estado da UTB na edição
    this.atualizarEstadoUtb();
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
      this.form.controls.cep.setErrors(null);
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
    this.form.controls.cep.setErrors(null);
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

  // Restauração de Gerência Executiva e UTB ao estado anterior confirmado
  private restaurarEstadoGerExecAnterior() {
    this.form.get('gerenciaExecutivaId')?.setValue(this.prevConfirmedGeId, { emitEvent: true });
    this.gerExecInputControl.setValue(this.prevConfirmedGeNome, { emitEvent: false });

    // Restaura o label da UTB atualmente salva no formulário
    const currentUtbCodigo = this.form.get('utbCodigo')?.value;
    if (currentUtbCodigo) {
      const existing = this.secGeralService.utbs().find((u: UtbItem) => u.codigo === currentUtbCodigo);
      this.utbInputControl.setValue(existing ? `${existing.codigo} - ${existing.nome}` : currentUtbCodigo, { emitEvent: false });
    } else {
      this.utbInputControl.setValue('', { emitEvent: false });
    }

    this.atualizarEstadoUtb();
  }

  // Gerência Executiva Autocomplete & Seleção
  onGerExecSelected(geId: string) {
    if (this.isHandlingGeSelection || this.dialog.openDialogs.length > 0) {
      return;
    }

    // Se selecionar a mesma já confirmada, apenas sincroniza o nome e encerra
    if (geId === this.prevConfirmedGeId) {
      const ge = this.gerExecService.getItem(geId);
      if (ge) {
        this.gerExecInputControl.setValue(ge.nome, { emitEvent: false });
      }
      return;
    }

    // Respeita regras de bloqueio quando houver chefia ou núcleos vinculados
    if (this.isUtbBloqueada()) {
      this.toastService.warning('A Gerência Executiva não pode ser alterada porque existem chefia ou núcleos vinculados.');
      this.restaurarEstadoGerExecAnterior();
      return;
    }

    const ge = this.gerExecService.getItem(geId);
    if (!ge) {
      this.restaurarEstadoGerExecAnterior();
      return;
    }

    const currentUtb = this.form.get('utbCodigo')?.value;
    const hasChefia = !!this.chefeImediato();
    const hasDependencias = !!currentUtb || hasChefia;

    if (hasDependencias) {
      this.isHandlingGeSelection = true;
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
        this.isHandlingGeSelection = false;
        if (confirmado) {
          // Atualiza Gerência Executiva confirmada
          this.prevConfirmedGeId = ge.id;
          this.prevConfirmedGeNome = ge.nome;
          this.form.get('gerenciaExecutivaId')?.setValue(ge.id, { emitEvent: true });
          this.form.get('gerenciaExecutivaId')?.markAsDirty();
          this.gerExecInputControl.setValue(ge.nome, { emitEvent: false });

          // Limpa UTB e chefia vinculada
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
          this.atualizarEstadoUtb();
        } else {
          // Cancela e restaura integralmente a Gerência Executiva e UTB anteriores
          this.restaurarEstadoGerExecAnterior();
        }
      });
    } else {
      // Sem dependências: aplica imediatamente
      this.prevConfirmedGeId = ge.id;
      this.prevConfirmedGeNome = ge.nome;
      this.form.get('gerenciaExecutivaId')?.setValue(ge.id, { emitEvent: true });
      this.form.get('gerenciaExecutivaId')?.markAsDirty();
      this.gerExecInputControl.setValue(ge.nome, { emitEvent: false });
      this.atualizarEstadoUtb();
    }
  }

  limparGerExec() {
    if (this.isHandlingGeSelection || this.dialog.openDialogs.length > 0) {
      return;
    }

    // Se já estiver limpa, sincroniza e retorna
    if (!this.prevConfirmedGeId && !this.form.get('gerenciaExecutivaId')?.value && !this.gerExecInputControl.value) {
      this.gerExecInputControl.setValue('', { emitEvent: false });
      return;
    }

    // Respeita regras de bloqueio quando houver chefia ou núcleos vinculados
    if (this.isUtbBloqueada()) {
      this.toastService.warning('A Gerência Executiva não pode ser alterada porque existem chefia ou núcleos vinculados.');
      this.restaurarEstadoGerExecAnterior();
      return;
    }

    const currentUtb = this.form.get('utbCodigo')?.value;
    const hasChefia = !!this.chefeImediato();
    const hasDependencias = !!currentUtb || hasChefia;

    if (hasDependencias) {
      this.isHandlingGeSelection = true;
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
        this.isHandlingGeSelection = false;
        if (confirmado) {
          // Limpa Gerência Executiva confirmada
          this.prevConfirmedGeId = '';
          this.prevConfirmedGeNome = '';
          this.form.get('gerenciaExecutivaId')?.setValue('', { emitEvent: true });
          this.form.get('gerenciaExecutivaId')?.markAsDirty();
          this.gerExecInputControl.setValue('', { emitEvent: false });

          // Limpa UTB e chefia vinculada
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
          this.atualizarEstadoUtb();
        } else {
          // Cancela e restaura integralmente a Gerência Executiva e UTB anteriores
          this.restaurarEstadoGerExecAnterior();
        }
      });
    } else {
      // Sem dependências: limpa diretamente
      this.prevConfirmedGeId = '';
      this.prevConfirmedGeNome = '';
      this.form.get('gerenciaExecutivaId')?.setValue('', { emitEvent: true });
      this.form.get('gerenciaExecutivaId')?.markAsDirty();
      this.gerExecInputControl.setValue('', { emitEvent: false });
      this.atualizarEstadoUtb();
    }
  }

  onGerExecBlur() {
    if (this.isHandlingGeSelection || this.dialog.openDialogs.length > 0) {
      return;
    }

    const text = (this.gerExecInputControl.value || '').trim();
    if (!text) {
      if (this.prevConfirmedGeId) {
        this.limparGerExec();
      } else {
        this.gerExecInputControl.setValue('', { emitEvent: false });
      }
      return;
    }

    const found = this.gerExecService.items().find(ge => 
      ge.status === 'ATIVO' && (
        ge.nome.toLowerCase() === text.toLowerCase() ||
        ge.id === this.prevConfirmedGeId
      )
    );

    if (found) {
      if (found.id !== this.prevConfirmedGeId) {
        this.onGerExecSelected(found.id);
      } else {
        this.gerExecInputControl.setValue(found.nome, { emitEvent: false });
      }
    } else {
      // Valor inválido/incompleto digitado: se tinha valor confirmado anterior, restaura
      if (this.prevConfirmedGeId) {
        this.restaurarEstadoGerExecAnterior();
      } else {
        this.limparGerExec();
      }
    }
    this.atualizarEstadoUtb();
  }

  // UTB Autocomplete & Confirmation Dialog
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
        this.chefeImediato.set({
          matricula: servidor.matricula,
          cpf: servidor.cpf,
          nome: servidor.nome,
          cargo: servidor.cargo,
          situacaoFuncional: servidor.situacaoFuncional,
          atoGovernamental: chefeExistente?.atoGovernamental || {
            numero: '',
            dataPublicacao: ''
          }
        });
      }
    });
  }

  removerChefe() {
    const dialogRef = this.dialog.open(ConfirmacaoDialog, {
      disableClose: true,
      data: {
        title: 'Remover Chefe Imediato?',
        message: 'Deseja remover o vínculo da chefia imediata desta Subgerência? O Ato Governamental associado também será desvinculado.',
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
            id: `hist-subger-${Date.now()}`,
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

  onFileAtoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    // Validação de tipo e tamanho (máx. 10 MB)
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
    this.normExtincaoNomeControl.reset();
    this.normExtincaoNumeroControl.reset();
    this.normExtincaoDataControl.reset();
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

  removerDocExtincao() {
    this.normExtincaoDoc.set(undefined);
  }

  // Tabela de Núcleos Vinculados (modo edição)
  readonly filteredSubUtbsList = computed(() => {
    const list = this.subordinadasOriginais();
    const set = new Set<string>();
    list.forEach(s => {
      if (s.utb) set.add(s.utb);
    });
    return Array.from(set);
  });

  readonly canBuscarSubordinadas = computed(() => {
    const nome = (this.filtroSubNomeVal() || this.filtroSubordinadaNome.value || '').trim();
    const utb = (this.filtroSubUtbVal() || this.filtroSubordinadaUtb.value || '').trim();
    return nome.length > 0 || utb.length > 0;
  });

  readonly filteredSubordinadas = computed(() => {
    let list = [...this.subordinadasOriginais()];
    const nome = this.appliedSubordinadaNome().toLowerCase();
    const utb = this.appliedSubordinadaUtb().toLowerCase();

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

  onSubordinadasPageChange(newIndex: number) {
    this.subordinadasPageIndex.set(newIndex);
  }

  // Modais de Visualização e Histórico
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
    const atos = this.service.getHistoricoAtos(
      this.itemId || undefined,
      this.chefeImediato() ? {
        numero: this.atoNumeroControl.value || '',
        dataPublicacao: this.atoDataControl.value || '',
        documento: this.atoDocumento()
      } : undefined,
      this.chefeImediato()?.nome
    );

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

    // 1. Identificação: Nome, Gerência Executiva e UTB
    const nome = (this.form.get('nome')?.value || '').trim();
    const gerExecId = (this.form.get('gerenciaExecutivaId')?.value || '').trim();
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

    if (!gerExecId) {
      this.form.get('gerenciaExecutivaId')?.setErrors({ required: true });
      this.form.get('gerenciaExecutivaId')?.markAsTouched();
      this.gerExecInputControl.setErrors({ required: true });
      this.gerExecInputControl.markAsTouched();
      hasError = true;
      if (!firstInvalidId) firstInvalidId = 'form-ger-exec';
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

    // Validação de Endereço (CEP quando informado)
    const cepValor = (this.form.get('cep')?.value || '').trim();
    if (cepValor) {
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

    const gerExecItem = this.gerExecService.getItem(gerExecId);
    const gerExecNome = gerExecItem ? gerExecItem.nome : '';

    // Monta o objeto de Endereço
    const cepClean = (this.form.get('cep')?.value || '').trim();
    const munClean = (this.form.get('municipio')?.value || '').trim();
    const ruaClean = (this.form.get('rua')?.value || '').trim();
    const numClean = (this.form.get('numero')?.value || '').trim();
    const bairroClean = (this.form.get('bairro')?.value || '').trim();
    const compClean = (this.form.get('complemento')?.value || '').trim();

    const enderecoObj: EnderecoSubgerencia | undefined = (cepClean || munClean || ruaClean || numClean || bairroClean || compClean)
      ? {
          cep: cepClean,
          municipio: munClean,
          rua: ruaClean,
          numero: numClean,
          bairro: bairroClean,
          complemento: compClean
        }
      : undefined;

    this.isSaving.set(true);

    setTimeout(() => {
      if (this.isEditMode() && this.itemId) {
        this.service.update(this.itemId, {
          nome,
          gerenciaExecutivaId: gerExecId,
          gerenciaExecutivaNome: gerExecNome,
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
        this.router.navigate(['/configuracoes/hierarquia/subgerencia']);
      } else {
        this.service.add({
          nome,
          gerenciaExecutivaId: gerExecId,
          gerenciaExecutivaNome: gerExecNome,
          utbCodigo,
          utbNome,
          status: 'ATIVO',
          endereco: enderecoObj,
          chefeImediato: chefeFinal,
          normativaCriacao: normativaCriacaoFinal,
          normativaExtincao: normativaExtincaoFinal,
          subordinadas: []
        });

        this.isSavedSuccessfully = true;
        this.isSaving.set(false);
        this.toastService.success('Registro cadastrado com sucesso.');
        this.router.navigate(['/configuracoes/hierarquia/subgerencia']);
      }
    }, 150);
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
      this.router.navigate(['/configuracoes/hierarquia/subgerencia']);
      return;
    }

    const dialogRef = this.modalService.confirmarCancelamento();
    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.isDiscarded = true;
        this.router.navigate(['/configuracoes/hierarquia/subgerencia']);
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

  private hasPendingChanges(): boolean {
    return this.getCurrentSnapshotJson() !== this.initialSnapshotJson;
  }

  private getCurrentSnapshotJson(): string {
    return JSON.stringify({
      form: this.form.value,
      gerExecInput: this.gerExecInputControl.value,
      utbInput: this.utbInputControl.value,
      chefeMatricula: this.chefeImediato()?.matricula,
      atoNum: this.atoNumeroControl.value,
      atoData: this.atoDataControl.value,
      atoDocId: this.atoDocumento()?.id,
      criaNome: this.normCriacaoNomeControl.value,
      criaNum: this.normCriacaoNumeroControl.value,
      criaData: this.normCriacaoDataControl.value,
      criaDocId: this.normCriacaoDoc()?.id,
      extNome: this.normExtincaoNomeControl.value,
      extNum: this.normExtincaoNumeroControl.value,
      extData: this.normExtincaoDataControl.value,
      extDocId: this.normExtincaoDoc()?.id,
      hasExt: this.hasPersistedNormativaExtincao()
    });
  }
}

// ==========================================
// TELA 3: VISUALIZAR SUBGERÊNCIA
// ==========================================

@Component({
  selector: 'app-subgerencia-view',
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
    SiagePaginatorComponent,
    AcessoRestritoComponent
  ],
  template: `
    @if (!permissionService.hasAccess()) {
      <app-acesso-restrito backUrl="/configuracoes/hierarquia/subgerencia" />
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
              Configurar Subgerência
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
                  Visualizar Subgerência
                </h1>
              </div>

              <p class="text-xs sm:text-sm text-siage-text-secondary font-sans leading-normal pl-8 sm:pl-9 max-w-2xl">
                Consulte as informações cadastrais, endereço, chefia, núcleos vinculados e normativas desta unidade.
              </p>
            </div>

            @if (permissionService.canCreate() && item()?.status === 'ATIVO') {
              <div class="flex items-center shrink-0 pl-8 sm:pl-0">
                <button 
                  type="button" 
                  (click)="onEditar()"
                  class="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs hover:shadow cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/50"
                  aria-label="Editar Subgerência"
                >
                  <mat-icon style="font-size: 18px; width: 18px; height: 18px;">edit</mat-icon>
                  <span>Editar</span>
                </button>
              </div>
            }
          </div>
        </div>

        @if (item(); as subger) {
          <div class="flex flex-col gap-6">

            <!-- Card 1: Identificação da Subgerência -->
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">domain</mat-icon>
                <span>1. Identificação da Subgerência</span>
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                <!-- Primeira linha: Nome (4 cols) | Gerência Executiva (4 cols) | UTB (4 cols) -->
                <div class="flex flex-col gap-1 col-span-12 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Nome da Subgerência</span>
                  <span class="text-sm font-medium text-siage-text-primary break-words">{{ subger.nome }}</span>
                </div>

                <div class="flex flex-col gap-1 col-span-12 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Gerência Executiva</span>
                  <span class="text-sm font-medium text-siage-text-primary break-words">{{ subger.gerenciaExecutivaNome }}</span>
                </div>

                <div class="flex flex-col gap-1 col-span-12 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Unidade de Trabalho (UTB)</span>
                  <span class="text-sm font-medium text-siage-text-primary break-words leading-relaxed">{{ subger.utbNome }}</span>
                </div>

                <!-- Segunda linha: Situação | Criador / Editor | Data de Criação -->
                <div class="flex flex-col gap-1 col-span-12 sm:col-span-4 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Situação</span>
                  <span class="text-sm font-medium text-siage-text-primary">{{ subger.status === 'ATIVO' ? 'Ativo' : 'Inativo' }}</span>
                </div>

                <div class="flex flex-col gap-1 col-span-12 sm:col-span-4 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Criador / Editor</span>
                  <span class="text-sm font-medium text-siage-text-primary break-words">{{ subger.criadorEditor }}</span>
                </div>

                <div class="flex flex-col gap-1 col-span-12 sm:col-span-4 md:col-span-4">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data de Criação</span>
                  <span class="text-sm font-medium text-siage-text-primary">{{ subger.dataCriacao }}</span>
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
                    <span class="text-sm font-mono font-medium text-siage-text-primary">{{ subger.endereco?.cep || '-' }}</span>
                  </div>

                  <div class="flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Município</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ subger.endereco?.municipio || '-' }}</span>
                  </div>

                  <div class="flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Rua</span>
                    <span class="text-sm font-medium text-siage-text-primary break-words">{{ subger.endereco?.rua || '-' }}</span>
                  </div>

                  <div class="flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Número</span>
                    <span class="text-sm font-mono font-medium text-siage-text-primary">{{ subger.endereco?.numero || '-' }}</span>
                  </div>

                  <div class="flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Bairro</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ subger.endereco?.bairro || '-' }}</span>
                  </div>

                  <div class="flex flex-col gap-1 sm:col-span-2 md:col-span-3">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Complemento</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ subger.endereco?.complemento || '-' }}</span>
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

              @if (subger.chefeImediato; as chefe) {
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

            <!-- Card 3: Núcleos Vinculados -->
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">device_hub</mat-icon>
                <span>3. Núcleos Vinculados</span>
              </h3>

              <!-- Filtros de Núcleos Vinculados -->
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

                  <!-- Filtro: Unidade de Trabalho (UTB) -->
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

              <!-- Tabela de Núcleos Vinculados -->
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
                          <span>Núcleo</span>
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
                    <span class="text-sm font-medium text-siage-text-primary break-words">{{ subger.normativaCriacao.nome }}</span>
                  </div>
                  <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Número da Normativa</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ subger.normativaCriacao.numero }}</span>
                  </div>
                  <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data da Publicação</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ formatarDataParaExibicao(subger.normativaCriacao.dataPublicacao) }}</span>
                  </div>

                  @if (subger.normativaCriacao.documento; as doc) {
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
              @if (subger.normativaExtincao && subger.normativaExtincao.documento) {
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
                      <span class="text-sm font-medium text-siage-text-primary break-words">{{ subger.normativaExtincao.nome }}</span>
                    </div>
                    <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                      <span class="text-xs uppercase text-siage-text-secondary font-semibold">Número da Normativa</span>
                      <span class="text-sm font-medium text-siage-text-primary">{{ subger.normativaExtincao.numero }}</span>
                    </div>
                    <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-1">
                      <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data da Publicação</span>
                      <span class="text-sm font-medium text-siage-text-primary">{{ formatarDataParaExibicao(subger.normativaExtincao.dataPublicacao) }}</span>
                    </div>

                    @if (subger.normativaExtincao.documento; as docExt) {
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
export class SubgerenciaView implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly service = inject(SubgerenciaService);
  readonly permissionService = inject(PermissionService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  readonly item = signal<SubgerenciaItem | undefined>(undefined);

  // Filtros de Núcleos vinculados
  readonly filtroNome = new FormControl('');
  readonly filtroUtb = new FormControl('');
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
        this.toast.error('Subgerência não encontrada.');
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
    return Array.from(set);
  });

  readonly canBuscar = computed(() => {
    const nome = (this.filtroNome.value || '').trim();
    const utb = (this.filtroUtb.value || '').trim();
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
    this.router.navigate(['/configuracoes/hierarquia/subgerencia']);
  }

  onEditar() {
    const subger = this.item();
    if (subger) {
      this.router.navigate(['/configuracoes/hierarquia/subgerencia', subger.id, 'editar']);
    }
  }

  abrirHistoricoAtos() {
    const subger = this.item();
    const atos = this.service.getHistoricoAtos(subger?.id, subger?.chefeImediato?.atoGovernamental, subger?.chefeImediato?.nome);
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

export const subgerenciaFormDeactivateGuard: CanDeactivateFn<SubgerenciaForm> = (
  component: SubgerenciaForm
) => {
  return component.canDeactivate();
};

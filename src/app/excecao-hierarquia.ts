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
import {from} from 'rxjs';

import {
  SAutocompleteComponent,
  SAutocompleteOption,
  SAutocompleteSelection,
  SBadgeComponent,
  SButtonComponent,
  SCheckboxComponent,
  SFieldComponent,
  SFilterCardComponent,
  SIconComponent,
  SInputComponent,
  SModalComponent,
  SModalFooterDirective,
  SModalService,
  SOptionTemplateDirective,
  SPageHeaderComponent,
  SSelectComponent,
  STableAction,
  STableActionEvent,
  STableCellDirective,
  STableColumn,
  STableComponent,
  STableEmpty,
  STextareaComponent,
  SToastService,
  STooltipDirective,
  injectModalData,
  injectModalRef,
  type SBreadcrumb,
  type SOption,
  type STableSort
} from '@siage/siage-ui';

import {PermissionService} from './permission';
import {AcessoRestritoComponent} from './acesso-restrito';
import {SecretariaGeralService} from './secretaria-geral';
import {SecretariaExecutivaService} from './secretaria-executiva';
import {GerenciaExecutivaService} from './gerencia-executiva';
import {GerenciaRegionalService} from './gerencia-regional';
import {SubgerenciaService} from './subgerencia';
import {NucleoService} from './nucleo';

// ==========================================
// TIPOS E MODELOS — EXCEÇÃO DE HIERARQUIA
// ==========================================

export type TipificacaoSetor =
  | 'Secretaria Geral'
  | 'Secretaria Executiva'
  | 'Gerência Executiva'
  | 'Gerência Regional'
  | 'Subgerência'
  | 'Núcleo';

export type SituacaoSetor = 'REGULAR' | 'SUPRIDO' | 'DESCOBERTO' | 'NECESSITA_TROCA';
export type SituacaoDesignacao = 'ATIVO' | 'SUBSTITUIDO' | 'ENCERRADO';
export type ModalidadeAtuacao = 'SOBREPOE_SEMPRE' | 'APENAS_INDISPONIVEL';

export interface ServidorSimulado {
  matricula: string;
  nome: string;
  cargo: string;
  cpf: string;
  situacaoFuncionalCodigo: number;
  situacaoFuncionalDescricao: string; // Ex: '10 - Em exercício', '25 - Requisitado com ônus', etc.
  indisponibilidade?: {
    tipo: 'Férias' | 'Licença Médica' | 'Afastamento Eleitoral' | 'Missão Oficial';
    dataInicio: string;
    dataTermino?: string;
  };
}

export interface RegistroHistoricoExcecao {
  id: string;
  servidorMatricula: string;
  servidorNome: string;
  modalidade: ModalidadeAtuacao;
  portaria?: string;
  justificativa: string;
  dataInicio: string;
  dataFim?: string;
  vigenciaFormatada: string;
  situacao: SituacaoDesignacao;
  modificadoPor: string;
  dataHoraModificacao: string;
  cienteAlertaIndisponibilidade?: boolean;
}

export interface AprovadorExcecaoVigente {
  matricula: string;
  nome: string;
  cargo: string;
  modalidade: ModalidadeAtuacao;
  portaria?: string;
  justificativa: string;
  dataInicio: string;
  vigenciaFormatada: string;
  situacao: SituacaoDesignacao;
  modificadoPor: string;
  dataHoraModificacao: string;
  cienteAlertaIndisponibilidade?: boolean;
}

export interface SetorHierarquia {
  id: string;
  tipoEntidade: TipificacaoSetor;
  nome: string;
  utbCodigo: string;
  utbNome: string;
  chefeImediato?: {
    matricula: string;
    nome: string;
    cargo: string;
    status: 'ATIVO' | 'INATIVO';
  };
  aprovadorVigente?: AprovadorExcecaoVigente;
  historico: RegistroHistoricoExcecao[];
}

// ==========================================
// BASE DE SERVIDORES SIMULADOS PARA EXCEÇÃO
// ==========================================

export const SERVIDORES_SIMULADOS_EXCECAO: ServidorSimulado[] = [
  {
    matricula: '170',
    nome: 'Mikael Oliveira da Silva',
    cargo: 'Analista de Gestão Governamental',
    cpf: '123.456.789-00',
    situacaoFuncionalCodigo: 10,
    situacaoFuncionalDescricao: '10 — Em exercício'
  },
  {
    matricula: '185',
    nome: 'Ana Beatriz Vasconcelos',
    cargo: 'Técnico Administrativo',
    cpf: '234.567.890-11',
    situacaoFuncionalCodigo: 10,
    situacaoFuncionalDescricao: '10 — Em exercício'
  },
  {
    matricula: '203',
    nome: 'Carlos Eduardo de Morais',
    cargo: 'Especialista em Políticas Públicas',
    cpf: '345.678.901-22',
    situacaoFuncionalCodigo: 25,
    situacaoFuncionalDescricao: '25 — Requisitado com ônus'
  },
  {
    matricula: '210',
    nome: 'Gabriel Arcoverde Medeiros',
    cargo: 'Técnico Administrativo',
    cpf: '901.234.567-88',
    situacaoFuncionalCodigo: 22,
    situacaoFuncionalDescricao: '22 — Requisitado sem ônus para estado'
  },
  {
    matricula: '211',
    nome: 'Dr. Roberto Sales Bezerra',
    cargo: 'Gerente Regional de Ensino',
    cpf: '123.456.789-01',
    situacaoFuncionalCodigo: 31,
    situacaoFuncionalDescricao: '31 — Requisitado com ressarcimento'
  },
  {
    matricula: '190',
    nome: 'Juliana Cavalcanti Costa',
    cargo: 'Técnico em Administração Pública',
    cpf: '678.901.234-55',
    situacaoFuncionalCodigo: 10,
    situacaoFuncionalDescricao: '10 — Em exercício',
    indisponibilidade: {
      tipo: 'Férias',
      dataInicio: '01/11/2026',
      dataTermino: '30/11/2026'
    }
  },
  {
    matricula: '201',
    nome: 'Renata Silveira Pinto',
    cargo: 'Analista de Gestão Governamental',
    cpf: '890.123.456-77',
    situacaoFuncionalCodigo: 10,
    situacaoFuncionalDescricao: '10 — Em exercício',
    indisponibilidade: {
      tipo: 'Licença Médica',
      dataInicio: '20/10/2026',
      dataTermino: '20/12/2026'
    }
  },
  {
    matricula: '194',
    nome: 'Patrícia Helena Farias',
    cargo: 'Auditor de Controle Interno',
    cpf: '456.789.012-33',
    situacaoFuncionalCodigo: 40,
    situacaoFuncionalDescricao: '40 — Afastado sem remuneração'
  },
  {
    matricula: '143',
    nome: 'Ricardo Mendonça Lima',
    cargo: 'Analista de Gestão Governamental',
    cpf: '567.890.123-44',
    situacaoFuncionalCodigo: 55,
    situacaoFuncionalDescricao: '55 — Licença para tratar de interesses particulares'
  },
  {
    matricula: '131',
    nome: 'Fernando Henrique Santos',
    cargo: 'Analista de Sistemas Governamentais',
    cpf: '789.012.345-66',
    situacaoFuncionalCodigo: 60,
    situacaoFuncionalDescricao: '60 — Disponibilidade remunerada'
  },
  {
    matricula: '301',
    nome: 'Mariana Albuquerque Feitosa',
    cargo: 'Especialista em Gestão de Pessoas',
    cpf: '222.333.444-55',
    situacaoFuncionalCodigo: 10,
    situacaoFuncionalDescricao: '10 — Em exercício'
  },
  {
    matricula: '703',
    nome: 'Luciana Rocha Pinheiro',
    cargo: 'Gerente de Seleção e Carreiras',
    cpf: '266.377.488-88',
    situacaoFuncionalCodigo: 10,
    situacaoFuncionalDescricao: '10 — Em exercício'
  },
  {
    matricula: '401',
    nome: 'Carlos Eduardo de Morais',
    cargo: 'Diretor de Tecnologia e Informação',
    cpf: '101.202.303-44',
    situacaoFuncionalCodigo: 25,
    situacaoFuncionalDescricao: '25 — Requisitado com ônus'
  },
  {
    matricula: '802',
    nome: 'Gabriel Menezes Silva',
    cargo: 'Especialista em Modernização do Estado',
    cpf: '488.599.600-99',
    situacaoFuncionalCodigo: 55,
    situacaoFuncionalDescricao: '55 — Licença para tratar de interesses particulares'
  },
  {
    matricula: '213',
    nome: 'Dr. Valter Medeiros Albuquerque',
    cargo: 'Gerente Regional',
    cpf: '345.678.901-23',
    situacaoFuncionalCodigo: 10,
    situacaoFuncionalDescricao: '10 — Em exercício'
  },
  {
    matricula: '710',
    nome: 'Juliana Mendes Caldas',
    cargo: 'Subgerente de Admissão de Pessoal',
    cpf: '333.444.555-66',
    situacaoFuncionalCodigo: 10,
    situacaoFuncionalDescricao: '10 — Em exercício',
    indisponibilidade: {
      tipo: 'Férias',
      dataInicio: '01/11/2026',
      dataTermino: '30/11/2026'
    }
  },
  {
    matricula: '715',
    nome: 'Marcos Paulo Saraiva',
    cargo: 'Subgerente de Avaliação Funcional',
    cpf: '555.666.777-88',
    situacaoFuncionalCodigo: 10,
    situacaoFuncionalDescricao: '10 — Em exercício'
  },
  {
    matricula: '820',
    nome: 'Rodrigo Tavares Lima',
    cargo: 'Subgerente de Arquitetura de Software',
    cpf: '777.888.999-00',
    situacaoFuncionalCodigo: 10,
    situacaoFuncionalDescricao: '10 — Em exercício'
  },
  {
    matricula: '215',
    nome: 'Renato Bezerra da Costa',
    cargo: 'Chefe de Núcleo',
    cpf: '256.377.488-79',
    situacaoFuncionalCodigo: 10,
    situacaoFuncionalDescricao: '10 — Em exercício',
    indisponibilidade: {
      tipo: 'Licença Médica',
      dataInicio: '20/10/2026',
      dataTermino: '20/12/2026'
    }
  },
  {
    matricula: '218',
    nome: 'Carlos Alberto Mendonça',
    cargo: 'Coordenador Pedagógico Regional',
    cpf: '123.456.789-01',
    situacaoFuncionalCodigo: 40,
    situacaoFuncionalDescricao: '40 — Afastado sem remuneração'
  },
  {
    matricula: '219',
    nome: 'Helder Bezerra Farias',
    cargo: 'Chefe de Apoio e Logística',
    cpf: '234.567.890-12',
    situacaoFuncionalCodigo: 10,
    situacaoFuncionalDescricao: '10 — Em exercício'
  }
];

export const CODIGOS_SITUACAO_FUNCIONAL_ELEGIVEIS = [10, 25, 31, 22];

// ==========================================
// SERVIÇO PRINCIPAL — EXCEÇÃO DE HIERARQUIA
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class ExcecaoHierarquiaService {
  private readonly secGeralService = inject(SecretariaGeralService);
  private readonly secExecService = inject(SecretariaExecutivaService);
  private readonly gerExecService = inject(GerenciaExecutivaService);
  private readonly gerRegService = inject(GerenciaRegionalService);
  private readonly subgerService = inject(SubgerenciaService);
  private readonly nucleoService = inject(NucleoService);

  // Mapeamento em memória de exceções e histórico por ID de setor
  private readonly excecoesPorSetor = signal<Record<string, {
    aprovadorVigente?: AprovadorExcecaoVigente;
    historico: RegistroHistoricoExcecao[];
  }>>({
    // Cenário 1: Suprido por Exceção (SEAD - Sem chefe ativo, mas com aprovador elegível e ativo)
    'sec-geral-1': {
      aprovadorVigente: {
        matricula: '170',
        nome: 'Mikael Oliveira da Silva',
        cargo: 'Analista de Gestão Governamental',
        modalidade: 'SOBREPOE_SEMPRE',
        portaria: 'Portaria SEAD nº 104/2024',
        justificativa: 'Designado para aprovação temporária em razão da vacância do cargo de direção.',
        dataInicio: '10/01/2024',
        vigenciaFormatada: 'Desde 10/01/2024 (Vigente)',
        situacao: 'ATIVO',
        modificadoPor: 'Mikael Oliveira',
        dataHoraModificacao: '10/01/2024 14:30',
        cienteAlertaIndisponibilidade: false
      },
      historico: [
        {
          id: 'hist-sec-geral-1-1',
          servidorMatricula: '170',
          servidorNome: 'Mikael Oliveira da Silva',
          modalidade: 'SOBREPOE_SEMPRE',
          portaria: 'Portaria SEAD nº 104/2024',
          justificativa: 'Designado para aprovação temporária em razão da vacância do cargo de direção.',
          dataInicio: '10/01/2024',
          vigenciaFormatada: 'Desde 10/01/2024 (Vigente)',
          situacao: 'ATIVO',
          modificadoPor: 'Mikael Oliveira',
          dataHoraModificacao: '10/01/2024 14:30',
          cienteAlertaIndisponibilidade: false
        }
      ]
    },
    // Cenário 2: Necessita Troca (Gerência Executiva de Seleção - Aprovadora Juliana está em férias vigentes)
    'ge-1': {
      aprovadorVigente: {
        matricula: '190',
        nome: 'Juliana Cavalcanti Costa',
        cargo: 'Técnico em Administração Pública',
        modalidade: 'APENAS_INDISPONIVEL',
        portaria: 'Portaria SEGP nº 45/2024',
        justificativa: 'Aprovadora substituta nos períodos de ausência do titular da Gerência Executiva.',
        dataInicio: '01/03/2024',
        vigenciaFormatada: 'Desde 01/03/2024 (Vigente)',
        situacao: 'ATIVO',
        modificadoPor: 'Mikael Oliveira',
        dataHoraModificacao: '01/03/2024 09:15',
        cienteAlertaIndisponibilidade: true
      },
      historico: [
        {
          id: 'hist-ge-1-1',
          servidorMatricula: '185',
          servidorNome: 'Ana Beatriz Vasconcelos',
          modalidade: 'APENAS_INDISPONIVEL',
          portaria: 'Portaria SEGP nº 12/2023',
          justificativa: 'Substituta designada para atendimento da demanda de férias do primeiro semestre.',
          dataInicio: '15/06/2023',
          dataFim: '28/02/2024',
          vigenciaFormatada: '15/06/2023 a 28/02/2024',
          situacao: 'SUBSTITUIDO',
          modificadoPor: 'Mikael Oliveira',
          dataHoraModificacao: '01/03/2024 09:15',
          cienteAlertaIndisponibilidade: false
        },
        {
          id: 'hist-ge-1-2',
          servidorMatricula: '190',
          servidorNome: 'Juliana Cavalcanti Costa',
          modalidade: 'APENAS_INDISPONIVEL',
          portaria: 'Portaria SEGP nº 45/2024',
          justificativa: 'Aprovadora substituta nos períodos de ausência do titular da Gerência Executiva.',
          dataInicio: '01/03/2024',
          vigenciaFormatada: 'Desde 01/03/2024 (Vigente)',
          situacao: 'ATIVO',
          modificadoPor: 'Mikael Oliveira',
          dataHoraModificacao: '01/03/2024 09:15',
          cienteAlertaIndisponibilidade: true
        }
      ]
    },
    // Cenário 3: Histórico com Revogação anterior (Subgerência de Apoio Operacional subger-4 - Descoberto)
    'subger-4': {
      aprovadorVigente: undefined,
      historico: [
        {
          id: 'hist-subger-4-1',
          servidorMatricula: '203',
          servidorNome: 'Carlos Eduardo de Morais',
          modalidade: 'SOBREPOE_SEMPRE',
          portaria: 'Portaria nº 88/2023',
          justificativa: 'Designado temporariamente até a reestruturação da subgerência.',
          dataInicio: '10/02/2023',
          dataFim: '28/12/2023',
          vigenciaFormatada: '10/02/2023 a 28/12/2023',
          situacao: 'ENCERRADO',
          modificadoPor: 'Mikael Oliveira',
          dataHoraModificacao: '28/12/2023 16:00',
          cienteAlertaIndisponibilidade: false
        }
      ]
    }
  });

  // Lista consolidada de setores derivados de todos os 6 CRUDs da Hierarquia
  readonly setores = computed<SetorHierarquia[]>(() => {
    const list: SetorHierarquia[] = [];
    const excecoesMap = this.excecoesPorSetor();

    // 1. Secretaria Geral (1 unidade)
    const secGerais = this.secGeralService.items();
    secGerais.forEach(sg => {
      const id = `sec-geral-${sg.id}`;
      const exc = excecoesMap[id] || { aprovadorVigente: undefined, historico: [] };
      const chefe = sg.chefeImediato;
      list.push({
        id,
        tipoEntidade: 'Secretaria Geral',
        nome: sg.nome,
        utbCodigo: sg.utbCodigo,
        utbNome: sg.utbNome,
        chefeImediato: chefe ? {
          matricula: chefe.matricula,
          nome: chefe.nome,
          cargo: chefe.cargo,
          status: this.isChefeAtivo(chefe) ? 'ATIVO' : 'INATIVO'
        } : undefined,
        aprovadorVigente: exc.aprovadorVigente,
        historico: exc.historico
      });
    });

    // 2. Secretarias Executivas
    const secExecs = this.secExecService.items();
    secExecs.forEach(se => {
      const id = `sec-exec-${se.id}`;
      const exc = excecoesMap[id] || { aprovadorVigente: undefined, historico: [] };
      const chefe = se.chefeImediato;
      list.push({
        id,
        tipoEntidade: 'Secretaria Executiva',
        nome: se.nome,
        utbCodigo: se.utbCodigo,
        utbNome: se.utbNome,
        chefeImediato: chefe ? {
          matricula: chefe.matricula,
          nome: chefe.nome,
          cargo: chefe.cargo,
          status: this.isChefeAtivo(chefe) ? 'ATIVO' : 'INATIVO'
        } : undefined,
        aprovadorVigente: exc.aprovadorVigente,
        historico: exc.historico
      });
    });

    // 3. Gerências Executivas
    const gerExecs = this.gerExecService.items();
    gerExecs.forEach(ge => {
      const id = ge.id;
      const exc = excecoesMap[id] || { aprovadorVigente: undefined, historico: [] };
      const chefe = ge.chefeImediato;
      list.push({
        id,
        tipoEntidade: 'Gerência Executiva',
        nome: ge.nome,
        utbCodigo: ge.utbCodigo,
        utbNome: ge.utbNome,
        chefeImediato: chefe ? {
          matricula: chefe.matricula,
          nome: chefe.nome,
          cargo: chefe.cargo,
          status: this.isChefeAtivo(chefe) ? 'ATIVO' : 'INATIVO'
        } : undefined,
        aprovadorVigente: exc.aprovadorVigente,
        historico: exc.historico
      });
    });

    // 4. Gerências Regionais
    const gerRegs = this.gerRegService.items();
    gerRegs.forEach(gr => {
      const id = gr.id;
      const exc = excecoesMap[id] || { aprovadorVigente: undefined, historico: [] };
      const chefe = gr.chefeImediato;
      list.push({
        id,
        tipoEntidade: 'Gerência Regional',
        nome: gr.nome,
        utbCodigo: gr.utbCodigo,
        utbNome: gr.utbNome,
        chefeImediato: chefe ? {
          matricula: chefe.matricula,
          nome: chefe.nome,
          cargo: chefe.cargo,
          status: this.isChefeAtivo(chefe) ? 'ATIVO' : 'INATIVO'
        } : undefined,
        aprovadorVigente: exc.aprovadorVigente,
        historico: exc.historico
      });
    });

    // 5. Subgerências
    const subgers = this.subgerService.items();
    subgers.forEach(sub => {
      const id = sub.id;
      const exc = excecoesMap[id] || { aprovadorVigente: undefined, historico: [] };
      const chefe = sub.chefeImediato;
      list.push({
        id,
        tipoEntidade: 'Subgerência',
        nome: sub.nome,
        utbCodigo: sub.utbCodigo,
        utbNome: sub.utbNome,
        chefeImediato: chefe ? {
          matricula: chefe.matricula,
          nome: chefe.nome,
          cargo: chefe.cargo,
          status: this.isChefeAtivo(chefe) ? 'ATIVO' : 'INATIVO'
        } : undefined,
        aprovadorVigente: exc.aprovadorVigente,
        historico: exc.historico
      });
    });

    // 6. Núcleos
    const nucleos = this.nucleoService.items();
    nucleos.forEach(nuc => {
      const id = nuc.id;
      const exc = excecoesMap[id] || { aprovadorVigente: undefined, historico: [] };
      const chefe = nuc.chefeImediato;
      list.push({
        id,
        tipoEntidade: 'Núcleo',
        nome: nuc.nome,
        utbCodigo: nuc.utbCodigo,
        utbNome: nuc.utbNome,
        chefeImediato: chefe ? {
          matricula: chefe.matricula,
          nome: chefe.nome,
          cargo: chefe.cargo,
          status: this.isChefeAtivo(chefe) ? 'ATIVO' : 'INATIVO'
        } : undefined,
        aprovadorVigente: exc.aprovadorVigente,
        historico: exc.historico
      });
    });

    return list;
  });

  getSetor(id: string): SetorHierarquia | undefined {
    return this.setores().find(s => s.id === id);
  }

  isChefeAtivo(chefe?: { matricula: string }): boolean {
    if (!chefe || !chefe.matricula) return false;
    const serv = this.getServidor(chefe.matricula);
    if (!serv) return false;
    const isElegivel = CODIGOS_SITUACAO_FUNCIONAL_ELEGIVEIS.includes(serv.situacaoFuncionalCodigo);
    const isDisponivel = !serv.indisponibilidade;
    return isElegivel && isDisponivel;
  }

  getChefeStatusInfo(chefe?: { matricula: string; nome: string }): {
    status: 'ATIVO' | 'INATIVO' | 'SEM_CHEFE';
    detalhe?: string;
  } {
    if (!chefe || !chefe.matricula) {
      return { status: 'SEM_CHEFE' };
    }
    const serv = this.getServidor(chefe.matricula);
    if (!serv) {
      return { status: 'ATIVO' };
    }
    const isElegivel = CODIGOS_SITUACAO_FUNCIONAL_ELEGIVEIS.includes(serv.situacaoFuncionalCodigo);
    if (!isElegivel) {
      const cod = serv.situacaoFuncionalCodigo;
      return { status: 'INATIVO', detalhe: `Situação: ${cod}` };
    }
    if (serv.indisponibilidade) {
      return { status: 'INATIVO', detalhe: serv.indisponibilidade.tipo };
    }
    return { status: 'ATIVO' };
  }

  // Regra de Cálculo da Situação do Setor
  calcularSituacaoSetor(setor: SetorHierarquia): SituacaoSetor {
    const temChefeAtivo = this.isChefeAtivo(setor.chefeImediato);
    const aprovador = setor.aprovadorVigente;

    if (aprovador && aprovador.situacao === 'ATIVO') {
      const servidor = this.getServidor(aprovador.matricula);
      const isElegivel = servidor
        ? CODIGOS_SITUACAO_FUNCIONAL_ELEGIVEIS.includes(servidor.situacaoFuncionalCodigo)
        : false;
      const isIndisponivel = !!servidor?.indisponibilidade;

      // Se possui aprovador ativo inelegível ou operacionalmente indisponível,
      // a regra "Necessita Troca" prevalece inclusive quando existir chefia ativa.
      if (!isElegivel || isIndisponivel) {
        return 'NECESSITA_TROCA';
      }

      // Se não possui chefia ativa mas possui aprovador ativo e elegível: Suprido
      if (!temChefeAtivo) {
        return 'SUPRIDO';
      }

      // Se possui chefia ativa e aprovador ativo/elegível/disponível: Regular
      return 'REGULAR';
    }

    // Sem aprovador ativo:
    if (temChefeAtivo) {
      return 'REGULAR';
    }

    return 'DESCOBERTO';
  }

  // Base de Servidores
  getServidores(): ServidorSimulado[] {
    return SERVIDORES_SIMULADOS_EXCECAO;
  }

  getServidor(matricula: string): ServidorSimulado | undefined {
    return SERVIDORES_SIMULADOS_EXCECAO.find(s => s.matricula === matricula);
  }

  isServidorElegivel(servidor: ServidorSimulado): boolean {
    return CODIGOS_SITUACAO_FUNCIONAL_ELEGIVEIS.includes(servidor.situacaoFuncionalCodigo);
  }

  // Designar novo aprovador (ou substituir se já existir ativo)
  salvarDesignacao(
    setorId: string,
    dados: {
      matricula: string;
      modalidade: ModalidadeAtuacao;
      portaria?: string;
      justificativa: string;
      cienteAlertaIndisponibilidade?: boolean;
    }
  ): void {
    const servidor = this.getServidor(dados.matricula);
    if (!servidor) return;

    const agora = new Date();
    const dataHoraStr = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
    const dataInicioStr = agora.toLocaleDateString('pt-BR');

    this.excecoesPorSetor.update(currentMap => {
      const existing = currentMap[setorId] || { aprovadorVigente: undefined, historico: [] };
      const novoHistorico = [...existing.historico];

      // Se já houver aprovador ativo e for diferente: marca como SUBSTITUIDO
      if (existing.aprovadorVigente && existing.aprovadorVigente.situacao === 'ATIVO') {
        const anterior = existing.aprovadorVigente;
        if (anterior.matricula !== dados.matricula) {
          // Atualiza histórico encerrando o anterior
          const idx = novoHistorico.findIndex(h => h.servidorMatricula === anterior.matricula && h.situacao === 'ATIVO');
          if (idx >= 0) {
            novoHistorico[idx] = {
              ...novoHistorico[idx],
              dataFim: dataInicioStr,
              vigenciaFormatada: `${novoHistorico[idx].dataInicio} a ${dataInicioStr}`,
              situacao: 'SUBSTITUIDO',
              dataHoraModificacao: dataHoraStr
            };
          }
        } else {
          // Mesma matrícula (atualização de modalidade/portaria/justificativa)
          const idx = novoHistorico.findIndex(h => h.servidorMatricula === anterior.matricula && h.situacao === 'ATIVO');
          if (idx >= 0) {
            novoHistorico[idx] = {
              ...novoHistorico[idx],
              modalidade: dados.modalidade,
              portaria: dados.portaria,
              justificativa: dados.justificativa,
              dataHoraModificacao: dataHoraStr,
              cienteAlertaIndisponibilidade: !!dados.cienteAlertaIndisponibilidade
            };
          }

          const novoAprovador: AprovadorExcecaoVigente = {
            ...anterior,
            modalidade: dados.modalidade,
            portaria: dados.portaria,
            justificativa: dados.justificativa,
            dataHoraModificacao: dataHoraStr,
            cienteAlertaIndisponibilidade: !!dados.cienteAlertaIndisponibilidade
          };

          return {
            ...currentMap,
            [setorId]: {
              aprovadorVigente: novoAprovador,
              historico: novoHistorico
            }
          };
        }
      }

      // Nova designação ativa
      const novaDesignacao: AprovadorExcecaoVigente = {
        matricula: servidor.matricula,
        nome: servidor.nome,
        cargo: servidor.cargo,
        modalidade: dados.modalidade,
        portaria: dados.portaria,
        justificativa: dados.justificativa,
        dataInicio: dataInicioStr,
        vigenciaFormatada: `Desde ${dataInicioStr} (Vigente)`,
        situacao: 'ATIVO',
        modificadoPor: 'Mikael Oliveira',
        dataHoraModificacao: dataHoraStr,
        cienteAlertaIndisponibilidade: !!dados.cienteAlertaIndisponibilidade
      };

      const novoItemHistorico: RegistroHistoricoExcecao = {
        id: `hist-${setorId}-${Date.now()}`,
        servidorMatricula: servidor.matricula,
        servidorNome: servidor.nome,
        modalidade: dados.modalidade,
        portaria: dados.portaria,
        justificativa: dados.justificativa,
        dataInicio: dataInicioStr,
        vigenciaFormatada: `Desde ${dataInicioStr} (Vigente)`,
        situacao: 'ATIVO',
        modificadoPor: 'Mikael Oliveira',
        dataHoraModificacao: dataHoraStr,
        cienteAlertaIndisponibilidade: !!dados.cienteAlertaIndisponibilidade
      };

      novoHistorico.unshift(novoItemHistorico);

      return {
        ...currentMap,
        [setorId]: {
          aprovadorVigente: novaDesignacao,
          historico: novoHistorico
        }
      };
    });
  }

  // Revogar exceção vigente
  revogarExcecao(setorId: string): void {
    const agora = new Date();
    const dataHoraStr = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
    const dataFimStr = agora.toLocaleDateString('pt-BR');

    this.excecoesPorSetor.update(currentMap => {
      const existing = currentMap[setorId];
      if (!existing || !existing.aprovadorVigente) return currentMap;

      const anterior = existing.aprovadorVigente;
      const novoHistorico = existing.historico.map(h => {
        if (h.servidorMatricula === anterior.matricula && h.situacao === 'ATIVO') {
          return {
            ...h,
            dataFim: dataFimStr,
            vigenciaFormatada: `${h.dataInicio} a ${dataFimStr}`,
            situacao: 'ENCERRADO' as SituacaoDesignacao,
            dataHoraModificacao: dataHoraStr
          };
        }
        return h;
      });

      return {
        ...currentMap,
        [setorId]: {
          aprovadorVigente: undefined,
          historico: novoHistorico
        }
      };
    });
  }
}

// ==========================================
// MODAL: DETALHES DO REGISTRO DE EXCEÇÃO
// ==========================================

@Component({
  selector: 'app-detalhes-excecao-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SModalComponent,
    SModalFooterDirective,
    SBadgeComponent,
    SButtonComponent
  ],
  template: `
    <s-modal
      title="Detalhes do Registro de Exceção"
      description="Consulte os dados completos e o histórico de auditoria desta exceção."
      width="600px"
      [closable]="true"
      (cancel)="fechar()"
      (closed)="fechar()"
    >
      <div class="flex flex-col gap-4 font-sans text-left">
        <!-- Identificação do Aprovador -->
        <div class="border border-siage-border rounded-lg p-3.5 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-siage-primary/10 text-siage-primary flex items-center justify-center font-bold font-poppins shrink-0">
            {{ data.registro.servidorNome.charAt(0) }}
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-semibold text-siage-text-primary">{{ data.registro.servidorNome }}</span>
            <span class="text-xs text-siage-text-secondary">Matrícula: {{ data.registro.servidorMatricula }}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase text-siage-text-secondary font-semibold">Tipo de Atuação</span>
            <span class="text-sm font-medium text-siage-text-primary">
              {{ data.registro.modalidade === 'SOBREPOE_SEMPRE' ? 'Sempre sobrepõe o chefe imediato' : 'Atua somente quando indisponível ou não definido' }}
            </span>
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase text-siage-text-secondary font-semibold">Situação do Registro</span>
            <div>
              @if (data.registro.situacao === 'ATIVO') {
                <s-badge tone="success">Ativo</s-badge>
              } @else if (data.registro.situacao === 'SUBSTITUIDO') {
                <s-badge tone="secondary">Substituído</s-badge>
              } @else {
                <s-badge tone="warning" icon="history">Encerrado</s-badge>
              }
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase text-siage-text-secondary font-semibold">Portaria Regulamentadora</span>
            <span class="text-sm font-medium text-siage-text-primary">{{ data.registro.portaria || 'Não informada' }}</span>
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase text-siage-text-secondary font-semibold">Período de Vigência</span>
            <span class="text-sm font-medium text-siage-text-primary">{{ data.registro.vigenciaFormatada }}</span>
          </div>
        </div>

        <!-- Justificativa -->
        <div class="flex flex-col gap-1 pt-2 border-t border-siage-border/40">
          <span class="text-xs uppercase text-siage-text-secondary font-semibold">Justificativa da Exceção Fundamentada</span>
          <p class="text-xs sm:text-sm text-siage-text-primary bg-siage-surface p-3 rounded-lg border border-siage-border whitespace-pre-wrap leading-relaxed">
            {{ data.registro.justificativa }}
          </p>
        </div>

        <!-- Dados de Auditoria -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-siage-border/40">
          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase text-siage-text-secondary font-semibold">Modificado por</span>
            <span class="text-sm font-medium text-siage-text-primary">{{ data.registro.modificadoPor }}</span>
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data / Hora Modificação</span>
            <span class="text-sm font-medium text-siage-text-primary">{{ data.registro.dataHoraModificacao }}</span>
          </div>
        </div>
      </div>

      <div sModalFooter>
        <s-button variant="primary" (click)="fechar()">Fechar</s-button>
      </div>
    </s-modal>
  `
})
export class DetalhesExcecaoModal {
  readonly dialogRef = injectModalRef<void, DetalhesExcecaoModal>();
  readonly data = injectModalData<{registro: RegistroHistoricoExcecao}>();

  fechar() {
    this.dialogRef.close();
  }
}

// ==========================================
// TELA 1: LISTAR EXCEÇÃO DE HIERARQUIA
// ==========================================

@Component({
  selector: 'app-excecao-hierarquia-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SPageHeaderComponent,
    SFilterCardComponent,
    SFieldComponent,
    SInputComponent,
    SSelectComponent,
    STableComponent,
    STableCellDirective,
    SBadgeComponent,
    STooltipDirective,
    AcessoRestritoComponent
  ],
  template: `
    @if (!permissionService.hasAccess()) {
      <app-acesso-restrito backUrl="/configuracoes/hierarquia" />
    } @else {
      <div class="flex flex-col gap-6 max-w-7xl mx-auto w-full font-sans pb-12">
        <!-- Cabeçalho Oficial SIAGE-UI -->
        <s-page-header
          [breadcrumbs]="breadcrumbs"
          title="Exceção de Hierarquia"
          description="Designação de aprovadores de exceção para fluxos de aprovação quando houver necessidade de sobreposição ou ausência da chefia imediata formal."
          showBack
          (back)="goHierarquia()"
        />

        <!-- Card de Filtros Oficial SIAGE-UI -->
        <s-filter-card
          [form]="filtroForm"
          [showActiveFilters]="false"
          disableSearchWithoutValue
          (search)="onBuscar()"
          (clear)="onLimpar()"
        >
          <ng-container [formGroup]="filtroForm">
              <!-- Filtro 1: Unidade de Trabalho / Setor -->
              <s-field label="Unidade de Trabalho / Setor" controlId="filter-setor">
                <s-input
                  formControlName="setor"
                  placeholder="Buscar por Unidade de Trabalho / Setor"
                  (keydown.enter)="$event.preventDefault(); canBuscar() && onBuscar()"
                />
              </s-field>

              <!-- Filtro 2: Situação -->
              <s-field label="Situação" controlId="filter-situacao">
                <s-select
                  formControlName="situacao"
                  [options]="situacaoOptions"
                  [clearable]="false"
                />
              </s-field>

              <!-- Filtro 3: Chefia Imediata (Situação) -->
              <s-field label="Chefia Imediata (Situação)" controlId="filter-chefe-sit">
                <s-select
                  formControlName="chefeSituacao"
                  [options]="chefeSituacaoOptions"
                  [clearable]="false"
                />
              </s-field>

              <!-- Filtro 4: Chefia Imediata (Nome) -->
              <s-field label="Chefia Imediata (Nome)" controlId="filter-chefe-nome">
                <s-input
                  formControlName="chefeNome"
                  placeholder="Buscar por Chefia Imediata (Nome)"
                  (keydown.enter)="$event.preventDefault(); canBuscar() && onBuscar()"
                />
              </s-field>

              <!-- Filtro 5: Aprovador de Exceção (Situação) -->
              <s-field label="Aprovador de Exceção (Situação)" controlId="filter-aprov-sit">
                <s-select
                  formControlName="aprovadorSituacao"
                  [options]="aprovadorSituacaoOptions"
                  [clearable]="false"
                />
              </s-field>

              <!-- Filtro 6: Aprovador de Exceção (Nome) -->
              <s-field label="Aprovador de Exceção (Nome)" controlId="filter-aprov-nome">
                <s-input
                  formControlName="aprovadorNome"
                  placeholder="Buscar por Aprovador de Exceção (Nome)"
                  (keydown.enter)="$event.preventDefault(); canBuscar() && onBuscar()"
                />
              </s-field>
          </ng-container>
        </s-filter-card>

        <!-- Tabela Oficial SIAGE-UI -->
        <s-table
          label="Exceção de Hierarquia"
          [columns]="tableColumns"
          [rows]="paginatedSetores()"
          [actions]="tableActions"
          [sort]="tableSort()"
          [page]="pageIndex() + 1"
          [pageSize]="pageSize()"
          [total]="filteredSetores().length"
          [empty]="tableEmpty"
          (sortChange)="onSortChange($event)"
          (actionClick)="onTableAction($event)"
          (pageChange)="onPageChange($event - 1)"
          (pageSizeChange)="onPageSizeChange($event)"
        >
          <ng-template sTableCell="nome" let-setor>
            @let s = asSetor(setor);
            <span class="text-[10px] font-bold text-siage-primary uppercase tracking-wider block">
              {{ s.tipoEntidade }}
            </span>
            <span class="text-sm font-semibold text-siage-text-primary block mt-0.5">
              {{ s.nome }}
            </span>
          </ng-template>

          <ng-template sTableCell="utbCodigo" let-setor>
            @let s = asSetor(setor);
            <span class="font-mono font-medium text-siage-text-primary">{{ s.utbCodigo }}</span>
          </ng-template>

          <ng-template sTableCell="chefeImediato" let-setor>
            @let s = asSetor(setor);
            @if (s.chefeImediato; as chefe) {
              @let chefeInfo = getChefeStatusInfo(chefe);
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="font-medium text-siage-text-primary">{{ chefe.nome }}</span>
                @if (chefeInfo.status === 'INATIVO') {
                  <s-badge tone="secondary">Inativo</s-badge>
                }
              </div>
              <span class="text-siage-text-secondary block text-xs">Matrícula: {{ chefe.matricula }}</span>
            } @else {
              <span class="text-siage-text-secondary/70 italic text-xs">Sem Chefe Definido</span>
            }
          </ng-template>

          <ng-template sTableCell="aprovadorVigente" let-setor>
            @let s = asSetor(setor);
            @if (s.aprovadorVigente; as ap) {
              <span class="font-medium text-siage-text-primary block">{{ ap.nome }}</span>
              <span class="text-siage-text-secondary block text-xs">Matrícula: {{ ap.matricula }}</span>
            } @else {
              <span class="text-siage-text-secondary/70 italic text-xs">Sem exceção cadastrada</span>
            }
          </ng-template>

          <ng-template sTableCell="tipoEntidade" let-setor>
            @let s = asSetor(setor);
            @if (s.aprovadorVigente; as ap) {
              @if (ap.modalidade === 'SOBREPOE_SEMPRE') {
                <span class="font-medium text-siage-text-primary block text-xs">Sempre sobrepõe chefia</span>
              } @else {
                <span class="font-medium text-siage-text-primary block text-xs">Suporte à chefia ausente</span>
              }
            } @else {
              <span class="text-siage-text-secondary/60 text-xs">—</span>
            }
          </ng-template>

          <ng-template sTableCell="id" let-setor>
            @let s = asSetor(setor);
            @let situacao = getSituacao(s);
            @if (situacao === 'REGULAR') {
              <s-badge tone="success">Regular</s-badge>
            } @else if (situacao === 'SUPRIDO') {
              <s-badge tone="info">Suprido</s-badge>
            } @else if (situacao === 'DESCOBERTO') {
              <s-badge tone="destructive" icon="error">Descoberto</s-badge>
            } @else if (situacao === 'NECESSITA_TROCA') {
              <s-badge tone="warning" icon="warning" sTooltip="Aprovador ativo indisponível operacionalmente ou com situação impeditiva">
                Necessita Troca
              </s-badge>
            }
          </ng-template>
        </s-table>
      </div>
    }
  `
})
export class ExcecaoHierarquiaList {
  private readonly router = inject(Router);
  readonly service = inject(ExcecaoHierarquiaService);
  readonly permissionService = inject(PermissionService);

  readonly breadcrumbs: readonly SBreadcrumb[] = [
    { label: 'Início', routerLink: '/inicio' },
    { label: 'Configurações', routerLink: '/configuracoes' },
    { label: 'Hierarquia de Unidades e Cargos', routerLink: '/configuracoes/hierarquia' },
    { label: 'Exceção de Hierarquia' }
  ];

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  // Formulário de Filtros
  readonly filtroForm = new FormGroup({
    setor: new FormControl(''),
    situacao: new FormControl('TODOS'),
    chefeSituacao: new FormControl('TODOS'),
    chefeNome: new FormControl(''),
    aprovadorSituacao: new FormControl('TODOS'),
    aprovadorNome: new FormControl('')
  });

  // Filtros aplicados
  readonly appliedSetor = signal('');
  readonly appliedSituacao = signal('TODOS');
  readonly appliedChefeSituacao = signal('TODOS');
  readonly appliedChefeNome = signal('');
  readonly appliedAprovadorSituacao = signal('TODOS');
  readonly appliedAprovadorNome = signal('');

  // Form Signals reativos para acompanhar digitação e habilitar/desabilitar botão Buscar
  readonly filtroSetorVal = toSignal(this.filtroForm.controls.setor.valueChanges, { initialValue: '' });
  readonly filtroSituacaoVal = toSignal(this.filtroForm.controls.situacao.valueChanges, { initialValue: 'TODOS' });
  readonly filtroChefeSituacaoVal = toSignal(this.filtroForm.controls.chefeSituacao.valueChanges, { initialValue: 'TODOS' });
  readonly filtroChefeNomeVal = toSignal(this.filtroForm.controls.chefeNome.valueChanges, { initialValue: '' });
  readonly filtroAprovadorSituacaoVal = toSignal(this.filtroForm.controls.aprovadorSituacao.valueChanges, { initialValue: 'TODOS' });
  readonly filtroAprovadorNomeVal = toSignal(this.filtroForm.controls.aprovadorNome.valueChanges, { initialValue: '' });

  readonly situacaoOptions: readonly SOption<string>[] = [
    { value: 'TODOS', label: 'Todos' },
    { value: 'REGULAR', label: 'Regular' },
    { value: 'SUPRIDO', label: 'Suprido' },
    { value: 'DESCOBERTO', label: 'Descoberto' },
    { value: 'NECESSITA_TROCA', label: 'Necessita Troca' }
  ];

  readonly chefeSituacaoOptions: readonly SOption<string>[] = [
    { value: 'TODOS', label: 'Todos' },
    { value: 'COM_CHEFE_ATIVO', label: 'Com Chefe Ativo' },
    { value: 'COM_CHEFE_INATIVO', label: 'Com Chefe Inativo' },
    { value: 'SEM_CHEFE', label: 'Sem Chefe Definido' }
  ];

  readonly aprovadorSituacaoOptions: readonly SOption<string>[] = [
    { value: 'TODOS', label: 'Todos' },
    { value: 'COM_APROVADOR', label: 'Com Aprovador' },
    { value: 'SEM_APROVADOR', label: 'Sem Aprovador' }
  ];

  readonly tableColumns: readonly STableColumn<SetorHierarquia>[] = [
    { key: 'nome', label: 'Nome do Setor', sortable: true },
    { key: 'utbCodigo', label: 'Unidade de Trabalho' },
    { key: 'chefeImediato', label: 'Chefia Imediata' },
    { key: 'aprovadorVigente', label: 'Aprovador de Exceção' },
    { key: 'tipoEntidade', label: 'Tipo de Atuação' },
    { key: 'id', label: 'Situação', align: 'center' }
  ];

  readonly tableEmpty: STableEmpty = {
    title: 'Nenhum setor encontrado',
    description: 'Nenhum setor corresponde aos critérios de busca selecionados.'
  };

  readonly tableActions: readonly STableAction<SetorHierarquia>[] = [
    {
      id: 'visualizar',
      label: 'Visualizar',
      icon: 'visibility'
    },
    {
      id: 'configurar',
      label: (row: SetorHierarquia) => row.aprovadorVigente ? 'Editar aprovador de exceção' : 'Configurar aprovador de exceção',
      icon: 'edit'
    }
  ];

  readonly tableSort = signal<STableSort | null>({ key: 'nome', direction: 'asc' });

  asSetor(val: unknown): SetorHierarquia {
    return val as SetorHierarquia;
  }

  // Botão Buscar: habilitado quando pelo menos um filtro possuir valor diferente do padrão
  readonly canBuscar = computed(() => {
    const s = (this.filtroSetorVal() || '').trim();
    const sit = this.filtroSituacaoVal() || 'TODOS';
    const cSit = this.filtroChefeSituacaoVal() || 'TODOS';
    const cNome = (this.filtroChefeNomeVal() || '').trim();
    const aSit = this.filtroAprovadorSituacaoVal() || 'TODOS';
    const aNome = (this.filtroAprovadorNomeVal() || '').trim();

    return (
      s.length > 0 ||
      sit !== 'TODOS' ||
      cSit !== 'TODOS' ||
      cNome.length > 0 ||
      aSit !== 'TODOS' ||
      aNome.length > 0
    );
  });

  getSituacao(setor: SetorHierarquia): SituacaoSetor {
    return this.service.calcularSituacaoSetor(setor);
  }

  getChefeStatusInfo(chefe?: { matricula: string; nome: string }) {
    return this.service.getChefeStatusInfo(chefe);
  }

  // Filtragem e Ordenação
  readonly filteredSetores = computed(() => {
    let list = [...this.service.setores()];

    const qSetor = this.appliedSetor().toLowerCase();
    const qSit = this.appliedSituacao();
    const qChefeSit = this.appliedChefeSituacao();
    const qChefeNome = this.appliedChefeNome().toLowerCase();
    const qAprovSit = this.appliedAprovadorSituacao();
    const qAprovNome = this.appliedAprovadorNome().toLowerCase();

    // Filtro 1: Setor / UTB
    if (qSetor) {
      list = list.filter(s =>
        s.nome.toLowerCase().includes(qSetor) ||
        s.utbCodigo.toLowerCase().includes(qSetor) ||
        s.utbNome.toLowerCase().includes(qSetor)
      );
    }

    // Filtro 2: Situação
    if (qSit !== 'TODOS') {
      list = list.filter(s => this.service.calcularSituacaoSetor(s) === qSit);
    }

    // Filtro 3: Chefia Imediata (Situação)
    if (qChefeSit !== 'TODOS') {
      if (qChefeSit === 'COM_CHEFE_ATIVO') {
        list = list.filter(s => !!s.chefeImediato && this.service.isChefeAtivo(s.chefeImediato));
      } else if (qChefeSit === 'COM_CHEFE_INATIVO') {
        list = list.filter(s => !!s.chefeImediato && !this.service.isChefeAtivo(s.chefeImediato));
      } else if (qChefeSit === 'SEM_CHEFE') {
        list = list.filter(s => !s.chefeImediato);
      }
    }

    // Filtro 4: Chefia Imediata (Nome)
    if (qChefeNome) {
      list = list.filter(s => s.chefeImediato?.nome.toLowerCase().includes(qChefeNome));
    }

    // Filtro 5: Aprovador de Exceção (Situação)
    if (qAprovSit !== 'TODOS') {
      if (qAprovSit === 'COM_APROVADOR') {
        list = list.filter(s => !!s.aprovadorVigente && s.aprovadorVigente.situacao === 'ATIVO');
      } else if (qAprovSit === 'SEM_APROVADOR') {
        list = list.filter(s => !s.aprovadorVigente || s.aprovadorVigente.situacao !== 'ATIVO');
      }
    }

    // Filtro 6: Aprovador de Exceção (Nome)
    if (qAprovNome) {
      list = list.filter(s => s.aprovadorVigente?.nome.toLowerCase().includes(qAprovNome));
    }

    // Ordenação Alfabética por Nome do Setor
    const sort = this.tableSort();
    const dir = sort?.direction === 'desc' ? -1 : 1;
    list.sort((a, b) => dir * a.nome.localeCompare(b.nome, 'pt-BR'));

    return list;
  });

  readonly paginatedSetores = computed(() => {
    const list = this.filteredSetores();
    const start = this.pageIndex() * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  onSortChange(sort: STableSort | null) {
    this.tableSort.set(sort);
    if (sort) {
      this.sortDirection.set(sort.direction);
    }
    this.pageIndex.set(0);
  }

  onTableAction(event: STableActionEvent<SetorHierarquia>) {
    if (event.action === 'visualizar') {
      this.onVisualizar(event.row);
    } else if (event.action === 'configurar') {
      this.onConfigurar(event.row);
    }
  }

  onPageSizeChange(newSize: number) {
    this.pageSize.set(newSize);
    this.pageIndex.set(0);
  }

  onBuscar() {
    this.appliedSetor.set((this.filtroForm.get('setor')?.value || '').trim());
    this.appliedSituacao.set(this.filtroForm.get('situacao')?.value || 'TODOS');
    this.appliedChefeSituacao.set(this.filtroForm.get('chefeSituacao')?.value || 'TODOS');
    this.appliedChefeNome.set((this.filtroForm.get('chefeNome')?.value || '').trim());
    this.appliedAprovadorSituacao.set(this.filtroForm.get('aprovadorSituacao')?.value || 'TODOS');
    this.appliedAprovadorNome.set((this.filtroForm.get('aprovadorNome')?.value || '').trim());
    this.pageIndex.set(0);
  }

  onLimpar() {
    this.filtroForm.setValue({
      setor: '',
      situacao: 'TODOS',
      chefeSituacao: 'TODOS',
      chefeNome: '',
      aprovadorSituacao: 'TODOS',
      aprovadorNome: ''
    });
    this.appliedSetor.set('');
    this.appliedSituacao.set('TODOS');
    this.appliedChefeSituacao.set('TODOS');
    this.appliedChefeNome.set('');
    this.appliedAprovadorSituacao.set('TODOS');
    this.appliedAprovadorNome.set('');
    this.pageIndex.set(0);
  }

  onPageChange(newIndex: number) {
    this.pageIndex.set(newIndex);
  }

  onVisualizar(setor: SetorHierarquia) {
    this.router.navigate(['/configuracoes/hierarquia/excecao-hierarquia', setor.id]);
  }

  onConfigurar(setor: SetorHierarquia) {
    this.router.navigate(['/configuracoes/hierarquia/excecao-hierarquia', setor.id, 'configurar']);
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
// TELA 2: CONFIGURAR EXCEÇÃO DE HIERARQUIA
// ==========================================

export const excecaoHierarquiaFormDeactivateGuard: CanDeactivateFn<ExcecaoHierarquiaForm> = (
  component: ExcecaoHierarquiaForm
) => {
  return component.canDeactivate();
};

@Component({
  selector: 'app-excecao-hierarquia-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    ::ng-deep .mat-mdc-option:has(.servidor-sugestao) > .mdc-list-item__primary-text {
      flex: 1;
      min-width: 0;
    }
  `],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SPageHeaderComponent,
    SFieldComponent,
    SInputComponent,
    STextareaComponent,
    SAutocompleteComponent,
    SOptionTemplateDirective,
    SCheckboxComponent,
    SBadgeComponent,
    SButtonComponent,
    STableComponent,
    STableCellDirective,
    SIconComponent,
    STooltipDirective,
    AcessoRestritoComponent
  ],
  template: `
    @if (!permissionService.hasAccess()) {
      <app-acesso-restrito backUrl="/configuracoes/hierarquia/excecao-hierarquia" />
    } @else if (!setor()) {
      <div class="p-8 text-center text-siage-text-secondary">
        Carregando setor...
      </div>
    } @else {
      @let s = setor()!;
      <div class="flex flex-col gap-6 max-w-7xl mx-auto w-full font-sans pb-16">
        <!-- Cabeçalho Oficial SIAGE-UI -->
        <s-page-header
          [breadcrumbs]="breadcrumbs()"
          title="Configurar Exceção de Hierarquia"
          description="Defina o aprovador de exceção, tipo de atuação e portaria regulamentadora para o setor selecionado."
          showBack
          (back)="onCancelar()"
        />

        <!-- FORMULÁRIO EM CARDS -->
        <form [formGroup]="form" class="flex flex-col gap-6">

          <!-- ============================================== -->
          <!-- CARD 1: IDENTIFICAÇÃO DO SETOR (SOMENTE LEITURA) -->
          <!-- ============================================== -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div class="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 border-b border-siage-border/40 pb-2">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2">
                <s-icon name="domain" size="xs" />
                <span>1. Identificação do Setor</span>
              </h3>
              <div>
                @if (s.aprovadorVigente) {
                  <s-badge tone="info">Suprido por Exceção</s-badge>
                } @else {
                  <s-badge tone="secondary">Sem Exceção Cadastrada</s-badge>
                }
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 pt-1">
              <!-- Nome do Setor -->
              <div class="flex flex-col gap-1">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Nome do Setor</span>
                <span class="text-sm font-semibold text-siage-text-primary">{{ s.nome }}</span>
              </div>

              <!-- Código UTB -->
              <div class="flex flex-col gap-1">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Unidade de Trabalho (UTB)</span>
                <span class="text-sm font-mono font-medium text-siage-text-primary">{{ s.utbCodigo }}</span>
                <span class="text-xs text-siage-text-secondary">{{ s.utbNome }}</span>
              </div>

              <!-- Tipificação -->
              <div class="flex flex-col gap-1">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Tipificação</span>
                <div>
                  <s-badge tone="info">{{ s.tipoEntidade }}</s-badge>
                </div>
              </div>
            </div>
          </div>

          <!-- ============================================== -->
          <!-- CARD 2: APROVADOR DE EXCEÇÃO                    -->
          <!-- ============================================== -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <s-icon name="person" size="xs" />
              <span>2. Aprovador de Exceção</span>
            </h3>

            <div class="max-w-3xl">
              @if (selectedServidor()) {
                <!-- Campo Bloqueado com Servidor Atual + Botão Trocar Servidor ao lado -->
                <div class="flex items-start gap-3 w-full">
                  <s-field label="Buscar Servidor do Setor" class="flex-1">
                    <s-input [formControl]="servidorSelecionadoControl" />
                  </s-field>

                  <div class="pt-6">
                    <s-button
                      type="button"
                      (click)="trocarServidor()"
                      variant="secondary"
                      outlined
                      icon="sync"
                      sTooltip="Substituir servidor aprovador de exceção"
                    >
                      Trocar Servidor
                    </s-button>
                  </div>
                </div>
                <span class="text-xs text-siage-text-secondary mt-1 block">
                  Servidor aprovador de exceção atualmente designado para o setor.
                </span>
              } @else {
                <!-- Campo de Busca de Servidor Habilitado com Autocomplete -->
                <s-field
                  label="Buscar Servidor do Setor"
                  required
                  [error]="servidorAutocompleteControl.invalid && servidorAutocompleteControl.touched ? 'É obrigatório selecionar um servidor aprovador.' : null"
                >
                  <s-autocomplete
                    [options]="servidorOptions()"
                    placeholder="Digite o nome ou a matrícula do servidor"
                    (input)="onServidorInput($event)"
                    (selectionChange)="onServidorSelectionChange($event)"
                  >
                    <ng-template sOption [sOptionOf]="servidorOptions()" let-opcao>
                      @if (service.getServidor(opcao.value); as servidor) {
                        <div class="servidor-sugestao flex items-center justify-between gap-3 w-full py-2">
                          <div class="flex flex-col min-w-0 text-left">
                            <span class="text-sm font-semibold text-siage-text-primary">{{ servidor.nome }}</span>
                            <span class="text-xs text-siage-text-secondary">{{ servidor.cargo }} • Matrícula: {{ servidor.matricula }}</span>
                          </div>
                          <s-badge
                            [tone]="isElegivel(servidor) && !servidor.indisponibilidade ? 'success' : 'warning'"
                            [icon]="isElegivel(servidor) && !servidor.indisponibilidade ? '' : 'warning'"
                          >
                            {{ isElegivel(servidor) && !servidor.indisponibilidade ? 'Elegível' : 'Indisponível' }}
                          </s-badge>
                        </div>
                      }
                    </ng-template>
                  </s-autocomplete>
                </s-field>
                <span class="text-xs text-siage-text-secondary -mt-2 block">
                  Pesquise servidores ativos no SIAGE-RH em toda a estrutura do Estado.
                </span>
              }
            </div>
          </div>

          <!-- ============================================== -->
          <!-- CARD 3: CHECAGEM DE ELEGIBILIDADE REGIMENTAL   -->
          <!-- ============================================== -->
          @if (selectedServidor(); as serv) {
            @let elegivel = isElegivel(serv);
            <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
                <s-icon name="verified_user" size="xs" />
                <span>3. Checagem de Elegibilidade Regimental</span>
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Camada 1: Situação Funcional -->
                <div
                  class="border rounded-lg p-4 flex flex-col gap-2"
                  [class.border-emerald-500/30]="elegivel"
                  [class.bg-emerald-500/5]="elegivel"
                  [class.border-red-500/30]="!elegivel"
                  [class.bg-red-500/5]="!elegivel"
                >
                  <div class="flex items-center justify-between">
                    <span
                      class="text-xs font-bold uppercase tracking-wider"
                      [class.text-emerald-700]="elegivel"
                      [class.dark:text-emerald-400]="elegivel"
                      [class.text-red-700]="!elegivel"
                      [class.dark:text-red-400]="!elegivel"
                    >
                      Camada 1 — Situação Funcional
                    </span>
                    <s-icon
                      [name]="elegivel ? 'check_circle' : 'cancel'"
                      [color]="elegivel ? 'text-emerald-600' : 'text-red-600'"
                      size="sm"
                    />
                  </div>
                  <span class="text-sm font-semibold text-siage-text-primary">
                    {{ serv.situacaoFuncionalDescricao }}
                  </span>
                  <span class="text-xs text-siage-text-secondary leading-normal">
                    @if (elegivel) {
                      Servidor elegível para designação conforme as situações regimentais permitidas (10, 25, 31 ou 22).
                    } @else {
                      <strong class="text-red-600 dark:text-red-400">Impeditivo regimental:</strong> Servidores na situação {{ serv.situacaoFuncionalDescricao }} não podem ser designados como aprovadores de exceção.
                    }
                  </span>
                </div>

                <!-- Camada 2: Disponibilidade Operacional -->
                @let indisponivel = serv.indisponibilidade;
                <div
                  class="border rounded-lg p-4 flex flex-col gap-2"
                  [class.border-emerald-500/30]="!indisponivel"
                  [class.bg-emerald-500/5]="!indisponivel"
                  [class.border-amber-500/30]="indisponivel"
                  [class.bg-amber-500/5]="indisponivel"
                >
                  <div class="flex items-center justify-between">
                    <span
                      class="text-xs font-bold uppercase tracking-wider"
                      [class.text-emerald-700]="!indisponivel"
                      [class.dark:text-emerald-400]="!indisponivel"
                      [class.text-amber-700]="indisponivel"
                      [class.dark:text-amber-400]="indisponivel"
                    >
                      Camada 2 — Disponibilidade Operacional
                    </span>
                    <s-icon
                      [name]="!indisponivel ? 'check_circle' : 'warning'"
                      [color]="!indisponivel ? 'text-emerald-600' : 'text-amber-600'"
                      size="sm"
                    />
                  </div>

                  @if (!indisponivel) {
                    <span class="text-sm font-semibold text-siage-text-primary">
                      Disponível Operacionalmente
                    </span>
                    <span class="text-xs text-siage-text-secondary leading-normal">
                      Nenhum afastamento ou férias vigente registrado no histórico do servidor.
                    </span>
                  } @else {
                    <span class="text-sm font-semibold text-amber-700 dark:text-amber-400">
                      {{ indisponivel.tipo }} vigente
                    </span>
                    <span class="text-xs text-siage-text-secondary leading-normal">
                      Período: {{ indisponivel.dataInicio }} {{ indisponivel.dataTermino ? 'a ' + indisponivel.dataTermino : '(indeterminado)' }}.
                    </span>

                    <!-- Checkbox de Confirmação de Ciência obrigatório se indisponível -->
                    <div class="pt-2 mt-1 border-t border-amber-500/20">
                      <s-checkbox [formControl]="form.controls.cienteAlerta">
                        Confirmar designação ciente do alerta
                      </s-checkbox>
                      <span class="text-[11px] text-amber-700 dark:text-amber-400 block mt-1">
                        A situação do setor será classificada como "Necessita Troca" até a regularização do período.
                      </span>
                    </div>
                  }
                </div>
              </div>
            </div>
          }

          <!-- ============================================== -->
          <!-- CARD 4: TIPO DE ATUAÇÃO E JUSTIFICATIVA        -->
          <!-- ============================================== -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-5">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <s-icon name="tune" size="xs" />
              <span>4. Tipo de Atuação e Justificativa</span>
            </h3>

            <!-- Tipo de Atuação / Modalidade (Custom Cards) -->
            <div class="flex flex-col gap-2" role="group" aria-labelledby="label-modalidade">
              <span id="label-modalidade" class="text-xs font-semibold text-siage-text-secondary uppercase tracking-wider">
                Tipo de Atuação / Modalidade <span class="text-red-500">*</span>
              </span>

              <div class="flex flex-col gap-3">
                <label
                  class="border rounded-lg p-3.5 flex items-start gap-3 cursor-pointer transition-colors"
                  [class.border-siage-primary]="form.controls.modalidade.value === 'SOBREPOE_SEMPRE'"
                  [class.bg-siage-primary/5]="form.controls.modalidade.value === 'SOBREPOE_SEMPRE'"
                  [class.border-siage-border]="form.controls.modalidade.value !== 'SOBREPOE_SEMPRE'"
                >
                  <input
                    type="radio"
                    name="modalidade"
                    value="SOBREPOE_SEMPRE"
                    [formControl]="form.controls.modalidade"
                    class="mt-1 h-4 w-4 text-siage-primary border-siage-border focus:ring-siage-primary/40 cursor-pointer"
                  />
                  <div class="flex flex-col text-left">
                    <span class="text-sm font-semibold text-siage-text-primary">Sempre sobrepõe o chefe imediato</span>
                    <span class="text-xs text-siage-text-secondary leading-normal mt-0.5">
                      O aprovador recebe os fluxos de aprovação de férias, licenças e afastamentos do setor, independentemente da disponibilidade da chefia formal.
                    </span>
                  </div>
                </label>

                <label
                  class="border rounded-lg p-3.5 flex items-start gap-3 cursor-pointer transition-colors"
                  [class.border-siage-primary]="form.controls.modalidade.value === 'APENAS_INDISPONIVEL'"
                  [class.bg-siage-primary/5]="form.controls.modalidade.value === 'APENAS_INDISPONIVEL'"
                  [class.border-siage-border]="form.controls.modalidade.value !== 'APENAS_INDISPONIVEL'"
                >
                  <input
                    type="radio"
                    name="modalidade"
                    value="APENAS_INDISPONIVEL"
                    [formControl]="form.controls.modalidade"
                    class="mt-1 h-4 w-4 text-siage-primary border-siage-border focus:ring-siage-primary/40 cursor-pointer"
                  />
                  <div class="flex flex-col text-left">
                    <span class="text-sm font-semibold text-siage-text-primary">Atua somente quando indisponível ou não definido</span>
                    <span class="text-xs text-siage-text-secondary leading-normal mt-0.5">
                      O aprovador funciona como alternativa quando a chefia imediata estiver ausente, afastada, em férias ou ainda não cadastrada.
                    </span>
                  </div>
                </label>
              </div>

              @if (form.controls.modalidade.invalid && form.controls.modalidade.touched) {
                <span class="text-xs text-red-600 dark:text-red-400">O Tipo de Atuação é obrigatório.</span>
              }
            </div>

            <!-- Portaria Regulamentadora -->
            <div class="max-w-xl">
              <s-field label="Portaria Regulamentadora / Ato Oficial" controlId="form-portaria">
                <s-input
                  [formControl]="form.controls.portaria"
                  [maxlength]="100"
                  placeholder="Digite a Portaria Regulamentadora / Ato Oficial"
                />
              </s-field>
              <span class="text-xs text-siage-text-secondary -mt-2 block">
                Informe o número ou identificação do ato que autorizou a designação de exceção.
              </span>
            </div>

            <!-- Justificativa da Exceção Fundamentada -->
            <div>
              <s-field
                label="Justificativa da Exceção Fundamentada"
                controlId="form-justificativa"
                required
                showCharCounter
                [error]="getJustificativaError()"
              >
                <s-textarea
                  [formControl]="form.controls.justificativa"
                  [maxlength]="1000"
                  placeholder="Digite a Justificativa da Exceção Fundamentada"
                />
              </s-field>
            </div>
          </div>

          <!-- ============================================== -->
          <!-- RODAPÉ DE AÇÕES DO FORMULÁRIO                  -->
          <!-- ============================================== -->
          <div class="flex items-center justify-between pt-4 border-t border-siage-border/40">
            <div>
              @if (temAprovadorAtivo()) {
                <s-button
                  type="button"
                  variant="destructive"
                  outlined
                  icon="block"
                  (click)="onRevogarExcecao()"
                >
                  Revogar Exceção
                </s-button>
              }
            </div>

            <div class="flex items-center gap-3">
              <s-button
                type="button"
                variant="secondary"
                outlined
                (click)="onCancelar()"
              >
                Cancelar
              </s-button>

              <s-button
                type="button"
                variant="primary"
                [disabled]="isSaving() || !canSalvar()"
                [loading]="isSaving()"
                loadingText="Salvando..."
                [icon]="temAprovadorAtivo() ? 'check' : 'add'"
                [sTooltip]="!canSalvar() ? 'Preencha todos os campos obrigatórios e verifique a elegibilidade' : ''"
                (click)="onSalvar()"
              >
                {{ temAprovadorAtivo() ? 'Atualizar Aprovador' : 'Adicionar Aprovador' }}
              </s-button>
            </div>
          </div>
        </form>

        <!-- ============================================== -->
        <!-- CARD 5: HISTÓRICO DE APROVADORES DO SETOR       -->
        <!-- ============================================== -->
        <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4 mt-6">
          <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
            <s-icon name="history" size="xs" />
            <span>Histórico de Aprovadores do Setor</span>
          </h3>

          <s-table
            label="Histórico de Aprovadores do Setor"
            [columns]="historicoColumns"
            [rows]="s.historico"
            [actions]="historicoActions"
            [empty]="historicoEmpty"
            (actionClick)="onHistoricoAction($event)"
          >
            <ng-template sTableCell="servidorNome" let-reg>
              @let r = asHistorico(reg);
              <span class="block text-sm font-medium text-siage-text-primary">{{ r.servidorNome }}</span>
              <span class="text-xs text-siage-text-secondary">Matrícula: {{ r.servidorMatricula }}</span>
            </ng-template>

            <ng-template sTableCell="modalidade" let-reg>
              @let r = asHistorico(reg);
              <span class="text-xs text-siage-text-secondary">
                {{ r.modalidade === 'SOBREPOE_SEMPRE' ? 'Sempre sobrepõe o chefe' : 'Quando indisponível' }}
              </span>
            </ng-template>

            <ng-template sTableCell="portaria" let-reg>
              @let r = asHistorico(reg);
              <span class="text-xs text-siage-text-secondary">{{ r.portaria || '-' }}</span>
            </ng-template>

            <ng-template sTableCell="vigenciaFormatada" let-reg>
              @let r = asHistorico(reg);
              <span class="text-xs text-siage-text-secondary font-medium">{{ r.vigenciaFormatada }}</span>
            </ng-template>

            <ng-template sTableCell="situacao" let-reg>
              @let r = asHistorico(reg);
              @if (r.situacao === 'ATIVO') {
                <s-badge tone="success">Ativo</s-badge>
              } @else if (r.situacao === 'SUBSTITUIDO') {
                <s-badge tone="secondary">Substituído</s-badge>
              } @else {
                <s-badge tone="warning" icon="history">Encerrado</s-badge>
              }
            </ng-template>

            <ng-template sTableCell="modificadoPor" let-reg>
              @let r = asHistorico(reg);
              <span class="text-xs text-siage-text-secondary">{{ r.modificadoPor }}</span>
            </ng-template>

            <ng-template sTableCell="dataHoraModificacao" let-reg>
              @let r = asHistorico(reg);
              <span class="text-xs text-siage-text-secondary">{{ r.dataHoraModificacao }}</span>
            </ng-template>
          </s-table>
        </div>
      </div>
    }
  `
})
export class ExcecaoHierarquiaForm implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly service = inject(ExcecaoHierarquiaService);
  readonly permissionService = inject(PermissionService);
  private readonly modalService = inject(SModalService);
  private readonly toastService = inject(SToastService);

  readonly setorId = signal<string>('');
  readonly setor = computed(() => this.service.getSetor(this.setorId()));

  readonly selectedServidor = signal<ServidorSimulado | undefined>(undefined);
  readonly servidorBuscaTexto = signal('');
  readonly servidorAutocompleteControl = new FormControl<string | null>(null, [Validators.required]);
  readonly servidorSelecionadoControl = new FormControl({ value: '', disabled: true });
  readonly isSaving = signal(false);

  private initialSnapshotJson = '';
  isSavedSuccessfully = false;
  isDiscarded = false;

  readonly form = new FormGroup({
    modalidade: new FormControl<ModalidadeAtuacao | null>(null, [Validators.required]),
    portaria: new FormControl('', [Validators.maxLength(100)]),
    justificativa: new FormControl('', [Validators.required, (c) => {
      if (!c.value || !c.value.trim()) return { emptyWhitespace: true };
      return null;
    }]),
    cienteAlerta: new FormControl(false)
  });

  readonly breadcrumbs = computed<SBreadcrumb[]>(() => [
    { label: 'Início', routerLink: '/inicio' },
    { label: 'Configurações', routerLink: '/configuracoes' },
    { label: 'Hierarquia de Unidades e Cargos', routerLink: '/configuracoes/hierarquia' },
    { label: 'Exceção de Hierarquia', routerLink: '/configuracoes/hierarquia/excecao-hierarquia' },
    { label: 'Configurar' }
  ]);

  readonly temAprovadorAtivo = computed(() => {
    return !!this.setor()?.aprovadorVigente && this.setor()?.aprovadorVigente?.situacao === 'ATIVO';
  });

  readonly servidorOptions = computed<SAutocompleteOption<string>[]>(() => {
    const raw = this.servidorBuscaTexto().trim().toLowerCase();
    const list = this.service.getServidores();
    const filtered = !raw
      ? list.slice(0, 10)
      : list.filter(s =>
          s.nome.toLowerCase().includes(raw) ||
          s.matricula.includes(raw) ||
          s.cargo.toLowerCase().includes(raw)
        ).slice(0, 10);

    return filtered.map(serv => {
      const disponivel = this.isElegivel(serv) && !serv.indisponibilidade;
      const tag = disponivel ? 'Elegível' : 'Indisponível';
      return {
        label: `${serv.nome} — Matrícula: ${serv.matricula} (${serv.cargo}) • ${tag}`,
        value: serv.matricula
      };
    });
  });

  readonly historicoColumns: readonly STableColumn<RegistroHistoricoExcecao>[] = [
    { key: 'servidorNome', label: 'Aprovador' },
    { key: 'modalidade', label: 'Tipo de Atuação' },
    { key: 'portaria', label: 'Portaria' },
    { key: 'vigenciaFormatada', label: 'Vigência' },
    { key: 'situacao', label: 'Situação', align: 'center' },
    { key: 'modificadoPor', label: 'Modificado por' },
    { key: 'dataHoraModificacao', label: 'Data/Hora Modificação' }
  ];

  readonly historicoEmpty: STableEmpty = {
    title: 'Sem histórico registrado',
    description: 'Este setor não possui nenhum aprovador de exceção registrado em seu histórico.',
    actionLabel: ''
  };

  readonly historicoActions: readonly STableAction<RegistroHistoricoExcecao>[] = [
    {
      id: 'visualizar',
      label: 'Detalhes da exceção',
      icon: 'visibility'
    }
  ];

  asHistorico(val: unknown): RegistroHistoricoExcecao {
    return val as RegistroHistoricoExcecao;
  }

  isElegivel(servidor: ServidorSimulado): boolean {
    return this.service.isServidorElegivel(servidor);
  }

  getJustificativaError(): string | null {
    const c = this.form.controls.justificativa;
    if (!c.touched) return null;
    if (c.hasError('required')) return 'A Justificativa da Exceção é obrigatória.';
    if (c.hasError('emptyWhitespace')) return 'A justificativa não pode conter apenas espaços em branco.';
    return null;
  }

  canSalvar(): boolean {
    const serv = this.selectedServidor();
    if (!serv) return false;
    if (!this.isElegivel(serv)) return false;
    if (serv.indisponibilidade && !this.form.controls.cienteAlerta.value) return false;
    if (this.form.invalid) return false;
    return true;
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.toastService.error('Setor não informado.');
      this.router.navigate(['/configuracoes/hierarquia/excecao-hierarquia']);
      return;
    }

    this.setorId.set(id);
    const s = this.service.getSetor(id);
    if (!s) {
      this.toastService.error('Setor não encontrado.');
      this.router.navigate(['/configuracoes/hierarquia/excecao-hierarquia']);
      return;
    }

    // Se já tiver aprovador ativo: preenche os campos
    if (s.aprovadorVigente && s.aprovadorVigente.situacao === 'ATIVO') {
      const serv = this.service.getServidor(s.aprovadorVigente.matricula);
      if (serv) {
        this.selectedServidor.set(serv);
        this.servidorAutocompleteControl.setValue(serv.matricula);
        this.servidorSelecionadoControl.setValue(`${serv.nome} - Matrícula: ${serv.matricula} (${serv.cargo})`);
      }
      this.form.patchValue({
        modalidade: s.aprovadorVigente.modalidade,
        portaria: s.aprovadorVigente.portaria || '',
        justificativa: s.aprovadorVigente.justificativa,
        cienteAlerta: !!s.aprovadorVigente.cienteAlertaIndisponibilidade
      });
    } else {
      // Cadastro inicial padrão
      this.form.patchValue({
        modalidade: 'SOBREPOE_SEMPRE'
      });
    }

    this.initialSnapshotJson = this.getCurrentSnapshotJson();
  }

  onServidorInput(event: Event) {
    if (event.target instanceof HTMLInputElement) {
      this.servidorBuscaTexto.set(event.target.value);
    }
  }

  onServidorSelectionChange(selection: SAutocompleteSelection<string>) {
    if (selection && selection.value) {
      const serv = this.service.getServidor(selection.value);
      if (serv) {
        this.selectedServidor.set(serv);
        this.servidorAutocompleteControl.setValue(serv.matricula);
        this.servidorSelecionadoControl.setValue(`${serv.nome} - Matrícula: ${serv.matricula} (${serv.cargo})`);
      }
    }
  }

  trocarServidor() {
    from(this.modalService.confirm({
      title: 'Trocar Servidor?',
      description: 'Ao trocar o servidor selecionado, os dados específicos da designação (tipo de atuação, portaria e justificativa) serão limpos. Deseja continuar?',
      confirmLabel: 'Sim',
      cancelLabel: 'Não',
      variant: 'default'
    })).subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.selectedServidor.set(undefined);
        this.servidorAutocompleteControl.setValue(null);
        this.servidorBuscaTexto.set('');
        this.servidorSelecionadoControl.setValue('');
        this.form.controls.modalidade.setValue(null);
        this.form.controls.portaria.setValue('');
        this.form.controls.justificativa.setValue('');
        this.form.controls.cienteAlerta.setValue(false);
      }
    });
  }

  onSalvar() {
    if (!this.canSalvar()) {
      this.toastService.warning('Verifique os campos obrigatórios destacados no formulário.');
      return;
    }

    const serv = this.selectedServidor()!;
    const val = this.form.getRawValue();
    const atualizacao = this.temAprovadorAtivo();

    this.isSaving.set(true);

    setTimeout(() => {
      this.service.salvarDesignacao(this.setorId(), {
        matricula: serv.matricula,
        modalidade: val.modalidade || 'SOBREPOE_SEMPRE',
        portaria: (val.portaria || '').trim() || undefined,
        justificativa: (val.justificativa || '').trim(),
        cienteAlertaIndisponibilidade: !!val.cienteAlerta
      });

      this.isSavedSuccessfully = true;
      this.isSaving.set(false);
      this.toastService.success(atualizacao ? 'Aprovador de exceção atualizado com sucesso.' : 'Aprovador de exceção designado com sucesso.');
      this.router.navigate(['/configuracoes/hierarquia/excecao-hierarquia']);
    }, 150);
  }

  onRevogarExcecao() {
    const s = this.setor();
    if (!s || !s.aprovadorVigente) return;

    from(this.modalService.confirm({
      title: 'Revogar Exceção de Hierarquia?',
      description: `Deseja encerrar a designação de ${s.aprovadorVigente.nome} como aprovador de exceção para o setor ${s.nome}? O registro será arquivado no histórico.`,
      confirmLabel: 'Sim, revogar',
      cancelLabel: 'Cancelar',
      variant: 'destructive'
    })).subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.service.revogarExcecao(s.id);
        this.isSavedSuccessfully = true;
        this.toastService.success('Exceção de hierarquia revogada com sucesso.');
        this.router.navigate(['/configuracoes/hierarquia/excecao-hierarquia']);
      }
    });
  }

  onHistoricoAction(event: STableActionEvent<RegistroHistoricoExcecao>) {
    if (event.action === 'visualizar') {
      this.abrirDetalhesRegistro(event.row);
    }
  }

  abrirDetalhesRegistro(reg: RegistroHistoricoExcecao) {
    this.modalService.open(DetalhesExcecaoModal, {
      data: { registro: reg },
      width: '600px'
    });
  }

  private getCurrentSnapshotJson(): string {
    return JSON.stringify({
      matricula: this.selectedServidor()?.matricula || '',
      modalidade: this.form.controls.modalidade.value,
      portaria: (this.form.controls.portaria.value || '').trim(),
      justificativa: (this.form.controls.justificativa.value || '').trim(),
      ciente: this.form.controls.cienteAlerta.value
    });
  }

  hasPendingChanges(): boolean {
    if (this.isSavedSuccessfully || this.isDiscarded) return false;
    return this.getCurrentSnapshotJson() !== this.initialSnapshotJson;
  }

  canDeactivate(): Promise<boolean> | boolean {
    if (!this.hasPendingChanges()) return true;
    return this.confirmarCancelamento();
  }

  private confirmarCancelamento(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      from(this.modalService.confirm({
        title: 'Tem certeza que deseja cancelar?',
        description: 'As alterações não salvas serão perdidas.',
        confirmLabel: 'Sim, cancelar',
        cancelLabel: 'Não',
        variant: 'default'
      })).subscribe((confirmado: boolean) => {
        if (confirmado) {
          this.isDiscarded = true;
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

  async onCancelar() {
    if (!this.hasPendingChanges()) {
      this.router.navigate(['/configuracoes/hierarquia/excecao-hierarquia']);
      return;
    }
    const confirmado = await this.confirmarCancelamento();
    if (confirmado) {
      this.router.navigate(['/configuracoes/hierarquia/excecao-hierarquia']);
    }
  }

  async goHome() {
    if (!this.hasPendingChanges()) {
      this.router.navigate(['/inicio']);
      return;
    }
    const confirmado = await this.confirmarCancelamento();
    if (confirmado) {
      this.router.navigate(['/inicio']);
    }
  }

  async goConfiguracoes() {
    if (!this.hasPendingChanges()) {
      this.router.navigate(['/configuracoes']);
      return;
    }
    const confirmado = await this.confirmarCancelamento();
    if (confirmado) {
      this.router.navigate(['/configuracoes']);
    }
  }

  goHierarquia() {
    this.onCancelar();
  }
}

// ==========================================
// TELA 3: VISUALIZAR EXCEÇÃO DE HIERARQUIA
// ==========================================

@Component({
  selector: 'app-excecao-hierarquia-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SPageHeaderComponent,
    SBadgeComponent,
    SButtonComponent,
    STableComponent,
    STableCellDirective,
    SIconComponent,
    STooltipDirective,
    AcessoRestritoComponent
  ],
  template: `
    @if (!permissionService.hasAccess()) {
      <app-acesso-restrito backUrl="/configuracoes/hierarquia/excecao-hierarquia" />
    } @else if (!setor()) {
      <div class="p-8 text-center text-siage-text-secondary">
        Carregando setor...
      </div>
    } @else {
      @let s = setor()!;
      <div class="flex flex-col gap-6 max-w-7xl mx-auto w-full font-sans pb-16">
        <!-- Cabeçalho Oficial SIAGE-UI -->
        <s-page-header
          [breadcrumbs]="breadcrumbs"
          title="Visualizar Exceção de Hierarquia"
          description="Consulte as informações do setor, chefia imediata, aprovador de exceção designado e o histórico de alterações."
          showBack
          (back)="goListagem()"
        >
          @if (permissionService.canCreate()) {
            <s-button action variant="primary" icon="edit" (click)="onEditar()">
              {{ s.aprovadorVigente ? 'Editar Aprovador' : 'Configurar Exceção' }}
            </s-button>
          }
        </s-page-header>

        <!-- CARDS DE VISUALIZAÇÃO -->
        <div class="flex flex-col gap-6">

          <!-- CARD 1: IDENTIFICAÇÃO DO SETOR -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div class="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 border-b border-siage-border/40 pb-2">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2">
                <s-icon name="domain" size="xs" />
                <span>1. Identificação do Setor</span>
              </h3>
              <div>
                @if (s.aprovadorVigente) {
                  <s-badge tone="info">Suprido por Exceção</s-badge>
                } @else {
                  <s-badge tone="secondary">Sem Exceção Cadastrada</s-badge>
                }
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 pt-1">
              <div class="flex flex-col gap-1">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Nome do Setor</span>
                <span class="text-sm font-semibold text-siage-text-primary">{{ s.nome }}</span>
              </div>

              <div class="flex flex-col gap-1">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Unidade de Trabalho (UTB)</span>
                <span class="text-sm font-mono font-medium text-siage-text-primary">{{ s.utbCodigo }}</span>
                <span class="text-xs text-siage-text-secondary">{{ s.utbNome }}</span>
              </div>

              <div class="flex flex-col gap-1">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Tipificação</span>
                <div>
                  <s-badge tone="info">{{ s.tipoEntidade }}</s-badge>
                </div>
              </div>
            </div>
          </div>

          <!-- CARD 2: CHEFIA IMEDIATA FORMAL -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <s-icon name="badge" size="xs" />
              <span>2. Chefia Imediata Atual</span>
            </h3>

            @if (s.chefeImediato; as chefe) {
              @let chefeInfo = getChefeStatusInfo(chefe);
              <div class="border border-siage-border rounded-lg p-4 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-siage-primary/10 text-siage-primary flex items-center justify-center font-bold font-poppins shrink-0">
                    {{ chefe.nome.charAt(0) }}
                  </div>
                  <div class="flex flex-col">
                    <span class="text-sm font-semibold text-siage-text-primary">{{ chefe.nome }}</span>
                    <span class="text-xs text-siage-text-secondary">{{ chefe.cargo }} • Matrícula: {{ chefe.matricula }}</span>
                  </div>
                </div>
                <div>
                  @if (chefeInfo.status === 'ATIVO') {
                    <s-badge tone="success">Ativo</s-badge>
                  } @else {
                    <s-badge tone="secondary" icon="warning" [sTooltip]="chefeInfo.detalhe ? 'Motivo: ' + chefeInfo.detalhe : 'Chefia inativa'">
                      Inativo{{ chefeInfo.detalhe ? ' — ' + chefeInfo.detalhe : '' }}
                    </s-badge>
                  }
                </div>
              </div>
            } @else {
              <div class="py-6 text-center text-xs text-siage-text-secondary border border-dashed border-siage-border rounded-lg">
                Nenhum chefe imediato cadastrado para este setor no momento.
              </div>
            }
          </div>

          <!-- CARD 3: APROVADOR DE EXCEÇÃO VIGENTE -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <s-icon name="verified_user" size="xs" />
              <span>3. Aprovador de Exceção Vigente</span>
            </h3>

            @if (s.aprovadorVigente; as ap) {
              @let serv = getServidor(ap.matricula);
              @let elegivel = serv ? isElegivel(serv) : true;
              @let indisponivel = serv?.indisponibilidade;
              <div class="border border-siage-border rounded-lg p-5 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col gap-4">
                <!-- Identificação do Aprovador -->
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-full bg-siage-primary/10 text-siage-primary flex items-center justify-center font-bold font-poppins text-lg shrink-0">
                    {{ ap.nome.charAt(0) }}
                  </div>
                  <div class="flex flex-col">
                    <span class="text-base font-semibold text-siage-text-primary">{{ ap.nome }}</span>
                    <span class="text-xs text-siage-text-secondary">{{ ap.cargo }} • Matrícula: {{ ap.matricula }}</span>
                    <span class="text-xs text-siage-text-secondary mt-0.5">Vigência: {{ ap.vigenciaFormatada }}</span>
                  </div>
                </div>

                <!-- Camadas de Elegibilidade Regimental -->
                @if (serv) {
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <!-- Camada 1: Situação Funcional -->
                    <div
                      class="border rounded-lg p-4 flex flex-col gap-2"
                      [class.border-emerald-500/30]="elegivel"
                      [class.bg-emerald-500/5]="elegivel"
                      [class.border-red-500/30]="!elegivel"
                      [class.bg-red-500/5]="!elegivel"
                    >
                      <div class="flex items-center justify-between">
                        <span
                          class="text-xs font-bold uppercase tracking-wider"
                          [class.text-emerald-700]="elegivel"
                          [class.dark:text-emerald-400]="elegivel"
                          [class.text-red-700]="!elegivel"
                          [class.dark:text-red-400]="!elegivel"
                        >
                          Camada 1 — Situação Funcional
                        </span>
                        <s-icon
                          [name]="elegivel ? 'check_circle' : 'cancel'"
                          [color]="elegivel ? 'text-emerald-600' : 'text-red-600'"
                          size="sm"
                        />
                      </div>
                      <span class="text-sm font-semibold text-siage-text-primary">
                        {{ serv.situacaoFuncionalDescricao }}
                      </span>
                      <span class="text-xs text-siage-text-secondary leading-normal">
                        @if (elegivel) {
                          Servidor elegível para designação conforme as situações regimentais permitidas (10, 25, 31 ou 22).
                        } @else {
                          <strong class="text-red-600 dark:text-red-400">Impeditivo regimental:</strong> Servidores na situação {{ serv.situacaoFuncionalDescricao }} não podem ser designados como aprovadores de exceção.
                        }
                      </span>
                    </div>

                    <!-- Camada 2: Disponibilidade Operacional -->
                    <div
                      class="border rounded-lg p-4 flex flex-col gap-2"
                      [class.border-emerald-500/30]="!indisponivel"
                      [class.bg-emerald-500/5]="!indisponivel"
                      [class.border-amber-500/30]="indisponivel"
                      [class.bg-amber-500/5]="indisponivel"
                    >
                      <div class="flex items-center justify-between">
                        <span
                          class="text-xs font-bold uppercase tracking-wider"
                          [class.text-emerald-700]="!indisponivel"
                          [class.dark:text-emerald-400]="!indisponivel"
                          [class.text-amber-700]="indisponivel"
                          [class.dark:text-amber-400]="indisponivel"
                        >
                          Camada 2 — Disponibilidade Operacional
                        </span>
                        <s-icon
                          [name]="!indisponivel ? 'check_circle' : 'warning'"
                          [color]="!indisponivel ? 'text-emerald-600' : 'text-amber-600'"
                          size="sm"
                        />
                      </div>

                      @if (!indisponivel) {
                        <span class="text-sm font-semibold text-siage-text-primary">
                          Disponível Operacionalmente
                        </span>
                        <span class="text-xs text-siage-text-secondary leading-normal">
                          Nenhum afastamento ou férias vigente registrado no histórico do servidor.
                        </span>
                      } @else {
                        <span class="text-sm font-semibold text-amber-700 dark:text-amber-400">
                          {{ indisponivel.tipo }} vigente
                        </span>
                        <span class="text-xs text-siage-text-secondary leading-normal">
                          Período: {{ indisponivel.dataInicio }} {{ indisponivel.dataTermino ? 'a ' + indisponivel.dataTermino : '(indeterminado)' }}.
                        </span>

                        <div class="pt-2 mt-1 border-t border-amber-500/20 flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300">
                          <s-icon name="info" color="text-amber-600" size="xs" />
                          <span>
                            @if (ap.cienteAlertaIndisponibilidade) {
                              Ciência de indisponibilidade operacional registrada na designação.
                            } @else {
                              Designação efetuada sob ciência de alerta operacional.
                            }
                          </span>
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- Dados da Configuração (Tipo de Atuação e Portaria) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-siage-border/40">
                  <div class="flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Tipo de Atuação</span>
                    <span class="text-sm font-medium text-siage-text-primary">
                      {{ ap.modalidade === 'SOBREPOE_SEMPRE' ? 'Sempre sobrepõe o chefe imediato' : 'Atua somente quando indisponível ou não definido' }}
                    </span>
                  </div>

                  <div class="flex flex-col gap-1">
                    <span class="text-xs uppercase text-siage-text-secondary font-semibold">Portaria Regulamentadora</span>
                    <span class="text-sm font-medium text-siage-text-primary">{{ ap.portaria || 'Não informada' }}</span>
                  </div>
                </div>

                <!-- Justificativa da Exceção Fundamentada -->
                <div class="flex flex-col gap-1 pt-2 border-t border-siage-border/40">
                  <span class="text-xs uppercase text-siage-text-secondary font-semibold">Justificativa da Exceção Fundamentada</span>
                  <p class="text-xs sm:text-sm text-siage-text-primary bg-siage-surface p-3 rounded-lg border border-siage-border whitespace-pre-wrap leading-relaxed">
                    {{ ap.justificativa }}
                  </p>
                </div>

                <!-- Auditoria -->
                <div class="pt-3 border-t border-siage-border/40 text-xs text-siage-text-secondary flex items-center gap-1.5">
                  <s-icon name="history" size="xs" color="text-siage-text-secondary/70" />
                  <span>Última atualização por <strong class="font-medium text-siage-text-primary">{{ ap.modificadoPor }}</strong> em {{ ap.dataHoraModificacao }}.</span>
                </div>
              </div>
            } @else {
              <div class="py-6 text-center text-xs text-siage-text-secondary border border-dashed border-siage-border rounded-lg flex flex-col items-center justify-center gap-2">
                <span>Nenhum aprovador de exceção configurado para este setor.</span>
                <span class="text-[11px] text-siage-text-secondary/70">Utilize a ação "Configurar Exceção" para designar um aprovador.</span>
              </div>
            }
          </div>

          <!-- CARD 4: HISTÓRICO DE APROVADORES DO SETOR -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <s-icon name="history" size="xs" />
              <span>4. Histórico de Aprovadores do Setor</span>
            </h3>

            <s-table
              label="Histórico de Aprovadores do Setor"
              [columns]="historicoColumns"
              [rows]="s.historico"
              [actions]="historicoActions"
              [empty]="historicoEmpty"
              (actionClick)="onHistoricoAction($event)"
            >
              <ng-template sTableCell="servidorNome" let-reg>
                @let r = asHistorico(reg);
                <span class="block text-sm font-medium text-siage-text-primary">{{ r.servidorNome }}</span>
                <span class="text-xs text-siage-text-secondary">Matrícula: {{ r.servidorMatricula }}</span>
              </ng-template>

              <ng-template sTableCell="modalidade" let-reg>
                @let r = asHistorico(reg);
                <span class="text-xs text-siage-text-secondary">
                  {{ r.modalidade === 'SOBREPOE_SEMPRE' ? 'Sempre sobrepõe o chefe' : 'Quando indisponível' }}
                </span>
              </ng-template>

              <ng-template sTableCell="portaria" let-reg>
                @let r = asHistorico(reg);
                <span class="text-xs text-siage-text-secondary">{{ r.portaria || '-' }}</span>
              </ng-template>

              <ng-template sTableCell="vigenciaFormatada" let-reg>
                @let r = asHistorico(reg);
                <span class="text-xs text-siage-text-secondary font-medium">{{ r.vigenciaFormatada }}</span>
              </ng-template>

              <ng-template sTableCell="situacao" let-reg>
                @let r = asHistorico(reg);
                @if (r.situacao === 'ATIVO') {
                  <s-badge tone="success">Ativo</s-badge>
                } @else if (r.situacao === 'SUBSTITUIDO') {
                  <s-badge tone="secondary">Substituído</s-badge>
                } @else {
                  <s-badge tone="warning" icon="history">Encerrado</s-badge>
                }
              </ng-template>

              <ng-template sTableCell="modificadoPor" let-reg>
                @let r = asHistorico(reg);
                <span class="text-xs text-siage-text-secondary">{{ r.modificadoPor }}</span>
              </ng-template>

              <ng-template sTableCell="dataHoraModificacao" let-reg>
                @let r = asHistorico(reg);
                <span class="text-xs text-siage-text-secondary">{{ r.dataHoraModificacao }}</span>
              </ng-template>
            </s-table>
          </div>
        </div>
      </div>
    }
  `
})
export class ExcecaoHierarquiaView implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly service = inject(ExcecaoHierarquiaService);
  readonly permissionService = inject(PermissionService);
  private readonly modalService = inject(SModalService);
  private readonly toastService = inject(SToastService);

  readonly setorId = signal<string>('');
  readonly setor = computed(() => this.service.getSetor(this.setorId()));

  readonly breadcrumbs: readonly SBreadcrumb[] = [
    { label: 'Início', routerLink: '/inicio' },
    { label: 'Configurações', routerLink: '/configuracoes' },
    { label: 'Hierarquia de Unidades e Cargos', routerLink: '/configuracoes/hierarquia' },
    { label: 'Exceção de Hierarquia', routerLink: '/configuracoes/hierarquia/excecao-hierarquia' },
    { label: 'Visualizar' }
  ];

  readonly historicoColumns: readonly STableColumn<RegistroHistoricoExcecao>[] = [
    { key: 'servidorNome', label: 'Aprovador' },
    { key: 'modalidade', label: 'Tipo de Atuação' },
    { key: 'portaria', label: 'Portaria' },
    { key: 'vigenciaFormatada', label: 'Vigência' },
    { key: 'situacao', label: 'Situação', align: 'center' },
    { key: 'modificadoPor', label: 'Modificado por' },
    { key: 'dataHoraModificacao', label: 'Data/Hora Modificação' }
  ];

  readonly historicoEmpty: STableEmpty = {
    title: 'Sem histórico registrado',
    description: 'Este setor não possui nenhum aprovador de exceção registrado em seu histórico.',
    actionLabel: ''
  };

  readonly historicoActions: readonly STableAction<RegistroHistoricoExcecao>[] = [
    {
      id: 'visualizar',
      label: 'Detalhes da exceção',
      icon: 'visibility'
    }
  ];

  asHistorico(val: unknown): RegistroHistoricoExcecao {
    return val as RegistroHistoricoExcecao;
  }

  getSituacao(setor: SetorHierarquia): SituacaoSetor {
    return this.service.calcularSituacaoSetor(setor);
  }

  getServidor(matricula: string): ServidorSimulado | undefined {
    return this.service.getServidor(matricula);
  }

  isElegivel(servidor: ServidorSimulado): boolean {
    return this.service.isServidorElegivel(servidor);
  }

  getChefeStatusInfo(chefe?: { matricula: string; nome: string }) {
    return this.service.getChefeStatusInfo(chefe);
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.toastService.error('Setor não informado.');
      this.router.navigate(['/configuracoes/hierarquia/excecao-hierarquia']);
      return;
    }
    this.setorId.set(id);
    const s = this.service.getSetor(id);
    if (!s) {
      this.toastService.error('Setor não encontrado.');
      this.router.navigate(['/configuracoes/hierarquia/excecao-hierarquia']);
      return;
    }
  }

  onHistoricoAction(event: STableActionEvent<RegistroHistoricoExcecao>) {
    if (event.action === 'visualizar') {
      this.abrirDetalhesRegistro(event.row);
    }
  }

  abrirDetalhesRegistro(reg: RegistroHistoricoExcecao) {
    this.modalService.open(DetalhesExcecaoModal, {
      data: { registro: reg },
      width: '600px'
    });
  }

  onEditar() {
    const s = this.setor();
    if (s) {
      this.router.navigate(['/configuracoes/hierarquia/excecao-hierarquia', s.id, 'configurar']);
    }
  }

  goListagem() {
    this.router.navigate(['/configuracoes/hierarquia/excecao-hierarquia']);
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

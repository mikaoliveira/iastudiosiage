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

import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatTableModule} from '@angular/material/table';
import {MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSelectModule} from '@angular/material/select';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatRadioModule} from '@angular/material/radio';
import {MatCheckboxModule} from '@angular/material/checkbox';

import {SiagePaginatorComponent} from './siage-paginator';
import {ConfirmacaoDialog, ModalService} from './dialog';
import {ToastService} from './toast';
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
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule],
  template: `
    <div 
      class="relative w-[calc(100vw-2rem)] sm:w-[600px] max-w-full bg-siage-surface text-siage-text-primary rounded-lg border border-siage-border shadow-[var(--mat-sys-level3)] font-sans flex flex-col text-left box-border max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:w-full max-sm:rounded-b-none max-sm:rounded-t-2xl"
      role="dialog"
      aria-labelledby="detalhes-excecao-title"
    >
      <!-- Cabeçalho -->
      <div class="flex items-center justify-between px-5 pt-5 pb-3 border-b border-siage-border/40 shrink-0">
        <h2 id="detalhes-excecao-title" class="text-base sm:text-lg font-poppins font-bold text-siage-text-primary tracking-tight leading-snug truncate pr-3 text-left">
          Detalhes do Registro de Exceção
        </h2>
        <button 
          type="button" 
          (click)="fechar()" 
          class="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg flex items-center justify-center text-siage-text-secondary hover:text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
          title="Fechar"
          aria-label="Fechar modal"
        >
          <mat-icon style="font-size: 18px; width: 18px; height: 18px;">close</mat-icon>
        </button>
      </div>

      <!-- Conteúdo com dados completos e auditoria -->
      <div class="px-5 py-4 overflow-y-auto max-h-[70vh] flex flex-col gap-4 font-sans text-left">
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
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Ativo
                </span>
              } @else if (data.registro.situacao === 'SUBSTITUIDO') {
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
                  Substituído
                </span>
              } @else {
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  Encerrado
                </span>
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

      <!-- Rodapé -->
      <div class="flex items-center justify-end px-5 py-3.5 border-t border-siage-border/40 shrink-0 bg-siage-surface">
        <button 
          type="button" 
          (click)="fechar()" 
          class="h-10 px-5 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
        >
          Fechar
        </button>
      </div>
    </div>
  `
})
export class DetalhesExcecaoModal {
  readonly dialogRef = inject(MatDialogRef<DetalhesExcecaoModal>);
  readonly data = inject<{registro: RegistroHistoricoExcecao}>(MAT_DIALOG_DATA);

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
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatTooltipModule,
    MatSelectModule,
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
          <!-- Breadcrumb: Início > Configurações > Hierarquia de Unidades e Cargos > Exceção de Hierarquia -->
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
            <span class="text-siage-primary font-semibold" aria-current="page">Exceção de Hierarquia</span>
          </nav>

          <!-- Título com Botão Voltar e Descrição (Sem botão Adicionar) -->
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
                  Exceção de Hierarquia
                </h1>
              </div>

              <p class="text-xs sm:text-sm text-siage-text-secondary font-sans leading-normal pl-8 sm:pl-9 max-w-3xl">
                Designação de aprovadores de exceção para fluxos de aprovação quando houver necessidade de sobreposição ou ausência da chefia imediata formal.
              </p>
            </div>
          </div>
        </div>

        <!-- Card de Filtros (Padrão exato da Gerência Regional com grid responsivo de campos) -->
        <div class="bg-siage-surface border border-siage-border rounded-lg p-5 shadow-xs flex flex-col gap-4">
          <form [formGroup]="filtroForm" (ngSubmit)="onBuscar()" class="flex flex-col gap-4">
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              
              <!-- Filtro 1: Unidade de Trabalho / Setor (input de texto simples) -->
              <div class="form-field-group">
                <label for="filter-setor" class="siage-field-label">Unidade de Trabalho / Setor</label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="filter-setor"
                    type="text" 
                    formControlName="setor" 
                    placeholder="Buscar por nome ou código UTB" 
                    (keydown.enter)="$event.preventDefault(); canBuscar() && onBuscar()"
                    class="text-sm"
                  />
                  @if (filtroSetorVal()) {
                    <button mat-icon-button matSuffix type="button" (click)="filtroForm.get('setor')?.setValue('')" aria-label="Limpar campo">
                      <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                    </button>
                  }
                </mat-form-field>
              </div>

              <!-- Filtro 2: Situação (Todos, Regular, Suprido, Descoberto, Necessita Troca) -->
              <div class="form-field-group">
                <label for="filter-situacao" class="siage-field-label">Situação</label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <mat-select id="filter-situacao" formControlName="situacao">
                    <mat-option value="TODOS">Todos</mat-option>
                    <mat-option value="REGULAR">Regular</mat-option>
                    <mat-option value="SUPRIDO">Suprido</mat-option>
                    <mat-option value="DESCOBERTO">Descoberto</mat-option>
                    <mat-option value="NECESSITA_TROCA">Necessita Troca</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <!-- Filtro 3: Chefia Imediata (Situação) -->
              <div class="form-field-group">
                <label for="filter-chefe-sit" class="siage-field-label">Chefia Imediata (Situação)</label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <mat-select id="filter-chefe-sit" formControlName="chefeSituacao">
                    <mat-option value="TODOS">Todos</mat-option>
                    <mat-option value="COM_CHEFE_ATIVO">Com Chefe Ativo</mat-option>
                    <mat-option value="COM_CHEFE_INATIVO">Com Chefe Inativo</mat-option>
                    <mat-option value="SEM_CHEFE">Sem Chefe Definido</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <!-- Filtro 4: Chefia Imediata (Nome) (input de texto simples) -->
              <div class="form-field-group">
                <label for="filter-chefe-nome" class="siage-field-label">Chefia Imediata (Nome)</label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="filter-chefe-nome"
                    type="text" 
                    formControlName="chefeNome" 
                    placeholder="Buscar nome do chefe" 
                    (keydown.enter)="$event.preventDefault(); canBuscar() && onBuscar()"
                    class="text-sm"
                  />
                  @if (filtroChefeNomeVal()) {
                    <button mat-icon-button matSuffix type="button" (click)="filtroForm.get('chefeNome')?.setValue('')" aria-label="Limpar campo">
                      <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                    </button>
                  }
                </mat-form-field>
              </div>

              <!-- Filtro 5: Aprovador de Exceção (Situação) -->
              <div class="form-field-group">
                <label for="filter-aprov-sit" class="siage-field-label">Aprovador de Exceção (Situação)</label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <mat-select id="filter-aprov-sit" formControlName="aprovadorSituacao">
                    <mat-option value="TODOS">Todos</mat-option>
                    <mat-option value="COM_APROVADOR">Com Aprovador</mat-option>
                    <mat-option value="SEM_APROVADOR">Sem Aprovador</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <!-- Filtro 6: Aprovador de Exceção (Nome) (input de texto simples) -->
              <div class="form-field-group">
                <label for="filter-aprov-nome" class="siage-field-label">Aprovador de Exceção (Nome)</label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="filter-aprov-nome"
                    type="text" 
                    formControlName="aprovadorNome" 
                    placeholder="Buscar nome do aprovador" 
                    (keydown.enter)="$event.preventDefault(); canBuscar() && onBuscar()"
                    class="text-sm"
                  />
                  @if (filtroAprovadorNomeVal()) {
                    <button mat-icon-button matSuffix type="button" (click)="filtroForm.get('aprovadorNome')?.setValue('')" aria-label="Limpar campo">
                      <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                    </button>
                  }
                </mat-form-field>
              </div>

            </div>

            <!-- Botões Limpar e Buscar alinhados à direita -->
            <div class="flex items-center justify-end gap-3 pt-3 border-t border-siage-border/40">
              <button 
                type="button" 
                (click)="onLimpar()" 
                class="h-10 px-5 rounded-lg border border-siage-border font-sans font-medium text-sm text-siage-text-primary hover:bg-siage-primary/5 hover:border-siage-primary/30 active:scale-[0.99] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
              >
                Limpar
              </button>

              <button 
                type="submit" 
                [disabled]="!canBuscar()"
                [matTooltip]="!canBuscar() ? 'Informe ao menos um critério para realizar a busca' : 'Executar busca'"
                class="inline-flex items-center justify-center gap-1.5 h-10 px-6 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-siage-primary"
              >
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">search</mat-icon>
                <span>Buscar</span>
              </button>
            </div>

          </form>
        </div>

        <!-- Tabela de Setores e Exceções -->
        <div class="border border-siage-border rounded-lg overflow-hidden bg-siage-surface shadow-xs">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-100/70 dark:bg-slate-800/50 border-b border-siage-border text-siage-text-secondary font-semibold">
                  <th class="p-3.5">
                    <button 
                      type="button" 
                      (click)="toggleSort()" 
                      class="inline-flex items-center gap-1.5 hover:text-siage-primary transition-colors cursor-pointer group"
                    >
                      <span>Nome do Setor</span>
                      <mat-icon style="font-size: 16px; width: 16px; height: 16px;">
                        {{ sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                      </mat-icon>
                    </button>
                  </th>
                  <th class="p-3.5">Unidade de Trabalho</th>
                  <th class="p-3.5">Chefia Imediata</th>
                  <th class="p-3.5">Aprovador de Exceção</th>
                  <th class="p-3.5">Tipo de Atuação</th>
                  <th class="p-3.5 whitespace-nowrap">Situação</th>
                  <th class="p-3.5 text-right w-[110px]">Ações</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-siage-border/40">
                @for (setor of paginatedSetores(); track setor.id) {
                  @let situacao = getSituacao(setor);
                  <tr class="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <!-- 1. Nome do Setor e Tipificação -->
                    <td class="p-3.5">
                      <span class="text-[10px] font-bold text-siage-primary uppercase tracking-wider block">
                        {{ setor.tipoEntidade }}
                      </span>
                      <span class="text-sm font-semibold text-siage-text-primary block mt-0.5">
                        {{ setor.nome }}
                      </span>
                    </td>

                    <!-- 2. Unidade de Trabalho (estritamente o código UTB) -->
                    <td class="p-3.5 text-xs">
                      <span class="font-mono font-medium text-siage-text-primary">{{ setor.utbCodigo }}</span>
                    </td>

                    <!-- 3. Chefia Imediata (com distinção ativa/inativa/sem chefe) -->
                    <td class="p-3.5 text-xs">
                      @if (setor.chefeImediato; as chefe) {
                        @let chefeInfo = getChefeStatusInfo(chefe);
                        <div class="flex items-center gap-1.5 flex-wrap">
                          <span class="font-medium text-siage-text-primary">{{ chefe.nome }}</span>
                          @if (chefeInfo.status === 'INATIVO') {
                            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20 whitespace-nowrap">
                              Inativo
                            </span>
                          }
                        </div>
                        <span class="text-siage-text-secondary block">Matrícula: {{ chefe.matricula }}</span>
                      } @else {
                        <span class="text-siage-text-secondary/70 italic">Sem Chefe Definido</span>
                      }
                    </td>

                    <!-- 4. Aprovador de Exceção -->
                    <td class="p-3.5 text-xs">
                      @if (setor.aprovadorVigente) {
                        <span class="font-medium text-siage-text-primary block">{{ setor.aprovadorVigente.nome }}</span>
                        <span class="text-siage-text-secondary block">Matrícula: {{ setor.aprovadorVigente.matricula }}</span>
                      } @else {
                        <span class="text-siage-text-secondary/70 italic">Sem exceção cadastrada</span>
                      }
                    </td>

                    <!-- 5. Tipo de Atuação -->
                    <td class="p-3.5 text-xs text-siage-text-secondary">
                      @if (setor.aprovadorVigente) {
                        @if (setor.aprovadorVigente.modalidade === 'SOBREPOE_SEMPRE') {
                          <span class="font-medium text-siage-text-primary block">Sempre sobrepõe chefia</span>
                        } @else {
                          <span class="font-medium text-siage-text-primary block">Suporte à chefia ausente</span>
                        }
                      } @else {
                        <span class="text-siage-text-secondary/60">—</span>
                      }
                    </td>

                    <!-- 6. Situação Calculada com Flags Semânticas Padronizadas (sem quebra de linha) -->
                    <td class="p-3.5 whitespace-nowrap">
                      @if (situacao === 'REGULAR') {
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                          Regular
                        </span>
                      } @else if (situacao === 'SUPRIDO') {
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 whitespace-nowrap">
                          Suprido
                        </span>
                      } @else if (situacao === 'DESCOBERTO') {
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 whitespace-nowrap">
                          Descoberto
                        </span>
                      } @else if (situacao === 'NECESSITA_TROCA') {
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap" matTooltip="Aprovador ativo indisponível operacionalmente ou com situação impeditiva">
                          Necessita Troca
                        </span>
                      }
                    </td>

                    <!-- 7. Ações (Visualizar e Editar/Configurar) -->
                    <td class="p-3.5 text-right whitespace-nowrap">
                      <div class="flex items-center justify-end gap-1">
                        <!-- Visualizar -->
                        <button 
                          mat-icon-button 
                          type="button" 
                          (click)="onVisualizar(setor)" 
                          class="text-siage-text-secondary hover:text-siage-primary transition-colors cursor-pointer"
                          matTooltip="Visualizar configuração"
                          aria-label="Visualizar"
                        >
                          <mat-icon style="font-size: 18px; width: 18px; height: 18px;">visibility</mat-icon>
                        </button>

                        <!-- Editar/Configurar -->
                        <button 
                          mat-icon-button 
                          type="button" 
                          (click)="onConfigurar(setor)" 
                          class="text-siage-text-secondary hover:text-siage-primary transition-colors cursor-pointer"
                          [matTooltip]="setor.aprovadorVigente ? 'Editar aprovador de exceção' : 'Configurar aprovador de exceção'"
                          aria-label="Configurar exceção"
                        >
                          <mat-icon style="font-size: 18px; width: 18px; height: 18px;">edit</mat-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="p-8 text-center text-xs text-siage-text-secondary">
                      Nenhum setor encontrado para os filtros selecionados.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <app-siage-paginator 
            [length]="filteredSetores().length"
            [pageIndex]="pageIndex()"
            [pageSize]="10"
            (page)="onPageChange($event.pageIndex)"
          />
        </div>

      </div>
    }
  `
})
export class ExcecaoHierarquiaList {
  private readonly router = inject(Router);
  readonly service = inject(ExcecaoHierarquiaService);
  readonly permissionService = inject(PermissionService);

  readonly pageIndex = signal(0);
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
    const dir = this.sortDirection() === 'asc' ? 1 : -1;
    list.sort((a, b) => dir * a.nome.localeCompare(b.nome, 'pt-BR'));

    return list;
  });

  readonly paginatedSetores = computed(() => {
    const list = this.filteredSetores();
    const start = this.pageIndex() * 10;
    return list.slice(start, start + 10);
  });

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

  toggleSort() {
    this.sortDirection.update(d => (d === 'asc' ? 'desc' : 'asc'));
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
    MatRadioModule,
    MatCheckboxModule,
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
        
        <!-- Breadcrumb e Cabeçalho Principal -->
        <div class="flex flex-col gap-2">
          <!-- Breadcrumb: Início > Configurações > Hierarquia de Unidades e Cargos > Exceção de Hierarquia > Configurar -->
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
              Exceção de Hierarquia
            </span>
            <span class="text-[10px] text-siage-text-secondary/40 select-none" aria-hidden="true">/</span>
            <span class="text-siage-primary font-semibold" aria-current="page">Configurar</span>
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
                  Configurar Exceção de Hierarquia
                </h1>
              </div>

              <p class="text-xs sm:text-sm text-siage-text-secondary font-sans leading-normal pl-8 sm:pl-9 max-w-2xl">
                Defina o aprovador de exceção, tipo de atuação e portaria regulamentadora para o setor selecionado.
              </p>
            </div>
          </div>
        </div>

        <!-- FORMULÁRIO EM CARDS -->
        <form [formGroup]="form" class="flex flex-col gap-6">

          <!-- ============================================== -->
          <!-- CARD 1: IDENTIFICAÇÃO DO SETOR (SOMENTE LEITURA) -->
          <!-- ============================================== -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div class="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 border-b border-siage-border/40 pb-2">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">domain</mat-icon>
                <span>1. Identificação do Setor</span>
              </h3>
              <div>
                @if (s.aprovadorVigente) {
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 whitespace-nowrap">
                    Suprido por Exceção
                  </span>
                } @else {
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20 whitespace-nowrap">
                    Sem Exceção Cadastrada
                  </span>
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
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-siage-primary/10 text-siage-primary border border-siage-primary/20">
                    {{ s.tipoEntidade }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- ============================================== -->
          <!-- CARD 2: APROVADOR DE EXCEÇÃO                    -->
          <!-- ============================================== -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">person</mat-icon>
              <span>2. Aprovador de Exceção</span>
            </h3>

            <div class="form-field-group max-w-3xl">
              <label for="form-aprovador" class="siage-field-label">
                Indicar Aprovador de Exceção <span class="required-marker">*</span>
              </label>

              @if (selectedServidor(); as serv) {
                <!-- Campo Bloqueado com Servidor Atual + Botão Trocar Servidor ao lado -->
                <div class="flex items-start gap-3 w-full">
                  <mat-form-field appearance="outline" class="flex-1" subscriptSizing="fixed">
                    <input 
                      matInput 
                      id="form-aprovador"
                      type="text" 
                      [value]="serv.nome + ' - Matrícula: ' + serv.matricula + ' (' + serv.cargo + ')'"
                      disabled
                      readonly
                      class="text-sm cursor-not-allowed font-medium text-siage-text-primary"
                    />
                    <mat-icon matPrefix class="text-siage-text-secondary mr-2">person</mat-icon>
                  </mat-form-field>

                  <button 
                    type="button" 
                    (click)="trocarServidor()" 
                    class="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg border border-siage-border bg-siage-surface hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold text-siage-text-primary transition-colors cursor-pointer shrink-0 mt-0.5"
                    matTooltip="Substituir servidor aprovador de exceção"
                  >
                    <mat-icon style="font-size: 18px; width: 18px; height: 18px;">sync</mat-icon>
                    <span>Trocar Servidor</span>
                  </button>
                </div>
                <span class="text-xs text-siage-text-secondary mt-1">
                  Servidor aprovador de exceção atualmente designado para o setor.
                </span>
              } @else {
                <!-- Campo de Busca de Servidor Habilitado com Autocomplete -->
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    id="form-aprovador"
                    type="text" 
                    [formControl]="servidorBuscaControl"
                    placeholder="Digite o nome ou a matrícula do servidor" 
                    [matAutocomplete]="autoServidores"
                    #autoServTrigger="matAutocompleteTrigger"
                    (focus)="autoServTrigger.openPanel()"
                    class="text-sm"
                  />
                  <mat-autocomplete #autoServidores="matAutocomplete" [displayWith]="displayServidorFn" (optionSelected)="onServidorSelected($event.option.value)">
                    @for (serv of filteredServidoresSugestoes(); track serv.matricula) {
                      @let disponivel = isElegivel(serv) && !serv.indisponibilidade;
                      <mat-option [value]="serv">
                        <div class="flex items-center justify-between gap-3 w-full">
                          <div class="flex flex-col min-w-0 pr-2">
                            <span class="font-medium text-xs text-siage-text-primary truncate">{{ serv.nome }}</span>
                            <span class="text-[11px] text-siage-text-secondary truncate">{{ serv.cargo }} • Matrícula: {{ serv.matricula }}</span>
                          </div>
                          @if (disponivel) {
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                              Elegível
                            </span>
                          } @else {
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0">
                              Indisponível
                            </span>
                          }
                        </div>
                      </mat-option>
                    }
                  </mat-autocomplete>
                  @if (servidorBuscaControl.value) {
                    <button mat-icon-button matSuffix type="button" (click)="servidorBuscaControl.setValue('')" aria-label="Limpar">
                      <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                    </button>
                  } @else {
                    <button mat-icon-button matSuffix type="button" (click)="autoServTrigger.openPanel()" aria-label="Abrir sugestões">
                      <mat-icon class="text-siage-text-secondary">arrow_drop_down</mat-icon>
                    </button>
                  }
                  @if (servidorBuscaControl.hasError('required') && servidorBuscaControl.touched) {
                    <mat-error>É obrigatório selecionar um servidor aprovador.</mat-error>
                  }
                </mat-form-field>
                <span class="text-xs text-siage-text-secondary mt-1">
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
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">verified_user</mat-icon>
                <span>3. Checagem de Elegibilidade Regimental</span>
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <!-- Camada 1: Situação Funcional -->
                <div class="border rounded-lg p-4 flex flex-col gap-2" [class.border-emerald-500/30]="elegivel" [class.bg-emerald-500/5]="elegivel" [class.border-red-500/30]="!elegivel" [class.bg-red-500/5]="!elegivel">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold uppercase tracking-wider" [class.text-emerald-700]="elegivel" [class.dark:text-emerald-400]="elegivel" [class.text-red-700]="!elegivel" [class.dark:text-red-400]="!elegivel">
                      Camada 1 — Situação Funcional
                    </span>
                    <mat-icon style="font-size: 20px; width: 20px; height: 20px;" [class.text-emerald-600]="elegivel" [class.text-red-600]="!elegivel">
                      {{ elegivel ? 'check_circle' : 'cancel' }}
                    </mat-icon>
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
                <div class="border rounded-lg p-4 flex flex-col gap-2" [class.border-emerald-500/30]="!indisponivel" [class.bg-emerald-500/5]="!indisponivel" [class.border-amber-500/30]="indisponivel" [class.bg-amber-500/5]="indisponivel">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold uppercase tracking-wider" [class.text-emerald-700]="!indisponivel" [class.dark:text-emerald-400]="!indisponivel" [class.text-amber-700]="indisponivel" [class.dark:text-amber-400]="indisponivel">
                      Camada 2 — Disponibilidade Operacional
                    </span>
                    <mat-icon style="font-size: 20px; width: 20px; height: 20px;" [class.text-emerald-600]="!indisponivel" [class.text-amber-600]="indisponivel">
                      {{ !indisponivel ? 'check_circle' : 'warning' }}
                    </mat-icon>
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
                      <mat-checkbox [formControl]="form.controls.cienteAlerta" color="primary" class="text-xs font-medium text-siage-text-primary">
                        <span class="text-xs font-semibold text-siage-text-primary">Confirmar designação ciente do alerta</span>
                      </mat-checkbox>
                      <span class="text-[11px] text-amber-700 dark:text-amber-400 block mt-0.5">
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
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">tune</mat-icon>
              <span>4. Tipo de Atuação e Justificativa</span>
            </h3>

            <!-- Tipo de Atuação / Modalidade (Radio buttons) -->
            <div class="flex flex-col gap-2" role="group" aria-labelledby="label-modalidade">
              <span id="label-modalidade" class="siage-field-label">
                Tipo de Atuação / Modalidade <span class="required-marker">*</span>
              </span>
              
              <mat-radio-group [formControl]="form.controls.modalidade" class="flex flex-col gap-3">
                
                <div class="border border-siage-border rounded-lg p-3.5 hover:border-siage-primary/40 transition-colors">
                  <mat-radio-button value="SOBREPOE_SEMPRE" color="primary" class="w-full">
                    <div class="flex flex-col text-left pl-1">
                      <span class="text-sm font-semibold text-siage-text-primary">Sempre sobrepõe o chefe imediato</span>
                      <span class="text-xs text-siage-text-secondary leading-normal mt-0.5">
                        O aprovador recebe os fluxos de aprovação de férias, licenças e afastamentos do setor, independentemente da disponibilidade da chefia formal.
                      </span>
                    </div>
                  </mat-radio-button>
                </div>

                <div class="border border-siage-border rounded-lg p-3.5 hover:border-siage-primary/40 transition-colors">
                  <mat-radio-button value="APENAS_INDISPONIVEL" color="primary" class="w-full">
                    <div class="flex flex-col text-left pl-1">
                      <span class="text-sm font-semibold text-siage-text-primary">Atua somente quando indisponível ou não definido</span>
                      <span class="text-xs text-siage-text-secondary leading-normal mt-0.5">
                        O aprovador funciona como alternativa quando a chefia imediata estiver ausente, afastada, em férias ou ainda não cadastrada.
                      </span>
                    </div>
                  </mat-radio-button>
                </div>

              </mat-radio-group>
            </div>

            <!-- Portaria Regulamentadora (Opcional) -->
            <div class="form-field-group max-w-xl">
              <label for="form-portaria" class="siage-field-label">
                Portaria Regulamentadora / Ato Oficial
              </label>
              <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                <input 
                  matInput 
                  id="form-portaria" 
                  [formControl]="form.controls.portaria" 
                  maxlength="100"
                  placeholder="Ex: Portaria SEAD nº 104/2024"
                  class="text-sm"
                />
              </mat-form-field>
              <span class="text-xs text-siage-text-secondary mt-1">
                Informe o número ou identificação do ato que autorizou a designação de exceção.
              </span>
            </div>

            <!-- Justificativa da Exceção Fundamentada (Obrigatória) -->
            <div class="form-field-group">
              <label for="form-justificativa" class="siage-field-label">
                Justificativa da Exceção Fundamentada <span class="required-marker">*</span>
              </label>
              <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                <textarea 
                  matInput 
                  id="form-justificativa" 
                  [formControl]="form.controls.justificativa" 
                  rows="4" 
                  maxlength="1000"
                  placeholder="Descreva detalhadamente a fundamentação e a necessidade regimental para a designação do aprovador de exceção..."
                  class="text-sm"
                ></textarea>
                <mat-hint align="end" class="text-xs text-siage-text-secondary">
                  {{ (form.controls.justificativa.value || '').length }} / 1000
                </mat-hint>
                @if (form.controls.justificativa.hasError('required') && form.controls.justificativa.touched) {
                  <mat-error>A Justificativa da Exceção é obrigatória.</mat-error>
                } @else if (form.controls.justificativa.hasError('emptyWhitespace') && form.controls.justificativa.touched) {
                  <mat-error>A justificativa não pode conter apenas espaços em branco.</mat-error>
                }
              </mat-form-field>
            </div>

          </div>

          <!-- ============================================== -->
          <!-- RODAPÉ DE AÇÕES DO FORMULÁRIO                  -->
          <!-- ============================================== -->
          <div class="flex items-center justify-between pt-4 border-t border-siage-border/40">
            <!-- Ação Revogar à esquerda quando houver aprovador ativo -->
            <div>
              @if (temAprovadorAtivo()) {
                <button 
                  type="button" 
                  (click)="onRevogarExcecao()" 
                  class="inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-lg border border-red-300 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100/50 font-sans font-semibold text-sm transition-all cursor-pointer"
                >
                  <mat-icon style="font-size: 18px; width: 18px; height: 18px;">block</mat-icon>
                  <span>Revogar Exceção</span>
                </button>
              }
            </div>

            <!-- Botões Cancelar e Salvar/Atualizar à direita -->
            <div class="flex items-center gap-3">
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
                [disabled]="isSaving() || !canSalvar()"
                [matTooltip]="!canSalvar() ? 'Preencha todos os campos obrigatórios e verifique a elegibilidade' : ''"
                class="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (isSaving()) {
                  <span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Salvando...</span>
                } @else {
                  <mat-icon style="font-size: 18px; width: 18px; height: 18px;">{{ temAprovadorAtivo() ? 'check' : 'add' }}</mat-icon>
                  <span>{{ temAprovadorAtivo() ? 'Atualizar Aprovador' : 'Adicionar Aprovador' }}</span>
                }
              </button>
            </div>
          </div>

        </form>

        <!-- ============================================== -->
        <!-- CARD 5: HISTÓRICO DE APROVADORES DO SETOR       -->
        <!-- ============================================== -->
        <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4 mt-6">
          <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">history</mat-icon>
            <span>Histórico de Aprovadores do Setor</span>
          </h3>

          <div class="border border-siage-border rounded-lg overflow-hidden bg-siage-surface">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-slate-100/70 dark:bg-slate-800/50 border-b border-siage-border text-siage-text-secondary font-semibold">
                    <th class="p-3">Aprovador</th>
                    <th class="p-3">Tipo de Atuação</th>
                    <th class="p-3">Portaria</th>
                    <th class="p-3">Vigência</th>
                    <th class="p-3">Situação</th>
                    <th class="p-3">Modificado por</th>
                    <th class="p-3">Data/Hora Modificação</th>
                    <th class="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-siage-border/40">
                  @for (reg of s.historico; track reg.id) {
                    <tr class="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      <td class="p-3 font-medium text-siage-text-primary">
                        <span class="block text-sm">{{ reg.servidorNome }}</span>
                        <span class="text-xs text-siage-text-secondary">Matrícula: {{ reg.servidorMatricula }}</span>
                      </td>
                      <td class="p-3 text-xs text-siage-text-secondary">
                        {{ reg.modalidade === 'SOBREPOE_SEMPRE' ? 'Sempre sobrepõe o chefe' : 'Quando indisponível' }}
                      </td>
                      <td class="p-3 text-xs text-siage-text-secondary">
                        {{ reg.portaria || '-' }}
                      </td>
                      <td class="p-3 text-xs text-siage-text-secondary font-medium">
                        {{ reg.vigenciaFormatada }}
                      </td>
                      <td class="p-3">
                        @if (reg.situacao === 'ATIVO') {
                          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            Ativo
                          </span>
                        } @else if (reg.situacao === 'SUBSTITUIDO') {
                          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
                            Substituído
                          </span>
                        } @else {
                          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            Encerrado
                          </span>
                        }
                      </td>
                      <td class="p-3 text-xs text-siage-text-secondary">{{ reg.modificadoPor }}</td>
                      <td class="p-3 text-xs text-siage-text-secondary">{{ reg.dataHoraModificacao }}</td>
                      <td class="p-3 text-right">
                        <button 
                          mat-icon-button 
                          type="button" 
                          (click)="abrirDetalhesRegistro(reg)" 
                          class="text-siage-text-secondary hover:text-siage-primary transition-colors cursor-pointer"
                          matTooltip="Detalhes da exceção"
                          aria-label="Ver detalhes"
                        >
                          <mat-icon style="font-size: 18px; width: 18px; height: 18px;">visibility</mat-icon>
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="8" class="p-6 text-center text-xs text-siage-text-secondary">
                        Este setor não possui nenhum aprovador de exceção registrado em seu histórico.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
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
  private readonly dialog = inject(MatDialog);
  private readonly modalService = inject(ModalService);
  private readonly toastService = inject(ToastService);

  readonly setorId = signal<string>('');
  readonly setor = computed(() => this.service.getSetor(this.setorId()));

  readonly selectedServidor = signal<ServidorSimulado | undefined>(undefined);
  readonly servidorBuscaControl = new FormControl<string | ServidorSimulado>('', [Validators.required]);
  readonly servidorBuscaVal = toSignal(this.servidorBuscaControl.valueChanges, { initialValue: '' });
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

  readonly temAprovadorAtivo = computed(() => {
    return !!this.setor()?.aprovadorVigente && this.setor()?.aprovadorVigente?.situacao === 'ATIVO';
  });

  displayServidorFn(serv?: ServidorSimulado | string): string {
    if (!serv) return '';
    return typeof serv === 'string' ? serv : serv.nome;
  }

  // Autocomplete de Servidores (filtragem reativa por digitação de nome ou matrícula, máximo 10)
  readonly filteredServidoresSugestoes = computed(() => {
    const raw = this.servidorBuscaVal();
    const query = (typeof raw === 'string' ? raw : raw?.nome || '').trim().toLowerCase();
    const list = this.service.getServidores();
    if (!query) return list.slice(0, 10);
    return list.filter(s =>
      s.nome.toLowerCase().includes(query) ||
      s.matricula.includes(query)
    ).slice(0, 10);
  });

  isElegivel(servidor: ServidorSimulado): boolean {
    return this.service.isServidorElegivel(servidor);
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
        this.servidorBuscaControl.setValue(serv);
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

  onServidorSelected(serv: ServidorSimulado) {
    this.selectedServidor.set(serv);
    this.servidorBuscaControl.setValue(serv);
  }

  trocarServidor() {
    const dialogRef = this.dialog.open(ConfirmacaoDialog, {
      disableClose: true,
      data: {
        title: 'Trocar Servidor?',
        message: 'Ao trocar o servidor selecionado, os dados específicos da designação (tipo de atuação, portaria e justificativa) serão limpos. Deseja continuar?',
        cancelLabel: 'Não',
        actionLabel: 'Sim',
        actionType: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.selectedServidor.set(undefined);
        this.servidorBuscaControl.setValue('');
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
      this.toastService.success(this.temAprovadorAtivo() ? 'Aprovador de exceção atualizado com sucesso.' : 'Aprovador de exceção designado com sucesso.');
      this.router.navigate(['/configuracoes/hierarquia/excecao-hierarquia']);
    }, 150);
  }

  onRevogarExcecao() {
    const s = this.setor();
    if (!s || !s.aprovadorVigente) return;

    const dialogRef = this.dialog.open(ConfirmacaoDialog, {
      disableClose: true,
      data: {
        title: 'Revogar Exceção de Hierarquia?',
        message: `Deseja encerrar a designação de ${s.aprovadorVigente.nome} como aprovador de exceção para o setor ${s.nome}? O registro será arquivado no histórico.`,
        cancelLabel: 'Cancelar',
        actionLabel: 'Sim, revogar',
        actionType: 'destructive'
      }
    });

    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.service.revogarExcecao(s.id);
        this.isSavedSuccessfully = true;
        this.toastService.success('Exceção de hierarquia revogada com sucesso.');
        this.router.navigate(['/configuracoes/hierarquia/excecao-hierarquia']);
      }
    });
  }

  abrirDetalhesRegistro(reg: RegistroHistoricoExcecao) {
    this.dialog.open(DetalhesExcecaoModal, {
      disableClose: true,
      data: { registro: reg }
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

  onCancelar() {
    if (!this.hasPendingChanges()) {
      this.router.navigate(['/configuracoes/hierarquia/excecao-hierarquia']);
      return;
    }
    const dialogRef = this.modalService.confirmarCancelamento();
    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.isDiscarded = true;
        this.router.navigate(['/configuracoes/hierarquia/excecao-hierarquia']);
      }
    });
  }

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
}

// ==========================================
// TELA 3: VISUALIZAR EXCEÇÃO DE HIERARQUIA
// ==========================================

@Component({
  selector: 'app-excecao-hierarquia-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatTooltipModule,
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
        
        <!-- Breadcrumb e Cabeçalho Principal -->
        <div class="flex flex-col gap-2">
          <!-- Breadcrumb: Início > Configurações > Hierarquia de Unidades e Cargos > Exceção de Hierarquia > Visualizar -->
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
              (click)="goListagem()" 
              (keydown.enter)="goListagem()" 
              tabindex="0" 
              role="button" 
              class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline"
            >
              Exceção de Hierarquia
            </span>
            <span class="text-[10px] text-siage-text-secondary/40 select-none" aria-hidden="true">/</span>
            <span class="text-siage-primary font-semibold" aria-current="page">Visualizar</span>
          </nav>

          <!-- Título com Botão Voltar e Botão Editar/Configurar -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2 sm:gap-3">
                <button 
                  mat-icon-button 
                  type="button" 
                  (click)="goListagem()" 
                  class="text-siage-text-secondary hover:text-siage-primary transition-colors cursor-pointer -ml-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                  title="Voltar para a listagem"
                  aria-label="Voltar para a listagem"
                >
                  <mat-icon style="font-size: 22px; width: 22px; height: 22px;">arrow_back</mat-icon>
                </button>
                <h1 class="text-2xl sm:text-3xl font-poppins font-bold tracking-tight text-siage-text-primary leading-tight">
                  Visualizar Exceção de Hierarquia
                </h1>
              </div>

              <p class="text-xs sm:text-sm text-siage-text-secondary font-sans leading-normal pl-8 sm:pl-9 max-w-2xl">
                Consulte as informações do setor, chefia imediata, aprovador de exceção designado e o histórico de alterações.
              </p>
            </div>

            <!-- Botão Configurar / Editar -->
            <div class="shrink-0 pl-8 sm:pl-0">
              <button 
                type="button" 
                (click)="onEditar()" 
                class="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
              >
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">edit</mat-icon>
                <span>{{ s.aprovadorVigente ? 'Editar Aprovador' : 'Configurar Exceção' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- CARDS DE VISUALIZAÇÃO -->
        <div class="flex flex-col gap-6">

          <!-- CARD 1: IDENTIFICAÇÃO DO SETOR -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div class="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 border-b border-siage-border/40 pb-2">
              <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">domain</mat-icon>
                <span>1. Identificação do Setor</span>
              </h3>
              <div>
                @if (s.aprovadorVigente) {
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 whitespace-nowrap">
                    Suprido por Exceção
                  </span>
                } @else {
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20 whitespace-nowrap">
                    Sem Exceção Cadastrada
                  </span>
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
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-siage-primary/10 text-siage-primary border border-siage-primary/20">
                    {{ s.tipoEntidade }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- CARD 2: CHEFIA IMEDIATA FORMAL -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">badge</mat-icon>
              <span>2. Chefia Imediata Formal</span>
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
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                      Ativo
                    </span>
                  } @else {
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap" [title]="chefeInfo.detalhe ? 'Motivo: ' + chefeInfo.detalhe : 'Chefia inativa'">
                      Inativo{{ chefeInfo.detalhe ? ' — ' + chefeInfo.detalhe : '' }}
                    </span>
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
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">verified_user</mat-icon>
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

                <!-- Camadas de Elegibilidade Regimental (Estrutura idêntica ao formulário, somente consulta) -->
                @if (serv) {
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    
                    <!-- Camada 1: Situação Funcional -->
                    <div class="border rounded-lg p-4 flex flex-col gap-2" [class.border-emerald-500/30]="elegivel" [class.bg-emerald-500/5]="elegivel" [class.border-red-500/30]="!elegivel" [class.bg-red-500/5]="!elegivel">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold uppercase tracking-wider" [class.text-emerald-700]="elegivel" [class.dark:text-emerald-400]="elegivel" [class.text-red-700]="!elegivel" [class.dark:text-red-400]="!elegivel">
                          Camada 1 — Situação Funcional
                        </span>
                        <mat-icon style="font-size: 20px; width: 20px; height: 20px;" [class.text-emerald-600]="elegivel" [class.text-red-600]="!elegivel">
                          {{ elegivel ? 'check_circle' : 'cancel' }}
                        </mat-icon>
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
                    <div class="border rounded-lg p-4 flex flex-col gap-2" [class.border-emerald-500/30]="!indisponivel" [class.bg-emerald-500/5]="!indisponivel" [class.border-amber-500/30]="indisponivel" [class.bg-amber-500/5]="indisponivel">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold uppercase tracking-wider" [class.text-emerald-700]="!indisponivel" [class.dark:text-emerald-400]="!indisponivel" [class.text-amber-700]="indisponivel" [class.dark:text-amber-400]="indisponivel">
                          Camada 2 — Disponibilidade Operacional
                        </span>
                        <mat-icon style="font-size: 20px; width: 20px; height: 20px;" [class.text-emerald-600]="!indisponivel" [class.text-amber-600]="indisponivel">
                          {{ !indisponivel ? 'check_circle' : 'warning' }}
                        </mat-icon>
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

                        <!-- Informação discreta de ciência prévia registrada (sem interação) -->
                        <div class="pt-2 mt-1 border-t border-amber-500/20 flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300">
                          <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-amber-600 shrink-0">info</mat-icon>
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

                <!-- Metadados Discretos de Auditoria (Modificado por) -->
                <div class="pt-3 border-t border-siage-border/40 text-xs text-siage-text-secondary flex items-center gap-1.5">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-siage-text-secondary/70 shrink-0">history</mat-icon>
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
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">history</mat-icon>
              <span>4. Histórico de Aprovadores do Setor</span>
            </h3>

            <div class="border border-siage-border rounded-lg overflow-hidden bg-siage-surface">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="bg-slate-100/70 dark:bg-slate-800/50 border-b border-siage-border text-siage-text-secondary font-semibold">
                      <th class="p-3">Aprovador</th>
                      <th class="p-3">Tipo de Atuação</th>
                      <th class="p-3">Portaria</th>
                      <th class="p-3">Vigência</th>
                      <th class="p-3">Situação</th>
                      <th class="p-3">Modificado por</th>
                      <th class="p-3">Data/Hora Modificação</th>
                      <th class="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-siage-border/40">
                    @for (reg of s.historico; track reg.id) {
                      <tr class="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <td class="p-3 font-medium text-siage-text-primary">
                          <span class="block text-sm">{{ reg.servidorNome }}</span>
                          <span class="text-xs text-siage-text-secondary">Matrícula: {{ reg.servidorMatricula }}</span>
                        </td>
                        <td class="p-3 text-xs text-siage-text-secondary">
                          {{ reg.modalidade === 'SOBREPOE_SEMPRE' ? 'Sempre sobrepõe o chefe' : 'Quando indisponível' }}
                        </td>
                        <td class="p-3 text-xs text-siage-text-secondary">
                          {{ reg.portaria || '-' }}
                        </td>
                        <td class="p-3 text-xs text-siage-text-secondary font-medium">
                          {{ reg.vigenciaFormatada }}
                        </td>
                        <td class="p-3">
                          @if (reg.situacao === 'ATIVO') {
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                              Ativo
                            </span>
                          } @else if (reg.situacao === 'SUBSTITUIDO') {
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
                              Substituído
                            </span>
                          } @else {
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              Encerrado
                            </span>
                          }
                        </td>
                        <td class="p-3 text-xs text-siage-text-secondary">{{ reg.modificadoPor }}</td>
                        <td class="p-3 text-xs text-siage-text-secondary">{{ reg.dataHoraModificacao }}</td>
                        <td class="p-3 text-right">
                          <button 
                            mat-icon-button 
                            type="button" 
                            (click)="abrirDetalhesRegistro(reg)" 
                            class="text-siage-text-secondary hover:text-siage-primary transition-colors cursor-pointer"
                            matTooltip="Detalhes da exceção"
                            aria-label="Ver detalhes"
                          >
                            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">visibility</mat-icon>
                          </button>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="8" class="p-6 text-center text-xs text-siage-text-secondary">
                          Este setor não possui nenhum aprovador de exceção registrado em seu histórico.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
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
  private readonly dialog = inject(MatDialog);
  private readonly toastService = inject(ToastService);

  readonly setorId = signal<string>('');
  readonly setor = computed(() => this.service.getSetor(this.setorId()));

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

  abrirDetalhesRegistro(reg: RegistroHistoricoExcecao) {
    this.dialog.open(DetalhesExcecaoModal, {
      disableClose: true,
      data: { registro: reg }
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

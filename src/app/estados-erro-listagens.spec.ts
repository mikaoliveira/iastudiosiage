import {signal, Type} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {vi} from 'vitest';
import {CargoComissionadoList} from './cargo-comissionado';
import {CargoList} from './cargo';
import {ClassificacaoFuncionalList} from './classificacao-funcional';
import {FormaAdmissaoList} from './forma-de-admissao';
import {FormacaoAcademicaList} from './formacao-academica';
import {FuncaoList} from './funcao';
import {GrauInstrucaoList} from './grau-de-instrucao';
import {ImportacaoProfissionaisList} from './importacao-profissionais';
import {ModalidadeEnsinoList} from './modalidade-de-ensino';
import {MotivoSaidaList} from './motivo-da-saida';
import {ProfessoresList} from './professores-emergencial-militares-base-tecnica';
import {RegimeContratacaoList} from './regime-contratacao';
import {SituacaoFuncionalList} from './situacao-funcional';
import {TipoAposentadoriaList} from './tipo-aposentadoria';
import {TipoCargoComissionadoList} from './tipo-cargo-comissionado';
import {ScenarioType, SimulatorService} from './simulator';

const listagens: {nome: string; componente: Type<{carregarDados(): void}>; descricao: string}[] = [
  {nome: 'Cargo Comissionado', componente: CargoComissionadoList, descricao: 'Não foi possível carregar as informações desta funcionalidade. Verifique sua conexão e tente novamente.'},
  {nome: 'Cargo', componente: CargoList, descricao: 'Não foi possível carregar as informações desta funcionalidade. Verifique sua conexão e tente novamente.'},
  {nome: 'Classificação Funcional', componente: ClassificacaoFuncionalList, descricao: 'Não foi possível carregar as informações desta funcionalidade. Verifique sua conexão e tente novamente.'},
  {nome: 'Forma de Admissão', componente: FormaAdmissaoList, descricao: 'Não foi possível carregar as informações desta funcionalidade. Verifique sua conexão e tente novamente.'},
  {nome: 'Formação Acadêmica', componente: FormacaoAcademicaList, descricao: 'Não foi possível carregar as informações desta funcionalidade. Verifique sua conexão e tente novamente.'},
  {nome: 'Função', componente: FuncaoList, descricao: 'Não foi possível carregar as informações desta funcionalidade. Verifique sua conexão e tente novamente.'},
  {nome: 'Grau de Instrução', componente: GrauInstrucaoList, descricao: 'Não foi possível carregar as informações desta funcionalidade. Verifique sua conexão e tente novamente.'},
  {nome: 'Importação de Profissionais', componente: ImportacaoProfissionaisList, descricao: 'Não foi possível carregar as informações desta funcionalidade. Verifique sua conexão e tente novamente.'},
  {nome: 'Modalidade de Ensino', componente: ModalidadeEnsinoList, descricao: 'Não foi possível carregar as informações desta funcionalidade. Verifique sua conexão e tente novamente.'},
  {nome: 'Motivo da Saída', componente: MotivoSaidaList, descricao: 'Não foi possível carregar as informações desta funcionalidade. Verifique sua conexão e tente novamente.'},
  {nome: 'Professores', componente: ProfessoresList, descricao: 'Não foi possível carregar as informações. Verifique sua conexão e tente novamente.'},
  {nome: 'Regime de Contratação', componente: RegimeContratacaoList, descricao: 'Não foi possível carregar as informações desta funcionalidade. Verifique sua conexão e tente novamente.'},
  {nome: 'Situação Funcional', componente: SituacaoFuncionalList, descricao: 'Não foi possível carregar as informações desta funcionalidade. Verifique sua conexão e tente novamente.'},
  {nome: 'Tipo de Aposentadoria', componente: TipoAposentadoriaList, descricao: 'Não foi possível carregar as informações desta funcionalidade. Verifique sua conexão e tente novamente.'},
  {nome: 'Tipo de Cargo Comissionado', componente: TipoCargoComissionadoList, descricao: 'Não foi possível carregar as informações desta funcionalidade. Verifique sua conexão e tente novamente.'}
];

describe('Estados de erro das listagens', () => {
  const scenario = signal<ScenarioType>('error');
  const simulator = {
    currentScenario: scenario,
    allowCreation: signal(true),
    reset: vi.fn(() => scenario.set('normal'))
  };

  beforeEach(() => {
    scenario.set('error');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each(listagens)('$nome usa o estado oficial e permite tentar novamente', async ({componente, descricao}) => {
    await TestBed.configureTestingModule({
      imports: [componente],
      providers: [provideRouter([]), {provide: SimulatorService, useValue: simulator}]
    }).compileComponents();

    const fixture = TestBed.createComponent(componente);
    const carregar = vi.spyOn(fixture.componentInstance, 'carregarDados');
    fixture.detectChanges();

    const estado = fixture.nativeElement.querySelector('s-empty-state') as HTMLElement;
    expect(estado).not.toBeNull();
    expect(estado.textContent).toContain('Erro ao carregar dados');
    expect(estado.textContent).toContain(descricao);
    const botao = estado.querySelector('s-button') as HTMLElement;
    expect(botao.classList.contains('s-button--secondary')).toBe(true);
    expect(botao.classList.contains('s-button--outlined')).toBe(true);
    expect(botao.textContent).toContain('Tentar novamente');
    vi.useFakeTimers();
    (botao.querySelector('button') as HTMLButtonElement).click();
    expect(carregar).toHaveBeenCalledOnce();
    expect(simulator.reset).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(400);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('s-empty-state')).toBeNull();
    fixture.destroy();
  });
});
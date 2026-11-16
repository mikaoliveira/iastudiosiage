import {TestBed} from '@angular/core/testing';
import {provideRouter, Router, ActivatedRoute, convertToParamMap} from '@angular/router';
import {provideZonelessChangeDetection, signal} from '@angular/core';
import {SModalService, SToastService} from '@siage/siage-ui';
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import {
  ExcecaoHierarquiaList,
  ExcecaoHierarquiaForm,
  ExcecaoHierarquiaView,
  ExcecaoHierarquiaService,
  DetalhesExcecaoModal,
  excecaoHierarquiaFormDeactivateGuard
} from './excecao-hierarquia';
import {SimulatorService, ScenarioType} from './simulator';

describe('Exceção de Hierarquia - Listagem (List)', () => {
  let router: Router;
  const scenario = signal<ScenarioType>('normal');
  const storage = new Map<string, string>();

  beforeEach(async () => {
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear()
    });

    scenario.set('normal');
    await TestBed.configureTestingModule({
      imports: [ExcecaoHierarquiaList],
      providers: [
        provideRouter([
          {path: 'configuracoes/hierarquia/excecao-hierarquia', component: ExcecaoHierarquiaList},
          {path: 'configuracoes/hierarquia/excecao-hierarquia/:id', component: ExcecaoHierarquiaView},
          {path: 'configuracoes/hierarquia/excecao-hierarquia/:id/configurar', component: ExcecaoHierarquiaForm}
        ]),
        {provide: SimulatorService, useValue: {currentScenario: scenario, allowCreation: signal(true)}},
        {provide: SToastService, useValue: {success: vi.fn(), warning: vi.fn(), error: vi.fn(), info: vi.fn()}},
        {provide: SModalService, useValue: {confirm: vi.fn().mockResolvedValue(true), open: vi.fn()}}
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renderiza o cabeçalho oficial e a tabela de setores', () => {
    const fixture = TestBed.createComponent(ExcecaoHierarquiaList);
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('s-page-header');
    expect(header).not.toBeNull();

    const table = fixture.nativeElement.querySelector('s-table');
    expect(table).not.toBeNull();

    const component = fixture.componentInstance;
    expect(component.filteredSetores().length).toBeGreaterThan(0);
  });

  it('bloqueia o acesso quando o usuário não possui permissão', () => {
    scenario.set('access_denied');
    const fixture = TestBed.createComponent(ExcecaoHierarquiaList);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-acesso-restrito')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('s-page-header')).toBeNull();
  });

  it('filtra setores por nome ou código UTB', () => {
    const fixture = TestBed.createComponent(ExcecaoHierarquiaList);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.filtroForm.controls.setor.setValue('SEAD');
    component.onBuscar();
    fixture.detectChanges();

    expect(component.appliedSetor()).toBe('SEAD');
    const filtered = component.filteredSetores();
    expect(filtered.every(s =>
      s.nome.toLowerCase().includes('sead') ||
      s.utbCodigo.toLowerCase().includes('sead') ||
      s.utbNome.toLowerCase().includes('sead')
    )).toBe(true);
  });

  it('limpa os filtros ao acionar onLimpar()', () => {
    const fixture = TestBed.createComponent(ExcecaoHierarquiaList);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.filtroForm.controls.setor.setValue('SEAD');
    component.filtroForm.controls.situacao.setValue('SUPRIDO');
    component.onBuscar();

    expect(component.appliedSetor()).toBe('SEAD');

    component.onLimpar();
    expect(component.appliedSetor()).toBe('');
    expect(component.appliedSituacao()).toBe('TODOS');
  });

  it('navega para a tela de visualização ao acionar a ação de visualizar', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ExcecaoHierarquiaList);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const setor = component.filteredSetores()[0];

    component.onTableAction({ action: 'visualizar', row: setor });
    expect(navigateSpy).toHaveBeenCalledWith(['/configuracoes/hierarquia/excecao-hierarquia', setor.id]);
  });

  it('navega para a tela de configuração ao acionar a ação de configurar', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ExcecaoHierarquiaList);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const setor = component.filteredSetores()[0];

    component.onTableAction({ action: 'configurar', row: setor });
    expect(navigateSpy).toHaveBeenCalledWith(['/configuracoes/hierarquia/excecao-hierarquia', setor.id, 'configurar']);
  });
});

describe('Exceção de Hierarquia - Formulário e Regras de Negócio (Form)', () => {
  let router: Router;
  let modalService: SModalService;
  let service: ExcecaoHierarquiaService;
  const storage = new Map<string, string>();

  beforeEach(async () => {
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear()
    });

    await TestBed.configureTestingModule({
      imports: [ExcecaoHierarquiaForm],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          {path: 'configuracoes/hierarquia/excecao-hierarquia', component: ExcecaoHierarquiaList},
          {path: 'configuracoes/hierarquia/excecao-hierarquia/:id/configurar', component: ExcecaoHierarquiaForm}
        ]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({id: 'sec-geral-1'})
            }
          }
        },
        {provide: SToastService, useValue: {success: vi.fn(), warning: vi.fn(), error: vi.fn(), info: vi.fn()}},
        {provide: SModalService, useValue: {confirm: vi.fn().mockResolvedValue(true), open: vi.fn()}}
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    modalService = TestBed.inject(SModalService);
    service = TestBed.inject(ExcecaoHierarquiaService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('carrega dados do setor em modo de edição com aprovador vigente', () => {
    const fixture = TestBed.createComponent(ExcecaoHierarquiaForm);
    const component = fixture.componentInstance;

    component.setorId.set('sec-geral-1');
    const s = service.getSetor('sec-geral-1')!;
    const serv = service.getServidor(s.aprovadorVigente!.matricula)!;
    component.selectedServidor.set(serv);
    component.form.patchValue({
      modalidade: s.aprovadorVigente!.modalidade,
      portaria: s.aprovadorVigente!.portaria || '',
      justificativa: s.aprovadorVigente!.justificativa
    });

    fixture.detectChanges();

    expect(component.temAprovadorAtivo()).toBe(true);
    expect(component.selectedServidor()?.matricula).toBe('170');
    expect(component.form.controls.modalidade.value).toBe('SOBREPOE_SEMPRE');
  });

  it('exige ciência de alerta quando o servidor possui indisponibilidade', () => {
    const fixture = TestBed.createComponent(ExcecaoHierarquiaForm);
    const component = fixture.componentInstance;
    component.setorId.set('sec-geral-1');

    const servIndisponivel = service.getServidores().find(s => !!s.indisponibilidade);
    expect(servIndisponivel).toBeDefined();

    component.selectedServidor.set(servIndisponivel);
    component.form.patchValue({
      modalidade: 'SOBREPOE_SEMPRE',
      justificativa: 'Justificativa válida fundamentada.',
      cienteAlerta: false
    });

    expect(component.canSalvar()).toBe(false);

    component.form.controls.cienteAlerta.setValue(true);
    expect(component.canSalvar()).toBe(true);
  });

  it('impede salvamento de servidor inelegível (ex: situação funcional impeditiva)', () => {
    const fixture = TestBed.createComponent(ExcecaoHierarquiaForm);
    const component = fixture.componentInstance;
    component.setorId.set('sec-geral-1');

    const servInelegivel = {
      matricula: '999',
      nome: 'Servidor Inelegível Teste',
      cargo: 'Técnico',
      cpf: '000.000.000-00',
      situacaoFuncionalCodigo: 99,
      situacaoFuncionalDescricao: '99 — Demitido/Aposentado'
    };

    component.selectedServidor.set(servInelegivel);
    component.form.patchValue({
      modalidade: 'SOBREPOE_SEMPRE',
      justificativa: 'Justificativa qualquer.'
    });

    expect(component.isElegivel(servInelegivel)).toBe(false);
    expect(component.canSalvar()).toBe(false);
  });

  it('executa fluxo de trocar servidor limpando os campos após confirmação', async () => {
    vi.spyOn(modalService, 'confirm').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ExcecaoHierarquiaForm);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.setorId.set('sec-geral-1');

    const serv = service.getServidores()[0];
    component.selectedServidor.set(serv);
    component.form.patchValue({
      modalidade: 'SOBREPOE_SEMPRE',
      portaria: 'Portaria 123',
      justificativa: 'Justificativa prévia'
    });

    component.trocarServidor();
    await fixture.whenStable();

    expect(modalService.confirm).toHaveBeenCalled();
    expect(component.selectedServidor()).toBeUndefined();
    expect(component.form.controls.modalidade.value).toBeNull();
    expect(component.form.controls.portaria.value).toBe('');
    expect(component.form.controls.justificativa.value).toBe('');
  });

  it('executa revogação de exceção chamando service.revogarExcecao', async () => {
    vi.spyOn(modalService, 'confirm').mockResolvedValue(true);
    const revogarSpy = vi.spyOn(service, 'revogarExcecao');
    const fixture = TestBed.createComponent(ExcecaoHierarquiaForm);
    const component = fixture.componentInstance;
    component.setorId.set('sec-geral-1');
    fixture.detectChanges();

    component.onRevogarExcecao();
    await fixture.whenStable();

    expect(modalService.confirm).toHaveBeenCalled();
    expect(revogarSpy).toHaveBeenCalledWith('sec-geral-1');
    expect(TestBed.inject(SToastService).success).toHaveBeenCalledWith('Exceção de hierarquia revogada com sucesso.');
  });

  it.each([
    {nova: true, mensagem: 'Aprovador de exceção designado com sucesso.'},
    {nova: false, mensagem: 'Aprovador de exceção atualizado com sucesso.'}
  ])('informa a operação de salvamento antes de alterar o setor: $mensagem', ({nova, mensagem}) => {
    if (nova) service.revogarExcecao('sec-geral-1');
    const fixture = TestBed.createComponent(ExcecaoHierarquiaForm);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.selectedServidor.set(service.getServidor('170'));
    component.form.patchValue({modalidade: 'SOBREPOE_SEMPRE', justificativa: 'Justificativa válida.'});

    vi.useFakeTimers();
    try {
      component.onSalvar();
      vi.advanceTimersByTime(150);
      expect(service.getSetor('sec-geral-1')?.aprovadorVigente?.situacao).toBe('ATIVO');
      expect(TestBed.inject(SToastService).success).toHaveBeenCalledWith(mensagem);
      expect(modalService.open).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('mantém a busca por matrícula e a seleção do servidor', () => {
    const fixture = TestBed.createComponent(ExcecaoHierarquiaForm);
    const component = fixture.componentInstance;
    component.servidorBuscaTexto.set('185');
    const opcao = component.servidorOptions()[0];

    expect(opcao.value).toBe('185');
    component.onServidorSelectionChange(opcao);
    expect(component.selectedServidor()?.matricula).toBe('185');
  });

  it('bloqueia saída sem confirmação quando há alterações pendentes (canDeactivate)', async () => {
    const fixture = TestBed.createComponent(ExcecaoHierarquiaForm);
    const component = fixture.componentInstance;
    component.setorId.set('sec-geral-1');
    component.ngOnInit();

    component.form.controls.justificativa.setValue('Alteração não salva');
    expect(component.hasPendingChanges()).toBe(true);

    vi.spyOn(modalService, 'confirm').mockResolvedValue(false);
    const canExit = await component.canDeactivate();
    expect(canExit).toBe(false);

    vi.spyOn(modalService, 'confirm').mockResolvedValue(true);
    const canExitConfirmed = await component.canDeactivate();
    expect(canExitConfirmed).toBe(true);

    const guardResult = await excecaoHierarquiaFormDeactivateGuard(component, null as never, null as never, null as never);
    expect(guardResult).toBe(true);
  });
});

describe('Exceção de Hierarquia - Visualização (View)', () => {
  let router: Router;
  let modalService: SModalService;
  let service: ExcecaoHierarquiaService;
  const storage = new Map<string, string>();

  beforeEach(async () => {
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear()
    });

    await TestBed.configureTestingModule({
      imports: [ExcecaoHierarquiaView],
      providers: [
        provideRouter([
          {path: 'configuracoes/hierarquia/excecao-hierarquia', component: ExcecaoHierarquiaList},
          {path: 'configuracoes/hierarquia/excecao-hierarquia/:id', component: ExcecaoHierarquiaView}
        ]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({id: 'sec-geral-1'})
            }
          }
        },
        {provide: SToastService, useValue: {success: vi.fn(), warning: vi.fn(), error: vi.fn(), info: vi.fn()}},
        {provide: SModalService, useValue: {confirm: vi.fn().mockResolvedValue(true), open: vi.fn()}}
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    modalService = TestBed.inject(SModalService);
    service = TestBed.inject(ExcecaoHierarquiaService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renderiza dados do setor e histórico de exceções', () => {
    const fixture = TestBed.createComponent(ExcecaoHierarquiaView);
    const component = fixture.componentInstance;
    component.setorId.set('sec-geral-1');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('s-page-header')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('s-table')).not.toBeNull();

    const setor = component.setor();
    expect(setor).toBeDefined();
    expect(setor?.nome).toContain('Secretaria');
    expect(service.getSetor('sec-geral-1')).toBeDefined();
  });

  it('abre o modal DetalhesExcecaoModal ao clicar para visualizar registro de histórico', () => {
    const openSpy = vi.spyOn(modalService, 'open');
    const fixture = TestBed.createComponent(ExcecaoHierarquiaView);
    const component = fixture.componentInstance;
    component.setorId.set('sec-geral-1');
    fixture.detectChanges();

    const historicoItem = component.setor()!.historico[0];
    component.abrirDetalhesRegistro(historicoItem);

    expect(openSpy).toHaveBeenCalledWith(DetalhesExcecaoModal, expect.objectContaining({
      data: { registro: historicoItem }
    }));
  });
});

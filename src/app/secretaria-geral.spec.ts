import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {provideRouter, Router} from '@angular/router';
import {provideSiageDateAdapter, SModalService, SToastService} from '@siage/siage-ui';
import {Subject} from 'rxjs';
import {vi} from 'vitest';
import {AnexarNormativaExtincaoModal, BuscaServidorModal, HistoricoAtosModal, ImpedimentoInativacaoModal, SecretariaGeralForm, SecretariaGeralList, SecretariaGeralService, SecretariaGeralView, VisualizarDocumentoModal} from './secretaria-geral';
import {ScenarioType, SimulatorService} from './simulator';

describe('Secretaria Geral', () => {
  const scenario = signal<ScenarioType>('normal');

  beforeEach(async () => {
    scenario.set('normal');
    await TestBed.configureTestingModule({
      imports: [SecretariaGeralList, SecretariaGeralForm, SecretariaGeralView],
      providers: [
        provideRouter([]),
        provideSiageDateAdapter(),
        {provide: SimulatorService, useValue: {currentScenario: scenario, allowCreation: signal(true), setScenario: vi.fn()}}
      ]
    }).overrideComponent(SecretariaGeralForm, {
      set: {providers: [{provide: SToastService, useValue: {success: vi.fn(), warning: vi.fn(), info: vi.fn()}}]}
    }).overrideComponent(SecretariaGeralView, {
      set: {providers: [{provide: SToastService, useValue: {success: vi.fn(), warning: vi.fn(), info: vi.fn()}}]}
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('mantém filtros, bloqueio de inclusão e navegação da listagem', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(SecretariaGeralList);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const add = fixture.nativeElement.querySelector('s-button[icon="add"] button') as HTMLButtonElement;
    expect(add.disabled).toBe(true);
    expect(component.canBuscar()).toBe(false);
    component.filtroForm.controls.nome.setValue('nome inexistente');
    component.filtroForm.controls.status.setValue('INATIVO');
    fixture.detectChanges();
    expect(component.canBuscar()).toBe(true);
    component.onBuscar();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhum resultado encontrado');
    component.onLimpar();
    fixture.detectChanges();
    expect(component.filtroForm.controls.status.value).toBe('TODOS');
    expect(component.filtroForm.controls.nome.value).toBe('');
    fixture.nativeElement.querySelector('s-icon-button button[aria-label="Visualizar Secretaria Geral"]').click();
    expect(navigate).toHaveBeenCalledWith(['/configuracoes/hierarquia/secretaria-geral/1']);
    fixture.destroy();
  });

  it('não inativa ao cancelar e mostra os impedimentos após confirmação', async () => {
    const fixture = TestBed.createComponent(SecretariaGeralList);
    fixture.detectChanges();
    const item = TestBed.inject(SecretariaGeralService).items().find(record => record.status === 'ATIVO')!;
    const modal = fixture.debugElement.injector.get(SModalService);
    const confirm = vi.spyOn(modal, 'confirm').mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const open = vi.spyOn(modal, 'open').mockReturnValue({} as never);
    fixture.componentInstance.onToggleStatus(item);
    await Promise.resolve();
    expect(item.status).toBe('ATIVO');
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
    fixture.componentInstance.onToggleStatus(item);
    await Promise.resolve();
    expect(item.status).toBe('ATIVO');
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(open).toHaveBeenCalledWith(ImpedimentoInativacaoModal, expect.any(Object));
    fixture.destroy();
  });

  it('exibe apenas as ações permitidas e mantém sua ordem', async () => {
    const fixture = TestBed.createComponent(SecretariaGeralList);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
    const actions = (row: HTMLTableRowElement) => Array.from(row.querySelectorAll('td:last-child s-icon-button, td:last-child s-switch')).map(element => element.tagName.toLowerCase());
    expect(actions(rows[0])).toEqual(['s-icon-button', 's-icon-button', 's-switch']);
    expect(actions(rows[1])).toEqual(['s-icon-button', 's-switch']);
    expect(rows[0].querySelectorAll('s-icon-button[size="sm"]').length).toBe(2);
    TestBed.inject(SimulatorService).allowCreation.set(false);
    fixture.detectChanges();
    expect(actions(rows[0])).toEqual(['s-icon-button']);
    expect(actions(rows[1])).toEqual(['s-icon-button']);
    fixture.destroy();
  });

  it('mantém o estado do switch ao cancelar, encontrar impedimentos ou tentar reativar', async () => {
    const fixture = TestBed.createComponent(SecretariaGeralList);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const modal = fixture.debugElement.injector.get(SModalService);
    const confirm = vi.spyOn(modal, 'confirm');
    const open = vi.spyOn(modal, 'open').mockReturnValue({} as never);
    const warning = vi.spyOn(fixture.debugElement.injector.get(SToastService), 'warning').mockReturnValue(0);
    const switches = fixture.nativeElement.querySelectorAll('s-switch input') as NodeListOf<HTMLInputElement>;
    let cancelar!: (value: boolean) => void;
    confirm.mockReturnValueOnce(new Promise(resolve => { cancelar = resolve; }));
    switches[0].click();
    expect(switches[0].checked).toBe(true);
    cancelar(false);
    await Promise.resolve();
    fixture.detectChanges();
    expect(switches[0].checked).toBe(true);
    confirm.mockResolvedValueOnce(true);
    switches[0].click();
    await Promise.resolve();
    expect(switches[0].checked).toBe(true);
    expect(open).toHaveBeenCalledWith(ImpedimentoInativacaoModal, expect.any(Object));
    switches[1].click();
    expect(switches[1].checked).toBe(false);
    expect(warning).toHaveBeenCalledOnce();
    fixture.destroy();
  });

  it('atualiza o switch após inativação confirmada e permitida', async () => {
    const service = TestBed.inject(SecretariaGeralService);
    service.aplicarCenario('inativacao_permitida');
    const fixture = TestBed.createComponent(SecretariaGeralList);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    vi.spyOn(fixture.debugElement.injector.get(SModalService), 'confirm').mockResolvedValue(true);
    vi.spyOn(fixture.debugElement.injector.get(SToastService), 'success').mockReturnValue(0);
    (fixture.nativeElement.querySelector('s-switch input') as HTMLInputElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(service.getItem('1')?.status).toBe('INATIVO');
    expect((fixture.nativeElement.querySelector('s-switch input') as HTMLInputElement).checked).toBe(false);
    fixture.destroy();
  });

  it('atualiza o switch apenas após anexar a normativa de extinção', async () => {
    const service = TestBed.inject(SecretariaGeralService);
    service.aplicarCenario('inativacao_anexar_normativa');
    const fixture = TestBed.createComponent(SecretariaGeralList);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const modal = fixture.debugElement.injector.get(SModalService);
    const normativa = new Subject<{nome: string; numero: string; dataPublicacao: string}>();
    vi.spyOn(modal, 'confirm').mockResolvedValue(true);
    vi.spyOn(modal, 'open').mockReturnValue({afterClosed: () => normativa} as never);
    vi.spyOn(fixture.debugElement.injector.get(SToastService), 'success').mockReturnValue(0);
    (fixture.nativeElement.querySelector('s-switch input') as HTMLInputElement).click();
    await Promise.resolve();
    fixture.detectChanges();
    expect(service.getItem('1')?.status).toBe('ATIVO');
    expect((fixture.nativeElement.querySelector('s-switch input') as HTMLInputElement).checked).toBe(true);
    normativa.next({nome: 'Normativa', numero: '1', dataPublicacao: '01/01/2024'});
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(service.getItem('1')?.status).toBe('INATIVO');
    expect((fixture.nativeElement.querySelector('s-switch input') as HTMLInputElement).checked).toBe(false);
    fixture.destroy();
  });

  it.each([true, false])('mantém a seleção e a indisponibilidade no modal (visual local: %s)', visualSecretariaGeral => {
    const close = vi.fn();
    TestBed.overrideProvider(MAT_DIALOG_DATA, {useValue: {utbCodigo: 'UTB-001', utbDescricao: 'UTB-001', visualSecretariaGeral}});
    TestBed.overrideProvider(MatDialogRef, {useValue: {close}});
    const fixture = TestBed.createComponent(BuscaServidorModal);
    fixture.detectChanges();
    const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
    const available = rows.find(row => row.textContent?.includes('Ana Beatriz Vasconcelos'))!;
    const unavailable = rows.find(row => row.textContent?.includes('Patrícia Helena Farias'))!;
    expect(available.querySelector('button[aria-label="Adicionar"]')).not.toBeNull();
    expect(unavailable.textContent).toContain('Indisponível');
    expect(unavailable.querySelector('button')).toBeNull();
    expect(!!available.querySelector('s-icon-button')).toBe(visualSecretariaGeral);
    expect(!!unavailable.querySelector('s-badge')).toBe(visualSecretariaGeral);
    available.querySelector<HTMLButtonElement>('button[aria-label="Adicionar"]')!.click();
    expect(close).toHaveBeenCalledWith(expect.objectContaining({nome: 'Ana Beatriz Vasconcelos'}));
    fixture.destroy();
  });

  it('baixa documentos nos modais compartilhados sem toast de início', () => {
    const documento = {id: 'doc', nomeArquivo: 'doc.pdf', tamanho: '1 KB', tipo: 'pdf' as const, dataUpload: '01/01/2025', urlSimulada: '/doc.pdf'};
    const ato = {id: 'ato', numero: '1', chefeImediato: 'Chefe', dataPublicacao: '01/01/2025', dataImportacao: '01/01/2025', responsavelImportacao: 'Responsável', documento};
    const createObjectURL = vi.fn().mockReturnValue('blob:ato');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', Object.assign(class extends URL {}, {createObjectURL, revokeObjectURL}));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    TestBed.overrideProvider(MAT_DIALOG_DATA, {useValue: {documento, atos: [ato]}});
    TestBed.overrideProvider(MatDialogRef, {useValue: {close: vi.fn()}});
    const success = vi.spyOn(TestBed.inject(SToastService), 'success');

    const visualizacao = TestBed.createComponent(VisualizarDocumentoModal);
    visualizacao.componentInstance.baixar();
    expect(click).toHaveBeenCalledOnce();
    const historico = TestBed.createComponent(HistoricoAtosModal);
    historico.componentInstance.baixar(ato);
    expect(click).toHaveBeenCalledTimes(2);
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:ato');
    expect(success).not.toHaveBeenCalled();
    visualizacao.destroy();
    historico.destroy();
  });

  it.each(['histórico', 'normativa'] as const)('isola o documento aberto de %s e fecha apenas com Escape', origem => {
    const teclado = new Subject<KeyboardEvent>();
    const fechado = new Subject<void>();
    const close = vi.fn();
    const open = vi.fn().mockReturnValue({keydownEvents: () => teclado, afterClosed: () => fechado, close});
    TestBed.overrideProvider(MatDialog, {useValue: {open}});
    TestBed.overrideProvider(MAT_DIALOG_DATA, {useValue: origem === 'histórico' ? {atos: []} : {nome: 'Secretaria'}});
    TestBed.overrideProvider(MatDialogRef, {useValue: {close: vi.fn()}});
    const documento = {id: 'doc', nomeArquivo: 'doc.pdf', tamanho: '1 KB', tipo: 'pdf' as const, dataUpload: '01/01/2025'};
    const fixture = origem === 'histórico'
      ? TestBed.createComponent(HistoricoAtosModal)
      : TestBed.createComponent(AnexarNormativaExtincaoModal);
    if (fixture.componentInstance instanceof HistoricoAtosModal) {
      fixture.componentInstance.visualizar({id: 'ato', numero: '1', chefeImediato: 'Chefe', dataPublicacao: '01/01/2025', dataImportacao: '01/01/2025', responsavelImportacao: 'Responsável', documento});
    } else {
      fixture.componentInstance.visualizarDoc(documento);
    }
    expect(open).toHaveBeenCalledWith(VisualizarDocumentoModal, expect.objectContaining({
      disableClose: true,
      restoreFocus: true,
      panelClass: expect.arrayContaining(['sg-documento-aninhado']),
      backdropClass: expect.arrayContaining(['sg-documento-aninhado-backdrop'])
    }));
    teclado.next(new KeyboardEvent('keydown', {key: 'Tab'}));
    expect(close).not.toHaveBeenCalled();
    const escape = new KeyboardEvent('keydown', {key: 'Escape', cancelable: true});
    teclado.next(escape);
    expect(escape.defaultPrevented).toBe(true);
    expect(close).toHaveBeenCalledOnce();
    fechado.next();
    teclado.next(new KeyboardEvent('keydown', {key: 'Escape'}));
    expect(close).toHaveBeenCalledOnce();
    fixture.destroy();
  });

  it('mantém o ato fictício dentro do limite de 20 caracteres', () => {
    const numero = TestBed.inject(SecretariaGeralService).getItem('1')?.chefeImediato?.atoGovernamental?.numero;
    expect(numero).toBe('1.420/2024');
    expect(numero!.length).toBeLessThanOrEqual(20);
  });

  it('preserva validação e confirmação de alterações não salvas', async () => {
    const fixture = TestBed.createComponent(SecretariaGeralForm);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    vi.spyOn(component, 'focusPrimeiroCampoInvalido');
    component.onSalvar();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('O Nome da Secretaria Geral é obrigatório.');
    expect(fixture.nativeElement.querySelector('s-field[controlid="form-nome"] .s-field__counter')).toBeNull();
    component.form.controls.nome.setValue('Secretaria de teste');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('s-field[controlid="form-nome"] .s-field__counter').textContent.trim()).toBe('19/200');
    expect(component.hasUnsavedChanges()).toBe(true);
    const confirm = vi.spyOn(fixture.debugElement.injector.get(SModalService), 'confirm')
      .mockResolvedValue(false);
    expect(await component.canDeactivate()).toBe(false);
    expect(confirm).toHaveBeenCalledOnce();
    fixture.destroy();
  });

  it('integra as três datas ao datepicker oficial preservando o formato e os limites', () => {
    const fixture = TestBed.createComponent(SecretariaGeralForm);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const fields = [
      [component.atoDataControl, component.atoDataPicker],
      [component.normCriacaoDataControl, component.normCriacaoDataPicker],
      [component.normExtincaoDataControl, component.normExtincaoDataPicker]
    ] as const;
    for (const [control, picker] of fields) {
      control.setValue('15/01/2024');
      expect(picker.dateControl.value).toEqual(new Date(2024, 0, 15));
      picker.dateControl.setValue(new Date(2100, 11, 31));
      expect(control.value).toBe('31/12/2100');
      control.setValue('01/01/1899');
      expect(picker.dateControl.value).toBeNull();
      control.setValue('01/01/2101');
      expect(picker.dateControl.value).toBeNull();
    }
    expect(fixture.nativeElement.querySelector('s-field[controlid="form-norm-criacao-data"] s-datepicker')).not.toBeNull();
    component.expandindoNormativaExtincao.set(true);
    component.chefeImediato.set(TestBed.inject(SecretariaGeralService).getItem('1')!.chefeImediato);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('s-field[controlid="form-norm-ext-data"] s-datepicker')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('s-field[controlid="form-ato-data"] s-datepicker')).not.toBeNull();
    fixture.destroy();
  });

  it('mantém a validação de data inválida e a mensagem existente', () => {
    const fixture = TestBed.createComponent(SecretariaGeralForm);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    vi.spyOn(component, 'focusPrimeiroCampoInvalido');
    const input = fixture.nativeElement.querySelector('s-field[controlid="form-norm-criacao-data"] input') as HTMLInputElement;
    input.value = '31/02/2025';
    input.dispatchEvent(new Event('input', {bubbles: true}));
    input.dispatchEvent(new Event('change', {bubbles: true}));
    input.dispatchEvent(new FocusEvent('focusout', {bubbles: true}));
    component.onSalvar();
    fixture.detectChanges();
    expect(component.normCriacaoDataControl.value).toBe('31/02/2025');
    expect(input.value).toBe('31/02/2025');
    expect(fixture.nativeElement.querySelector('s-field[controlid="form-norm-criacao-data"]').textContent)
      .toContain('Informe uma data válida no formato DD/MM/AAAA.');
    fixture.destroy();
  });

  it('impede data futura digitada e revalida ao salvar', () => {
    const fixture = TestBed.createComponent(SecretariaGeralForm);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    vi.spyOn(component, 'focusPrimeiroCampoInvalido');
    const add = vi.spyOn(TestBed.inject(SecretariaGeralService), 'add');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const input = fixture.nativeElement.querySelector('s-field[controlid="form-norm-criacao-data"] input') as HTMLInputElement;
    input.value = tomorrow.toLocaleDateString('pt-BR');
    input.dispatchEvent(new Event('input', {bubbles: true}));
    input.dispatchEvent(new Event('change', {bubbles: true}));
    input.dispatchEvent(new FocusEvent('blur'));
    input.dispatchEvent(new FocusEvent('focusout', {bubbles: true}));
    component.onSalvar();
    fixture.detectChanges();
    expect(component.normCriacaoDataControl.getError('dataRange')).toBe('A data não pode ser futura.');
    expect(fixture.nativeElement.querySelector('s-field[controlid="form-norm-criacao-data"]').textContent).toContain('A data não pode ser futura.');
    expect(add).not.toHaveBeenCalled();
    expect(component.dataMaxima.toDateString()).toBe(new Date().toDateString());
    component.normCriacaoDataControl.setValue(new Date().toLocaleDateString('pt-BR'));
    expect(component.normCriacaoDataControl.hasError('dataRange')).toBe(false);
    fixture.destroy();
  });

  it.each(['ato', 'criacao', 'extincao'] as const)('valida e anexa arquivos no campo %s', tipo => {
    const fixture = TestBed.createComponent(SecretariaGeralForm);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    if (tipo === 'ato') component.chefeImediato.set(TestBed.inject(SecretariaGeralService).getItem('1')!.chefeImediato);
    if (tipo === 'extincao') component.expandindoNormativaExtincao.set(true);
    fixture.detectChanges();
    const upload = fixture.nativeElement.querySelector(`#container-anexo-${tipo} s-file-upload`) as HTMLElement;
    expect(upload).not.toBeNull();
    expect((upload.querySelector('button') as HTMLButtonElement).disabled).toBe(true);
    if (tipo === 'ato') {
      component.atoNumeroControl.setValue('123');
      component.atoDataControl.setValue('01/01/2025');
    } else if (tipo === 'criacao') {
      component.normCriacaoNomeControl.setValue('Decreto');
      component.normCriacaoNumeroControl.setValue('123');
      component.normCriacaoDataControl.setValue('01/01/2025');
    } else {
      component.normExtincaoNomeControl.setValue('Lei');
      component.normExtincaoNumeroControl.setValue('123');
      component.normExtincaoDataControl.setValue('01/01/2025');
    }
    fixture.detectChanges();
    expect((upload.querySelector('button') as HTMLButtonElement).disabled).toBe(false);
    const input = upload.querySelector('input[type="file"]') as HTMLInputElement;
    const selecionar = (file: File) => {
      Object.defineProperty(input, 'files', {value: [file], configurable: true});
      input.dispatchEvent(new Event('change', {bubbles: true}));
      fixture.detectChanges();
    };
    const documento = tipo === 'ato' ? component.atoDocumento : tipo === 'criacao' ? component.normCriacaoDoc : component.normExtincaoDoc;
    const warning = fixture.debugElement.injector.get(SToastService).warning;
    selecionar(new File(['texto'], 'teste.txt', {type: 'text/plain'}));
    expect(documento()).toBeUndefined();
    expect(warning).toHaveBeenLastCalledWith('Formato inválido. Selecione um arquivo PDF, JPG, JPEG ou PNG.');
    selecionar(new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'grande.pdf', {type: 'application/pdf'}));
    expect(documento()).toBeUndefined();
    expect(warning).toHaveBeenLastCalledWith('O arquivo excede o limite máximo permitido de 10 MB.');
    selecionar(new File([new Uint8Array(10 * 1024 * 1024)], 'documento.JPEG', {type: 'image/jpeg'}));
    expect(documento()?.nomeArquivo).toBe('documento.JPEG');
    expect(upload.querySelector('.s-file-upload__nome')?.textContent).toContain('documento.JPEG');
    expect(upload.querySelector('.s-file-upload__tamanho')?.textContent).toContain('10.0 MB');
    expect(upload.querySelector('button[aria-label="Baixar arquivo"]')).not.toBeNull();
    const container = fixture.nativeElement.querySelector(`#container-anexo-${tipo}`) as HTMLElement;
    const visualizar = vi.spyOn(component, 'visualizarDoc');
    (container.querySelector('button[aria-label="Visualizar anexo"]') as HTMLButtonElement).click();
    expect(visualizar).toHaveBeenCalledWith(documento(), expect.any(String));
    (upload.querySelector('button[aria-label="Remover arquivo"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(documento()).toBeUndefined();
    expect(upload.querySelector('.s-file-upload__arquivo')).toBeNull();
    fixture.destroy();
  });

  it('valida campos obrigatórios no blur e exibe erro de anexo apenas quando habilitado', () => {
    const fixture = TestBed.createComponent(SecretariaGeralForm);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    vi.spyOn(component, 'focusPrimeiroCampoInvalido');
    component.expandindoNormativaExtincao.set(true);
    fixture.detectChanges();

    const nomeInput = fixture.nativeElement.querySelector('#form-norm-criacao-nome') as HTMLInputElement;
    expect(fixture.nativeElement.querySelector('s-field[controlid="form-norm-criacao-nome"] .s-field__error').textContent.trim()).toBe('');
    nomeInput.dispatchEvent(new FocusEvent('focusout', {bubbles: true}));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('s-field[controlid="form-norm-criacao-nome"] .s-field__error').textContent)
      .toContain('O Nome da Normativa de Criação é obrigatório.');

    const dataInput = fixture.nativeElement.querySelector('#form-norm-criacao-data') as HTMLInputElement;
    dataInput.dispatchEvent(new FocusEvent('focusout', {bubbles: true}));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('s-field[controlid="form-norm-criacao-data"] .s-field__error').textContent)
      .toContain('A Data da Publicação é obrigatória.');

    component.confirmarAdicaoNormativaExtincao();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#container-anexo-extincao .s-field__error').textContent.trim()).toBe('');

    component.normExtincaoNomeControl.setValue('Lei 184');
    component.normExtincaoNumeroControl.setValue('184');
    component.normExtincaoDataControl.setValue('10/10/2024');
    fixture.detectChanges();
    component.confirmarAdicaoNormativaExtincao();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#container-anexo-extincao .s-field__error').textContent)
      .toContain('É obrigatório anexar o documento da Normativa de Extinção.');
    fixture.destroy();
  });

  it.each(['ato', 'criacao', 'extincao'] as const)('focaliza a área visível do anexo %s', tipo => {
    const fixture = TestBed.createComponent(SecretariaGeralForm);
    const component = fixture.componentInstance;
    if (tipo === 'ato') component.chefeImediato.set(TestBed.inject(SecretariaGeralService).getItem('1')!.chefeImediato);
    if (tipo === 'extincao') component.expandindoNormativaExtincao.set(true);
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector(`#container-anexo-${tipo}`) as HTMLElement;
    const area = container.querySelector('[tabindex="0"]') as HTMLElement;
    const arquivo = container.querySelector('input[type="file"]') as HTMLInputElement;
    const scroll = vi.fn();
    Object.defineProperty(area, 'scrollIntoView', {value: scroll, configurable: true});
    const focusArea = vi.spyOn(area, 'focus');
    const focusArquivo = vi.spyOn(arquivo, 'focus');
    vi.spyOn(document, 'getElementById').mockReturnValue(container);
    vi.useFakeTimers();
    component.focusPrimeiroCampoInvalido(`container-anexo-${tipo}`);
    vi.advanceTimersByTime(100);
    expect(scroll).toHaveBeenCalledWith({behavior: 'smooth', block: 'center'});
    expect(focusArea).toHaveBeenCalledOnce();
    expect(focusArquivo).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('salva os dados válidos e bloqueia a ação durante o salvamento', () => {
    const fixture = TestBed.createComponent(SecretariaGeralForm);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const add = vi.spyOn(TestBed.inject(SecretariaGeralService), 'add');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component.form.patchValue({nome: 'Secretaria de teste', utbCodigo: 'UTB-001'});
    component.normCriacaoNomeControl.setValue('Decreto de criação');
    component.normCriacaoNumeroControl.setValue('123');
    component.normCriacaoDataControl.setValue('01/01/2025');
    component.normCriacaoDoc.set({id: 'doc', nomeArquivo: 'ato.pdf', tamanho: '1 KB', tipo: 'pdf', dataUpload: '01/01/2025'});
    fixture.detectChanges();
    vi.useFakeTimers();
    component.onSalvar();
    fixture.detectChanges();
    expect(component.isSaving()).toBe(true);
    expect((fixture.nativeElement.querySelector('s-button[loadingtext="Salvando..."] button') as HTMLButtonElement).disabled).toBe(true);
    vi.advanceTimersByTime(400);
    expect(add).toHaveBeenCalledOnce();
    expect(fixture.debugElement.injector.get(SToastService).success).toHaveBeenCalledWith('Registro cadastrado com sucesso.');
    expect(navigate).toHaveBeenCalledWith(['/configuracoes/hierarquia/secretaria-geral']);
    fixture.destroy();
  });

  it('visualiza dados, anexos, histórico, filtros, paginação e navegação com componentes oficiais', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(SecretariaGeralView);
    const component = fixture.componentInstance;
    component.item.set(TestBed.inject(SecretariaGeralService).getItem('1'));
    fixture.detectChanges();
    const dialog = vi.spyOn(fixture.debugElement.injector.get(SModalService), 'open').mockReturnValue({} as never);
    const success = fixture.debugElement.injector.get(SToastService).success;

    expect(fixture.nativeElement.querySelectorAll('s-file-upload').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('s-file-upload button[aria-label="Remover arquivo"]').length).toBe(0);
    (fixture.nativeElement.querySelector('s-icon-button button[aria-label="Visualizar anexo"]') as HTMLButtonElement).click();
    expect(dialog).toHaveBeenCalledWith(VisualizarDocumentoModal, expect.objectContaining({data: expect.objectContaining({tipoDocumento: 'Ato Governamental'})}));
    (fixture.nativeElement.querySelector('s-file-upload button[aria-label="Baixar arquivo"]') as HTMLButtonElement).click();
    expect(success).not.toHaveBeenCalled();
    (fixture.nativeElement.querySelector('s-button[icon="history"] button') as HTMLButtonElement).click();
    expect(dialog).toHaveBeenLastCalledWith(HistoricoAtosModal, expect.any(Object));

    expect(component.canBuscar()).toBe(false);
    component.filtroNome.setValue('Modernização');
    fixture.detectChanges();
    expect(component.canBuscar()).toBe(true);
    component.onBuscar();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('s-table tbody tr').length).toBe(1);
    component.onLimpar();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('s-table tbody tr').length).toBe(2);
    component.onPageSizeChange(25);
    component.onPageChange(1);
    expect(component.pageSize()).toBe(25);
    expect(component.pageIndex()).toBe(1);

    (fixture.nativeElement.querySelector('s-button[icon="edit"] button') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith(['/configuracoes/hierarquia/secretaria-geral/1/editar']);
    component.goBack();
    expect(navigate).toHaveBeenLastCalledWith(['/configuracoes/hierarquia/secretaria-geral']);
    fixture.destroy();
  });
});

describe('Anexar normativa de extinção compartilhado', () => {
  it('disponibiliza o campo de data sem adaptador global', async () => {
    await TestBed.configureTestingModule({
      imports: [AnexarNormativaExtincaoModal],
      providers: [
        {provide: MAT_DIALOG_DATA, useValue: {nome: 'Secretaria'}},
        {provide: MatDialogRef, useValue: {close: vi.fn()}}
      ]
    }).compileComponents();
    const fixture = TestBed.createComponent(AnexarNormativaExtincaoModal);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('#modal-norm-data') as HTMLInputElement;
    expect(input).not.toBeNull();
    input.value = '15/01/2025';
    input.dispatchEvent(new Event('input', {bubbles: true}));
    input.dispatchEvent(new Event('change', {bubbles: true}));
    expect(fixture.componentInstance.form.controls.dataPublicacao.value).toBe('15/01/2025');
    fixture.destroy();
  });

  it('bloqueia a conclusão com data futura', async () => {
    const close = vi.fn();
    await TestBed.configureTestingModule({
      imports: [AnexarNormativaExtincaoModal],
      providers: [
        {provide: MAT_DIALOG_DATA, useValue: {nome: 'Secretaria'}},
        {provide: MatDialogRef, useValue: {close}}
      ]
    }).compileComponents();
    vi.spyOn(TestBed.inject(SToastService), 'warning').mockReturnValue(0);
    const fixture = TestBed.createComponent(AnexarNormativaExtincaoModal);
    fixture.detectChanges();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    fixture.componentInstance.form.patchValue({nome: 'Normativa', numero: '123', dataPublicacao: tomorrow.toLocaleDateString('pt-BR')});
    fixture.componentInstance.documento.set({id: 'doc', nomeArquivo: 'ato.pdf', tamanho: '1 KB', tipo: 'pdf', dataUpload: '01/01/2025'});
    vi.spyOn(fixture.componentInstance, 'focusPrimeiroCampoInvalidoModal');
    fixture.componentInstance.concluir();
    fixture.detectChanges();
    expect(fixture.componentInstance.form.controls.dataPublicacao.getError('dataRange')).toBe('A data não pode ser futura.');
    expect(fixture.nativeElement.textContent).toContain('A data não pode ser futura.');
    expect(close).not.toHaveBeenCalled();
    await fixture.whenStable();
    fixture.destroy();
  });
});
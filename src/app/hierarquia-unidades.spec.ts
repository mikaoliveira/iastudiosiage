import {provideZonelessChangeDetection, signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {NgModel, Validators} from '@angular/forms';
import {By} from '@angular/platform-browser';
import {ActivatedRoute, provideRouter, Router} from '@angular/router';
import {SAutocompleteComponent, SFileUploadComponent, SModalService, SSelectComponent, STableComponent, SToastService} from '@siage/siage-ui';
import {of} from 'rxjs';
import {vi} from 'vitest';
import {SecretariaExecutivaForm, SecretariaExecutivaList, SecretariaExecutivaView} from './secretaria-executiva';
import {GerenciaExecutivaForm, GerenciaExecutivaList, GerenciaExecutivaView} from './gerencia-executiva';
import {GerenciaRegionalForm, GerenciaRegionalList, GerenciaRegionalView} from './gerencia-regional';
import {SubgerenciaForm, SubgerenciaList, SubgerenciaView} from './subgerencia';
import {NucleoForm, NucleoList, NucleoView} from './nucleo';
import {AnexarNormativaExtincaoModal, DocumentoAnexo, ImpedimentoInativacaoModal, NormativaItem, SecretariaGeralService} from './secretaria-geral';
import {ScenarioType, SimulatorService} from './simulator';

const cases = [
  {name: 'Secretaria Executiva', slug: 'secretaria-executiva', list: SecretariaExecutivaList, form: SecretariaExecutivaForm, view: SecretariaExecutivaView},
  {name: 'Gerência Executiva', slug: 'gerencia-executiva', list: GerenciaExecutivaList, form: GerenciaExecutivaForm, view: GerenciaExecutivaView},
  {name: 'Gerência Regional', slug: 'gerencia-regional', list: GerenciaRegionalList, form: GerenciaRegionalForm, view: GerenciaRegionalView},
  {name: 'Subgerência', slug: 'subgerencia', list: SubgerenciaList, form: SubgerenciaForm, view: SubgerenciaView},
  {name: 'Núcleo', slug: 'nucleo', list: NucleoList, form: NucleoForm, view: NucleoView}
] as const;
type List = InstanceType<(typeof cases)[number]['list']>;
type Form = InstanceType<(typeof cases)[number]['form']>;
type View = InstanceType<(typeof cases)[number]['view']>;

const document: DocumentoAnexo = {id: 'teste-doc', nomeArquivo: 'normativa.pdf', tamanho: '0.1 MB', tipo: 'pdf', dataUpload: '01/01/2024'};
const normativa: NormativaItem = {nome: 'Normativa teste', numero: '1', dataPublicacao: '01/01/2024', documento: document};

describe.each(cases)('$name - migração completa', config => {
  const scenario = signal<ScenarioType>('normal');
  const modal = {confirm: vi.fn(), open: vi.fn()};
  const toast = {success: vi.fn(), warning: vi.fn(), error: vi.fn(), info: vi.fn()};
  let url: string;

  beforeEach(async () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear()
    });
    scenario.set('normal');
    url = `/configuracoes/hierarquia/${config.slug}/novo`;
    vi.clearAllMocks();
    modal.confirm.mockResolvedValue(false);
    modal.open.mockReturnValue({afterClosed: () => of(undefined)});
    await TestBed.configureTestingModule({
      imports: [config.list, config.form, config.view],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {provide: SimulatorService, useValue: {currentScenario: scenario, allowCreation: signal(true), setScenario: vi.fn()}},
        {provide: SModalService, useValue: modal},
        {provide: SToastService, useValue: toast}
      ]
    }).overrideComponent(config.list, {add: {providers: [{provide: SToastService, useValue: toast}]}})
      .compileComponents();
    vi.spyOn(TestBed.inject(Router), 'url', 'get').mockImplementation(() => url);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function listFixture() {
    const fixture = TestBed.createComponent<List>(config.list);
    fixture.detectChanges();
    return fixture;
  }

  function formFixture(edit = false) {
    if (edit) {
      const fixture = TestBed.createComponent<List>(config.list);
      const service = fixture.componentInstance.service;
      const item = service.items().find(item => item.status === 'ATIVO' && !service.isUtbEmUso(item.utbCodigo, item.id))
        ?? service.items().find(item => item.status === 'ATIVO')!;
      TestBed.inject(ActivatedRoute).snapshot.params['id'] = item.id;
      url = `/configuracoes/hierarquia/${config.slug}/${item.id}/editar`;
      fixture.destroy();
    }
    const fixture = TestBed.createComponent<Form>(config.form);
    fixture.detectChanges();
    return fixture;
  }

  it('renderiza cabeçalho, filtros, tabela e paginação oficiais', () => {
    const fixture = listFixture();
    for (const selector of ['s-page-header', 's-filter-card', 's-field', 's-input', 's-select', 's-table', 's-pagination', 's-badge', 's-switch']) {
      expect(fixture.nativeElement.querySelector(selector), selector).not.toBeNull();
    }
    expect(fixture.nativeElement.querySelector('s-field[controlId="filter-utb"] s-select')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-siage-paginator, mat-slide-toggle, mat-form-field')).toBeNull();
    fixture.destroy();
  });

  it('busca por status, nome e UTB e limpa os filtros', () => {
    const fixture = listFixture();
    const component = fixture.componentInstance;
    component.filtroForm.controls.status.setValue('INATIVO');
    fixture.detectChanges();
    expect(component.canBuscar()).toBe(true);
    component.onBuscar();
    expect(component.filteredItems().every(item => item.status === 'INATIVO')).toBe(true);
    component.onLimpar();
    const item = component.service.items()[0];
    component.filtroForm.controls.nome.setValue(item.nome);
    component.filtroForm.controls.utb.setValue(item.utbCodigo);
    component.onBuscar();
    expect(component.filteredItems().map(item => item.id)).toContain(item.id);
    component.onLimpar();
    expect(component.filteredItems().length).toBe(component.service.items().length);
    fixture.destroy();
  });

  it('ordena e pagina pelo componente oficial, incluindo quantidade por página', () => {
    const fixture = listFixture();
    const component = fixture.componentInstance;
    const table = fixture.debugElement.query(By.directive(STableComponent)).componentInstance as STableComponent;
    table.pageSizeChange.emit(2);
    fixture.detectChanges();
    expect(component.paginatedItems().length).toBe(2);
    table.pageChange.emit(2);
    fixture.detectChanges();
    expect(component.pageIndex()).toBe(1);
    table.sortChange.emit({key: 'nome', direction: 'asc'});
    expect(component.sortColumn()).toBe('nome');
    expect(component.pageIndex()).toBe(0);
    fixture.destroy();
  });

  it('preserva navegação e acesso restrito', () => {
    const fixture = listFixture();
    const component = fixture.componentInstance;
    const item = component.service.items()[0];
    component.onAdicionar();
    expect(TestBed.inject(Router).navigate).toHaveBeenLastCalledWith([`/configuracoes/hierarquia/${config.slug}/novo`]);
    component.onVisualizar(item as never);
    expect(TestBed.inject(Router).navigate).toHaveBeenLastCalledWith([`/configuracoes/hierarquia/${config.slug}`, item.id]);
    component.onEditar(item as never);
    expect(TestBed.inject(Router).navigate).toHaveBeenLastCalledWith([`/configuracoes/hierarquia/${config.slug}`, item.id, 'editar']);
    scenario.set('access_denied');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('s-table')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-acesso-restrito')).not.toBeNull();
    fixture.destroy();
  });

  it('não inativa ao cancelar e bloqueia a reativação irreversível', async () => {
    const fixture = listFixture();
    const component = fixture.componentInstance;
    const item = component.service.items().find(item => item.status === 'ATIVO')!;
    const inativar = vi.spyOn(component.service, 'inativar');
    component.onToggleStatus(item as never);
    await Promise.resolve();
    expect(inativar).not.toHaveBeenCalled();
    component.onToggleStatus({...item, status: 'INATIVO'} as never);
    expect(modal.confirm).toHaveBeenCalledTimes(1);
    expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining('irreversível'));
    fixture.destroy();
  });

  it('confirma antes de verificar impedimentos específicos', async () => {
    const fixture = listFixture();
    const component = fixture.componentInstance;
    const item = component.service.items().find(item => item.status === 'ATIVO')!;
    modal.confirm.mockResolvedValueOnce(true);
    component.onToggleStatus(item as never);
    expect(modal.open).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(modal.open).toHaveBeenCalledWith(ImpedimentoInativacaoModal, expect.objectContaining({data: expect.objectContaining({temChefe: true})}));
    if (config.slug === 'gerencia-regional') {
      expect(modal.open).toHaveBeenCalledWith(ImpedimentoInativacaoModal, expect.objectContaining({data: expect.objectContaining({unidadesDescricao: 'Núcleos e Escolas', totalProfissionais: expect.any(Number)})}));
    }
    fixture.destroy();
  });

  it('anexa normativa antes de inativar e atualiza o switch após sucesso', async () => {
    const fixture = listFixture();
    const component = fixture.componentInstance;
    const item = {...component.service.items()[0], status: 'ATIVO', chefeImediato: undefined, subordinadas: [], totalProfissionaisVinculados: 0, normativaExtincao: undefined};
    const inativar = vi.spyOn(component.service, 'inativar');
    const setValue = vi.fn();
    const chave = {control: {setValue}} as unknown as NgModel;
    modal.confirm.mockResolvedValueOnce(true);
    modal.open.mockReturnValueOnce({afterClosed: () => of(normativa)});
    component.onToggleStatus(item as never, chave);
    await Promise.resolve();
    expect(modal.open).toHaveBeenCalledWith(AnexarNormativaExtincaoModal, expect.objectContaining({data: expect.objectContaining({nome: item.nome})}));
    if (component instanceof NucleoList) expect(modal.open).toHaveBeenCalledWith(AnexarNormativaExtincaoModal, expect.objectContaining({data: expect.objectContaining({entidadeTipo: 'Núcleo'})}));
    expect(inativar).toHaveBeenCalledWith(item.id, normativa);
    expect(setValue).toHaveBeenCalledWith(false, {emitViewToModelChange: false});
    expect(toast.success).toHaveBeenCalledWith('Registro inativado com sucesso.');
    fixture.destroy();
  });

  it('renderiza o cadastro oficial e preserva as validações obrigatórias', () => {
    const fixture = formFixture();
    const component = fixture.componentInstance;
    expect(fixture.nativeElement.querySelector('s-page-header')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('s-datepicker')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('s-file-upload')).not.toBeNull();
    vi.spyOn(component, 'focusPrimeiroCampoInvalido').mockImplementation(() => undefined);
    component.onSalvar();
    fixture.detectChanges();
    expect(component.form.controls.nome.hasError('required')).toBe(true);
    expect(toast.warning).toHaveBeenCalledWith('Verifique os campos obrigatórios destacados no formulário.');
    expect(component.isSaving()).toBe(false);
    if (component instanceof SubgerenciaForm) {
      expect(component.form.controls.cep.hasValidator(Validators.required)).toBe(false);
      expect(component.form.controls.municipio.hasValidator(Validators.required)).toBe(false);
    }
    if (component instanceof NucleoForm) {
      expect(component.form.controls.cep.hasError('required')).toBe(true);
      expect(component.form.controls.rua.hasError('required')).toBe(true);
      expect(component.form.controls.unidadeSuperiorId.hasError('required')).toBe(true);
    }
    fixture.destroy();
  });

  it('habilita anexação somente com campos válidos e preserva mensagens de tamanho', () => {
    const fixture = formFixture();
    const component = fixture.componentInstance;
    const upload = fixture.debugElement.queryAll(By.directive(SFileUploadComponent)).map(node => node.componentInstance as SFileUploadComponent)[0];
    expect(component.arquivoCriacaoControl.disabled).toBe(true);
    component.normCriacaoNomeControl.setValue('Normativa');
    component.normCriacaoNumeroControl.setValue('1');
    component.normCriacaoDataControl.setValue('01/01/2024');
    fixture.detectChanges();
    expect(component.arquivoCriacaoControl.enabled).toBe(true);
    upload.fileSelected.emit(null);
    component.onFileUploadError({kind: 'size', file: new File([], 'normativa.pdf'), message: ''});
    if (component instanceof NucleoForm || component instanceof SubgerenciaForm) expect(toast.error).toHaveBeenCalledWith('O arquivo deve ter no máximo 10 MB.');
    else expect(toast.warning).toHaveBeenCalledWith('O arquivo excede o limite máximo permitido de 10 MB.');
    fixture.destroy();
  });

  it('mantém a data digitada inválida e sincroniza a seleção do calendário', () => {
    const fixture = formFixture();
    const component = fixture.componentInstance;
    const input = globalThis.document.createElement('input');
    input.value = '31/02/2024';
    const event = {target: input} as unknown as Event;
    component.normCriacaoDataPicker.onInput(event);
    component.normCriacaoDataPicker.onFocusOut(event as FocusEvent);
    expect(component.normCriacaoDataControl.value).toBe('31/02/2024');
    expect(component.normCriacaoDataControl.hasError('dataFormato')).toBe(true);
    component.normCriacaoDataPicker.dateControl.setValue(new Date(2024, 0, 15));
    expect(component.normCriacaoDataControl.value).toBe('15/01/2024');
    fixture.destroy();
  });

  it('rejeita datas futuras nos três campos e revalida ao salvar', () => {
    const fixture = formFixture();
    const component = fixture.componentInstance;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const future = tomorrow.toLocaleDateString('pt-BR');
    for (const control of [component.atoDataControl, component.normCriacaoDataControl, component.normExtincaoDataControl]) {
      control.setValue(future);
      expect(control.getError('dataRange')).toBe('A data não pode ser futura.');
    }
    component.expandindoNormativaExtincao.set(true);
    vi.spyOn(component, 'focusPrimeiroCampoInvalido').mockImplementation(() => undefined);
    component.onSalvar();
    fixture.detectChanges();
    expect(component.normCriacaoDataControl.getError('dataRange')).toBe('A data não pode ser futura.');
    expect(component.normExtincaoDataControl.getError('dataRange')).toBe('A data não pode ser futura.');
    expect(fixture.nativeElement.textContent).toContain('A data não pode ser futura.');
    expect(component.isSaving()).toBe(false);
    expect(component.dataMaxima.toDateString()).toBe(new Date().toDateString());
    component.normCriacaoDataControl.setValue(new Date().toLocaleDateString('pt-BR'));
    expect(component.normCriacaoDataControl.hasError('dataRange')).toBe(false);
    fixture.destroy();
  });

  it('impede atualização com data futura no ato governamental', () => {
    const fixture = formFixture(true);
    const component = fixture.componentInstance;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    component.chefeImediato.set({
      matricula: '123', cpf: '123', nome: 'Servidor', cargo: 'Cargo', situacaoFuncional: 'Em exercício',
      atoGovernamental: {numero: '123', dataPublicacao: '01/01/2024', documento: document}
    });
    component.atoNumeroControl.setValue('123');
    component.atoDataControl.setValue(tomorrow.toLocaleDateString('pt-BR'));
    vi.spyOn(component, 'focusPrimeiroCampoInvalido').mockImplementation(() => undefined);
    component.onSalvar();
    fixture.detectChanges();
    expect(component.atoDataControl.getError('dataRange')).toBe('A data não pode ser futura.');
    expect(fixture.nativeElement.textContent).toContain('A data não pode ser futura.');
    expect(component.isSaving()).toBe(false);
    fixture.destroy();
  });

  it('carrega e atualiza a edição sem alterar a normativa de criação', async () => {
    const fixture = formFixture(true);
    const component = fixture.componentInstance;
    const original = component.currentItem!;
    expect(component.isEditMode()).toBe(true);
    expect(component.form.controls.nome.value).toBe(original.nome);
    if (original.chefeImediato) expect(component.atoDataPicker.dateControl.value).toBeInstanceOf(Date);
    component.form.controls.nome.setValue(`${original.nome} revisada`);
    if (component.service.isUtbEmUso(original.utbCodigo, original.id)) {
      const livre = TestBed.inject(SecretariaGeralService).utbs().find(utb => !component.service.isUtbEmUso(utb.codigo, original.id))!;
      component.form.controls.utbCodigo.setValue(livre.codigo);
    }
    const focus = vi.spyOn(component, 'focusPrimeiroCampoInvalido').mockImplementation(() => undefined);
    component.onSalvar();
    expect(focus).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith('Registro atualizado com sucesso.'));
    expect(component.service.getItem(original.id)?.nome).toBe(`${original.nome} revisada`);
    expect(component.service.getItem(original.id)?.normativaCriacao).toEqual(original.normativaCriacao);
    expect(toast.success).toHaveBeenCalledWith('Registro atualizado com sucesso.');
    fixture.destroy();
  });

  it('cadastra com superior, UTB livre e normativa, preservando a obrigatoriedade de endereço', async () => {
    const fixture = formFixture();
    const component = fixture.componentInstance;
    component.form.controls.nome.setValue(`Unidade de teste ${config.slug}`);
    if (component instanceof SecretariaExecutivaForm || component instanceof GerenciaRegionalForm) {
      component.onSecGeralSelected(component.secGeralService.items().find(item => item.status === 'ATIVO')!.id);
    } else if (component instanceof GerenciaExecutivaForm) {
      component.onSecExecSelected(component.secExecService.items().find(item => item.status === 'ATIVO')!.id);
    } else if (component instanceof SubgerenciaForm) {
      component.onGerExecSelected(component.gerExecService.items().find(item => item.status === 'ATIVO')!.id);
    } else {
      component.form.controls.tipoVinculo.setValue('GERENCIA_REGIONAL');
      component.onTipoVinculoChange();
      component.onGerRegionalSelected(component.gerRegService.items().find(item => item.status === 'ATIVO')!.id);
      component.form.patchValue({cep: '58.013-400', municipio: 'João Pessoa', rua: 'Rua de teste', numero: '123', bairro: 'Centro'});
    }
    const utb = TestBed.inject(SecretariaGeralService).utbs().find(utb => !component.service.isUtbEmUso(utb.codigo))!;
    expect(utb).toBeDefined();
    component.onUtbSelected(utb.codigo);
    component.normCriacaoNomeControl.setValue(normativa.nome);
    component.normCriacaoNumeroControl.setValue(normativa.numero);
    component.normCriacaoDataControl.setValue(normativa.dataPublicacao);
    component.normCriacaoDoc.set(document);
    const focus = vi.spyOn(component, 'focusPrimeiroCampoInvalido').mockImplementation(() => undefined);
    component.onSalvar();
    expect(focus).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith('Registro cadastrado com sucesso.'));
    const item = component.service.items().find(item => item.nome === `Unidade de teste ${config.slug}`)!;
    expect(item.status).toBe('ATIVO');
    expect(item.normativaCriacao.documento).toEqual(document);
    if (component instanceof SubgerenciaForm) expect(component.form.controls.cep.value).toBe('');
    expect(TestBed.inject(Router).navigate).toHaveBeenLastCalledWith([`/configuracoes/hierarquia/${config.slug}`]);
    fixture.destroy();
  });

  it('mantém alterações ao recusar descarte e permite sair ao confirmar', async () => {
    const fixture = formFixture();
    const component = fixture.componentInstance;
    component.form.controls.nome.setValue('Nome alterado');
    expect(await component.canDeactivate()).toBe(false);
    expect(component.form.controls.nome.value).toBe('Nome alterado');
    modal.confirm.mockResolvedValueOnce(true);
    expect(await component.canDeactivate()).toBe(true);
    expect(modal.confirm).toHaveBeenCalledWith(expect.objectContaining({title: 'Tem certeza que deseja cancelar?', description: 'As alterações não salvas serão perdidas.'}));
    fixture.destroy();
  });

  it('exibe os dados na visualização e navega para edição', () => {
    const list = listFixture();
    const item = list.componentInstance.service.items().find(item => item.status === 'ATIVO')!;
    TestBed.inject(ActivatedRoute).snapshot.params['id'] = item.id;
    url = `/configuracoes/hierarquia/${config.slug}/${item.id}`;
    list.destroy();
    const fixture = TestBed.createComponent<View>(config.view);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('s-page-header')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain(item.nome);
    fixture.componentInstance.onEditar();
    expect(TestBed.inject(Router).navigate).toHaveBeenLastCalledWith([`/configuracoes/hierarquia/${config.slug}`, item.id, 'editar']);
    fixture.destroy();
  });

  it('propaga a seleção oficial de unidade superior sem trocar as regras locais', () => {
    const fixture = formFixture();
    const component = fixture.componentInstance;
    const autocomplete = fixture.debugElement.queryAll(By.directive(SAutocompleteComponent))[0].componentInstance as SAutocompleteComponent;
    if (component instanceof SecretariaExecutivaForm || component instanceof GerenciaRegionalForm) {
      const parent = TestBed.inject(SecretariaGeralService).items().find(item => item.status === 'ATIVO')!;
      autocomplete.selectionChange.emit({value: parent.id, label: parent.nome});
      expect(component.form.controls.secretariaGeralId.value).toBe(parent.id);
    } else if (component instanceof GerenciaExecutivaForm) {
      const parent = component.secExecService.items().find(item => item.status === 'ATIVO')!;
      autocomplete.selectionChange.emit({value: parent.id, label: parent.nome});
      expect(component.form.controls.secretariaExecutivaId.value).toBe(parent.id);
    } else if (component instanceof SubgerenciaForm) {
      const parent = component.gerExecService.items().find(item => item.status === 'ATIVO')!;
      autocomplete.selectionChange.emit({value: parent.id, label: parent.nome});
      expect(component.form.controls.gerenciaExecutivaId.value).toBe(parent.id);
    } else {
      component.form.controls.tipoVinculo.setValue('GERENCIA_REGIONAL');
      component.onTipoVinculoChange();
      fixture.detectChanges();
      const parent = component.gerRegService.items().find(item => item.status === 'ATIVO')!;
      const superior = fixture.debugElement.queryAll(By.directive(SAutocompleteComponent))[0].componentInstance as SAutocompleteComponent;
      superior.selectionChange.emit({value: parent.id, label: parent.nome});
      expect(component.form.controls.unidadeSuperiorId.value).toBe(parent.id);
      component.form.controls.tipoVinculo.setValue('SUBGERENCIA');
      component.onTipoVinculoChange();
      expect(component.form.controls.unidadeSuperiorId.value).toBe('');
    }
    fixture.destroy();
  });

  it('mantém os valores visíveis nos controles oficiais ao selecionar opções e ao carregar edição', async () => {
    type Opt = {label: string; value: unknown};
    // 1. Filtro UTB na listagem
    const listFix = listFixture();
    const listSelect = listFix.debugElement.queryAll(By.directive(SSelectComponent))[0].componentInstance as SSelectComponent;
    const firstFilterOpt = (listSelect.options() as readonly Opt[])[1];
    expect(firstFilterOpt).toBeDefined();
    expect(listSelect.options()[0]).toEqual({label: 'Todos', value: ''});
    await listFix.whenStable();
    listFix.detectChanges();
    expect(listFix.nativeElement.querySelector('s-field[controlId="filter-utb"] mat-select').textContent).toContain('Todos');
    (listSelect as unknown as {onSelectionChange: (event: {value: unknown}) => void}).onSelectionChange({value: firstFilterOpt.value});
    listFix.detectChanges();
    await Promise.resolve();
    listFix.detectChanges();
    expect(listFix.componentInstance.filtroForm.controls.utb.value).toBe(firstFilterOpt.value);
    expect(listFix.nativeElement.querySelector('s-field[controlId="filter-utb"] mat-select').textContent).toContain(firstFilterOpt.label);
    listFix.componentInstance.onBuscar();
    expect(listFix.componentInstance.filteredItems().length).toBeGreaterThan(0);
    (listSelect as unknown as {onSelectionChange: (event: {value: unknown}) => void}).onSelectionChange({value: ''});
    listFix.detectChanges();
    await listFix.whenStable();
    listFix.detectChanges();
    expect(listFix.componentInstance.filtroForm.controls.utb.value).toBe('');
    expect(listFix.nativeElement.querySelector('s-field[controlId="filter-utb"] mat-select').textContent).toContain('Todos');
    expect(listFix.componentInstance.canBuscar()).toBe(true);
    listFix.componentInstance.onBuscar();
    listFix.detectChanges();
    expect(listFix.componentInstance.filteredItems().length).toBe(listFix.componentInstance.service.items().length);
    expect(listFix.componentInstance.canBuscar()).toBe(false);
    listFix.destroy();

    // 2. Seleção no cadastro (Unidade Superior e UTB)
    const formFix = formFixture(false);
    const formComp = formFix.componentInstance;
    if (formComp instanceof NucleoForm) {
      formComp.form.controls.tipoVinculo.setValue('GERENCIA_REGIONAL');
      formComp.onTipoVinculoChange();
      formFix.detectChanges();
    }
    const autos = formFix.debugElement.queryAll(By.directive(SAutocompleteComponent));
    const supAuto = autos[0].componentInstance as SAutocompleteComponent;
    const supInput = autos[0].nativeElement.querySelector('input.s-autocomplete__nativo') as HTMLInputElement;
    const supOpt = (supAuto.options() as readonly Opt[])[0];
    expect(supOpt).toBeDefined();
    supInput.value = supOpt.label.slice(0, 4);
    supInput.dispatchEvent(new Event('input'));
    formFix.detectChanges();
    (supAuto as unknown as {onOptionSelected: (ev: {option: {value: Opt}}) => void}).onOptionSelected({option: {value: supOpt}});
    formFix.detectChanges();
    await Promise.resolve();
    formFix.detectChanges();
    expect(supInput.value).toBe(supOpt.label);

    const utbAuto = autos[1].componentInstance as SAutocompleteComponent;
    const utbInput = autos[1].nativeElement.querySelector('input.s-autocomplete__nativo') as HTMLInputElement;
    const freeUtb = TestBed.inject(SecretariaGeralService).utbs().find(u => !formComp.service.isUtbEmUso(u.codigo))!;
    const utbOpt = (utbAuto.options() as readonly Opt[]).find(o => o.value === freeUtb.codigo)!;
    expect(utbOpt).toBeDefined();
    utbInput.value = utbOpt.label.slice(0, 5);
    utbInput.dispatchEvent(new Event('input'));
    formFix.detectChanges();
    (utbAuto as unknown as {onOptionSelected: (ev: {option: {value: Opt}}) => void}).onOptionSelected({option: {value: utbOpt}});
    formFix.detectChanges();
    await Promise.resolve();
    formFix.detectChanges();
    expect(utbInput.value).toBe(utbOpt.label);
    formFix.destroy();

    // 3. Preenchimento na edição
    const editFix = formFixture(true);
    editFix.detectChanges();
    await Promise.resolve();
    editFix.detectChanges();
    const editAutos = editFix.debugElement.queryAll(By.directive(SAutocompleteComponent));
    const editSupInput = editAutos[0].nativeElement.querySelector('input.s-autocomplete__nativo') as HTMLInputElement;
    const editUtbInput = editAutos[1].nativeElement.querySelector('input.s-autocomplete__nativo') as HTMLInputElement;
    expect(editSupInput.value.length).toBeGreaterThan(0);
    expect(editUtbInput.value).toContain(editFix.componentInstance.currentItem!.utbCodigo);
    editFix.destroy();
  });

  function selecionarSuperior(component: Form) {
    if (component instanceof SecretariaExecutivaForm || component instanceof GerenciaRegionalForm) {
      component.onSecGeralSelected(component.secGeralService.items().find(item => item.status === 'ATIVO')!.id);
    } else if (component instanceof GerenciaExecutivaForm) {
      component.onSecExecSelected(component.secExecService.items().find(item => item.status === 'ATIVO')!.id);
    } else if (component instanceof SubgerenciaForm) {
      component.onGerExecSelected(component.gerExecService.items().find(item => item.status === 'ATIVO')!.id);
    } else {
      component.form.controls.tipoVinculo.setValue('GERENCIA_REGIONAL');
      component.onTipoVinculoChange();
      component.onGerRegionalSelected(component.gerRegService.items().find(item => item.status === 'ATIVO')!.id);
    }
  }

  it('mantém a UTB desabilitada até selecionar o vínculo superior', () => {
    const fixture = formFixture();
    const component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.utbInputControlOficial.disabled).toBe(true);
    expect(component.utbInputControl.disabled).toBe(true);
    selecionarSuperior(component);
    fixture.detectChanges();
    expect(component.utbInputControlOficial.enabled).toBe(true);
    expect(component.utbInputControl.enabled).toBe(true);
    fixture.destroy();
  });

  it('mantém a UTB já vinculada selecionada com a mensagem após o blur e impede salvar', () => {
    const fixture = formFixture();
    const component = fixture.componentInstance;
    selecionarSuperior(component);
    fixture.detectChanges();
    const emUso = TestBed.inject(SecretariaGeralService).utbs().find(u => component.service.isUtbEmUso(u.codigo))!;
    expect(emUso).toBeDefined();
    component.onUtbSelected(emUso.codigo);
    component.onUtbBlur();
    fixture.detectChanges();
    expect(component.form.getRawValue().utbCodigo).toBe(emUso.codigo);
    expect(component.utbInputControlOficial.value).toBe(emUso.codigo);
    expect(component.utbInputControl.hasError('emUso')).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('já está vinculada a outra unidade ativa');
    vi.spyOn(component, 'focusPrimeiroCampoInvalido').mockImplementation(() => undefined);
    component.onSalvar();
    expect(toast.warning).toHaveBeenCalledWith('Verifique os campos obrigatórios destacados no formulário.');
    expect(component.isSaving()).toBe(false);
    const livre = TestBed.inject(SecretariaGeralService).utbs().find(u => !component.service.isUtbEmUso(u.codigo))!;
    component.onUtbSelected(livre.codigo);
    expect(component.utbInputControl.hasError('emUso')).toBe(false);
    fixture.destroy();
  });

  it('apresenta os anexos na visualização no padrão de Secretaria Geral', () => {
    const list = listFixture();
    const item = list.componentInstance.service.items().find(item => item.status === 'ATIVO')!;
    TestBed.inject(ActivatedRoute).snapshot.params['id'] = item.id;
    url = `/configuracoes/hierarquia/${config.slug}/${item.id}`;
    list.destroy();
    const fixture = TestBed.createComponent<View>(config.view);
    fixture.detectChanges();
    const anexos = fixture.nativeElement.querySelectorAll('.sg-anexo-com-arquivo') as NodeListOf<HTMLElement>;
    expect(anexos.length).toBeGreaterThan(0);
    anexos.forEach(anexo => {
      expect(anexo.querySelector('s-file-upload')).not.toBeNull();
      expect(anexo.querySelectorAll('s-icon-button').length).toBe(2);
    });
    fixture.destroy();
  });
});
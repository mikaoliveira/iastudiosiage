import {provideZonelessChangeDetection} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ActivatedRoute, convertToParamMap, provideRouter} from '@angular/router';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {of} from 'rxjs';
import {vi} from 'vitest';
import {JustificativaInativacaoDialog, ProfessoresForm, ProfessoresList, ProfessoresService, VisualizarAnexoDialog, VisualizarJustificativaDialog} from './professores-emergencial-militares-base-tecnica';

describe('Professores: listagem', () => {
  let fixture: ComponentFixture<ProfessoresList>;
  let component: ProfessoresList;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfessoresList],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    }).compileComponents();
    fixture = TestBed.createComponent(ProfessoresList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
  });

  it('aplica filtros somente ao buscar e restaura a listagem ao limpar', () => {
    const total = component.filteredItems().length;
    const item = component.service.items()[0];
    component.nomeControl.setValue(item.nome);
    expect(component.filteredItems().length).toBe(total);
    expect(component.isBuscarEnabled()).toBe(true);
    component.onBuscar();
    expect(component.filteredItems().map(registro => registro.id)).toEqual([item.id]);
    component.onLimpar();
    expect(component.filteredItems().length).toBe(total);
    expect(component.isBuscarEnabled()).toBe(false);
  });

  it('mantém filtros combinados, ordenação e paginação', () => {
    const item = component.service.items()[0];
    component.tipoControl.setValue(item.tipo);
    component.utbControl.setValue(item.utb.substring(0, 4));
    component.statusControl.setValue('ATIVO');
    component.onBuscar();
    expect(component.filteredItems().every(registro => registro.tipo === item.tipo && registro.utb.includes(item.utb.substring(0, 4)) && registro.ativo)).toBe(true);
    component.onSortChange({active: 'nome', direction: 'desc'});
    component.onPageChange({pageIndex: 0, pageSize: 1, length: component.filteredItems().length});
    expect(component.paginatedItems()).toHaveLength(1);
    expect(component.paginatedItems()[0].id).toBe(component.sortedItems()[0].id);
  });

  it('apresenta os seletores oficiais com os valores padrão', () => {
    expect(fixture.nativeElement.querySelectorAll('s-select')).toHaveLength(3);
    expect(component.secretariaControl.value).toBe('TODAS');
    expect(component.tipoControl.value).toBe('TODOS');
    expect(component.statusControl.value).toBe('TODOS');
    expect(component.tipoOptions.map(opcao => opcao.value)).toEqual(['TODOS', 'MILITAR', 'EMERGENCIAL', 'BASE_TECNICA']);
  });

  it('mantém a máscara e a limpeza individual do filtro de CPF', () => {
    const campo: HTMLInputElement = fixture.nativeElement.querySelector('#filter-cpf');
    campo.value = '12345678901';
    campo.dispatchEvent(new Event('input', {bubbles: true}));
    fixture.detectChanges();
    expect(component.cpfControl.value).toBe('123.456.789-01');
    const limpar: HTMLButtonElement = fixture.nativeElement.querySelector('s-icon-button[label="Limpar CPF"] button');
    limpar.click();
    fixture.detectChanges();
    expect(component.cpfControl.value).toBe('');
    expect(component.isBuscarEnabled()).toBe(false);
  });

  it('mantém a situação inativa ao cancelar a ativação', () => {
    vi.spyOn(component.dialog, 'open').mockReturnValue({afterClosed: () => of(false)} as never);
    const indice = component.paginatedItems().findIndex(registro => !registro.ativo);
    const chave: HTMLButtonElement = fixture.nativeElement.querySelectorAll('s-table tbody tr')[indice].querySelector('[role="switch"]');
    expect(chave.getAttribute('aria-checked')).toBe('false');
    chave.click();
    fixture.detectChanges();
    expect(chave.getAttribute('aria-checked')).toBe('false');
    expect(component.paginatedItems()[indice].ativo).toBe(false);
  });
});

describe('Professores: formulário', () => {
  let fixture: ComponentFixture<ProfessoresForm>;
  let component: ProfessoresForm;
  const route = {
    snapshot: {params: {} as Record<string, string>, queryParamMap: convertToParamMap({}), routeConfig: {path: 'novo'}, url: []},
    url: of([])
  };

  beforeEach(async () => {
    route.snapshot.params = {};
    route.snapshot.routeConfig.path = 'novo';
    await TestBed.configureTestingModule({
      imports: [ProfessoresForm],
      providers: [provideZonelessChangeDetection(), provideRouter([]), {provide: ActivatedRoute, useValue: route}]
    }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
    vi.restoreAllMocks();
  });

  it('mantém obrigatoriedade de matrícula por tipo e dependência de município', () => {
    fixture = TestBed.createComponent(ProfessoresForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.form.controls.matricula.hasError('required')).toBe(true);
    expect(component.form.controls.municipio.disabled).toBe(true);
    component.form.controls.tipo.setValue('EMERGENCIAL');
    expect(component.form.controls.matricula.hasError('required')).toBe(false);
    component.form.controls.estado.setValue('PB');
    expect(component.form.controls.municipio.enabled).toBe(true);
    expect(component.municipiosDisponiveis()).toContain('João Pessoa');
    component.form.controls.estado.setValue('');
    expect(component.form.controls.municipio.disabled).toBe(true);
  });

  it('carrega o registro e seus anexos em visualização e edição', () => {
    const item = TestBed.inject(ProfessoresService).items()[0];
    route.snapshot.params = {id: item.id};
    route.snapshot.routeConfig.path = ':id';
    fixture = TestBed.createComponent(ProfessoresForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.isViewMode()).toBe(true);
    expect(component.form.disabled).toBe(true);
    expect(component.currentItem()?.id).toBe(item.id);
    expect(component.anexosList()).toEqual(item.anexos);
    fixture.destroy();
    route.snapshot.routeConfig.path = ':id/editar';
    fixture = TestBed.createComponent(ProfessoresForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.isEditMode()).toBe(true);
    expect(component.form.controls.nome.value).toBe(item.nome);
    expect(component.anexosList()).toEqual(item.anexos);
  });

  it('preserva opções e mensagens dos seletores funcionais', () => {
    fixture = TestBed.createComponent(ProfessoresForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('s-select')).toHaveLength(11);
    expect(component.situacaoFuncionalOptions().map(opcao => opcao.value)).toEqual(component.situacaoFuncionalOpcoes());
    expect(component.regimeOptions().map(opcao => opcao.value)).toEqual(component.regimeOpcoes());
    component.form.controls.ufRg.markAsTouched();
    component.form.controls.cargo.markAsTouched();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('UF é obrigatória.');
    expect(fixture.nativeElement.textContent).toContain('Cargo é obrigatório.');
  });

  it('pede confirmação antes de abandonar alterações', () => {
    fixture = TestBed.createComponent(ProfessoresForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const navegar = vi.spyOn(component.router, 'navigate').mockResolvedValue(true);
    const confirmar = vi.spyOn(component.modalService, 'confirmarCancelamento').mockReturnValue({afterClosed: () => of(false)} as never);
    component.form.controls.nome.setValue('Pessoa Exemplo');
    component.navigateWithProtection('/inicio');
    expect(confirmar).toHaveBeenCalledOnce();
    expect(navegar).not.toHaveBeenCalled();
  });

  it('aplica a máscara de CPF durante a digitação', () => {
    fixture = TestBed.createComponent(ProfessoresForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const campo: HTMLInputElement = fixture.nativeElement.querySelector('#form-cpf');
    campo.value = '12345678901';
    campo.dispatchEvent(new Event('input', {bubbles: true}));
    fixture.detectChanges();
    expect(campo.value).toBe('123.456.789-01');
    expect(component.form.controls.cpf.value).toBe('123.456.789-01');
  });

  it('mantém máscaras dos documentos e a seleção do tipo', () => {
    fixture = TestBed.createComponent(ProfessoresForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const campos = [
      {seletor: '#form-matricula', entrada: '12a345', esperado: '12345'},
      {seletor: '#form-rg', entrada: '12a34567', esperado: '1234567'},
      {seletor: '#form-emissor', entrada: 'ssp', esperado: 'SSP'},
      {seletor: '#form-pispasep', entrada: '12345678901', esperado: '123.45678.90-1'},
      {seletor: '#form-telefone', entrada: '83912345678', esperado: '(83) 91234-5678'},
      {seletor: '#form-numero', entrada: '12a34', esperado: '1234'}
    ];
    for (const campo of campos) {
      const entrada: HTMLInputElement = fixture.nativeElement.querySelector(campo.seletor);
      entrada.value = campo.entrada;
      entrada.dispatchEvent(new Event('input', {bubbles: true}));
      fixture.detectChanges();
      expect(entrada.value).toBe(campo.esperado);
    }
    expect(component.form.controls.matricula.value).toBe('12345');
    expect(component.form.controls.rg.value).toBe('1234567');
    expect(component.form.controls.orgaoEmissor.value).toBe('SSP');
    expect(component.form.controls.pisPasep.value).toBe('123.45678.90-1');
    expect(component.form.controls.telefone.value).toBe('(83) 91234-5678');
    expect(component.form.controls.numero.value).toBe('1234');
    const emergencial: HTMLInputElement = fixture.nativeElement.querySelector('s-radio-group input[value="EMERGENCIAL"]');
    emergencial.click();
    fixture.detectChanges();
    expect(component.form.controls.tipo.value).toBe('EMERGENCIAL');
    expect(component.form.controls.matricula.hasError('required')).toBe(false);
  });

  it('mantém normalização e consulta de CEP ao sair dos campos', () => {
    fixture = TestBed.createComponent(ProfessoresForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.form.controls.nome.setValue('  Maria   Exemplo  ');
    component.form.controls.emailPessoal.setValue('  pessoa@exemplo.com  ');
    component.form.controls.emailInstitucional.setValue('  pessoa@see.pb.gov.br  ');
    fixture.detectChanges();
    for (const seletor of ['#form-nome', '#form-email-pessoal', '#form-email-inst']) {
      fixture.nativeElement.querySelector(seletor).dispatchEvent(new FocusEvent('focusout', {bubbles: true}));
    }
    expect(component.form.controls.nome.value).toBe('Maria Exemplo');
    expect(component.form.controls.emailPessoal.value).toBe('pessoa@exemplo.com');
    expect(component.form.controls.emailInstitucional.value).toBe('pessoa@see.pb.gov.br');
    const consulta = vi.spyOn(component, 'consultarCep');
    const cep: HTMLInputElement = fixture.nativeElement.querySelector('#form-cep');
    cep.value = '58040000';
    cep.dispatchEvent(new Event('input', {bubbles: true}));
    cep.dispatchEvent(new FocusEvent('focusout', {bubbles: true}));
    expect(consulta).toHaveBeenCalledTimes(2);
    expect(component.form.controls.cep.value).toBe('58040-000');
    expect(component.form.controls.estado.value).toBe('PB');
    expect(component.form.controls.municipio.value).toBe('João Pessoa');
    expect(component.form.controls.rua.value).toBe('Avenida Cabo Branco');
  });

  it('aceita anexos permitidos e rejeita formatos não suportados', () => {
    fixture = TestBed.createComponent(ProfessoresForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const erro = vi.spyOn(component.toastService, 'error');
    const campo: HTMLInputElement = fixture.nativeElement.querySelector('input[type="file"]');
    const arquivos = [new File(['conteúdo'], 'exemplo.pdf', {type: 'application/pdf'}), new File(['conteúdo'], 'exemplo.exe')];
    Object.defineProperty(campo, 'files', {configurable: true, value: arquivos});
    campo.dispatchEvent(new Event('change', {bubbles: true}));
    fixture.detectChanges();
    expect(component.anexosList().map(anexo => anexo.nome)).toEqual(['exemplo.pdf']);
    expect(erro).toHaveBeenCalledOnce();
    const remover: HTMLButtonElement = fixture.nativeElement.querySelector('s-icon-button[label="Remover anexo"] button');
    remover.click();
    expect(component.anexosList()).toHaveLength(0);
  });
});

describe('Professores: diálogos', () => {
  const fechar = vi.fn();

  afterEach(() => {
    vi.restoreAllMocks();
    fechar.mockReset();
  });

  it('exige justificativa com pelo menos dez caracteres para inativar', async () => {
    await TestBed.configureTestingModule({
      imports: [JustificativaInativacaoDialog],
      providers: [provideZonelessChangeDetection(), {provide: MatDialogRef, useValue: {close: fechar}}, {provide: MAT_DIALOG_DATA, useValue: {nome: 'Pessoa Exemplo'}}]
    }).compileComponents();
    const fixture = TestBed.createComponent(JustificativaInativacaoDialog);
    fixture.detectChanges();
    fixture.componentInstance.form.controls.justificativa.setValue('curta');
    fixture.componentInstance.confirmar();
    expect(fechar).not.toHaveBeenCalled();
    fixture.componentInstance.form.controls.justificativa.setValue('Motivo de inativação');
    fixture.componentInstance.confirmar();
    expect(fechar).toHaveBeenCalledWith('Motivo de inativação');
    fixture.destroy();
  });

  it('habilita o envio do diálogo ao preencher a justificativa', async () => {
    await TestBed.configureTestingModule({
      imports: [JustificativaInativacaoDialog],
      providers: [provideZonelessChangeDetection(), {provide: MatDialogRef, useValue: {close: fechar}}, {provide: MAT_DIALOG_DATA, useValue: {nome: 'Pessoa Exemplo'}}]
    }).compileComponents();
    const fixture = TestBed.createComponent(JustificativaInativacaoDialog);
    fixture.detectChanges();
    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('s-textarea textarea');
    const enviar: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(enviar.disabled).toBe(true);
    textarea.value = 'Motivo de inativação';
    textarea.dispatchEvent(new Event('input', {bubbles: true}));
    fixture.detectChanges();
    expect(enviar.disabled).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('20 de 500');
    enviar.click();
    expect(fechar).toHaveBeenCalledWith('Motivo de inativação');
    fixture.destroy();
  });

  it('exibe justificativa registrada e permite fechar', async () => {
    await TestBed.configureTestingModule({
      imports: [VisualizarJustificativaDialog],
      providers: [provideZonelessChangeDetection(), {provide: MatDialogRef, useValue: {close: fechar}}, {provide: MAT_DIALOG_DATA, useValue: {nome: 'Pessoa Exemplo', justificativa: 'Motivo informado'}}]
    }).compileComponents();
    const fixture = TestBed.createComponent(VisualizarJustificativaDialog);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Motivo informado');
    fixture.componentInstance.fechar();
    expect(fechar).toHaveBeenCalledOnce();
    fixture.destroy();
  });

  it('mantém visualização e limites de zoom de anexos de imagem', async () => {
    await TestBed.configureTestingModule({
      imports: [VisualizarAnexoDialog],
      providers: [provideZonelessChangeDetection(), {provide: MatDialogRef, useValue: {close: fechar}}, {provide: MAT_DIALOG_DATA, useValue: {anexo: {nome: 'imagem.png', tipo: 'image/png', url: '/imagem.png'}}}]
    }).compileComponents();
    const fixture = TestBed.createComponent(VisualizarAnexoDialog);
    fixture.detectChanges();
    const dialog = fixture.componentInstance;
    expect(dialog.isPdf()).toBe(false);
    expect(dialog.fileUrl()).toBe('/imagem.png');
    for (let indice = 0; indice < 10; indice++) dialog.aumentarZoomImagem();
    expect(dialog.imageZoom()).toBe(250);
    dialog.resetarZoomImagem();
    expect(dialog.imageZoom()).toBe(100);
    dialog.fechar();
    expect(fechar).toHaveBeenCalledOnce();
    fixture.destroy();
  });
});
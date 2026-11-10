import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {provideRouter, Router} from '@angular/router';
import {SToastService} from '@siage/siage-ui';
import {of} from 'rxjs';
import {vi} from 'vitest';
import {ModalService} from './dialog';
import {BuscaServidorModal, ImpedimentoInativacaoModal, SecretariaGeralForm, SecretariaGeralList, SecretariaGeralService} from './secretaria-geral';
import {ScenarioType, SimulatorService} from './simulator';

describe('Secretaria Geral', () => {
  const scenario = signal<ScenarioType>('normal');

  beforeEach(async () => {
    scenario.set('normal');
    await TestBed.configureTestingModule({
      imports: [SecretariaGeralList, SecretariaGeralForm],
      providers: [
        provideRouter([]),
        {provide: SimulatorService, useValue: {currentScenario: scenario, allowCreation: signal(true), setScenario: vi.fn()}}
      ]
    }).overrideComponent(SecretariaGeralForm, {
      set: {providers: [{provide: SToastService, useValue: {success: vi.fn(), warning: vi.fn(), info: vi.fn()}}]}
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
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

  it('não inativa ao cancelar e mostra os impedimentos após confirmação', () => {
    const fixture = TestBed.createComponent(SecretariaGeralList);
    fixture.detectChanges();
    const item = TestBed.inject(SecretariaGeralService).items().find(record => record.status === 'ATIVO')!;
    const dialog = vi.spyOn(fixture.debugElement.injector.get(MatDialog), 'open').mockReturnValue({afterClosed: () => of(false)} as never);
    fixture.componentInstance.onToggleStatus(item);
    expect(item.status).toBe('ATIVO');
    expect(dialog).toHaveBeenCalledTimes(1);
    dialog.mockClear();
    dialog.mockReturnValueOnce({afterClosed: () => of(true)} as never);
    fixture.componentInstance.onToggleStatus(item);
    expect(item.status).toBe('ATIVO');
    expect(dialog).toHaveBeenCalledTimes(2);
    expect(dialog.mock.calls[1][0]).toBe(ImpedimentoInativacaoModal);
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

  it('mantém o ato fictício dentro do limite de 20 caracteres', () => {
    const numero = TestBed.inject(SecretariaGeralService).getItem('1')?.chefeImediato?.atoGovernamental?.numero;
    expect(numero).toBe('1.420/2024');
    expect(numero!.length).toBeLessThanOrEqual(20);
  });

  it('preserva validação e confirmação de alterações não salvas', async () => {
    const fixture = TestBed.createComponent(SecretariaGeralForm);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.onSalvar();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('O Nome da Secretaria Geral é obrigatório.');
    expect(fixture.nativeElement.querySelector('s-field[controlid="form-nome"] .s-field__counter')).toBeNull();
    component.form.controls.nome.setValue('Secretaria de teste');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('s-field[controlid="form-nome"] .s-field__counter').textContent.trim()).toBe('19/200');
    expect(component.hasUnsavedChanges()).toBe(true);
    const confirm = vi.spyOn(TestBed.inject(ModalService), 'confirmarCancelamento')
      .mockReturnValue({afterClosed: () => of(false)} as never);
    expect(await component.canDeactivate()).toBe(false);
    expect(confirm).toHaveBeenCalledOnce();
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
});
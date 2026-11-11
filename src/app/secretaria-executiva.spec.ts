import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {SModalService, SToastService} from '@siage/siage-ui';
import {of} from 'rxjs';
import {vi} from 'vitest';
import {SecretariaExecutivaList, SecretariaExecutivaService} from './secretaria-executiva';
import {ScenarioType, SimulatorService} from './simulator';

describe('Secretaria Executiva - Listagem', () => {
  const scenario = signal<ScenarioType>('normal');

  beforeEach(async () => {
    scenario.set('normal');
    await TestBed.configureTestingModule({
      imports: [SecretariaExecutivaList],
      providers: [
        provideRouter([]),
        {provide: SimulatorService, useValue: {currentScenario: scenario, allowCreation: signal(true), setScenario: vi.fn()}}
      ]
    }).overrideComponent(SecretariaExecutivaList, {
      set: {providers: [{provide: SToastService, useValue: {success: vi.fn(), warning: vi.fn(), info: vi.fn()}}]}
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('bloqueia o acesso quando o cenário é de acesso negado', () => {
    scenario.set('access_denied');
    const fixture = TestBed.createComponent(SecretariaExecutivaList);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-acesso-restrito')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('s-page-header')).toBeNull();
    fixture.destroy();
  });

  it('desabilita Adicionar sem permissão e navega ao adicionar com permissão', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(SecretariaExecutivaList);
    fixture.detectChanges();
    const add = fixture.nativeElement.querySelector('s-button[icon="add"] button') as HTMLButtonElement;
    expect(add.disabled).toBe(false);
    add.click();
    expect(navigate).toHaveBeenCalledWith(['/configuracoes/hierarquia/secretaria-executiva/novo']);
    TestBed.inject(SimulatorService).allowCreation.set(false);
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('s-button[icon="add"] button') as HTMLButtonElement).disabled).toBe(true);
    fixture.destroy();
  });

  it('habilita a busca apenas com o Status diferente de Todos (regra específica de Secretaria Executiva)', () => {
    const fixture = TestBed.createComponent(SecretariaExecutivaList);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.canBuscar()).toBe(false);
    component.filtroForm.controls.status.setValue('INATIVO');
    fixture.detectChanges();
    expect(component.canBuscar()).toBe(true);
    component.onBuscar();
    fixture.detectChanges();
    expect(component.service.items().some(item => item.status === 'ATIVO')).toBe(true);
    expect(fixture.nativeElement.textContent).not.toContain('Secretaria Executiva de Recursos Humanos e Folha');
    expect(fixture.nativeElement.textContent).toContain('Secretaria Executiva de Articulação e Parcerias (Extinta)');
    fixture.destroy();
  });

  it('aplica os filtros de nome e UTB e limpa corretamente', () => {
    const fixture = TestBed.createComponent(SecretariaExecutivaList);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.filtroForm.controls.nome.setValue('Modernização');
    fixture.detectChanges();
    expect(component.canBuscar()).toBe(true);
    component.onBuscar();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('s-table tbody tr').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Secretaria Executiva de Modernização e Tecnologia');
    component.onLimpar();
    fixture.detectChanges();
    expect(component.filtroForm.controls.nome.value).toBe('');
    expect(component.filtroForm.controls.status.value).toBe('TODOS');
    expect(fixture.nativeElement.querySelectorAll('s-table tbody tr').length).toBe(4);
    fixture.destroy();
  });

  it('ordena por nome, UTB e data de criação ao alternar a coluna', () => {
    const fixture = TestBed.createComponent(SecretariaExecutivaList);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.sortColumn()).toBe('dataCriacao');
    expect(component.sortDirection()).toBe('desc');
    component.onSortChange({key: 'nome', direction: 'asc'});
    expect(component.sortColumn()).toBe('nome');
    expect(component.sortedItems()[0].nome.localeCompare(component.sortedItems()[1].nome, 'pt-BR')).toBeLessThanOrEqual(0);
    component.onSortChange({key: 'utbNome', direction: 'desc'});
    expect(component.sortColumn()).toBe('utb');
    expect(component.sortDirection()).toBe('desc');
    fixture.destroy();
  });

  it('pagina os registros respeitando o tamanho de página', () => {
    const fixture = TestBed.createComponent(SecretariaExecutivaList);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.onPageSizeChange(2);
    fixture.detectChanges();
    expect(component.pageIndex()).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('s-table tbody tr').length).toBe(2);
    component.onPageChange(1);
    fixture.detectChanges();
    expect(component.paginatedItems().length).toBe(2);
    fixture.destroy();
  });

  it('mantém o estado do switch ao cancelar e exibe impedimentos quando há chefia e subordinadas', async () => {
    const fixture = TestBed.createComponent(SecretariaExecutivaList);
    fixture.detectChanges();
    const item = TestBed.inject(SecretariaExecutivaService).getItem('sub-1')!;
    const modal = fixture.debugElement.injector.get(SModalService);
    const confirm = vi.spyOn(modal, 'confirm').mockResolvedValue(false);
    const dialog = vi.spyOn(modal, 'open').mockReturnValue({afterClosed: () => of(undefined)} as never);
    fixture.componentInstance.onToggleStatus(item);
    await Promise.resolve();
    expect(item.status).toBe('ATIVO');
    expect(dialog).not.toHaveBeenCalled();
    confirm.mockResolvedValueOnce(true);
    fixture.componentInstance.onToggleStatus(item);
    await Promise.resolve();
    expect(item.status).toBe('ATIVO');
    expect(dialog.mock.calls[0][1]).toEqual(expect.objectContaining({
      data: expect.objectContaining({unidadesDescricao: 'Gerências Executivas e Gerências Regionais'})
    }));
    fixture.destroy();
  });

  it('inativa com sucesso após anexar a normativa quando não há impedimentos', async () => {
    const fixture = TestBed.createComponent(SecretariaExecutivaList);
    fixture.detectChanges();
    const service = TestBed.inject(SecretariaExecutivaService);
    const item = service.getItem('sub-3')!;
    const toast = fixture.debugElement.injector.get(SToastService);
    const modal = fixture.debugElement.injector.get(SModalService);
    vi.spyOn(modal, 'confirm').mockResolvedValueOnce(true);
    const dialog = vi.spyOn(modal, 'open')
      .mockReturnValueOnce({afterClosed: () => of({nome: 'Normativa', numero: '1', dataPublicacao: '01/01/2024'})} as never);
    fixture.componentInstance.onToggleStatus(item);
    await Promise.resolve();
    expect(dialog).toHaveBeenCalledTimes(1);
    expect(service.getItem('sub-3')?.status).toBe('INATIVO');
    expect(toast.success).toHaveBeenCalledWith('Registro inativado com sucesso.');
    fixture.destroy();
  });

  it('exibe aviso de irreversibilidade ao tentar reativar um registro inativo', () => {
    const fixture = TestBed.createComponent(SecretariaExecutivaList);
    fixture.detectChanges();
    const item = TestBed.inject(SecretariaExecutivaService).getItem('sub-4')!;
    const toast = fixture.debugElement.injector.get(SToastService);
    const dialog = vi.spyOn(fixture.debugElement.injector.get(SModalService), 'confirm');
    fixture.componentInstance.onToggleStatus(item);
    expect(dialog).not.toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalledWith('A inativação de uma Secretaria Executiva é irreversível. O registro não pode ser reativado.');
    fixture.destroy();
  });

  it('mostra os estados vazios com as mensagens específicas de Secretaria Executiva', () => {
    const fixture = TestBed.createComponent(SecretariaExecutivaList);
    fixture.detectChanges();
    scenario.set('empty');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ainda não existem secretarias executivas cadastradas.');
    scenario.set('no_filter_results');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhum resultado encontrado');
    scenario.set('error');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Erro ao carregar dados');
    fixture.destroy();
  });
});

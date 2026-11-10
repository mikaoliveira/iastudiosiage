import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {vi} from 'vitest';
import {HubConfiguracoes} from './hub-configuracoes';
import {ScenarioType, SimulatorService} from './simulator';
import {ToastService} from './toast';

describe('Hub de configurações', () => {
  const scenario = signal<ScenarioType>('normal');
  const simulator = {
    currentScenario: scenario,
    allowCreation: signal(true),
    setScenario: vi.fn((value: ScenarioType) => scenario.set(value))
  };
  const toast = {info: vi.fn()};

  beforeEach(async () => {
    scenario.set('normal');
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [HubConfiguracoes],
      providers: [
        provideRouter([]),
        {provide: SimulatorService, useValue: simulator},
        {provide: ToastService, useValue: toast}
      ]
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('mantém a ordem e as ações dos oito cards', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(HubConfiguracoes);
    fixture.detectChanges();
    const cards = Array.from(fixture.nativeElement.querySelectorAll('[role="button"][aria-label^="Acessar "]')) as HTMLElement[];
    expect(cards.map(card => card.querySelector('h3')?.textContent?.trim())).toEqual([
      'Comissão de Avaliação', 'Notificação', 'Cabeçalho do Sistema',
      'Hierarquia de Unidades e Cargos', 'SEAD', 'Permissões', 'Tipo de Afastamento', 'Ficha Financeira'
    ]);
    expect(fixture.nativeElement.querySelectorAll('s-card').length).toBe(8);
    cards[3].dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));
    expect(navigate).toHaveBeenCalledWith(['/configuracoes/hierarquia']);
    cards[4].querySelector('button')?.click();
    expect(navigate).toHaveBeenCalledWith(['/configuracoes/sead']);
    expect(navigate).toHaveBeenCalledTimes(2);
    cards[0].click();
    expect(toast.info).toHaveBeenCalledWith('Funcionalidade "Comissão de Avaliação" em desenvolvimento.');
    fixture.destroy();
  });

  it('preserva o filtro e a ação de limpar', () => {
    const fixture = TestBed.createComponent(HubConfiguracoes);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('#hub-search-input') as HTMLInputElement;
    input.value = 'SEAD';
    input.dispatchEvent(new Event('input', {bubbles: true}));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('s-card').length).toBe(1);
    expect(fixture.nativeElement.querySelector('h3').textContent).toContain('SEAD');
    expect(fixture.nativeElement.querySelector('.mat-mdc-form-field-icon-prefix s-icon')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.mat-mdc-form-field-icon-suffix [aria-label="Limpar busca"]')).not.toBeNull();
    vi.useFakeTimers();
    fixture.nativeElement.querySelector('[aria-label="Limpar busca"]').click();
    vi.advanceTimersByTime(350);
    fixture.detectChanges();
    expect(input.value).toBe('');
    expect(fixture.nativeElement.querySelectorAll('s-card').length).toBe(8);
    fixture.destroy();
  });

  it('preserva os estados de erro, vazio e acesso restrito', () => {
    const fixture = TestBed.createComponent(HubConfiguracoes);
    scenario.set('error');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar os dados');
    vi.useFakeTimers();
    fixture.nativeElement.querySelector('s-button button').click();
    expect(simulator.setScenario).toHaveBeenCalledWith('normal');
    vi.advanceTimersByTime(350);
    scenario.set('empty');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhum registro cadastrado');
    scenario.set('access_denied');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-acesso-restrito')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('s-card').length).toBe(0);
    fixture.destroy();
  });
});
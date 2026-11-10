import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {vi} from 'vitest';
import {HubProfissionais} from './hub-profissionais';
import {InicioComponent} from './inicio';
import {ScenarioType, SimulatorService} from './simulator';

describe('Páginas iniciais', () => {
  const scenario = signal<ScenarioType>('normal');
  const simulator = {
    currentScenario: scenario,
    allowCreation: signal(true),
    reset: vi.fn(() => scenario.set('normal'))
  };

  beforeEach(async () => {
    scenario.set('normal');
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [HubProfissionais, InicioComponent],
      providers: [provideRouter([]), {provide: SimulatorService, useValue: simulator}]
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('mantém o card e a navegação de Profissionais', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(HubProfissionais);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('s-card');
    expect(cards.length).toBe(1);
    expect(cards[0].querySelector('h3').textContent).toContain('Importação de Profissionais');
    cards[0].querySelector('button').click();
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(['/profissionais/importacao']);
    fixture.destroy();
  });

  it('preserva filtro, limpeza e estados de Profissionais', () => {
    const fixture = TestBed.createComponent(HubProfissionais);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('#hub-profissionais-search') as HTMLInputElement;
    input.value = 'inexistente';
    input.dispatchEvent(new Event('input', {bubbles: true}));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhum resultado encontrado');
    expect(fixture.nativeElement.querySelector('.mat-mdc-form-field-icon-prefix s-icon')).not.toBeNull();
    fixture.nativeElement.querySelector('.mat-mdc-form-field-icon-suffix [aria-label="Limpar busca"]').click();
    fixture.detectChanges();
    expect(input.value).toBe('');
    expect(fixture.nativeElement.querySelectorAll('s-card').length).toBe(1);
    scenario.set('error');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar os dados');
    vi.useFakeTimers();
    fixture.nativeElement.querySelector('s-button button').click();
    expect(simulator.reset).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(400);
    scenario.set('access_denied');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-acesso-restrito')).not.toBeNull();
    fixture.destroy();
  });

  it('mantém a ação de Início para Configurações', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(InicioComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Página em Construção');
    fixture.nativeElement.querySelector('s-button button').click();
    expect(navigate).toHaveBeenCalledWith(['/configuracoes']);
    fixture.destroy();
  });
});
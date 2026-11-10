import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {vi} from 'vitest';
import {HierarquiaComponent} from './hierarquia';
import {ScenarioType, SimulatorService} from './simulator';

describe('Página inicial de Hierarquia', () => {
  const scenario = signal<ScenarioType>('normal');

  beforeEach(async () => {
    scenario.set('normal');
    await TestBed.configureTestingModule({
      imports: [HierarquiaComponent],
      providers: [
        provideRouter([]),
        {provide: SimulatorService, useValue: {currentScenario: scenario, allowCreation: signal(true)}}
      ]
    }).compileComponents();
  });

  afterEach(() => vi.restoreAllMocks());

  it('preserva os sete cards, textos, ícones e rotas', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(HierarquiaComponent);
    fixture.detectChanges();
    const cards = Array.from(fixture.nativeElement.querySelectorAll('[role="button"][aria-label^="Acessar "]')) as HTMLElement[];
    const expected = [
      ['Configurar Secretaria Geral', 'Gerencie as secretarias gerais que compõem o nível superior da estrutura organizacional.', 'account_balance', 'secretaria-geral'],
      ['Configurar Secretaria Executiva', 'Gerencie as secretarias executivas subordinadas à Secretaria Geral.', 'apartment', 'secretaria-executiva'],
      ['Configurar Gerência Executiva', 'Gerencie as gerências executivas vinculadas às secretarias executivas.', 'business_center', 'gerencia-executiva'],
      ['Configurar Gerência Regional', 'Gerencie as gerências regionais vinculadas à Secretaria Geral.', 'map', 'gerencia-regional'],
      ['Configurar Subgerência', 'Gerencie as subgerências subordinadas às gerências executivas.', 'schema', 'subgerencia'],
      ['Configurar Núcleo', 'Gerencie os núcleos subordinados às subgerências ou gerências regionais.', 'device_hub', 'nucleo'],
      ['Exceção de Hierarquia', 'Configure aprovadores de exceção para atuar sempre ou quando a chefia imediata estiver indisponível ou não definida.', 'rule', 'excecao-hierarquia']
    ];
    expect(cards.length).toBe(expected.length);
    cards.forEach((card, index) => {
      expect(card.querySelector('s-card')).not.toBeNull();
      expect(card.querySelector('h2')?.textContent?.trim()).toBe(expected[index][0]);
      expect(card.querySelector('p')?.textContent?.trim()).toBe(expected[index][1]);
      expect(card.querySelector('s-icon mat-icon')?.textContent?.trim()).toBe(expected[index][2]);
      card.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));
      expect(navigate).toHaveBeenLastCalledWith([`/configuracoes/hierarquia/${expected[index][3]}`]);
    });
    expect(cards[6].querySelector('.bg-amber-500\\/10')).toBeNull();
    fixture.destroy();
  });

  it('mantém a ação de visualizar e o acesso restrito', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(HierarquiaComponent);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('s-button button') as HTMLButtonElement;
    expect(button.textContent).toContain('Visualizar hierarquia');
    expect(button.querySelector('s-icon mat-icon')?.textContent?.trim()).toBe('account_tree');
    button.click();
    expect(navigate).toHaveBeenCalledWith(['/configuracoes/hierarquia/visualizar']);
    const links = fixture.nativeElement.querySelectorAll('s-page-header nav a') as NodeListOf<HTMLAnchorElement>;
    expect(Array.from(links, link => link.getAttribute('href'))).toEqual(['/inicio', '/configuracoes']);
    (fixture.nativeElement.querySelector('s-page-header button') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenLastCalledWith(['/configuracoes']);
    scenario.set('access_denied');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-acesso-restrito')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('[role="button"][aria-label^="Acessar "]').length).toBe(0);
    fixture.destroy();
  });
});
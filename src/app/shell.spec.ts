import {Component, signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {vi} from 'vitest';
import {App} from './app';
import {AuthSessionService} from './auth-session';
import {ShellComponent} from './shell';
import {SimulatorComponent} from './simulator';
import {ToastService} from './toast';

@Component({selector: 'app-simulator', template: ''})
class SimulatorStub {}

describe('Shell', () => {
  const isDark = signal(false);
  const toggleTheme = vi.fn(() => isDark.update(value => !value));
  const toast = {info: vi.fn()};

  beforeEach(async () => {
    isDark.set(false);
    vi.clearAllMocks();
    vi.stubGlobal('innerWidth', 1440);
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn()
    }));
    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([]),
        {provide: App, useValue: {isDark, toggleTheme}},
        {provide: ToastService, useValue: toast}
      ]
    }).overrideComponent(ShellComponent, {
      remove: {imports: [SimulatorComponent]},
      add: {imports: [SimulatorStub]}
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('mantém a ordem, a seleção e o recolhimento do menu desktop', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    const menu = fixture.nativeElement.querySelector('s-sidebar nav') as HTMLElement;
    const buttons = Array.from(menu.querySelectorAll('button'));
    expect(buttons.map(button => button.querySelector('span')?.textContent?.trim())).toEqual([
      'Início', 'Configurações', 'Avaliação de Desempenho', 'Profissionais',
      'Quadro Funcional', 'Afastamentos', 'Ficha Financeira', 'Meus Dados'
    ]);
    expect(buttons[1].getAttribute('aria-current')).toBe('page');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    buttons[3].click();
    fixture.detectChanges();
    expect(navigate).toHaveBeenCalledWith(['/profissionais']);
    expect(buttons[3].getAttribute('aria-current')).toBe('page');
    fixture.nativeElement.querySelector('s-icon-button button').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.isSidebarExpanded()).toBe(false);
    expect(menu.querySelector('button')?.getAttribute('aria-label')).toBe('Início');
    fixture.destroy();
  });

  it('fecha o drawer móvel ao selecionar um módulo', () => {
    vi.stubGlobal('innerWidth', 390);
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    expect(fixture.nativeElement.querySelector('s-sidebar')).toBeNull();
    fixture.nativeElement.querySelector('s-icon-button button').click();
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('aside s-sidebar nav button');
    expect(buttons.length).toBe(8);
    buttons[3].click();
    fixture.detectChanges();
    expect(navigate).toHaveBeenCalledWith(['/profissionais']);
    expect(fixture.nativeElement.querySelector('aside')).toBeNull();
    fixture.destroy();
  });

  it('preserva o tema e os dados de perfil', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('#shell-theme-toggle-button button').click();
    fixture.detectChanges();
    expect(toggleTheme).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('#shell-theme-toggle-button button').getAttribute('aria-label')).toBe('Alternar para tema claro');
    fixture.nativeElement.querySelector('#shell-profile-button').click();
    fixture.detectChanges();
    expect(document.querySelector('[role="menu"]')?.textContent).toContain('Carlos Eduardo Lima');
    expect(document.querySelector('[role="menu"]')?.textContent).toContain('Matrícula: 0045213-9');
    fixture.destroy();
  });

  it('mantém a opção condicional de troca de matrícula', () => {
    vi.spyOn(TestBed.inject(AuthSessionService), 'canSwitchMatricula').mockReturnValue(true);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('#shell-profile-button').click();
    fixture.detectChanges();
    const options = Array.from(document.querySelectorAll('[role="menuitem"]')) as HTMLButtonElement[];
    expect(options.map(option => option.textContent?.trim())).toContain('swap_horizTrocar matrícula');
    options[0].click();
    expect(navigate).toHaveBeenCalledWith(['/selecionar-matricula']);
    fixture.destroy();
  });
});
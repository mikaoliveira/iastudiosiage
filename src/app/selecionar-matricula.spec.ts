import {provideZonelessChangeDetection, signal} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {vi} from 'vitest';
import {App} from './app';
import {AuthSessionService, UsuarioTeste} from './auth-session';
import {SelecionarMatricula} from './selecionar-matricula';

describe('Selecionar matrícula', () => {
  let fixture: ComponentFixture<SelecionarMatricula>;
  let auth: AuthSessionService;
  let root: HTMLElement;
  const usuario: UsuarioTeste = {
    cpf: '00000000000',
    nome: 'Pessoa de teste',
    matriculas: [
      {matricula: '100-1', funcao: 'Professora', utb: 'Escola A'},
      {matricula: '200-2', funcao: 'Coordenadora', utb: 'Escola B'}
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelecionarMatricula],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {provide: App, useValue: {isDark: signal(false), toggleTheme: vi.fn()}}
      ]
    }).compileComponents();
    auth = TestBed.inject(AuthSessionService);
    auth.loggedInUser.set(usuario);
    auth.selectedMatricula.set(null);
    fixture = TestBed.createComponent(SelecionarMatricula);
    root = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function botoes(rotulo: string): HTMLButtonElement[] {
    return Array.from(root.querySelectorAll<HTMLButtonElement>('button'))
      .filter(botao => botao.textContent?.includes(rotulo));
  }

  it('apresenta os dados de cada vínculo e acessa a matrícula escolhida', () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    expect(root.textContent).toContain('100-1');
    expect(root.textContent).toContain('Professora');
    expect(root.textContent).toContain('Escola A');
    expect(root.textContent).toContain('200-2');
    expect(root.textContent).toContain('Coordenadora');
    expect(root.textContent).toContain('Escola B');
    expect(botoes('Acessar')).toHaveLength(2);

    botoes('Acessar')[1].click();

    expect(auth.loggedInUser()).toEqual(usuario);
    expect(auth.selectedMatricula()).toEqual(usuario.matriculas[1]);
    expect(navegar).toHaveBeenCalledExactlyOnceWith(['/inicio']);
  });

  it('encerra a sessão e retorna ao login ao sair', () => {
    auth.selectedMatricula.set(usuario.matriculas[0]);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    botoes('Sair')[0].click();

    expect(auth.loggedInUser()).toBeNull();
    expect(auth.selectedMatricula()).toBeNull();
    expect(navegar).toHaveBeenCalledExactlyOnceWith(['/login']);
  });

  it('apresenta o estado vazio e permite voltar ao login', () => {
    auth.loggedInUser.set(null);
    fixture.detectChanges();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    expect(root.textContent).toContain('Nenhuma matrícula encontrada ou sessão expirada.');
    expect(root.textContent).toContain('Por favor, retorne ao login e faça a autenticação novamente.');
    expect(botoes('Acessar')).toHaveLength(0);

    botoes('Voltar para o login')[0].click();

    expect(auth.selectedMatricula()).toBeNull();
    expect(navegar).toHaveBeenCalledExactlyOnceWith(['/login']);
  });

  it('simula erro e recupera a listagem ao tentar novamente', () => {
    vi.useFakeTimers();
    botoes('Simular Falha de Conexão')[0].click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Não foi possível carregar suas matrículas.');
    expect(root.textContent).toContain('Verifique sua conexão e tente novamente.');
    expect(botoes('Acessar')).toHaveLength(0);

    botoes('Tentar novamente')[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.isTentandoNovamente()).toBe(true);
    expect(root.textContent).toContain('Carregando...');
    expect(botoes('Voltar para o login')[0].disabled).toBe(true);
    vi.advanceTimersByTime(700);
    fixture.detectChanges();

    expect(fixture.componentInstance.isTentandoNovamente()).toBe(false);
    expect(fixture.componentInstance.erroConexao()).toBe(false);
    expect(botoes('Acessar')).toHaveLength(2);
  });
});
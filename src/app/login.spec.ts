import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {SToastService} from '@siage/siage-ui';
import {vi} from 'vitest';
import {App} from './app';
import {AuthSessionService} from './auth-session';
import {Login} from './login';

describe('Login with SIAGE-UI', () => {
  let fixture: ComponentFixture<Login>;
  let login: Login;
  let auth: AuthSessionService;
  let root: HTMLElement;
  const toast = {error: vi.fn(), warning: vi.fn(), success: vi.fn()};

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        {provide: App, useValue: {}},
        {provide: SToastService, useValue: toast}
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(Login);
    login = fixture.componentInstance;
    auth = TestBed.inject(AuthSessionService);
    root = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function inputValue(selector: string, value: string) {
    const input = root.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input', {bubbles: true}));
    fixture.detectChanges();
    return input;
  }

  function blurInput(input: HTMLInputElement) {
    input.dispatchEvent(new Event('blur'));
    input.dispatchEvent(new FocusEvent('focusout', {bubbles: true}));
    fixture.detectChanges();
  }

  it('uses official controls, masks CPF and keeps the submit availability rule', () => {
    const submit = root.querySelector<HTMLButtonElement>('#login-submit-button button')!;
    expect(root.querySelectorAll('s-field').length).toBe(2);
    expect(submit.disabled).toBe(true);
    const cpf = inputValue('#login-cpf-input', '52998224725');
    expect(cpf.value).toBe('529.982.247-25');
    expect(login.loginForm.controls.cpf.value).toBe('529.982.247-25');
    inputValue('#login-password-input', 'short');
    expect(submit.disabled).toBe(false);
    expect(login.loginForm.valid).toBe(false);
  });

  it('preserves required and invalid messages and their touched timing', () => {
    expect(root.textContent).not.toContain('CPF é obrigatório.');
    blurInput(root.querySelector<HTMLInputElement>('#login-cpf-input')!);
    blurInput(root.querySelector<HTMLInputElement>('#login-password-input')!);
    expect(root.textContent).toContain('CPF é obrigatório.');
    expect(root.textContent).toContain('Senha é obrigatória.');
    inputValue('#login-cpf-input', '11111111111');
    inputValue('#login-password-input', 'short');
    expect(root.textContent).toContain('CPF é inválido.');
    expect(root.textContent).toContain('A senha deve conter de 8 a 16 caracteres.');
    inputValue('#login-cpf-input', '52998224725');
    inputValue('#login-password-input', 'Educacao@2026');
    expect(root.textContent).not.toContain('CPF é inválido.');
    expect(root.textContent).not.toContain('A senha deve conter de 8 a 16 caracteres.');
  });

  it('keeps password visibility, character limits, remember-me and recovery link', () => {
    const password = inputValue('#login-password-input', 'Educacao@2026');
    expect(password.type).toBe('password');
    expect(password.maxLength).toBe(16);
    expect(root.querySelector<HTMLInputElement>('#login-cpf-input')!.maxLength).toBe(14);
    root.querySelector<HTMLButtonElement>('s-input s-icon-button button')!.click();
    fixture.detectChanges();
    expect(password.type).toBe('text');
    root.querySelector<HTMLButtonElement>('s-input s-icon-button button')!.click();
    fixture.detectChanges();
    expect(password.type).toBe('password');
    root.querySelector<HTMLInputElement>('s-checkbox input')!.click();
    expect(login.loginForm.controls.rememberMe.value).toBe(true);
    expect(root.querySelector('a')!.getAttribute('href')).toBe('/login/esqueci-senha');
    expect(root.querySelector('#forgot-password-link')!.childElementCount).toBe(0);
  });

  it('keeps the simulator separate from SIAGE-UI and preserves all scenario buttons', () => {
    const simulate = vi.spyOn(login, 'simularCenario').mockImplementation(() => undefined);
    const opener = root.querySelector<HTMLButtonElement>('#login-prototype-toggle-btn')!;
    expect(opener.tagName).toBe('BUTTON');
    opener.click();
    fixture.detectChanges();
    const simulator = root.querySelector<HTMLElement>('.fixed')!;
    expect(Array.from(simulator.querySelectorAll('*')).some(element => element.tagName.startsWith('S-'))).toBe(false);
    const close = simulator.querySelector<HTMLButtonElement>('button[title="Fechar simulador"]')!;
    const actions = Array.from(simulator.querySelectorAll<HTMLButtonElement>('button')).filter(button => button !== close);
    expect(actions.length).toBe(8);
    actions.forEach(button => button.click());
    expect(simulate.mock.calls.map(([scenario]) => scenario)).toEqual([
      'cpf-invalido', 'credenciais-invalidas', 'sem-acesso', 'usuario-inativo',
      'servico-indisponivel', 'sucesso-individual', 'sucesso-multiplo', 'primeiro-acesso'
    ]);
    close.click();
    fixture.detectChanges();
    expect(login.showSimulator()).toBe(false);
    expect(root.querySelector('#login-prototype-toggle-btn')).not.toBeNull();
  });

  it('submits through the official button, shows loading and prevents duplicate authentication', () => {
    vi.useFakeTimers();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const authenticate = vi.spyOn(auth, 'login');
    inputValue('#login-cpf-input', '52998224725');
    inputValue('#login-password-input', 'Educacao@2026');
    const submit = root.querySelector<HTMLButtonElement>('#login-submit-button button')!;
    submit.click();
    fixture.detectChanges();
    expect(login.isLoading()).toBe(true);
    expect(submit.disabled).toBe(true);
    expect(root.textContent).toContain('Entrando...');
    login.onSubmit();
    vi.advanceTimersByTime(450);
    expect(authenticate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/inicio']);
  });

  it.each([
    ['cpf-invalido', 'error', 'CPF é inválido.', false],
    ['credenciais-invalidas', 'warning', 'CPF ou senha incorretos. Verifique os dados informados.', true],
    ['sem-acesso', 'error', 'Seu usuário não possui permissão para acessar o SIAGE-RH.', true],
    ['usuario-inativo', 'warning', 'Seu usuário está inativo. Procure o responsável pela Gestão de Acesso da sua unidade.', true],
    ['servico-indisponivel', 'error', 'Não foi possível concluir o acesso. Tente novamente.', false]
  ] as const)('preserves the %s scenario and its toast', (scenario, kind, message, clearsPassword) => {
    vi.useFakeTimers();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    login.simularCenario(scenario);
    vi.advanceTimersByTime(450);
    fixture.detectChanges();
    expect(toast[kind]).toHaveBeenCalledExactlyOnceWith(message);
    expect(navigate).not.toHaveBeenCalled();
    expect(login.isLoading()).toBe(false);
    if (clearsPassword) {
      expect(login.loginForm.controls.password.value).toBe('');
      expect(login.loginForm.controls.password.touched).toBe(false);
      expect(root.textContent).not.toContain('Senha é obrigatória.');
    }
  });

  it.each([
    ['sucesso-individual', '/inicio', '52998224725'],
    ['sucesso-multiplo', '/selecionar-matricula', '10000000019'],
    ['primeiro-acesso', '/primeiro-acesso', '10000000108']
  ] as const)('preserves the %s destination and simulated user', (scenario, destination, cpf) => {
    vi.useFakeTimers();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    login.simularCenario(scenario);
    vi.advanceTimersByTime(450);
    expect(navigate).toHaveBeenCalledExactlyOnceWith([destination]);
    expect(auth.loggedInUser()?.cpf).toBe(cpf);
    expect(auth.firstAccessRequired()).toBe(scenario === 'primeiro-acesso');
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it('keeps the existing fallback for another valid CPF', () => {
    vi.useFakeTimers();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    login.loginForm.patchValue({cpf: '123.456.789-09', password: 'Educacao@2026'});
    login.onSubmit();
    vi.advanceTimersByTime(450);
    expect(navigate).toHaveBeenCalledWith(['/inicio']);
    expect(auth.loggedInUser()?.nome).toBe('Servidor Público da Educação');
  });

  it('shows the existing password-changed success toast once on returning to Login', () => {
    auth.firstAccessPasswordChanged.set(true);
    login.ngOnInit();
    login.ngOnInit();
    expect(toast.success).toHaveBeenCalledExactlyOnceWith('Senha alterada com sucesso. Entre no SIAGE-RH utilizando sua nova senha.');
  });
});
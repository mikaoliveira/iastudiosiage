import {TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {SToastService} from '@siage/siage-ui';
import {vi} from 'vitest';
import {App} from './app';
import {AuthSessionService, USUARIOS_TESTE} from './auth-session';
import {EsqueciSenha} from './esqueci-senha';
import {PrimeiroAcesso} from './primeiro-acesso';
import {ToastService} from './toast';

describe('Recuperação de acesso', () => {
  const toast = {error: vi.fn(), showGenericError: vi.fn()};
  const simulatorToast = {error: vi.fn(), showGenericError: vi.fn()};

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    await TestBed.configureTestingModule({
      imports: [PrimeiroAcesso, EsqueciSenha],
      providers: [
        provideRouter([]),
        {provide: App, useValue: {isDark: () => false, toggleTheme: vi.fn()}},
        {provide: ToastService, useValue: simulatorToast},
        {provide: SToastService, useValue: toast}
      ]
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('mantém a validação e o redirecionamento no primeiro acesso', () => {
    const auth = TestBed.inject(AuthSessionService);
    auth.startFirstAccess(USUARIOS_TESTE[3], 'Provisoria@123');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(PrimeiroAcesso);
    fixture.detectChanges();
    const screen = fixture.componentInstance;
    expect(fixture.nativeElement.querySelectorAll('s-field').length).toBe(3);
    vi.useFakeTimers();
    screen.primeiroAcessoForm.patchValue({senhaAtual: 'Incorreta@123', novaSenha: 'NovaSenha@2026', confirmaSenha: 'NovaSenha@2026'});
    screen.onSubmit(new Event('submit'));
    vi.advanceTimersByTime(600);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Senha atual incorreta. Verifique a informação e tente novamente.');
    screen.primeiroAcessoForm.controls.senhaAtual.setValue('Provisoria@123');
    screen.onSenhaAtualInput();
    screen.onSubmit(new Event('submit'));
    vi.advanceTimersByTime(600);
    expect(navigate).toHaveBeenCalledWith(['/login']);
    expect(auth.firstAccessPasswordChanged()).toBe(true);
  });

  it('mantém a máscara de CPF e os erros na recuperação', () => {
    const fixture = TestBed.createComponent(EsqueciSenha);
    fixture.detectChanges();
    const cpf = fixture.nativeElement.querySelector('#forgot-cpf-input') as HTMLInputElement;
    cpf.value = '11144477735';
    cpf.dispatchEvent(new Event('input', {bubbles: true}));
    fixture.detectChanges();
    expect(cpf.value).toBe('111.444.777-35');
    expect(fixture.componentInstance.isIdentificacaoValida()).toBe(true);
    vi.useFakeTimers();
    fixture.componentInstance.onStep1Submit(new Event('submit'));
    vi.advanceTimersByTime(750);
    expect(toast.error).toHaveBeenCalledWith('Cadastro não encontrado. Verifique os dados informados.');
    expect(fixture.componentInstance.currentStep()).toBe(1);
    fixture.destroy();
  });

  it('preserva o toast original do simulador de código expirado', () => {
    const fixture = TestBed.createComponent(EsqueciSenha);
    fixture.detectChanges();
    fixture.componentInstance.simularCodigoExpirado();
    expect(simulatorToast.error).toHaveBeenCalledWith('Código expirado. Solicite o reenvio e tente novamente.');
    expect(toast.error).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('mantém código inválido e redirecionamento após redefinição', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(EsqueciSenha);
    fixture.detectChanges();
    const screen = fixture.componentInstance;
    vi.useFakeTimers();
    screen.currentStep.set(2);
    screen.activeSecurityCode.set('123456');
    screen.codigoControl.setValue('000000');
    screen.onStep2Submit(new Event('submit'));
    vi.advanceTimersByTime(750);
    expect(screen.codigoErro()).toContain('Código inválido.');
    screen.codigoControl.setValue('123456');
    screen.onStep2Submit(new Event('submit'));
    vi.advanceTimersByTime(750);
    expect(screen.currentStep()).toBe(3);
    fixture.detectChanges();
    const newPassword = fixture.nativeElement.querySelector('#step3-new-password') as HTMLInputElement;
    const confirmation = fixture.nativeElement.querySelector('#step3-confirm-password') as HTMLInputElement;
    newPassword.value = 'NovaSenha@2026';
    newPassword.dispatchEvent(new Event('input', {bubbles: true}));
    confirmation.value = 'NovaSenha@2026';
    confirmation.dispatchEvent(new Event('input', {bubbles: true}));
    fixture.detectChanges();
    expect(screen.isAllRulesPassed()).toBe(true);
    screen.onStep3Submit(new Event('submit'));
    vi.advanceTimersByTime(750);
    await Promise.resolve();
    expect(navigate).toHaveBeenCalledWith(['/login']);
    expect(TestBed.inject(AuthSessionService).firstAccessPasswordChanged()).toBe(true);
    fixture.destroy();
  });
});
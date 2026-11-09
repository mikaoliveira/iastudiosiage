import {Component, inject, signal, computed, OnInit} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatButtonModule} from '@angular/material/button';
import {App} from './app';
import {AuthSessionService, USUARIOS_TESTE} from './auth-session';
import {ToastService} from './toast';

// Validação oficial de CPF (11 dígitos, dígitos verificadores e rejeição de sequências repetidas)
export function isValidCPF(cpfRaw: string): boolean {
  const digitsOnly = String(cpfRaw).replace(/\D/g, '');
  if (digitsOnly.length !== 11) return false;
  // Rejeita sequências de números iguais (ex: 111.111.111-11, 222.222.222-22, etc.)
  if (/^(\d)\1{10}$/.test(digitsOnly)) return false;

  let sum = 0;
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(digitsOnly.substring(i - 1, i), 10) * (11 - i);
  }
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(digitsOnly.substring(9, 10), 10)) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(digitsOnly.substring(i - 1, i), 10) * (12 - i);
  }
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(digitsOnly.substring(10, 11), 10)) return false;

  return true;
}

export function cpfFormatValidator(control: AbstractControl): ValidationErrors | null {
  const val = control.value;
  if (!val) return null;
  const digitsOnly = String(val).replace(/\D/g, '');
  if (digitsOnly.length === 0) return null;
  if (!isValidCPF(digitsOnly)) {
    return { cpfInvalid: true };
  }
  return null;
}

export function loginPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const val = control.value;
  if (!val) return null;
  if (val.length < 8 || val.length > 16) {
    return { passwordLength: true };
  }
  return null;
}

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
    MatButtonModule
  ],
  template: `
    <div class="w-full max-w-[520px] bg-siage-surface border border-siage-border rounded-xl shadow-lg p-8 sm:p-9 lg:p-10 transition-all duration-300 relative">
      
      <!-- Título e Subtítulo -->
      <div class="text-center mb-5 sm:mb-6">
        <h1 class="text-xl sm:text-2xl font-poppins font-bold tracking-tight text-siage-text-primary">Acesse o SIAGE-RH</h1>
        <p class="text-xs sm:text-sm text-siage-text-secondary mt-1">Informe seu CPF e senha para acessar o sistema.</p>
      </div>

      <!-- Formulário -->
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-3.5 sm:gap-4">
        
        <!-- Campo CPF -->
        <div class="form-field-group">
          <label class="form-label" for="login-cpf-input">
            CPF <span class="required-marker">*</span>
          </label>
          <mat-form-field appearance="outline" class="w-full compact-auth-field" subscriptSizing="fixed">
            <input 
              matInput 
              formControlName="cpf" 
              placeholder="000.000.000-00"
              (input)="onCpfInput($event)"
              (blur)="onCpfBlur()"
              maxlength="14"
              id="login-cpf-input"
            />
            @if (loginForm.controls.cpf.touched && loginForm.controls.cpf.hasError('required')) {
              <mat-error id="login-cpf-required-error">CPF é obrigatório.</mat-error>
            } @else if (loginForm.controls.cpf.touched && loginForm.controls.cpf.hasError('cpfInvalid')) {
              <mat-error id="login-cpf-invalid-error">CPF é inválido.</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Campo Senha -->
        <div class="form-field-group">
          <label class="form-label" for="login-password-input">
            Senha <span class="required-marker">*</span>
          </label>
          <mat-form-field appearance="outline" class="w-full compact-auth-field" subscriptSizing="fixed">
            <input 
              matInput 
              [type]="hidePassword() ? 'password' : 'text'" 
              formControlName="password"
              placeholder="Digite sua senha"
              (input)="onPasswordInput()"
              (blur)="onPasswordBlur()"
              maxlength="16"
              id="login-password-input"
            />
            <button 
              type="button" 
              matSuffix 
              (click)="hidePassword.set(!hidePassword())" 
              class="text-siage-text-secondary hover:text-siage-primary transition-colors pr-2 cursor-pointer"
              aria-label="Alternar visibilidade da senha"
            >
              <span class="material-icons text-xl">{{ hidePassword() ? 'visibility_off' : 'visibility' }}</span>
            </button>
            @if (loginForm.controls.password.touched && loginForm.controls.password.hasError('required')) {
              <mat-error id="login-password-required-error">Senha é obrigatória.</mat-error>
            } @else if (loginForm.controls.password.touched && loginForm.controls.password.hasError('passwordLength')) {
              <mat-error id="login-password-length-error">A senha deve conter de 8 a 16 caracteres.</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Linha: Lembrar + Esqueceu Senha -->
        <div class="flex flex-wrap items-center justify-between gap-2 mt-0 mb-0.5">
          <mat-checkbox formControlName="rememberMe" color="primary" class="text-sm text-siage-text-secondary">
            <span class="text-xs font-sans">Lembrar de mim</span>
          </mat-checkbox>
          <a 
            routerLink="/login/esqueci-senha" 
            class="text-xs font-sans font-semibold text-siage-primary hover:underline"
            id="forgot-password-link"
          >
            Esqueceu a senha?
          </a>
        </div>

        <!-- Botão Entrar (habilitado apenas quando os 2 campos estiverem preenchidos) -->
        <button 
          type="submit" 
          [disabled]="isLoginButtonDisabled()"
          class="w-full py-3 sm:py-3.5 font-sans font-bold tracking-wide text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-siage-primary hover:bg-siage-primary/95 text-white rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2 mt-1"
          id="login-submit-button"
        >
          @if (isLoading()) {
            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Entrando...</span>
          } @else {
            <span>Entrar no sistema</span>
          }
        </button>

      </form>
    </div>

    <!-- ========================================== -->
    <!-- SIMULADOR DE CENÁRIOS ULTRA-DISCRETO (FIXO NO CANTO INFERIOR) -->
    <!-- ========================================== -->
    <div class="fixed bottom-3 right-3 z-40 print:hidden font-sans">
      @if (!showSimulator()) {
        <!-- Botão flutuante minimalista translúcido no canto -->
        <button
          type="button"
          (click)="showSimulator.set(true)"
          title="Simulador de cenários do protótipo"
          class="opacity-60 hover:opacity-100 transition-opacity duration-200 bg-siage-surface/90 hover:bg-siage-surface border border-siage-border text-siage-text-secondary hover:text-siage-text-primary px-2.5 py-1 rounded-full text-[11px] font-mono flex items-center gap-1.5 shadow-sm cursor-pointer backdrop-blur-xs select-none"
          id="login-prototype-toggle-btn"
        >
          <span class="material-icons text-xs" style="font-size: 13px; width: 13px; height: 13px;">science</span>
          <span class="hidden sm:inline">simulador</span>
        </button>
      } @else {
        <!-- Painel flutuante compacto que não interfere no formulário nem no card -->
        <div class="bg-siage-surface/95 border border-siage-border rounded-xl shadow-xl p-3.5 text-xs w-76 sm:w-84 backdrop-blur-md animate-fadeIn transition-colors">
          <div class="flex items-center justify-between pb-2 border-b border-siage-border/60 mb-2.5">
            <div class="flex items-center gap-1.5 text-siage-text-primary text-[11px] font-semibold">
              <span class="material-icons text-sm text-siage-primary" style="font-size: 15px; width: 15px; height: 15px;">science</span>
              <span>Simulador de Cenários — Login</span>
            </div>
            <button 
              type="button" 
              (click)="showSimulator.set(false)" 
              class="text-siage-text-secondary hover:text-siage-text-primary p-0.5 rounded cursor-pointer"
              title="Fechar simulador"
            >
              <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
            </button>
          </div>

          <!-- Toasts de Aviso Solicitados -->
          <div class="space-y-2.5 text-siage-text-secondary">
            <div>
              <span class="text-[10px] uppercase font-bold text-siage-text-secondary block mb-1.5 tracking-wider">
                Toasts de aviso (simulação):
              </span>
              <div class="flex flex-col gap-1.5">
                <button 
                  type="button" 
                  (click)="simularCenario('cpf-invalido')" 
                  class="w-full text-left px-2.5 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/20 transition-colors cursor-pointer text-[11px] font-medium flex items-center justify-between"
                  title="Simular CPF inválido (111.111.111-11) para validação local"
                  id="simulator-cpf-invalido"
                >
                  <span>CPF inválido (111.111.111-11)</span>
                  <mat-icon style="font-size: 14px; width: 14px; height: 14px;">arrow_forward</mat-icon>
                </button>

                <button 
                  type="button" 
                  (click)="simularCenario('credenciais-invalidas')" 
                  class="w-full text-left px-2.5 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 transition-colors cursor-pointer text-[11px] font-medium flex items-center justify-between"
                  title="Simular CPF ou senha incorretos"
                >
                  <span>Credenciais inválidas</span>
                  <mat-icon style="font-size: 14px; width: 14px; height: 14px;">arrow_forward</mat-icon>
                </button>

                <button 
                  type="button" 
                  (click)="simularCenario('sem-acesso')" 
                  class="w-full text-left px-2.5 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 transition-colors cursor-pointer text-[11px] font-medium flex items-center justify-between"
                  title="Simular usuário sem permissão no SIAGE-RH"
                >
                  <span>Usuário sem acesso ao SIAGE-RH</span>
                  <mat-icon style="font-size: 14px; width: 14px; height: 14px;">arrow_forward</mat-icon>
                </button>

                <button 
                  type="button" 
                  (click)="simularCenario('usuario-inativo')" 
                  class="w-full text-left px-2.5 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 transition-colors cursor-pointer text-[11px] font-medium flex items-center justify-between"
                  title="Simular usuário inativo"
                  id="simulator-usuario-inativo"
                >
                  <span>Usuário inativo</span>
                  <mat-icon style="font-size: 14px; width: 14px; height: 14px;">arrow_forward</mat-icon>
                </button>

                <button 
                  type="button" 
                  (click)="simularCenario('servico-indisponivel')" 
                  class="w-full text-left px-2.5 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-colors cursor-pointer text-[11px] font-medium flex items-center justify-between"
                  title="Simular falha de comunicação com o AUTH"
                >
                  <span>Serviço indisponível</span>
                  <mat-icon style="font-size: 14px; width: 14px; height: 14px;">arrow_forward</mat-icon>
                </button>
              </div>
            </div>

            <!-- Acessos Válidos (Sucesso) -->
            <div class="pt-1.5 border-t border-siage-border/60">
              <span class="text-[10px] uppercase font-bold text-siage-text-secondary block mb-1.5 tracking-wider">
                Acessos válidos (sucesso):
              </span>
              <div class="flex flex-col gap-1.5">
                <button 
                  type="button" 
                  (click)="simularCenario('sucesso-individual')" 
                  class="w-full text-left px-2.5 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 transition-colors cursor-pointer text-[11px] font-medium flex items-center justify-between"
                >
                  <span>Sucesso (1 Matrícula)</span>
                  <mat-icon style="font-size: 14px; width: 14px; height: 14px;">arrow_forward</mat-icon>
                </button>

                <button 
                  type="button" 
                  (click)="simularCenario('sucesso-multiplo')" 
                  class="w-full text-left px-2.5 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 transition-colors cursor-pointer text-[11px] font-medium flex items-center justify-between"
                >
                  <span>Sucesso (Múltiplas Matrículas)</span>
                  <mat-icon style="font-size: 14px; width: 14px; height: 14px;">arrow_forward</mat-icon>
                </button>

                <button 
                  type="button" 
                  (click)="simularCenario('primeiro-acesso')" 
                  class="w-full text-left px-2.5 py-1.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/20 transition-colors cursor-pointer text-[11px] font-medium flex items-center justify-between"
                  title="Simular usuário no primeiro acesso (deve definir nova senha)"
                  id="simulator-primeiro-acesso"
                >
                  <span>Primeiro acesso</span>
                  <mat-icon style="font-size: 14px; width: 14px; height: 14px;">arrow_forward</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-fadeIn {
      animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class Login implements OnInit {
  readonly app = inject(App);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthSessionService);
  private readonly toastService = inject(ToastService);

  readonly hidePassword = signal(true);
  readonly isLoading = signal(false);
  readonly showSimulator = signal(false);

  ngOnInit() {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Se concluiu o Primeiro Acesso ou Redefinição de Senha, exibe Toast global de sucesso
    if (this.authService.consumeFirstAccessPasswordChanged()) {
      this.toastService.success('Senha alterada com sucesso. Entre no SIAGE-RH utilizando sua nova senha.');
    }
  }

  readonly loginForm = new FormGroup({
    cpf: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, cpfFormatValidator]
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, loginPasswordValidator]
    }),
    rememberMe: new FormControl<boolean>(false, {
      nonNullable: true
    })
  });

  private readonly formValues = toSignal(
    this.loginForm.valueChanges,
    { initialValue: this.loginForm.getRawValue() }
  );

  readonly isLoginButtonDisabled = computed(() => {
    if (this.isLoading()) return true;
    const vals = this.formValues();
    const cpf = (vals?.cpf ?? '').replace(/\D/g, '').trim();
    const pass = (vals?.password ?? '').trim();
    return cpf.length === 0 || pass.length === 0;
  });

  onCpfInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let raw = input.value.replace(/\D/g, '');
    
    if (raw.length > 11) {
      raw = raw.substring(0, 11);
    }
    
    let formatted = '';
    if (raw.length <= 3) {
      formatted = raw;
    } else if (raw.length <= 6) {
      formatted = raw.substring(0, 3) + '.' + raw.substring(3);
    } else if (raw.length <= 9) {
      formatted = raw.substring(0, 3) + '.' + raw.substring(3, 6) + '.' + raw.substring(6);
    } else {
      formatted = raw.substring(0, 3) + '.' + raw.substring(3, 6) + '.' + raw.substring(6, 9) + '-' + raw.substring(9);
    }
    
    this.loginForm.controls.cpf.setValue(formatted, { emitEvent: true });
    // Mantém a validação ativa se o campo já foi tocado, removendo o erro apenas se tornar-se válido (Regra 6)
    if (this.loginForm.controls.cpf.touched) {
      this.loginForm.controls.cpf.updateValueAndValidity();
    }
  }

  onCpfBlur() {
    this.loginForm.controls.cpf.markAsTouched();
    this.loginForm.controls.cpf.updateValueAndValidity();
  }

  onPasswordInput() {
    // Não limpa o erro se o valor continuar fora do intervalo definido (Regra 6)
    if (this.loginForm.controls.password.touched) {
      this.loginForm.controls.password.updateValueAndValidity();
    }
  }

  onPasswordBlur() {
    this.loginForm.controls.password.markAsTouched();
    this.loginForm.controls.password.updateValueAndValidity();
  }

  onSubmit() {
    this.loginForm.markAllAsTouched();
    this.loginForm.updateValueAndValidity();
    if (this.loginForm.controls.cpf.hasError('cpfInvalid')) {
      this.toastService.error('CPF é inválido.');
      return;
    }
    if (this.loginForm.invalid || this.isLoginButtonDisabled()) {
      return;
    }
    this.executarAutenticacao();
  }

  executarAutenticacao() {
    // Bloqueia qualquer envio se o formulário for inválido localmente ou estiver carregando
    if (this.loginForm.invalid || this.isLoginButtonDisabled() || this.isLoading()) return;

    const cpfRaw = this.loginForm.controls.cpf.value.replace(/\D/g, '');
    const password = this.loginForm.controls.password.value;

    this.isLoading.set(true);

    // Simulação do tempo de resposta do serviço de autenticação
    setTimeout(() => {
      this.isLoading.set(false);

      // CENÁRIO 4: Serviço indisponível (falha na comunicação com o AUTH)
      if (cpfRaw === '10000000442') {
        this.toastService.error('Não foi possível concluir o acesso. Tente novamente.');
        return;
      }

      // CENÁRIO 2: Usuário sem acesso ao SIAGE-RH
      if (cpfRaw === '10000000280') {
        this.toastService.error('Seu usuário não possui permissão para acessar o SIAGE-RH.');
        this.loginForm.controls.password.setValue('');
        this.loginForm.controls.password.markAsUntouched();
        return;
      }

      // CENÁRIO: Cadastro não encontrado
      if (cpfRaw === '00000000000') {
        this.toastService.error('Cadastro não encontrado. Verifique os dados informados.');
        return;
      }

      // CENÁRIO: Usuário inativo
      if (cpfRaw === '10000000361') {
        this.toastService.warning('Seu usuário está inativo. Procure o responsável pela Gestão de Acesso da sua unidade.');
        this.loginForm.controls.password.setValue('');
        this.loginForm.controls.password.markAsUntouched();
        return;
      }

      // CENÁRIO PRIMEIRO ACESSO (CPF 100.000.001-08)
      if (cpfRaw === '10000000108' && this.authService.isFirstAccessPending(cpfRaw)) {
        const foundPrimeiroAcesso = USUARIOS_TESTE.find(u => u.cpf === '10000000108');
        if (foundPrimeiroAcesso) {
          this.isLoading.set(false);
          this.authService.startFirstAccess(foundPrimeiroAcesso, password || 'Provisoria@123');
          this.router.navigate(['/primeiro-acesso']);
          return;
        }
      }

      // Cenário de credenciais simuladas explicitamente como inválidas
      if (password === 'Incorreta@1') {
        this.toastService.warning('CPF ou senha incorretos. Verifique os dados informados.');
        this.loginForm.controls.password.setValue('');
        this.loginForm.controls.password.markAsUntouched();
        return;
      }

      // CENÁRIOS COM USUÁRIOS VÁLIDOS CADASTRADOS (Carlos ou Ana)
      const foundUser = USUARIOS_TESTE.find(u => u.cpf === cpfRaw);

      if (foundUser) {
        if (foundUser.matriculas.length === 1) {
          // Apenas uma matrícula: entra direto na tela inicial
          this.authService.login(foundUser, foundUser.matriculas[0]);
          this.router.navigate(['/inicio']);
        } else {
          // Múltiplas matrículas: vai para seleção de matrícula
          this.authService.loggedInUser.set(foundUser);
          this.router.navigate(['/selecionar-matricula']);
        }
        return;
      }

      // Caso o usuário insira qualquer outro CPF válido para testar o sistema
      const servidorPadrao = {
        cpf: cpfRaw,
        nome: 'Servidor Público da Educação',
        email: 'servidor@see.pb.gov.br',
        matriculas: [
          { matricula: '0186254-5', utb: 'Secretaria de Estado da Educação - Sede', funcao: 'Servidor Público' }
        ]
      };
      this.authService.login(servidorPadrao, servidorPadrao.matriculas[0]);
      this.router.navigate(['/inicio']);
    }, 450);
  }

  simularCenario(tipo: 'cpf-invalido' | 'credenciais-invalidas' | 'sem-acesso' | 'usuario-inativo' | 'servico-indisponivel' | 'sucesso-individual' | 'sucesso-multiplo' | 'primeiro-acesso') {
    if (tipo === 'cpf-invalido') {
      this.loginForm.controls.cpf.setValue('111.111.111-11');
      this.loginForm.controls.password.setValue('Educacao@2026');
      this.loginForm.controls.cpf.markAsTouched();
      this.loginForm.controls.cpf.updateValueAndValidity();
      this.toastService.error('CPF é inválido.');
    } else if (tipo === 'credenciais-invalidas') {
      // CPF válido (Carlos Eduardo Lima) + Senha incorreta mas no formato válido (8 a 16 caracteres)
      this.loginForm.controls.cpf.setValue('529.982.247-25');
      this.loginForm.controls.password.setValue('Incorreta@1');
      this.loginForm.controls.cpf.markAsTouched();
      this.loginForm.controls.password.markAsTouched();
      this.loginForm.controls.cpf.updateValueAndValidity();
      this.loginForm.controls.password.updateValueAndValidity();
      this.executarAutenticacao();
    } else if (tipo === 'sem-acesso') {
      this.loginForm.controls.cpf.setValue('100.000.002-80');
      this.loginForm.controls.password.setValue('Educacao@2026');
      this.loginForm.controls.cpf.markAsTouched();
      this.loginForm.controls.password.markAsTouched();
      this.loginForm.controls.cpf.updateValueAndValidity();
      this.loginForm.controls.password.updateValueAndValidity();
      this.executarAutenticacao();
    } else if (tipo === 'usuario-inativo') {
      this.loginForm.controls.cpf.setValue('100.000.003-61');
      this.loginForm.controls.password.setValue('Educacao@2026');
      this.loginForm.controls.cpf.markAsTouched();
      this.loginForm.controls.password.markAsTouched();
      this.loginForm.controls.cpf.updateValueAndValidity();
      this.loginForm.controls.password.updateValueAndValidity();
      this.executarAutenticacao();
    } else if (tipo === 'servico-indisponivel') {
      this.loginForm.controls.cpf.setValue('100.000.004-42');
      this.loginForm.controls.password.setValue('Educacao@2026');
      this.loginForm.controls.cpf.markAsTouched();
      this.loginForm.controls.password.markAsTouched();
      this.loginForm.controls.cpf.updateValueAndValidity();
      this.loginForm.controls.password.updateValueAndValidity();
      this.executarAutenticacao();
    } else if (tipo === 'sucesso-individual') {
      this.loginForm.controls.cpf.setValue('529.982.247-25');
      this.loginForm.controls.password.setValue('Educacao@2026');
      this.loginForm.controls.cpf.markAsTouched();
      this.loginForm.controls.password.markAsTouched();
      this.loginForm.controls.cpf.updateValueAndValidity();
      this.loginForm.controls.password.updateValueAndValidity();
      this.executarAutenticacao();
    } else if (tipo === 'sucesso-multiplo') {
      this.loginForm.controls.cpf.setValue('100.000.000-19');
      this.loginForm.controls.password.setValue('Educacao@2026');
      this.loginForm.controls.cpf.markAsTouched();
      this.loginForm.controls.password.markAsTouched();
      this.loginForm.controls.cpf.updateValueAndValidity();
      this.loginForm.controls.password.updateValueAndValidity();
      this.executarAutenticacao();
    } else if (tipo === 'primeiro-acesso') {
      this.authService.resetFirstAccessPending('10000000108');
      this.isLoading.set(false);
      this.loginForm.controls.cpf.setValue('100.000.001-08');
      this.loginForm.controls.password.setValue('Provisoria@123');
      this.loginForm.controls.cpf.markAsTouched();
      this.loginForm.controls.password.markAsTouched();
      this.loginForm.controls.cpf.updateValueAndValidity();
      this.loginForm.controls.password.updateValueAndValidity();
      this.executarAutenticacao();
    }
  }
}

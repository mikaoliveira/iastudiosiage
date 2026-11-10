import {Component, inject, signal, computed, ChangeDetectionStrategy, OnInit, ChangeDetectorRef} from '@angular/core';
import {Router} from '@angular/router';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormControl, FormGroup, Validators, AbstractControl} from '@angular/forms';
import {toSignal} from '@angular/core/rxjs-interop';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {SButtonComponent, SCardComponent, SFieldComponent, SIconButtonComponent, SInputComponent} from '@siage/siage-ui';
import {ErrorStateMatcher} from '@angular/material/core';
import {App} from './app';
import {AuthSessionService, USUARIOS_TESTE} from './auth-session';
import {ToastService} from './toast';

export class ImmediateErrorMatcher implements ErrorStateMatcher {
  isErrorState(control: AbstractControl | null): boolean {
    return !!(control && control.invalid && (control.touched || control.dirty || control.hasError('senhaIncorreta')));
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-primeiro-acesso',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    SButtonComponent,
    SCardComponent,
    SFieldComponent,
    SIconButtonComponent,
    SInputComponent
  ],
  template: `
    <!-- Cabeçalho Institucional Fixo -->
    <header class="fixed top-0 left-0 right-0 z-40 h-14 sm:h-16 bg-white dark:bg-[#151D30] border-b border-siage-border/40 shadow-xs transition-colors duration-200" id="app-header">
      <div class="w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-full flex items-center justify-between">
        <!-- Logo do RH na ponta esquerda -->
        <div class="flex items-center" id="header-logo-rh">
          <img 
            [src]="app.isDark() ? 'logo-siage-rh-dark.png' : 'logo-siage-rh-light.png'" 
            alt="SIAGE-RH" 
            class="h-8 sm:h-10 md:h-11 w-auto object-contain" 
            referrerpolicy="no-referrer" 
          />
        </div>

        <!-- Alternador de Tema e Ação Sair na ponta direita -->
        <div class="flex items-center gap-2 sm:gap-3">
          <s-icon-button
            type="button" 
            (click)="app.toggleTheme()" 
            [icon]="app.isDark() ? 'light_mode' : 'dark_mode'"
            [label]="app.isDark() ? 'Alternar para tema claro' : 'Alternar para tema escuro'"
            id="theme-toggle-button"
          />

          <button 
            type="button"
            (click)="sair()" 
            class="font-sans font-semibold text-xs sm:text-sm text-siage-text-primary hover:text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            id="header-sair-btn"
            title="Sair do sistema"
          >
            <mat-icon class="text-base" style="font-size: 18px; width: 18px; height: 18px;">logout</mat-icon>
            <span>Sair</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Conteúdo Principal com Fundo Degradê e Card Centralizado -->
    <main class="min-h-screen flex flex-col justify-between pt-14 sm:pt-16 bg-gradient-to-br from-siage-background via-siage-background to-siage-primary/5 text-siage-text-primary">
      <div class="flex-1 flex items-center justify-center px-3 sm:px-4 py-2 sm:py-3 md:py-4 w-full">
        
        <!-- Card Central de Primeiro Acesso (ajustado para caber 100% na viewport sem necessidade de rolagem) -->
        <s-card class="w-full max-w-[440px] relative font-sans" [padding]="24" [elevation]="2" id="primeiro-acesso-card">
          
          <!-- Cabeçalho do Card -->
          <div class="text-center mb-2">
            <h1 class="text-lg sm:text-xl font-poppins font-bold text-siage-text-primary tracking-tight mb-0.5" id="primeiro-acesso-title">
              Primeiro acesso
            </h1>
            <p class="text-xs font-sans text-siage-text-secondary leading-snug">
              Para continuar, defina uma nova senha para o seu acesso ao SIAGE-RH.
            </p>
          </div>

          <!-- Bloco informativo institucional com ícone de segurança -->
          <div class="flex items-center gap-2 p-2 rounded-lg bg-siage-primary/10 border border-siage-primary/20 text-xs text-siage-text-secondary mb-2">
            <mat-icon class="text-siage-primary text-sm shrink-0" style="font-size: 16px; width: 16px; height: 16px;">security</mat-icon>
            <span class="leading-tight text-[11px] sm:text-xs">
              Por segurança, sua senha provisória deve ser alterada antes de acessar o sistema.
            </span>
          </div>

          <form [formGroup]="primeiroAcessoForm" (ngSubmit)="onSubmit($event)" class="flex flex-col gap-1.5">
            
            <!-- Campo 1: Senha atual -->
            <s-field label="Senha atual" required controlId="primeiro-acesso-senha-atual" [validationErrors]="{}"
              [error]="primeiroAcessoForm.controls.senhaAtual.hasError('senhaIncorreta') ? 'Senha atual incorreta. Verifique a informação e tente novamente.' : primeiroAcessoForm.controls.senhaAtual.touched && primeiroAcessoForm.controls.senhaAtual.hasError('required') ? 'Senha é obrigatória.' : ''">
              <s-input type="password" formControlName="senhaAtual" (input)="onSenhaAtualInput()"
                placeholder="Digite sua senha atual" maxlength="32" autocomplete="current-password" />
            </s-field>

            <!-- Campo 2: Crie uma nova senha -->
            <s-field label="Crie uma nova senha" required controlId="primeiro-acesso-nova-senha" [validationErrors]="{}"
              [error]="primeiroAcessoForm.controls.novaSenha.touched ? (primeiroAcessoForm.controls.novaSenha.hasError('required') ? 'Senha é obrigatória.' : primeiroAcessoForm.controls.novaSenha.hasError('criterios') ? 'A senha informada não atende aos critérios de segurança.' : '') : ''">
              <s-input type="password" formControlName="novaSenha" (input)="onNovaSenhaInput()"
                (keydown)="onPasswordKeyDown($event)" (focusout)="onNovaSenhaBlur()"
                placeholder="Digite a nova senha" maxlength="16" autocomplete="new-password" />
            </s-field>

            <!-- Campo 3: Confirme a nova senha -->
            <s-field label="Confirme a nova senha" required controlId="primeiro-acesso-confirma-senha" [validationErrors]="{}"
              [error]="primeiroAcessoForm.controls.confirmaSenha.touched ? (primeiroAcessoForm.controls.confirmaSenha.hasError('required') ? 'Confirmação de senha é obrigatória.' : primeiroAcessoForm.controls.confirmaSenha.hasError('mismatch') ? 'As senhas não coincidem.' : '') : ''">
              <s-input type="password" formControlName="confirmaSenha" (input)="onConfirmaSenhaInput()"
                (keydown)="onPasswordKeyDown($event)" (focusout)="onConfirmaSenhaBlur()"
                placeholder="Digite novamente a nova senha" maxlength="16" autocomplete="new-password" />
            </s-field>

            <!-- Checklist dos 6 Critérios Solicitados em 2 Colunas Compactas -->
            <div class="p-2 sm:p-2.5 bg-siage-border/15 border border-siage-border/70 rounded-lg text-xs my-0.5">
              <span class="block font-sans font-bold text-siage-text-secondary mb-1 text-xs">
                Critérios de segurança
              </span>
              <ul class="grid grid-cols-2 gap-x-2.5 gap-y-0.5 text-[11px] font-sans">
                
                <!-- Regra 1: Mínimo de 8 caracteres -->
                <li class="flex items-center gap-1 transition-colors" [class]="ruleMin8() ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-siage-text-secondary'">
                  <mat-icon class="text-xs shrink-0" style="font-size: 14px; width: 14px; height: 14px;">
                    {{ ruleMin8() ? 'check_circle' : 'radio_button_unchecked' }}
                  </mat-icon>
                  <span class="truncate">Mínimo de 8 caracteres</span>
                </li>

                <!-- Regra 2: Uma letra maiúscula -->
                <li class="flex items-center gap-1 transition-colors" [class]="ruleUppercase() ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-siage-text-secondary'">
                  <mat-icon class="text-xs shrink-0" style="font-size: 14px; width: 14px; height: 14px;">
                    {{ ruleUppercase() ? 'check_circle' : 'radio_button_unchecked' }}
                  </mat-icon>
                  <span class="truncate">Uma letra maiúscula</span>
                </li>

                <!-- Regra 3: Uma letra minúscula -->
                <li class="flex items-center gap-1 transition-colors" [class]="ruleLowercase() ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-siage-text-secondary'">
                  <mat-icon class="text-xs shrink-0" style="font-size: 14px; width: 14px; height: 14px;">
                    {{ ruleLowercase() ? 'check_circle' : 'radio_button_unchecked' }}
                  </mat-icon>
                  <span class="truncate">Uma letra minúscula</span>
                </li>

                <!-- Regra 4: Um número -->
                <li class="flex items-center gap-1 transition-colors" [class]="ruleNumber() ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-siage-text-secondary'">
                  <mat-icon class="text-xs shrink-0" style="font-size: 14px; width: 14px; height: 14px;">
                    {{ ruleNumber() ? 'check_circle' : 'radio_button_unchecked' }}
                  </mat-icon>
                  <span class="truncate">Um número</span>
                </li>

                <!-- Regra 5: Um caractere especial -->
                <li class="flex items-center gap-1 transition-colors" [class]="ruleSpecial() ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-siage-text-secondary'">
                  <mat-icon class="text-xs shrink-0" style="font-size: 14px; width: 14px; height: 14px;">
                    {{ ruleSpecial() ? 'check_circle' : 'radio_button_unchecked' }}
                  </mat-icon>
                  <span class="truncate">Um caractere especial</span>
                </li>

                <!-- Regra 6: As senhas devem ser iguais -->
                <li class="flex items-center gap-1 transition-colors" [class]="ruleMatch() ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-siage-text-secondary'">
                  <mat-icon class="text-xs shrink-0" style="font-size: 14px; width: 14px; height: 14px;">
                    {{ ruleMatch() ? 'check_circle' : 'radio_button_unchecked' }}
                  </mat-icon>
                  <span class="truncate">As senhas devem ser iguais</span>
                </li>

              </ul>
            </div>

            <!-- Botão de Ação -->
            <div class="pt-0.5">
              <s-button
                type="submit"
                [disabled]="isSubmitting()"
                [loading]="isSubmitting()"
                loadingText="Salvando..."
                fullWidth
                id="primeiro-acesso-submit-btn"
              >
                Definir nova senha
              </s-button>
            </div>

          </form>

        </s-card>

      </div>

      <!-- Rodapé Institucional Abaixo (exibido naturalmente ao rolar a página) -->
      <footer class="bg-white dark:bg-[#151D30] text-siage-text-primary border-t border-siage-border/40 px-4 sm:px-8 md:px-16 lg:px-24 py-3 sm:py-4 transition-colors duration-200" id="app-footer">
        <div class="max-w-7xl mx-auto">
          <div class="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
            <div class="flex items-center">
              <img 
                [src]="app.isDark() ? 'logo-see-dark.png' : 'logo-see-light.png'" 
                alt="Governo da Paraíba - Secretaria de Estado da Educação" 
                class="h-7 sm:h-8 w-auto object-contain" 
                referrerpolicy="no-referrer" 
              />
            </div>
            <nav class="flex flex-wrap items-center justify-center md:justify-end gap-3 sm:gap-6 text-xs sm:text-sm font-sans font-medium text-siage-text-secondary">
              <a 
                href="https://paraiba.pb.gov.br" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="hover:text-siage-primary transition-colors cursor-pointer"
              >
                Governo da Paraíba
              </a>
            </nav>
          </div>
          <hr class="my-3 sm:my-3.5 border-siage-border/40" />
          <div class="text-center text-[11px] sm:text-xs text-siage-text-secondary">
            <p>© 2026 SIAGE. Secretaria de Estado da Educação da Paraíba.</p>
          </div>
        </div>
      </footer>
    </main>

    <!-- ========================================== -->
    <!-- SIMULADOR DISCRETO DE DEMONSTRAÇÃO (CANTO INFERIOR) -->
    <!-- ========================================== -->
    <div class="fixed bottom-3 right-3 z-40 print:hidden font-sans">
      @if (!showSimulator()) {
        <button
          type="button"
          (click)="showSimulator.set(true)"
          title="Simulador de cenários do Primeiro Acesso"
          class="opacity-60 hover:opacity-100 transition-opacity duration-200 bg-siage-surface/90 hover:bg-siage-surface border border-siage-border text-siage-text-secondary hover:text-siage-text-primary px-2.5 py-1 rounded-full text-[11px] font-mono flex items-center gap-1.5 shadow-sm cursor-pointer backdrop-blur-xs select-none"
          id="primeiro-acesso-simulador-toggle"
        >
          <span class="material-icons text-xs" style="font-size: 13px; width: 13px; height: 13px;">science</span>
          <span class="hidden sm:inline">simulador</span>
        </button>
      } @else {
        <div class="bg-siage-surface/95 border border-siage-border rounded-xl shadow-xl p-3 text-xs w-72 sm:w-80 backdrop-blur-md animate-fadeIn transition-colors">
          <div class="flex items-center justify-between pb-2 border-b border-siage-border/60 mb-2.5">
            <div class="flex items-center gap-1.5 text-siage-text-primary text-[11px] font-semibold">
              <span class="material-icons text-sm text-siage-primary" style="font-size: 15px; width: 15px; height: 15px;">science</span>
              <span>Simulador — Primeiro Acesso</span>
            </div>
            <button 
              type="button" 
              (click)="showSimulator.set(false)" 
              class="text-siage-text-secondary hover:text-siage-primary p-0.5 rounded cursor-pointer"
              title="Fechar simulador"
            >
              <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
            </button>
          </div>

          <div class="space-y-2 text-siage-text-secondary">
            <span class="text-[10px] uppercase font-bold text-siage-text-secondary block tracking-wider">
              Cenários de simulação:
            </span>
            <div class="flex flex-col gap-1.5">
              <button 
                type="button" 
                (click)="simularSenhaAtualIncorreta()" 
                class="w-full text-left px-2.5 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 transition-colors cursor-pointer text-[11px] font-medium flex items-center justify-between"
                id="simulador-senha-atual-incorreta-btn"
                title="Simular senha atual incorreta com validação imediata"
              >
                <span>Senha atual incorreta</span>
                <mat-icon style="font-size: 14px; width: 14px; height: 14px;">arrow_forward</mat-icon>
              </button>

              <button 
                type="button" 
                (click)="simularFalhaServidor()" 
                class="w-full text-left px-2.5 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-colors cursor-pointer text-[11px] font-medium flex items-center justify-between"
                id="simulador-falha-servidor-btn"
                title="Simular falha de conexão com o servidor"
              >
                <span>Falha de servidor</span>
                <mat-icon style="font-size: 14px; width: 14px; height: 14px;">arrow_forward</mat-icon>
              </button>

              <button 
                type="button" 
                (click)="preencherValidos()" 
                class="w-full text-left px-2.5 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 transition-colors cursor-pointer text-[11px] font-medium flex items-center justify-between"
                id="simulador-preencher-validos-btn"
                title="Preencher senhas válidas que atendem a todos os critérios"
              >
                <span>Preencher senhas válidas</span>
                <mat-icon style="font-size: 14px; width: 14px; height: 14px;">check</mat-icon>
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class PrimeiroAcesso implements OnInit {
  readonly app = inject(App);
  readonly authService = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly errorMatcher = new ImmediateErrorMatcher();

  // Controle de visibilidade individual
  readonly hidePasswordCurrent = signal(true);
  readonly hidePassword1 = signal(true);
  readonly hidePassword2 = signal(true);

  // Estado de envio
  readonly isSubmitting = signal(false);

  // Simulador de protótipo
  readonly showSimulator = signal(false);

  readonly primeiroAcessoForm = new FormGroup({
    senhaAtual: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    novaSenha: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    confirmaSenha: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] })
  });

  private readonly formValues = toSignal(
    this.primeiroAcessoForm.valueChanges,
    { initialValue: this.primeiroAcessoForm.getRawValue() }
  );

  readonly senhaAtualValue = computed(() => this.formValues()?.senhaAtual ?? '');
  readonly novaSenhaValue = computed(() => this.formValues()?.novaSenha ?? '');
  readonly confirmaSenhaValue = computed(() => this.formValues()?.confirmaSenha ?? '');

  // Critérios de segurança (6 regras)
  readonly ruleMin8 = computed(() => this.novaSenhaValue().length >= 8);
  readonly ruleUppercase = computed(() => /[A-Z]/.test(this.novaSenhaValue()));
  readonly ruleLowercase = computed(() => /[a-z]/.test(this.novaSenhaValue()));
  readonly ruleNumber = computed(() => /[0-9]/.test(this.novaSenhaValue()));
  readonly ruleSpecial = computed(() => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(this.novaSenhaValue()));
  readonly ruleMatch = computed(() => {
    const s1 = this.novaSenhaValue();
    const s2 = this.confirmaSenhaValue();
    return s1.length > 0 && s2.length > 0 && s1 === s2;
  });

  readonly isAllRulesPassed = computed(() => {
    return (
      this.ruleMin8() &&
      this.ruleUppercase() &&
      this.ruleLowercase() &&
      this.ruleNumber() &&
      this.ruleSpecial() &&
      this.ruleMatch()
    );
  });

  readonly isFormValid = computed(() => {
    return this.senhaAtualValue().trim().length > 0 && this.isAllRulesPassed();
  });

  ngOnInit() {
    // Proteção de fluxo (Seção 10)
    if (!this.authService.loggedInUser()) {
      // Se acessado diretamente para teste ou após reload, inicializa com usuário de primeiro acesso
      const usuarioPrimeiroAcesso = USUARIOS_TESTE.find(u => u.cpf === '10000000108');
      if (usuarioPrimeiroAcesso) {
        this.authService.startFirstAccess(usuarioPrimeiroAcesso, 'Provisoria@123');
      } else {
        this.router.navigate(['/login']);
        return;
      }
    }

    if (!this.authService.firstAccessRequired()) {
      // Usuário autenticado, mas não está em Primeiro Acesso
      const user = this.authService.loggedInUser();
      if (user && user.matriculas.length > 1) {
        this.router.navigate(['/selecionar-matricula']);
      } else {
        this.router.navigate(['/inicio']);
      }
    }
  }

  onPasswordKeyDown(event: KeyboardEvent) {
    if (event.key === ' ' || event.code === 'Space') {
      event.preventDefault();
    }
  }

  onSenhaAtualInput() {
    if (this.primeiroAcessoForm.controls.senhaAtual.hasError('senhaIncorreta')) {
      const val = this.primeiroAcessoForm.controls.senhaAtual.value;
      this.primeiroAcessoForm.controls.senhaAtual.setErrors(val ? null : { required: true });
    }
  }

  onNovaSenhaInput() {
    const inputVal = this.primeiroAcessoForm.controls.novaSenha.value;
    const filtered = inputVal.replace(/\s+/g, '').slice(0, 16);
    if (inputVal !== filtered) {
      this.primeiroAcessoForm.controls.novaSenha.setValue(filtered, { emitEvent: true });
    }
    if (this.primeiroAcessoForm.controls.novaSenha.touched) {
      this.onNovaSenhaBlur();
    }
  }

  onNovaSenhaBlur() {
    this.primeiroAcessoForm.controls.novaSenha.markAsTouched();
    const val = this.novaSenhaValue();
    if (!val) {
      this.primeiroAcessoForm.controls.novaSenha.setErrors({ required: true });
    } else if (
      !this.ruleMin8() ||
      !this.ruleUppercase() ||
      !this.ruleLowercase() ||
      !this.ruleNumber() ||
      !this.ruleSpecial()
    ) {
      this.primeiroAcessoForm.controls.novaSenha.setErrors({ criterios: true });
    } else {
      this.primeiroAcessoForm.controls.novaSenha.setErrors(null);
    }
  }

  onConfirmaSenhaInput() {
    const inputVal = this.primeiroAcessoForm.controls.confirmaSenha.value;
    const filtered = inputVal.replace(/\s+/g, '').slice(0, 16);
    if (inputVal !== filtered) {
      this.primeiroAcessoForm.controls.confirmaSenha.setValue(filtered, { emitEvent: true });
    }
    if (this.primeiroAcessoForm.controls.confirmaSenha.touched) {
      this.onConfirmaSenhaBlur();
    }
  }

  onConfirmaSenhaBlur() {
    this.primeiroAcessoForm.controls.confirmaSenha.markAsTouched();
    const val = this.confirmaSenhaValue();
    if (!val) {
      this.primeiroAcessoForm.controls.confirmaSenha.setErrors({ required: true });
    } else if (val !== this.novaSenhaValue()) {
      this.primeiroAcessoForm.controls.confirmaSenha.setErrors({ mismatch: true });
    } else {
      this.primeiroAcessoForm.controls.confirmaSenha.setErrors(null);
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();

    this.onNovaSenhaBlur();
    this.onConfirmaSenhaBlur();

    const senhaAtualVal = this.primeiroAcessoForm.controls.senhaAtual.value.trim();
    if (!senhaAtualVal) {
      this.primeiroAcessoForm.controls.senhaAtual.setErrors({ required: true });
      this.primeiroAcessoForm.controls.senhaAtual.markAsTouched();
    }

    if (this.primeiroAcessoForm.invalid || !this.isFormValid() || this.isSubmitting()) {
      this.primeiroAcessoForm.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    setTimeout(() => {
      this.isSubmitting.set(false);

      const expectedPass = this.authService.simulatedTemporaryPassword();
      if (senhaAtualVal !== expectedPass && senhaAtualVal !== 'Provisoria@123') {
        this.primeiroAcessoForm.controls.senhaAtual.setErrors({ senhaIncorreta: true });
        this.primeiroAcessoForm.controls.senhaAtual.markAsTouched();
        this.primeiroAcessoForm.controls.senhaAtual.markAsDirty();
        this.cdr.markForCheck();

        if (typeof document !== 'undefined') {
          const el = document.getElementById('primeiro-acesso-senha-atual');
          if (el) el.focus();
        }
        return;
      }

      // Sucesso na alteração: encerra a sessão atual automaticamente e direciona imediatamente para /login
      const novaSenhaVal = this.primeiroAcessoForm.controls.novaSenha.value;
      const userCpf = this.authService.loggedInUser()?.cpf || '10000000108';
      this.authService.completeFirstAccess(novaSenhaVal, userCpf);
      this.router.navigate(['/login']);
    }, 600);
  }

  sair() {
    this.authService.logout();
    this.authService.firstAccessPasswordChanged.set(false);
    this.router.navigate(['/login']);
  }

  // Cenários do Simulador de Demonstração
  simularSenhaAtualIncorreta() {
    this.primeiroAcessoForm.controls.senhaAtual.setValue('SenhaErrada@999');
    this.primeiroAcessoForm.controls.novaSenha.setValue('NovaSenha@2026');
    this.primeiroAcessoForm.controls.confirmaSenha.setValue('NovaSenha@2026');

    // Marca imediatamente como inválido com o erro específico de senha incorreta
    this.primeiroAcessoForm.controls.senhaAtual.setErrors({ senhaIncorreta: true });
    this.primeiroAcessoForm.controls.senhaAtual.markAsTouched();
    this.primeiroAcessoForm.controls.senhaAtual.markAsDirty();

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    setTimeout(() => {
      this.isSubmitting.set(false);
      this.primeiroAcessoForm.controls.senhaAtual.setErrors({ senhaIncorreta: true });
      this.primeiroAcessoForm.controls.senhaAtual.markAsTouched();
      this.primeiroAcessoForm.controls.senhaAtual.markAsDirty();
      this.cdr.markForCheck();

      if (typeof document !== 'undefined') {
        const el = document.getElementById('primeiro-acesso-senha-atual');
        if (el) el.focus();
      }
    }, 300);
  }

  preencherSenhaAtualIncorreta() {
    this.simularSenhaAtualIncorreta();
  }

  simularFalhaServidor() {
    this.preencherValidos();
    this.isSubmitting.set(true);
    this.cdr.markForCheck();
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.toastService.showGenericError();
      this.cdr.markForCheck();
    }, 300);
  }

  preencherValidos() {
    const validTemp = this.authService.simulatedTemporaryPassword() || 'Provisoria@123';
    this.primeiroAcessoForm.controls.senhaAtual.setValue(validTemp);
    this.primeiroAcessoForm.controls.novaSenha.setValue('NovaSenha@2026');
    this.primeiroAcessoForm.controls.confirmaSenha.setValue('NovaSenha@2026');
    this.primeiroAcessoForm.controls.senhaAtual.setErrors(null);
    this.primeiroAcessoForm.controls.novaSenha.setErrors(null);
    this.primeiroAcessoForm.controls.confirmaSenha.setErrors(null);
    this.cdr.markForCheck();
  }
}

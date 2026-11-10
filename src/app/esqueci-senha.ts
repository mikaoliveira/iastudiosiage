import {
  Component,
  inject,
  signal,
  computed,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import {FormsModule, ReactiveFormsModule, FormControl, AbstractControl} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {SButtonComponent, SCardComponent, SFieldComponent, SInputComponent, SToastService} from '@siage/siage-ui';
import {ErrorStateMatcher} from '@angular/material/core';
import {CommonModule} from '@angular/common';
import {App} from './app';
import {isValidCPF} from './login';
import {AuthSessionService, USUARIOS_TESTE} from './auth-session';
import {ToastService} from './toast';

export class ImmediateErrorMatcher implements ErrorStateMatcher {
  constructor(private hasError: () => boolean) {}
  isErrorState(control: AbstractControl | null): boolean {
    if (control && control.invalid && (control.touched || control.dirty)) {
      return true;
    }
    return this.hasError();
  }
}

export interface ModalConfig {
  isOpen: boolean;
  type: 'warning' | 'error' | 'success' | 'info';
  title: string;
  message: string;
  buttonLabel: string;
  action?: () => void;
}

@Component({
  selector: 'app-esqueci-senha',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    SButtonComponent,
    SCardComponent,
    SFieldComponent,
    SInputComponent
  ],
  template: `
    <div class="w-full max-w-[440px] flex flex-col items-center">
      
      <!-- Card Principal 100% Coeso com a tela de Login -->
      <s-card class="w-full relative" [padding]="24" [elevation]="2">
        
        <!-- Stepper Visual com 3 Etapas -->
        <div class="mb-4 pb-3.5 border-b border-siage-border">
          <div class="flex items-center justify-between relative">
            
            <!-- Linhas conectoras entre os passos -->
            <div class="absolute left-6 right-6 top-3.5 -translate-y-1/2 h-[2px] bg-siage-border -z-0"></div>
            <div 
              class="absolute left-6 top-3.5 -translate-y-1/2 h-[2px] bg-siage-primary transition-all duration-500 -z-0"
              [style.width]="currentStep() === 1 ? '0%' : (currentStep() === 2 ? '50%' : '100%')"
            ></div>

            <!-- Etapa 1: Identificação -->
            <div class="flex flex-col items-center relative z-10 select-none">
              <div 
                class="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-poppins font-bold transition-all duration-300 shadow-xs"
                [ngClass]="{
                  'bg-siage-primary text-white ring-3 ring-siage-primary/20': currentStep() === 1,
                  'bg-emerald-500 text-white': currentStep() > 1,
                  'bg-siage-surface border border-siage-border text-siage-text-secondary': currentStep() < 1
                }"
              >
                @if (currentStep() > 1) {
                  <mat-icon class="text-sm">check</mat-icon>
                } @else {
                  1
                }
              </div>
              <span 
                class="text-[11px] font-sans mt-1 transition-colors"
                [ngClass]="currentStep() === 1 ? 'text-siage-primary font-bold' : (currentStep() > 1 ? 'text-siage-text-primary font-semibold' : 'text-siage-text-secondary')"
              >
                Identificação
              </span>
            </div>

            <!-- Etapa 2: Verificação -->
            <div class="flex flex-col items-center relative z-10 select-none">
              <div 
                class="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-poppins font-bold transition-all duration-300 shadow-xs"
                [ngClass]="{
                  'bg-siage-primary text-white ring-3 ring-siage-primary/20': currentStep() === 2,
                  'bg-emerald-500 text-white': currentStep() > 2,
                  'bg-siage-surface border border-siage-border text-siage-text-secondary': currentStep() < 2
                }"
              >
                @if (currentStep() > 2) {
                  <mat-icon class="text-sm">check</mat-icon>
                } @else {
                  2
                }
              </div>
              <span 
                class="text-[11px] font-sans mt-1 transition-colors"
                [ngClass]="currentStep() === 2 ? 'text-siage-primary font-bold' : (currentStep() > 2 ? 'text-siage-text-primary font-semibold' : 'text-siage-text-secondary')"
              >
                Verificação
              </span>
            </div>

            <!-- Etapa 3: Nova Senha -->
            <div class="flex flex-col items-center relative z-10 select-none">
              <div 
                class="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-poppins font-bold transition-all duration-300 shadow-xs"
                [ngClass]="{
                  'bg-siage-primary text-white ring-3 ring-siage-primary/20': currentStep() === 3,
                  'bg-emerald-500 text-white': passwordResetSuccess(),
                  'bg-siage-surface border border-siage-border text-siage-text-secondary': currentStep() < 3
                }"
              >
                @if (passwordResetSuccess()) {
                  <mat-icon class="text-sm">check</mat-icon>
                } @else {
                  3
                }
              </div>
              <span 
                class="text-[11px] font-sans mt-1 transition-colors"
                [ngClass]="currentStep() === 3 ? 'text-siage-primary font-bold' : (passwordResetSuccess() ? 'text-siage-text-primary font-semibold' : 'text-siage-text-secondary')"
              >
                Nova Senha
              </span>
            </div>

          </div>
        </div>

        <!-- ========================================== -->
        <!-- ETAPA 1: IDENTIFICAÇÃO -->
        <!-- ========================================== -->
        @if (currentStep() === 1) {
          <div class="flex flex-col gap-4 sm:gap-5 animate-fadeIn">
            
            <!-- Título e Subtítulo -->
            <div class="text-center mb-1">
              <h1 class="text-xl sm:text-2xl font-poppins font-bold tracking-tight text-siage-text-primary">
                Identificação
              </h1>
              <p class="text-xs sm:text-sm text-siage-text-secondary mt-1 leading-relaxed">
                Informe seu CPF para receber o código de segurança.
              </p>
            </div>

            <!-- Formulário com Material Form Field idêntico ao Login -->
            <form (submit)="onStep1Submit($event)" class="flex flex-col gap-4">
              
              <!-- Campo CPF com Label Fixa Acima -->
              <s-field label="CPF" required controlId="forgot-cpf-input" [validationErrors]="{}" [error]="identificacaoErro()">
                <s-input [ngModel]="identificacaoInput()" [ngModelOptions]="{standalone: true}"
                  (input)="onCpfInput($event)" (focusout)="onCpfBlur()"
                  placeholder="000.000.000-00" maxlength="14" autocomplete="on" />
              </s-field>

              <!-- Botão Continuar -->
              <div class="flex flex-col gap-3 pt-1">
                <s-button
                  type="submit"
                  [disabled]="!isIdentificacaoValida() || isLoadingAuth()"
                  [loading]="isLoadingAuth()"
                  loadingText="Verificando..."
                  fullWidth
                  id="step1-continue-button"
                >
                  Continuar
                </s-button>

                <!-- Voltar ao login -->
                <a 
                  routerLink="/login" 
                  class="text-center text-xs sm:text-sm font-sans font-semibold text-siage-text-secondary hover:text-siage-primary transition-colors py-1.5 flex items-center justify-center gap-1"
                  id="step1-back-to-login"
                >
                  <mat-icon class="text-base" style="font-size: 18px; width: 18px; height: 18px;">arrow_back</mat-icon>
                  <span>Voltar para o login</span>
                </a>
              </div>

            </form>
          </div>
        }

        <!-- ========================================== -->
        <!-- ETAPA 2: VERIFICAÇÃO -->
        <!-- ========================================== -->
        @if (currentStep() === 2) {
          <div class="flex flex-col gap-4 sm:gap-5 animate-fadeIn">
            
            <!-- Título e Subtítulo -->
            <div class="text-center mb-1">
              <h1 class="text-xl sm:text-2xl font-poppins font-bold tracking-tight text-siage-text-primary">
                Verificação
              </h1>
              <p class="text-xs sm:text-sm text-siage-text-secondary mt-1 leading-relaxed">
                Enviamos um código para o e-mail cadastrado <strong class="text-siage-text-primary font-semibold">{{ maskedEmail() }}</strong>.
              </p>
            </div>

            <!-- Formulário com Material Form Field -->
            <form (submit)="onStep2Submit($event)" class="flex flex-col gap-4">
              
              <!-- Campo Código de Segurança com Label Fixa Acima -->
              <div class="form-field-group">
                <label class="form-label text-center justify-center" for="forgot-code-input">
                  Código de segurança <span class="required-marker">*</span>
                </label>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                  <input 
                    matInput 
                    [formControl]="codigoControl"
                    [errorStateMatcher]="codigoMatcher"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    maxlength="6"
                    placeholder="000000"
                    (input)="onCodigoChange($event)"
                    autocomplete="one-time-code"
                    id="forgot-code-input"
                    class="font-mono text-center tracking-[0.25em] text-base font-bold"
                  />
                  <span matSuffix class="material-icons text-siage-text-secondary text-lg pr-1">pin</span>
                  @if (codigoErro()) {
                    <mat-error id="forgot-code-error">{{ codigoErro() }}</mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Controle de Reenvio do Código -->
              <div class="text-center py-0.5">
                @if (countdownTimer() > 0) {
                  <p class="text-xs text-siage-text-secondary font-sans">
                    Não recebeu o código? Reenviar em 
                    <span class="font-mono font-bold text-siage-text-primary ml-1">00:{{ formatSeconds(countdownTimer()) }}</span>
                  </p>
                } @else {
                  <button
                    type="button"
                    (click)="reenviarCodigo()"
                    class="text-xs font-sans font-semibold text-siage-primary hover:underline cursor-pointer inline-flex items-center gap-1"
                    id="resend-code-btn"
                  >
                    <mat-icon class="text-base" style="font-size: 16px; width: 16px; height: 16px;">refresh</mat-icon>
                    <span>Reenviar código</span>
                  </button>
                }
              </div>

              <!-- Link: Não tenho acesso a esse e-mail -->
              <div class="text-center">
                <button
                  type="button"
                  (click)="abrirModalSemAcessoEmail()"
                  class="text-xs font-sans font-medium text-siage-text-secondary hover:text-siage-primary underline transition-colors cursor-pointer"
                  id="no-email-access-link"
                >
                  Não tenho acesso a esse e-mail
                </button>
              </div>

              <!-- Botão Validar código -->
              <div class="flex flex-col gap-3 pt-1">
                <s-button
                  type="submit"
                  [disabled]="(codigoControl.value || codigoInput()).length !== 6 || isValidatingCode() || tentativasRestantes() <= 0"
                  [loading]="isValidatingCode()"
                  loadingText="Validando..."
                  fullWidth
                  id="step2-validate-button"
                >
                  Validar código
                </s-button>

                <!-- Ações Secundárias -->
                <div class="flex items-center justify-between pt-1 text-xs font-sans">
                  <button
                    type="button"
                    (click)="corrigirIdentificacao()"
                    class="font-medium text-siage-text-secondary hover:text-siage-primary transition-colors cursor-pointer flex items-center gap-1"
                    id="step2-correct-ident"
                  >
                    <mat-icon class="text-sm" style="font-size: 16px; width: 16px; height: 16px;">edit</mat-icon>
                    <span>Corrigir identificação</span>
                  </button>

                  <a 
                    routerLink="/login" 
                    class="font-medium text-siage-text-secondary hover:text-siage-primary transition-colors"
                    id="step2-back-to-login"
                  >
                    Voltar para o login
                  </a>
                </div>
              </div>

            </form>
          </div>
        }

        <!-- ========================================== -->
        <!-- ETAPA 3: NOVA SENHA -->
        <!-- ========================================== -->
        @if (currentStep() === 3) {
          <div class="flex flex-col gap-4 sm:gap-5 animate-fadeIn">
            
            <!-- Título e Subtítulo -->
            <div class="text-center mb-1">
              <h1 class="text-xl sm:text-2xl font-poppins font-bold tracking-tight text-siage-text-primary">
                Nova Senha
              </h1>
              <p class="text-xs sm:text-sm text-siage-text-secondary mt-1 leading-relaxed">
                Crie uma senha que atenda a todos os critérios de segurança abaixo.
              </p>
            </div>

            <!-- Formulário com Material Form Field -->
            <form (submit)="onStep3Submit($event)" class="flex flex-col gap-3">
              
              <!-- Campo 1: Crie uma nova senha -->
              <s-field label="Crie uma nova senha" required controlId="step3-new-password" [validationErrors]="{}" [error]="senhaBlurError()">
                <s-input type="password" [ngModel]="novaSenha()" [ngModelOptions]="{standalone: true}"
                  (input)="onNovaSenhaChange($event)" (keydown)="onPasswordKeyDown($event)" (focusout)="onNovaSenhaBlur()"
                  placeholder="Digite a nova senha" maxlength="16" autocomplete="new-password" />
              </s-field>

              <!-- Campo 2: Confirme a nova senha -->
              <s-field label="Confirme a nova senha" required controlId="step3-confirm-password" [validationErrors]="{}" [error]="confirmaBlurError()">
                <s-input type="password" [ngModel]="confirmaSenha()" [ngModelOptions]="{standalone: true}"
                  (input)="onConfirmaSenhaChange($event)" (keydown)="onPasswordKeyDown($event)" (focusout)="onConfirmaSenhaBlur()"
                  placeholder="Digite novamente a nova senha" maxlength="16" autocomplete="new-password" />
              </s-field>

              <!-- Checklist dos 6 Critérios Solicitados -->
              <div class="p-3 sm:p-3.5 bg-siage-border/15 border border-siage-border/70 rounded-xl text-xs">
                <span class="block font-sans font-bold text-siage-text-secondary mb-2 text-xs">
                  Critérios de segurança
                </span>
                <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
                  
                  <!-- Regra 1: Mínimo de 8 caracteres -->
                  <li class="flex items-center gap-1.5 transition-colors" [ngClass]="ruleMin8() ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-siage-text-secondary'">
                    <mat-icon class="text-sm shrink-0" style="font-size: 16px; width: 16px; height: 16px;">
                      {{ ruleMin8() ? 'check_circle' : 'radio_button_unchecked' }}
                    </mat-icon>
                    <span>Mínimo de 8 caracteres</span>
                  </li>

                  <!-- Regra 2: Uma letra maiúscula -->
                  <li class="flex items-center gap-1.5 transition-colors" [ngClass]="ruleUppercase() ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-siage-text-secondary'">
                    <mat-icon class="text-sm shrink-0" style="font-size: 16px; width: 16px; height: 16px;">
                      {{ ruleUppercase() ? 'check_circle' : 'radio_button_unchecked' }}
                    </mat-icon>
                    <span>Uma letra maiúscula</span>
                  </li>

                  <!-- Regra 3: Uma letra minúscula -->
                  <li class="flex items-center gap-1.5 transition-colors" [ngClass]="ruleLowercase() ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-siage-text-secondary'">
                    <mat-icon class="text-sm shrink-0" style="font-size: 16px; width: 16px; height: 16px;">
                      {{ ruleLowercase() ? 'check_circle' : 'radio_button_unchecked' }}
                    </mat-icon>
                    <span>Uma letra minúscula</span>
                  </li>

                  <!-- Regra 4: Um número -->
                  <li class="flex items-center gap-1.5 transition-colors" [ngClass]="ruleNumber() ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-siage-text-secondary'">
                    <mat-icon class="text-sm shrink-0" style="font-size: 16px; width: 16px; height: 16px;">
                      {{ ruleNumber() ? 'check_circle' : 'radio_button_unchecked' }}
                    </mat-icon>
                    <span>Um número</span>
                  </li>

                  <!-- Regra 5: Um caractere especial -->
                  <li class="flex items-center gap-1.5 transition-colors" [ngClass]="ruleSpecial() ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-siage-text-secondary'">
                    <mat-icon class="text-sm shrink-0" style="font-size: 16px; width: 16px; height: 16px;">
                      {{ ruleSpecial() ? 'check_circle' : 'radio_button_unchecked' }}
                    </mat-icon>
                    <span>Um caractere especial</span>
                  </li>

                  <!-- Regra 6: As senhas devem ser iguais -->
                  <li class="flex items-center gap-1.5 transition-colors" [ngClass]="ruleMatch() ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-siage-text-secondary'">
                    <mat-icon class="text-sm shrink-0" style="font-size: 16px; width: 16px; height: 16px;">
                      {{ ruleMatch() ? 'check_circle' : 'radio_button_unchecked' }}
                    </mat-icon>
                    <span>As senhas devem ser iguais</span>
                  </li>

                </ul>
              </div>

              <!-- Botão Redefinir Senha -->
              <div class="flex flex-col gap-3 pt-2">
                <s-button
                  type="submit"
                  [disabled]="!isAllRulesPassed() || isSubmittingNewPassword()"
                  [loading]="isSubmittingNewPassword()"
                  loadingText="Redefinindo senha..."
                  fullWidth
                  id="step3-reset-button"
                >
                  Redefinir senha
                </s-button>

                <!-- Voltar para identificação -->
                <button
                  type="button"
                  (click)="voltarParaIdentificacao()"
                  class="text-center text-xs sm:text-sm font-sans font-semibold text-siage-text-secondary hover:text-siage-primary transition-colors py-1.5 flex items-center justify-center gap-1 cursor-pointer"
                  id="step3-back-to-ident"
                >
                  <mat-icon class="text-base" style="font-size: 18px; width: 18px; height: 18px;">arrow_back</mat-icon>
                  <span>Voltar para identificação</span>
                </button>
              </div>

            </form>
          </div>
        }

      </s-card>

      <!-- ========================================== -->
      <!-- SIMULADOR DE CENÁRIOS ULTRA-DISCRETO (FIXO NO CANTO INFERIOR) -->
      <!-- ========================================== -->
      <div class="fixed bottom-3 right-3 z-40 print:hidden font-sans">
        @if (!showPrototypeGuide()) {
          <!-- Botão flutuante minimalista translúcido no canto -->
          <button
            type="button"
            (click)="showPrototypeGuide.set(true)"
            title="Simulador de cenários do protótipo"
            class="opacity-20 hover:opacity-90 transition-opacity duration-200 bg-siage-surface/80 hover:bg-siage-surface border border-siage-border/50 text-siage-text-secondary hover:text-siage-text-primary px-2 py-1 rounded-full text-[10px] font-mono flex items-center gap-1 shadow-xs cursor-pointer backdrop-blur-xs select-none"
            id="prototype-toggle-btn"
          >
            <span class="material-icons text-xs" style="font-size: 13px; width: 13px; height: 13px;">science</span>
            <span class="hidden sm:inline">simulador</span>
          </button>
        } @else {
          <!-- Painel flutuante compacto que não interfere no formulário nem no card -->
          <div class="bg-siage-surface/95 border border-siage-border rounded-xl shadow-xl p-3 text-xs w-72 sm:w-80 backdrop-blur-md animate-fadeIn transition-colors">
            <div class="flex items-center justify-between pb-2 border-b border-siage-border/60 mb-2.5">
              <div class="flex items-center gap-1.5 text-siage-text-primary text-[11px] font-semibold">
                <span class="material-icons text-sm text-siage-primary" style="font-size: 15px; width: 15px; height: 15px;">science</span>
                <span>Simulador de Cenários</span>
              </div>
              <button 
                type="button" 
                (click)="showPrototypeGuide.set(false)" 
                class="text-siage-text-secondary hover:text-siage-text-primary p-0.5 rounded cursor-pointer"
                title="Fechar simulador"
              >
                <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
              </button>
            </div>

            <!-- Conteúdo dos atalhos por etapa -->
            <div class="space-y-2 text-siage-text-secondary">
              @if (currentStep() === 1) {
                <div class="space-y-1.5">
                  <span class="text-[10px] uppercase font-bold text-siage-text-secondary block">Preenchimento rápido:</span>
                  <div class="flex flex-wrap gap-1.5">
                    <button 
                      type="button" 
                      (click)="preencherCaso('valido-carlos')" 
                      class="px-2 py-1 rounded bg-siage-border/40 hover:bg-siage-primary hover:text-white transition-colors cursor-pointer text-[10px] font-medium"
                      title="Carlos: carlos.silva@gmail.com -> car***@gmail.com"
                    >
                      Carlos (Gmail)
                    </button>
                    <button 
                      type="button" 
                      (click)="preencherCaso('valido-joao')" 
                      class="px-2 py-1 rounded bg-siage-border/40 hover:bg-siage-primary hover:text-white transition-colors cursor-pointer text-[10px] font-medium"
                      title="João: joao@see.pb.gov.br -> joa***@see.pb.gov.br"
                    >
                      João (SEE-PB)
                    </button>
                    <button 
                      type="button" 
                      (click)="preencherCaso('inexistente')" 
                      class="px-2 py-1 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-colors cursor-pointer text-[10px] font-medium"
                    >
                      Inexistente
                    </button>
                    <button 
                      type="button" 
                      (click)="preencherCaso('sem-acesso')" 
                      class="px-2 py-1 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-colors cursor-pointer text-[10px] font-medium"
                    >
                      Sem Acesso
                    </button>
                  </div>
                </div>
              }

              @if (currentStep() === 2) {
                <div class="space-y-2">
                  <div class="flex items-center justify-between p-1.5 rounded bg-siage-primary/10 text-siage-primary font-mono text-[11px]">
                    <span>Código de teste:</span>
                    <strong class="font-bold tracking-widest">{{ activeSecurityCode() }}</strong>
                  </div>
                  <div class="flex flex-wrap gap-1.5">
                    <button 
                      type="button" 
                      (click)="preencherCodigoCorreto()" 
                      class="px-2 py-1 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer text-[10px] font-medium"
                    >
                      Código Correto
                    </button>
                    <button 
                      type="button" 
                      (click)="preencherCodigoIncorreto()" 
                      class="px-2 py-1 rounded bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer text-[10px] font-medium"
                    >
                      Código Incorreto
                    </button>
                    <button 
                      type="button" 
                      (click)="simularCodigoExpirado()" 
                      class="px-2 py-1 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-colors cursor-pointer text-[10px] font-medium"
                    >
                      Expirado
                    </button>
                    <button 
                      type="button" 
                      (click)="zerarTempoReenvio()" 
                      class="px-2 py-1 rounded bg-siage-border/40 hover:bg-siage-primary hover:text-white transition-colors cursor-pointer text-[10px] font-medium"
                    >
                      Zerar 00:00
                    </button>
                  </div>
                </div>
              }

              @if (currentStep() === 3) {
                <div class="space-y-2">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <button 
                      type="button" 
                      (click)="preencherSenhaValida()" 
                      class="px-2 py-1 rounded bg-siage-border/40 hover:bg-siage-primary hover:text-white transition-colors cursor-pointer text-[10px] font-medium"
                    >
                      Preencher Senha Válida
                    </button>
                    <button 
                      type="button" 
                      (click)="toggleSimularFalhaAuth()" 
                      class="px-2 py-1 rounded border transition-colors cursor-pointer text-[10px] font-medium"
                      [ngClass]="simularFalhaAuth() ? 'bg-red-500/15 text-red-500 border-red-500/30' : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'"
                    >
                      {{ simularFalhaAuth() ? 'Simulando: Erro' : 'Simulando: Sucesso' }}
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>

    </div>

    <!-- ========================================== -->
    <!-- MODAIS ESTRITAMENTE NECESSÁRIOS -->
    <!-- ========================================== -->
    @if (modal().isOpen) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
        <div class="bg-siage-surface border border-siage-border rounded-2xl shadow-2xl w-[calc(100vw-2rem)] max-w-[420px] p-5 sm:p-6 relative font-sans transition-colors duration-200 flex flex-col items-center box-border">
          
          <div class="mb-3.5 mt-0.5 flex items-center justify-center">
            @if (modal().type === 'success') {
              <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                <mat-icon style="font-size: 24px; width: 24px; height: 24px;">check_circle</mat-icon>
              </div>
            } @else if (modal().type === 'warning') {
              <div class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                <mat-icon style="font-size: 24px; width: 24px; height: 24px;">warning_amber</mat-icon>
              </div>
            } @else if (modal().type === 'error') {
              <div class="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shadow-xs">
                <mat-icon style="font-size: 24px; width: 24px; height: 24px;">error_outline</mat-icon>
              </div>
            } @else {
              <div class="w-12 h-12 rounded-xl bg-siage-primary/10 border border-siage-primary/20 text-siage-primary flex items-center justify-center shadow-xs">
                <mat-icon style="font-size: 24px; width: 24px; height: 24px;">info</mat-icon>
              </div>
            }
          </div>

          <h2 class="text-base sm:text-lg font-poppins font-semibold text-center text-siage-text-primary mb-1.5 tracking-tight px-4">
            {{ modal().title }}
          </h2>

          <div class="text-xs sm:text-sm text-center text-siage-text-secondary mb-5 sm:mb-6 leading-relaxed px-1">
            <p>{{ modal().message }}</p>
          </div>

          <div class="flex justify-center w-full">
            <button 
              type="button"
              (click)="fecharModal()"
              class="w-full sm:w-auto min-w-[130px] px-6 py-2.5 rounded-xl bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-bold text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
              id="modal-confirm-btn"
            >
              {{ modal().buttonLabel }}
            </button>
          </div>

        </div>
      </div>
    }
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
export class EsqueciSenha implements OnDestroy {
  readonly app = inject(App);
  private readonly router = inject(Router);
  private readonly toastService = inject(SToastService);
  private readonly simulatorToastService = inject(ToastService);
  private readonly authService = inject(AuthSessionService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Controle de Etapa (1, 2 ou 3)
  readonly currentStep = signal<1 | 2 | 3>(1);

  // Alertas em linha coesos com a tela de login
  readonly step1Alert = signal<string | null>(null);
  readonly step2Alert = signal<string | null>(null);

  // Modais de uso estrito (Bloqueio por segurança, Atualização cadastral institucional e Sucesso final)
  readonly modal = signal<ModalConfig>({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    buttonLabel: 'Ok'
  });

  // Guia de teste do protótipo
  readonly showPrototypeGuide = signal(false);

  // ==========================================
  // ETAPA 1 STATE
  // ==========================================
  readonly identificacaoInput = signal('');
  readonly identificacaoErro = signal<string | null>(null);
  readonly isIdentificacaoValida = signal(false);
  readonly isLoadingAuth = signal(false);

  // Email resolvido da conta
  readonly userAccountEmail = signal('maria.silva@see.pb.gov.br');

  // ==========================================
  // ETAPA 2 STATE
  // ==========================================
  readonly codigoInput = signal('');
  readonly codigoControl = new FormControl<string>('', {
    nonNullable: true
  });
  readonly codigoErro = signal<string | null>(null);
  readonly activeSecurityCode = signal('123456');
  readonly tentativasRestantes = signal(3);
  readonly reenviosRealizados = signal(0);
  readonly countdownTimer = signal(60); // 60 segundos
  readonly codeExpirationTimer = signal(600); // 10 minutos = 600s
  readonly isValidatingCode = signal(false);
  private intervalTimerId: ReturnType<typeof setInterval> | null = null;
  private expirationIntervalId: ReturnType<typeof setInterval> | null = null;

  // E-mail mascarado: padrão car***@dominio.com (3 primeiros caracteres antes do @, resto ***, domínio visível)
  readonly maskedEmail = computed(() => {
    const email = this.userAccountEmail();
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const [local, domain] = parts;
    const visible = local.slice(0, 3);
    return `${visible}***@${domain}`;
  });

  // ==========================================
  // ETAPA 3 STATE
  // ==========================================
  readonly novaSenha = signal('');
  readonly confirmaSenha = signal('');
  readonly hidePassword1 = signal(true);
  readonly hidePassword2 = signal(true);
  readonly senhaBlurError = signal<string | null>(null);
  readonly confirmaBlurError = signal<string | null>(null);
  readonly isSubmittingNewPassword = signal(false);
  readonly passwordResetSuccess = signal(false);
  readonly simularFalhaAuth = signal(false);

  // Regras de validação em tempo real da senha (6 critérios)
  readonly ruleMin8 = computed(() => this.novaSenha().length >= 8);
  readonly ruleUppercase = computed(() => /[A-Z]/.test(this.novaSenha()));
  readonly ruleLowercase = computed(() => /[a-z]/.test(this.novaSenha()));
  readonly ruleNumber = computed(() => /[0-9]/.test(this.novaSenha()));
  readonly ruleSpecial = computed(() => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(this.novaSenha()));
  readonly ruleMatch = computed(() => {
    const s1 = this.novaSenha();
    const s2 = this.confirmaSenha();
    return s1.length > 0 && s2.length > 0 && s1 === s2;
  });

  // Todas as 6 regras atendidas
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

  readonly identificacaoMatcher = new ImmediateErrorMatcher(() => !!this.identificacaoErro());
  readonly codigoMatcher = new ImmediateErrorMatcher(() => !!this.codigoErro());
  readonly novaSenhaMatcher = new ImmediateErrorMatcher(() => !!this.senhaBlurError());
  readonly confirmaSenhaMatcher = new ImmediateErrorMatcher(() => !!this.confirmaBlurError());

  ngOnDestroy() {
    this.limparTimers();
  }

  // ==========================================
  // MÉTODOS DA ETAPA 1
  // ==========================================
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
    this.identificacaoInput.set(formatted);
    input.value = formatted;

    if (raw.length === 11 && isValidCPF(raw)) {
      this.identificacaoErro.set(null);
      this.isIdentificacaoValida.set(true);
    } else {
      this.isIdentificacaoValida.set(false);
      if (this.identificacaoErro() && raw.length === 11 && !isValidCPF(raw)) {
        this.identificacaoErro.set('CPF é inválido.');
      }
    }
  }

  onCpfBlur() {
    const val = this.identificacaoInput().trim();
    const raw = val.replace(/\D/g, '');
    if (!raw) {
      this.identificacaoErro.set('CPF é obrigatório.');
      this.isIdentificacaoValida.set(false);
      return;
    }
    if (!isValidCPF(raw)) {
      this.identificacaoErro.set('CPF é inválido.');
      this.isIdentificacaoValida.set(false);
    } else {
      this.identificacaoErro.set(null);
      this.isIdentificacaoValida.set(true);
    }
  }

  onStep1Submit(event: Event) {
    event.preventDefault();
    this.onCpfBlur();

    if (!this.isIdentificacaoValida()) return;

    this.isLoadingAuth.set(true);

    const raw = this.identificacaoInput().replace(/\D/g, '');

    // Simula consulta ao AUTH (representação do processamento de 750ms)
    setTimeout(() => {
      this.isLoadingAuth.set(false);

      // CASO: Usuário existente no AUTH, mas sem permissão no SIAGE-RH (Toast de erro)
      if (raw === '10000000280') {
        this.toastService.error('Seu usuário não possui permissão para acessar o SIAGE-RH.');
        this.identificacaoErro.set(null);
        return;
      }

      // CASO: Cadastro não encontrado (Toast de erro)
      if (raw === '00000000000' || raw === '11144477735') {
        this.toastService.error('Cadastro não encontrado. Verifique os dados informados.');
        this.identificacaoErro.set(null);
        return;
      }

      // CASO: Usuário válido no AUTH com acesso ao SIAGE-RH
      const foundUser = USUARIOS_TESTE.find(u => u.cpf === raw);
      if (foundUser?.email) {
        this.userAccountEmail.set(foundUser.email);
      } else {
        // Fallback dinâmico para outros CPFs matematicamente válidos
        this.userAccountEmail.set(`servidor.${raw.substring(0, 3)}@see.pb.gov.br`);
      }

      // Gerar código de 6 dígitos e avançar para Etapa 2
      this.gerarNovoCodigoSeguranca();
      this.tentativasRestantes.set(3);
      this.reenviosRealizados.set(0);
      this.codigoInput.set('');
      this.codigoErro.set(null);
      this.iniciarContadorReenvio();
      this.iniciarExpiracaoCodigo();

      this.currentStep.set(2);
    }, 750);
  }

  // ==========================================
  // MÉTODOS DA ETAPA 2
  // ==========================================
  onCodigoChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '').slice(0, 6);
    this.codigoInput.set(raw);
    this.codigoControl.setValue(raw, { emitEvent: false });
    input.value = raw;
    if (this.codigoErro()) {
      this.codigoErro.set(null);
      this.codigoControl.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  onStep2Submit(event: Event) {
    event.preventDefault();
    const code = (this.codigoControl.value || this.codigoInput()).trim();
    if (code.length !== 6 || this.tentativasRestantes() <= 0) return;

    this.isValidatingCode.set(true);
    this.codigoErro.set(null);
    this.codigoControl.setErrors(null);
    this.cdr.markForCheck();

    setTimeout(() => {
      this.isValidatingCode.set(false);

      // Verifica se o código expirou (Toast de erro conforme Design System)
      if (this.codeExpirationTimer() <= 0) {
        this.toastService.error('Código expirado. Solicite o reenvio e tente novamente.');
        this.cdr.markForCheck();
        return;
      }

      // Código Correto
      if (code === this.activeSecurityCode()) {
        this.limparTimers();
        this.currentStep.set(3);
        this.cdr.markForCheck();
        return;
      }

      // Código Incorreto
      const restantes = this.tentativasRestantes() - 1;
      this.tentativasRestantes.set(restantes);

      if (restantes > 0) {
        this.codigoErro.set(`Código inválido. Tentativas restantes: ${restantes}.`);
        this.codigoControl.setErrors({ codigoInvalido: true });
        this.codigoControl.markAsTouched();
        this.codigoControl.markAsDirty();
        if (typeof document !== 'undefined') {
          const el = document.getElementById('forgot-code-input');
          if (el) el.focus();
        }
      } else {
        // Terceira tentativa atingida: Bloqueio de segurança (Modal justificado)
        this.codigoErro.set(`Número máximo de tentativas atingido.`);
        this.codigoControl.setErrors({ codigoInvalido: true });
        this.codigoControl.markAsTouched();
        this.abrirModal({
          type: 'warning',
          title: 'Atenção!',
          message: 'Número máximo de tentativas atingido. Você errou o código 3 vezes. Por segurança, a verificação foi temporariamente bloqueada. Tente novamente após uma hora.',
          buttonLabel: 'Fechar'
        });
      }
      this.cdr.markForCheck();
    }, 650);
  }

  reenviarCodigo() {
    // Limite de 3 reenvios: Bloqueio de segurança (Modal justificado)
    if (this.reenviosRealizados() >= 3) {
      this.abrirModal({
        type: 'warning',
        title: 'Atenção!',
        message: 'Limite de solicitações de código excedido. Por segurança, aguarde uma hora antes de solicitar um novo código.',
        buttonLabel: 'Fechar'
      });
      return;
    }

    // Gera novo código, invalida anterior, reseta tentativas e contador
    this.gerarNovoCodigoSeguranca();
    this.reenviosRealizados.update(count => count + 1);
    this.tentativasRestantes.set(3);
    this.codigoInput.set('');
    this.codigoErro.set(null);
    this.step2Alert.set(null);
    this.iniciarContadorReenvio();
    this.iniciarExpiracaoCodigo();
  }

  abrirModalSemAcessoEmail() {
    // Modal informativo institucional sobre Gestão de Acesso
    this.abrirModal({
      type: 'info',
      title: 'Atualização de Dados',
      message: 'Caso você não reconheça ou não tenha mais acesso ao e-mail cadastrado, procure o responsável pela Gestão de Acesso da sua unidade para atualizar seus dados de acesso ao SIAGE-RH.',
      buttonLabel: 'Ok'
    });
  }

  corrigirIdentificacao() {
    this.limparTimers();
    this.codigoInput.set('');
    this.codigoErro.set(null);
    this.step2Alert.set(null);
    this.currentStep.set(1);
  }

  // ==========================================
  // MÉTODOS DA ETAPA 3
  // ==========================================
  onPasswordKeyDown(event: KeyboardEvent) {
    if (event.key === ' ' || event.code === 'Space') {
      event.preventDefault();
    }
  }

  onNovaSenhaChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const filtered = input.value.replace(/\s+/g, '').slice(0, 16);
    if (input.value !== filtered) {
      input.value = filtered;
    }
    this.novaSenha.set(filtered);
    if (this.senhaBlurError()) {
      this.senhaBlurError.set(null);
    }
  }

  onNovaSenhaBlur() {
    const val = this.novaSenha();
    if (!val) {
      this.senhaBlurError.set('Senha é obrigatória.');
    } else if (
      !this.ruleMin8() ||
      !this.ruleUppercase() ||
      !this.ruleLowercase() ||
      !this.ruleNumber() ||
      !this.ruleSpecial()
    ) {
      this.senhaBlurError.set('A senha informada não atende aos critérios de segurança.');
    } else {
      this.senhaBlurError.set(null);
    }
  }

  onConfirmaSenhaChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const filtered = input.value.replace(/\s+/g, '').slice(0, 16);
    if (input.value !== filtered) {
      input.value = filtered;
    }
    this.confirmaSenha.set(filtered);
    if (this.confirmaBlurError()) {
      this.confirmaBlurError.set(null);
    }
  }

  onConfirmaSenhaBlur() {
    const val = this.confirmaSenha();
    if (!val) {
      this.confirmaBlurError.set('Confirme a nova senha é obrigatório.');
    } else if (val !== this.novaSenha()) {
      this.confirmaBlurError.set('As senhas não coincidem.');
    } else {
      this.confirmaBlurError.set(null);
    }
  }

  onStep3Submit(event: Event) {
    event.preventDefault();
    this.onNovaSenhaBlur();
    this.onConfirmaSenhaBlur();

    if (!this.isAllRulesPassed() || this.isSubmittingNewPassword()) return;

    this.isSubmittingNewPassword.set(true);

    // Simula envio para o AUTH (750ms)
    setTimeout(() => {
      this.isSubmittingNewPassword.set(false);

      if (this.simularFalhaAuth()) {
        this.toastService.error('Não foi possível alterar sua senha. Tente novamente.');
      } else {
        // Redefinição concluída com sucesso: redirecionamento automático direto para o Login
        this.passwordResetSuccess.set(true);
        this.authService.firstAccessPasswordChanged.set(true);
        this.router.navigate(['/login']).then(() => {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        });
      }
    }, 750);
  }

  voltarParaIdentificacao() {
    this.currentStep.set(1);
    this.novaSenha.set('');
    this.confirmaSenha.set('');
    this.senhaBlurError.set(null);
    this.confirmaBlurError.set(null);
    this.passwordResetSuccess.set(false);
  }

  // ==========================================
  // HELPERS & ATALHOS DE TESTE
  // ==========================================
  preencherCaso(caso: 'valido-carlos' | 'valido-joao' | 'inexistente' | 'sem-acesso') {
    if (caso === 'valido-carlos') {
      this.identificacaoInput.set('529.982.247-25');
      this.identificacaoErro.set(null);
      this.isIdentificacaoValida.set(true);
    } else if (caso === 'valido-joao') {
      this.identificacaoInput.set('200.000.000-20');
      this.identificacaoErro.set(null);
      this.isIdentificacaoValida.set(true);
    } else if (caso === 'inexistente') {
      this.identificacaoInput.set('111.444.777-35');
      this.identificacaoErro.set(null);
      this.isIdentificacaoValida.set(true);
    } else if (caso === 'sem-acesso') {
      this.identificacaoInput.set('100.000.002-80');
      this.identificacaoErro.set(null);
      this.isIdentificacaoValida.set(true);
    }
  }

  preencherCodigoCorreto() {
    const code = this.activeSecurityCode();
    this.codigoInput.set(code);
    this.codigoControl.setValue(code);
    this.codigoErro.set(null);
    this.codigoControl.setErrors(null);
    this.cdr.markForCheck();
  }

  preencherCodigoIncorreto() {
    this.codigoInput.set('000000');
    this.codigoControl.setValue('000000');
    this.codigoErro.set(null);
    this.codigoControl.setErrors(null);
    this.isValidatingCode.set(true);
    this.cdr.markForCheck();

    setTimeout(() => {
      this.isValidatingCode.set(false);
      const restantes = Math.max(1, this.tentativasRestantes() - 1);
      this.tentativasRestantes.set(restantes);
      this.codigoErro.set(`Código inválido. Tentativas restantes: ${restantes}.`);
      this.codigoControl.setErrors({ codigoInvalido: true });
      this.codigoControl.markAsTouched();
      this.codigoControl.markAsDirty();
      this.cdr.markForCheck();

      if (typeof document !== 'undefined') {
        const el = document.getElementById('forgot-code-input');
        if (el) el.focus();
      }
    }, 350);
  }

  simularCodigoExpirado() {
    this.codeExpirationTimer.set(0);
    this.simulatorToastService.error('Código expirado. Solicite o reenvio e tente novamente.');
  }

  zerarTempoReenvio() {
    this.countdownTimer.set(0);
    if (this.intervalTimerId) {
      clearInterval(this.intervalTimerId);
      this.intervalTimerId = null;
    }
  }

  preencherSenhaValida() {
    this.novaSenha.set('Educacao@2026');
    this.confirmaSenha.set('Educacao@2026');
    this.senhaBlurError.set(null);
    this.confirmaBlurError.set(null);
  }

  toggleSimularFalhaAuth() {
    this.simularFalhaAuth.update(val => !val);
  }

  private gerarNovoCodigoSeguranca() {
    const num = Math.floor(100000 + Math.random() * 900000).toString();
    this.activeSecurityCode.set(num);
  }

  private iniciarContadorReenvio() {
    if (this.intervalTimerId) {
      clearInterval(this.intervalTimerId);
      this.intervalTimerId = null;
    }
    this.countdownTimer.set(60);
    this.intervalTimerId = setInterval(() => {
      const current = this.countdownTimer();
      if (current > 0) {
        this.countdownTimer.set(current - 1);
      } else {
        if (this.intervalTimerId) {
          clearInterval(this.intervalTimerId);
          this.intervalTimerId = null;
        }
      }
    }, 1000);
  }

  private iniciarExpiracaoCodigo() {
    if (this.expirationIntervalId) {
      clearInterval(this.expirationIntervalId);
      this.expirationIntervalId = null;
    }
    this.codeExpirationTimer.set(600); // 10 minutos
    this.expirationIntervalId = setInterval(() => {
      const cur = this.codeExpirationTimer();
      if (cur > 0) {
        this.codeExpirationTimer.set(cur - 1);
      } else {
        if (this.expirationIntervalId) {
          clearInterval(this.expirationIntervalId);
          this.expirationIntervalId = null;
        }
      }
    }, 1000);
  }

  private limparTimers() {
    if (this.intervalTimerId) {
      clearInterval(this.intervalTimerId);
      this.intervalTimerId = null;
    }
    if (this.expirationIntervalId) {
      clearInterval(this.expirationIntervalId);
      this.expirationIntervalId = null;
    }
  }

  formatSeconds(sec: number): string {
    return sec < 10 ? `0${sec}` : `${sec}`;
  }

  abrirModal(config: Omit<ModalConfig, 'isOpen'>) {
    this.modal.set({
      ...config,
      isOpen: true
    });
  }

  fecharModal() {
    const current = this.modal();
    this.modal.set({
      ...current,
      isOpen: false
    });
    if (current.action) {
      current.action();
    }
  }

  private validarEmail(email: string): boolean {
    if (!email || email.length > 100) return false;
    if (/\s/.test(email)) return false;
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  }
}

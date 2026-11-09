import {Component, inject, signal, Injectable, ChangeDetectionStrategy} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {CommonModule} from '@angular/common';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ModalComponent, ModalData, ModalService, VinculoUsoItem} from './modal';
import {SimulatorService} from './simulator';

export * from './modal';

export type DialogActionType = 'primary' | 'destructive' | 'secondary';

export interface SiageDialogData extends ModalData {
  actionType?: DialogActionType;
}

/**
 * SiageDialog consolidado no ModalComponent universal.
 */
@Component({
  selector: 'app-siage-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalComponent, CommonModule],
  template: `
    <app-modal></app-modal>
  `
})
export class SiageDialog {
  readonly dialogRef = inject(MatDialogRef<SiageDialog>);
  readonly data = inject<SiageDialogData>(MAT_DIALOG_DATA);
}

export interface ConfirmacaoDialogData {
  title: string;
  message: string;
  actionLabel: string;
  actionType?: 'destructive' | 'primary';
  loadingLabel?: string;
  cancelLabel?: string;
}

/**
 * ConfirmacaoDialog consolidado no padrão global do SIAGE Design System.
 */
@Component({
  selector: 'app-confirmacao-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, CommonModule],
  template: `
    <div 
      class="relative w-[calc(100vw-2rem)] sm:w-[500px] max-w-full bg-siage-surface text-siage-text-primary rounded-lg border border-siage-border shadow-[var(--mat-sys-level3)] font-sans transition-colors duration-200 flex flex-col text-left box-border max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:w-full max-sm:max-w-full max-sm:rounded-b-none max-sm:rounded-t-2xl max-sm:m-0"
      role="dialog"
      [attr.aria-label]="data.title"
    >
      <!-- Cabeçalho com Título e Botão Fechar 40x40 -->
      <div class="flex items-center justify-between px-5 pt-5 pb-3 border-b border-siage-border/40 shrink-0">
        <h2 class="text-base sm:text-lg font-poppins font-bold text-siage-text-primary tracking-tight leading-snug truncate pr-3 text-left">
          {{ data.title }}
        </h2>

        @if (!isLoading()) {
          <button 
            type="button" 
            (click)="cancelar()" 
            class="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg flex items-center justify-center text-siage-text-secondary hover:text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
            title="Fechar"
            aria-label="Fechar modal"
          >
            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">close</mat-icon>
          </button>
        }
      </div>

      <!-- Corpo -->
      <div class="px-5 py-4 overflow-y-auto flex-1 font-sans text-left">
        <p class="text-xs sm:text-sm text-siage-text-secondary leading-relaxed">
          {{ data.message }}
        </p>
      </div>

      <!-- Rodapé com Ações alinhadas à direita: Cancelar -> Ação Principal -->
      <div class="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-siage-border/40 shrink-0 bg-siage-surface">
        <button 
          type="button" 
          (click)="cancelar()" 
          [disabled]="isLoading()"
          class="h-10 px-5 rounded-lg border border-siage-border font-sans font-medium text-xs sm:text-sm text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.99] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40 disabled:opacity-50"
        >
          {{ data.cancelLabel || 'Cancelar' }}
        </button>

        <button 
          type="button" 
          (click)="confirmar()" 
          [disabled]="isLoading()"
          [class]="data.actionType === 'destructive' 
            ? 'h-10 px-5 rounded-lg bg-[var(--destructive)] hover:opacity-90 text-white font-sans font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--destructive)]/40' 
            : 'h-10 px-5 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40'"
        >
          <span class="flex items-center gap-2 justify-center">
            @if (isLoading()) {
              <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ data.loadingLabel || 'Processando...' }}</span>
            } @else {
              <span>{{ data.actionLabel }}</span>
            }
          </span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      border-radius: 8px;
      overflow: hidden;
    }
  `]
})
export class ConfirmacaoDialog {
  readonly dialogRef = inject(MatDialogRef<ConfirmacaoDialog>);
  readonly data = inject<ConfirmacaoDialogData>(MAT_DIALOG_DATA);
  readonly isLoading = signal(false);

  cancelar() {
    this.dialogRef.close(false);
  }

  confirmar() {
    this.isLoading.set(true);
    setTimeout(() => {
      this.dialogRef.close(true);
    }, 350);
  }
}

export interface ResultadoDialogData {
  type?: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
  buttonLabel?: string;
  vinculos?: VinculoUsoItem[];
  totalTabelas?: number;
  detailsList?: string[];
  detalhesEstruturados?: { titulo: string; itens: string[] }[];
}

/**
 * ResultadoDialog consolidado (Impossibilidade de exclusão e Vínculos de uso).
 * Botão padrão sempre "Fechar" (nunca "OK").
 */
@Component({
  selector: 'app-resultado-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, CommonModule],
  template: `
    <div 
      class="relative w-[calc(100vw-2rem)] sm:w-[500px] max-w-full max-h-[85vh] bg-siage-surface text-siage-text-primary rounded-lg border border-siage-border shadow-[var(--mat-sys-level3)] font-sans transition-colors duration-200 flex flex-col text-left box-border overflow-hidden max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:w-full max-sm:max-w-full max-sm:rounded-b-none max-sm:rounded-t-2xl max-sm:m-0"
      role="dialog"
      [attr.aria-label]="data.title"
    >
      <!-- Cabeçalho com Título e Fechar (X) 40x40 -->
      <div class="flex items-center justify-between px-5 pt-5 pb-3 border-b border-siage-border/40 shrink-0">
        <h2 class="text-base sm:text-lg font-poppins font-bold text-siage-text-primary tracking-tight leading-snug truncate pr-3 text-left">
          {{ data.title }}
        </h2>

        <button 
          type="button" 
          (click)="fechar()" 
          class="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg flex items-center justify-center text-siage-text-secondary hover:text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
          title="Fechar"
          aria-label="Fechar modal"
        >
          <mat-icon style="font-size: 18px; width: 18px; height: 18px;">close</mat-icon>
        </button>
      </div>

      <!-- Corpo: rolagem vertical somente na lista quando houver vínculos -->
      <div 
        class="px-5 py-4 flex-1 min-h-0 flex flex-col gap-3 font-sans text-left"
        [class.overflow-y-auto]="!data.vinculos || data.vinculos.length === 0"
        [class.overflow-hidden]="data.vinculos && data.vinculos.length > 0"
      >
        @if (data.message) {
          <p class="text-xs sm:text-sm text-siage-text-secondary leading-relaxed shrink-0">
            {{ data.message }}
          </p>
        }

        <!-- Vínculos de Uso: formato técnico "SCHEMA - NOME DA TABELA" -->
        @if (data.vinculos && data.vinculos.length > 0) {
          <div class="flex flex-col gap-2 min-h-0 flex-1">
            <span class="text-xs font-semibold text-siage-text-secondary uppercase tracking-wider shrink-0">
              SCHEMA - NOME DA TABELA
            </span>
            
            <div class="bg-siage-background border border-siage-border rounded-lg divide-y divide-siage-border/50 max-h-60 sm:max-h-64 min-h-0 overflow-y-auto overflow-x-hidden">
              @for (v of data.vinculos; track $index) {
                <div class="px-3.5 py-2.5 text-xs sm:text-sm font-mono text-siage-text-primary flex items-center gap-2 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <span class="truncate">{{ v.schema }} - {{ v.tabela }}</span>
                </div>
              }
            </div>

            <div class="pt-1 text-xs text-siage-text-secondary font-medium shrink-0">
              Total de tabelas: <strong class="font-semibold text-siage-text-primary">{{ data.totalTabelas ?? data.vinculos.length }}</strong>
            </div>
          </div>
        }

        @if (data.detailsList && data.detailsList.length > 0) {
          <div class="bg-siage-background border border-siage-border rounded-lg p-3 space-y-1.5 max-h-[35vh] overflow-y-auto">
            @for (item of data.detailsList; track $index) {
              <div class="flex items-start gap-2 text-xs sm:text-sm text-siage-text-primary">
                <span class="w-1.5 h-1.5 rounded-full bg-siage-primary mt-1.5 shrink-0"></span>
                <span class="leading-normal">{{ item }}</span>
              </div>
            }
          </div>
        }
      </div>

      <!-- Rodapé com Botão Fechar à direita (40px) -->
      <div class="flex items-center justify-end px-5 py-3.5 border-t border-siage-border/40 shrink-0 bg-siage-surface">
        <button 
          type="button" 
          (click)="fechar()" 
          class="h-10 px-6 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
        >
          {{ data.buttonLabel || 'Fechar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      border-radius: 8px;
      overflow: hidden;
    }
  `]
})
export class ResultadoDialog {
  readonly dialogRef = inject(MatDialogRef<ResultadoDialog>);
  readonly data = inject<ResultadoDialogData>(MAT_DIALOG_DATA);

  fechar() {
    this.dialogRef.close();
  }
}

export interface RevalidarSenhaDialogData {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  validateFn?: (senha: string) => boolean;
}

/**
 * RevalidarSenhaDialog: Componente universal e genérico de confirmação de senha do SIAGE RH V2.
 */
@Component({
  selector: 'app-revalidar-senha-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, ReactiveFormsModule, CommonModule],
  template: `
    <div 
      class="w-[calc(100vw-2rem)] sm:w-[460px] max-w-full bg-siage-surface text-siage-text-primary rounded-lg border border-siage-border shadow-[var(--mat-sys-level3)] font-sans flex flex-col text-left box-border max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:w-full max-sm:max-w-full max-sm:rounded-b-none max-sm:rounded-t-2xl max-sm:m-0"
      role="dialog"
      aria-labelledby="revalidar-senha-title"
    >
      <!-- Cabeçalho -->
      <div class="flex items-center justify-between px-5 pt-5 pb-3 border-b border-siage-border/40 shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-siage-primary/10 text-siage-primary flex items-center justify-center">
            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">lock</mat-icon>
          </div>
          <h2 id="revalidar-senha-title" class="text-base font-poppins font-bold text-siage-text-primary">
            {{ data?.title || 'Confirmação de Segurança' }}
          </h2>
        </div>
        <button 
          type="button" 
          (click)="cancelar()" 
          class="w-8 h-8 rounded-lg flex items-center justify-center text-siage-text-secondary hover:text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="Fechar"
          aria-label="Fechar modal"
        >
          <mat-icon style="font-size: 18px; width: 18px; height: 18px;">close</mat-icon>
        </button>
      </div>

      <!-- Formulário -->
      <form [formGroup]="form" (ngSubmit)="confirmar()" class="px-5 py-4 flex flex-col gap-4">
        <p class="text-xs sm:text-sm text-siage-text-secondary leading-relaxed">
          {{ data?.message || 'Para confirmar esta ação, informe sua senha de acesso.' }}
        </p>

        <div class="flex flex-col gap-1.5">
          <label for="senha-revalidacao" class="text-xs font-semibold uppercase tracking-wider text-siage-text-secondary">
            Senha de acesso <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <input 
              id="senha-revalidacao"
              [type]="hidePassword() ? 'password' : 'text'"
              formControlName="senha" 
              placeholder="Digite sua senha" 
              autocomplete="current-password"
              class="w-full h-10 px-3.5 pr-10 rounded-lg border bg-siage-background text-sm font-sans text-siage-text-primary focus:outline-none transition-all"
              [class.border-red-500]="form.controls.senha.invalid && form.controls.senha.touched"
              [class.focus:ring-2]="true"
              [class.focus:ring-red-500/40]="form.controls.senha.invalid && form.controls.senha.touched"
              [class.focus:border-red-500]="form.controls.senha.invalid && form.controls.senha.touched"
              [class.border-siage-border]="!(form.controls.senha.invalid && form.controls.senha.touched)"
              [class.focus:ring-siage-primary/40]="!(form.controls.senha.invalid && form.controls.senha.touched)"
              [class.focus:border-siage-primary]="!(form.controls.senha.invalid && form.controls.senha.touched)"
            />
            <button 
              type="button" 
              (click)="hidePassword.set(!hidePassword())" 
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-siage-text-secondary hover:text-siage-primary p-1 cursor-pointer"
              tabindex="-1"
              [attr.aria-label]="hidePassword() ? 'Exibir senha' : 'Ocultar senha'"
            >
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </div>
          @if (form.controls.senha.hasError('senhaIncorreta')) {
            <span class="text-xs text-red-500 font-medium">Senha incorreta. Verifique e tente novamente.</span>
          } @else if (form.controls.senha.hasError('required') && form.controls.senha.touched) {
            <span class="text-xs text-red-500 font-medium">A senha de acesso é obrigatória.</span>
          }
        </div>

        <!-- Ações: Cancelar e Confirmar -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-siage-border/40 shrink-0">
          <button 
            type="button" 
            (click)="cancelar()" 
            class="h-10 px-5 rounded-lg border border-siage-border font-sans font-medium text-xs sm:text-sm text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
          >
            {{ data?.cancelLabel || 'Cancelar' }}
          </button>
          <button 
            type="submit" 
            [disabled]="form.invalid" 
            class="h-10 px-6 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {{ data?.confirmLabel || 'Confirmar' }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class RevalidarSenhaDialog {
  readonly dialogRef = inject(MatDialogRef<RevalidarSenhaDialog>);
  readonly data = inject<RevalidarSenhaDialogData | null>(MAT_DIALOG_DATA, { optional: true });
  readonly simulator = inject(SimulatorService);
  readonly hidePassword = signal(true);
  readonly form = new FormGroup({
    senha: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  constructor() {
    this.form.controls.senha.valueChanges.subscribe(() => {
      if (this.form.controls.senha.hasError('senhaIncorreta')) {
        this.form.controls.senha.setErrors(null);
      }
    });
  }

  cancelar() {
    this.dialogRef.close(false);
  }

  confirmar() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const senha = this.form.controls.senha.value.trim();
    const isSimulando = this.simulator.simularSenhaIncorreta();
    const isErrada = isSimulando ||
      (this.data?.validateFn
        ? !this.data.validateFn(senha)
        : (senha.toLowerCase().includes('errad') || senha.toLowerCase().includes('incorret') || senha === '123' || senha === '0000'));

    if (isErrada) {
      this.form.controls.senha.setErrors({ senhaIncorreta: true });
      return;
    }

    this.dialogRef.close(true);
  }
}

/**
 * DialogService que herda do ModalService oficial para garantir nunca empilhar modais.
 */
@Injectable({ providedIn: 'root' })
export class DialogService extends ModalService {}

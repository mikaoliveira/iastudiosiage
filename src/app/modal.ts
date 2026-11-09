import {Component, inject, signal, Injectable, ChangeDetectionStrategy} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {CommonModule} from '@angular/common';

export type ModalActionVariant = 'primary' | 'destructive' | 'secondary';

export interface VinculoUsoItem {
  schema: string;
  tabela: string;
}

export const VINCULOS_USO_MUITOS: VinculoUsoItem[] = [
  { schema: 'rh', tabela: 'profissional_matricula' },
  { schema: 'rh', tabela: 'profissional_cargo_comissionado' },
  { schema: 'rh', tabela: 'profissional_classificacao_funcional' },
  { schema: 'rh', tabela: 'profissional_admissao' },
  { schema: 'rh', tabela: 'profissional_formacao_academica' },
  { schema: 'rh', tabela: 'profissional_dados_pessoais' },
  { schema: 'rh', tabela: 'profissional_desligamento' },
  { schema: 'rh', tabela: 'historico_situacao_funcional' },
  { schema: 'rh', tabela: 'historico_funcional' },
  { schema: 'quadro', tabela: 'lotacao_profissional' },
  { schema: 'quadro', tabela: 'alocacao_turma_modalidade' },
  { schema: 'quadro', tabela: 'vaga_unidade_escolar' },
  { schema: 'folha', tabela: 'ficha_financeira_cabecalho' },
  { schema: 'folha', tabela: 'ficha_financeira_item' },
  { schema: 'avaliacao', tabela: 'avaliacao_desempenho_servidor' },
  { schema: 'afastamento', tabela: 'historico_afastamento_servidor' }
];

export interface ModalData {
  title: string;
  description?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  actionVariant?: ModalActionVariant;
  loadingLabel?: string;
  showCloseButton?: boolean;
  vinculos?: VinculoUsoItem[];
  totalTabelas?: number;
  detailsList?: string[];
  detalhesEstruturados?: { titulo: string; itens: string[] }[];
}

/**
 * Componente Global Universal de Modal do SIAGE-RH.
 * 
 * Atende com rigor às especificações do SIAGE Design System:
 * - Raio de 8px (desktop) e bottom sheet (mobile)
 * - Elevação nível 3 (--mat-sys-level3)
 * - Superfície e bordas do Design System
 * - Textos alinhados à esquerda
 * - Botão X como IconButton com área clicável de 40x40px, aria-label e foco visível
 * - Rodapé com ações alinhadas à direita: Secundária -> Primária/Destrutiva (botões de 40px)
 * - Variante destrutiva com token semântico oficial --destructive (#D20D68 claro / #FF7A66 escuro)
 * - Rolagem vertical exclusiva na lista quando o conteúdo for longo (ex.: Vínculos de Uso)
 * - Sem ícones decorativos arbitrários
 */
@Component({
  selector: 'app-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, CommonModule],
  template: `
    <div 
      class="relative w-[calc(100vw-2rem)] sm:w-[500px] max-w-full max-h-[85vh] bg-siage-surface text-siage-text-primary rounded-lg border border-siage-border shadow-[var(--mat-sys-level3)] font-sans transition-colors duration-200 flex flex-col text-left box-border overflow-hidden max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:w-full max-sm:max-w-full max-sm:rounded-b-none max-sm:rounded-t-2xl max-sm:m-0"
      role="dialog"
      [attr.aria-label]="data.title"
    >
      
      <!-- Cabeçalho do Modal: Título alinhado à esquerda + Botão de fechar (X) -->
      <div class="flex items-center justify-between px-5 pt-5 pb-3 border-b border-siage-border/40 shrink-0">
        <h2 class="text-base sm:text-lg font-poppins font-bold text-siage-text-primary tracking-tight leading-snug truncate pr-3 text-left">
          {{ data.title }}
        </h2>

        @if (data.showCloseButton !== false && !isLoading()) {
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

      <!-- Corpo do Modal: Rolagem vertical exclusiva na lista de vínculos quando presente -->
      <div 
        class="px-5 py-4 flex-1 min-h-0 flex flex-col gap-3 font-sans text-left"
        [class.overflow-y-auto]="!data.vinculos || data.vinculos.length === 0"
        [class.overflow-hidden]="data.vinculos && data.vinculos.length > 0"
      >
        
        <!-- Descrição / Contexto da operação -->
        @if (data.description || data.message) {
          <p class="text-xs sm:text-sm text-siage-text-secondary leading-relaxed shrink-0">
            {{ data.description || data.message }}
          </p>
        }

        <!-- Seção de Vínculos de Uso: formato técnico "SCHEMA - NOME DA TABELA" com rolagem exclusiva na lista -->
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

        <!-- Lista de detalhes complementares -->
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

        <!-- Detalhes estruturados em blocos -->
        @if (data.detalhesEstruturados && data.detalhesEstruturados.length > 0) {
          <div class="space-y-2.5 max-h-[35vh] overflow-y-auto">
            @for (bloco of data.detalhesEstruturados; track bloco.titulo) {
              <div class="bg-siage-background border border-siage-border rounded-lg p-3">
                <span class="text-xs font-semibold text-siage-text-primary block mb-1.5 uppercase tracking-wider">
                  {{ bloco.titulo }}
                </span>
                <ul class="space-y-1">
                  @for (item of bloco.itens; track item) {
                    <li class="flex items-start gap-2 text-xs sm:text-sm text-siage-text-secondary">
                      <mat-icon class="text-siage-primary text-xs shrink-0 mt-0.5" style="font-size: 14px; width: 14px; height: 14px;">check</mat-icon>
                      <span>{{ item }}</span>
                    </li>
                  }
                </ul>
              </div>
            }
          </div>
        }

      </div>

      <!-- Rodapé com Ações alinhadas à direita: Secundária -> Principal/Destrutiva (40px) -->
      <div class="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-siage-border/40 shrink-0 bg-siage-surface">
        
        <!-- Ação secundária: Cancelar (variante secondary) -->
        @if (data.cancelLabel) {
          <button 
            type="button" 
            (click)="cancelar()" 
            [disabled]="isLoading()"
            class="h-10 px-5 rounded-lg border border-siage-border font-sans font-medium text-xs sm:text-sm text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.99] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40 disabled:opacity-50"
          >
            {{ data.cancelLabel }}
          </button>
        }

        <!-- Ação principal: Ativar, Inativar, Fechar ou Sim, excluir registro (destructive) -->
        <button 
          type="button" 
          (click)="confirmar()" 
          [disabled]="isLoading()"
          [class]="data.actionVariant === 'destructive' 
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
              <span>{{ data.confirmLabel || 'Fechar' }}</span>
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
export class ModalComponent {
  readonly dialogRef = inject(MatDialogRef<ModalComponent>);
  readonly data = inject<ModalData>(MAT_DIALOG_DATA);
  readonly isLoading = signal(false);

  cancelar() {
    this.dialogRef.close(false);
  }

  confirmar() {
    if (this.data.loadingLabel) {
      this.isLoading.set(true);
      setTimeout(() => {
        this.dialogRef.close(true);
      }, 350);
    } else {
      this.dialogRef.close(true);
    }
  }

  /**
   * Permite substituir o conteúdo do modal atual sem abrir um novo modal por cima.
   */
  updateData(newData: Partial<ModalData>) {
    Object.assign(this.data, newData);
  }
}

/**
 * Serviço Global Gerenciador de Modais do SIAGE-RH:
 * - Garante a regra inegociável de NUNCA empilhar modais (fecha qualquer modal antes de abrir novo).
 * - Centraliza métodos tipados para Ativação, Inativação, Exclusão Destrutiva e Impossibilidade.
 */
@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly matDialog = inject(MatDialog);

  open(data: ModalData) {
    // Regra: nunca empilhar modais
    this.matDialog.closeAll();

    return this.matDialog.open(ModalComponent, {
      data,
      disableClose: true,
      autoFocus: false,
      panelClass: 'siage-modal-pane'
    });
  }

  /**
   * Modal universal de ativação:
   * Título: "Ativar registro?"
   * Ações: Cancelar | Sim, ativar
   */
  confirmarAtivacao(descricao: string, contexto?: string) {
    return this.open({
      title: 'Ativar registro?',
      description: contexto || `Tem certeza que deseja ativar o registro ${descricao}?`,
      confirmLabel: 'Sim, ativar',
      cancelLabel: 'Cancelar',
      actionVariant: 'primary',
      loadingLabel: 'Ativando...'
    });
  }

  /**
   * Modal universal de inativação:
   * Título: "Inativar registro?"
   * Ações: Cancelar | Sim, inativar
   */
  confirmarInativacao(descricao: string, contexto?: string) {
    return this.open({
      title: 'Inativar registro?',
      description: contexto || `Tem certeza que deseja inativar o registro ${descricao}?`,
      confirmLabel: 'Sim, inativar',
      cancelLabel: 'Cancelar',
      actionVariant: 'primary',
      loadingLabel: 'Inativando...'
    });
  }

  /**
   * Modal universal de exclusão destrutiva:
   * Título: "Excluir registro?"
   * Ações: Cancelar | Sim, excluir registro
   * Cor efetiva: --destructive (#D20D68 claro / #FF7A66 escuro)
   */
  confirmarExclusao(descricao: string, aviso?: string) {
    return this.open({
      title: 'Excluir registro?',
      description: aviso || `Tem certeza que deseja excluir permanentemente o registro ${descricao}? Esta ação não poderá ser desfeita.`,
      confirmLabel: 'Sim, excluir registro',
      cancelLabel: 'Cancelar',
      actionVariant: 'destructive',
      loadingLabel: 'Excluindo...'
    });
  }

  /**
   * Modal universal de impossibilidade de exclusão (registro em uso):
   * Título: "Não foi possível excluir o registro"
   * Ação: "Fechar" (substitui qualquer "OK")
   */
  impossibilidadeExclusao(descricao: string, motivo?: string) {
    return this.open({
      title: 'Não foi possível excluir o registro',
      description: motivo || `O registro ${descricao} não pode ser excluído porque possui vínculos ativos com outras tabelas ou funcionalidades do sistema.`,
      confirmLabel: 'Fechar',
      showCloseButton: true
    });
  }

  /**
   * Modal universal de visualização dos Vínculos de Uso:
   * Formato técnico: "SCHEMA - NOME DA TABELA" com totalizador e rolagem isolada somente na lista.
   */
  verVinculosDeUso(vinculos: VinculoUsoItem[]) {
    return this.open({
      title: 'Vínculos de uso',
      vinculos,
      totalTabelas: vinculos.length,
      confirmLabel: 'Fechar',
      showCloseButton: true
    });
  }

  /**
   * Modal universal de confirmação de cancelamento (quando houver alterações não salvas):
   * Título: "Tem certeza que deseja cancelar?"
   * Mensagem: "As alterações não salvas serão perdidas."
   * Botão secundário: "Não"
   * Botão principal/ação: "Sim, cancelar" (actionVariant: 'primary')
   * Botão fechar (X): no topo direito com área 40x40px
   */
  confirmarCancelamento(mensagem?: string) {
    return this.open({
      title: 'Tem certeza que deseja cancelar?',
      description: mensagem || 'As alterações não salvas serão perdidas.',
      confirmLabel: 'Sim, cancelar',
      cancelLabel: 'Não',
      actionVariant: 'primary',
      showCloseButton: true
    });
  }

  closeAll() {
    this.matDialog.closeAll();
  }
}

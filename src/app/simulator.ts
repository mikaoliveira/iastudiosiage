import {Component, inject, signal, computed, ChangeDetectionStrategy, Injectable} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, NavigationEnd} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatDialog} from '@angular/material/dialog';
import {ToastService} from './toast';
import {AuthSessionService, USUARIOS_TESTE} from './auth-session';
import {CargoComissionadoService} from './cargo-comissionado';
import {ClassificacaoFuncionalService} from './classificacao-funcional';
import {FormaAdmissaoService} from './forma-de-admissao';
import {FormacaoAcademicaService} from './formacao-academica';
import {GrauInstrucaoService} from './grau-de-instrucao';
import {ModalidadeEnsinoService} from './modalidade-de-ensino';
import {MotivoSaidaService} from './motivo-da-saida';
import {SituacaoFuncionalService} from './situacao-funcional';
import {SecretariaGeralService} from './secretaria-geral';
import {ModalService, VINCULOS_USO_MUITOS, VinculoUsoItem} from './modal';
import {ResultadoDialog} from './dialog';

export type ScenarioType = 'normal' | 'loading' | 'error' | 'empty' | 'no_filter_results' | 'access_denied';

@Injectable({
  providedIn: 'root'
})
export class SimulatorService {
  readonly currentScenario = signal<ScenarioType>('normal');
  readonly allowCreation = signal<boolean>(true);
  readonly manyLinksScenario = signal<boolean>(false);

  readonly simularSenhaIncorreta = signal<boolean>(false);
  readonly simularClassificacaoIncompativel = signal<boolean>(false);
  readonly simularCepNaoLocalizado = signal<boolean>(false);

  // Gatilho de eventos para a tela Adicionar Professor
  readonly acaoCadastroProfessor = signal<{ tipo: string; timestamp: number } | null>(null);

  dispararAcaoCadastro(tipo: string) {
    this.acaoCadastroProfessor.set({ tipo, timestamp: Date.now() });
  }

  setScenario(type: ScenarioType) {
    this.currentScenario.set(type);
  }

  toggleAllowCreation() {
    this.allowCreation.update(v => !v);
  }

  toggleManyLinksScenario() {
    this.manyLinksScenario.update(v => !v);
  }

  toggleSimularSenhaIncorreta() {
    this.simularSenhaIncorreta.update(v => !v);
  }

  toggleSimularClassificacaoIncompativel() {
    this.simularClassificacaoIncompativel.update(v => !v);
  }

  toggleSimularCepNaoLocalizado() {
    this.simularCepNaoLocalizado.update(v => !v);
  }

  reset() {
    this.currentScenario.set('normal');
    this.allowCreation.set(true);
    this.manyLinksScenario.set(false);
    this.simularSenhaIncorreta.set(false);
    this.simularClassificacaoIncompativel.set(false);
    this.simularCepNaoLocalizado.set(false);
    this.acaoCadastroProfessor.set(null);
  }
}

@Component({
  selector: 'app-simulator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <!-- Botão de simulador escondidinho no canto inferior direito -->
    <div class="fixed bottom-5 right-5 z-40 font-sans select-none">
      
      <!-- Botãozinho discreto / escondidinho -->
      <button 
        type="button" 
        (click)="isOpen.set(!isOpen())"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 dark:bg-slate-800/90 text-white hover:bg-slate-900 dark:hover:bg-slate-700 text-[11px] font-sans font-medium shadow-md backdrop-blur-xs border border-white/10 hover:shadow-lg transition-all cursor-pointer opacity-70 hover:opacity-100 group"
        title="Simulador de Cenários (Prototipagem)"
        aria-label="Abrir simulador de cenários"
      >
        <mat-icon style="font-size: 14px; width: 14px; height: 14px;" class="text-siage-primary transition-transform group-hover:rotate-45">tune</mat-icon>
        <span class="tracking-wide">Simulador</span>
        @if (simulatorService.currentScenario() !== 'normal' || simulatorService.manyLinksScenario() || simulatorService.simularClassificacaoIncompativel() || simulatorService.simularSenhaIncorreta() || simulatorService.simularCepNaoLocalizado() || (isSecretariaGeral() && secretariaGeralService.cenarioAtivo())) {
          <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="Cenário simulado ativo"></span>
        }
      </button>

      <!-- Painel Flutuante do Simulador com os Cenários Possíveis -->
      @if (isOpen()) {
        <div 
          class="absolute bottom-10 right-0 w-84 max-h-[82vh] overflow-y-auto bg-siage-surface border border-siage-border rounded-xl shadow-2xl p-4 text-left flex flex-col gap-3 font-sans transition-all z-50 text-siage-text-primary"
        >
          <!-- Cabeçalho do Simulador -->
          <div class="flex items-center justify-between pb-2.5 border-b border-siage-border/40 shrink-0">
            <div class="flex items-center gap-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;" class="text-siage-primary">science</mat-icon>
              <div class="flex flex-col">
                <span class="text-xs font-semibold text-siage-text-primary leading-tight">Simulador de Cenários</span>
                <span class="text-[10px] text-siage-text-secondary">
                  {{ isCadastroProfessor() ? 'Cenários da tela Adicionar Professor' : isSecretariaGeral() ? 'Cenários da Secretaria Geral' : 'Validação visual dos estados do protótipo' }}
                </span>
              </div>
            </div>
            <button 
              type="button" 
              (click)="isOpen.set(false)" 
              class="text-siage-text-secondary hover:text-siage-text-primary p-1 rounded-md cursor-pointer transition-colors"
              aria-label="Fechar simulador"
            >
              <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
            </button>
          </div>

          <!-- MODO ADICIONAR PROFESSOR: APENAS OS CENÁRIOS PERTINENTES A ESTA TELA -->
          @if (isCadastroProfessor()) {
            <div class="flex flex-col gap-1.5">
              <span class="text-[10px] font-bold text-siage-text-secondary uppercase tracking-wider">Adicionar Professor</span>

              <!-- 1. Preenchimento válido -->
              <button 
                type="button" 
                (click)="dispararAcao('preenchimento_valido')"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-siage-border/50 cursor-pointer transition-colors text-left"
              >
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-emerald-600">fact_check</mat-icon>
                  <span>1. Preenchimento válido</span>
                </div>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">Preencher</span>
              </button>

              <!-- 2. Campos obrigatórios (destaque, scroll e toast) -->
              <button 
                type="button" 
                (click)="dispararAcao('campos_obrigatorios')"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-siage-border/50 cursor-pointer transition-colors text-left"
              >
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-amber-500">error_outline</mat-icon>
                  <span>2. Campos obrigatórios</span>
                </div>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">Validar</span>
              </button>

              <!-- 3. Validações de CPF/Matrícula -->
              <button 
                type="button" 
                (click)="dispararAcao('validacao_cpf_matricula')"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-siage-border/50 cursor-pointer transition-colors text-left"
              >
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-siage-primary">badge</mat-icon>
                  <span>3. Validações CPF / Matrícula</span>
                </div>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-siage-primary/10 text-siage-primary font-medium">Simular</span>
              </button>

              <!-- 4. Classificação Funcional não localizada -->
              <button 
                type="button" 
                (click)="simulatorService.toggleSimularClassificacaoIncompativel(); testarClassificacaoIncompativelToast()"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-siage-border/50 cursor-pointer transition-colors text-left"
              >
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-red-500">block</mat-icon>
                  <span>4. Classificação não localizada</span>
                </div>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold" [class]="simulatorService.simularClassificacaoIncompativel() ? 'bg-red-500 text-white' : 'bg-slate-500/10 text-siage-text-secondary'">
                  {{ simulatorService.simularClassificacaoIncompativel() ? 'Bloqueio Ativo' : 'Inativo' }}
                </span>
              </button>

              <!-- 5. Confirmação de senha (modal genérico) -->
              <button 
                type="button" 
                (click)="dispararAcao('confirmacao_senha')"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-siage-border/50 cursor-pointer transition-colors text-left"
              >
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-siage-primary">security</mat-icon>
                  <span>5. Confirmação de senha</span>
                </div>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-siage-primary/10 text-siage-primary font-medium">Abrir</span>
              </button>

              <!-- 6. Senha incorreta (inline sem 2º modal) -->
              <button 
                type="button" 
                (click)="simulatorService.toggleSimularSenhaIncorreta()"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-siage-border/50 cursor-pointer transition-colors text-left"
              >
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-amber-500">lock</mat-icon>
                  <span>6. Senha incorreta (inline)</span>
                </div>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold" [class]="simulatorService.simularSenhaIncorreta() ? 'bg-amber-500 text-white' : 'bg-slate-500/10 text-siage-text-secondary'">
                  {{ simulatorService.simularSenhaIncorreta() ? 'Ativo' : 'Inativo' }}
                </span>
              </button>

              <!-- 7. CEP não localizado (inline + preenchimento manual) -->
              <button 
                type="button" 
                (click)="simulatorService.toggleSimularCepNaoLocalizado(); dispararAcao('cep_nao_localizado')"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-siage-border/50 cursor-pointer transition-colors text-left"
              >
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-blue-500">location_off</mat-icon>
                  <span>7. CEP não localizado</span>
                </div>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold" [class]="simulatorService.simularCepNaoLocalizado() ? 'bg-blue-500 text-white' : 'bg-slate-500/10 text-siage-text-secondary'">
                  {{ simulatorService.simularCepNaoLocalizado() ? 'Ativo' : 'Inativo' }}
                </span>
              </button>

              <!-- 8. Anexos (atingir 5 de 5 sem toast) -->
              <button 
                type="button" 
                (click)="dispararAcao('anexos')"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-siage-border/50 cursor-pointer transition-colors text-left"
              >
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-purple-500">attach_file</mat-icon>
                  <span>8. Limite 5 de 5 anexos</span>
                </div>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">Preencher 5</span>
              </button>

              <!-- 9. Cadastro concluído (Toast de sucesso) -->
              <button 
                type="button" 
                (click)="toastService.success('Registro cadastrado com sucesso.')"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 cursor-pointer transition-colors text-left"
              >
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;">check_circle</mat-icon>
                  <span>9. Cadastro concluído</span>
                </div>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 font-bold">Sucesso</span>
              </button>

              <!-- 10. Erro genérico -->
              <button 
                type="button" 
                (click)="toastService.showGenericError()"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-700 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 cursor-pointer transition-colors text-left"
              >
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;">sync_problem</mat-icon>
                  <span>10. Erro genérico</span>
                </div>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 font-bold">Erro</span>
              </button>
            </div>
          } @else if (isSecretariaGeral()) {
            <!-- MODO SECRETARIA GERAL: ESTADOS DA LISTAGEM E CENÁRIOS EXCLUSIVOS -->
            <div class="flex flex-col gap-3">

              <!-- Atalhos de Navegação Rápida -->
              <div class="flex flex-col gap-1.5 pb-2 border-b border-siage-border/40">
                <span class="text-[10px] font-bold text-siage-text-secondary uppercase tracking-wider">Navegação Rápida</span>
                <div class="grid grid-cols-2 gap-1.5">
                  <button 
                    type="button" 
                    (click)="navegarPara('/configuracoes/hierarquia/secretaria-geral')" 
                    class="px-2 py-1.5 rounded-md border border-siage-border/60 hover:bg-black/5 dark:hover:bg-white/5 text-[11px] font-medium text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <mat-icon style="font-size: 14px; width: 14px; height: 14px;" class="text-siage-primary">list</mat-icon>
                    <span>Listagem</span>
                  </button>
                  <button 
                    type="button" 
                    (click)="navegarPara('/configuracoes/hierarquia/secretaria-geral/novo')" 
                    class="px-2 py-1.5 rounded-md border border-siage-border/60 hover:bg-black/5 dark:hover:bg-white/5 text-[11px] font-medium text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <mat-icon style="font-size: 14px; width: 14px; height: 14px;" class="text-siage-primary">add_circle</mat-icon>
                    <span>Adicionar</span>
                  </button>
                  <button 
                    type="button" 
                    (click)="navegarPara('/configuracoes/hierarquia/secretaria-geral/1/editar')" 
                    class="px-2 py-1.5 rounded-md border border-siage-border/60 hover:bg-black/5 dark:hover:bg-white/5 text-[11px] font-medium text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <mat-icon style="font-size: 14px; width: 14px; height: 14px;" class="text-siage-primary">edit</mat-icon>
                    <span>Editar</span>
                  </button>
                  <button 
                    type="button" 
                    (click)="navegarPara('/configuracoes/hierarquia/secretaria-geral/1')" 
                    class="px-2 py-1.5 rounded-md border border-siage-border/60 hover:bg-black/5 dark:hover:bg-white/5 text-[11px] font-medium text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <mat-icon style="font-size: 14px; width: 14px; height: 14px;" class="text-siage-primary">visibility</mat-icon>
                    <span>Visualizar</span>
                  </button>
                </div>
              </div>

              <!-- 1. Estados da Listagem -->
              <div class="flex flex-col gap-1.5">
                <span class="text-[10px] font-bold text-siage-text-secondary uppercase tracking-wider">Estados da Listagem</span>
                
                <!-- 1. Normal -->
                <button 
                  type="button" 
                  (click)="setScenarioSecGeral('normal')"
                  class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left"
                  [class]="simulatorService.currentScenario() === 'normal' 
                    ? 'bg-siage-primary/10 text-siage-primary font-semibold border border-siage-primary/30' 
                    : 'text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'"
                >
                  <div class="flex items-center gap-2">
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;">check_circle</mat-icon>
                    <span>1. Normal (com registros)</span>
                  </div>
                  @if (simulatorService.currentScenario() === 'normal') {
                    <span class="text-[10px] uppercase tracking-wider font-bold">Ativo</span>
                  }
                </button>

                <!-- 2. Carregando (Skeleton) -->
                <button 
                  type="button" 
                  (click)="setScenarioSecGeral('loading')"
                  class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left"
                  [class]="simulatorService.currentScenario() === 'loading' 
                    ? 'bg-siage-primary/10 text-siage-primary font-semibold border border-siage-primary/30' 
                    : 'text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'"
                >
                  <div class="flex items-center gap-2">
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;">hourglass_top</mat-icon>
                    <span>2. Carregando (Skeleton)</span>
                  </div>
                  @if (simulatorService.currentScenario() === 'loading') {
                    <span class="text-[10px] uppercase tracking-wider font-bold">Ativo</span>
                  }
                </button>

                <!-- 3. Sem resultado de filtro -->
                <button 
                  type="button" 
                  (click)="setScenarioSecGeral('no_filter_results')"
                  class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left"
                  [class]="simulatorService.currentScenario() === 'no_filter_results' 
                    ? 'bg-siage-primary/10 text-siage-primary font-semibold border border-siage-primary/30' 
                    : 'text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'"
                >
                  <div class="flex items-center gap-2">
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;">search_off</mat-icon>
                    <span>3. Sem resultado de filtro</span>
                  </div>
                  @if (simulatorService.currentScenario() === 'no_filter_results') {
                    <span class="text-[10px] uppercase tracking-wider font-bold">Ativo</span>
                  }
                </button>

                <!-- 4. Sem registros (banco vazio) -->
                <button 
                  type="button" 
                  (click)="setScenarioSecGeral('empty')"
                  class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left"
                  [class]="simulatorService.currentScenario() === 'empty' 
                    ? 'bg-siage-primary/10 text-siage-primary font-semibold border border-siage-primary/30' 
                    : 'text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'"
                >
                  <div class="flex items-center gap-2">
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;">inbox</mat-icon>
                    <span>4. Nenhum registro cadastrado</span>
                  </div>
                  @if (simulatorService.currentScenario() === 'empty') {
                    <span class="text-[10px] uppercase tracking-wider font-bold">Ativo</span>
                  }
                </button>

                <!-- 5. Erro de carregamento -->
                <button 
                  type="button" 
                  (click)="setScenarioSecGeral('error')"
                  class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left"
                  [class]="simulatorService.currentScenario() === 'error' 
                    ? 'bg-siage-primary/10 text-siage-primary font-semibold border border-siage-primary/30' 
                    : 'text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'"
                >
                  <div class="flex items-center gap-2">
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;">error_outline</mat-icon>
                    <span>5. Erro de carregamento</span>
                  </div>
                  @if (simulatorService.currentScenario() === 'error') {
                    <span class="text-[10px] uppercase tracking-wider font-bold">Ativo</span>
                  }
                </button>

                <!-- 6. Acesso negado -->
                <button 
                  type="button" 
                  (click)="setScenarioSecGeral('access_denied')"
                  class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left"
                  [class]="simulatorService.currentScenario() === 'access_denied' 
                    ? 'bg-[var(--destructive)]/10 text-[var(--destructive)] font-semibold border border-[var(--destructive)]/30' 
                    : 'text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'"
                >
                  <div class="flex items-center gap-2">
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;">lock</mat-icon>
                    <span>6. Acesso negado</span>
                  </div>
                  @if (simulatorService.currentScenario() === 'access_denied') {
                    <span class="text-[10px] uppercase tracking-wider font-bold">Ativo</span>
                  }
                </button>
              </div>

              <!-- 2. Cenários Exclusivos da Secretaria Geral -->
              <div class="flex flex-col gap-1.5 pt-2 border-t border-siage-border/40">
                <div class="flex items-center justify-between pb-0.5">
                  <span class="text-[10px] font-bold text-siage-text-secondary uppercase tracking-wider">Cenários — Secretaria Geral</span>
                  <button 
                    type="button" 
                    (click)="restaurarCenarioPadraoSecGeral()"
                    class="text-[10px] font-semibold text-siage-primary hover:underline cursor-pointer flex items-center gap-1"
                    title="Restaurar dados e cenários padrão"
                  >
                    <mat-icon style="font-size: 12px; width: 12px; height: 12px;">restore</mat-icon>
                    <span>Restaurar padrão</span>
                  </button>
                </div>

                <!-- 1. Cadastro permitido -->
                <button 
                  type="button" 
                  (click)="aplicarCenarioSecGeral('cadastro_permitido')"
                  class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-siage-border/50 cursor-pointer transition-colors text-left"
                  [class.bg-siage-primary/10]="secretariaGeralService.cenarioAtivo() === 'cadastro_permitido'"
                >
                  <div class="flex items-center gap-2">
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-emerald-600">add_task</mat-icon>
                    <span>1. Cadastro permitido</span>
                  </div>
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">Habilitado</span>
                </button>

                <!-- 2. Cadastro bloqueado -->
                <button 
                  type="button" 
                  (click)="aplicarCenarioSecGeral('cadastro_bloqueado')"
                  class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-siage-border/50 cursor-pointer transition-colors text-left"
                  [class.bg-siage-primary/10]="secretariaGeralService.cenarioAtivo() === 'cadastro_bloqueado'"
                >
                  <div class="flex items-center gap-2">
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-amber-500">block</mat-icon>
                    <span>2. Cadastro bloqueado</span>
                  </div>
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">Bloqueado</span>
                </button>

                <!-- 3. Inativação — todos os impedimentos -->
                <button 
                  type="button" 
                  (click)="aplicarCenarioSecGeral('inativacao_todos_impedimentos')"
                  class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-siage-border/50 cursor-pointer transition-colors text-left"
                  [class.bg-siage-primary/10]="secretariaGeralService.cenarioAtivo() === 'inativacao_todos_impedimentos'"
                >
                  <div class="flex items-center gap-2">
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-red-500">warning</mat-icon>
                    <span>3. Inativação — todos os impedimentos</span>
                  </div>
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 font-medium">3 impedimentos</span>
                </button>

                <!-- 4. Inativação — somente chefia vinculada -->
                <button 
                  type="button" 
                  (click)="aplicarCenarioSecGeral('inativacao_somente_chefia')"
                  class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-siage-border/50 cursor-pointer transition-colors text-left"
                  [class.bg-siage-primary/10]="secretariaGeralService.cenarioAtivo() === 'inativacao_somente_chefia'"
                >
                  <div class="flex items-center gap-2">
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-amber-500">person_off</mat-icon>
                    <span>4. Inativação — somente chefia</span>
                  </div>
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">Chefia</span>
                </button>

                <!-- 5. Inativação — somente unidades vinculadas -->
                <button 
                  type="button" 
                  (click)="aplicarCenarioSecGeral('inativacao_somente_unidades')"
                  class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-siage-border/50 cursor-pointer transition-colors text-left"
                  [class.bg-siage-primary/10]="secretariaGeralService.cenarioAtivo() === 'inativacao_somente_unidades'"
                >
                  <div class="flex items-center gap-2">
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-amber-500">account_tree</mat-icon>
                    <span>5. Inativação — somente unidades</span>
                  </div>
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">Unidades</span>
                </button>

                <!-- 6. Inativação — anexar normativa -->
                <button 
                  type="button" 
                  (click)="aplicarCenarioSecGeral('inativacao_anexar_normativa')"
                  class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-siage-border/50 cursor-pointer transition-colors text-left"
                  [class.bg-siage-primary/10]="secretariaGeralService.cenarioAtivo() === 'inativacao_anexar_normativa'"
                >
                  <div class="flex items-center gap-2">
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-siage-primary">note_add</mat-icon>
                    <span>6. Inativação — anexar normativa</span>
                  </div>
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-siage-primary/10 text-siage-primary font-medium">Modal Anexo</span>
                </button>

                <!-- 7. Inativação permitida -->
                <button 
                  type="button" 
                  (click)="aplicarCenarioSecGeral('inativacao_permitida')"
                  class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-siage-border/50 cursor-pointer transition-colors text-left"
                  [class.bg-siage-primary/10]="secretariaGeralService.cenarioAtivo() === 'inativacao_permitida'"
                >
                  <div class="flex items-center gap-2">
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-emerald-600">toggle_on</mat-icon>
                    <span>7. Inativação permitida</span>
                  </div>
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">Permitida</span>
                </button>

                <!-- 8. Registro inativo (bloqueio de reativação) -->
                <button 
                  type="button" 
                  (click)="aplicarCenarioSecGeral('registro_inativo')"
                  class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-siage-border/50 cursor-pointer transition-colors text-left"
                  [class.bg-siage-primary/10]="secretariaGeralService.cenarioAtivo() === 'registro_inativo'"
                >
                  <div class="flex items-center gap-2">
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-slate-500">toggle_off</mat-icon>
                    <span>8. Registro inativo (bloqueio)</span>
                  </div>
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-500/10 text-siage-text-secondary font-medium">Irreversível</span>
                </button>

                <!-- 9. Edição sem Chefe Imediato -->
                <button 
                  type="button" 
                  (click)="aplicarCenarioSecGeral('edicao_sem_chefe')"
                  class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-siage-border/50 cursor-pointer transition-colors text-left"
                  [class.bg-siage-primary/10]="secretariaGeralService.cenarioAtivo() === 'edicao_sem_chefe'"
                >
                  <div class="flex items-center gap-2">
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-blue-500">person_add</mat-icon>
                    <span>9. Edição sem Chefe Imediato</span>
                  </div>
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">Editar Chefe</span>
                </button>

                <!-- 10. Edição sem Normativa de Extinção -->
                <button 
                  type="button" 
                  (click)="aplicarCenarioSecGeral('edicao_sem_normativa_extincao')"
                  class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-siage-border/50 cursor-pointer transition-colors text-left"
                  [class.bg-siage-primary/10]="secretariaGeralService.cenarioAtivo() === 'edicao_sem_normativa_extincao'"
                >
                  <div class="flex items-center gap-2">
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-indigo-500">post_add</mat-icon>
                    <span>10. Edição sem Norm. Extinção</span>
                  </div>
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium">Form Expansível</span>
                </button>

                <!-- Botão Restaurar cenário padrão -->
                <button 
                  type="button" 
                  (click)="restaurarCenarioPadraoSecGeral()"
                  class="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-siage-border cursor-pointer transition-colors"
                >
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-siage-primary">restart_alt</mat-icon>
                  <span>Restaurar cenário padrão</span>
                </button>
              </div>
            </div>
          } @else {
            <!-- MODO DEMAIS TELAS (Listagem, etc.) -->
            
            <!-- Fluxo "Em uso" e Vínculos de Uso -->
            <div class="flex flex-col gap-1.5">
              <span class="text-[10px] font-bold text-siage-text-secondary uppercase tracking-wider">Validação de "Em uso" (SEAD)</span>

              <!-- 1. Estado inicial sem ícone -->
              <button 
                type="button" 
                (click)="resetarEstadoInicialEmUso()"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-siage-border/50 cursor-pointer transition-colors text-left"
              >
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-siage-primary">restart_alt</mat-icon>
                  <span>Estado inicial (sem ícone)</span>
                </div>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-500/10 text-siage-text-secondary">Resetar</span>
              </button>

              <!-- 2. Exclusão bloqueada por uso -> ícone após fechar -->
              <button 
                type="button" 
                (click)="simularExclusaoBloqueada()"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-siage-border/50 cursor-pointer transition-colors text-left"
              >
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-amber-500">block</mat-icon>
                  <span>Simular exclusão bloqueada</span>
                </div>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">1º item</span>
              </button>

              <!-- 3. Alternar cenário de vários vínculos (rolagem) -->
              <button 
                type="button" 
                (click)="simulatorService.toggleManyLinksScenario()"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-siage-border/50 cursor-pointer transition-colors text-left"
              >
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-siage-primary">format_list_bulleted</mat-icon>
                  <span>Cenário com vários vínculos</span>
                </div>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold" [class]="simulatorService.manyLinksScenario() ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-slate-500/10 text-siage-text-secondary'">
                  {{ simulatorService.manyLinksScenario() ? '16 tabelas' : 'Padrão' }}
                </span>
              </button>

              <!-- 4. Abrir modal de vínculos (padrão vs muitos vínculos) -->
              <div class="grid grid-cols-2 gap-1.5">
                <button 
                  type="button" 
                  (click)="testarModalVinculos(false)"
                  class="px-2 py-1.5 rounded-md bg-siage-surface hover:bg-black/5 dark:hover:bg-white/5 text-siage-text-primary border border-siage-border text-[10px] font-semibold text-center cursor-pointer transition-all"
                >
                  Modal Vínculos (3)
                </button>
                <button 
                  type="button" 
                  (click)="testarModalVinculos(true)"
                  class="px-2 py-1.5 rounded-md bg-siage-surface hover:bg-black/5 dark:hover:bg-white/5 text-siage-text-primary border border-siage-border text-[10px] font-semibold text-center cursor-pointer transition-all"
                >
                  Vínculos (Rolagem)
                </button>
              </div>

              <!-- 5. Alternar vínculo (Em Uso / Livre) no 1º item da tela atual -->
              <button 
                type="button" 
                (click)="togglePrimeiroItemEmUso()"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-siage-border/50 cursor-pointer transition-colors text-left"
              >
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-siage-primary">link</mat-icon>
                  <span>Vínculo no 1º registro</span>
                </div>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold" [class]="isItem1EmUso() ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'">
                  {{ isItem1EmUso() ? 'Em uso' : 'Livre' }}
                </span>
              </button>
            </div>

            <!-- Cenários da Listagem -->
            <div class="flex flex-col gap-1.5 pt-2 border-t border-siage-border/40">
              <span class="text-[10px] font-semibold text-siage-text-secondary uppercase tracking-wider">Estados da Listagem</span>
              
              <!-- 1. Normal -->
              <button 
                type="button" 
                (click)="setScenario('normal')"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left"
                [class]="simulatorService.currentScenario() === 'normal' 
                  ? 'bg-siage-primary/10 text-siage-primary font-semibold border border-siage-primary/30' 
                  : 'text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'"
              >
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;">check_circle</mat-icon>
                  <span>1. Normal (com registros)</span>
                </div>
                @if (simulatorService.currentScenario() === 'normal') {
                  <span class="text-[10px] uppercase tracking-wider font-bold">Ativo</span>
                }
              </button>

              <!-- 2. Carregando (Skeleton) -->
              <button 
                type="button" 
                (click)="setScenario('loading')"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left"
                [class]="simulatorService.currentScenario() === 'loading' 
                  ? 'bg-siage-primary/10 text-siage-primary font-semibold border border-siage-primary/30' 
                  : 'text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'"
              >
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;">hourglass_top</mat-icon>
                  <span>2. Carregando (Skeleton)</span>
                </div>
                @if (simulatorService.currentScenario() === 'loading') {
                  <span class="text-[10px] uppercase tracking-wider font-bold">Ativo</span>
                }
              </button>

              <!-- 3. Nenhum resultado de filtro -->
              <button 
                type="button" 
                (click)="setScenario('no_filter_results')"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left"
                [class]="simulatorService.currentScenario() === 'no_filter_results' 
                  ? 'bg-siage-primary/10 text-siage-primary font-semibold border border-siage-primary/30' 
                  : 'text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'"
              >
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;">search_off</mat-icon>
                  <span>3. Sem resultado de filtro</span>
                </div>
                @if (simulatorService.currentScenario() === 'no_filter_results') {
                  <span class="text-[10px] uppercase tracking-wider font-bold">Ativo</span>
                }
              </button>

              <!-- 4. Sem registros (banco vazio) -->
              <button 
                type="button" 
                (click)="setScenario('empty')"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left"
                [class]="simulatorService.currentScenario() === 'empty' 
                  ? 'bg-siage-primary/10 text-siage-primary font-semibold border border-siage-primary/30' 
                  : 'text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'"
              >
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;">inbox</mat-icon>
                  <span>4. Sem registros (banco vazio)</span>
                </div>
                @if (simulatorService.currentScenario() === 'empty') {
                  <span class="text-[10px] uppercase tracking-wider font-bold">Ativo</span>
                }
              </button>

              <!-- 5. Erro de carregamento -->
              <button 
                type="button" 
                (click)="setScenario('error')"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left"
                [class]="simulatorService.currentScenario() === 'error' 
                  ? 'bg-siage-primary/10 text-siage-primary font-semibold border border-siage-primary/30' 
                  : 'text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'"
              >
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;">error_outline</mat-icon>
                  <span>5. Erro de carregamento</span>
                </div>
                @if (simulatorService.currentScenario() === 'error') {
                  <span class="text-[10px] uppercase tracking-wider font-bold">Ativo</span>
                }
              </button>

              <!-- 6. Acesso restrito (Sem permissão) -->
              <button 
                type="button" 
                (click)="setScenario('access_denied')"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left"
                [class]="simulatorService.currentScenario() === 'access_denied' 
                  ? 'bg-[var(--destructive)]/10 text-[var(--destructive)] font-semibold border border-[var(--destructive)]/30' 
                  : 'text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'"
              >
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;">lock</mat-icon>
                  <span>6. Acesso restrito (Sem permissão)</span>
                </div>
                @if (simulatorService.currentScenario() === 'access_denied') {
                  <span class="text-[10px] uppercase tracking-wider font-bold">Ativo</span>
                }
              </button>
            </div>

            <!-- Simulação de Usuário e Matrículas (RF Perfil) -->
            <div class="flex flex-col gap-1.5 pt-2 border-t border-siage-border/40">
              <span class="text-[10px] font-bold text-siage-text-secondary uppercase tracking-wider">Perfil & Troca de Matrícula</span>
              <div class="flex flex-col gap-1">
                <button 
                  type="button" 
                  (click)="alternarUsuario('52998224725')"
                  class="px-2 py-1.5 rounded-md border text-[10px] font-medium text-left cursor-pointer transition-all flex items-center justify-between"
                  [class]="authService.loggedInUser()?.cpf === '52998224725' 
                    ? 'bg-siage-primary/10 text-siage-primary font-semibold border-siage-primary/40' 
                    : 'bg-siage-surface hover:bg-black/5 dark:hover:bg-white/5 text-siage-text-primary border-siage-border'"
                >
                  <span>Carlos Eduardo (1 matrícula - sem troca)</span>
                  @if (authService.loggedInUser()?.cpf === '52998224725') {
                    <span class="text-[9px] uppercase font-bold text-siage-primary">Ativo</span>
                  }
                </button>
                <button 
                  type="button" 
                  (click)="alternarUsuario('10000000019')"
                  class="px-2 py-1.5 rounded-md border text-[10px] font-medium text-left cursor-pointer transition-all flex items-center justify-between"
                  [class]="authService.loggedInUser()?.cpf === '10000000019' 
                    ? 'bg-siage-primary/10 text-siage-primary font-semibold border-siage-primary/40' 
                    : 'bg-siage-surface hover:bg-black/5 dark:hover:bg-white/5 text-siage-text-primary border-siage-border'"
                >
                  <span>Ana Beatriz (2 matrículas - com troca)</span>
                  @if (authService.loggedInUser()?.cpf === '10000000019') {
                    <span class="text-[9px] uppercase font-bold text-siage-primary">Ativo</span>
                  }
                </button>
              </div>
            </div>

            <!-- Modais Universais (SIAGE Design System) -->
            <div class="flex flex-col gap-1.5 pt-2 border-t border-siage-border/40">
              <span class="text-[10px] font-bold text-siage-text-secondary uppercase tracking-wider">Testes de Modais DS</span>
              <div class="grid grid-cols-2 gap-1.5">
                <button 
                  type="button" 
                  (click)="testarModalExclusao()"
                  class="px-2 py-1.5 rounded-md bg-[var(--toast-destructive-bg)] hover:opacity-90 text-[var(--destructive)] border border-[var(--destructive)] text-[10px] font-semibold text-center cursor-pointer transition-all"
                >
                  Exclusão (Destructive)
                </button>
                <button 
                  type="button" 
                  (click)="testarModalImpossibilidade()"
                  class="px-2 py-1.5 rounded-md bg-siage-surface hover:bg-black/5 dark:hover:bg-white/5 text-siage-text-primary border border-siage-border text-[10px] font-semibold text-center cursor-pointer transition-all"
                >
                  Impossibilidade (Em uso)
                </button>
                <button 
                  type="button" 
                  (click)="testarModalAtivacao()"
                  class="px-2 py-1.5 rounded-md bg-[var(--toast-success-bg)] hover:opacity-90 text-[var(--success)] border border-[var(--success)] text-[10px] font-semibold text-center cursor-pointer transition-all"
                >
                  Ativação (Sim, ativar)
                </button>
                <button 
                  type="button" 
                  (click)="testarModalInativacao()"
                  class="px-2 py-1.5 rounded-md bg-siage-surface hover:bg-black/5 dark:hover:bg-white/5 text-siage-text-primary border border-siage-border text-[10px] font-semibold text-center cursor-pointer transition-all"
                >
                  Inativação (Sim, inativar)
                </button>
                <button 
                  type="button" 
                  (click)="testarModalCancelamento()"
                  class="col-span-2 px-2 py-1.5 rounded-md bg-siage-primary/10 hover:bg-siage-primary/20 text-siage-primary border border-siage-primary/30 text-[10px] font-semibold text-center cursor-pointer transition-all"
                >
                  Cancelamento (Sim, cancelar)
                </button>
              </div>
            </div>

            <!-- Permissões e Toasts -->
            <div class="flex flex-col gap-1.5 pt-2 border-t border-siage-border/40">
              <span class="text-[10px] font-semibold text-siage-text-secondary uppercase tracking-wider">Permissões e Toasts</span>

              <!-- Permissão de Criação (Novo Registro) -->
              <button 
                type="button" 
                (click)="simulatorService.toggleAllowCreation()"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-siage-border/50 cursor-pointer transition-colors"
              >
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="text-siage-primary">add_circle</mat-icon>
                  <span>Permissão de Criação</span>
                </div>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold" [class]="simulatorService.allowCreation() ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'">
                  {{ simulatorService.allowCreation() ? 'Permitida' : 'Revogada' }}
                </span>
              </button>

              <!-- Testes de Toast (SIAGE Design System) -->
              <div class="pt-2 border-t border-siage-border/40">
                <span class="text-[10px] uppercase font-bold text-siage-text-secondary tracking-wider block mb-1.5">Testes de Toast DS</span>
                <div class="grid grid-cols-2 gap-1.5">
                  <button 
                    type="button" 
                    (click)="dispararToast('success')"
                    class="px-2 py-1.5 rounded-md bg-[var(--toast-success-bg)] hover:opacity-90 text-[var(--success)] border border-[var(--success)] text-[10px] font-semibold text-center cursor-pointer transition-all"
                  >
                    Toast Sucesso (~4s)
                  </button>
                  <button 
                    type="button" 
                    (click)="dispararToast('info')"
                    class="px-2 py-1.5 rounded-md bg-[var(--toast-info-bg)] hover:opacity-90 text-[var(--info)] border border-[var(--info)] text-[10px] font-semibold text-center cursor-pointer transition-all"
                  >
                    Toast Info (~4s)
                  </button>
                  <button 
                    type="button" 
                    (click)="dispararToast('warning')"
                    class="px-2 py-1.5 rounded-md bg-[var(--toast-warning-bg)] hover:opacity-90 text-[var(--warning)] border border-[var(--warning)] text-[10px] font-semibold text-center cursor-pointer transition-all"
                  >
                    Toast Aviso (~4s)
                  </button>
                  <button 
                    type="button" 
                    (click)="dispararToast('error')"
                    class="px-2 py-1.5 rounded-md bg-[var(--toast-destructive-bg)] hover:opacity-90 text-[var(--destructive)] border border-[var(--destructive)] text-[10px] font-semibold text-center cursor-pointer transition-all"
                  >
                    Toast Erro (Manual)
                  </button>
                </div>

                <div class="grid grid-cols-1 gap-1.5 mt-1.5">
                  <button 
                    type="button" 
                    (click)="dispararVariosToasts()"
                    class="px-2 py-1.5 rounded-md bg-siage-surface hover:bg-black/5 dark:hover:bg-white/10 text-siage-text-primary border border-siage-border text-[10px] font-medium text-center cursor-pointer transition-all"
                  >
                    Vários Toasts Consecutivos (Max 3)
                  </button>
                  <button 
                    type="button" 
                    (click)="dispararErroGenerico()"
                    class="px-2 py-1.5 rounded-md bg-[var(--toast-destructive-bg)] hover:opacity-90 text-[var(--destructive)] border border-[var(--destructive)] text-[10px] font-semibold text-center cursor-pointer transition-all"
                  >
                    Erro Genérico de Requisição
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class SimulatorComponent {
  readonly simulatorService = inject(SimulatorService);
  readonly authService = inject(AuthSessionService);
  readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  readonly toastService = inject(ToastService);
  private readonly modalService = inject(ModalService);

  private readonly cargoService = inject(CargoComissionadoService);
  private readonly classificacaoService = inject(ClassificacaoFuncionalService);
  private readonly formaAdmissaoService = inject(FormaAdmissaoService);
  private readonly formacaoAcademicaService = inject(FormacaoAcademicaService);
  private readonly grauInstrucaoService = inject(GrauInstrucaoService);
  private readonly modalidadeEnsinoService = inject(ModalidadeEnsinoService);
  private readonly motivoSaidaService = inject(MotivoSaidaService);
  private readonly situacaoFuncionalService = inject(SituacaoFuncionalService);
  readonly secretariaGeralService = inject(SecretariaGeralService);

  readonly isOpen = signal(false);
  readonly currentUrl = signal<string>(this.router.url);

  readonly isCadastroProfessor = computed(() => {
    return this.currentUrl().includes('/professores-emergencial-militares-base-tecnica/novo');
  });

  readonly isSecretariaGeral = computed(() => {
    return this.currentUrl().includes('/configuracoes/hierarquia/secretaria-geral');
  });

  navegarPara(rota: string) {
    this.router.navigate([rota]);
  }

  setScenarioSecGeral(type: ScenarioType) {
    this.simulatorService.setScenario(type);
    if (!this.currentUrl().endsWith('/configuracoes/hierarquia/secretaria-geral')) {
      this.router.navigate(['/configuracoes/hierarquia/secretaria-geral']);
    }
  }

  aplicarCenarioSecGeral(cenario: string) {
    this.simulatorService.setScenario('normal');
    this.secretariaGeralService.aplicarCenario(cenario);

    // Navegação contextual inteligente conforme o cenário
    if (cenario === 'edicao_sem_chefe' || cenario === 'edicao_sem_normativa_extincao') {
      if (this.currentUrl().includes('/editar')) {
        this.router.navigateByUrl('/', {skipLocationChange: true}).then(() => {
          this.router.navigate(['/configuracoes/hierarquia/secretaria-geral/1/editar']);
        });
      } else {
        this.router.navigate(['/configuracoes/hierarquia/secretaria-geral/1/editar']);
      }
    } else if (cenario === 'cadastro_permitido') {
      if (!this.currentUrl().endsWith('/configuracoes/hierarquia/secretaria-geral')) {
        this.router.navigate(['/configuracoes/hierarquia/secretaria-geral']);
      }
    } else {
      if (!this.currentUrl().endsWith('/configuracoes/hierarquia/secretaria-geral')) {
        this.router.navigate(['/configuracoes/hierarquia/secretaria-geral']);
      }
    }
  }

  restaurarCenarioPadraoSecGeral() {
    this.simulatorService.setScenario('normal');
    this.secretariaGeralService.restaurarCenarioPadrao();
    if (this.currentUrl().includes('/editar')) {
      this.router.navigateByUrl('/', {skipLocationChange: true}).then(() => {
        this.router.navigate(['/configuracoes/hierarquia/secretaria-geral/1/editar']);
      });
    } else {
      this.router.navigate(['/configuracoes/hierarquia/secretaria-geral']);
    }
    this.toastService.info('Cenário padrão da Secretaria Geral restaurado.');
  }

  constructor() {
    this.router.events.subscribe(evt => {
      if (evt instanceof NavigationEnd) {
        this.currentUrl.set(evt.urlAfterRedirects || evt.url);
      }
    });
  }

  dispararAcao(tipo: string) {
    this.simulatorService.dispararAcaoCadastro(tipo);
  }

  testarClassificacaoIncompativelToast() {
    if (this.simulatorService.simularClassificacaoIncompativel()) {
      this.toastService.error(
        'Classificação Funcional não localizada',
        'Não foi localizada a Classificação Funcional correspondente ao tipo selecionado (Código SEAD: 888888).'
      );
    }
  }

  private getActiveCrudService() {
    const url = this.router.url;
    if (url.includes('classificacao-funcional')) return this.classificacaoService;
    if (url.includes('forma-de-admissao')) return this.formaAdmissaoService;
    if (url.includes('formacao-academica')) return this.formacaoAcademicaService;
    if (url.includes('grau-de-instrucao')) return this.grauInstrucaoService;
    if (url.includes('modalidade-de-ensino')) return this.modalidadeEnsinoService;
    if (url.includes('motivo-da-saida')) return this.motivoSaidaService;
    if (url.includes('situacao-funcional')) return this.situacaoFuncionalService;
    return this.cargoService;
  }

  setScenario(type: ScenarioType) {
    this.simulatorService.setScenario(type);
  }

  resetarEstadoInicialEmUso() {
    this.cargoService.resetIndicators();
    this.classificacaoService.resetIndicators();
    this.formaAdmissaoService.resetIndicators();
    this.formacaoAcademicaService.resetIndicators();
    this.grauInstrucaoService.resetIndicators();
    this.modalidadeEnsinoService.resetIndicators();
    this.motivoSaidaService.resetIndicators();
    this.situacaoFuncionalService.resetIndicators();
    this.toastService.info('Coluna "Em uso" restaurada para o estado inicial (vazia).');
  }

  private setFirstItemEmUso(emUso: boolean) {
    const url = this.router.url;
    if (url.includes('classificacao-funcional')) {
      this.classificacaoService.items.update(list => list.map((it, idx) => idx === 0 ? { ...it, emUsoOriginal: emUso, exibindoEmUsoIndicator: false } : it));
    } else if (url.includes('forma-de-admissao')) {
      this.formaAdmissaoService.items.update(list => list.map((it, idx) => idx === 0 ? { ...it, emUsoOriginal: emUso, exibindoEmUsoIndicator: false } : it));
    } else if (url.includes('formacao-academica')) {
      this.formacaoAcademicaService.items.update(list => list.map((it, idx) => idx === 0 ? { ...it, emUsoOriginal: emUso, exibindoEmUsoIndicator: false } : it));
    } else if (url.includes('grau-de-instrucao')) {
      this.grauInstrucaoService.items.update(list => list.map((it, idx) => idx === 0 ? { ...it, emUsoOriginal: emUso, exibindoEmUsoIndicator: false } : it));
    } else if (url.includes('modalidade-de-ensino')) {
      this.modalidadeEnsinoService.items.update(list => list.map((it, idx) => idx === 0 ? { ...it, emUsoOriginal: emUso, exibindoEmUsoIndicator: false } : it));
    } else if (url.includes('motivo-da-saida')) {
      this.motivoSaidaService.items.update(list => list.map((it, idx) => idx === 0 ? { ...it, emUsoOriginal: emUso, exibindoEmUsoIndicator: false } : it));
    } else if (url.includes('situacao-funcional')) {
      this.situacaoFuncionalService.items.update(list => list.map((it, idx) => idx === 0 ? { ...it, emUsoOriginal: emUso, exibindoEmUsoIndicator: false } : it));
    } else {
      this.cargoService.items.update(list => list.map((it, idx) => idx === 0 ? { ...it, emUsoOriginal: emUso, exibindoEmUsoIndicator: false } : it));
    }
  }

  simularExclusaoBloqueada() {
    const activeService = this.getActiveCrudService();
    const items = activeService.items();
    if (items.length === 0) return;

    const first = items[0];
    if (!first.emUsoOriginal) {
      this.setFirstItemEmUso(true);
    }

    const dialogRef = this.dialog.open(ResultadoDialog, {
      disableClose: true,
      data: {
        type: 'warning',
        title: 'Não foi possível excluir o registro',
        message: 'O registro não pode ser excluído, pois está em uso em outras funcionalidades do sistema.',
        buttonLabel: 'Fechar'
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      activeService.setIndicator(first.id, true);
    });
  }

  testarModalVinculos(forceMany: boolean) {
    const activeService = this.getActiveCrudService();
    const items = activeService.items();
    const firstId = items.length > 0 ? items[0].id : '1';
    const vinculos: VinculoUsoItem[] = forceMany
      ? VINCULOS_USO_MUITOS
      : activeService.getVinculos(firstId, false);

    this.dialog.open(ResultadoDialog, {
      disableClose: true,
      data: {
        type: 'info',
        title: 'Vínculos de uso',
        vinculos,
        totalTabelas: vinculos.length,
        buttonLabel: 'Fechar'
      }
    });
  }

  isItem1EmUso(): boolean {
    const activeService = this.getActiveCrudService();
    const items = activeService.items();
    return items.length > 0 ? items[0].emUsoOriginal : false;
  }

  togglePrimeiroItemEmUso() {
    const activeService = this.getActiveCrudService();
    const items = activeService.items();
    if (items.length > 0) {
      const first = items[0];
      const newStatus = !first.emUsoOriginal;
      this.setFirstItemEmUso(newStatus);
      this.toastService.info(`Registro ${first.codigo} agora está ${newStatus ? 'COM VÍNCULOS (exclusão será bloqueada)' : 'LIVRE (exclusão permitida)'}.`);
    }
  }

  testarModalExclusao() {
    const dialogRef = this.modalService.confirmarExclusao('Cargo Comissionado 10420 - ASSESSOR ESPECIAL');
    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.toastService.success('Registro excluído com sucesso.');
      }
    });
  }

  testarModalAtivacao() {
    const dialogRef = this.modalService.confirmarAtivacao('Cargo Comissionado 10420 - ASSESSOR ESPECIAL');
    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.toastService.success('Registro ativado com sucesso.');
      }
    });
  }

  testarModalInativacao() {
    const dialogRef = this.modalService.confirmarInativacao('Cargo Comissionado 10420 - ASSESSOR ESPECIAL');
    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.toastService.success('Registro inativado com sucesso.');
      }
    });
  }

  testarModalImpossibilidade() {
    this.simularExclusaoBloqueada();
  }

  testarModalCancelamento() {
    const dialogRef = this.modalService.confirmarCancelamento();
    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.toastService.info('Alterações descartadas com sucesso.');
      }
    });
  }

  dispararToast(tipo: 'success' | 'info' | 'warning' | 'error') {
    if (tipo === 'success') {
      this.toastService.success('Registro cadastrado com sucesso.');
    } else if (tipo === 'info') {
      this.toastService.info('Informação do sistema', 'Sincronização em segundo plano concluída.');
    } else if (tipo === 'warning') {
      this.toastService.warning('Atenção: pendências encontradas', 'Verifique os campos destacados antes de prosseguir.');
    } else {
      this.toastService.error('Falha ao processar operação', 'Não foi possível salvar os dados devido a uma restrição.');
    }
  }

  dispararVariosToasts() {
    this.toastService.info('1. Notificação informativa inicial');
    this.toastService.warning('2. Alerta de inconsistência de dados');
    this.toastService.success('3. Registro processado com sucesso');
    this.toastService.error('4. Falha na validação final (Mais recente)');
  }

  dispararErroGenerico() {
    this.toastService.showGenericError();
  }

  alternarUsuario(cpf: string) {
    const user = USUARIOS_TESTE.find(u => u.cpf === cpf);
    if (user) {
      this.authService.login(user, user.matriculas[0]);
      this.toastService.info(`Perfil ativo alterado para ${user.nome} (${user.matriculas.length} matrícula${user.matriculas.length > 1 ? 's' : ''}).`);
    }
  }
}

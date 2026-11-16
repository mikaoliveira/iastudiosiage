import {Component, inject, signal, ChangeDetectionStrategy} from '@angular/core';
import {Router} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {SButtonComponent, SCardComponent, SEmptyStateComponent, SIconButtonComponent, SIconComponent} from '@siage/siage-ui';
import {App} from './app';
import {AuthSessionService, MatriculaInfo} from './auth-session';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-selecionar-matricula',
  imports: [
    MatIconModule,
    SButtonComponent,
    SCardComponent,
    SEmptyStateComponent,
    SIconButtonComponent,
    SIconComponent
  ],
  template: `
    <!-- Cabeçalho Institucional -->
    <header class="h-14 sm:h-16 fixed top-0 left-0 right-0 z-50 bg-siage-surface/80 backdrop-blur-md border-b border-siage-border px-4 sm:px-6 lg:px-8 xl:px-12 flex items-center justify-between" id="app-header">
      <div class="flex items-center gap-3">
        <div class="flex items-center h-10 sm:h-11">
          <img [src]="app.isDark() ? 'logo-siage-rh-dark.png' : 'logo-siage-rh-light.png'" alt="SIAGE-RH" class="h-8 sm:h-9 w-auto" referrerpolicy="no-referrer" />
        </div>
      </div>
      
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Botão de alternar tema (unificado) -->
        <s-icon-button
          type="button"
          (click)="app.toggleTheme()"
          [icon]="app.isDark() ? 'light_mode' : 'dark_mode'"
          [label]="app.isDark() ? 'Alternar para tema claro' : 'Alternar para tema escuro'"
          id="matricula-theme-toggle-button"
        />

        <s-button type="button" variant="ghost" icon="logout" (click)="onSair()">Sair</s-button>
      </div>
    </header>

    <!-- Espaçador de topo para compensar cabeçalho fixado -->
    <div class="pt-14 sm:pt-16"></div>

    <!-- Conteúdo Principal Centralizado e Balanceado -->
    <main class="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-siage-background via-siage-background to-siage-primary/5 text-siage-text-primary px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col items-center justify-center transition-colors duration-200">
      <div class="max-w-xl w-full mx-auto flex flex-col items-center">
        
        <!-- Título e Descrição Centralizados Harmoniosos -->
        <div class="mb-6 sm:mb-8 text-center max-w-lg w-full">
          <h1 class="text-2xl sm:text-3xl lg:text-4xl font-poppins font-bold tracking-tight text-siage-text-primary mb-2">
            Selecione sua matrícula
          </h1>
          <p class="text-xs sm:text-sm md:text-base font-sans text-siage-text-secondary leading-relaxed">
            Encontramos mais de uma matrícula vinculada ao seu CPF. Escolha com qual deseja acessar o sistema.
          </p>
        </div>

        <!-- CENÁRIO 1: Falha de Comunicação / Erro de Conexão no card da listagem -->
        @if (erroConexao()) {
          <s-card class="w-full" [padding]="24" [elevation]="0">
            <s-empty-state
              variant="error"
              icon="wifi_off"
              title="Não foi possível carregar suas matrículas."
              description="Verifique sua conexão e tente novamente."
              actionLabel=""
              [headingLevel]="2"
            />
            <div class="flex flex-wrap items-center justify-center gap-3 mt-2">
              <s-button
                type="button"
                variant="secondary"
                [outlined]="true"
                icon="refresh"
                [loading]="isTentandoNovamente()"
                loadingText="Carregando..."
                [disabled]="isTentandoNovamente()"
                (click)="tentarNovamente()"
              >Tentar novamente</s-button>

              <s-button
                type="button"
                variant="ghost"
                [disabled]="isTentandoNovamente()"
                (click)="onSair()"
              >Voltar para o login</s-button>
            </div>
          </s-card>
        } @else {
          <!-- CENÁRIO 2: Lista de cards centralizados -->
          <div class="w-full flex flex-col gap-3.5 sm:gap-4">
            @for (mat of getMatriculas(); track mat.matricula) {
              <s-card class="w-full" [padding]="16" [elevation]="0">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                
                <div class="flex items-center gap-4">
                  <!-- Ícone de crachá/trabalho -->
                  <div class="w-12 h-12 rounded-xl bg-siage-primary/10 flex items-center justify-center text-siage-primary flex-shrink-0">
                    <s-icon name="badge" />
                  </div>
                  
                  <div class="flex flex-col text-left">
                    <span class="text-base sm:text-lg font-poppins font-semibold text-siage-text-primary tracking-tight">
                      {{ mat.matricula }}
                    </span>
                    <span class="text-xs sm:text-sm font-sans text-siage-text-secondary mt-0.5 font-semibold">
                      {{ mat.funcao }}
                    </span>
                    <span class="text-[11px] sm:text-xs font-sans text-siage-text-secondary/80 mt-0.5 leading-normal">
                      {{ mat.utb }}
                    </span>
                  </div>
                </div>

                <!-- Botão Acessar -->
                <div class="flex justify-end sm:flex-shrink-0 w-full sm:w-auto">
                  <s-button
                    type="button"
                    variant="primary"
                    iconRight="arrow_forward"
                    [fullWidth]="true"
                    (click)="onAcessar(mat)"
                  >Acessar</s-button>
                </div>

              </div>
              </s-card>
            } @empty {
              <!-- Fallback se não houver matrícula encontrada ou sessão expirada -->
              <s-card class="w-full" [padding]="24" [elevation]="0">
                <s-empty-state
                  variant="no-data"
                  icon="no_accounts"
                  title="Nenhuma matrícula encontrada ou sessão expirada."
                  description="Por favor, retorne ao login e faça a autenticação novamente."
                  actionLabel="Voltar para o login"
                  [headingLevel]="2"
                  (action)="onSair()"
                />
              </s-card>
            }
          </div>
        }

        <!-- Seção discreta de simulação de erro de conexão para apresentação de cliente -->
        <div class="mt-8 pt-4 border-t border-siage-border/40 w-full flex items-center justify-between text-xs text-siage-text-secondary/60">
          <span>Demonstração de Erros de Conexão (RF001):</span>
          <button 
            type="button" 
            (click)="alternarSimulacaoErro()"
            class="text-[11px] font-sans font-bold px-3 py-1.5 border border-siage-border hover:bg-siage-primary/5 hover:text-siage-primary rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
          >
            <mat-icon class="text-xs scale-75 -mt-0.5">{{ erroConexao() ? 'check_circle' : 'wifi_off' }}</mat-icon>
            <span>{{ erroConexao() ? 'Restaurar Matrículas' : 'Simular Falha de Conexão' }}</span>
          </button>
        </div>

      </div>
    </main>

    <!-- Rodapé Institucional -->
    <footer class="bg-white dark:bg-[#151D30] text-siage-text-primary border-t border-siage-border/40 px-4 sm:px-8 md:px-16 lg:px-24 py-5 sm:py-6 transition-colors duration-200" id="app-footer">
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
  `
})
export class SelecionarMatricula {
  readonly app = inject(App);
  readonly authService = inject(AuthSessionService);
  private readonly router = inject(Router);

  constructor() {
    if (this.authService.firstAccessRequired()) {
      this.router.navigate(['/primeiro-acesso']);
    }
  }

  // Estado de erro de conexão simulado ou real
  readonly erroConexao = signal(false);
  readonly isTentandoNovamente = signal(false);

  getMatriculas(): MatriculaInfo[] {
    return this.authService.loggedInUser()?.matriculas ?? [];
  }

  onAcessar(mat: MatriculaInfo) {
    const user = this.authService.loggedInUser();
    if (user) {
      this.authService.login(user, mat);
      this.router.navigate(['/inicio']);
    }
  }

  onSair() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  alternarSimulacaoErro() {
    this.erroConexao.update(v => !v);
  }

  tentarNovamente() {
    this.isTentandoNovamente.set(true);
    setTimeout(() => {
      this.isTentandoNovamente.set(false);
      this.erroConexao.set(false);
    }, 700);
  }
}



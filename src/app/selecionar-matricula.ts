import {Component, inject, signal, ChangeDetectionStrategy} from '@angular/core';
import {Router} from '@angular/router';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {App} from './app';
import {AuthSessionService, MatriculaInfo} from './auth-session';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-selecionar-matricula',
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <!-- Cabeçalho Institucional -->
    <mat-toolbar class="h-14 sm:h-16 fixed top-0 left-0 right-0 z-50 bg-siage-surface/80 backdrop-blur-md border-b border-siage-border px-4 sm:px-6 lg:px-8 xl:px-12 flex items-center justify-between" id="app-header">
      <div class="flex items-center gap-3">
        <div class="flex items-center h-10 sm:h-11">
          <img [src]="app.isDark() ? 'logo-siage-rh-dark.png' : 'logo-siage-rh-light.png'" alt="SIAGE-RH" class="h-8 sm:h-9 w-auto" referrerpolicy="no-referrer" />
        </div>
      </div>
      
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Botão de alternar tema (unificado) -->
        <button 
          type="button" 
          (click)="app.toggleTheme()" 
          class="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-siage-surface hover:bg-siage-primary/10 border border-siage-border text-siage-primary transition-all cursor-pointer shadow-xs"
          [attr.aria-label]="app.isDark() ? 'Alternar para tema claro' : 'Alternar para tema escuro'"
          [title]="app.isDark() ? 'Alternar para tema claro' : 'Alternar para tema escuro'"
          id="matricula-theme-toggle-button"
        >
          <mat-icon class="text-base sm:text-lg">
            {{ app.isDark() ? 'light_mode' : 'dark_mode' }}
          </mat-icon>
        </button>

        <button (click)="onSair()" class="font-sans font-semibold text-xs sm:text-sm text-siage-text-primary hover:text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer">
          <mat-icon class="text-base">logout</mat-icon>
          <span>Sair</span>
        </button>
      </div>
    </mat-toolbar>

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
          <div class="w-full p-8 bg-siage-surface border border-siage-border rounded-xl text-center flex flex-col items-center gap-4 transition-all">
            <mat-icon class="text-siage-text-secondary text-4xl">wifi_off</mat-icon>
            <div class="text-center">
              <p class="font-sans font-medium text-siage-text-primary text-base">Não foi possível carregar suas matrículas.</p>
              <p class="font-sans text-xs text-siage-text-secondary mt-1">Verifique sua conexão e tente novamente.</p>
            </div>
            <div class="flex items-center justify-center gap-3 mt-2">
              <button 
                mat-stroked-button 
                type="button"
                (click)="tentarNovamente()" 
                [disabled]="isTentandoNovamente()"
                class="font-sans font-semibold border border-siage-border text-siage-text-primary px-4 py-2 rounded-lg cursor-pointer hover:bg-siage-primary/5 transition-all"
              >
                <span class="inline-flex items-center justify-center gap-2 leading-none">
                  @if (isTentandoNovamente()) {
                    <svg class="animate-spin h-4 w-4 text-siage-primary shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Carregando...</span>
                  } @else {
                    <mat-icon style="font-size: 18px; width: 18px; height: 18px;" class="shrink-0 flex items-center justify-center leading-none">refresh</mat-icon>
                    <span>Tentar novamente</span>
                  }
                </span>
              </button>

              <button 
                mat-button 
                type="button"
                (click)="onSair()" 
                [disabled]="isTentandoNovamente()"
                class="font-sans font-medium text-siage-text-secondary hover:text-siage-text-primary px-3 py-2 rounded-lg cursor-pointer transition-colors"
              >
                <span class="inline-flex items-center justify-center leading-none">Voltar para o login</span>
              </button>
            </div>
          </div>
        } @else {
          <!-- CENÁRIO 2: Lista de cards centralizados -->
          <div class="w-full flex flex-col gap-3.5 sm:gap-4">
            @for (mat of getMatriculas(); track mat.matricula) {
              <div class="bg-siage-surface border border-siage-border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:shadow-md hover:border-siage-primary/40 hover:bg-siage-primary/[0.01] transition-all duration-200">
                
                <div class="flex items-center gap-4">
                  <!-- Ícone de crachá/trabalho -->
                  <div class="w-12 h-12 rounded-xl bg-siage-primary/10 flex items-center justify-center text-siage-primary flex-shrink-0">
                    <mat-icon>badge</mat-icon>
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
                  <button 
                    mat-flat-button
                    (click)="onAcessar(mat)"
                    class="w-full sm:w-auto bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-bold px-5 sm:px-6 py-2.5 rounded-xl transition-all shadow-sm hover:shadow active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer text-xs sm:text-sm"
                  >
                    <span>Acessar</span>
                    <mat-icon class="text-sm">arrow_forward</mat-icon>
                  </button>
                </div>

              </div>
            } @empty {
              <!-- Fallback se não houver matrícula encontrada ou sessão expirada -->
              <div class="w-full p-8 bg-siage-surface border border-siage-border rounded-xl text-center flex flex-col items-center gap-4">
                <mat-icon class="text-siage-text-secondary text-4xl">no_accounts</mat-icon>
                <div class="text-center">
                  <p class="font-sans font-medium text-siage-text-primary text-base">Nenhuma matrícula encontrada ou sessão expirada.</p>
                  <p class="font-sans text-xs text-siage-text-secondary mt-1">Por favor, retorne ao login e faça a autenticação novamente.</p>
                </div>
                <button 
                  mat-stroked-button 
                  (click)="onSair()" 
                  class="mt-2 font-sans font-bold border border-siage-border text-siage-text-primary px-4 py-2 rounded-lg cursor-pointer hover:bg-siage-primary/5"
                >
                  Voltar para o login
                </button>
              </div>
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



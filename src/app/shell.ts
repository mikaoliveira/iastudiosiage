import {Component, inject, signal, computed, viewChild, ChangeDetectionStrategy, OnInit, OnDestroy, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {RouterOutlet, Router, NavigationEnd} from '@angular/router';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {SIconButtonComponent, SMenuComponent, SMenuItemComponent, SMenuSeparatorComponent, SSidebarComponent} from '@siage/siage-ui';
import {Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';
import {App} from './app';
import {AuthSessionService} from './auth-session';
import {ToastService} from './toast';
import {SimulatorComponent} from './simulator';

export interface GlobalModuleItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  exact?: boolean;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatIconModule,
    SIconButtonComponent,
    SMenuComponent,
    SMenuItemComponent,
    SMenuSeparatorComponent,
    SSidebarComponent,
    SimulatorComponent
  ],
  template: `
    <div class="h-screen w-screen flex flex-col overflow-hidden bg-siage-background text-siage-text-primary transition-colors duration-200">
      
      <!-- Barra Superior (mat-toolbar 56px-64px) -->
      <mat-toolbar class="h-14 sm:h-16 flex-shrink-0 flex items-center justify-between border-b border-siage-border bg-siage-surface px-3 sm:px-4 z-40" id="shell-header">
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Toggle do menu lateral (Botão Hambúrguer) -->
          <s-icon-button
            [icon]="isMobile() && isMobileDrawerOpen() ? 'close' : 'menu'"
            [label]="isMobile() ? (isMobileDrawerOpen() ? 'Fechar menu' : 'Abrir menu') : (isSidebarExpanded() ? 'Recolher menu' : 'Expandir menu')"
            (click)="toggleHamburger()"
          />
          
          <!-- Logo SIAGE-RH -->
          <div class="flex items-center gap-2 h-7 sm:h-8">
            <img [src]="app.isDark() ? 'logo-siage-rh-dark.png' : 'logo-siage-rh-light.png'" alt="SIAGE-RH" class="h-6 sm:h-7 w-auto" referrerpolicy="no-referrer" />
          </div>
        </div>
        
        <!-- Ações do Lado Direito da Barra Superior: Busca global -> Tema -> Perfil -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- 1. Busca global -->
          <s-icon-button
            icon="search"
            label="Busca global de funcionalidades"
            class="rounded-full"
            [class.bg-siage-primary/15]="isBuscaGlobalAtiva()"
            [iconFilled]="isBuscaGlobalAtiva()"
            [attr.aria-current]="isBuscaGlobalAtiva() ? 'page' : null"
            (click)="irParaBuscaGlobal()"
            id="shell-search-button"
          />

          <!-- 2. Tema -->
          <s-icon-button
            [icon]="app.isDark() ? 'light_mode' : 'dark_mode'"
            [label]="app.isDark() ? 'Alternar para tema claro' : 'Alternar para tema escuro'"
            (click)="app.toggleTheme()"
            id="shell-theme-toggle-button"
          />

          <!-- 3. Perfil do Usuário com Popover/Dropdown -->
          <div class="relative" id="profile-dropdown-wrapper">
            <!-- Botão com avatar e iniciais do usuário -->
            <button 
              type="button"
              (click)="profile.openFromEvent($event)"
              class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-siage-primary/10 hover:bg-siage-primary/20 border border-siage-primary/30 flex items-center justify-center text-siage-primary font-bold text-xs sm:text-sm font-sans shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40 select-none"
              [attr.aria-expanded]="profile.ariaExpanded()"
              aria-haspopup="true"
              aria-label="Menu de perfil do usuário"
              title="Perfil do usuário"
              id="shell-profile-button"
            >
              {{ authService.getCurrentUserInitials() }}
            </button>

            <s-menu #profile label="Menu de perfil do usuário">
                <div class="w-72 flex flex-col gap-0.5 px-4 py-2">
                  <span class="text-sm font-poppins font-bold text-siage-text-primary leading-tight truncate">
                    {{ authService.getCurrentUserName() }}
                  </span>
                  <span class="text-xs font-sans font-medium text-siage-primary leading-tight">
                    {{ authService.getCurrentUserRole() }}
                  </span>
                  <span class="text-xs font-sans text-siage-text-secondary leading-tight mt-0.5">
                    Matrícula: {{ authService.getCurrentMatriculaNumber() }}
                  </span>
                </div>

                <!-- Ação Trocar matrícula (exibida exclusivamente quando possuir mais de uma matrícula) -->
                @if (authService.canSwitchMatricula()) {
                  <s-menu-separator />
                  <s-menu-item icon="swap_horiz" (triggered)="onTrocarMatricula()">Trocar matrícula</s-menu-item>
                }

                <s-menu-separator />
                <s-menu-item icon="logout" destructive (triggered)="logout()">Sair</s-menu-item>
            </s-menu>
          </div>
        </div>
      </mat-toolbar>

      <!-- Área Principal com Menu Lateral Padrão Ponto Digital -->
      <div class="flex-1 flex overflow-hidden relative">
        
        <!-- ========================================================
             1. MENU LATERAL DESKTOP E TABLET (md+)
             Padrão do Ponto Digital: menu lateral com módulos navegáveis,
             sem painel contextual flutuante ou drawers duplicados.
             ======================================================== -->
        @if (!isMobile()) {
        <s-sidebar
          class="h-full shrink-0 z-20"
          [items]="moduleItems"
          [activeId]="activeModuleId()"
          [collapsed]="!isSidebarExpanded()"
          [showToggle]="false"
          [breakpoint]="767"
          label="Menu principal dos módulos"
          (select)="onModuleSelectById($event)"
        >
          <div footer class="pt-2 px-2 border-t border-siage-border/40 flex flex-col items-center">
            @if (!isSidebarExpanded()) {
              <div class="h-9 w-9 flex items-center justify-center opacity-70">
                <img src="/logo-reduzido.svg" alt="SIAGE" class="w-6 h-6 object-contain" referrerpolicy="no-referrer" />
              </div>
            } @else {
              <div class="w-full flex items-center justify-between px-2 py-1 text-[11px] text-siage-text-secondary">
                <span class="font-mono">v2.0</span>
                <span class="font-sans font-medium">SIAGE-RH</span>
              </div>
            }
          </div>
        </s-sidebar>
        }

        <!-- ========================================================
             2. DRAWER MOBILE (< 768px)
             ======================================================== -->
        @if (isMobile() && isMobileDrawerOpen()) {
          <!-- Backdrop escuro com desfoque -->
          <div 
            (click)="closeMobileDrawer()" 
            class="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs transition-opacity duration-200"
            aria-hidden="true"
          ></div>

          <!-- Drawer Mobile -->
          <aside 
            class="fixed top-0 bottom-0 left-0 z-50 w-[80vw] max-w-[300px] bg-siage-surface shadow-2xl flex flex-col h-full select-none overflow-hidden border-r border-siage-border transition-all duration-200"
            aria-label="Menu de navegação móvel"
          >
            <!-- Cabeçalho Mobile -->
            <div class="h-14 flex items-center justify-between px-4 border-b border-siage-border bg-siage-surface shrink-0">
              <div class="flex items-center gap-2">
                <img [src]="app.isDark() ? 'logo-siage-rh-dark.png' : 'logo-siage-rh-light.png'" alt="SIAGE-RH" class="h-6 w-auto" referrerpolicy="no-referrer" />
                <span class="text-sm font-poppins font-bold text-siage-text-primary">Módulos</span>
              </div>
              
              <s-icon-button
                icon="close"
                label="Fechar menu"
                (click)="closeMobileDrawer()" 
              />
            </div>

            <!-- Lista de Módulos Globais Mobile -->
            <div class="flex-1 min-h-0 overflow-y-auto">
              <s-sidebar
                style="width: 100%; height: 100%"
                [items]="moduleItems"
                [activeId]="activeModuleId()"
                [collapsed]="false"
                [showToggle]="false"
                [breakpoint]="0"
                label="Menu de navegação móvel"
                (select)="onModuleSelectById($event)"
              />
            </div>

            <!-- Rodapé Mobile -->
            <div class="p-3 border-t border-siage-border bg-siage-surface shrink-0 text-center text-xs text-siage-text-secondary">
              SIAGE-RH v2.0
            </div>
          </aside>
        }

        <!-- ========================================================
             3. ÁREA DE CONTEÚDO PRINCIPAL (ROUTER-OUTLET)
             ======================================================== -->
        <main class="flex-1 h-full overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-6 bg-siage-background transition-colors duration-200">
          <div [class]="isWideCrudPage() ? 'max-w-[1600px] mx-auto w-full transition-all' : 'max-w-7xl mx-auto w-full transition-all'">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>

      <!-- Simulador de Cenários -->
      <app-simulator></app-simulator>
    </div>
  `
})
export class ShellComponent implements OnInit, OnDestroy {
  readonly app = inject(App);
  private readonly router = inject(Router);
  readonly authService = inject(AuthSessionService);
  private readonly toastService = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);

  private routerSub?: Subscription;

  // Detecção de tamanho de tela
  readonly isMobile = signal<boolean>(false);
  readonly isTablet = signal<boolean>(false);

  // Controle do menu lateral Desktop/Tablet (Padrão Ponto Digital: expandido ou compacto)
  readonly isSidebarExpanded = signal<boolean>(true);

  // Controle do drawer no Mobile
  readonly isMobileDrawerOpen = signal<boolean>(false);

  private readonly profileMenu = viewChild(SMenuComponent);

  // Rota atual monitorada
  readonly currentUrl = signal<string>(this.router.url);
  readonly isWideCrudPage = computed(() => 
    this.currentUrl().includes('/professores-emergencial-militares-base-tecnica')
  );

  constructor() {
    if (this.authService.firstAccessRequired()) {
      this.router.navigate(['/primeiro-acesso']);
    }
    if (this.router.url.startsWith('/configuracoes')) {
      this.activeModuleId.set('configuracoes');
    } else if (this.router.url.startsWith('/profissionais')) {
      this.activeModuleId.set('profissionais');
    } else if (this.router.url.startsWith('/inicio')) {
      this.activeModuleId.set('inicio');
    } else if (this.router.url.startsWith('/busca-global') || this.router.url.startsWith('/busca')) {
      this.activeModuleId.set('');
    }
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.updateScreenSize();
      window.addEventListener('resize', this.onWindowResize);
    }

    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const newUrl = event.urlAfterRedirects || event.url;
        this.currentUrl.set(newUrl);
        if (newUrl.startsWith('/configuracoes')) {
          this.activeModuleId.set('configuracoes');
        } else if (newUrl.startsWith('/profissionais')) {
          this.activeModuleId.set('profissionais');
        } else if (newUrl.startsWith('/inicio')) {
          this.activeModuleId.set('inicio');
        } else if (newUrl.startsWith('/busca-global') || newUrl.startsWith('/busca')) {
          this.activeModuleId.set('');
        }
        // Fecha drawer mobile e menu de perfil ao navegar
        this.isMobileDrawerOpen.set(false);
        this.closeProfileMenu();
      });
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.onWindowResize);
    }
    this.routerSub?.unsubscribe();
  }

  private readonly onWindowResize = () => {
    this.updateScreenSize();
  };

  private updateScreenSize() {
    const width = window.innerWidth;
    const wasMobile = this.isMobile();
    const isNowMobile = width < 768;
    this.isMobile.set(isNowMobile);
    this.isTablet.set(width >= 768 && width <= 1024);

    if (width >= 768 && width <= 1024) {
      // Em tablet, padrão compacto
      this.isSidebarExpanded.set(false);
    } else if (width > 1024 && wasMobile) {
      this.isSidebarExpanded.set(true);
    }
  }

  toggleHamburger() {
    if (this.isMobile()) {
      this.isMobileDrawerOpen.set(!this.isMobileDrawerOpen());
    } else {
      this.isSidebarExpanded.set(!this.isSidebarExpanded());
    }
  }

  closeMobileDrawer() {
    this.isMobileDrawerOpen.set(false);
  }

  // ==========================================
  // Lista de Módulos Globais (Menu Lateral Ponto Digital)
  // Preserva todos os módulos existentes do RH V2
  // ==========================================
  readonly moduleItems: GlobalModuleItem[] = [
    { id: 'inicio', label: 'Início', icon: 'home', path: '/inicio', exact: true },
    { id: 'configuracoes', label: 'Configurações', icon: 'settings', path: '/configuracoes' },
    { id: 'avaliacao', label: 'Avaliação de Desempenho', icon: 'bar_chart' },
    { id: 'profissionais', label: 'Profissionais', icon: 'group', path: '/profissionais' },
    { id: 'quadro', label: 'Quadro Funcional', icon: 'assignment' },
    { id: 'afastamentos', label: 'Afastamentos', icon: 'event_busy' },
    { id: 'ficha_financeira', label: 'Ficha Financeira', icon: 'request_quote' },
    { id: 'meus_dados', label: 'Meus Dados', icon: 'person' }
  ];

  readonly activeModuleId = signal<string>('configuracoes');

  isModuleSelected(item: GlobalModuleItem): boolean {
    return this.activeModuleId() === item.id;
  }

  onModuleSelectById(id: string) {
    const item = this.moduleItems.find(module => module.id === id);
    if (item) this.onModuleSelect(item);
  }

  onModuleSelect(item: GlobalModuleItem) {
    this.closeMobileDrawer();
    this.activeModuleId.set(item.id);

    if (item.id === 'inicio') {
      this.router.navigate(['/inicio']);
    } else if (item.id === 'configuracoes') {
      this.router.navigate(['/configuracoes']);
    } else if (item.id === 'profissionais') {
      this.router.navigate(['/profissionais']);
    } else {
      this.toastService.info(`Módulo ${item.label} em desenvolvimento.`);
    }
  }

  closeProfileMenu() {
    this.profileMenu()?.close();
  }

  irParaBuscaGlobal() {
    this.closeProfileMenu();
    this.activeModuleId.set('');
    this.router.navigate(['/busca-global']);
  }

  isBuscaGlobalAtiva(): boolean {
    const url = this.currentUrl();
    return url.startsWith('/busca-global') || url.startsWith('/busca');
  }

  onTrocarMatricula() {
    if (this.authService.canSwitchMatricula()) {
      this.closeProfileMenu();
      this.router.navigate(['/selecionar-matricula']);
    } else {
      this.toastService.info('O usuário atual possui apenas uma matrícula vinculada.');
    }
  }

  logout() {
    this.closeProfileMenu();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

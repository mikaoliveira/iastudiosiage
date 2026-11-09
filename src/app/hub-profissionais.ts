import {Component, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import {Router} from '@angular/router';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {CommonModule} from '@angular/common';
import {PermissionService} from './permission';
import {AcessoRestritoComponent} from './acesso-restrito';
import {SimulatorService} from './simulator';

export interface ProfissionalCardItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hub-profissionais',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    AcessoRestritoComponent
  ],
  template: `
    @if (!hasAccess()) {
      <app-acesso-restrito backUrl="/inicio" />
    } @else {
      <div class="flex flex-col gap-6 font-sans pb-10">
        
        <!-- Breadcrumbs: Início / Profissionais -->
        <nav aria-label="Breadcrumb" class="flex items-center gap-2 text-xs font-sans font-medium tracking-wide text-siage-text-secondary/70">
          <span 
            (click)="goHome()" 
            (keydown.enter)="goHome()" 
            tabindex="0" 
            role="button"
            class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline"
          >
            Início
          </span>
          <span class="text-[10px] text-siage-text-secondary/40 select-none" aria-hidden="true">/</span>
          <span class="text-siage-primary font-semibold" aria-current="page">Profissionais</span>
        </nav>

        <!-- Título e Descrição da página -->
        <div>
          <h1 class="text-2xl sm:text-3xl font-poppins font-bold tracking-tight text-siage-text-primary">Profissionais</h1>
          <p class="text-sm text-siage-text-secondary mt-1 max-w-2xl">
            Gerencie os dados, vínculos e cargas de profissionais da Educação estadual.
          </p>
        </div>

        <!-- Filtro de Busca -->
        <div class="w-full form-field-group max-w-xl">
          <label for="hub-profissionais-search" class="form-label">Buscar funcionalidade</label>
          <mat-form-field appearance="outline" class="w-full font-sans" subscriptSizing="fixed">
            <mat-icon matPrefix class="text-siage-text-secondary mr-2">search</mat-icon>
            <input 
              matInput 
              placeholder="Digite o nome da funcionalidade (ex.: importação, profissionais)"
              [formControl]="controle"
              id="hub-profissionais-search"
            />
            @if (controle.value) {
              <button type="button" (click)="onLimpar()" class="text-siage-text-secondary hover:text-siage-text-primary p-1 cursor-pointer" aria-label="Limpar busca">
                <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
              </button>
            }
          </mat-form-field>
        </div>

        <!-- Estados da Visualização -->
        @if (isCarregando()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 min-[1600px]:grid-cols-3 gap-5" aria-busy="true" aria-label="Carregando opções">
            @for (i of [1]; track i) {
              <div class="h-56 p-5 bg-siage-surface border border-siage-border rounded-xl shadow-xs animate-pulse flex flex-col justify-between">
                <div class="flex flex-col gap-3">
                  <div class="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700/60"></div>
                  <div class="h-5 w-40 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                  <div class="h-3 w-5/6 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
                  <div class="h-3 w-2/3 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
                </div>
                <div class="pt-3 border-t border-siage-border/40 flex justify-between items-center">
                  <div class="h-4 w-20 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                  <div class="h-4 w-4 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                </div>
              </div>
            }
          </div>
        } @else if (isErro()) {
          <div class="py-14 px-6 bg-siage-surface border border-siage-border rounded-xl flex flex-col items-center justify-center text-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-siage-destructive/10 text-siage-destructive flex items-center justify-center">
              <mat-icon style="font-size: 24px; width: 24px; height: 24px;">error_outline</mat-icon>
            </div>
            <div class="flex flex-col gap-1 max-w-md">
              <h3 class="text-base font-poppins font-semibold text-siage-text-primary">Não foi possível carregar os dados</h3>
              <p class="text-xs sm:text-sm text-siage-text-secondary">
                Verifique sua conexão e tente novamente.
              </p>
            </div>
            <button 
              type="button" 
              (click)="carregarDados()" 
              class="mt-2 inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
            >
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">refresh</mat-icon>
              <span>Tentar novamente</span>
            </button>
          </div>
        } @else if (isSemResultadoFiltro()) {
          <div class="py-16 px-6 bg-siage-surface border border-siage-border rounded-xl flex flex-col items-center justify-center text-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-siage-text-secondary/10 text-siage-text-secondary flex items-center justify-center">
              <mat-icon style="font-size: 24px; width: 24px; height: 24px;">search_off</mat-icon>
            </div>
            <div class="flex flex-col gap-1 max-w-md">
              <h3 class="text-base font-poppins font-semibold text-siage-text-primary">Nenhum resultado encontrado</h3>
              <p class="text-xs sm:text-sm text-siage-text-secondary">
                Nenhuma funcionalidade corresponde aos termos pesquisados.
              </p>
            </div>
          </div>
        } @else {
          <!-- GRID DE CARDS (Seguindo exatamente o padrão dos cards de Configurações) -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 min-[1600px]:grid-cols-3 gap-5">
            @for (item of filteredItems(); track item.id) {
              <div 
                (click)="onItemClick(item)"
                (keydown.enter)="onItemClick(item)"
                tabindex="0"
                role="button"
                [attr.aria-label]="'Acessar ' + item.title"
                class="group bg-siage-surface border border-siage-border hover:border-siage-primary/40 hover:shadow-md active:scale-[0.99] rounded-xl cursor-pointer transition-all duration-200 p-5 flex flex-col justify-between h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/30"
              >
                <!-- Topo do Card: Ícone, Título e Descrição curta -->
                <div class="flex flex-col gap-3">
                  <!-- Ícone destacado -->
                  <div class="w-12 h-12 rounded-xl bg-siage-primary/10 text-siage-primary flex items-center justify-center shrink-0 group-hover:bg-siage-primary/15 group-hover:scale-105 transition-all duration-200">
                    <mat-icon style="font-size: 24px; width: 24px; height: 24px;">{{ item.icon }}</mat-icon>
                  </div>

                  <!-- Título -->
                  <h3 class="text-base font-poppins font-semibold text-siage-text-primary tracking-tight leading-snug group-hover:text-siage-primary transition-colors">
                    {{ item.title }}
                  </h3>

                  <!-- Descrição curta -->
                  <p class="text-xs sm:text-sm text-siage-text-secondary leading-relaxed line-clamp-3">
                    {{ item.description }}
                  </p>
                </div>

                <!-- Rodapé do Card: Botão “Acessar →” alinhado -->
                <div class="mt-5 pt-3.5 border-t border-siage-border/50 flex items-center justify-between">
                  <button 
                    type="button" 
                    (click)="onItemClick(item); $event.stopPropagation()"
                    class="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-siage-primary group-hover:text-siage-primary/80 transition-colors cursor-pointer"
                  >
                    <span>Acessar</span>
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;" class="group-hover:translate-x-1 transition-transform duration-150">arrow_forward</mat-icon>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    }
  `
})
export class HubProfissionais {
  private readonly router = inject(Router);
  readonly permissionService = inject(PermissionService);
  readonly simulator = inject(SimulatorService);

  readonly hasAccess = computed(() => this.permissionService.hasAccess());

  readonly controle = new FormControl('');
  readonly termo = signal('');

  readonly isLoading = signal(false);
  readonly hasError = signal(false);

  // Inicialmente exibimos exclusivamente o card "Importação de Profissionais" conforme a instrução
  readonly items = signal<ProfissionalCardItem[]>([
    {
      id: 'importacao_profissionais',
      title: 'Importação de Profissionais',
      description: 'Consulte, acompanhe e realize importações em lote de dados de profissionais.',
      icon: 'upload_file',
      route: '/profissionais/importacao'
    }
  ]);

  readonly isCarregando = computed(() => {
    return this.isLoading() || this.simulator.currentScenario() === 'loading';
  });

  readonly isErro = computed(() => {
    return this.hasError() || this.simulator.currentScenario() === 'error';
  });

  readonly isSemResultadoFiltro = computed(() => {
    return this.filteredItems().length === 0;
  });

  readonly filteredItems = computed(() => {
    const query = this.termo().toLowerCase().trim();
    if (!query) return this.items();
    return this.items().filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.description.toLowerCase().includes(query)
    );
  });

  constructor() {
    this.controle.valueChanges.subscribe(val => {
      this.termo.set(val || '');
    });
  }

  onLimpar() {
    this.controle.setValue('');
  }

  carregarDados() {
    this.simulator.reset();
    this.isLoading.set(true);
    this.hasError.set(false);
    setTimeout(() => {
      this.isLoading.set(false);
    }, 400);
  }

  onItemClick(item: ProfissionalCardItem) {
    this.router.navigate([item.route]);
  }

  goHome() {
    this.router.navigate(['/inicio']);
  }
}

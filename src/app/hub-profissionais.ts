import {Component, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import {Router} from '@angular/router';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {SButtonComponent, SCardComponent, SIconComponent, SPageHeaderComponent} from '@siage/siage-ui';
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
    SButtonComponent,
    SCardComponent,
    SIconComponent,
    SPageHeaderComponent,
    AcessoRestritoComponent
  ],
  styles: [`
    .profissional-card:hover s-card {
      border-color: color-mix(in srgb, var(--siage-primary) 40%, transparent);
    }
  `],
  template: `
    @if (!hasAccess()) {
      <app-acesso-restrito backUrl="/inicio" />
    } @else {
      <div class="flex flex-col gap-6 font-sans pb-10">
        
        <s-page-header
          [breadcrumbs]="breadcrumbs"
          title="Profissionais"
          description="Gerencie os dados, vínculos e cargas de profissionais da Educação estadual."
        />

        <!-- Filtro de Busca -->
        <div class="w-full form-field-group max-w-xl">
          <label for="hub-profissionais-search" class="form-label">Buscar funcionalidade</label>
          <mat-form-field appearance="outline" class="w-full font-sans" subscriptSizing="fixed">
            <span matPrefix class="flex items-center pl-4 pr-3 text-siage-text-secondary">
              <s-icon name="search" size="sm" />
            </span>
            <input 
              matInput 
              placeholder="Digite o nome da funcionalidade (ex.: importação, profissionais)"
              [formControl]="controle"
              id="hub-profissionais-search"
            />
            @if (controle.value) {
              <button matIconSuffix type="button" (click)="onLimpar()" class="text-siage-text-secondary hover:text-siage-text-primary p-1 cursor-pointer" aria-label="Limpar busca">
                <s-icon name="close" size="xs" />
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
              <s-icon name="error_outline" size="md" />
            </div>
            <div class="flex flex-col gap-1 max-w-md">
              <h3 class="text-base font-poppins font-semibold text-siage-text-primary">Não foi possível carregar os dados</h3>
              <p class="text-xs sm:text-sm text-siage-text-secondary">
                Verifique sua conexão e tente novamente.
              </p>
            </div>
            <s-button class="mt-2" variant="primary" icon="refresh" (click)="carregarDados()">Tentar novamente</s-button>
          </div>
        } @else if (isSemResultadoFiltro()) {
          <div class="py-16 px-6 bg-siage-surface border border-siage-border rounded-xl flex flex-col items-center justify-center text-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-siage-text-secondary/10 text-siage-text-secondary flex items-center justify-center">
              <s-icon name="search_off" size="md" />
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
                class="profissional-card group hover:shadow-md active:scale-[0.99] rounded-xl cursor-pointer transition-all duration-200 h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/30"
              >
                <s-card [padding]="0" [elevation]="0" class="h-full transition-colors duration-200">
                  <div class="p-5 flex flex-col justify-between h-full">
                    <!-- Topo do Card: Ícone, Título e Descrição curta -->
                    <div class="flex flex-col gap-3">
                      <!-- Ícone destacado -->
                      <div class="w-12 h-12 rounded-xl bg-siage-primary/10 text-siage-primary flex items-center justify-center shrink-0 group-hover:bg-siage-primary/15 group-hover:scale-105 transition-all duration-200">
                        <s-icon [name]="item.icon" size="md" />
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
                        <s-icon name="arrow_forward" size="xs" class="group-hover:translate-x-1 transition-transform duration-150" />
                      </button>
                    </div>
                  </div>
                </s-card>
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
  readonly breadcrumbs = [
    {label: 'Início', routerLink: '/inicio'},
    {label: 'Profissionais'}
  ];

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

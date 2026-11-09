import {Component, inject, ChangeDetectionStrategy} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {Router} from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inicio-em-construcao',
  imports: [
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 gap-6">
      <!-- Ilustração/Ícone centralizado elegante -->
      <div class="relative flex items-center justify-center w-24 h-24 rounded-2xl bg-siage-primary/5 border border-siage-border shadow-inner">
        <mat-icon class="text-siage-primary text-5xl w-12 h-12 flex items-center justify-center animate-pulse">construction</mat-icon>
        <span class="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-siage-primary opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-siage-primary"></span>
        </span>
      </div>

      <!-- Título & Descrição -->
      <div class="max-w-md">
        <h1 class="text-3xl font-poppins font-bold tracking-tight text-siage-text-primary">
          Página em Construção
        </h1>
        <p class="text-sm text-siage-text-secondary mt-2 leading-relaxed">
          Estamos preparando a dashboard inicial com todos os indicadores do SIAGE-RH. 
          Enquanto isso, você pode acessar e gerenciar o cadastro de tabelas de referência no módulo de Configurações.
        </p>
      </div>

      <!-- Ações Rápidas -->
      <div class="flex flex-col sm:flex-row gap-3 mt-4">
        <button 
          matButton="filled" 
          (click)="irParaConfiguracoes()" 
          class="font-sans px-6"
        >
          Ir para Configurações
        </button>
      </div>
    </div>
  `
})
export class InicioComponent {
  private readonly router = inject(Router);

  irParaConfiguracoes() {
    this.router.navigate(['/configuracoes']);
  }
}

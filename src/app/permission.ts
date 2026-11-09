import {Injectable, inject, computed, signal} from '@angular/core';
import {CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {SimulatorService} from './simulator';

/**
 * Serviço Global de Controle de Permissões do SIAGE-RH.
 * 
 * Reutilizável por todos os módulos do sistema.
 * Integrado às rotas, guards, carregamento de componentes e requisição de dados.
 * 
 * Nota arquitetural:
 * O controle de acesso definitivo será atrelado ao perfil (ex.: Administrador ou Servidor)
 * e ao módulo de permissionamento na etapa correspondente.
 * No momento, este serviço responde diretamente aos cenários do Simulador sem fixar perfis.
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly simulator = inject(SimulatorService);

  // Guarda a última URL protegida bloqueada para restaurar a navegação ao sair do cenário simulado
  readonly lastBlockedUrl = signal<string | null>(null);

  // Status de acesso geral à funcionalidade protegida
  readonly hasAccess = computed(() => {
    return this.simulator.currentScenario() !== 'access_denied';
  });

  // Permissão de criação de novos registros (ex.: exibir ação no banco vazio e botão Adicionar)
  readonly canCreate = computed(() => {
    return this.hasAccess() && this.simulator.allowCreation();
  });

  canAccess(): boolean {
    return this.hasAccess();
  }

  /**
   * Valida se o carregamento de dados protegidos pode ser iniciado.
   * Impede que usuários sem permissão disparem requisições de dados do CRUD.
   */
  canLoadProtectedData(): boolean {
    return this.hasAccess();
  }

  setBlockedUrl(url: string) {
    if (url && !url.startsWith('/acesso-restrito') && !url.startsWith('/login')) {
      this.lastBlockedUrl.set(url);
    }
  }
}

/**
 * Guard global de rota para controle de permissão de acesso à funcionalidade.
 * Impede o carregamento da rota/CRUD caso o usuário não possua permissão.
 */
export const permissionGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const permService = inject(PermissionService);
  if (!permService.hasAccess()) {
    permService.setBlockedUrl(state.url);
    const router = inject(Router);
    return router.createUrlTree(['/acesso-restrito']);
  }
  return true;
};

/**
 * Guard global de rota para rotas de criação (/novo).
 * Bloqueia acesso tanto quando não há permissão geral quanto quando não há permissão de criação.
 */
export const createPermissionGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const permService = inject(PermissionService);
  if (!permService.hasAccess() || !permService.canCreate()) {
    permService.setBlockedUrl(state.url);
    const router = inject(Router);
    return router.createUrlTree(['/acesso-restrito']);
  }
  return true;
};


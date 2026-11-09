import {RenderMode, ServerRoute} from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'configuracoes/sead/cargo/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'configuracoes/sead/cargo/:id/editar',
    renderMode: RenderMode.Server,
  },
  {
    path: 'configuracoes/sead/funcao/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'configuracoes/sead/funcao/:id/editar',
    renderMode: RenderMode.Server,
  },
  {
    path: 'configuracoes/sead/cargo-comissionado/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'configuracoes/sead/cargo-comissionado/:id/editar',
    renderMode: RenderMode.Server,
  },
  {
    path: 'configuracoes/sead/classificacao-funcional/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'configuracoes/sead/classificacao-funcional/:id/editar',
    renderMode: RenderMode.Server,
  },
  {
    path: 'configuracoes/sead/modalidade-de-ensino/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'configuracoes/sead/modalidade-de-ensino/:id/editar',
    renderMode: RenderMode.Server,
  },
  {
    path: 'configuracoes/sead/regime-de-contratacao/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'configuracoes/sead/regime-de-contratacao/:id/editar',
    renderMode: RenderMode.Server,
  },
  {
    path: 'configuracoes/sead/tipo-de-aposentadoria/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'configuracoes/sead/tipo-de-aposentadoria/:id/editar',
    renderMode: RenderMode.Server,
  },
  {
    path: 'configuracoes/sead/tipo-de-cargo-comissionado/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'configuracoes/sead/tipo-de-cargo-comissionado/:id/editar',
    renderMode: RenderMode.Server,
  },
  {
    path: 'configuracoes/sead/professores-emergencial-militares-base-tecnica/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'configuracoes/sead/professores-emergencial-militares-base-tecnica/:id/editar',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];

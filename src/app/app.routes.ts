import {Routes} from '@angular/router';
import {PublicLayout} from './public-layout';
import {Login} from './login';
import {EsqueciSenha} from './esqueci-senha';
import {PrimeiroAcesso} from './primeiro-acesso';
import {ShellComponent} from './shell';
import {HubConfiguracoes} from './hub-configuracoes';
import {IndiceSead} from './sead';
import {InicioComponent} from './inicio';
import {BuscaGlobal} from './busca-global';
import {SelecionarMatricula} from './selecionar-matricula';
import {CargoList, CargoForm} from './cargo';
import {FuncaoList, FuncaoForm} from './funcao';
import {CargoComissionadoList, CargoComissionadoForm} from './cargo-comissionado';
import {ClassificacaoFuncionalList, ClassificacaoFuncionalForm} from './classificacao-funcional';
import {ModalidadeEnsinoList, ModalidadeEnsinoForm} from './modalidade-de-ensino';
import {FormaAdmissaoList, FormaAdmissaoForm} from './forma-de-admissao';
import {FormacaoAcademicaList, FormacaoAcademicaForm} from './formacao-academica';
import {GrauInstrucaoList, GrauInstrucaoForm} from './grau-de-instrucao';
import {SituacaoFuncionalList, SituacaoFuncionalForm} from './situacao-funcional';
import {MotivoSaidaList, MotivoSaidaForm} from './motivo-da-saida';
import {RegimeContratacaoList, RegimeContratacaoForm} from './regime-contratacao';
import {TipoAposentadoriaList, TipoAposentadoriaForm} from './tipo-aposentadoria';
import {TipoCargoComissionadoList, TipoCargoComissionadoForm} from './tipo-cargo-comissionado';
import {ProfessoresList, ProfessoresForm} from './professores-emergencial-militares-base-tecnica';
import {HubProfissionais} from './hub-profissionais';
import {ImportacaoProfissionaisList, ImportacaoProfissionaisDetalhes} from './importacao-profissionais';
import {AcessoRestritoComponent} from './acesso-restrito';
import {HierarquiaComponent} from './hierarquia';
import {HierarquiaVisualizacao} from './hierarquia-visualizacao';
import {SecretariaGeralList, SecretariaGeralForm, SecretariaGeralView, secretariaGeralFormDeactivateGuard} from './secretaria-geral';
import {SecretariaExecutivaList, SecretariaExecutivaForm, SecretariaExecutivaView, secretariaExecutivaFormDeactivateGuard} from './secretaria-executiva';
import {GerenciaExecutivaList, GerenciaExecutivaForm, GerenciaExecutivaView, gerenciaExecutivaFormDeactivateGuard} from './gerencia-executiva';
import {GerenciaRegionalList, GerenciaRegionalForm, GerenciaRegionalView, gerenciaRegionalFormDeactivateGuard} from './gerencia-regional';
import {SubgerenciaList, SubgerenciaForm, SubgerenciaView, subgerenciaFormDeactivateGuard} from './subgerencia';
import {NucleoList, NucleoForm, NucleoView, nucleoFormDeactivateGuard} from './nucleo';
import {ExcecaoHierarquiaList, ExcecaoHierarquiaForm, ExcecaoHierarquiaView, excecaoHierarquiaFormDeactivateGuard} from './excecao-hierarquia';
import {permissionGuard, createPermissionGuard} from './permission';
import {provideSiageDateAdapter} from '@siage/siage-ui';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: 'login', component: Login },
      { path: 'login/esqueci-senha', component: EsqueciSenha },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  {
    path: 'primeiro-acesso',
    component: PrimeiroAcesso
  },
  {
    path: 'selecionar-matricula',
    component: SelecionarMatricula
  },
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: 'inicio', component: InicioComponent },
      { path: 'busca-global', component: BuscaGlobal },
      { path: 'busca', redirectTo: 'busca-global', pathMatch: 'full' },
      { path: 'acesso-restrito', component: AcessoRestritoComponent },
      { path: 'profissionais', component: HubProfissionais, canActivate: [permissionGuard] },
      { path: 'profissionais/importacao', component: ImportacaoProfissionaisList, canActivate: [permissionGuard] },
      { path: 'profissionais/importacao/:id', component: ImportacaoProfissionaisDetalhes, canActivate: [permissionGuard] },
      { path: 'configuracoes', component: HubConfiguracoes, canActivate: [permissionGuard] },
      { path: 'configuracoes/hub', redirectTo: 'configuracoes', pathMatch: 'full' },
      { path: 'configuracoes/hierarquia', component: HierarquiaComponent, canActivate: [permissionGuard] },
      { path: 'configuracoes/hierarquia/visualizar', component: HierarquiaVisualizacao, canActivate: [permissionGuard] },
      { path: 'configuracoes/hierarquia/secretaria-geral', component: SecretariaGeralList, canActivate: [permissionGuard] },
      { path: 'configuracoes/hierarquia/secretaria-geral/novo', component: SecretariaGeralForm, providers: [provideSiageDateAdapter()], canActivate: [permissionGuard, createPermissionGuard], canDeactivate: [secretariaGeralFormDeactivateGuard] },
      { path: 'configuracoes/hierarquia/secretaria-geral/:id', component: SecretariaGeralView, canActivate: [permissionGuard] },
      { path: 'configuracoes/hierarquia/secretaria-geral/:id/editar', component: SecretariaGeralForm, providers: [provideSiageDateAdapter()], canActivate: [permissionGuard], canDeactivate: [secretariaGeralFormDeactivateGuard] },
      { path: 'configuracoes/hierarquia/secretaria-executiva', component: SecretariaExecutivaList, canActivate: [permissionGuard] },
      { path: 'configuracoes/hierarquia/secretaria-executiva/novo', component: SecretariaExecutivaForm, canActivate: [permissionGuard, createPermissionGuard], canDeactivate: [secretariaExecutivaFormDeactivateGuard] },
      { path: 'configuracoes/hierarquia/secretaria-executiva/:id', component: SecretariaExecutivaView, canActivate: [permissionGuard] },
      { path: 'configuracoes/hierarquia/secretaria-executiva/:id/editar', component: SecretariaExecutivaForm, canActivate: [permissionGuard], canDeactivate: [secretariaExecutivaFormDeactivateGuard] },
      { path: 'configuracoes/hierarquia/gerencia-executiva', component: GerenciaExecutivaList, canActivate: [permissionGuard] },
      { path: 'configuracoes/hierarquia/gerencia-executiva/novo', component: GerenciaExecutivaForm, canActivate: [permissionGuard, createPermissionGuard], canDeactivate: [gerenciaExecutivaFormDeactivateGuard] },
      { path: 'configuracoes/hierarquia/gerencia-executiva/:id', component: GerenciaExecutivaView, canActivate: [permissionGuard] },
      { path: 'configuracoes/hierarquia/gerencia-executiva/:id/editar', component: GerenciaExecutivaForm, canActivate: [permissionGuard], canDeactivate: [gerenciaExecutivaFormDeactivateGuard] },
      { path: 'configuracoes/hierarquia/gerencia-regional', component: GerenciaRegionalList, canActivate: [permissionGuard] },
      { path: 'configuracoes/hierarquia/gerencia-regional/novo', component: GerenciaRegionalForm, canActivate: [permissionGuard, createPermissionGuard], canDeactivate: [gerenciaRegionalFormDeactivateGuard] },
      { path: 'configuracoes/hierarquia/gerencia-regional/:id', component: GerenciaRegionalView, canActivate: [permissionGuard] },
      { path: 'configuracoes/hierarquia/gerencia-regional/:id/editar', component: GerenciaRegionalForm, canActivate: [permissionGuard], canDeactivate: [gerenciaRegionalFormDeactivateGuard] },
      { path: 'configuracoes/hierarquia/subgerencia', component: SubgerenciaList, canActivate: [permissionGuard] },
      { path: 'configuracoes/hierarquia/subgerencia/novo', component: SubgerenciaForm, canActivate: [permissionGuard, createPermissionGuard], canDeactivate: [subgerenciaFormDeactivateGuard] },
      { path: 'configuracoes/hierarquia/subgerencia/:id', component: SubgerenciaView, canActivate: [permissionGuard] },
      { path: 'configuracoes/hierarquia/subgerencia/:id/editar', component: SubgerenciaForm, canActivate: [permissionGuard], canDeactivate: [subgerenciaFormDeactivateGuard] },
      { path: 'configuracoes/hierarquia/nucleo', component: NucleoList, canActivate: [permissionGuard] },
      { path: 'configuracoes/hierarquia/nucleo/novo', component: NucleoForm, canActivate: [permissionGuard, createPermissionGuard], canDeactivate: [nucleoFormDeactivateGuard] },
      { path: 'configuracoes/hierarquia/nucleo/:id', component: NucleoView, canActivate: [permissionGuard] },
      { path: 'configuracoes/hierarquia/nucleo/:id/editar', component: NucleoForm, canActivate: [permissionGuard], canDeactivate: [nucleoFormDeactivateGuard] },
      { path: 'configuracoes/hierarquia/excecao-hierarquia', component: ExcecaoHierarquiaList, canActivate: [permissionGuard] },
      { path: 'configuracoes/hierarquia/excecao-hierarquia/:id', component: ExcecaoHierarquiaView, canActivate: [permissionGuard] },
      { path: 'configuracoes/hierarquia/excecao-hierarquia/:id/configurar', component: ExcecaoHierarquiaForm, canActivate: [permissionGuard], canDeactivate: [excecaoHierarquiaFormDeactivateGuard] },
      { path: 'configuracoes/sead', component: IndiceSead, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/hub', redirectTo: 'configuracoes/sead', pathMatch: 'full' },
      { path: 'configuracoes/sead/cargo', component: CargoList, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/cargo/novo', component: CargoForm, canActivate: [permissionGuard, createPermissionGuard] },
      { path: 'configuracoes/sead/cargo/:id', component: CargoForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/cargo/:id/editar', component: CargoForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/funcao', component: FuncaoList, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/funcao/novo', component: FuncaoForm, canActivate: [permissionGuard, createPermissionGuard] },
      { path: 'configuracoes/sead/funcao/:id', component: FuncaoForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/funcao/:id/editar', component: FuncaoForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/cargo-comissionado', component: CargoComissionadoList, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/cargo-comissionado/novo', component: CargoComissionadoForm, canActivate: [permissionGuard, createPermissionGuard] },
      { path: 'configuracoes/sead/cargo-comissionado/:id', component: CargoComissionadoForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/cargo-comissionado/:id/editar', component: CargoComissionadoForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/classificacao-funcional', component: ClassificacaoFuncionalList, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/classificacao-funcional/novo', component: ClassificacaoFuncionalForm, canActivate: [permissionGuard, createPermissionGuard] },
      { path: 'configuracoes/sead/classificacao-funcional/:id', component: ClassificacaoFuncionalForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/classificacao-funcional/:id/editar', component: ClassificacaoFuncionalForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/modalidade-de-ensino', component: ModalidadeEnsinoList, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/modalidade-de-ensino/novo', component: ModalidadeEnsinoForm, canActivate: [permissionGuard, createPermissionGuard] },
      { path: 'configuracoes/sead/modalidade-de-ensino/:id', component: ModalidadeEnsinoForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/modalidade-de-ensino/:id/editar', component: ModalidadeEnsinoForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/forma-de-admissao', component: FormaAdmissaoList, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/forma-de-admissao/novo', component: FormaAdmissaoForm, canActivate: [permissionGuard, createPermissionGuard] },
      { path: 'configuracoes/sead/forma-de-admissao/:id', component: FormaAdmissaoForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/forma-de-admissao/:id/editar', component: FormaAdmissaoForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/formacao-academica', component: FormacaoAcademicaList, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/formacao-academica/novo', component: FormacaoAcademicaForm, canActivate: [permissionGuard, createPermissionGuard] },
      { path: 'configuracoes/sead/formacao-academica/:id', component: FormacaoAcademicaForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/formacao-academica/:id/editar', component: FormacaoAcademicaForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/grau-de-instrucao', component: GrauInstrucaoList, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/grau-de-instrucao/novo', component: GrauInstrucaoForm, canActivate: [permissionGuard, createPermissionGuard] },
      { path: 'configuracoes/sead/grau-de-instrucao/:id', component: GrauInstrucaoForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/grau-de-instrucao/:id/editar', component: GrauInstrucaoForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/situacao-funcional', component: SituacaoFuncionalList, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/situacao-funcional/novo', component: SituacaoFuncionalForm, canActivate: [permissionGuard, createPermissionGuard] },
      { path: 'configuracoes/sead/situacao-funcional/:id', component: SituacaoFuncionalForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/situacao-funcional/:id/editar', component: SituacaoFuncionalForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/motivo-da-saida', component: MotivoSaidaList, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/motivo-da-saida/novo', component: MotivoSaidaForm, canActivate: [permissionGuard, createPermissionGuard] },
      { path: 'configuracoes/sead/motivo-da-saida/:id', component: MotivoSaidaForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/motivo-da-saida/:id/editar', component: MotivoSaidaForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/regime-de-contratacao', component: RegimeContratacaoList, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/regime-de-contratacao/novo', component: RegimeContratacaoForm, canActivate: [permissionGuard, createPermissionGuard] },
      { path: 'configuracoes/sead/regime-de-contratacao/:id', component: RegimeContratacaoForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/regime-de-contratacao/:id/editar', component: RegimeContratacaoForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/tipo-de-aposentadoria', component: TipoAposentadoriaList, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/tipo-de-aposentadoria/novo', component: TipoAposentadoriaForm, canActivate: [permissionGuard, createPermissionGuard] },
      { path: 'configuracoes/sead/tipo-de-aposentadoria/:id', component: TipoAposentadoriaForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/tipo-de-aposentadoria/:id/editar', component: TipoAposentadoriaForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/tipo-de-cargo-comissionado', component: TipoCargoComissionadoList, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/tipo-de-cargo-comissionado/novo', component: TipoCargoComissionadoForm, canActivate: [permissionGuard, createPermissionGuard] },
      { path: 'configuracoes/sead/tipo-de-cargo-comissionado/:id', component: TipoCargoComissionadoForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/tipo-de-cargo-comissionado/:id/editar', component: TipoCargoComissionadoForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/professores-emergencial-militares-base-tecnica', component: ProfessoresList, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/professores-emergencial-militares-base-tecnica/novo', component: ProfessoresForm, canActivate: [permissionGuard, createPermissionGuard] },
      { path: 'configuracoes/sead/professores-emergencial-militares-base-tecnica/:id', component: ProfessoresForm, canActivate: [permissionGuard] },
      { path: 'configuracoes/sead/professores-emergencial-militares-base-tecnica/:id/editar', component: ProfessoresForm, canActivate: [permissionGuard] }
    ]
  },
  { path: '**', redirectTo: 'login' }
];


import {provideZonelessChangeDetection, signal} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {vi} from 'vitest';
import {HierarquiaVisualizacao} from './hierarquia-visualizacao';
import {SecretariaGeralService} from './secretaria-geral';
import {SecretariaExecutivaService} from './secretaria-executiva';
import {GerenciaExecutivaService} from './gerencia-executiva';
import {GerenciaRegionalService} from './gerencia-regional';
import {SubgerenciaService} from './subgerencia';
import {NucleoService} from './nucleo';
import {ExcecaoHierarquiaService} from './excecao-hierarquia';
import {PermissionService} from './permission';

describe('Visualizar Hierarquia', () => {
  let fixture: ComponentFixture<HierarquiaVisualizacao>;
  let component: HierarquiaVisualizacao;
  let root: HTMLElement;
  const acesso = signal(true);

  beforeEach(async () => {
    acesso.set(true);
    await TestBed.configureTestingModule({
      imports: [HierarquiaVisualizacao],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {provide: PermissionService, useValue: {hasAccess: acesso}},
        {provide: SecretariaGeralService, useValue: {items: signal([
          {id: '1', nome: 'Secretaria Geral', status: 'ATIVO'},
          {id: '2', nome: 'Secretaria Extinta', normativaExtincao: {numero: '1'}}
        ])}},
        {provide: SecretariaExecutivaService, useValue: {items: signal([
          {id: '1', nome: 'Secretaria Executiva', secretariaGeralId: '1', secretariaGeralNome: 'Secretaria Geral', status: 'ATIVO'}
        ])}},
        {provide: GerenciaExecutivaService, useValue: {items: signal([])}},
        {provide: GerenciaRegionalService, useValue: {items: signal([
          {id: '1', nome: 'Gerência Regional', secretariaGeralId: '1', secretariaGeralNome: 'Secretaria Geral', status: 'ATIVO', subordinadas: [
            {id: '1', nome: 'Escola Central', tipo: 'Escola'},
            {id: '2', nome: 'Núcleo Extinto', tipo: 'Núcleo'}
          ]}
        ])}},
        {provide: SubgerenciaService, useValue: {items: signal([])}},
        {provide: NucleoService, useValue: {items: signal([
          {id: '1', nome: 'Núcleo Extinto', normativaExtincao: {numero: '2'}}
        ])}},
        {provide: ExcecaoHierarquiaService, useValue: {setores: signal([])}}
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(HierarquiaVisualizacao);
    component = fixture.componentInstance;
    root = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
  });

  it('mantém a estrutura vigente e os controles de expansão', () => {
    expect(root.querySelector('s-page-header')).not.toBeNull();
    expect(root.querySelectorAll('s-card').length).toBe(2);
    expect(Array.from(root.querySelectorAll('s-page-header nav a'), link => link.getAttribute('href'))).toEqual([
      '/inicio', '/configuracoes', '/configuracoes/hierarquia'
    ]);
    expect(component.flattenedTree().map(item => item.node.nome)).toEqual([
      'Secretaria Geral', 'Secretaria Executiva', 'Gerência Regional'
    ]);
    expect(component.allSearchableNodes().map(node => node.nome)).toEqual([
      'Secretaria Geral', 'Secretaria Executiva', 'Gerência Regional', 'Escola Central'
    ]);
    const expandir = Array.from(root.querySelectorAll('button')).find(button => button.textContent?.includes('Expandir tudo'))!;
    expandir.click();
    fixture.detectChanges();
    expect(component.flattenedTree().map(item => item.node.nome)).toEqual([
      'Secretaria Geral', 'Secretaria Executiva', 'Gerência Regional', 'Escolas (1)', 'Escola Central'
    ]);
    expect(root.querySelectorAll('[role="treeitem"]').length).toBe(5);
    const recolher = Array.from(root.querySelectorAll('button')).find(button => button.textContent?.includes('Recolher tudo'))!;
    recolher.click();
    fixture.detectChanges();
    expect(component.flattenedTree().map(item => item.node.nome)).toEqual(['Secretaria Geral']);
  });

  it('busca por nome e seleciona unidade abrindo seus ancestrais', () => {
    component.recolherTodos();
    component.buscaControl.setValue('central');
    expect(component.sugestoesBusca().map(node => node.nome)).toEqual(['Escola Central']);
    const escola = component.sugestoesBusca()[0];
    component.onSelecionarSugestao(escola);
    fixture.detectChanges();
    expect(component.selectedNode()?.nome).toBe('Escola Central');
    expect(component.flattenedTree().map(item => item.node.nome)).toContain('Escola Central');
    expect(component.caminhoFormatado()).toBe('Secretaria Geral > Gerência Regional > Escola Central');
    expect(root.textContent).toContain('Escola Central');
    expect(root.querySelector('[aria-label="Visualizar unidade"]')).toBeNull();
    component.limparBusca();
    expect(component.buscaControl.value).toBe('');
    component.buscaControl.setValue('inexistente');
    expect(component.hasBuscaTextSemSugestoes()).toBe(true);
  });

  it('exibe o caminho, navega para a unidade e abre a estrutura geral', () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const abrir = vi.spyOn(fixture.debugElement.injector.get(MatDialog), 'open');
    const node = component.nodeMap().get('se-1')!;
    component.selecionarNode(node);
    fixture.detectChanges();
    const caminho = Array.from(root.querySelectorAll('button')).find(button => button.textContent?.includes('Ver caminho hierárquico'))!;
    caminho.click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Secretaria Geral > Secretaria Executiva');
    (root.querySelector('[aria-label="Visualizar unidade"]') as HTMLButtonElement).click();
    expect(navegar).toHaveBeenCalledWith('/configuracoes/hierarquia/secretaria-executiva/1');
    const estrutura = Array.from(root.querySelectorAll('button')).find(button => button.textContent?.includes('Ver estrutura geral'))!;
    estrutura.click();
    expect(abrir).toHaveBeenCalled();
  });

  it('mantém o bloqueio de acesso', () => {
    acesso.set(false);
    fixture.detectChanges();
    expect(root.querySelector('app-acesso-restrito')).not.toBeNull();
    expect(root.querySelector('[role="tree"]')).toBeNull();
  });
});
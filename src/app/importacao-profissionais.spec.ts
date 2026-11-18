import {provideZonelessChangeDetection} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {provideRouter, Router} from '@angular/router';
import {vi} from 'vitest';
import {ImportacaoProfissionaisDetalhes, ImportacaoProfissionaisList, ImportacaoService, NovaCargaDialog} from './importacao-profissionais';
import {SimulatorService} from './simulator';

function botao(root: HTMLElement, texto: string): HTMLButtonElement {
  return Array.from(root.querySelectorAll<HTMLButtonElement>('button'))
    .find(elemento => elemento.textContent?.trim().includes(texto))!;
}

describe('Importação de profissionais: listagem', () => {
  let fixture: ComponentFixture<ImportacaoProfissionaisList>;
  let componente: ImportacaoProfissionaisList;
  let root: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportacaoProfissionaisList],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    }).compileComponents();
    fixture = TestBed.createComponent(ImportacaoProfissionaisList);
    componente = fixture.componentInstance;
    root = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => vi.restoreAllMocks());

  it('aplica e limpa os filtros sem alterar a lista antes da busca', () => {
    expect(componente.filteredItems()).toHaveLength(4);
    componente.arquivoControl.setValue('fev_2026');
    componente.statusControl.setValue('CONCLUIDO_COM_SUCESSO');
    fixture.detectChanges();
    expect(componente.filteredItems()).toHaveLength(4);
    expect(botao(root, 'Buscar').disabled).toBe(false);
    botao(root, 'Buscar').click();
    fixture.detectChanges();
    expect(componente.filteredItems().map(item => item.id)).toEqual(['104']);
    expect(root.textContent).toContain('carga_profissionais_fev_2026.xlsx');
    botao(root, 'Limpar').click();
    fixture.detectChanges();
    expect(componente.filteredItems()).toHaveLength(4);
    expect(componente.arquivoControl.value).toBe('');
    expect(componente.statusControl.value).toBe('TODOS');
    expect(botao(root, 'Buscar').disabled).toBe(true);
  });

  it('aplica e limpa o filtro de responsável', () => {
    expect(componente.responsavelOptions()).toEqual([
      {label: 'Todos', value: 'TODOS'},
      ...componente.responsaveis().map(responsavel => ({label: responsavel, value: responsavel}))
    ]);
    componente.responsavelControl.setValue('Mikael Oliveira');
    fixture.detectChanges();
    expect(componente.filteredItems()).toHaveLength(4);
    expect(botao(root, 'Buscar').disabled).toBe(false);
    botao(root, 'Buscar').click();
    fixture.detectChanges();
    expect(componente.filteredItems().map(item => item.responsavel)).toEqual(['Mikael Oliveira', 'Mikael Oliveira']);
    botao(root, 'Limpar').click();
    fixture.detectChanges();
    expect(componente.responsavelControl.value).toBe('TODOS');
    expect(componente.filteredItems()).toHaveLength(4);
    expect(botao(root, 'Buscar').disabled).toBe(true);
  });

  it('disponibiliza ações apenas para a importação pendente mais recente', () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const baixar = vi.spyOn(TestBed.inject(ImportacaoService), 'baixarRelatorio').mockImplementation(() => undefined);
    const visualizar = root.querySelectorAll<HTMLButtonElement>('[aria-label="Visualizar detalhes da importação"]');
    const relatorios = root.querySelectorAll<HTMLButtonElement>('[aria-label="Baixar relatório de pendências (.xlsx)"]');
    expect(visualizar).toHaveLength(1);
    expect(relatorios).toHaveLength(1);
    visualizar[0].click();
    relatorios[0].click();
    expect(navegar).toHaveBeenCalledWith(['/profissionais/importacao', '105']);
    expect(baixar).toHaveBeenCalledWith(expect.objectContaining({id: '105'}));
  });

  it('abre o modal e respeita os estados do simulador e a permissão de criação', () => {
    const abrir = vi.spyOn(fixture.debugElement.injector.get(MatDialog), 'open').mockImplementation(() => null as never);
    botao(root, 'Nova carga').click();
    expect(abrir).toHaveBeenCalledWith(NovaCargaDialog, expect.any(Object));
    const simulador = TestBed.inject(SimulatorService);
    simulador.allowCreation.set(false);
    simulador.currentScenario.set('empty');
    fixture.detectChanges();
    expect(botao(root, 'Nova carga')).toBeUndefined();
    expect(root.textContent).toContain('Nenhum registro cadastrado');
    simulador.currentScenario.set('no_filter_results');
    fixture.detectChanges();
    expect(root.textContent).toContain('Nenhum resultado encontrado');
  });
});

describe('Importação de profissionais: nova carga', () => {
  let fixture: ComponentFixture<NovaCargaDialog>;
  let componente: NovaCargaDialog;
  let root: HTMLElement;
  const fechar = vi.fn();

  beforeEach(async () => {
    fechar.mockReset();
    await TestBed.configureTestingModule({
      imports: [NovaCargaDialog],
      providers: [provideZonelessChangeDetection(), provideRouter([]), {provide: MatDialogRef, useValue: {close: fechar}}]
    }).compileComponents();
    fixture = TestBed.createComponent(NovaCargaDialog);
    componente = fixture.componentInstance;
    root = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function selecionar(nome: string) {
    const entrada = root.querySelector<HTMLInputElement>('#carga-dados-file')!;
    Object.defineProperty(entrada, 'files', {configurable: true, value: [new File(['dados'], nome)]});
    entrada.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  it('rejeita arquivo incompatível e permite selecionar e remover um XLSX', () => {
    expect(botao(root, 'Salvar').disabled).toBe(true);
    selecionar('arquivo.csv');
    expect(root.textContent).toContain('Não é possível adicionar documentos em outros formatos.');
    expect(botao(root, 'Salvar').disabled).toBe(true);
    selecionar('arquivo.xlsx');
    expect(root.textContent).toContain('arquivo.xlsx');
    expect(botao(root, 'Salvar').disabled).toBe(false);
    root.querySelector<HTMLButtonElement>('[aria-label="Remover arquivo"]')!.click();
    fixture.detectChanges();
    expect(componente.selectedFile()).toBeNull();
    expect(botao(root, 'Salvar').disabled).toBe(true);
  });

  it('bloqueia carga concorrente e inicia a carga quando disponível', () => {
    vi.useFakeTimers();
    selecionar('arquivo.xlsx');
    const servico = TestBed.inject(ImportacaoService);
    const ocupado = vi.spyOn(servico, 'hasInProcessing').mockReturnValue(true);
    botao(root, 'Salvar').click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Não é possível iniciar outra importação enquanto houver um processamento em andamento.');
    expect(fechar).not.toHaveBeenCalled();
    ocupado.mockReturnValue(false);
    botao(root, 'Salvar').click();
    expect(servico.items()[0].arquivo).toBe('arquivo.xlsx');
    expect(servico.items()[0].status).toBe('EM_PROCESSAMENTO');
    expect(fechar).toHaveBeenCalledWith(true);
  });

  it('cancela sem iniciar carga', () => {
    botao(root, 'Cancelar').click();
    expect(fechar).toHaveBeenCalledWith(false);
    expect(TestBed.inject(ImportacaoService).items()).toHaveLength(4);
  });
});

describe('Importação de profissionais: detalhes', () => {
  let fixture: ComponentFixture<ImportacaoProfissionaisDetalhes>;
  let componente: ImportacaoProfissionaisDetalhes;
  let root: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportacaoProfissionaisDetalhes],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    }).compileComponents();
    fixture = TestBed.createComponent(ImportacaoProfissionaisDetalhes);
    componente = fixture.componentInstance;
    root = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => vi.restoreAllMocks());

  it('exibe informações e pagina as pendências', () => {
    componente.importacaoId.set('105');
    fixture.detectChanges();
    expect(root.textContent).toContain('carga_profissionais_mar_2026.xlsx');
    expect(root.textContent).toContain('1428');
    expect(componente.paginatedPendencias()).toHaveLength(10);
    expect(componente.paginatedPendencias()[0].id).toBe('p-1');
    componente.onPageChange({pageIndex: 1, pageSize: 10, length: 12});
    fixture.detectChanges();
    expect(componente.paginatedPendencias().map(item => item.id)).toEqual(['p-11', 'p-12']);
  });

  it('apresenta os estados sem pendências e de registro ausente e permite voltar', () => {
    componente.importacaoId.set('104');
    fixture.detectChanges();
    expect(root.textContent).toContain('Nenhuma pendência identificada');
    componente.importacaoId.set('inexistente');
    fixture.detectChanges();
    expect(root.textContent).toContain('Importação não localizada');
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    botao(root, 'Voltar à listagem').click();
    expect(navegar).toHaveBeenCalledWith(['/profissionais/importacao']);
  });
});
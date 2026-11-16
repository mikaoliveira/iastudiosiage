import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  Injectable,
  OnInit
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SEmptyStateComponent} from '@siage/siage-ui';
import {Router, ActivatedRoute} from '@angular/router';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatDialogModule, MatDialog, MatDialogRef} from '@angular/material/dialog';
import * as XLSX from 'xlsx';

import {AuthSessionService} from './auth-session';
import {ToastService} from './toast';
import {PermissionService} from './permission';
import {AcessoRestritoComponent} from './acesso-restrito';
import {SiagePaginatorComponent} from './siage-paginator';
import {SimulatorService} from './simulator';

export type ImportacaoStatus =
  | 'EM_PROCESSAMENTO'
  | 'CONCLUIDO_COM_SUCESSO'
  | 'CONCLUIDO_COM_PENDENCIAS';

export interface PendenciaItem {
  id: string;
  matricula: string;
  nome: string;
  cpf: string;
  motivo: string;
}

export interface ImportacaoItem {
  id: string;
  arquivo: string;
  dataHora: string;          // DD/MM/AAAA HH:mm
  conclusao: string;         // DD/MM/AAAA HH:mm ou '-'
  responsavel: string;
  status: ImportacaoStatus;
  registrosSucesso: number;
  pendenciasQtd: number;
  pendencias: PendenciaItem[];
  tamanhoArquivo?: string;
}

/**
 * Utilitário para converter data no formato DD/MM/AAAA HH:mm em timestamp numérico para ordenação.
 */
function parseDataHora(dh: string): number {
  if (!dh || dh === '-') return 0;
  const [dPart, tPart] = dh.split(' ');
  if (!dPart) return 0;
  const [d, m, y] = dPart.split('/').map(Number);
  const [h, min] = (tPart || '00:00').split(':').map(Number);
  return new Date(y, m - 1, d, h, min).getTime();
}

/**
 * Formata data/hora atual no padrão DD/MM/AAAA HH:mm.
 */
export function formatDataHoraNow(): string {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${d}/${m}/${y} ${h}:${min}`;
}

/**
 * Exporta o arquivo XLSX oficial com as pendências da importação.
 */
export function exportarRelatorioPendenciasXlsx(item: ImportacaoItem, usuarioSolicitante: string) {
  const wb = XLSX.utils.book_new();
  const dataGeracao = formatDataHoraNow();

  const wsData: (string | number)[][] = [
    ['GOVERNO DO ESTADO DA PARAÍBA'],
    ['SECRETARIA DE ESTADO DA EDUCAÇÃO'],
    ['RELATÓRIO DE IMPORTAÇÃO DE PROFISSIONAIS COM PENDÊNCIAS'],
    [`Arquivo: ${item.arquivo} | Gerado em: ${dataGeracao} | Responsável: ${usuarioSolicitante || item.responsavel}`],
    [],
    ['Nome', 'Matrícula', 'CPF', 'Motivo da Pendência']
  ];

  for (const p of item.pendencias) {
    wsData.push([p.nome, p.matricula, p.cpf, p.motivo]);
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 40 }, // Nome
    { wch: 18 }, // Matrícula
    { wch: 18 }, // CPF
    { wch: 80 }  // Motivo
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Pendências');
  const cleanName = item.arquivo.replace(/\.xlsx$/i, '');
  XLSX.writeFile(wb, `relatorio_pendencias_${cleanName}.xlsx`);
}

@Injectable({
  providedIn: 'root'
})
export class ImportacaoService {
  private readonly auth = inject(AuthSessionService);
  private readonly toast = inject(ToastService);

  private readonly initialPendencias: PendenciaItem[] = [
    {
      id: 'p-1',
      matricula: '184.230-1',
      nome: 'MARIA APARECIDA DA SILVA',
      cpf: '123.456.789-01',
      motivo: 'Divergência entre o cargo informado na planilha (Professor de Educação Básica) e o registro cadastral na SEAD.'
    },
    {
      id: 'p-2',
      matricula: '209.441-8',
      nome: 'JOSÉ CARLOS PEREIRA LIMA',
      cpf: '234.567.890-12',
      motivo: 'CPF inválido ou não correspondente ao profissional cadastrado no sistema.'
    },
    {
      id: 'p-3',
      matricula: '310.882-5',
      nome: 'FERNANDA SOARES ALBUQUERQUE',
      cpf: '345.678.901-23',
      motivo: 'Carga horária semanal informada (50h) excede o limite máximo permitido para contratação emergencial (40h).'
    },
    {
      id: 'p-4',
      matricula: '401.992-0',
      nome: 'ANTÔNIO MARCOS DOS SANTOS',
      cpf: '456.789.012-34',
      motivo: 'Unidade de Trabalho (UTB) informada inexistente ou inativa na base de dados da SEE-PB.'
    },
    {
      id: 'p-5',
      matricula: '512.119-3',
      nome: 'JULIANA BEZERRA CAVALCANTI',
      cpf: '567.890.123-45',
      motivo: 'Data de início de exercício informada é anterior à data de admissão no vínculo contratual.'
    },
    {
      id: 'p-6',
      matricula: '623.774-6',
      nome: 'LUCAS GABRIEL DE OLIVEIRA',
      cpf: '678.901.234-56',
      motivo: 'Formação acadêmica obrigatória não preenchida na planilha de importação.'
    },
    {
      id: 'p-7',
      matricula: '734.885-7',
      nome: 'PATRÍCIA GOMES DA COSTA',
      cpf: '789.012.345-67',
      motivo: 'Profissional possui acúmulo de cargos não regularizado no sistema estadual.'
    },
    {
      id: 'p-8',
      matricula: '845.996-8',
      nome: 'RODRIGO MENEZES DE SOUZA',
      cpf: '890.123.456-78',
      motivo: 'Regime de contratação divergente do edital vigente da base técnica estadual.'
    },
    {
      id: 'p-9',
      matricula: '956.107-9',
      nome: 'BEATRIZ CAMPOS FERREIRA',
      cpf: '901.234.567-89',
      motivo: 'Grau de instrução incompatível com o nível mínimo exigido para a função docente designada.'
    },
    {
      id: 'p-10',
      matricula: '167.218-0',
      nome: 'GUSTAVO HENRIQUE BARBOSA',
      cpf: '012.345.678-90',
      motivo: 'Documento de identificação (RG) e órgão emissor ausentes na planilha de carga.'
    },
    {
      id: 'p-11',
      matricula: '278.329-1',
      nome: 'CAMILA RIBEIRO PESSOA',
      cpf: '123.450.987-11',
      motivo: 'E-mail institucional com formato inválido ou pertencente a outro domínio corporativo.'
    },
    {
      id: 'p-12',
      matricula: '389.430-2',
      nome: 'FELIPE ANDRADE MONTEIRO',
      cpf: '234.561.098-22',
      motivo: 'Situação funcional incompatível para importação em lote de profissionais ativos.'
    }
  ];

  readonly items = signal<ImportacaoItem[]>([
    {
      id: '105',
      arquivo: 'carga_profissionais_mar_2026.xlsx',
      dataHora: '15/03/2026 14:30',
      conclusao: '15/03/2026 14:38',
      responsavel: 'Mikael Oliveira',
      status: 'CONCLUIDO_COM_PENDENCIAS',
      registrosSucesso: 1428,
      pendenciasQtd: 12,
      pendencias: this.initialPendencias,
      tamanhoArquivo: '184 KB'
    },
    {
      id: '104',
      arquivo: 'carga_profissionais_fev_2026.xlsx',
      dataHora: '28/02/2026 09:15',
      conclusao: '28/02/2026 09:21',
      responsavel: 'Roberto Silva',
      status: 'CONCLUIDO_COM_SUCESSO',
      registrosSucesso: 2150,
      pendenciasQtd: 0,
      pendencias: [],
      tamanhoArquivo: '240 KB'
    },
    {
      id: '103',
      arquivo: 'carga_professores_jan_2026.xlsx',
      dataHora: '15/01/2026 11:00',
      conclusao: '15/01/2026 11:08',
      responsavel: 'Marcela Santos',
      status: 'CONCLUIDO_COM_PENDENCIAS',
      registrosSucesso: 890,
      pendenciasQtd: 3,
      pendencias: this.initialPendencias.slice(0, 3),
      tamanhoArquivo: '98 KB'
    },
    {
      id: '101',
      arquivo: 'carga_geral_profissionais_nov_2025.xlsx',
      dataHora: '10/11/2025 10:20',
      conclusao: '10/11/2025 10:32',
      responsavel: 'Mikael Oliveira',
      status: 'CONCLUIDO_COM_SUCESSO',
      registrosSucesso: 3410,
      pendenciasQtd: 0,
      pendencias: [],
      tamanhoArquivo: '390 KB'
    }
  ]);

  /**
   * Identifica se existe alguma importação em processamento no momento.
   */
  readonly hasInProcessing = computed(() => {
    return this.items().some(item => item.status === 'EM_PROCESSAMENTO');
  });

  /**
   * Identifica EXCLUSIVAMENTE a importação mais recente com status "Concluído com pendências".
   * Apenas ela terá ações de "Visualizar" e "Baixar" ativas. Para todas as outras, exibe "-".
   */
  readonly latestConcluidoComPendenciasId = computed(() => {
    const pendentes = this.items()
      .filter(i => i.status === 'CONCLUIDO_COM_PENDENCIAS')
      .sort((a, b) => parseDataHora(b.dataHora) - parseDataHora(a.dataHora));
    return pendentes.length > 0 ? pendentes[0].id : null;
  });

  /**
   * Lista alfabética única dos responsáveis pelas importações cadastradas.
   */
  readonly uniqueResponsaveis = computed(() => {
    const set = new Set<string>();
    this.items().forEach(item => {
      if (item.responsavel) set.add(item.responsavel);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  });

  getById(id: string): ImportacaoItem | undefined {
    return this.items().find(i => i.id === id);
  }

  /**
   * Inicia uma nova carga de dados.
   * Regra: Bloqueia caso já exista alguma importação em processamento.
   * Simulação: Finaliza o processamento automaticamente após 6 segundos para permitir
   * a demonstração completa do ciclo e viabilizar novos testes sem bloqueio perpétuo.
   */
  iniciarImportacao(nomeArquivo: string, tamanhoFormatado?: string): { sucesso: boolean; mensagem?: string } {
    if (this.hasInProcessing()) {
      return {
        sucesso: false,
        mensagem: 'Não é possível iniciar outra importação enquanto houver um processamento em andamento.'
      };
    }

    const usuarioAtual = this.auth.getCurrentUserName() || 'Mikael Oliveira';
    const novoId = String(Date.now());
    const novaImportacao: ImportacaoItem = {
      id: novoId,
      arquivo: nomeArquivo,
      dataHora: formatDataHoraNow(),
      conclusao: '-',
      responsavel: usuarioAtual,
      status: 'EM_PROCESSAMENTO',
      registrosSucesso: 0,
      pendenciasQtd: 0,
      pendencias: [],
      tamanhoArquivo: tamanhoFormatado || '120 KB'
    };

    this.items.update(list => [novaImportacao, ...list]);

    // Simulação da conclusão do processamento após 6 segundos no protótipo
    setTimeout(() => {
      this.items.update(list => list.map(item => {
        if (item.id === novoId) {
          return {
            ...item,
            status: 'CONCLUIDO_COM_SUCESSO',
            conclusao: formatDataHoraNow(),
            registrosSucesso: 1850,
            pendenciasQtd: 0
          };
        }
        return item;
      }));
      this.toast.success('Processamento concluído', `A importação de ${nomeArquivo} foi concluída com sucesso.`);
    }, 6000);

    return { sucesso: true };
  }

  baixarRelatorio(item: ImportacaoItem) {
    const usuarioAtual = this.auth.getCurrentUserName();
    exportarRelatorioPendenciasXlsx(item, usuarioAtual);
  }
}

/**
 * Modal "Nova Carga" para upload de planilha XLSX com validações estritas.
 */
@Component({
  selector: 'app-nova-carga-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div 
      class="relative w-[calc(100vw-2rem)] sm:w-[540px] max-w-full bg-siage-surface text-siage-text-primary rounded-lg border border-siage-border shadow-[var(--mat-sys-level3)] font-sans transition-colors duration-200 flex flex-col text-left box-border max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:w-full max-sm:max-w-full max-sm:rounded-b-none max-sm:rounded-t-2xl max-sm:m-0"
      role="dialog"
      aria-labelledby="nova-carga-dialog-title"
    >
      <!-- Cabeçalho com Título e Fechar -->
      <div class="flex items-center justify-between px-5 pt-5 pb-3 border-b border-siage-border/40 shrink-0">
        <h2 id="nova-carga-dialog-title" class="text-base sm:text-lg font-poppins font-bold text-siage-text-primary tracking-tight leading-snug truncate pr-3 text-left">
          Nova carga
        </h2>

        <button 
          type="button" 
          (click)="fechar()" 
          class="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg flex items-center justify-center text-siage-text-secondary hover:text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
          title="Fechar"
          aria-label="Fechar modal"
        >
          <mat-icon style="font-size: 18px; width: 18px; height: 18px;">close</mat-icon>
        </button>
      </div>

      <!-- Corpo do Modal -->
      <div class="px-5 py-5 overflow-y-auto flex-1 font-sans text-left space-y-4">
        
        <!-- Alerta de bloqueio concorrente caso exista importação em processamento -->
        @if (bloqueioConcorrencia()) {
          <div class="p-3.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <mat-icon class="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" style="font-size: 20px; width: 20px; height: 20px;">warning</mat-icon>
            <div class="text-xs sm:text-sm font-sans leading-relaxed">
              {{ mensagemBloqueio() }}
            </div>
          </div>
        }

        <!-- Campo Carga de Dados (Obrigatório) -->
        <div class="flex flex-col gap-1.5">
          <label for="carga-dados-file" class="siage-field-label">
            <span>Carga de dados</span>
            <span class="required-marker text-red-500">*</span>
          </label>

          <!-- Input oculto para seleção do arquivo -->
          <input 
            #fileInput 
            id="carga-dados-file"
            type="file" 
            accept=".xlsx" 
            (change)="onFileSelected($event)" 
            class="hidden" 
          />

          <!-- Estado 1: Nenhum arquivo selecionado ainda -->
          @if (!selectedFile()) {
            <div class="flex flex-col sm:flex-row sm:items-center gap-3">
              <button 
                type="button" 
                (click)="fileInput.click()" 
                class="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-siage-border bg-siage-surface hover:bg-siage-primary/5 hover:border-siage-primary/40 text-siage-text-primary text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
              >
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;" class="text-siage-primary">upload_file</mat-icon>
                <span>Escolher arquivo</span>
              </button>

              <span class="text-xs text-siage-text-secondary">
                Formato permitido: <span class="font-semibold text-siage-text-primary">.xlsx</span>
              </span>
            </div>
          }

          <!-- Estado 2: Arquivo selecionado com sucesso -->
          @if (selectedFile()) {
            <div class="p-3.5 rounded-lg border border-siage-border bg-siage-background flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <mat-icon style="font-size: 20px; width: 20px; height: 20px;">description</mat-icon>
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="text-xs sm:text-sm font-medium text-siage-text-primary truncate">
                    {{ selectedFile()?.name }}
                  </span>
                  <span class="text-[11px] text-siage-text-secondary">
                    {{ selectedFile()?.tamanho }} • Formato .xlsx
                  </span>
                </div>
              </div>

              <!-- Ações do arquivo selecionado: Baixar e Remover -->
              <div class="flex items-center gap-1 shrink-0">
                <button 
                  type="button" 
                  (click)="baixarArquivoSelecionado()" 
                  matTooltip="Baixar arquivo selecionado"
                  aria-label="Baixar arquivo selecionado"
                  class="w-8 h-8 rounded-md flex items-center justify-center text-siage-text-secondary hover:text-siage-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <mat-icon style="font-size: 18px; width: 18px; height: 18px;">download</mat-icon>
                </button>

                <button 
                  type="button" 
                  (click)="removerArquivo(fileInput)" 
                  matTooltip="Remover arquivo"
                  aria-label="Remover arquivo"
                  class="w-8 h-8 rounded-md flex items-center justify-center text-siage-text-secondary hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <mat-icon style="font-size: 18px; width: 18px; height: 18px;">delete_outline</mat-icon>
                </button>
              </div>
            </div>
          }

          <!-- Mensagem de erro ao tentar inserir formato incompatível -->
          @if (erroFormato()) {
            <div class="mt-2 text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5 leading-snug">
              <mat-icon class="shrink-0 mt-0.5" style="font-size: 14px; width: 14px; height: 14px;">error_outline</mat-icon>
              <span>{{ erroFormato() }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Rodapé com Cancelar e Salvar -->
      <div class="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-siage-border/40 shrink-0 bg-siage-surface">
        <button 
          type="button" 
          (click)="fechar()" 
          class="h-10 px-5 rounded-lg border border-siage-border font-sans font-medium text-xs sm:text-sm text-siage-text-primary hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.99] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
        >
          Cancelar
        </button>

        <button 
          type="button" 
          [disabled]="!selectedFile()" 
          (click)="salvar()" 
          class="h-10 px-5 rounded-lg bg-siage-primary hover:bg-siage-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-sans font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
        >
          Salvar
        </button>
      </div>
    </div>
  `
})
export class NovaCargaDialog {
  readonly dialogRef = inject(MatDialogRef<NovaCargaDialog>);
  private readonly importacaoService = inject(ImportacaoService);
  private readonly toast = inject(ToastService);

  readonly selectedFile = signal<{ name: string; tamanho: string; rawFile?: File } | null>(null);
  readonly erroFormato = signal<string | null>(null);
  readonly bloqueioConcorrencia = signal<boolean>(false);
  readonly mensagemBloqueio = signal<string>('');

  onFileSelected(event: Event) {
    this.erroFormato.set(null);
    this.bloqueioConcorrencia.set(false);

    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const fileName = file.name;
    const isXlsx = fileName.toLowerCase().endsWith('.xlsx');

    if (!isXlsx) {
      this.erroFormato.set('Não é possível adicionar documentos em outros formatos. Verifique se o arquivo está no formato permitido (.xlsx).');
      this.selectedFile.set(null);
      input.value = '';
      return;
    }

    const sizeKb = Math.round(file.size / 1024);
    const formattedSize = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

    this.selectedFile.set({
      name: fileName,
      tamanho: formattedSize,
      rawFile: file
    });
  }

  removerArquivo(fileInput: HTMLInputElement) {
    this.selectedFile.set(null);
    this.erroFormato.set(null);
    this.bloqueioConcorrencia.set(false);
    fileInput.value = '';
  }

  baixarArquivoSelecionado() {
    const fileData = this.selectedFile();
    if (!fileData) return;

    if (fileData.rawFile) {
      const url = URL.createObjectURL(fileData.rawFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileData.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  salvar() {
    const fileData = this.selectedFile();
    if (!fileData) return;

    if (this.importacaoService.hasInProcessing()) {
      this.bloqueioConcorrencia.set(true);
      this.mensagemBloqueio.set('Não é possível iniciar outra importação enquanto houver um processamento em andamento.');
      return;
    }

    const res = this.importacaoService.iniciarImportacao(fileData.name, fileData.tamanho);
    if (!res.sucesso) {
      this.bloqueioConcorrencia.set(true);
      this.mensagemBloqueio.set(res.mensagem || 'Não é possível iniciar outra importação enquanto houver um processamento em andamento.');
      return;
    }

    this.toast.success('Carga iniciada', 'A carga foi iniciada com sucesso e está em processamento.');
    this.dialogRef.close(true);
  }

  fechar() {
    this.dialogRef.close(false);
  }
}

/**
 * Tela de Listagem de Importações de Profissionais (/profissionais/importacao)
 */
@Component({
  selector: 'app-importacao-profissionais-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SEmptyStateComponent,
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule,
    AcessoRestritoComponent,
    SiagePaginatorComponent
  ],
  template: `
    @if (!hasAccess()) {
      <app-acesso-restrito backUrl="/inicio" />
    } @else {
      <div class="flex flex-col gap-6 font-sans">
        
        <!-- Cabeçalho com Breadcrumbs, Título com Seta Voltar, Descrição e Botão Nova Carga -->
        <div class="flex flex-col gap-2">
          
          <!-- Breadcrumb: Início / Profissionais / Importação de Profissionais -->
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
            <span 
              (click)="goBack()" 
              (keydown.enter)="goBack()" 
              tabindex="0" 
              role="button" 
              class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline"
            >
              Profissionais
            </span>
            <span class="text-[10px] text-siage-text-secondary/40 select-none" aria-hidden="true">/</span>
            <span class="text-siage-primary font-semibold" aria-current="page">
              Importação de Profissionais
            </span>
          </nav>

          <!-- Bloco de Título com Botão Voltar, Descrição e Botão Nova Carga -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2 sm:gap-3">
                <button 
                  mat-icon-button 
                  type="button"
                  (click)="goBack()" 
                  class="text-siage-text-secondary hover:text-siage-primary transition-colors cursor-pointer -ml-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                  title="Voltar para Profissionais"
                  aria-label="Voltar para Profissionais"
                >
                  <mat-icon style="font-size: 22px; width: 22px; height: 22px;">arrow_back</mat-icon>
                </button>
                <h1 class="text-2xl sm:text-3xl font-poppins font-bold tracking-tight text-siage-text-primary leading-tight">
                  Importação de Profissionais
                </h1>
              </div>
              
              <p class="text-xs sm:text-sm text-siage-text-secondary font-sans leading-normal pl-8 sm:pl-9 max-w-2xl">
                Consulte e acompanhe as importações de profissionais.
              </p>
            </div>

            <!-- Botão Nova carga (alinhado em dimensões ao padrão Adicionar dos CRUDs SEAD) -->
            @if (permissionService.canCreate()) {
              <button 
                type="button"
                (click)="abrirModalNovaCarga()"
                class="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-siage-primary hover:bg-siage-primary/90 text-white font-sans font-semibold text-sm transition-all shadow-xs dark:shadow-none active:scale-[0.99] shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
              >
                <mat-icon style="font-size: 20px; width: 20px; height: 20px;">add</mat-icon>
                <span>Nova carga</span>
              </button>
            }
          </div>
        </div>

        <!-- CARD DE FILTROS (Padrão idêntico aos CRUDs SEAD) -->
        <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs dark:shadow-none">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-start">
            
            <!-- Filtro Arquivo (limite 100 caracteres) -->
            <div class="form-field-group">
              <label for="filter-arquivo" class="siage-field-label">Arquivo</label>
              <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                <input 
                  matInput 
                  id="filter-arquivo"
                  type="text" 
                  maxlength="100"
                  [formControl]="arquivoControl"
                  placeholder="Buscar por arquivo" 
                  (keydown.enter)="onBuscar()"
                  class="text-sm font-sans"
                />
                @if (arquivoControl.value) {
                  <button mat-icon-button matSuffix (click)="arquivoControl.setValue(''); updateBuscarStatus()" aria-label="Limpar campo">
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
                  </button>
                }
              </mat-form-field>
            </div>

            <!-- Filtro Responsável com busca pesquisável -->
            <div class="form-field-group">
              <label for="filter-responsavel" class="siage-field-label">Responsável</label>
              <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                <mat-select [formControl]="responsavelControl" id="filter-responsavel" class="text-sm font-sans">
                  <!-- Campo de pesquisa interna de responsáveis -->
                  <div class="p-2 border-b border-siage-border/40 sticky top-0 bg-siage-surface z-10">
                    <input 
                      matInput 
                      [formControl]="responsavelSearchControl" 
                      placeholder="Pesquisar responsável..." 
                      class="text-xs px-2.5 py-1.5 border border-siage-border rounded-md w-full bg-siage-background text-siage-text-primary focus:outline-none focus:ring-1 focus:ring-siage-primary" 
                      (click)="$event.stopPropagation()"
                      (keydown)="$event.stopPropagation()" 
                    />
                  </div>
                  <mat-option value="TODOS">Todos</mat-option>
                  @for (resp of filteredResponsaveis(); track resp) {
                    <mat-option [value]="resp">{{ resp }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <!-- Filtro Status -->
            <div class="form-field-group">
              <label for="filter-status" class="siage-field-label">Status</label>
              <mat-form-field appearance="outline" class="w-full" subscriptSizing="fixed">
                <mat-select [formControl]="statusControl" id="filter-status" class="text-sm font-sans">
                  <mat-option value="TODOS">Todos</mat-option>
                  <mat-option value="EM_PROCESSAMENTO">Em processamento</mat-option>
                  <mat-option value="CONCLUIDO_COM_SUCESSO">Concluído com sucesso</mat-option>
                  <mat-option value="CONCLUIDO_COM_PENDENCIAS">Concluído com pendências</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>

          <!-- Ações do Filtro: Limpar e Buscar -->
          <div class="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-siage-border/40">
            <button 
              type="button" 
              (click)="onLimpar()"
              class="h-10 px-5 rounded-lg border border-siage-border font-sans font-medium text-sm text-siage-text-primary hover:bg-siage-primary/5 hover:border-siage-primary/30 active:scale-[0.99] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
            >
              Limpar
            </button>
            
            <button 
              type="button" 
              [disabled]="!isBuscarEnabled()"
              (click)="onBuscar()"
              class="inline-flex items-center justify-center gap-1.5 h-10 px-6 rounded-lg bg-siage-primary hover:bg-siage-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-sans font-semibold text-sm transition-all shadow-xs dark:shadow-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
            >
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">search</mat-icon>
              <span>Buscar</span>
            </button>
          </div>
        </div>

        <!-- TABELA DE IMPORTAÇÕES COM ESTADOS EXPLÍCITOS -->
        <div class="bg-siage-surface border border-siage-border rounded-lg shadow-xs dark:shadow-none overflow-hidden">
          
          <!-- ESTADO 1: CARREGANDO (Skeleton) -->
          @if (isCarregando()) {
            <div class="p-4 sm:p-6 space-y-4">
              <div class="h-6 w-48 bg-slate-200 dark:bg-slate-700/50 rounded animate-pulse"></div>
              <div class="space-y-3">
                @for (i of [1, 2, 3, 4, 5]; track i) {
                  <div class="h-12 bg-slate-100 dark:bg-slate-800/40 rounded-lg animate-pulse flex items-center justify-between px-4">
                    <div class="h-4 w-48 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                    <div class="h-4 w-28 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                    <div class="h-4 w-28 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                    <div class="h-4 w-32 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                    <div class="h-5 w-24 bg-slate-200 dark:bg-slate-700/60 rounded-full"></div>
                    <div class="h-6 w-20 bg-slate-200 dark:bg-slate-700/60 rounded"></div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- ESTADO 2: ERRO -->
          @else if (isErro()) {
            <s-empty-state
              variant="error"
              title="Erro ao carregar dados"
              description="Não foi possível carregar as informações desta funcionalidade. Verifique sua conexão e tente novamente."
              actionLabel="Tentar novamente"
              (action)="carregarDados()"
            />
          }

          <!-- ESTADO 3: SEM REGISTROS (BANCO VAZIO) -->
          @else if (isSemRegistros()) {
            <div class="py-16 px-6 flex flex-col items-center justify-center text-center gap-3">
              <div class="w-12 h-12 rounded-lg bg-siage-text-secondary/10 text-siage-text-secondary flex items-center justify-center">
                <mat-icon style="font-size: 24px; width: 24px; height: 24px;">inbox</mat-icon>
              </div>
              <div class="flex flex-col gap-1 max-w-md">
                <h3 class="text-base font-poppins font-semibold text-siage-text-primary">Nenhum registro cadastrado</h3>
                <p class="text-xs sm:text-sm text-siage-text-secondary">
                  Ainda não existem importações cadastradas no sistema.
                </p>
              </div>
            </div>
          }

          <!-- ESTADO 4: SEM RESULTADO DE FILTRO -->
          @else if (isSemResultadoFiltro()) {
            <div class="py-16 px-6 flex flex-col items-center justify-center text-center gap-3">
              <div class="w-12 h-12 rounded-lg bg-siage-text-secondary/10 text-siage-text-secondary flex items-center justify-center">
                <mat-icon style="font-size: 24px; width: 24px; height: 24px;">search_off</mat-icon>
              </div>
              <div class="flex flex-col gap-1 max-w-md">
                <h3 class="text-base font-poppins font-semibold text-siage-text-primary">Nenhum resultado encontrado</h3>
                <p class="text-xs sm:text-sm text-siage-text-secondary">
                  Nenhum registro corresponde aos filtros aplicados.
                </p>
              </div>
            </div>
          } @else {
            <div class="overflow-x-auto w-full">
              <table 
                mat-table 
                [dataSource]="paginatedItems()" 
                class="w-full font-sans border-collapse"
              >
                <!-- Coluna Arquivo (Apresentação limpa SEM ícone de documento) -->
                <ng-container matColumnDef="arquivo">
                  <th mat-header-cell *matHeaderCellDef class="text-left font-sans font-semibold text-xs text-siage-text-secondary py-3.5 px-4 bg-siage-surface border-b border-siage-border">
                    Arquivo
                  </th>
                  <td mat-cell *matCellDef="let row" class="text-left font-sans text-sm font-medium text-siage-text-primary py-3.5 px-4 border-b border-siage-border/50">
                    <span class="truncate max-w-[320px] inline-block" [title]="row.arquivo">{{ row.arquivo }}</span>
                  </td>
                </ng-container>

                <!-- Coluna Data/Hora -->
                <ng-container matColumnDef="dataHora">
                  <th mat-header-cell *matHeaderCellDef class="text-left font-sans font-semibold text-xs text-siage-text-secondary py-3.5 px-4 bg-siage-surface border-b border-siage-border w-40">
                    Data/Hora
                  </th>
                  <td mat-cell *matCellDef="let row" class="text-left font-sans text-sm text-siage-text-primary py-3.5 px-4 border-b border-siage-border/50 whitespace-nowrap">
                    {{ row.dataHora }}
                  </td>
                </ng-container>

                <!-- Coluna Conclusão -->
                <ng-container matColumnDef="conclusao">
                  <th mat-header-cell *matHeaderCellDef class="text-left font-sans font-semibold text-xs text-siage-text-secondary py-3.5 px-4 bg-siage-surface border-b border-siage-border w-40">
                    Conclusão
                  </th>
                  <td mat-cell *matCellDef="let row" class="text-left font-sans text-sm text-siage-text-primary py-3.5 px-4 border-b border-siage-border/50 whitespace-nowrap">
                    {{ row.conclusao }}
                  </td>
                </ng-container>

                <!-- Coluna Responsável -->
                <ng-container matColumnDef="responsavel">
                  <th mat-header-cell *matHeaderCellDef class="text-left font-sans font-semibold text-xs text-siage-text-secondary py-3.5 px-4 bg-siage-surface border-b border-siage-border">
                    Responsável
                  </th>
                  <td mat-cell *matCellDef="let row" class="text-left font-sans text-sm text-siage-text-primary py-3.5 px-4 border-b border-siage-border/50">
                    {{ row.responsavel }}
                  </td>
                </ng-container>

                <!-- Coluna Status (Badges padrão RH V2 sem ícones decorativos internos) -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef class="text-center font-sans font-semibold text-xs text-siage-text-secondary py-3.5 px-4 bg-siage-surface border-b border-siage-border w-44">
                    Status
                  </th>
                  <td mat-cell *matCellDef="let row" class="text-center py-3.5 px-4 border-b border-siage-border/50 whitespace-nowrap">
                    @switch (row.status) {
                      @case ('EM_PROCESSAMENTO') {
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-500/20">
                          Em processamento
                        </span>
                      }
                      @case ('CONCLUIDO_COM_SUCESSO') {
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-500/20">
                          Concluído com sucesso
                        </span>
                      }
                      @case ('CONCLUIDO_COM_PENDENCIAS') {
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-500/30">
                          Concluído com pendências
                        </span>
                      }
                    }
                  </td>
                </ng-container>

                <!-- Coluna Ações (Dimensões, hover e estilo idênticos aos IconButtons SEAD) -->
                <ng-container matColumnDef="acoes">
                  <th mat-header-cell *matHeaderCellDef class="text-center font-sans font-semibold text-xs text-siage-text-secondary py-3.5 px-4 bg-siage-surface border-b border-siage-border w-36">
                    Ações
                  </th>
                  <td mat-cell *matCellDef="let row" class="text-center py-3.5 px-4 border-b border-siage-border/50 whitespace-nowrap">
                    @if (row.id === latestPendenciasId()) {
                      <div class="flex items-center justify-center gap-1">
                        <!-- Ação Visualizar -->
                        <button 
                          type="button" 
                          (click)="visualizarImportacao(row.id)" 
                          matTooltip="Visualizar"
                          aria-label="Visualizar detalhes da importação"
                          class="w-10 h-10 inline-flex items-center justify-center rounded-lg text-siage-text-secondary hover:text-siage-primary hover:bg-siage-primary/8 dark:hover:bg-siage-primary/12 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                        >
                          <mat-icon style="font-size: 20px; width: 20px; height: 20px;">visibility</mat-icon>
                        </button>

                        <!-- Ação Baixar relatório -->
                        <button 
                          type="button" 
                          (click)="baixarRelatorio(row)" 
                          matTooltip="Baixar relatório de pendências (.xlsx)"
                          aria-label="Baixar relatório de pendências (.xlsx)"
                          class="w-10 h-10 inline-flex items-center justify-center rounded-lg text-siage-text-secondary hover:text-siage-primary hover:bg-siage-primary/8 dark:hover:bg-siage-primary/12 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                        >
                          <mat-icon style="font-size: 20px; width: 20px; height: 20px;">download</mat-icon>
                        </button>
                      </div>
                    } @else {
                      <span class="text-siage-text-secondary/70 font-semibold select-none">-</span>
                    }
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr 
                  mat-row 
                  *matRowDef="let row; columns: displayedColumns;"
                  class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                ></tr>
              </table>
            </div>

            <!-- Paginação -->
            <app-siage-paginator 
              [length]="filteredItems().length"
              [pageSize]="pageSize()"
              [pageSizeOptions]="[10, 25, 50]"
              [pageIndex]="pageIndex()"
              (page)="onPageChange($event)"
            ></app-siage-paginator>
          }
        </div>
      </div>
    }
  `
})
export class ImportacaoProfissionaisList implements OnInit {
  private readonly router = inject(Router);
  readonly importacaoService = inject(ImportacaoService);
  readonly permissionService = inject(PermissionService);
  private readonly dialog = inject(MatDialog);
  readonly simulator = inject(SimulatorService);

  readonly hasAccess = computed(() => this.permissionService.hasAccess());
  readonly responsaveis = this.importacaoService.uniqueResponsaveis;
  readonly latestPendenciasId = this.importacaoService.latestConcluidoComPendenciasId;

  readonly displayedColumns = ['arquivo', 'dataHora', 'conclusao', 'responsavel', 'status', 'acoes'];

  readonly arquivoControl = new FormControl('');
  readonly responsavelControl = new FormControl('TODOS');
  readonly responsavelSearchControl = new FormControl('');
  readonly statusControl = new FormControl('TODOS');

  readonly isBuscarEnabled = signal<boolean>(false);

  // Filtros aplicados
  readonly appliedArquivo = signal<string>('');
  readonly appliedResponsavel = signal<string>('TODOS');
  readonly appliedStatus = signal<string>('TODOS');

  // Estados formais do Design System integrados com o simulador de cenários
  readonly isLoading = signal<boolean>(false);
  readonly hasError = signal<boolean>(false);

  readonly hasFiltrosAplicados = computed(() => {
    return !!this.appliedArquivo().trim() ||
           (this.appliedResponsavel() !== 'TODOS' && !!this.appliedResponsavel()) ||
           (this.appliedStatus() !== 'TODOS' && !!this.appliedStatus());
  });

  readonly isCarregando = computed(() => {
    return this.simulator.currentScenario() === 'loading' || this.isLoading();
  });

  readonly isErro = computed(() => {
    return this.simulator.currentScenario() === 'error' || this.hasError();
  });

  readonly isSemRegistros = computed(() => {
    if (this.simulator.currentScenario() === 'empty') return true;
    if (this.simulator.currentScenario() === 'no_filter_results') return false;
    return this.importacaoService.items().length === 0 && !this.hasFiltrosAplicados();
  });

  readonly isSemResultadoFiltro = computed(() => {
    if (this.simulator.currentScenario() === 'no_filter_results') return true;
    if (this.simulator.currentScenario() === 'empty') return false;
    return this.filteredItems().length === 0 && (this.hasFiltrosAplicados() || this.importacaoService.items().length > 0);
  });

  // Paginação
  readonly pageIndex = signal<number>(0);
  readonly pageSize = signal<number>(10);

  readonly filteredResponsaveis = computed(() => {
    const search = this.responsavelSearchControl.value?.toLowerCase().trim() || '';
    if (!search) return this.responsaveis();
    return this.responsaveis().filter(r => r.toLowerCase().includes(search));
  });

  readonly filteredItems = computed(() => {
    const list = this.importacaoService.items();
    const fArquivo = this.appliedArquivo().trim().toLowerCase();
    const fResp = this.appliedResponsavel();
    const fStatus = this.appliedStatus();

    return list
      .filter(item => {
        if (fArquivo && !item.arquivo.toLowerCase().includes(fArquivo)) {
          return false;
        }
        if (fResp && fResp !== 'TODOS' && item.responsavel !== fResp) {
          return false;
        }
        if (fStatus && fStatus !== 'TODOS' && item.status !== fStatus) {
          return false;
        }
        return true;
      })
      .sort((a, b) => parseDataHora(b.dataHora) - parseDataHora(a.dataHora));
  });

  readonly paginatedItems = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredItems().slice(start, start + this.pageSize());
  });

  constructor() {
    this.arquivoControl.valueChanges.subscribe(() => this.updateBuscarStatus());
    this.responsavelControl.valueChanges.subscribe(() => this.updateBuscarStatus());
    this.statusControl.valueChanges.subscribe(() => this.updateBuscarStatus());
  }

  ngOnInit() {
    this.updateBuscarStatus();
  }

  carregarDados() {
    if (!this.permissionService.hasAccess()) {
      this.isLoading.set(false);
      return;
    }
    this.simulator.reset();
    this.isLoading.set(true);
    this.hasError.set(false);
    setTimeout(() => {
      this.isLoading.set(false);
    }, 350);
  }

  updateBuscarStatus() {
    const hasCrit = !!this.arquivoControl.value?.trim() ||
                    (this.responsavelControl.value !== 'TODOS' && !!this.responsavelControl.value) ||
                    (this.statusControl.value !== 'TODOS' && !!this.statusControl.value);
    this.isBuscarEnabled.set(hasCrit);
  }

  onBuscar() {
    this.appliedArquivo.set(this.arquivoControl.value || '');
    this.appliedResponsavel.set(this.responsavelControl.value || 'TODOS');
    this.appliedStatus.set(this.statusControl.value || 'TODOS');
    this.pageIndex.set(0);

    if (this.simulator.currentScenario() === 'no_filter_results') {
      this.simulator.reset();
    }
  }

  onLimpar() {
    this.arquivoControl.setValue('');
    this.responsavelControl.setValue('TODOS');
    this.responsavelSearchControl.setValue('');
    this.statusControl.setValue('TODOS');

    this.appliedArquivo.set('');
    this.appliedResponsavel.set('TODOS');
    this.appliedStatus.set('TODOS');
    this.isBuscarEnabled.set(false);
    this.pageIndex.set(0);

    if (this.simulator.currentScenario() === 'no_filter_results') {
      this.simulator.reset();
    }
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  abrirModalNovaCarga() {
    this.dialog.open(NovaCargaDialog, {
      width: '540px',
      maxWidth: 'calc(100vw - 2rem)',
      disableClose: false,
      autoFocus: false
    });
  }

  visualizarImportacao(id: string) {
    this.router.navigate(['/profissionais/importacao', id]);
  }

  baixarRelatorio(item: ImportacaoItem) {
    this.importacaoService.baixarRelatorio(item);
  }

  goBack() {
    this.router.navigate(['/profissionais']);
  }

  goHome() {
    this.router.navigate(['/inicio']);
  }
}

/**
 * Tela de Detalhes da Importação (/profissionais/importacao/:id)
 * Padronizada com a apresentação de dados informativos de Visualizar Professor.
 */
@Component({
  selector: 'app-importacao-profissionais-detalhes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatTooltipModule,
    AcessoRestritoComponent,
    SiagePaginatorComponent
  ],
  template: `
    @if (!hasAccess()) {
      <app-acesso-restrito backUrl="/profissionais/importacao" />
    } @else {
      <div class="flex flex-col gap-6 font-sans">
        
        <!-- Cabeçalho com Breadcrumbs, Título com Seta Voltar e Descrição -->
        <div class="flex flex-col gap-2">
          
          <!-- Breadcrumb: Início / Profissionais / Importação de Profissionais / Detalhes da Importação -->
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
            <span 
              (click)="goProfissionais()" 
              (keydown.enter)="goProfissionais()" 
              tabindex="0" 
              role="button" 
              class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline"
            >
              Profissionais
            </span>
            <span class="text-[10px] text-siage-text-secondary/40 select-none" aria-hidden="true">/</span>
            <span 
              (click)="voltar()" 
              (keydown.enter)="voltar()" 
              tabindex="0" 
              role="button" 
              class="hover:text-siage-primary cursor-pointer focus:outline-none focus:underline"
            >
              Importação de Profissionais
            </span>
            <span class="text-[10px] text-siage-text-secondary/40 select-none" aria-hidden="true">/</span>
            <span class="text-siage-primary font-semibold" aria-current="page">
              Detalhes da Importação
            </span>
          </nav>

          <!-- Título com Seta Voltar única e Descrição -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2 sm:gap-3">
                <button 
                  mat-icon-button 
                  type="button"
                  (click)="voltar()" 
                  class="text-siage-text-secondary hover:text-siage-primary transition-colors cursor-pointer -ml-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siage-primary/40"
                  title="Voltar para a listagem"
                  aria-label="Voltar para a listagem"
                >
                  <mat-icon style="font-size: 22px; width: 22px; height: 22px;">arrow_back</mat-icon>
                </button>
                <h1 class="text-2xl sm:text-3xl font-poppins font-bold tracking-tight text-siage-text-primary leading-tight">
                  Detalhes da Importação
                </h1>
              </div>
              <p class="text-xs sm:text-sm text-siage-text-secondary font-sans leading-normal pl-8 sm:pl-9 max-w-2xl">
                Consulte os registros e as pendências identificadas na importação.
              </p>
            </div>
          </div>
        </div>

        @if (!importacao()) {
          <!-- Estado: Registro não localizado -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-10 flex flex-col items-center justify-center text-center gap-3">
            <mat-icon class="text-siage-text-secondary text-4xl" style="font-size: 40px; width: 40px; height: 40px;">error_outline</mat-icon>
            <h3 class="text-lg font-poppins font-bold text-siage-text-primary">Importação não localizada</h3>
            <p class="text-xs sm:text-sm text-siage-text-secondary max-w-md">
              O registro de importação solicitado não foi encontrado no sistema ou foi removido.
            </p>
            <button 
              type="button" 
              (click)="voltar()" 
              class="mt-2 h-10 px-6 rounded-lg bg-siage-primary text-white font-sans font-semibold text-sm hover:bg-siage-primary/90 transition-all cursor-pointer"
            >
              Voltar à listagem
            </button>
          </div>
        } @else {
          <!-- 1. BLOCO DE INFORMAÇÕES (Padrão de dados informativos de Visualizar Professor) -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <h3 class="text-sm font-poppins font-bold uppercase tracking-wider text-siage-primary flex items-center gap-2 border-b border-siage-border/40 pb-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">description</mat-icon>
              <span>Informações da Importação</span>
            </h3>

            <!-- Grade uniforme consistente de 12 colunas -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              <!-- Nome do arquivo (quebra de linha permitida, sem ícone decorativo) -->
              <div class="flex flex-col gap-1 md:col-span-4">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Arquivo</span>
                <span class="text-sm font-medium text-siage-text-primary break-words">
                  {{ importacao()?.arquivo }}
                </span>
              </div>

              <!-- Data/Hora de início -->
              <div class="flex flex-col gap-1 md:col-span-4">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data/Hora de Início</span>
                <span class="text-sm font-sans font-medium text-siage-text-primary">
                  {{ importacao()?.dataHora }}
                </span>
              </div>

              <!-- Data/Hora de conclusão -->
              <div class="flex flex-col gap-1 md:col-span-4">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Data/Hora de Conclusão</span>
                <span class="text-sm font-sans font-medium text-siage-text-primary">
                  {{ importacao()?.conclusao }}
                </span>
              </div>

              <!-- Responsável -->
              <div class="flex flex-col gap-1 md:col-span-4">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Responsável</span>
                <span class="text-sm font-medium text-siage-text-primary break-words">
                  {{ importacao()?.responsavel }}
                </span>
              </div>

              <!-- Quantidade de registros com sucesso (valor informativo convencional, sem badges) -->
              <div class="flex flex-col gap-1 md:col-span-4">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Registros com Sucesso</span>
                <span class="text-sm font-medium text-siage-text-primary">
                  {{ importacao()?.registrosSucesso }}
                </span>
              </div>

              <!-- Quantidade de registros com pendências (valor informativo convencional, sem badges) -->
              <div class="flex flex-col gap-1 md:col-span-4">
                <span class="text-xs uppercase text-siage-text-secondary font-semibold">Registros com Pendências</span>
                <span class="text-sm font-medium text-siage-text-primary">
                  {{ importacao()?.pendenciasQtd }}
                </span>
              </div>
            </div>
          </div>

          <!-- 2. TABELA DE PENDÊNCIAS (Padrão visual das tabelas do RH V2) -->
          <div class="bg-siage-surface border border-siage-border rounded-lg shadow-xs dark:shadow-none overflow-hidden">
            <div class="px-5 sm:px-6 py-4 border-b border-siage-border/40">
              <h2 class="text-base font-poppins font-bold text-siage-text-primary">
                Pendências identificadas
              </h2>
            </div>

            @if (!importacao()?.pendencias || importacao()!.pendencias.length === 0) {
              <div class="py-14 px-6 flex flex-col items-center justify-center text-center gap-2">
                <div class="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <mat-icon style="font-size: 24px; width: 24px; height: 24px;">task_alt</mat-icon>
                </div>
                <h3 class="text-base font-poppins font-semibold text-siage-text-primary">Nenhuma pendência identificada</h3>
                <p class="text-xs sm:text-sm text-siage-text-secondary">
                  Todos os registros da planilha foram processados com sucesso.
                </p>
              </div>
            } @else {
              <div class="overflow-x-auto w-full">
                <table 
                  mat-table 
                  [dataSource]="paginatedPendencias()" 
                  class="w-full font-sans border-collapse"
                >
                  <!-- Matrícula -->
                  <ng-container matColumnDef="matricula">
                    <th mat-header-cell *matHeaderCellDef class="text-left font-sans font-semibold text-xs text-siage-text-secondary py-3.5 px-4 bg-siage-surface border-b border-siage-border w-36">
                      Matrícula
                    </th>
                    <td mat-cell *matCellDef="let p" class="text-left font-mono font-medium text-sm text-siage-text-primary py-3.5 px-4 border-b border-siage-border/50 whitespace-nowrap">
                      {{ p.matricula }}
                    </td>
                  </ng-container>

                  <!-- Nome -->
                  <ng-container matColumnDef="nome">
                    <th mat-header-cell *matHeaderCellDef class="text-left font-sans font-semibold text-xs text-siage-text-secondary py-3.5 px-4 bg-siage-surface border-b border-siage-border w-64">
                      Nome
                    </th>
                    <td mat-cell *matCellDef="let p" class="text-left font-sans font-medium text-sm text-siage-text-primary py-3.5 px-4 border-b border-siage-border/50 whitespace-nowrap">
                      {{ p.nome }}
                    </td>
                  </ng-container>

                  <!-- CPF -->
                  <ng-container matColumnDef="cpf">
                    <th mat-header-cell *matHeaderCellDef class="text-left font-sans font-semibold text-xs text-siage-text-secondary py-3.5 px-4 bg-siage-surface border-b border-siage-border w-40">
                      CPF
                    </th>
                    <td mat-cell *matCellDef="let p" class="text-left font-mono text-sm text-siage-text-primary py-3.5 px-4 border-b border-siage-border/50 whitespace-nowrap">
                      {{ p.cpf }}
                    </td>
                  </ng-container>

                  <!-- Pendência (Quebra normal de linha permitida para mensagens extensas) -->
                  <ng-container matColumnDef="motivo">
                    <th mat-header-cell *matHeaderCellDef class="text-left font-sans font-semibold text-xs text-siage-text-secondary py-3.5 px-4 bg-siage-surface border-b border-siage-border">
                      Pendência
                    </th>
                    <td mat-cell *matCellDef="let p" class="text-left font-sans text-sm text-siage-text-primary leading-relaxed whitespace-normal break-words py-3.5 px-4 border-b border-siage-border/50">
                      {{ p.motivo }}
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedPendenciaColumns"></tr>
                  <tr 
                    mat-row 
                    *matRowDef="let row; columns: displayedPendenciaColumns;"
                    class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  ></tr>
                </table>
              </div>

              <!-- Paginação de Pendências (10 registros por página) -->
              <app-siage-paginator 
                [length]="importacao()?.pendencias?.length || 0"
                [pageSize]="10"
                [pageIndex]="pageIndex()"
                (page)="onPageChange($event)"
              ></app-siage-paginator>
            }
          </div>
        }
      </div>
    }
  `
})
export class ImportacaoProfissionaisDetalhes implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly importacaoService = inject(ImportacaoService);
  private readonly permissionService = inject(PermissionService);

  readonly hasAccess = computed(() => this.permissionService.hasAccess());
  readonly importacaoId = signal<string>('');
  readonly importacao = computed(() => this.importacaoService.getById(this.importacaoId()));

  readonly displayedPendenciaColumns = ['matricula', 'nome', 'cpf', 'motivo'];

  readonly pageIndex = signal<number>(0);

  readonly paginatedPendencias = computed(() => {
    const list = this.importacao()?.pendencias || [];
    const start = this.pageIndex() * 10;
    return list.slice(start, start + 10);
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.importacaoId.set(id);
    }
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
  }

  voltar() {
    this.router.navigate(['/profissionais/importacao']);
  }

  goProfissionais() {
    this.router.navigate(['/profissionais']);
  }

  goHome() {
    this.router.navigate(['/inicio']);
  }
}

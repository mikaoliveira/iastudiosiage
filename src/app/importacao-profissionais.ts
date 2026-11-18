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
import {SButtonComponent, SCardComponent, SEmptyStateComponent, SFieldComponent, SIconButtonComponent, SInputComponent, SModalComponent, SModalFooterDirective, SPageHeaderComponent, SSelectComponent, STableColumn, STableComponent} from '@siage/siage-ui';
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
  imports: [CommonModule, MatIconModule, MatButtonModule, SButtonComponent, SIconButtonComponent, SModalComponent, SModalFooterDirective],
  template: `
    <s-modal title="Nova carga" width="540px" (cancel)="fechar()">
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
              <s-button variant="secondary" outlined icon="upload_file" (click)="fileInput.click()">Escolher arquivo</s-button>

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
                <s-icon-button icon="download" label="Baixar arquivo selecionado" size="sm" text (click)="baixarArquivoSelecionado()" />
                <s-icon-button icon="delete_outline" label="Remover arquivo" size="sm" variant="destructive" text (click)="removerArquivo(fileInput)" />
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
      <div sModalFooter>
        <s-button variant="secondary" outlined (click)="fechar()">Cancelar</s-button>
        <s-button variant="primary" [disabled]="!selectedFile()" (click)="salvar()">Salvar</s-button>
      </div>
    </s-modal>
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
    SButtonComponent,
    SCardComponent,
    SFieldComponent,
    SIconButtonComponent,
    SInputComponent,
    SPageHeaderComponent,
    SSelectComponent,
    STableComponent,
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
  styles: [`
    @media (max-width: 640px) {
      :host ::ng-deep .s-page-header__linha { flex-wrap: wrap; }
      :host ::ng-deep s-page-header .s-page-header__texto { flex: 1 1 calc(100% - 56px); }
      :host ::ng-deep .s-page-header__acao { margin-left: 56px; }
    }
  `],
  template: `
    @if (!hasAccess()) {
      <app-acesso-restrito backUrl="/inicio" />
    } @else {
      <div class="flex flex-col gap-6 font-sans">
        
        <s-page-header
          [breadcrumbs]="breadcrumbs"
          title="Importação de Profissionais"
          description="Consulte e acompanhe as importações de profissionais."
          showBack
          (back)="goBack()"
        >
          @if (permissionService.canCreate()) {
            <s-button action variant="primary" icon="add" (click)="abrirModalNovaCarga()">Nova carga</s-button>
          }
        </s-page-header>

        <!-- CARD DE FILTROS (Padrão idêntico aos CRUDs SEAD) -->
        <s-card [padding]="24" [elevation]="0">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-start">
            
            <!-- Filtro Arquivo (limite 100 caracteres) -->
            <s-field label="Arquivo" controlId="filter-arquivo">
              <s-input [formControl]="arquivoControl" [maxlength]="100" placeholder="Buscar por arquivo" (keydown.enter)="onBuscar()" />
              @if (arquivoControl.value) {
                <s-icon-button icon="close" label="Limpar campo" size="sm" text (click)="arquivoControl.setValue(''); updateBuscarStatus()" />
              }
            </s-field>

            <s-field label="Responsável" controlId="filter-responsavel">
              <s-select [formControl]="responsavelControl" [options]="responsavelOptions()" [clearable]="false" filterable filterPlaceholder="Pesquisar responsável..." />
            </s-field>

            <!-- Filtro Status -->
            <s-field label="Status" controlId="filter-status">
              <s-select [formControl]="statusControl" [options]="statusOptions" [clearable]="false" />
            </s-field>
          </div>

          <!-- Ações do Filtro: Limpar e Buscar -->
          <div class="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-siage-border/40">
            <s-button variant="secondary" outlined (click)="onLimpar()">Limpar</s-button>
            <s-button variant="primary" icon="search" [disabled]="!isBuscarEnabled()" (click)="onBuscar()">Buscar</s-button>
          </div>
        </s-card>

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
            <s-table label="Importações de profissionais" [columns]="tableColumns" [rows]="paginatedItems()" frameless>
              <ng-template #customActions let-row>
                @if (row.id === latestPendenciasId()) {
                  <s-icon-button icon="visibility" label="Visualizar detalhes da importação" size="sm" text (click)="visualizarImportacao(row.id)" />
                  <s-icon-button icon="download" label="Baixar relatório de pendências (.xlsx)" size="sm" text (click)="baixarRelatorio(row)" />
                } @else {
                  <span>-</span>
                }
              </ng-template>
            </s-table>

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
  readonly breadcrumbs = [
    {label: 'Início', routerLink: '/inicio'},
    {label: 'Profissionais', routerLink: '/profissionais'},
    {label: 'Importação de Profissionais'}
  ];
  readonly statusOptions = [
    {label: 'Todos', value: 'TODOS'},
    {label: 'Em processamento', value: 'EM_PROCESSAMENTO'},
    {label: 'Concluído com sucesso', value: 'CONCLUIDO_COM_SUCESSO'},
    {label: 'Concluído com pendências', value: 'CONCLUIDO_COM_PENDENCIAS'}
  ];
  readonly tableColumns: STableColumn<ImportacaoItem>[] = [
    {key: 'arquivo', label: 'Arquivo', truncate: true},
    {key: 'dataHora', label: 'Data/Hora'},
    {key: 'conclusao', label: 'Conclusão'},
    {key: 'responsavel', label: 'Responsável'},
    {key: 'status', label: 'Status', align: 'center', badge: item => {
      switch (item.status) {
        case 'EM_PROCESSAMENTO': return {label: 'Em processamento', tone: 'info'};
        case 'CONCLUIDO_COM_SUCESSO': return {label: 'Concluído com sucesso', tone: 'success'};
        case 'CONCLUIDO_COM_PENDENCIAS': return {label: 'Concluído com pendências', tone: 'warning', icon: 'warning'};
      }
    }}
  ];
  readonly responsaveis = this.importacaoService.uniqueResponsaveis;
  readonly responsavelOptions = computed(() => [
    {label: 'Todos', value: 'TODOS'},
    ...this.responsaveis().map(responsavel => ({label: responsavel, value: responsavel}))
  ]);
  readonly latestPendenciasId = this.importacaoService.latestConcluidoComPendenciasId;

  readonly displayedColumns = ['arquivo', 'dataHora', 'conclusao', 'responsavel', 'status', 'acoes'];

  readonly arquivoControl = new FormControl('');
  readonly responsavelControl = new FormControl('TODOS');
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
    SButtonComponent,
    SPageHeaderComponent,
    STableComponent,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatTooltipModule,
    AcessoRestritoComponent,
    SiagePaginatorComponent
  ],
  styles: [`
    :host ::ng-deep s-table .s-table__tabela { min-width: 760px; }
    .titulo-card {
      margin: 0;
      font-family: var(--font-display);
      font-size: var(--text-h6, 16px);
      font-weight: var(--weight-semibold, 600);
      line-height: var(--leading-tight, 1.2);
      color: var(--text-primary);
    }
  `],
  template: `
    @if (!hasAccess()) {
      <app-acesso-restrito backUrl="/profissionais/importacao" />
    } @else {
      <div class="flex flex-col gap-6 font-sans">
        
        <s-page-header
          [breadcrumbs]="breadcrumbs"
          title="Detalhes da Importação"
          description="Consulte os registros e as pendências identificadas na importação."
          showBack
          (back)="voltar()"
        />

        @if (!importacao()) {
          <!-- Estado: Registro não localizado -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-10 flex flex-col items-center justify-center text-center gap-3">
            <mat-icon class="text-siage-text-secondary text-4xl" style="font-size: 40px; width: 40px; height: 40px;">error_outline</mat-icon>
            <h3 class="text-lg font-poppins font-bold text-siage-text-primary">Importação não localizada</h3>
            <p class="text-xs sm:text-sm text-siage-text-secondary max-w-md">
              O registro de importação solicitado não foi encontrado no sistema ou foi removido.
            </p>
            <s-button variant="primary" (click)="voltar()">Voltar à listagem</s-button>
          </div>
        } @else {
          <!-- 1. BLOCO DE INFORMAÇÕES (Padrão de dados informativos de Visualizar Professor) -->
          <div class="bg-siage-surface border border-siage-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <h3 class="titulo-card border-b border-siage-border/40 pb-2">
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
              <h2 class="titulo-card">
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
              <s-table label="Pendências identificadas" [columns]="pendenciaColumns" [rows]="paginatedPendencias()" frameless />

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
  readonly breadcrumbs = [
    {label: 'Início', routerLink: '/inicio'},
    {label: 'Profissionais', routerLink: '/profissionais'},
    {label: 'Importação de Profissionais', routerLink: '/profissionais/importacao'},
    {label: 'Detalhes da Importação'}
  ];
  readonly pendenciaColumns: STableColumn<PendenciaItem>[] = [
    {key: 'matricula', label: 'Matrícula', width: '144px'},
    {key: 'nome', label: 'Nome', width: '256px'},
    {key: 'cpf', label: 'CPF', width: '160px'},
    {key: 'motivo', label: 'Pendência'}
  ];
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

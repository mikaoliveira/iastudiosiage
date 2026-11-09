import {AbstractControl, FormGroup, Validators} from '@angular/forms';
import {ModalService} from './modal';

/**
 * Utilitário para verificar alterações não salvas e gerenciar confirmação de cancelamento
 * em formulários do SIAGE-RH V2 (Cadastrar e Editar).
 *
 * Regras:
 * 1. Ao abrir Cadastrar: estado inicial = valores default do form.
 * 2. Ao abrir Editar: estado inicial = valores carregados do registro.
 * 3. Se usuário alterar campo e desfizer (voltando ao estado inicial), hasChanges = false.
 * 4. Espaços vazios em strings devem ser normalizados ou comparados estritamente.
 * 5. Se hasChanges() === false -> executa ação de saída imediatamente, sem abrir modal.
 * 6. Se hasChanges() === true -> abre Modal universal de confirmação:
 *    - Título: "Tem certeza que deseja cancelar?"
 *    - Mensagem: "As alterações não salvas serão perdidas."
 *    - Botões: "Não" (fecha modal) e "Sim, cancelar" (executa saída).
 */
export class FormCancelHandler {
  private initialSnapshot = '';
  private initialRawValues: Record<string, unknown> = {};
  private isDiscarded = false;

  constructor(
    private readonly form: FormGroup,
    private readonly modalService: ModalService,
    private readonly onExitCallback: () => void
  ) {
    this.captureInitialState();
  }

  /**
   * Captura o estado limpo inicial (chamado na inicialização ou após carregar registro).
   */
  captureInitialState() {
    this.initialRawValues = JSON.parse(JSON.stringify(this.form.getRawValue()));
    this.initialSnapshot = JSON.stringify(this.getCleanRawValue());
    this.isDiscarded = false;
  }

  /**
   * Descarta as alterações não salvas, restaurando o formulário para os valores iniciais.
   */
  discardChanges() {
    this.isDiscarded = true;
    this.form.reset(this.initialRawValues, { emitEvent: false });
    this.initialSnapshot = JSON.stringify(this.getCleanRawValue());
  }

  /**
   * Normaliza os valores do formulário para comparação consistente.
   * Strings vazias/espaços são tratadas como string vazia para evitar falsos positivos.
   */
  private getCleanRawValue(): Record<string, unknown> {
    const raw = this.form.getRawValue() as Record<string, unknown>;
    const clean: Record<string, unknown> = {};

    for (const key of Object.keys(raw)) {
      const val = raw[key];
      if (typeof val === 'string') {
        clean[key] = val.trim();
      } else if (val === null || val === undefined) {
        clean[key] = null;
      } else {
        clean[key] = val;
      }
    }

    return clean;
  }

  /**
   * Verifica se um controle possui a validação de obrigatoriedade (Validators.required).
   */
  private isFieldRequired(controlName: string): boolean {
    const control = this.form.get(controlName);
    if (!control) {
      return false;
    }
    if (typeof control.hasValidator === 'function') {
      return control.hasValidator(Validators.required);
    }
    if (control.validator) {
      const validatorResult = control.validator({ value: null } as AbstractControl);
      return !!(validatorResult && validatorResult['required']);
    }
    return false;
  }

  /**
   * Verifica se algum campo obrigatório está preenchido no formulário.
   * Regra do usuário: O modal "Tem certeza que deseja cancelar?" só deve ser exibido
   * quando os campos obrigatórios estiverem preenchidos (possuírem valor não vazio).
   */
  hasUnsavedChanges(): boolean {
    if (this.isDiscarded) {
      return false;
    }

    const raw = this.form.getRawValue() as Record<string, unknown>;

    // Localiza os campos que são obrigatórios no formulário
    const requiredFieldKeys = Object.keys(raw).filter(key => this.isFieldRequired(key));

    // Se houver campos obrigatórios configurados, verifica se pelo menos um deles está preenchido
    if (requiredFieldKeys.length > 0) {
      const hasAnyRequiredFieldFilled = requiredFieldKeys.some(key => {
        const val = raw[key];
        if (typeof val === 'string') {
          return val.trim().length > 0;
        }
        return val !== null && val !== undefined && val !== '';
      });

      return hasAnyRequiredFieldFilled;
    }

    // Fallback caso não haja campos obrigatórios definidos
    const currentSnapshot = JSON.stringify(this.getCleanRawValue());
    return currentSnapshot !== this.initialSnapshot;
  }

  /**
   * Dispara o fluxo de cancelamento:
   * Se NÃO houver alterações -> sai imediatamente.
   * Se HOUVER alterações -> abre modal com "Não" e "Sim, cancelar".
   * Ao confirmar no "Sim, cancelar" -> descarta alterações e executa retorno para a listagem.
   */
  handleCancel() {
    if (!this.hasUnsavedChanges()) {
      this.onExitCallback();
      return;
    }

    const dialogRef = this.modalService.confirmarCancelamento();
    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.discardChanges();
        this.onExitCallback();
      }
    });
  }
}

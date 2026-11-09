import {
  Component,
  input,
  signal,
  computed,
  ElementRef,
  inject,
  HostListener,
  ChangeDetectionStrategy,
  forwardRef,
  ViewChild,
  ChangeDetectorRef,
  DoCheck,
  effect
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule, MatInput } from '@angular/material/input';
import { ErrorStateMatcher } from '@angular/material/core';

export interface CalendarDay {
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

export class CustomDatePickerErrorMatcher implements ErrorStateMatcher {
  constructor(private checkError: () => boolean) {}
  isErrorState(): boolean {
    return this.checkError();
  }
}

@Component({
  selector: 'app-siage-date-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatFormFieldModule, MatInputModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SiageDatePickerComponent),
      multi: true
    }
  ],
  host: {
    'class': 'block w-full',
    '[class.has-date-error]': 'hasErrorState()'
  },
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    /* Aplica o mesmo estado visual de erro dos demais campos (borda vermelha completa) */
    :host.has-date-error .mdc-notched-outline__leading,
    :host.has-date-error .mdc-notched-outline__notch,
    :host.has-date-error .mdc-notched-outline__trailing {
      border-color: var(--mat-sys-error, #dc2626) !important;
    }

    :host.has-date-error .mat-mdc-text-field-wrapper:hover .mdc-notched-outline__leading,
    :host.has-date-error .mat-mdc-text-field-wrapper:hover .mdc-notched-outline__notch,
    :host.has-date-error .mat-mdc-text-field-wrapper:hover .mdc-notched-outline__trailing {
      border-color: var(--mat-sys-error, #dc2626) !important;
    }

    :host.has-date-error .mat-focused .mdc-notched-outline__leading,
    :host.has-date-error .mat-focused .mdc-notched-outline__notch,
    :host.has-date-error .mat-focused .mdc-notched-outline__trailing {
      border-color: var(--mat-sys-error, #dc2626) !important;
      border-width: 2px !important;
    }

    :host.has-date-error .mat-mdc-form-field-error {
      color: var(--mat-sys-error, #dc2626) !important;
      font-size: 0.75rem !important;
      line-height: 1.25rem !important;
      display: block !important;
    }
  `],
  template: `
    <div class="relative w-full form-field-group" #datePickerContainer>
      <label [for]="inputId()" class="siage-field-label">
        <span>{{ label() }}</span>
        @if (required()) {
          <span class="text-red-500 font-bold">*</span>
        }
      </label>

      <mat-form-field
        appearance="outline"
        class="w-full relative"
        [class.mat-form-field-invalid]="hasErrorState()"
        [class.mdc-text-field--invalid]="hasErrorState()"
        subscriptSizing="fixed"
      >
        <input
          #dateInputRef
          matInput
          [id]="inputId()"
          type="text"
          placeholder="DD/MM/AAAA"
          [value]="displayValue()"
          (input)="onTextInput($event)"
          (blur)="onInputBlur()"
          [disabled]="disabled()"
          [errorStateMatcher]="errorMatcher"
          maxlength="10"
          autocomplete="off"
          class="text-sm font-mono"
        />

        <button
          matSuffix
          type="button"
          (click)="toggleCalendar($event)"
          [disabled]="disabled()"
          class="text-siage-text-secondary hover:text-siage-primary p-1.5 rounded transition-colors mr-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none"
          title="Abrir calendário"
          aria-label="Abrir calendário"
        >
          <mat-icon style="font-size: 20px; width: 20px; height: 20px;">calendar_today</mat-icon>
        </button>

        @if (hasErrorState()) {
          <mat-error>{{ currentErrorMessage() }}</mat-error>
        }
      </mat-form-field>

      <!-- POPUP DO CALENDÁRIO -->
      @if (isOpen()) {
        <div
          class="absolute left-0 top-[72px] z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 w-[290px] select-none text-slate-800 dark:text-slate-100"
        >
          <!-- Cabeçalho: Mês e Ano + Navegação -->
          <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              (click)="prevMonth($event)"
              class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-siage-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Mês anterior"
            >
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">chevron_left</mat-icon>
            </button>

            <div class="flex items-center gap-1.5">
              <span class="font-poppins font-semibold text-xs text-slate-800 dark:text-slate-100">
                {{ monthNames[viewMonth()] }}
              </span>
              <select
                [value]="viewYear()"
                (change)="onYearSelect($event)"
                class="bg-transparent font-poppins font-semibold text-xs text-slate-800 dark:text-slate-100 cursor-pointer outline-none hover:text-siage-primary focus:text-siage-primary border-b border-dotted border-slate-300 dark:border-slate-600 pb-0.5"
              >
                @for (y of yearRange; track y) {
                  <option [value]="y" class="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                    {{ y }}
                  </option>
                }
              </select>
            </div>

            <button
              type="button"
              (click)="nextMonth($event)"
              class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-siage-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Próximo mês"
            >
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">chevron_right</mat-icon>
            </button>
          </div>

          <!-- Cabeçalho dos dias da semana -->
          <div class="grid grid-cols-7 gap-1 text-center mb-1">
            @for (dow of dayOfWeekNames; track dow) {
              <span class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-0.5">
                {{ dow }}
              </span>
            }
          </div>

          <!-- Grade de dias -->
          <div class="grid grid-cols-7 gap-1 text-center">
            @for (d of calendarDays(); track $index) {
              <button
                type="button"
                (click)="selectDay(d, $event)"
                class="w-8 h-8 rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer font-sans"
                [class.bg-siage-primary]="d.isSelected"
                [class.text-white]="d.isSelected"
                [class.font-bold]="d.isSelected"
                [class.shadow-xs]="d.isSelected"
                [class.text-slate-800]="!d.isSelected && d.isCurrentMonth"
                [class.dark:text-slate-200]="!d.isSelected && d.isCurrentMonth"
                [class.text-slate-400]="!d.isSelected && !d.isCurrentMonth"
                [class.dark:text-slate-600]="!d.isSelected && !d.isCurrentMonth"
                [class.border]="!d.isSelected && d.isToday"
                [class.border-siage-primary]="!d.isSelected && d.isToday"
                [class.font-semibold]="!d.isSelected && d.isToday"
                [class.hover:bg-slate-100]="!d.isSelected"
                [class.dark:hover:bg-slate-800]="!d.isSelected"
              >
                {{ d.day }}
              </button>
            }
          </div>

          <!-- Rodapé com Ações: Limpar e Hoje -->
          <div class="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              (click)="onLimpar($event)"
              class="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 px-2.5 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
            >
              Limpar
            </button>

            <button
              type="button"
              (click)="onHoje($event)"
              class="text-xs font-semibold text-siage-primary hover:bg-siage-primary/10 px-3 py-1 rounded-md transition-colors cursor-pointer"
            >
              Hoje
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class SiageDatePickerComponent implements ControlValueAccessor, DoCheck {
  readonly id = input<string>('date-input-' + Math.random().toString(36).substring(2, 7));
  readonly label = input<string>('');
  readonly required = input<boolean>(false);
  readonly errorMessage = input<string>('');
  readonly control = input<FormControl | null>(null);

  readonly elementRef = inject(ElementRef);
  readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('dateInputRef', { static: false }) dateInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild(MatInput, { static: false }) matInput?: MatInput;

  readonly hasErrorState = signal<boolean>(false);
  readonly errorMatcher = new CustomDatePickerErrorMatcher(() => this.hasErrorState());

  readonly currentErrorMessage = computed(() => {
    const ctrl = this.control();
    if (ctrl && ctrl.errors) {
      if (ctrl.errors['dataRange']) {
        return ctrl.errors['dataRange'];
      }
      if (ctrl.errors['dataFormato']) {
        return ctrl.errors['dataFormato'];
      }
      if (ctrl.errors['required']) {
        return this.errorMessage() || 'Campo obrigatório.';
      }
      const firstKey = Object.keys(ctrl.errors)[0];
      if (typeof ctrl.errors[firstKey] === 'string') {
        return ctrl.errors[firstKey];
      }
    }
    return this.errorMessage() || 'Campo obrigatório.';
  });

  readonly inputId = computed(() => {
    const raw = this.id();
    return raw ? `${raw}-input` : 'date-input-' + Math.random().toString(36).substring(2, 7);
  });

  readonly disabled = signal<boolean>(false);
  readonly isOpen = signal<boolean>(false);
  readonly displayValue = signal<string>('');

  readonly viewMonth = signal<number>(new Date().getMonth());
  readonly viewYear = signal<number>(new Date().getFullYear());
  readonly selectedDate = signal<Date | null>(null);

  readonly monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  readonly dayOfWeekNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Anos disponíveis para seleção direta (ex: 1940 a 2035)
  readonly yearRange: number[] = Array.from(
    { length: 96 },
    (_, idx) => new Date().getFullYear() + 5 - idx
  );

  onChange: (val: string) => void = () => {
    /* noop */
  };
  onTouched: () => void = () => {
    /* noop */
  };

  readonly calendarDays = computed(() => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];
    const today = new Date();
    const sel = this.selectedDate();

    // Dias do mês anterior para completar o início da semana
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      const m = month === 0 ? 11 : month - 1;
      const y = month === 0 ? year - 1 : year;
      days.push({
        day: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        isToday: today.getDate() === d && today.getMonth() === m && today.getFullYear() === y,
        isSelected: !!sel && sel.getDate() === d && sel.getMonth() === m && sel.getFullYear() === y
      });
    }

    // Dias do mês atual
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        month: month,
        year: year,
        isCurrentMonth: true,
        isToday: today.getDate() === i && today.getMonth() === month && today.getFullYear() === year,
        isSelected: !!sel && sel.getDate() === i && sel.getMonth() === month && sel.getFullYear() === year
      });
    }

    // Dias do próximo mês para completar 35 ou 42 células
    const targetLength = days.length > 35 ? 42 : 35;
    const remaining = targetLength - days.length;
    for (let i = 1; i <= remaining; i++) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      days.push({
        day: i,
        month: m,
        year: y,
        isCurrentMonth: false,
        isToday: today.getDate() === i && today.getMonth() === m && today.getFullYear() === y,
        isSelected: !!sel && sel.getDate() === i && sel.getMonth() === m && sel.getFullYear() === y
      });
    }

    return days;
  });

  constructor() {
    effect((onCleanup) => {
      const ctrl = this.control();
      if (ctrl) {
        const sub = ctrl.statusChanges.subscribe(() => {
          this.reavaliarEstadoErro();
        });
        onCleanup(() => sub.unsubscribe());
      }
    });
  }

  ngDoCheck(): void {
    this.reavaliarEstadoErro();
  }

  focus(): void {
    this.dateInputRef?.nativeElement?.focus();
  }

  private reavaliarEstadoErro(): void {
    const ctrl = this.control();
    if (ctrl) {
      const isErr = ctrl.invalid && (ctrl.touched || ctrl.dirty);
      if (isErr !== this.hasErrorState()) {
        this.hasErrorState.set(isErr);
        this.matInput?.updateErrorState();
        this.cdr.markForCheck();
      }
    } else if (this.hasErrorState()) {
      this.hasErrorState.set(false);
      this.matInput?.updateErrorState();
      this.cdr.markForCheck();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.isOpen()) return;
    const clickedInside = this.elementRef.nativeElement.contains(event.target as Node);
    if (!clickedInside) {
      this.isOpen.set(false);
      this.onTouched();
      this.reavaliarEstadoErro();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isOpen()) {
      this.isOpen.set(false);
      this.onTouched();
      this.reavaliarEstadoErro();
    }
  }

  writeValue(val: unknown): void {
    const str = typeof val === 'string' ? val.trim() : '';
    if (!str) {
      this.displayValue.set('');
      this.selectedDate.set(null);
      this.reavaliarEstadoErro();
      return;
    }

    // Se já estiver em DD/MM/AAAA
    if (str.includes('/')) {
      this.displayValue.set(str);
      const parts = str.split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        if (d && m && y) {
          const dateObj = new Date(y, m - 1, d);
          this.selectedDate.set(dateObj);
          this.viewMonth.set(m - 1);
          this.viewYear.set(y);
        }
      }
      this.reavaliarEstadoErro();
      return;
    }

    // Se estiver em YYYY-MM-DD
    if (str.includes('-')) {
      const parts = str.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (y && m && d) {
          const brFormatted = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
          this.displayValue.set(brFormatted);
          const dateObj = new Date(y, m - 1, d);
          this.selectedDate.set(dateObj);
          this.viewMonth.set(m - 1);
          this.viewYear.set(y);
          this.reavaliarEstadoErro();
          return;
        }
      }
    }

    this.displayValue.set(str);
    this.reavaliarEstadoErro();
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onTextInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').substring(0, 8);

    let formatted = digits;
    if (digits.length > 2) {
      formatted = `${digits.substring(0, 2)}/${digits.substring(2)}`;
    }
    if (digits.length > 4) {
      formatted = `${digits.substring(0, 2)}/${digits.substring(2, 4)}/${digits.substring(4, 8)}`;
    }

    input.value = formatted;
    this.displayValue.set(formatted);

    const ctrl = this.control();

    // Se preencheu 10 caracteres (DD/MM/AAAA)
    if (formatted.length === 10) {
      const parts = formatted.split('/');
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);

      const isValid = this.isDateValid(d, m, y);
      if (isValid) {
        const dateObj = new Date(y, m - 1, d);
        this.selectedDate.set(dateObj);
        this.viewMonth.set(m - 1);
        this.viewYear.set(y);
        const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        this.onChange(iso);
        if (ctrl) {
          ctrl.setValue(iso);
          ctrl.updateValueAndValidity();
        }
        this.reavaliarEstadoErro();
        return;
      }
    }

    // Se estiver vazio ou incompleto
    this.selectedDate.set(null);
    this.onChange('');
    if (ctrl) {
      ctrl.setValue('');
      ctrl.updateValueAndValidity();
    }
    this.reavaliarEstadoErro();
  }

  onInputBlur() {
    this.onTouched();
    const ctrl = this.control();
    if (ctrl) {
      ctrl.markAsTouched();
      ctrl.updateValueAndValidity();
    }
    const val = this.displayValue();
    if (val && val.length < 10) {
      // Valor incompleto
      this.onChange('');
      if (ctrl) {
        ctrl.setValue('');
        ctrl.updateValueAndValidity();
      }
    }
    this.reavaliarEstadoErro();
  }

  toggleCalendar(event: MouseEvent) {
    event.stopPropagation();
    if (this.disabled()) return;
    this.isOpen.update(v => !v);
  }

  prevMonth(event: MouseEvent) {
    event.stopPropagation();
    const curr = this.viewMonth();
    if (curr === 0) {
      this.viewMonth.set(11);
      this.viewYear.update(y => y - 1);
    } else {
      this.viewMonth.set(curr - 1);
    }
  }

  nextMonth(event: MouseEvent) {
    event.stopPropagation();
    const curr = this.viewMonth();
    if (curr === 11) {
      this.viewMonth.set(0);
      this.viewYear.update(y => y + 1);
    } else {
      this.viewMonth.set(curr + 1);
    }
  }

  onYearSelect(event: Event) {
    event.stopPropagation();
    const select = event.target as HTMLSelectElement;
    this.viewYear.set(parseInt(select.value, 10));
  }

  selectDay(d: CalendarDay, event: MouseEvent) {
    event.stopPropagation();
    const dateObj = new Date(d.year, d.month, d.day);
    this.selectedDate.set(dateObj);
    this.viewMonth.set(d.month);
    this.viewYear.set(d.year);

    const brFormatted = `${String(d.day).padStart(2, '0')}/${String(d.month + 1).padStart(2, '0')}/${d.year}`;
    this.displayValue.set(brFormatted);

    const iso = `${d.year}-${String(d.month + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
    this.onChange(iso);
    this.onTouched();
    const ctrl = this.control();
    if (ctrl) {
      ctrl.setValue(iso);
      ctrl.markAsTouched();
      ctrl.updateValueAndValidity();
    }
    this.isOpen.set(false);
    this.reavaliarEstadoErro();
  }

  onHoje(event: MouseEvent) {
    event.stopPropagation();
    const now = new Date();
    this.selectedDate.set(now);
    this.viewMonth.set(now.getMonth());
    this.viewYear.set(now.getFullYear());

    const d = now.getDate();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();

    const brFormatted = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    this.displayValue.set(brFormatted);

    const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    this.onChange(iso);
    this.onTouched();
    const ctrl = this.control();
    if (ctrl) {
      ctrl.setValue(iso);
      ctrl.markAsTouched();
      ctrl.updateValueAndValidity();
    }
    this.isOpen.set(false);
    this.reavaliarEstadoErro();
  }

  onLimpar(event: MouseEvent) {
    event.stopPropagation();
    this.selectedDate.set(null);
    this.displayValue.set('');
    this.onChange('');
    this.onTouched();
    const ctrl = this.control();
    if (ctrl) {
      ctrl.setValue('');
      ctrl.markAsTouched();
      ctrl.updateValueAndValidity();
    }
    this.isOpen.set(false);
    this.reavaliarEstadoErro();
  }

  private isDateValid(day: number, month: number, year: number): boolean {
    if (year < 1900 || year > 2100) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    const testDate = new Date(year, month - 1, day);
    return (
      testDate.getFullYear() === year &&
      testDate.getMonth() === month - 1 &&
      testDate.getDate() === day
    );
  }
}

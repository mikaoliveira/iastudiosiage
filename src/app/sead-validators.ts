import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Normalizes a SEAD code by removing spaces and leading zeros.
 * If the string contains only zeros, returns '0'.
 * If the string is empty or invalid, returns ''.
 */
export function normalizarCodigoSead(codigo: string): string {
  const clean = (codigo || '').trim().replace(/\s+/g, '');
  if (!clean) return '';
  // Keep only digits
  const digits = clean.replace(/\D/g, '');
  if (!digits) return '';
  // Remove leading zeros, but if it's all zeros, keep one zero
  const normalized = digits.replace(/^0+/, '');
  return normalized === '' ? '0' : normalized;
}

/**
 * Validator for the SEAD code.
 * Rejects non-numeric values, or values with length outside [1, 8].
 * Value must match /^\d{1,8}$/
 */
export function codigoSeadValidator(maxLength = 8): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const val = control.value;
    if (val === null || val === undefined || val === '') {
      return null; // Don't fail for empty values (use Validators.required for that)
    }
    const str = String(val).trim();
    const regex = new RegExp(`^\\d{1,${maxLength}}$`);
    if (!regex.test(str)) {
      return { codigoSead: true };
    }
    return null;
  };
}

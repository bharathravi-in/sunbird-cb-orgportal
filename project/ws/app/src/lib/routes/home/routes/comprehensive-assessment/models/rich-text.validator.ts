import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms'

/** Character count of a rich text value, ignoring the markup CKEditor adds around it. */
export function richTextLength(value: any): number {
  if (!value) {
    return 0
  }
  return String(value)
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim()
    .length
}

/**
 * `Validators.required`/`minLength`/`maxLength` count the html markup, so a single empty
 * CKEditor paragraph would pass as valid. This validates the visible text instead while
 * still reporting the standard `required`/`minlength`/`maxlength` error keys.
 */
export function richTextValidator(minLength: number, maxLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const length = richTextLength(control.value)
    if (length === 0) {
      return { required: true }
    }
    if (minLength > 0 && length < minLength) {
      return { minlength: { requiredLength: minLength, actualLength: length } }
    }
    if (maxLength > 0 && length > maxLength) {
      return { maxlength: { requiredLength: maxLength, actualLength: length } }
    }
    return null
  }
}

import type {
  LanguageForm,
  LanguageFormErrors,
  LanguageFormTouched,
} from "./types";

export function validateLanguageForm(
  form: LanguageForm,
  requireCountry: boolean,
): LanguageFormErrors {
  const errors: LanguageFormErrors = {};
  if (requireCountry && !form.countryCode.trim()) {
    errors.countryCode = "Selecciona un país.";
  }
  if (!form.name.trim()) {
    errors.name = "El nombre es obligatorio.";
  }
  if (!form.description.trim()) {
    errors.description = "La descripción es obligatoria.";
  }
  return errors;
}

/** Angular-like: show error only after touch or submit. */
export function getVisibleLanguageErrors(
  form: LanguageForm,
  touched: LanguageFormTouched,
  submitted: boolean,
  requireCountry: boolean,
): LanguageFormErrors {
  const all = validateLanguageForm(form, requireCountry);
  const visible: LanguageFormErrors = {};

  if ((touched.countryCode || submitted) && all.countryCode) {
    visible.countryCode = all.countryCode;
  }
  if ((touched.name || submitted) && all.name) {
    visible.name = all.name;
  }
  if ((touched.description || submitted) && all.description) {
    visible.description = all.description;
  }

  return visible;
}

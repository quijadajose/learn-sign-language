import { describe, expect, it } from "vitest";
import {
  getVisibleLanguageErrors,
  validateLanguageForm,
} from "./languageFormValidation";

describe("getVisibleLanguageErrors", () => {
  const empty = { name: "", description: "", countryCode: "" };

  it("hides errors until a field is touched", () => {
    expect(getVisibleLanguageErrors(empty, {}, false, true)).toEqual({});
  });

  it("shows only the touched field error", () => {
    expect(
      getVisibleLanguageErrors(empty, { description: true }, false, true),
    ).toEqual({
      description: "La descripción es obligatoria.",
    });
  });

  it("shows all errors after submit", () => {
    expect(getVisibleLanguageErrors(empty, {}, true, true)).toEqual(
      validateLanguageForm(empty, true),
    );
  });

  it("clears a field error when it becomes valid", () => {
    expect(
      getVisibleLanguageErrors(
        { ...empty, description: "ok" },
        { description: true },
        false,
        true,
      ),
    ).toEqual({});
  });
});

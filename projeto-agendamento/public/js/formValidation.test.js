import { describe, it, expect } from "vitest";
import { validateRequiredFields } from "./formValidation.js";

describe("validateRequiredFields", () => {
  it("retorna false quando algum valor obrigatório está vazio", () => {
    expect(validateRequiredFields(["", "senha123"])).toBe(false);
  });

  it("retorna true quando todos os valores obrigatórios foram preenchidos", () => {
    expect(validateRequiredFields(["teste@teste.com", "senha123"])).toBe(true);
  });
});

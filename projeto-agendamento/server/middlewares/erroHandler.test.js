const test = require("node:test");
const assert = require("node:assert/strict");
const erroHandler = require("./erroHandler");

test("deve padronizar erros de validação com status 400 e errorCode", () => {
  const err = new Error("Erro de validação");
  err.name = "ValidationError";
  err.errors = {
    email: { message: "E-mail inválido" },
  };

  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
    },
  };

  erroHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.errorCode, "VALIDATION_ERROR");
  assert.equal(res.payload.message, "E-mail inválido");
});

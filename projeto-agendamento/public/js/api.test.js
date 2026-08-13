import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  apiLogin,
  apiRegister,
  apiGetAllServices,
  apiGetMyServices,
  apiCreateService,
  apiUpdateService,
  apiDeleteService,
  apiGetAvailableTimes,
  apiCreateAppointment,
  apiGetAppointments,
  apiUpdateAppointment,
  apiDeleteAppointment,
  saveAuth,
  clearAuth,
  isAuthenticaded,
  getUser,
} from "./api.js";

// ── CONFIGURAÇÃO DE AMBIENTE (MOCKS) ──

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

vi.stubGlobal("localStorage", localStorageMock);

// Função auxiliar para simular respostas do fetch
const mockFetchResponse = (data, ok = true, status = 200) => {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => ({
      ok,
      data,
      message: !ok ? data.message : undefined,
      error: !ok ? data.error : undefined,
    }),
  });
};

describe("Testes do Módulo de API", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // ── GRUPO 1: AUTENTICAÇÃO ──
  describe("Autenticação", () => {
    it("apiLogin deve enviar dados corretamente e não usar token", async () => {
      const fetchMock = mockFetchResponse({ token: "abc", user: {} });
      vi.stubGlobal("fetch", fetchMock);

      await apiLogin("test@test.com", "123");

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/user/public/login"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "test@test.com", password: "123" }),
        }),
      );
    });

    it("apiRegister deve enviar todos os campos de cadastro", async () => {
      const fetchMock = mockFetchResponse({ id: 1 });
      vi.stubGlobal("fetch", fetchMock);

      await apiRegister("Nome", "email@test.com", "11999", "senha");

      const [url, requestConfig] = fetchMock.mock.calls[0];

      expect(url).toContain("/api/user/public/register");
      expect(requestConfig.method).toBe("POST");
      expect(JSON.parse(requestConfig.body)).toEqual({
        name: "Nome",
        email: "email@test.com",
        phone: "11999",
        password: "senha",
      });
    });

    it("apiRegister deve aceitar o formato usado pelo frontend com nome, e-mail e senha", async () => {
      const fetchMock = mockFetchResponse({ id: 1 });
      vi.stubGlobal("fetch", fetchMock);

      await apiRegister("Nome", "email@test.com", "senha");

      const [url, requestConfig] = fetchMock.mock.calls[0];

      expect(url).toContain("/api/user/public/register");
      expect(requestConfig.method).toBe("POST");
      expect(JSON.parse(requestConfig.body)).toEqual({
        name: "Nome",
        email: "email@test.com",
        phone: "",
        password: "senha",
      });
    });
  });

  // ── GRUPO 2: SERVIÇOS ──
  describe("Serviços", () => {
    it("apiGetAllServices deve ser uma chamada pública (GET)", async () => {
      const fetchMock = mockFetchResponse([]);
      vi.stubGlobal("fetch", fetchMock);

      await apiGetAllServices();
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/public"),
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("apiCreateService deve enviar os dados do serviço diretamente no corpo da requisição", async () => {
      const fetchMock = mockFetchResponse({ id: 1 });
      vi.stubGlobal("fetch", fetchMock);
      localStorage.setItem("token", "valido");

      const dados = { name: "Corte", price: 50 };
      await apiCreateService(dados);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(dados),
          headers: expect.objectContaining({ Authorization: "Bearer valido" }),
        }),
      );
    });

    it("apiDeleteService deve usar o método DELETE e o ID na URL", async () => {
      const fetchMock = mockFetchResponse({ deleted: true });
      vi.stubGlobal("fetch", fetchMock);

      await apiDeleteService("123");
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/service/123"),
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });

  // ── GRUPO 3: AGENDAMENTOS ──
  describe("Agendamentos", () => {
    it("apiGetAvailableTimes deve ser público", async () => {
      const fetchMock = mockFetchResponse([]);
      vi.stubGlobal("fetch", fetchMock);

      await apiGetAvailableTimes("serv-1");
      const lastCallArgs = fetchMock.mock.calls[0][1];
      expect(lastCallArgs.skipAuth).toBeUndefined(); // apiRequest remove o skipAuth ao montar o config, mas não envia token se skipAuth for true
    });

    it("apiUpdateAppointment deve enviar o novo status via PUT", async () => {
      const fetchMock = mockFetchResponse({ id: "a1" });
      vi.stubGlobal("fetch", fetchMock);

      await apiUpdateAppointment("a1", { status: "confirmed" });
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/appointment/a1"),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ status: "confirmed" }),
        }),
      );
    });
  });

  // ── GRUPO 4: UTILITÁRIOS ──
  describe("Utilitários de Auth", () => {
    it("saveAuth e getUser devem manipular o localStorage corretamente", () => {
      const user = { name: "Pedro" };
      saveAuth("token-123", user);

      expect(isAuthenticaded()).toBe(true);
      expect(getUser()).toEqual(user);
    });

    it("clearAuth deve limpar os dados", () => {
      saveAuth("t", {});
      clearAuth();
      expect(isAuthenticaded()).toBe(false);
      expect(getUser()).toBeNull();
    });
  });

  // ── GRUPO 5: TRATAMENTO DE ERRO ──
  it("Deve lançar erro com status e código quando a resposta não for ok", async () => {
    const fetchMock = mockFetchResponse(
      { message: "Não autorizado", error: "UNAUTHORIZED" },
      false,
      401,
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      await apiGetMyServices();
    } catch (e) {
      expect(e.status).toBe(401);
      expect(e.code).toBe("UNAUTHORIZED");
      expect(e.message).toBe("Não autorizado");
    }
  });

  it("Deve tratar respostas de erro mesmo quando o corpo não vem em JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Não autorizado",
      }),
    );

    try {
      await apiLogin("teste@teste.com", "123456");
      throw new Error("Esperava que apiLogin lançasse erro");
    } catch (e) {
      expect(e.status).toBe(401);
      expect(e.message).toBe("Não autorizado");
    }
  });
});

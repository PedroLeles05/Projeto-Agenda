const api_url = "http://localhost:3000";
let authExpiredNotified = false;

function notifyAuthExpired(message) {
  if (authExpiredNotified) return;
  authExpiredNotified = true;

  if (
    typeof window !== "undefined" &&
    typeof window.dispatchEvent === "function"
  ) {
    window.dispatchEvent(
      new CustomEvent("auth:expired", {
        detail: {
          message: message || "Sua sessão expirou. Faça login novamente.",
        },
      }),
    );
  }
}

// fazer requisição
export async function apiRequest(endPoint, options = {}) {
  const { method = "GET", data = null, skipAuth = false } = options;

  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  // Adicionar token se houver
  if (!skipAuth) {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }

  // Adicionar body
  if (data) {
    config.body = JSON.stringify(data);
  }

  // request com fetch
  try {
    console.log(`[${method}] ${endPoint}`);
    const response = await fetch(`${api_url}${endPoint}`, config);

    let result = null;
    try {
      if (typeof response.json === "function") {
        result = await response.json();
      }
    } catch {
      result = null;
    }

    if (result === null && typeof response.text === "function") {
      try {
        const text = await response.text();
        if (text) {
          try {
            result = JSON.parse(text);
          } catch {
            result = text;
          }
        }
      } catch {
        result = null;
      }
    }

    if (!response.ok) {
      const message =
        result?.message ||
        result?.data?.message ||
        (typeof result === "string"
          ? result
          : response.statusText || "Erro desconhecido");
      const erro = new Error(message);
      erro.status = response.status;
      erro.code = result?.errorCode || result?.error || result?.data?.error;
      erro.data = result;

      if (!skipAuth && response.status === 401) {
        clearAuth();
        notifyAuthExpired(message);
      }

      throw erro;
    }

    return result;
  } catch (erro) {
    console.error(`Erro [${method} ${endPoint}]: `, erro);
    throw erro;
  }
}

// Autentication
export async function apiLogin(email, password, remember) {
  return await apiRequest("/api/user/public/login", {
    method: "POST",
    data: { email, password, remember },
    skipAuth: true,
  });
}

export async function apiRegister(
  nameOrData,
  email,
  phoneOrPassword,
  password,
) {
  const payload =
    typeof nameOrData === "object" && nameOrData !== null
      ? {
          name: nameOrData.name || "",
          email: nameOrData.email || "",
          password: nameOrData.password || nameOrData.senha || "",
          phone: nameOrData.phone || "",
        }
      : {
          name: nameOrData || "",
          email: email || "",
          password: password ?? phoneOrPassword ?? "",
          phone: password ? phoneOrPassword : "",
        };

  return await apiRequest("/api/user/public/register", {
    method: "POST",
    data: payload,
    skipAuth: true,
  });
}

// Service

// public
export async function apiGetAllServices() {
  return await apiRequest("/api/service/public", {
    method: "GET",
    skipAuth: true,
  });
}

// private
export async function apiGetMyServices() {
  return await apiRequest("/api/service", { method: "GET", skipAuth: false });
}

export async function apiGetWorkingHours() {
  return await apiRequest("/api/working", { method: "GET", skipAuth: false });
}

export async function apiUpdateWorkingHours(workingHoursId, payload) {
  return await apiRequest(`/api/working/${workingHoursId}`, {
    method: "PUT",
    data: payload,
    skipAuth: false,
  });
}

export async function apiCreateService(serviceData) {
  return await apiRequest("/api/service", {
    method: "POST",
    data: serviceData,
    skipAuth: false,
  });
}

export async function apiUpdateService(serviceId, serviceData) {
  return await apiRequest(`/api/service/${serviceId}`, {
    method: "PUT",
    data: serviceData,
    skipAuth: false,
  });
}

export async function apiDeleteService(serviceId) {
  return apiRequest(`/api/service/${serviceId}`, {
    method: "DELETE",
    skipAuth: false,
  });
}

// appointments

// public
export async function apiGetAvailableTimes(serviceId, data) {
  const params = data ? `?data=${encodeURIComponent(data)}` : "";
  return await apiRequest(`/api/appointment/public/${serviceId}${params}`, {
    skipAuth: true,
  });
}

export async function apiCreateAppointment(appointmentData) {
  return await apiRequest("/api/appointment/public", {
    method: "POST",
    data: appointmentData,
    skipAuth: true,
  });
}

// private
export async function apiGetAppointments() {
  return await apiRequest("/api/appointment", {
    method: "GET",
    skipAuth: false,
  });
}

export async function apiUpdateAppointment(appointmentId, status) {
  return await apiRequest(`/api/appointment/${appointmentId}`, {
    method: "PUT",
    data: status,
    skipAuth: false,
  });
}

export async function apiDeleteAppointment(appointmentId) {
  return await apiRequest(`/api/appointment/${appointmentId}`, {
    method: "DELETE",
    skipAuth: false,
  });
}

// utils
export function saveAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  authExpiredNotified = false;
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function isAuthenticaded() {
  return !!localStorage.getItem("token");
}

export function getUser() {
  const user = localStorage.getItem("user");

  return user ? JSON.parse(user) : null;
}

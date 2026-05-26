const api_url = "http://localhost:3000";

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
    const result = await response.json();

    if (!response.ok) {
      const erro = new Error(result.message || "Erro desconhecido");
      erro.status = response.status;
      erro.code = result.error;
      erro.data = result;
      throw erro;
    }

    return result;
  } catch (erro) {
    console.error(`Erro [${method} ${endPoint}]: `, erro);
    throw erro;
  }
}

// Autentication
export async function apiLogin(email, password) {
  return await apiRequest("/api/user/public/login", {
    method: "POST",
    data: { email, password },
    skipAuth: true,
  });
}

export async function apiRegister(name, email, phone, password) {
  return await apiRequest("/api/user/public/register", {
    method: "POST",
    data: { name, email, phone, password },
    skipAuth: true,
  });
}

// Service

// public
export async function apiGetAllServices() {
  return await apiRequest("/api/service/public", { method: "GET" });
}

// private
export async function apiGetMyServices() {
  return await apiRequest("/api/service", { method: "GET", skipAuth: false });
}

export async function apiCreateService(serviceData) {
  return await apiRequest("/api/service", {
    method: "POST",
    data: { serviceData },
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
  return await apiRequest(`/api/appointment/public/${serviceId}`, {
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

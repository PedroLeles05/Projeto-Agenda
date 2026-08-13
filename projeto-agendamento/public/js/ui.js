import { getUser } from "./api.js";

export function clearForm(formOrId) {
  const form =
    typeof formOrId === "string" ? document.getElementById(formOrId) : formOrId;

  if (!(form instanceof HTMLFormElement)) {
    console.error(
      `❌ ERRO: O valor passado para clearForm não é um formulário válido.`,
    );
    return;
  }

  form.reset();
}

//Update UI
export function updateAuthUi() {
  const authButtons = document.getElementById("auth-buttons");
  const userButtons = document.getElementById("user-button");
  const mobileUserButton = document.getElementById("mobile-user-button");
  const panelSection = document.getElementById("panel");
  const logoutButton = document.getElementById("logout-btn");
  const mobileLoginButton = document.getElementById("mobile-login-btn");
  const mobileRegisterButton = document.getElementById("mobile-register-btn");
  const mobileLogoutButton = document.getElementById("mobile-logout-btn");

  const token = localStorage.getItem("token");
  const isLoged = token != null;

  if (isLoged) {
    if (logoutButton) {
      logoutButton.classList.remove("hidden");
    }
    if (mobileLogoutButton) {
      mobileLogoutButton.classList.remove("hidden");
    }
    if (mobileLoginButton) mobileLoginButton.classList.add("hidden");
    if (mobileRegisterButton) mobileRegisterButton.classList.add("hidden");
    if (authButtons) {
      authButtons.classList.remove("sm:flex");
      authButtons.classList.add("hidden");
    }
    if (userButtons) userButtons.classList.remove("hidden");
    if (mobileUserButton) mobileUserButton.classList.remove("hidden");
    if (panelSection) {
      panelSection.classList.remove("hidden");
      panelSection.classList.add("block");
    }
  } else {
    if (logoutButton) logoutButton.classList.add("hidden");
    if (mobileLogoutButton) mobileLogoutButton.classList.add("hidden");
    if (mobileLoginButton) mobileLoginButton.classList.remove("hidden");
    if (mobileRegisterButton) mobileRegisterButton.classList.remove("hidden");
    if (authButtons) {
      authButtons.classList.remove("hidden");
      authButtons.classList.add("sm:flex");
    }
    if (userButtons) userButtons.classList.add("hidden");
    if (mobileUserButton) mobileUserButton.classList.add("hidden");
    if (panelSection) {
      panelSection.classList.remove("block");
      panelSection.classList.add("hidden");
    }
  }
}

//Toast
export function showToast(message, type = "success") {
  let container = document.getElementById("toast-container");

  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.cssText =
      "position: fixed; top: 16px; right: 16px; z-index: 2147483647; display: flex; flex-direction: column; gap: 12px; max-width: 24rem; width: auto; pointer-events: none;";
    document.body.appendChild(container);
  }

  container.style.zIndex = "2147483647";
  container.style.position = "fixed";
  container.style.top = "16px";
  container.style.right = "16px";
  container.style.pointerEvents = "none";

  const toast = document.createElement("div");
  toast.style.cssText =
    "pointer-events: auto; display: block; min-width: 220px; max-width: 360px; padding: 14px 16px; border-radius: 12px; box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16); border: 1px solid; font-size: 14px; line-height: 1.4; font-weight: 500; opacity: 0; visibility: hidden; transform: translateY(-8px); transition: opacity 220ms ease, transform 220ms ease, visibility 220ms ease;";

  if (type === "error") {
    toast.style.backgroundColor = "#fef2f2";
    toast.style.borderColor = "#fecaca";
    toast.style.color = "#991b1b";
  } else {
    toast.style.backgroundColor = "#f0fdf4";
    toast.style.borderColor = "#bbf7d0";
    toast.style.color = "#166534";
  }

  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.visibility = "visible";
    toast.style.transform = "translateY(0)";
  }, 20);

  const removeToast = () => {
    toast.style.opacity = "0";
    toast.style.visibility = "hidden";
    toast.style.transform = "translateY(-8px)";
    setTimeout(() => toast.remove(), 220);
  };

  const autoCloseTimeout = setTimeout(removeToast, 3500);

  toast.onclick = () => {
    clearTimeout(autoCloseTimeout);
    removeToast();
  };
}

// Modal login open/close
export const closeLoginModal = () => {
  const loginForm = document.getElementById("login-form");
  if (loginForm) clearForm(loginForm);
  const loginOverlay = document.getElementById("login-modal-overlay");
  if (loginOverlay) loginOverlay.classList.remove("open");
};

export const closeRegisterModal = () => {
  const registerForm = document.getElementById("register-form");
  if (registerForm) clearForm(registerForm);
  const registerOverlay = document.getElementById("register-modal-overlay");
  if (registerOverlay) registerOverlay.classList.remove("open");
};

export const closeModal = () => {
  const overlay = document.getElementById("modal-overlay");
  if (overlay) overlay.classList.remove("open");
};

// Inicializar event listeners do UI (chamado após DOMContentLoaded)
export function initUIEventListeners() {
  if (document.body?.dataset.uiListenersInitialized === "true") {
    return;
  }
  document.body.dataset.uiListenersInitialized = "true";

  // Botões para abrir modais
  const loginBtn = document.getElementById("login-btn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const loginOverlay = document.getElementById("login-modal-overlay");
      if (loginOverlay) loginOverlay.classList.add("open");
    });
  }

  const registerBtn = document.getElementById("register-btn");
  if (registerBtn) {
    registerBtn.addEventListener("click", () => {
      const registerOverlay = document.getElementById("register-modal-overlay");
      if (registerOverlay) registerOverlay.classList.add("open");
    });
  }

  const mobileLoginBtn = document.getElementById("mobile-login-btn");
  if (mobileLoginBtn) {
    mobileLoginBtn.addEventListener("click", () => {
      document.getElementById("mobile-menu")?.classList.remove("open");
      document.getElementById("login-modal-overlay")?.classList.add("open");
    });
  }

  const mobileRegisterBtn = document.getElementById("mobile-register-btn");
  if (mobileRegisterBtn) {
    mobileRegisterBtn.addEventListener("click", () => {
      document.getElementById("mobile-menu")?.classList.remove("open");
      document.getElementById("register-modal-overlay")?.classList.add("open");
    });
  }

  // Modal login
  const loginOverlay = document.getElementById("login-modal-overlay");
  if (loginOverlay) {
    const closeBtn = document.getElementById("close-login-btn");
    if (closeBtn) closeBtn.addEventListener("click", closeLoginModal);
    const cancelBtn = document.getElementById("cancel-login-btn");
    if (cancelBtn) cancelBtn.addEventListener("click", closeLoginModal);
    loginOverlay.addEventListener("click", (e) => {
      if (e.target === loginOverlay) closeLoginModal();
    });
  }

  // Modal register
  const registerOverlay = document.getElementById("register-modal-overlay");
  if (registerOverlay) {
    const closeBtn = document.getElementById("close-register-btn");
    if (closeBtn) closeBtn.addEventListener("click", closeRegisterModal);
    const cancelBtn = document.getElementById("cancel-register-btn");
    if (cancelBtn) cancelBtn.addEventListener("click", closeRegisterModal);
    registerOverlay.addEventListener("click", (e) => {
      if (e.target === registerOverlay) closeRegisterModal();
    });
  }

  // Modal schedule
  const overlay = document.getElementById("modal-overlay");
  if (overlay) {
    const closeBtn = document.getElementById("close-modal-btn");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    const cancelBtn = document.getElementById("cancel-btn");
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  // Mobile menu
  const mobileMenu = document.getElementById("mobile-menu");
  if (mobileMenu) {
    const hamburgerBtn = document.getElementById("hamburger-btn");
    if (hamburgerBtn) {
      hamburgerBtn.addEventListener("click", () =>
        mobileMenu.classList.add("open"),
      );
    }
    const closeMenuBtn = document.getElementById("close-menu-btn");
    if (closeMenuBtn) {
      closeMenuBtn.addEventListener("click", () =>
        mobileMenu.classList.remove("open"),
      );
    }
    const backdrop = document.getElementById("mobile-menu-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", () =>
        mobileMenu.classList.remove("open"),
      );
    }
    mobileMenu
      .querySelectorAll("a")
      .forEach((a) =>
        a.addEventListener("click", () => mobileMenu.classList.remove("open")),
      );
  }

  // Filter pills
  document.querySelectorAll(".tab-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".tab-pill")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // Navigation between modals
  const goToRegisterBtn = document.getElementById("go-to-register-btn");
  if (goToRegisterBtn) {
    goToRegisterBtn.addEventListener("click", () => {
      closeLoginModal();
      const registerOverlay = document.getElementById("register-modal-overlay");
      if (registerOverlay) registerOverlay.classList.add("open");
    });
  }

  const goToLoginBtn = document.getElementById("go-to-login-btn");
  if (goToLoginBtn) {
    goToLoginBtn.addEventListener("click", () => {
      closeRegisterModal();
      const loginOverlay = document.getElementById("login-modal-overlay");
      if (loginOverlay) loginOverlay.classList.add("open");
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// FUNÇÕES DE FORMATAÇÃO E UTILITÁRIOS DE UI
// ═══════════════════════════════════════════════════════════════════

// Escape HTML para segurança
export function escapeHTML(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Formata preços em BRL
export function formatPrice(value) {
  if (typeof value !== "number") {
    value = Number(value);
  }
  if (Number.isNaN(value)) {
    return "R$ 0,00";
  }
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

// Formata datas para input type="date" (local time)
export function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Formata data para string YYYY-MM-DD com timezone local
export function formatDateToInput(dateObj) {
  if (!dateObj) return "";
  try {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

// Cria card de serviço para a vitrine
export function createServiceCard(service) {
  const card = document.createElement("article");
  card.className =
    "bg-white border border-stone-200 rounded-2xl p-5 flex flex-col justify-between gap-4";
  const providerName = service.userId?.name || "Prestador";
  const description = service.description || "Sem descrição disponível.";
  card.innerHTML = `
    <div>
      <div class="flex items-center justify-between gap-3 mb-4">
        <div class="min-w-0">
          <p class="font-medium text-stone-900 text-sm truncate">${escapeHTML(
            service.title,
          )}</p>
          <p class="text-xs text-stone-400 mt-1">${escapeHTML(providerName)}</p>
        </div>
        <span class="text-xs text-teal-700 bg-teal-50 px-2 py-1 rounded-full font-medium">${formatPrice(
          service.price,
        )}</span>
      </div>
      <p class="text-sm text-stone-500 mb-4">${escapeHTML(description)}</p>
      <div class="flex items-center justify-between gap-3">
        <span class="text-xs text-stone-400">${escapeHTML(
          String(service.duration),
        )} min</span>
        <button
          type="button"
          data-service-id="${service._id}"
          class="btn-schedule inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-teal-700"
        >
          Agendar
        </button>
      </div>
    </div>
  `;
  return card;
}

// ═══════════════════════════════════════════════════════════════════
// SELETORES DE DOM
// ═══════════════════════════════════════════════════════════════════

export function getScheduleTimeSelect() {
  return document.getElementById("schedule-time");
}

export function getScheduleDateInput() {
  return document.getElementById("schedule-date");
}

export function getWorkingHoursForm() {
  return document.getElementById("working-hours-form");
}

// ═══════════════════════════════════════════════════════════════════
// ATUALIZAÇÕES DE DOM E MENSAGENS
// ═══════════════════════════════════════════════════════════════════

export function updateScheduleTimeMessage(message) {
  const messageElement = document.getElementById("schedule-time-message");
  if (messageElement) {
    messageElement.textContent = message || "";
  }
}

export function updateWorkingHoursMessage(message, type = "info") {
  const container = document.getElementById("working-hours-message");
  if (!container) return;
  container.textContent = message || "";
  container.className =
    type === "error"
      ? "text-xs text-rose-600"
      : type === "success"
        ? "text-xs text-teal-700"
        : "text-xs text-stone-500";
}

export function updateProviderHeader() {
  const user = getUser();
  const providerInfo = document.getElementById("provider-info");
  const providerAvatar = document.getElementById("provider-avatar");

  if (!providerInfo || !providerAvatar) return;

  if (user?.name) {
    const initials = String(user.name)
      .split(" ")
      .filter((part) => part.length > 0)
      .map((part) => part[0].toUpperCase())
      .slice(0, 2)
      .join("");

    providerAvatar.textContent = initials || "PR";
    providerInfo.textContent = `${user.name} · Prestador`;
  } else {
    providerAvatar.textContent = "PA";
    providerInfo.textContent = "Prestador autenticado";
  }
}

// ═══════════════════════════════════════════════════════════════════
// GERENCIAMENTO DE FORMULÁRIOS E HORÁRIOS DE EXPEDIENTE
// ═══════════════════════════════════════════════════════════════════

export function getWorkingDaysFromForm() {
  return {
    monday: document.getElementById("wh-day-monday")?.checked || false,
    tuesday: document.getElementById("wh-day-tuesday")?.checked || false,
    wednesday: document.getElementById("wh-day-wednesday")?.checked || false,
    thursday: document.getElementById("wh-day-thursday")?.checked || false,
    friday: document.getElementById("wh-day-friday")?.checked || false,
    saturday: document.getElementById("wh-day-saturday")?.checked || false,
    sunday: document.getElementById("wh-day-sunday")?.checked || false,
  };
}

export function populateWorkingHoursForm(data) {
  if (!data) return;

  const workingDays = data.workingDays || {};
  document.getElementById("wh-day-monday").checked = !!workingDays.monday;
  document.getElementById("wh-day-tuesday").checked = !!workingDays.tuesday;
  document.getElementById("wh-day-wednesday").checked = !!workingDays.wednesday;
  document.getElementById("wh-day-thursday").checked = !!workingDays.thursday;
  document.getElementById("wh-day-friday").checked = !!workingDays.friday;
  document.getElementById("wh-day-saturday").checked = !!workingDays.saturday;
  document.getElementById("wh-day-sunday").checked = !!workingDays.sunday;

  document.getElementById("working-start").value = data.startTime ?? "";
  document.getElementById("working-end").value = data.endTime ?? "";
  document.getElementById("break-start").value = data.breakTimeStart ?? "";
  document.getElementById("break-end").value = data.breakTimeEnd ?? "";

  updateWorkingHoursMessage(
    "Horário de expediente carregado. Faça alterações e salve.",
    "success",
  );
}

export function toggleWorkingHoursEditor(show) {
  const editor = document.getElementById("working-hours-form-container");
  if (!editor) return;
  editor.classList.toggle("hidden", !show);
}

export function formatWorkingDaysSummary(workingDays = {}) {
  const days = [];
  if (workingDays.monday) days.push("Seg");
  if (workingDays.tuesday) days.push("Ter");
  if (workingDays.wednesday) days.push("Qua");
  if (workingDays.thursday) days.push("Qui");
  if (workingDays.friday) days.push("Sex");
  if (workingDays.saturday) days.push("Sáb");
  if (workingDays.sunday) days.push("Dom");

  if (days.length === 7) return "Todos os dias";
  if (days.length === 5 && days.join(",") === "Seg,Ter,Qua,Qui,Sex") {
    return "Seg-Sex";
  }
  if (days.length === 2 && days.join(",") === "Sáb,Dom") {
    return "Sáb-Dom";
  }
  return days.length > 0 ? days.join(", ") : "Nenhum dia selecionado";
}

export function updateWorkingHoursSummary(data) {
  const summary = document.getElementById("working-hours-summary");
  if (!summary) return;

  const daysText = formatWorkingDaysSummary(data.workingDays);
  const start =
    typeof data.startTime === "number"
      ? String(data.startTime).padStart(2, "0")
      : "--";
  const end =
    typeof data.endTime === "number"
      ? String(data.endTime).padStart(2, "0")
      : "--";
  const breakStart =
    typeof data.breakTimeStart === "number"
      ? String(data.breakTimeStart).padStart(2, "0")
      : "--";
  const breakEnd =
    typeof data.breakTimeEnd === "number"
      ? String(data.breakTimeEnd).padStart(2, "0")
      : "--";

  summary.innerHTML = `
    <p class="text-sm font-medium text-stone-900">${escapeHTML(daysText)}</p>
    <p class="text-xs text-stone-500 mt-2">${escapeHTML(start)}:00 - ${escapeHTML(end)}:00</p>
    <p class="text-xs text-stone-500 mt-1">Intervalo: ${escapeHTML(breakStart)}:00 - ${escapeHTML(breakEnd)}:00</p>
  `;
}

export function clearScheduleModal() {
  const scheduleForm = document.getElementById("schedule-form");
  if (scheduleForm) {
    clearForm(scheduleForm);
  }
  const timeSelect = getScheduleTimeSelect();
  if (timeSelect) {
    timeSelect.innerHTML = `<option value="">Selecione uma data</option>`;
  }
  updateScheduleTimeMessage("");
}

// ═══════════════════════════════════════════════════════════════════
// GERENCIAMENTO DE MODAIS E PAINÉIS
// ═══════════════════════════════════════════════════════════════════

export function openScheduleModal(service) {
  if (!service) return;

  const titleEl = document.getElementById("service-modal-title");
  const metaEl = document.getElementById("service-modal-meta");
  const serviceIdInput = document.getElementById("selected-service-id");
  const dateInput = getScheduleDateInput();

  if (titleEl) {
    titleEl.textContent = `Agendar ${service.title}`;
  }
  if (metaEl) {
    metaEl.textContent = `${service.duration} min · ${formatPrice(service.price)}`;
  }
  if (serviceIdInput) {
    serviceIdInput.value = service._id;
  }

  if (dateInput) {
    const today = new Date();
    const minDate = formatDateForInput(today);
    dateInput.min = minDate;
    dateInput.value = minDate;
  }

  const overlay = document.getElementById("modal-overlay");
  if (overlay) {
    overlay.classList.add("open");
  }
}

export function openServiceFormPanel(edit = false) {
  const panel = document.getElementById("new-service-form-panel");
  if (!panel) return;
  panel.classList.remove("hidden");
  const saveBtn = document.getElementById("save-new-service-btn");
  if (saveBtn) {
    saveBtn.textContent = edit ? "Salvar alterações" : "Salvar serviço";
  }
  if (!edit) {
    const form = document.getElementById("new-service-form");
    if (form) clearForm(form);
  }
}

export function closeServiceFormPanel() {
  const panel = document.getElementById("new-service-form-panel");
  if (!panel) return;
  panel.classList.add("hidden");
  const form = document.getElementById("new-service-form");
  if (form) clearForm(form);
  const saveBtn = document.getElementById("save-new-service-btn");
  if (saveBtn) saveBtn.textContent = "Salvar serviço";
}

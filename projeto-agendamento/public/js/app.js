// Importações de módulos
import {
  apiLogin,
  saveAuth,
  clearAuth,
  getUser,
  apiRegister,
  apiGetAllServices,
  apiGetAvailableTimes,
  apiCreateAppointment,
  apiGetMyServices,
  apiGetWorkingHours,
  apiUpdateWorkingHours,
  apiCreateService,
  apiUpdateService,
  apiDeleteService,
  apiGetAppointments,
  apiUpdateAppointment,
} from "./api.js";

import {
  closeLoginModal,
  closeRegisterModal,
  clearForm,
  updateAuthUi,
  showToast,
  escapeHTML,
  formatPrice,
  formatDateToInput,
  createServiceCard,
  setupDescriptionToggle,
  getScheduleTimeSelect,
  getScheduleDateInput,
  getWorkingHoursForm,
  updateScheduleTimeMessage,
  updateWorkingHoursMessage,
  updateProviderHeader,
  getWorkingDaysFromForm,
  populateWorkingHoursForm,
  toggleWorkingHoursEditor,
  formatWorkingDaysSummary,
  updateWorkingHoursSummary,
  clearScheduleModal,
  openScheduleModal,
  openServiceFormPanel,
  closeServiceFormPanel,
  initUIEventListeners,
} from "./ui.js";

import {
  validateRequiredFields,
  validarNome,
  validarEmail,
  validarSenha,
} from "./formValidation.js";

console.log("✓ app.js carregado");

// Variáveis de estado global
const MAX_SERVICES = 5;
let currentPublicServices = [];
let currentProviderServices = [];
let currentProviderAppointments = [];
let currentWorkingHours = null;
let currentEditingServiceId = null;
let authExpiredToastShown = false;

function normalizeAppointmentStatus(rawStatus) {
  const normalized = String(rawStatus || "scheduled")
    .trim()
    .toLowerCase();

  if (["cancelled", "canceled", "cancelado"].includes(normalized)) {
    return "cancelled";
  }

  if (["completed", "concluido", "concluído"].includes(normalized)) {
    return "completed";
  }

  return "scheduled";
}

function sanitizeSensitiveUrlParams() {
  try {
    const url = new URL(window.location.href);
    const sensitiveKeys = [
      "password",
      "senha",
      "pass",
      "pwd",
      "email",
      "token",
      "access_token",
    ];

    let changed = false;
    sensitiveKeys.forEach((key) => {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    });

    if (changed) {
      const newQuery = url.searchParams.toString();
      const safeUrl = `${url.pathname}${newQuery ? `?${newQuery}` : ""}${url.hash}`;
      window.history.replaceState({}, document.title, safeUrl);
    }
  } catch (error) {
    console.warn("Não foi possível sanitizar parâmetros da URL:", error);
  }
}

function isAuthError(error) {
  const message = String(error?.message || "");
  return (
    error?.status === 401 ||
    error?.code === "INVALID_TOKEN" ||
    /token inválido|token expirado|expirado|unauthorized|não autorizado/i.test(
      message,
    )
  );
}

function handleSessionExpired(message) {
  currentProviderServices = [];
  currentProviderAppointments = [];
  currentWorkingHours = null;
  currentEditingServiceId = null;

  updateAuthUi();
  updateProviderHeader();
  toggleWorkingHoursEditor(false);

  if (!authExpiredToastShown) {
    showToast(message || "Sua sessão expirou. Faça login novamente.", "error");
    authExpiredToastShown = true;
  }

  document.getElementById("login-modal-overlay")?.classList.add("open");
}

// Atualização de status do agendamento (Painel do Prestador)
async function updateAppointmentStatus(appointmentId, newStatus) {
  try {
    await apiUpdateAppointment(appointmentId, { status: newStatus });
    const statusText = newStatus === "completed" ? "concluído" : "cancelado";
    showToast(`Agendamento marcado como ${statusText}.`, "success");
    await loadProviderAppointments();
  } catch (error) {
    console.error("Erro ao atualizar status do agendamento:", error);
    showToast(
      error.message || "Não foi possível atualizar o agendamento.",
      "error",
    );
  }
}

// Restauração do formulário de horários (acessa currentWorkingHours global)
function resetWorkingHoursFormLocal() {
  if (!currentWorkingHours) return;
  populateWorkingHoursForm(currentWorkingHours);
}

// Filtro de serviços da página inicial (Vitrine)
function filterPublicServices() {
  const query = document
    .getElementById("service-search")
    ?.value.trim()
    .toLowerCase();
  const filterValue = document.getElementById("service-filter")?.value;

  let filtered = currentPublicServices;
  if (query) {
    filtered = filtered.filter((service) => {
      const title = String(service.title || "").toLowerCase();
      const description = String(service.description || "").toLowerCase();
      const provider = String(service.userId?.name || "").toLowerCase();
      return (
        title.includes(query) ||
        description.includes(query) ||
        provider.includes(query)
      );
    });
  }

  if (filterValue === "available") {
    filtered = filtered;
  }

  const grid = document.getElementById("services-grid");
  if (!grid) return;

  grid.innerHTML = "";
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-sm text-stone-500">Nenhum serviço encontrado.</div>`;
    return;
  }

  filtered.forEach((service) => {
    const card = createServiceCard(service);
    grid.appendChild(card);
    setupDescriptionToggle(card);
  });

  grid.querySelectorAll(".btn-schedule").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const serviceId = event.currentTarget.dataset.serviceId;
      const service = currentPublicServices.find(
        (item) => String(item._id) === serviceId,
      );
      if (service) {
        await openScheduleModalLocal(service);
      }
    });
  });
}

// Abertura do modal de agendamento (Cliente)
async function openScheduleModalLocal(service) {
  clearScheduleModal();
  openScheduleModal(service);
  const dateInput = getScheduleDateInput();

  if (dateInput && dateInput.value) {
    await fetchAvailableTimes(service._id, dateInput.value);
  }
}

// Carregamento dos horários de expediente da API
async function loadWorkingHours() {
  const form = getWorkingHoursForm();
  const summaryContainer = document.getElementById("working-hours-summary");

  if (!form || !summaryContainer) return;
  form.classList.add("opacity-50");
  updateWorkingHoursMessage("Carregando expediente...");

  try {
    const response = await apiGetWorkingHours();
    const items = Array.isArray(response?.item) ? response.item : [];
    if (items.length === 0) {
      updateWorkingHoursMessage(
        "Não foi possível encontrar o expediente do prestador.",
        "error",
      );
      summaryContainer.innerHTML = `
        <p class="text-sm font-medium text-stone-900">Sem expediente configurado</p>
        <p class="text-xs text-stone-500 mt-2">Use o botão para editar e definir seus horários.</p>
      `;
      return;
    }

    const workingHours = items[0];
    currentWorkingHours = workingHours;
    populateWorkingHoursForm(workingHours);
    updateWorkingHoursSummary(workingHours);
  } catch (error) {
    console.error("Erro ao carregar horário de expediente:", error);
    if (isAuthError(error)) return;
    updateWorkingHoursMessage(
      "Erro ao carregar expediente. Atualize a página e tente novamente.",
      "error",
    );
    summaryContainer.innerHTML = `
      <p class="text-sm font-medium text-stone-900">Erro ao carregar expediente</p>
      <p class="text-xs text-stone-500 mt-2">Tente novamente mais tarde.</p>
    `;
  } finally {
    form.classList.remove("opacity-50");
  }
}

// Submissão do formulário de horários de expediente
async function handleWorkingHoursSubmit(event) {
  event.preventDefault();

  if (!currentWorkingHours?._id) {
    showToast(
      "Não foi possível atualizar. Expediente não encontrado.",
      "error",
    );
    return;
  }

  const startTimeValue = document.getElementById("working-start")?.value;
  const endTimeValue = document.getElementById("working-end")?.value;
  const breakStartValue = document.getElementById("break-start")?.value;
  const breakEndValue = document.getElementById("break-end")?.value;
  const workingDays = getWorkingDaysFromForm();

  const selectedDays = Object.values(workingDays).filter(Boolean).length;
  if (selectedDays === 0) {
    showToast("Selecione pelo menos um dia de atendimento.", "error");
    return;
  }

  if (!startTimeValue || !endTimeValue) {
    showToast("Informe horário de início e fim do expediente.", "error");
    return;
  }

  const startTime = Number(startTimeValue);
  const endTime = Number(endTimeValue);

  if (!Number.isInteger(startTime) || !Number.isInteger(endTime)) {
    showToast("Os horários devem ser números inteiros.", "error");
    return;
  }

  if (startTime < 0 || startTime > 23 || endTime < 0 || endTime > 23) {
    showToast("Os horários devem estar entre 0 e 23.", "error");
    return;
  }

  if (startTime >= endTime) {
    showToast("O início do expediente deve ser antes do fim.", "error");
    return;
  }

  if (
    (breakStartValue && !breakEndValue) ||
    (!breakStartValue && breakEndValue)
  ) {
    showToast(
      "Preencha ambos os horários de intervalo ou deixe os dois em branco.",
      "error",
    );
    return;
  }

  let breakTimeStart;
  let breakTimeEnd;

  if (breakStartValue && breakEndValue) {
    breakTimeStart = Number(breakStartValue);
    breakTimeEnd = Number(breakEndValue);

    if (!Number.isInteger(breakTimeStart) || !Number.isInteger(breakTimeEnd)) {
      showToast(
        "Os horários de intervalo devem ser números inteiros.",
        "error",
      );
      return;
    }

    if (
      breakTimeStart < 0 ||
      breakTimeStart > 23 ||
      breakTimeEnd < 0 ||
      breakTimeEnd > 23
    ) {
      showToast("Os horários de intervalo devem estar entre 0 e 23.", "error");
      return;
    }

    if (breakTimeStart >= breakTimeEnd) {
      showToast("O início do intervalo deve ser antes do fim.", "error");
      return;
    }

    if (breakTimeStart < startTime || breakTimeEnd > endTime) {
      showToast(
        "O intervalo deve estar dentro do expediente definido.",
        "error",
      );
      return;
    }
  }

  const payload = {
    startTime,
    endTime,
    workingDays,
  };

  if (typeof breakTimeStart === "number") {
    payload.breakTimeStart = breakTimeStart;
  }
  if (typeof breakTimeEnd === "number") {
    payload.breakTimeEnd = breakTimeEnd;
  }

  try {
    const response = await apiUpdateWorkingHours(
      currentWorkingHours._id,
      payload,
    );
    if (response) {
      updateWorkingHoursMessage("Expediente salvo com sucesso.", "success");
      showToast("Horário de expediente atualizado.", "success");
      await loadWorkingHours();
      toggleWorkingHoursEditor(false);
    }
  } catch (error) {
    console.error("Erro ao atualizar expediente:", error);
    showToast(
      error.message || "Não foi possível atualizar o expediente.",
      "error",
    );
    updateWorkingHoursMessage(
      "Erro ao salvar o expediente. Verifique os dados e tente novamente.",
      "error",
    );
  }
}

// Busca de horários disponíveis para o agendamento
async function fetchAvailableTimes(serviceId, date) {
  const timeSelect = getScheduleTimeSelect();
  if (!timeSelect) return;

  timeSelect.innerHTML = `<option value="">Buscando horários...</option>`;
  updateScheduleTimeMessage("");

  if (!date) {
    timeSelect.innerHTML = `<option value="">Selecione uma data</option>`;
    return;
  }

  try {
    const response = await apiGetAvailableTimes(serviceId, date);
    const slots =
      response?.data?.availableSlots || response?.availableSlots || [];

    if (!Array.isArray(slots) || slots.length === 0) {
      timeSelect.innerHTML = `<option value="">Nenhum horário disponível</option>`;
      updateScheduleTimeMessage(
        "Nenhum horário disponível para a data selecionada.",
      );
      return;
    }

    timeSelect.innerHTML = `<option value="">Selecione um horário</option>`;
    slots.forEach((slot) => {
      const rawHour = String(slot.hour || "");
      const numericHour = String(Number(rawHour.split(":")[0] || rawHour));
      const option = document.createElement("option");
      option.value = numericHour;
      option.textContent = rawHour;
      timeSelect.appendChild(option);
    });

    updateScheduleTimeMessage(
      `Foram encontrados ${slots.length} horários disponíveis.`,
    );
  } catch (error) {
    console.error("Erro ao buscar horários disponíveis:", error);

    // Verificar se o erro é específico - dia não disponível
    if (
      error.code === "DAY_NOT_AVAILABLE" ||
      error.message?.includes("não trabalha nesse dia")
    ) {
      timeSelect.innerHTML = `<option value="">Dia indisponível</option>`;
      updateScheduleTimeMessage(
        "Dia indisponível. O prestador não trabalha nesse dia.",
      );
    } else if (
      error.code === "SERVICE_INACTIVE" ||
      error.message?.toLowerCase().includes("serviço inativo")
    ) {
      timeSelect.innerHTML = `<option value="">Serviço inativo</option>`;
      updateScheduleTimeMessage(
        "Este serviço está inativo e não pode ser agendado no momento.",
      );
    } else {
      timeSelect.innerHTML = `<option value="">Erro ao carregar horários</option>`;
      updateScheduleTimeMessage(
        "Não foi possível carregar horários. Tente novamente mais tarde.",
      );
    }
  }
}

// Listagem de serviços do prestador (Painel Administrativo)
async function loadProviderServices() {
  const list = document.getElementById("provider-services-list");
  const progress = document.getElementById("service-limit-progress");
  const count = document.getElementById("service-count");

  if (!list || !progress || !count) return;

  list.innerHTML = `<div class="col-span-full text-sm text-stone-500">Carregando serviços do painel...</div>`;

  try {
    const response = await apiGetMyServices();
    const items = Array.isArray(response?.items) ? response.items : [];
    currentProviderServices = items;
    const serviceCount = items.length;

    list.innerHTML = "";

    if (serviceCount === 0) {
      list.innerHTML = `<div class="bg-white border border-stone-200 rounded-2xl p-5 text-sm text-stone-500">Nenhum serviço cadastrado ainda. Crie um novo serviço para aparecer aqui.</div>`;
    } else {
      items.forEach((service) => {
        const isActive = service.active !== false;
        const card = document.createElement("article");
        card.className =
          "service-card-item min-w-0 max-w-full overflow-hidden bg-white border border-stone-200 rounded-2xl p-5 flex flex-col gap-4";
        card.innerHTML = `
        <div class="min-w-0 flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0 max-w-full">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-stone-900 text-sm truncate">${escapeHTML(
                service.title,
              )}</span>
              <span class="text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                isActive
                  ? "text-teal-700 bg-teal-50"
                  : "text-amber-700 bg-amber-50"
              }">${isActive ? "Ativo" : "Inativo"}</span>
            </div>
            <p class="text-xs text-stone-400">${escapeHTML(
              service.duration,
            )} min · ${formatPrice(service.price)}</p>
            <p class="service-description content-wrap text-xs text-stone-500 mt-2">${escapeHTML(
              service.description,
            )}</p>
            <button type="button" class="btn-toggle-description hidden text-xs font-medium text-teal-700 hover:text-teal-800 mt-1">
              Ver mais
            </button>
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <button type="button" data-service-id="${service._id}" data-next-active="${isActive ? "false" : "true"}" class="btn-toggle-service-status h-8 px-2.5 flex items-center justify-center rounded-lg border ${
              isActive
                ? "border-amber-200 hover:bg-amber-50 text-amber-700"
                : "border-teal-200 hover:bg-teal-50 text-teal-700"
            } text-xs font-medium">
              ${isActive ? "Inativar" : "Ativar"}
            </button>
            <button type="button" data-service-id="${service._id}" class="btn-edit-service w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-400 hover:text-stone-700">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M9 1.5l2.5 2.5L4 11.5H1.5V9L9 1.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
              </svg>
            </button>
            <button type="button" data-service-id="${service._id}" class="btn-delete-service w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 hover:bg-rose-50 text-stone-400 hover:text-rose-600">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M1.5 3.5h10M4 3.5V2.5a1 1 0 011-1h3a1 1 0 011 1v1M5 6v4M8 6v4M2.5 3.5l.5 7.5a1 1 0 001 1h5a1 1 0 001-1l.5-7.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        </div>
      `;

        list.appendChild(card);
        setupDescriptionToggle(card);
      });

      list.querySelectorAll(".btn-delete-service").forEach((button) => {
        button.addEventListener("click", async (event) => {
          const serviceId = event.currentTarget.dataset.serviceId;
          if (!serviceId) return;
          const confirmed = window.confirm(
            "Tem certeza que deseja excluir este serviço?",
          );
          if (!confirmed) return;

          try {
            await apiDeleteService(serviceId);
            showToast("Serviço excluído com sucesso.", "success");
            await loadProviderServices();
            await loadServices();
          } catch (error) {
            console.error("Erro ao excluir serviço:", error);
            showToast(
              error.message || "Não foi possível excluir o serviço.",
              "error",
            );
          }
        });
      });

      list.querySelectorAll(".btn-edit-service").forEach((button) => {
        button.addEventListener("click", (event) => {
          const serviceId = event.currentTarget.dataset.serviceId;
          const service = items.find((item) => String(item._id) === serviceId);
          if (!service) return;
          currentEditingServiceId = serviceId;
          const titleInput = document.getElementById("new-service-title");
          const priceInput = document.getElementById("new-service-price");
          const durationInput = document.getElementById("new-service-duration");
          const descriptionInput = document.getElementById(
            "new-service-description",
          );
          const saveBtn = document.getElementById("save-new-service-btn");
          const formPanel = document.getElementById("new-service-form-panel");

          if (titleInput) titleInput.value = service.title || "";
          if (priceInput) priceInput.value = service.price || "";
          if (durationInput) durationInput.value = service.duration || "";
          if (descriptionInput)
            descriptionInput.value = service.description || "";
          if (saveBtn) saveBtn.textContent = "Salvar alterações";
          if (formPanel) formPanel.classList.remove("hidden");
          document.getElementById("new-service-title")?.focus();
        });
      });
    }

    const percent = Math.min(
      100,
      Math.round((serviceCount / MAX_SERVICES) * 100),
    );
    progress.style.width = `${percent}%`;
    count.textContent = `${serviceCount} / ${MAX_SERVICES} serviços`;
  } catch (error) {
    console.error("Erro ao carregar serviços do painel:", error);
    if (isAuthError(error)) return;
    list.innerHTML = `<div class="bg-white border border-stone-200 rounded-2xl p-5 text-sm text-rose-500">Erro ao carregar serviços do painel.</div>`;
  }
}

// Listagem e filtro de agendamentos do prestador (Painel Administrativo)
async function loadProviderAppointments() {
  const list = document.getElementById("provider-appointments-list");
  const statusSelect = document.getElementById("appointment-status-filter");
  const dateInput = document.getElementById("appointment-date-filter");

  if (!list) return;

  list.innerHTML = `<div class="col-span-full text-sm text-stone-500">Carregando agendamentos...</div>`;

  try {
    const response = await apiGetAppointments();
    const items = Array.isArray(response?.agendamento)
      ? response.agendamento
      : response?.data?.agendamento || [];
    currentProviderAppointments = items;

    const filtered = items.filter((appointment) => {
      const statusFilter = statusSelect?.value || "all";
      const dateFilter = dateInput?.value;
      const normalizedStatus = normalizeAppointmentStatus(appointment.status);
      const matchesStatus =
        statusFilter === "all" || normalizedStatus === statusFilter;
      // Usar formatDateToInput para evitar problemas de timezone
      const appointmentDate = appointment.date
        ? formatDateToInput(new Date(appointment.date))
        : "";
      const matchesDate = !dateFilter || appointmentDate === dateFilter;
      return matchesStatus && matchesDate;
    });

    if (filtered.length === 0) {
      list.innerHTML = `<div class="bg-white border border-stone-200 rounded-2xl p-5 text-sm text-stone-500">Nenhum agendamento encontrado.</div>`;
      return;
    }

    list.innerHTML = "";
    filtered.forEach((appointment) => {
      const dateString = appointment.date
        ? new Date(appointment.date).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "--/--/----";

      const timeString = appointment.startAt
        ? new Date(appointment.startAt).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : appointment.hora || appointment.time || "--:--";

      const status = normalizeAppointmentStatus(appointment.status);
      const isCompleted = status === "completed";
      const isCancelled = status === "cancelled";
      const badgeClass = isCompleted
        ? "badge-completed text-teal-700 bg-teal-50"
        : isCancelled
          ? "badge-cancelled text-rose-700 bg-rose-50"
          : "badge-scheduled text-teal-700 bg-teal-50";

      const statusLabel =
        status === "completed"
          ? "Concluído"
          : status === "cancelled"
            ? "Cancelado"
            : "Agendado";

      const card = document.createElement("article");
      card.className = "bg-white border border-stone-200 rounded-2xl p-4";
      card.innerHTML = `
      <div class="flex items-start justify-between gap-3 mb-3">
        <div>
          <p class="font-medium text-stone-900 text-sm">${escapeHTML(
            appointment.clientName,
          )}</p>
          <p class="text-xs text-stone-400">${escapeHTML(
            appointment.clientEmail,
          )}</p>
        </div>
        <span class="text-xs ${badgeClass} px-2.5 py-1 rounded-full font-medium flex-shrink-0">${escapeHTML(statusLabel)}</span>
      </div>
      <div class="flex gap-4 text-xs text-stone-400 mb-3">
        <span>${escapeHTML(
          appointment.serviceId?.title || appointment.serviceName || "Serviço",
        )}</span>
        <span class="font-mono">${dateString} · ${timeString}</span>
      </div>
      <div class="flex gap-2 mt-3">
        ${!isCompleted && !isCancelled ? `<button type="button" data-appointment-id="${appointment._id}" class="btn-complete-appointment text-xs px-3 py-2 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition font-medium">Marcar como concluído</button>` : ""}
        ${!isCompleted && !isCancelled ? `<button type="button" data-appointment-id="${appointment._id}" class="btn-cancel-appointment text-xs px-3 py-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition font-medium">Cancelar</button>` : ""}
      </div>
    `;

      list.appendChild(card);
    });

    // Adicionar event listeners para os botões de status
    list.querySelectorAll(".btn-complete-appointment").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const appointmentId = event.currentTarget.dataset.appointmentId;
        if (!appointmentId) return;
        await updateAppointmentStatus(appointmentId, "completed");
      });
    });

    list.querySelectorAll(".btn-cancel-appointment").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const appointmentId = event.currentTarget.dataset.appointmentId;
        if (!appointmentId) return;
        const confirmed = window.confirm(
          "Tem certeza que deseja cancelar este agendamento?",
        );
        if (!confirmed) return;
        await updateAppointmentStatus(appointmentId, "cancelled");
      });
    });
  } catch (error) {
    console.error("Erro ao carregar agendamentos:", error);
    if (isAuthError(error)) return;
    list.innerHTML = `<div class="bg-white border border-stone-200 rounded-2xl p-5 text-sm text-rose-500">Erro ao carregar agendamentos.</div>`;
  }
}

// Submissão do formulário de agendamento (Cliente)
async function handleScheduleSubmit(event) {
  event.preventDefault();
  const serviceId = document.getElementById("selected-service-id")?.value;
  const nome = document.getElementById("schedule-name")?.value.trim();
  const email = document.getElementById("schedule-email")?.value.trim();
  const tel = document.getElementById("schedule-phone")?.value.trim();
  const data = document.getElementById("schedule-date")?.value;
  const hora = document.getElementById("schedule-time")?.value;

  if (!serviceId || !nome || !email || !tel || !data || !hora) {
    showToast("Preencha todos os campos do agendamento.", "error");
    return;
  }

  try {
    await apiCreateAppointment({ nome, email, tel, data, hora, serviceId });
    showToast("Agendamento criado com sucesso!", "success");
    document.getElementById("modal-overlay").classList.remove("open");
    clearScheduleModal();
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    showToast(
      error.message || "Não foi possível criar o agendamento.",
      "error",
    );
  }
}

// Submissão do formulário de criação/edição de serviços (Prestador)
async function handleServiceFormSubmit(event) {
  event.preventDefault();

  const title = document.getElementById("new-service-title")?.value.trim();
  const description = document
    .getElementById("new-service-description")
    ?.value.trim();
  const duration = document.getElementById("new-service-duration")?.value;
  const price = document.getElementById("new-service-price")?.value;

  if (!title || !description || !duration || !price) {
    showToast("Preencha todos os campos do serviço.", "error");
    return;
  }

  const payload = {
    title,
    description,
    duration: Number(duration),
    price: Number(price),
  };

  try {
    if (currentEditingServiceId) {
      await apiUpdateService(currentEditingServiceId, payload);
      showToast("Serviço atualizado com sucesso.", "success");
    } else {
      await apiCreateService(payload);
      showToast("Serviço criado com sucesso.", "success");
    }

    currentEditingServiceId = null;
    closeServiceFormPanel();
    await loadProviderServices();
    await loadServices();
  } catch (error) {
    console.error("Erro ao salvar serviço:", error);
    showToast(error.message || "Não foi possível salvar o serviço.", "error");
  }
}

// Aplicação de filtros no painel de agendamentos
async function applyProviderFilters() {
  await loadProviderAppointments();
}

async function handleProviderServiceListClick(event) {
  const toggleButton = event.target.closest(".btn-toggle-service-status");
  if (toggleButton) {
    const serviceId = toggleButton.dataset.serviceId;
    const nextActive = toggleButton.dataset.nextActive === "true";

    if (!serviceId) return;

    try {
      toggleButton.disabled = true;
      await apiUpdateService(serviceId, { active: nextActive });
      showToast(
        nextActive
          ? "Serviço marcado como ativo."
          : "Serviço marcado como inativo.",
        "success",
      );
      await loadProviderServices();
      await loadServices();
    } catch (error) {
      console.error("Erro ao atualizar status do serviço:", error);
      showToast(
        error.message || "Não foi possível atualizar o status do serviço.",
        "error",
      );
    } finally {
      toggleButton.disabled = false;
    }

    return;
  }
}

// Carregamento global de serviços para a vitrine
async function loadServices() {
  const grid = document.getElementById("services-grid");
  if (!grid) return;

  grid.innerHTML = `<div class="col-span-full text-sm text-stone-500">Carregando serviços...</div>`;

  try {
    const result = await apiGetAllServices();
    const items = Array.isArray(result?.items) ? result.items : [];
    currentPublicServices = items.filter(
      (service) => service?.active !== false,
    );
    filterPublicServices();
  } catch (error) {
    console.error("Erro ao carregar serviços:", error);
    showToast(
      "Não foi possível carregar os serviços. Tente novamente mais tarde.",
      "error",
    );
    grid.innerHTML = `<div class="col-span-full text-sm text-rose-500">Erro ao carregar serviços.</div>`;
  }
}

// Autenticação: Login
async function handleLogin(event) {
  console.log("🔵 handleLogin chamado", event);
  event.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const senha = document.getElementById("login-password").value;
  const submitBtn = document.getElementById("login-submit");

  console.log("📧 Email:", email, "| Senha preenchida:", !!senha);

  if (!validateRequiredFields([email, senha])) {
    showToast("Os campos de e-mail e senha são obrigatórios.", "error");
    return;
  }

  if (!validarEmail(email)) {
    showToast("Por favor, digite um e-mail válido.", "error");
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = "Entrando...";
    }

    const response = await apiLogin(email, senha);

    if (response && response.token) {
      saveAuth(response.token, response.user || response.prestador);
      authExpiredToastShown = false;
      updateAuthUi();
      closeLoginModal();
      showToast("Login realizado com sucesso!", "success");

      loadProviderServices();
      loadWorkingHours();
      loadProviderAppointments();
    } else {
      throw new Error("Token não recebido do servidor");
    }
  } catch (error) {
    console.error("Erro no login:", error);
    showToast(
      error.message || "Erro ao fazer login. Verifique suas credenciais.",
      "error",
    );
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = "Entrar";
    }
  }
}

// Autenticação: Registro
async function handleRegister(event) {
  event.preventDefault();

  const nome = document.getElementById("register-name")?.value.trim();
  const email = document.getElementById("register-email")?.value.trim();
  const senha = document.getElementById("register-password")?.value;
  const senhaConfirm = document.getElementById(
    "register-confirm-password",
  )?.value;
  const submitBtn = document.getElementById("register-submit");

  if (!validateRequiredFields([nome, email, senha, senhaConfirm])) {
    showToast("Preencha todos os campos do cadastro.", "error");
    return;
  }

  if (!validarNome(nome)) {
    showToast("Por favor, insira seu nome completo.", "error");
    return;
  }

  if (!validarEmail(email)) {
    showToast("Digite um e-mail válido.", "error");
    return;
  }

  if (!validarSenha(senha)) {
    showToast("A senha deve ter pelo menos 6 caracteres.", "error");
    return;
  }

  if (senha !== senhaConfirm) {
    showToast("As senhas não coincidem.", "error");
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = "Cadastrando...";
    }

    await apiRegister({ name: nome, email, password: senha });
    showToast("Cadastro realizado com sucesso! Faça login.", "success");
    closeRegisterModal();
    document.getElementById("login-modal-overlay")?.classList.add("open");
  } catch (error) {
    console.error("Erro no cadastro:", error);
    showToast(error.message || "Erro ao realizar cadastro.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = "Cadastrar";
    }
  }
}

// Inicialização da Aplicação (Event Listeners)
function initApp() {
  console.log("🚀 Inicializando aplicação...");

  sanitizeSensitiveUrlParams();

  if (!window.__authExpiredListenerInitialized) {
    window.addEventListener("auth:expired", (event) => {
      handleSessionExpired(event.detail?.message);
    });
    window.__authExpiredListenerInitialized = true;
  }

  // Inicializar event listeners de UI primeiro
  initUIEventListeners();

  document
    .getElementById("login-form")
    ?.addEventListener("submit", handleLogin);
  document
    .getElementById("register-form")
    ?.addEventListener("submit", handleRegister);
  document
    .getElementById("schedule-form")
    ?.addEventListener("submit", handleScheduleSubmit);
  document
    .getElementById("new-service-form")
    ?.addEventListener("submit", handleServiceFormSubmit);
  document
    .getElementById("working-hours-form")
    ?.addEventListener("submit", handleWorkingHoursSubmit);

  loadServices();
  updateAuthUi();
  updateProviderHeader();

  document.getElementById("logout-btn")?.addEventListener("click", () => {
    clearAuth();
    authExpiredToastShown = false;
    currentProviderServices = [];
    currentProviderAppointments = [];
    currentWorkingHours = null;
    currentEditingServiceId = null;
    updateAuthUi();
    updateProviderHeader();
    toggleWorkingHoursEditor(false);
    showToast("Você saiu da conta.", "success");
  });

  document
    .getElementById("mobile-logout-btn")
    ?.addEventListener("click", () => {
      document.getElementById("logout-btn")?.click();
      document.getElementById("mobile-menu")?.classList.remove("open");
    });

  const user = getUser();
  const token = localStorage.getItem("token");
  if (user && token) {
    loadProviderServices();
    loadWorkingHours();
    loadProviderAppointments();
    toggleWorkingHoursEditor(false);
  }

  document
    .getElementById("service-search")
    ?.addEventListener("input", filterPublicServices);
  document
    .getElementById("service-filter")
    ?.addEventListener("change", filterPublicServices);
  document
    .getElementById("appointment-status-filter")
    ?.addEventListener("change", applyProviderFilters);
  document
    .getElementById("appointment-date-filter")
    ?.addEventListener("change", applyProviderFilters);

  document.getElementById("schedule-date")?.addEventListener("change", (e) => {
    const serviceId = document.getElementById("selected-service-id")?.value;
    if (serviceId && e.target.value) {
      fetchAvailableTimes(serviceId, e.target.value);
    }
  });

  document
    .getElementById("toggle-new-service-form-btn")
    ?.addEventListener("click", () => {
      currentEditingServiceId = null;
      openServiceFormPanel(false);
    });
  document
    .getElementById("cancel-new-service-form-btn")
    ?.addEventListener("click", () => {
      currentEditingServiceId = null;
      closeServiceFormPanel();
    });
  document
    .getElementById("cancel-new-service-btn-2")
    ?.addEventListener("click", () => {
      currentEditingServiceId = null;
      closeServiceFormPanel();
    });

  const providerServicesList = document.getElementById(
    "provider-services-list",
  );
  if (providerServicesList && !providerServicesList.dataset.clickBound) {
    providerServicesList.addEventListener(
      "click",
      handleProviderServiceListClick,
    );
    providerServicesList.dataset.clickBound = "true";
  }

  document
    .getElementById("edit-working-hours-btn")
    ?.addEventListener("click", () => {
      toggleWorkingHoursEditor(true);
    });

  document
    .getElementById("reset-working-hours-btn")
    ?.addEventListener("click", (event) => {
      event.preventDefault();
      resetWorkingHoursFormLocal();
      toggleWorkingHoursEditor(false);
    });
}

document.addEventListener("DOMContentLoaded", initApp);

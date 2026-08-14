const appointments = require("../models/Appointment.js");
const service = require("../models/Service.js");
const working = require("../models/WorkingHours.js");
const { gerarSlots } = require("../utils/slots.js");

function getOccupiedHours(appointmentsList, serviceDuration) {
  const occupiedHours = new Set();

  appointmentsList.forEach((appt) => {
    const start = appt.startAt ? new Date(appt.startAt) : new Date(appt.date);
    const end = appt.endAt
      ? new Date(appt.endAt)
      : new Date(start.getTime() + serviceDuration * 60 * 1000);

    const durationMs = Math.max(
      serviceDuration * 60 * 1000,
      end.getTime() - start.getTime(),
    );
    const hoursOccupied = Math.max(1, Math.ceil(durationMs / (60 * 60 * 1000)));
    const appointmentHour = start.getHours();

    for (let i = 0; i < hoursOccupied; i++) {
      occupiedHours.add(appointmentHour + i);
    }
  });

  return occupiedHours;
}

function hoursAvailable(requestedHour, hoursNeeded, occupiedHours) {
  for (let i = 0; i < hoursNeeded; i++) {
    const hourCheck = requestedHour + i;
    if (occupiedHours.has(hourCheck)) {
      return false;
    }
  }
  return true;
}

function parseDate(dateString) {
  if (!dateString) return null;
  // Dividir string "YYYY-MM-DD" em partes para evitar interpretação como UTC
  const parts = dateString.split("-");
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map(Number);
  // Criar data usando hora local, não UTC
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (isNaN(date.getTime())) return null;
  return date;
}

const appointmentsController = {
  // publico
  getTimes: async (req, res, next) => {
    try {
      const { serviceId } = req.params;
      const { data } = req.query;

      if (!data) {
        const erro = new Error(
          "Parâmetro 'data' é obrigatório (formato: YYYY-MM-DD)",
        );
        erro.status = 400;
        erro.errorCode = "MISSING_DATE";
        return next(erro);
      }

      const requestedDate = parseDate(data);
      if (!requestedDate) {
        const erro = new Error("Data inválida");
        erro.status = 400;
        erro.errorCode = "INVALID_DATE";
        return next(erro);
      }

      const servico = await service.findById(serviceId);
      if (!servico) {
        const erro = new Error("Serviço não encontrado");
        erro.status = 404;
        erro.errorCode = "SERVICE_NOT_FOUND";
        return next(erro);
      }

      if (servico.active === false) {
        const erro = new Error("Serviço inativo");
        erro.status = 400;
        erro.errorCode = "SERVICE_INACTIVE";
        return next(erro);
      }

      const workingHour = await working.findOne({ userId: servico.userId });
      if (!workingHour) {
        const erro = new Error("Tempo de expediente não encontrado");
        erro.status = 404;
        erro.errorCode = "WORKING_HOURS_NOT_FOUND";
        return next(erro);
      }

      // Validar dia da semana
      const dayOfWeek = requestedDate
        .toLocaleDateString("pt-BR", {
          weekday: "long",
        })
        .split("-")[0];
      const daysMap = {
        segunda: "monday",
        terça: "tuesday",
        quarta: "wednesday",
        quinta: "thursday",
        sexta: "friday",
        sábado: "saturday",
        domingo: "sunday",
      };
      const dayKey = daysMap[dayOfWeek] || dayOfWeek;

      if (!workingHour.workingDays[dayKey]) {
        const erro = new Error(
          `Prestador não trabalha nesse dia: ${dayOfWeek}`,
        );
        erro.status = 400;
        erro.errorCode = "DAY_NOT_AVAILABLE";
        return next(erro);
      }

      const allSlots = gerarSlots(
        workingHour.startTime,
        workingHour.endTime,
        requestedDate,
      );

      const startDay = new Date(requestedDate);
      startDay.setHours(0, 0, 0, 0);

      const endDay = new Date(requestedDate);
      endDay.setHours(23, 59, 59, 999);

      const appointmentsList = await appointments.find({
        $or: [
          { startAt: { $gte: startDay, $lte: endDay } },
          { endAt: { $gte: startDay, $lte: endDay } },
          { startAt: { $lt: startDay }, endAt: { $gt: endDay } },
        ],
        status: { $nin: ["cancelled", "completed"] },
      });

      const occupiedHours = getOccupiedHours(
        appointmentsList,
        servico.duration,
      );

      const hoursNeeded = Math.ceil(servico.duration / 60);

      const availableHours = allSlots.filter((slot) => {
        const hour = slot.getHours();

        // Verificar se a hora está no intervalo de descanso
        if (
          workingHour.breakTimeStart &&
          workingHour.breakTimeEnd &&
          hour >= workingHour.breakTimeStart &&
          hour < workingHour.breakTimeEnd
        ) {
          return false;
        }

        return (
          hoursAvailable(hour, hoursNeeded, occupiedHours) && slot > new Date()
        );
      });

      res.status(200).json({
        success: true,
        data: {
          serviceId,
          serviceName: servico.title,
          serviceDuration: servico.duration,
          date: data,
          hoursNeeded,
          occupiedHours: Array.from(occupiedHours),
          availableSlots: availableHours.map((slot) => ({
            time: slot.toISOString(),
            hour: `${slot.getHours().toString().padStart(2, "0")}:00`,
          })),
        },
      });
    } catch (erro) {
      next(erro);
    }
  },
  create: async (req, res, next) => {
    try {
      const mongoose = require("mongoose");

      const { nome, email, tel, data, hora, serviceId } = req.body;

      if (!nome || typeof nome !== "string" || nome.trim().length < 2) {
        const erro = new Error("Nome inválido");
        erro.status = 400;
        erro.errorCode = "INVALID_NAME";
        return next(erro);
      }

      if (
        !email ||
        typeof email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {
        const erro = new Error("E-mail inválido");
        erro.status = 400;
        erro.errorCode = "INVALID_EMAIL";
        return next(erro);
      }

      if (
        !tel ||
        typeof tel !== "string" ||
        tel.replace(/\D/g, "").length < 10
      ) {
        const erro = new Error("Telefone inválido");
        erro.status = 400;
        erro.errorCode = "INVALID_PHONE";
        return next(erro);
      }

      if (!data || typeof data !== "string") {
        const erro = new Error("Data inválida");
        erro.status = 400;
        erro.errorCode = "INVALID_DATE";
        return next(erro);
      }

      if (!hora || typeof hora !== "string" || Number.isNaN(Number(hora))) {
        const erro = new Error("Hora inválida");
        erro.status = 400;
        erro.errorCode = "INVALID_HOUR";
        return next(erro);
      }

      const requestedHour = Number(hora);
      if (
        !Number.isInteger(requestedHour) ||
        requestedHour < 0 ||
        requestedHour > 23
      ) {
        const erro = new Error("Hora deve estar entre 0 e 23");
        erro.status = 400;
        erro.errorCode = "INVALID_HOUR_RANGE";
        return next(erro);
      }

      if (!serviceId || !mongoose.Types.ObjectId.isValid(serviceId)) {
        const erro = new Error("serviceId inválido");
        erro.status = 400;
        erro.errorCode = "INVALID_SERVICE_ID";
        return next(erro);
      }

      // Validar campos obrigatórios
      if (!nome || !email || !tel || !data || !hora || !serviceId) {
        const erro = new Error(
          "Os campos de: Nome, e-mail, telefone, data, hora e serviceId são obrigatórios",
        );
        erro.status = 400;
        erro.errorCode = "MISSING_REQUIRED_FIELDS";
        return next(erro);
      }

      // Parsear a data
      const dataCriada = parseDate(data);
      if (!dataCriada) {
        const erro = new Error("Data inválida");
        erro.status = 400;
        erro.errorCode = "INVALID_DATE";
        return next(erro);
      }

      // Validar se não é data passada
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      if (dataCriada < hoje) {
        const erro = new Error("Não é permitido agendar em datas passadas");
        erro.status = 400;
        erro.errorCode = "PAST_DATE_NOT_ALLOWED";
        return next(erro);
      }

      // Buscar serviço
      const servico = await service.findById(serviceId);
      if (!servico) {
        const erro = new Error("Serviço não encontrado");
        erro.status = 404;
        erro.errorCode = "SERVICE_NOT_FOUND";
        return next(erro);
      }

      if (servico.active === false) {
        const erro = new Error("Serviço inativo");
        erro.status = 400;
        erro.errorCode = "SERVICE_INACTIVE";
        return next(erro);
      }

      // Buscar horário de expediente
      const workingHour = await working.findOne({ userId: servico.userId });
      if (!workingHour) {
        const erro = new Error("Horário de expediente não encontrado");
        erro.status = 404;
        erro.errorCode = "WORKING_HOURS_NOT_FOUND";
        return next(erro);
      }

      // Validar dia da semana
      const dayOfWeek = dataCriada
        .toLocaleDateString("pt-BR", {
          weekday: "long",
        })
        .split("-")[0];
      const daysMap = {
        segunda: "monday",
        terça: "tuesday",
        quarta: "wednesday",
        quinta: "thursday",
        sexta: "friday",
        sábado: "saturday",
        domingo: "sunday",
      };
      const dayKey = daysMap[dayOfWeek] || dayOfWeek;

      if (!workingHour.workingDays[dayKey]) {
        const erro = new Error(
          `Prestador não trabalha nesse dia: ${dayOfWeek}`,
        );
        erro.status = 400;
        erro.errorCode = "DAY_NOT_AVAILABLE";
        return next(erro);
      }

      // Validar se a hora está dentro do horário de expediente
      if (
        requestedHour < workingHour.startTime ||
        requestedHour >= workingHour.endTime
      ) {
        const erro = new Error("Fora do expediente");
        erro.status = 400;
        erro.errorCode = "OUT_OF_WORKING_HOURS";
        return next(erro);
      }

      // Validar intervalo de descanso
      if (
        workingHour.breakTimeStart &&
        workingHour.breakTimeEnd &&
        requestedHour >= workingHour.breakTimeStart &&
        requestedHour < workingHour.breakTimeEnd
      ) {
        const erro = new Error(
          `Horário em período de descanso (${workingHour.breakTimeStart}h-${workingHour.breakTimeEnd}h)`,
        );
        erro.status = 400;
        erro.errorCode = "BREAK_TIME";
        return next(erro);
      }

      const startDay = new Date(dataCriada);
      startDay.setHours(0, 0, 0, 0);

      const endDay = new Date(dataCriada);
      endDay.setHours(23, 59, 59, 999);

      const startAt = new Date(dataCriada);
      startAt.setHours(requestedHour, 0, 0, 0);

      const endAt = new Date(startAt);
      endAt.setMinutes(endAt.getMinutes() + servico.duration);

      const conflito = await appointments.findOne({
        userId: servico.userId,
        status: { $nin: ["cancelled", "completed"] },
        $or: [
          {
            startAt: { $lt: endAt },
            endAt: { $gt: startAt },
          },
        ],
      });

      if (conflito) {
        const erro = new Error("Já existe um agendamento nesse intervalo");
        erro.status = 409;
        erro.errorCode = "APPOINTMENT_CONFLICT";
        return next(erro);
      }

      const appointmentsList = await appointments.find({
        $or: [
          { startAt: { $gte: startDay, $lte: endDay } },
          { endAt: { $gte: startDay, $lte: endDay } },
          { startAt: { $lt: startDay }, endAt: { $gt: endDay } },
        ],
        status: { $nin: ["cancelled", "completed"] },
      });

      // Mapear horas ocupadas
      const occupiedHours = getOccupiedHours(
        appointmentsList,
        servico.duration,
      );

      // Calcular quantas horas são necessárias
      const hoursNeeded = Math.ceil(servico.duration / 60);

      // Validar disponibilidade de slots consecutivos
      if (!hoursAvailable(requestedHour, hoursNeeded, occupiedHours)) {
        const erro = new Error(
          `Horário indisponível. Serviço requer ${hoursNeeded} hora(s) consecutiva(s) a partir das ${requestedHour}:00. Horas ocupadas: ${Array.from(occupiedHours).join(", ")}`,
        );
        erro.status = 409;
        erro.errorCode = "TIME_SLOT_UNAVAILABLE";
        return next(erro);
      }

      const novoAgendamento = await appointments.create({
        clientName: nome,
        clientEmail: email,
        clientPhone: tel,
        date: dataCriada,
        time: hora,
        startAt: startAt,
        endAt: endAt,
        serviceId: serviceId,
        userId: servico.userId,
      });

      res.status(201).json({
        message: "Agendamento criado",
        novoAgendamento,
      });
    } catch (erro) {
      next(erro);
    }
  },

  // usuario
  getAll: async (req, res, next) => {
    try {
      const appointmentsList = await appointments
        .find({ userId: req.user, deletedAt: null })
        .select(
          "date time startAt endAt status clientName clientEmail clientPhone",
        )
        .populate("serviceId", "title");

      res.status(200).json({
        message: "Agendamentos",
        agendamento: appointmentsList,
      });
    } catch (erro) {
      const error = new Error("Erro ao ver agendamento");
      error.status = 500;
      error.errorCode = "GET_APPOINTMENTS_ERROR";
      return next(error);
    }
  },
  update: async (req, res, next) => {
    try {
      const updatePayload = { ...req.body };

      if (typeof updatePayload.status === "string") {
        const normalizedStatus = updatePayload.status.trim().toLowerCase();
        if (
          normalizedStatus === "canceled" ||
          normalizedStatus === "cancelado"
        ) {
          updatePayload.status = "cancelled";
        } else if (
          normalizedStatus === "concluido" ||
          normalizedStatus === "concluído"
        ) {
          updatePayload.status = "completed";
        }
      }

      const updateAgendamento = await appointments.findOneAndUpdate(
        { _id: req.params.id, userId: req.user },
        updatePayload,
        { returnDocument: "after", runValidators: true },
      );
      if (!updateAgendamento) {
        const erro = new Error("Agendamento não encontrado");
        erro.status = 404;
        erro.errorCode = "APPOINTMENT_NOT_FOUND";
        return next(erro);
      }

      res.status(200).json({
        message: "Agendamento editado com sucesso",
        updateAgendamento,
      });
    } catch (erro) {
      next(erro);
    }
  },
  delete: async (req, res, next) => {
    try {
      const deleteAgendamento = await appointments.findOneAndUpdate(
        { _id: req.params.id, userId: req.user, deletedAt: null },
        { status: "cancelled", deletedAt: new Date() },
        { returnDocument: "after" },
      );
      if (!deleteAgendamento) {
        const erro = new Error("Agendamento não encontrado");
        erro.status = 404;
        erro.errorCode = "APPOINTMENT_NOT_FOUND";
        return next(erro);
      }

      res.status(200).json({
        message: "Agendamento excluído com sucesso",
        deleteAgendamento,
      });
    } catch (erro) {
      next(erro);
    }
  },
};

module.exports = appointmentsController;
module.exports.getOccupiedHours = getOccupiedHours;

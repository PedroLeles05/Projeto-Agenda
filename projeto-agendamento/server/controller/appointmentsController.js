const appointments = require("../models/Appointment.js");
const service = require("../models/Service.js");
const working = require("../models/WorkingHours.js");
const { gerarSlots } = require("../utils/slots.js");

function getOccupiedHours(appointmentsList, serviceDuration) {
  const occupiedHours = new Set();

  appointmentsList.forEach((appt) => {
    const appointmentHour = new Date(appt.date).getHours();

    const hoursOccupied = Math.ceil(serviceDuration / 60);

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
  const date = new Date(dateString);
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
        return next(erro);
      }

      const requestedDate = parseDate(data);
      if (!requestedDate) {
        const erro = new Error("Data inválida");
        erro.status = 400;
        return next(erro);
      }

      const servico = await service.findById(serviceId);
      if (!servico) {
        const erro = new Error("Serviço não encontrado");
        erro.status = 404;
        return next(erro);
      }

      const workingHour = await working.find({ userId: servico.userId });
      if (!workingHour) {
        const erro = new Error("Tempo de expediente não encontrado");
        erro.status = 404;
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
        date: { $gte: startDay, $lte: endDay },
        status: { $ne: "cancelled", $ne: "completed" },
      });

      const occupiedHours = getOccupiedHours(
        appointmentsList,
        servico.duration,
      );

      const hoursNeeded = Math.ceil(servico.duration / 60);

      const availableHours = allSlots.filter((slot) => {
        const hour = slot.getHours();

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
      const { nome, email, tel, data, hora, serviceId } = req.body;

      // Validar campos obrigatórios
      if (!nome || !email || !tel || !data || !hora || !serviceId) {
        const erro = new Error(
          "Os campos de: Nome, e-mail, telefone, data, hora e serviceId são obrigatórios",
        );
        erro.status = 400;
        return next(erro);
      }

      // Parsear a data
      const dataCriada = parseDate(data);
      if (!dataCriada) {
        const erro = new Error("Data inválida");
        erro.status = 400;
        return next(erro);
      }

      // Validar se não é data passada
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      if (dataCriada < hoje) {
        const erro = new Error("Não é permitido agendar em datas passadas");
        erro.status = 400;
        return next(erro);
      }

      // Buscar serviço
      const servico = await service.findById(serviceId);
      if (!servico) {
        const erro = new Error("Serviço não encontrado");
        erro.status = 404;
        return next(erro);
      }

      // Buscar horário de expediente
      const workingHour = await working.findOne({ userId: servico.userId });
      if (!workingHour) {
        const erro = new Error("Horário de expediente não encontrado");
        erro.status = 404;
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
        return next(erro);
      }

      // Validar se a hora está dentro do horário de expediente
      const requestedHour = parseInt(hora);
      if (isNaN(requestedHour)) {
        const erro = new Error("Hora inválida");
        erro.status = 400;
        return next(erro);
      }
      if (
        requestedHour < workingHour.startTime ||
        requestedHour >= workingHour.endTime
      ) {
        throw new Error(`Fora do expediente`);
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
        return next(erro);
      }

      const startDay = new Date(dataCriada);
      startDay.setHours(0, 0, 0, 0);

      const endDay = new Date(dataCriada);
      endDay.setHours(23, 59, 59, 999);

      const appointmentsList = await appointments.find({
        date: { $gte: startDay, $lte: endDay },
        status: { $ne: "cancelled", $ne: "completed" },
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
        erro.errorCode = "HORARIO_OCUPADO";
        return next(erro);
      }

      const novoAgendamento = await appointments.create({
        clientName: nome,
        clientEmail: email,
        clientPhone: tel,
        date: dataCriada,
        time: hora,
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
        .find({ userId: req.user })
        .select("date time status clientName clientEmail clientPhone")
        .populate("serviceId", "title");

      res.status(200).json({
        message: "Agendamentos",
        agendamento: appointmentsList,
      });
    } catch (erro) {
      ((erro = new Error("Erro ao ver agendamento")), (erro.status = 500));
      return next(erro);
    }
  },
  update: async (req, res, next) => {
    try {
      const updateAgendamento = await appointments.findOneAndUpdate(
        { _id: req.params.id, userId: req.user },
        req.body,
        { returnDocument: "after" },
      );
      if (!updateAgendamento) {
        const erro = new Error("Agendamento não encontrado");
        erro.status = 404;
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
      const deleteAgendamento = await appointments.findOneAndDelete({
        _id: req.params.id,
        userId: req.user,
      });
      if (!deleteAgendamento) {
        const erro = new Error("Agendamento não encontrado");
        erro.status = 404;
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

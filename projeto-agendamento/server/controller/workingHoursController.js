const working = require("../models/WorkingHours.js");

const workingHoursController = {
  get: async (req, res, next) => {
    try {
      const workingHour = await working.find({ userId: req.user });
      if (!workingHour || workingHour.length === 0) {
        const erro = new Error("Tempo de expediente não encontrado");
        erro.status = 404;
        erro.errorCode = "WORKING_HOURS_NOT_FOUND";
        return next(erro);
      }

      res.status(200).json({
        message: "Tempo de expediente encontrado",
        item: workingHour,
      });
    } catch (erro) {
      next(erro);
    }
  },
  update: async (req, res, next) => {
    try {
      const id = req.params._id;
      if (!id) {
        const erro = new Error("Id do tempo de expediente, não encontrado");
        erro.status = 404;
        erro.errorCode = "WORKING_HOURS_ID_NOT_FOUND";
        return next(erro);
      }

      const { startTime, endTime, breakTimeStart, breakTimeEnd, workingDays } =
        req.body;

      if (!startTime || !endTime) {
        const erro = new Error("Horário de início e fim são obrigatórios");
        erro.status = 400;
        erro.errorCode = "MISSING_WORKING_HOURS";
        return next(erro);
      }

      const startHour = Number(startTime);
      const endHour = Number(endTime);

      if (!Number.isInteger(startHour) || !Number.isInteger(endHour)) {
        const erro = new Error("Os horários devem ser números inteiros");
        erro.status = 400;
        erro.errorCode = "INVALID_WORKING_HOUR_TYPE";
        return next(erro);
      }

      if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
        const erro = new Error("Os horários devem estar entre 0 e 23");
        erro.status = 400;
        erro.errorCode = "WORKING_HOUR_OUT_OF_RANGE";
        return next(erro);
      }

      if (startHour >= endHour) {
        const erro = new Error("O horário de início deve ser menor que o fim");
        erro.status = 400;
        erro.errorCode = "INVALID_TIME_RANGE";
        return next(erro);
      }

      const workingHours = await working
        .findOneAndUpdate({ userId: req.user, _id: id }, req.body, {
          returnDocument: "after",
        })
        .populate("userId", "name email");
      if (!workingHours) {
        const erro = new Error("Tempo de expediente não encontrado");
        erro.status = 404;
        erro.errorCode = "WORKING_HOURS_NOT_FOUND";
        return next(erro);
      }

      res.status(200).json({
        message: "Alterações feitas",
        dias: workingHours.workingDays,
        inicio: workingHours.startTime,
        fim: workingHours.endTime,
        intervaloInit: workingHours.breakTimeStart,
        intervaloEnd: workingHours.breakTimeEnd,
        userName: workingHours.userId.name,
        userEmail: workingHours.userId.email,
      });
    } catch (erro) {
      next(erro);
    }
  },
};

module.exports = workingHoursController;

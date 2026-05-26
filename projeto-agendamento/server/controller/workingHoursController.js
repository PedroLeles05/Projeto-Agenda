const working = require("../models/WorkingHours.js");

const workingHoursController = {
  get: async (req, res, next) => {
    try {
      const workingHour = await working.find({ userId: req.user });
      if (!workingHour) {
        const erro = new Error("Tempo de expediente não encontrado");
        erro.status = 404;
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

const service = require("../models/Service.js");

const serviceController = {
  getPublicAll: async (req, res, next) => {
    try {
      const listaServico = await service
        .find({ active: { $ne: false }, deletedAt: null })
        .populate("userId", "name");
      res.status(200).json({
        message: "Serviços encontrados",
        items: listaServico,
      });
    } catch (erro) {
      next(erro);
    }
  },
  getAll: async (req, res, next) => {
    try {
      const servicos = await service
        .find({ userId: req.user, deletedAt: null })
        .select("title description duration price active userId");

      if (servicos.length === 0) {
        const erro = new Error("Serviços não encontrados");
        erro.status = 404;
        erro.errorCode = "SERVICES_NOT_FOUND";
        return next(erro);
      }

      res.status(200).json({
        message: "Serviços encontrados",
        quantidade: servicos.length,
        items: servicos,
      });
    } catch (erro) {
      next(erro);
    }
  },
  getById: async (req, res, next) => {
    try {
      const servico = await service
        .findOne({ _id: req.params.id, userId: req.user, deletedAt: null })
        .populate("userId", "name");

      if (!servico) {
        const erro = new Error("Serviço não encontrado");
        erro.status = 404;
        erro.errorCode = "SERVICE_NOT_FOUND";
        return next(erro);
      }
      res.status(200).json({
        message: "Serviço encontrado",
        servico,
      });
    } catch (erro) {
      next(erro);
    }
  },
  create: async (req, res, next) => {
    try {
      const { title, description, duration, price, active } = req.body;

      if (!title || typeof title !== "string" || title.trim().length < 2) {
        const erro = new Error("Título inválido");
        erro.status = 400;
        erro.errorCode = "INVALID_TITLE";
        return next(erro);
      }

      if (
        !description ||
        typeof description !== "string" ||
        description.trim().length < 5
      ) {
        const erro = new Error("Descrição inválida");
        erro.status = 400;
        erro.errorCode = "INVALID_DESCRIPTION";
        return next(erro);
      }

      if (!duration || Number.isNaN(Number(duration))) {
        const erro = new Error("Duração inválida");
        erro.status = 400;
        erro.errorCode = "INVALID_DURATION";
        return next(erro);
      }

      const durationValue = Number(duration);
      if (
        !Number.isInteger(durationValue) ||
        durationValue < 15 ||
        durationValue > 480
      ) {
        const erro = new Error("Duração deve estar entre 15 e 480 minutos");
        erro.status = 400;
        erro.errorCode = "INVALID_DURATION_RANGE";
        return next(erro);
      }

      if (!price || Number.isNaN(Number(price))) {
        const erro = new Error("Preço inválido");
        erro.status = 400;
        erro.errorCode = "INVALID_PRICE";
        return next(erro);
      }

      const priceValue = Number(price);
      if (priceValue < 0) {
        const erro = new Error("Preço não pode ser negativo");
        erro.status = 400;
        erro.errorCode = "INVALID_PRICE_RANGE";
        return next(erro);
      }

      const totalServico = await service.countDocuments({
        userId: req.user,
        deletedAt: null,
      });
      if (totalServico >= 5) {
        const erro = new Error("Limite de serviços atingidos");
        erro.status = 403;
        erro.errorCode = "SERVICE_LIMIT_REACHED";
        return next(erro);
      }

      const novoServico = await service.create({
        userId: req.user,
        title: title.trim(),
        description: description.trim(),
        duration: durationValue,
        price: priceValue,
        active: typeof active === "boolean" ? active : true,
      });
      res.status(201).json({
        message: "Serviço criado com sucesso",
        novoServico,
      });
    } catch (erro) {
      next(erro);
    }
  },
  update: async (req, res, next) => {
    try {
      const updatePayload = {};

      if ("title" in req.body) {
        if (
          typeof req.body.title !== "string" ||
          req.body.title.trim().length < 2
        ) {
          const erro = new Error("Título inválido");
          erro.status = 400;
          erro.errorCode = "INVALID_TITLE";
          return next(erro);
        }
        updatePayload.title = req.body.title.trim();
      }

      if ("description" in req.body) {
        if (
          typeof req.body.description !== "string" ||
          req.body.description.trim().length < 5
        ) {
          const erro = new Error("Descrição inválida");
          erro.status = 400;
          erro.errorCode = "INVALID_DESCRIPTION";
          return next(erro);
        }
        updatePayload.description = req.body.description.trim();
      }

      if ("duration" in req.body) {
        const durationValue = Number(req.body.duration);
        if (
          !Number.isInteger(durationValue) ||
          durationValue < 15 ||
          durationValue > 480
        ) {
          const erro = new Error("Duração deve estar entre 15 e 480 minutos");
          erro.status = 400;
          erro.errorCode = "INVALID_DURATION_RANGE";
          return next(erro);
        }
        updatePayload.duration = durationValue;
      }

      if ("price" in req.body) {
        const priceValue = Number(req.body.price);
        if (Number.isNaN(priceValue) || priceValue < 0) {
          const erro = new Error("Preço inválido");
          erro.status = 400;
          erro.errorCode = "INVALID_PRICE";
          return next(erro);
        }
        updatePayload.price = priceValue;
      }

      if ("active" in req.body) {
        if (typeof req.body.active !== "boolean") {
          const erro = new Error("Status do serviço inválido");
          erro.status = 400;
          erro.errorCode = "INVALID_SERVICE_STATUS";
          return next(erro);
        }
        updatePayload.active = req.body.active;
      }

      if (Object.keys(updatePayload).length === 0) {
        const erro = new Error("Nenhum campo válido para atualizar");
        erro.status = 400;
        erro.errorCode = "EMPTY_UPDATE_PAYLOAD";
        return next(erro);
      }

      const servicoAntigo = await service.findOne({
        _id: req.params.id,
        userId: req.user,
        deletedAt: null,
      });

      const servicoUpdate = await service
        .findOneAndUpdate(
          { _id: req.params.id, userId: req.user, deletedAt: null },
          updatePayload,
          {
            returnDocument: "after",
          },
        )
        .populate("userId", "nome");

      if (!servicoUpdate) {
        const erro = new Error("Serviço não encontrado");
        erro.status = 404;
        erro.errorCode = "SERVICE_NOT_FOUND";
        return next(erro);
      }

      res.status(200).json({
        message: "Serviço atualizado com sucesso",
        servicoUpdate,
        servicoAntigo,
      });
    } catch (erro) {
      next(erro);
    }
  },
  delete: async (req, res, next) => {
    try {
      const servicoDelete = await service.findOneAndUpdate(
        { _id: req.params.id, userId: req.user, deletedAt: null },
        { active: false, deletedAt: new Date() },
        { returnDocument: "after" },
      );
      if (!servicoDelete) {
        const erro = new Error("Serviço não encontrado");
        erro.status = 404;
        erro.errorCode = "SERVICE_NOT_FOUND";
        return next(erro);
      }

      res.status(200).json({
        message: "Serviço excluído com sucesso",
        servicoDelete,
      });
    } catch (erro) {
      next(erro);
    }
  },
};

module.exports = serviceController;

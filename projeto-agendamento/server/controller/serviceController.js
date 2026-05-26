const service = require("../models/Service.js");

const serviceController = {
  getPublicAll: async (req, res, next) => {
    try {
      const listaServico = await service.find({}).populate("userId", "name");
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
        .find({ userId: req.user })
        .populate("_id", "title duration price status");

      if (servicos.length === 0) {
        const erro = new Error("Serviços não encontrados");
        erro.status = 404;
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
        .findOne({ _id: req.params.id, userId: req.user })
        .populate("userId", "name");

      if (!servico) {
        const erro = new Error("Serviço não encontrado");
        erro.status = 404;
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
      req.body.userId = req.user;
      const { title, description, duration, price } = req.body;
      if (!title || !description || !duration || !price) {
        const erro = new Error(
          "Título, descrição, duração e preço são obrigatórios",
        );
        erro.status = 400;
        return next(erro);
      }

      const totalServico = await service.countDocuments({ userId: req.user });
      if (totalServico >= 5) {
        const erro = new Error("Limite de serviços atingidos");
        erro.status = 403;
        return next(erro);
      }

      const novoServico = await service.create(req.body);
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
      const servicoAntigo = await service.findOne({
        _id: req.params.id,
        userId: req.user,
      });

      const servicoUpdate = await service
        .findOneAndUpdate({ _id: req.params.id, userId: req.user }, req.body, {
          returnDocument: "after",
        })
        .populate("userId", "nome");

      if (!servicoUpdate) {
        const erro = new Error("Serviço não encontrado");
        erro.status = 404;
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
      const servicoDelete = await service.findOneAndDelete({
        _id: req.params.id,
        userId: req.user,
      });
      if (!servicoDelete) {
        const erro = new Error("Serviço não encontrado");
        erro.status = 404;
        return next(erro);
      }

      res.status(200).json({
        message: "Serviço deletado com sucesso",
        servicoDelete,
      });
    } catch (erro) {
      next(erro);
    }
  },
};

module.exports = serviceController;

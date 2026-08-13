const jwt = require("jsonwebtoken");
const user = require("../models/User.js");
const working = require("../models/WorkingHours.js");

const authController = {
  login: async (req, res, next) => {
    try {
      const { email, password, remember } = req.body;

      if (!email || typeof email !== "string") {
        const erro = new Error("E-mail inválido");
        erro.status = 400;
        erro.errorCode = "INVALID_EMAIL";
        return next(erro);
      }

      if (!password || typeof password !== "string") {
        const erro = new Error("Senha inválida");
        erro.status = 400;
        erro.errorCode = "INVALID_PASSWORD";
        return next(erro);
      }

      const usuario = await user.findOne({ email });
      if (!usuario) {
        const erro = new Error("Nenhum usuário encontrado");
        erro.status = 404;
        erro.errorCode = "USER_NOT_FOUND";
        return next(erro);
      }

      const senhaValida = await usuario.validarSenha(password);
      if (!senhaValida) {
        const erro = new Error("Senha inválida");
        erro.status = 401;
        erro.errorCode = "INVALID_CREDENTIALS";
        return next(erro);
      }

      const tempoExpiracao = remember ? "7d" : "1d";

      const token = jwt.sign({ _id: usuario._id }, process.env.JWT_SECRET, {
        expiresIn: tempoExpiracao,
      });

      res.status(200).json({
        message: "Logado",
        token: token,
        tempo: tempoExpiracao,
        user: { name: usuario.name, email: usuario.email },
      });
    } catch (erro) {
      next(erro);
    }
  },
  register: async (req, res, next) => {
    try {
      const { name, email, password } = req.body;

      if (!name || typeof name !== "string" || name.trim().length < 2) {
        const erro = new Error("Nome inválido");
        erro.status = 400;
        erro.errorCode = "INVALID_NAME";
        return next(erro);
      }

      const emailNormalizado = email?.toLowerCase().trim();

      if (
        !emailNormalizado ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)
      ) {
        const erro = new Error("E-mail inválido");
        erro.status = 400;
        erro.errorCode = "INVALID_EMAIL";
        return next(erro);
      }

      if (!password || typeof password !== "string" || password.length < 6) {
        const erro = new Error("Senha deve ter pelo menos 6 caracteres");
        erro.status = 400;
        erro.errorCode = "INVALID_PASSWORD";
        return next(erro);
      }

      const usuarioExistente = await user.findOne({ email: emailNormalizado });
      if (usuarioExistente) {
        const erro = new Error("E-mail já cadastrado");
        erro.status = 409;
        erro.errorCode = "EMAIL_ALREADY_REGISTERED";
        return next(erro);
      }

      const novoUsuario = await user.create(req.body);

      await working.create({
        userId: novoUsuario._id,
        startTime: 9,
        endTime: 18,
      });

      res.status(201).json({
        message: "Usuário criado com sucesso",
        usuario: novoUsuario._id,
        name,
        email,
        expediente: novoUsuario.workingHours,
      });
    } catch (erro) {
      next(erro);
    }
  },
};

module.exports = authController;

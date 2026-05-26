const jwt = require("jsonwebtoken");
const user = require("../models/User.js");
const working = require("../models/WorkingHours.js");

const authController = {
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        const erro = new Error("E-mail e senha são obrigatórios");
        erro.status = 400;
        return next(erro);
      }

      const usuario = await user.findOne({ email });
      if (!usuario) {
        const erro = new Error("Nenhum usuário encontrado");
        erro.status = 404;
        return next(erro);
      }

      const senhaValida = await usuario.validarSenha(password);
      if (!senhaValida) {
        const erro = new Error("Senha inválida");
        erro.status = 401;
        return next(erro);
      }

      const token = jwt.sign({ _id: usuario._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.status(200).json({
        message: "Logado",
        token: token,
        user: { id: usuario._id, name: usuario.name, email: usuario.email },
      });
    } catch (erro) {
      next(erro);
    }
  },
  register: async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        const erro = new Error(
          "Os campos: Nome, e-mail e senha são obrigatórios",
        );
        erro.status = 400;
        return next(erro);
      }
      if (password < 6) {
        const erro = new Error("Senha tem que ter mais que 6 caractéres");
        erro.status = 400;
        return next(erro);
      }

      const novoUsuario = await user.create(req.body);

      const workingHours = await working.create({
        userId: novoUsuario._id,
        startTime: "09:00",
        endTime: "18:00",
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

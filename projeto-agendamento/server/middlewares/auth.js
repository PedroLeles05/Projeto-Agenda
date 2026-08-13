const jwt = require("jsonwebtoken");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const erro = new Error("Token não fornecido");
    erro.status = 401;
    erro.errorCode = "TOKEN_NOT_PROVIDED";
    return next(erro);
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    const erro = new Error("Formato de token inválido");
    erro.status = 401;
    erro.errorCode = "INVALID_TOKEN_FORMAT";
    return next(erro);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded._id;
    next();
  } catch (erro) {
    const error = new Error("Token inválido ou expirado");
    error.status = 401;
    error.errorCode = "INVALID_OR_EXPIRED_TOKEN";
    return next(error);
  }
};

module.exports = authenticateToken;

const jwt = require("jsonwebtoken");

const authenticateToken = async (req, res, next) => {
  const acessToken = req.headers.authorization;
  if (!acessToken) {
    const erro = new Error("Token não fornecido");
    erro.status = 403;
    return next(erro);
  }

  const token = acessToken.split(" ")[1];
  if (!token) {
    const erro = new Error("Formato de token inválido");
    erro.status = 401;
    return next(erro);
  }

  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decode._id;
    next();
  } catch (erro) {
    if (erro.name === "TokenExpiredError") {
      const erro = new Error("Token expirado");
      erro.status = 401;
      return next(erro);
    } else {
      const erro = new Error("Token inválido");
      erro.status = 403;
      return next(erro);
    }
  }
};

module.exports = authenticateToken;

const erroHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;

  console.error(`[Erro]: ${err.message}`);

  res.status(statusCode).json({
    success: false,
    message: err.message || "Erro interno do servidor",
    stack: process.env.NODE_ENV === "development" ? err.stack : {},
  });
};

module.exports = erroHandler;

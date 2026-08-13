const erroHandler = (err, req, res, next) => {
  let statusCode = err.status || 500;
  let errorCode = err.errorCode || "INTERNAL_ERROR";
  let message = err.message || "Erro interno do servidor";

  if (err.name === "ValidationError") {
    statusCode = 400;
    errorCode = "VALIDATION_ERROR";
    message = Object.values(err.errors || {})
      .map((item) => item.message)
      .join(", ");
  } else if (err.code === 11000) {
    statusCode = 409;
    errorCode = "DUPLICATE_ENTRY";
    message = "Registro duplicado";
  } else if (err.name === "CastError") {
    statusCode = 400;
    errorCode = "INVALID_ID";
    message = "Identificador inválido";
  }

  console.error(`[${errorCode}] ${message}`);

  res.status(statusCode).json({
    success: false,
    errorCode,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
};

module.exports = erroHandler;

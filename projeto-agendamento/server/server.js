// Fixa o fuso horário para que datas/horas de agendamento sejam consistentes entre ambientes (local vs. produção)
process.env.TZ = process.env.TZ || "America/Sao_Paulo";

require("dotenv").config({ path: "../.env" });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const userRoute = require("./routes/auth.js");
const serviceRoute = require("./routes/serviceRoutes.js");
const appointmentRoute = require("./routes/appointmentRoutes.js");
const workingRoutes = require("./routes/workingRoutes.js");
const erroHandler = require("./middlewares/erroHandler.js");
const { conectDB } = require("./config/db.js");

const app = express();
const porta = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  "https://agenda-web-v939.onrender.com,http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Origem não permitida pelo CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", "https:"],
        imgSrc: ["'self'", "data:", "https:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        fontSrc: ["'self'", "https:", "data:"],
      },
    },
  }),
);
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(morgan(isProduction ? "combined" : "dev"));

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 200),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    errorCode: "RATE_LIMITED",
    message: "Muitas requisições. Tente novamente em alguns minutos.",
  },
});

app.use("/api/", apiLimiter);

app.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isReady = dbState === 1;

  res.status(isReady ? 200 : 503).json({
    success: isReady,
    status: isReady ? "ok" : "degraded",
    service: "agenda-api",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      readyState: dbState,
      status: isReady ? "connected" : "disconnected",
    },
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/ready", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const ready = dbState === 1;

  res.status(ready ? 200 : 503).json({
    success: ready,
    status: ready ? "ready" : "not-ready",
    database: {
      readyState: dbState,
      status: ready ? "connected" : "disconnected",
    },
  });
});

app.use("/api/working", workingRoutes);
app.use("/api/user", userRoute);
app.use("/api/service", serviceRoute);
app.use("/api/appointment", appointmentRoute);

app.use((req, res, next) => {
  const erro = new Error("Rota não encontrada");
  erro.status = 404;
  erro.errorCode = "ROUTE_NOT_FOUND";
  next(erro);
});

app.use(erroHandler);

conectDB();

app.listen(porta, () => {
  console.log(`Servidor rodando na porta ${porta}`);
  console.log(`Ambiente: ${isProduction ? "production" : "development"}`);
});

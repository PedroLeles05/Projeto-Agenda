require("dotenv").config({ path: "../.env" });
const express = require("express");
const cors = require("cors");
const userRoute = require("./routes/auth.js");
const serviceRoute = require("./routes/serviceRoutes.js");
const appointmentRoute = require("./routes/appointmentRoutes.js");
const workingRoutes = require("./routes/workingRoutes.js");
const erroHandler = require("./middlewares/erroHandler.js");
const { conectDB } = require("./config/db.js");
const app = express();
const porta = process.env.PORT;

app.use(cors("http://127.0.0.1:5500/projeto-agendamento/public/index.html"));
app.use(express.json());

app.use("/api/working", workingRoutes);
app.use("/api/user", userRoute);
app.use("/api/service", serviceRoute);
app.use("/api/appointment", appointmentRoute);

app.use(erroHandler);

conectDB();

app.listen(porta, () => {
  console.log(`Servidor rodando na porta ${porta}`);
});

const mongoose = require("mongoose");
const uri = process.env.MONGO_URI;

async function conectDB() {
  try {
    await mongoose.connect(uri);
    console.log("Conectado com o banco com sucesso!");
  } catch (erro) {
    console.error("Falha ao conectar: ", erro);
  }
}

module.exports = { conectDB };

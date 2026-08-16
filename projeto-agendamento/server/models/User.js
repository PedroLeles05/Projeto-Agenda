const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "E-mail inválido"],
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^\d{10,11}$/, "Telefone inválido"],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this.password, salt);
    this.password = hash;
  } catch (erro) {
    return erro;
  }
});

userSchema.methods.validarSenha = async function (senhaDigitada) {
  const senhaPura = await bcrypt.compare(senhaDigitada, this.password);
  return senhaPura;
};

module.exports = mongoose.model("Users", userSchema);

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true, maxLength: 100 },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  workingHours: { type: Schema.Types.ObjectId, ref: "workingSchema" },
  phone: { type: String },
  services: [{ type: Schema.Types.ObjectId, ref: "Services" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    // return next();
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

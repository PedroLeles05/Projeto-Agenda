const mongoose = require("mongoose");
const { Schema } = mongoose;

const appointmentsSchema = new Schema({
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: "Services",
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  clientName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
  },
  clientEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "E-mail inválido"],
  },
  clientPhone: {
    type: String,
    required: true,
    trim: true,
    match: [/^\d{10,11}$/, "Telefone inválido"],
  },
  date: {
    type: Date,
    required: true,
  },
  startAt: {
    type: Date,
    required: true,
  },
  endAt: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled"],
    default: "scheduled",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Appointments", appointmentsSchema);

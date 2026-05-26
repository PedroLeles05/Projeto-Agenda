const mongoose = require("mongoose");
const { Schema } = mongoose;

const appointmentsSchema = new Schema({
  serviceId: { type: Schema.Types.ObjectId, ref: "Services", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "Users", required: true },
  clientName: { type: String, required: true },
  clientEmail: { type: String, required: true },
  clientPhone: { type: String, required: true },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled"],
    default: "scheduled",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Appointments", appointmentsSchema);

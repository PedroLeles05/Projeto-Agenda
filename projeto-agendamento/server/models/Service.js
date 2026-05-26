const mongoose = require("mongoose");
const { Schema } = mongoose;

const serviceSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "Users", required: true },
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 500 },
  duration: { type: Number, required: true, min: 15, max: 480 },
  price: { type: Number, required: true, min: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Services", serviceSchema);

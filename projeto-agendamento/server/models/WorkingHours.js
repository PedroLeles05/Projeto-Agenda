const mongoose = require("mongoose");
const { Schema } = mongoose;

const workingSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "Users", required: true },
  workingDays: {
    monday: { type: Boolean, default: true },
    tuesday: { type: Boolean, default: true },
    wednesday: { type: Boolean, default: true },
    thursday: { type: Boolean, default: true },
    friday: { type: Boolean, default: true },
    saturday: { type: Boolean, default: false },
    sunday: { type: Boolean, default: false },
  },
  startTime: {
    type: Number,
    required: true,
    min: 0,
    max: 23,
  },
  endTime: {
    type: Number,
    required: true,
    min: 0,
    max: 23,
  },
  breakTimeStart: {
    type: Number,
    min: 0,
    max: 23,
  },
  breakTimeEnd: {
    type: Number,
    min: 0,
    max: 23,
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("workingSchema", workingSchema);

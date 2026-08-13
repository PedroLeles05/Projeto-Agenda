const mongoose = require("mongoose");
const { Schema } = mongoose;

const serviceSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "Users", required: true },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 500,
  },
  duration: {
    type: Number,
    required: true,
    min: 15,
    max: 480,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("Services", serviceSchema);

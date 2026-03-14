const mongoose = require("mongoose");

// Vehiculo publicado en la plataforma.
// Contiene datos visibles al publico y una referencia al usuario propietario.
const vehicleSchema = new mongoose.Schema(
  {
    brand: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    model: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
    },
    year: {
      type: Number,
      required: true,
      min: 1900,
      max: 2100,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    color: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 30,
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["disponible", "vendido"],
      default: "disponible",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

vehicleSchema.index({ brand: 1, model: 1, status: 1, year: 1, price: 1, createdAt: -1 });

module.exports = mongoose.model("Vehicle", vehicleSchema);

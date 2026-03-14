const mongoose = require("mongoose");

// Usuario del sistema.
// Puede iniciar sesion, publicar vehiculos y participar en conversaciones.
const userSchema = new mongoose.Schema(
  {
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    lastname: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true 
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    tokenVersion: {
        type: Number,
        default: 0,
        select: false
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

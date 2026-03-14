require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const messageRoutes = require("./routes/messageRoutes");

// Punto de entrada del backend.
// Aqui se preparan middlewares globales, rutas REST y la conexion con MongoDB.
const app = express();
const uploadsDir = path.join(__dirname, "uploads", "vehicles");

fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET no esta configurado");
  process.exit(1);
}

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/messages", messageRoutes);

// Manejo centralizado de errores de middlewares como multer.
app.use((error, _req, res, next) => {
  if (!error) {
    return next();
  }

  return res.status(400).json({
    message: error.message || "Ocurrio un error procesando la solicitud",
  });
});

const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Mongo conectado");
    app.listen(PORT, () => console.log(`API en http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Error Mongo:", err);
    process.exit(1);
  });

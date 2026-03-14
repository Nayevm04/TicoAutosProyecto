const multer = require("multer");
const path = require("path");

// Middleware de subida de imagenes.
// Limita tipos permitidos, cantidad maxima y tamano de archivo.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads", "vehicles"));
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Solo se permiten imagenes JPG, PNG o WEBP"));
  }

  cb(null, true);
};

const uploadVehicleImages = multer({
  storage,
  fileFilter,
  limits: {
    files: 6,
    fileSize: 5 * 1024 * 1024,
  },
}).array("images", 6);

module.exports = { uploadVehicleImages };

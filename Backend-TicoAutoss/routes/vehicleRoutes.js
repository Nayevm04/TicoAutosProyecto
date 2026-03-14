const express = require("express");
const router = express.Router();

const {
  vehiclePost,
  vehiclePut,
  vehicleDelete,
  vehicleSold,
  vehicleGet,
  vehicleGetById
} = require("../controllers/vehicleController");
const {
  sendMessageToVehicleOwner,
  getVehicleConversation,
} = require("../controllers/messageController");

const { authenticateToken } = require("../middleware/auth");
const { uploadVehicleImages } = require("../middleware/uploadVehicleImages");

router.get("/", vehicleGet);
router.get("/:id/conversation", authenticateToken, getVehicleConversation);
router.get("/:id", vehicleGetById);

// Crear vehículo (requiere login)
router.post("/", authenticateToken, uploadVehicleImages, vehiclePost);
router.post("/:id/messages", authenticateToken, sendMessageToVehicleOwner);

// Editar vehículo
router.put("/:id", authenticateToken, uploadVehicleImages, vehiclePut);
router.patch("/:id", authenticateToken, uploadVehicleImages, vehiclePut);

// Eliminar vehículo
router.delete("/:id", authenticateToken, vehicleDelete);

// Marcar vehículo como vendido
router.patch("/:id/sold", authenticateToken, vehicleSold);

module.exports = router;

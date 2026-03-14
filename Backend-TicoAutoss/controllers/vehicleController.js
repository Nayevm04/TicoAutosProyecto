const mongoose = require("mongoose");
const Conversation = require("../models/conversation");
const Message = require("../models/message");
const Vehicle = require("../models/vehicle");

// Controlador REST de vehiculos.
// Aqui viven las reglas de filtros, paginacion, permisos del propietario y limpieza de datos relacionados.
const OWNER_SELECT = "name lastname";
const VALID_STATUS = ["disponible", "vendido"];

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const normalizeVehiclePayload = (body = {}) => ({
  brand: body.brand?.trim(),
  model: body.model?.trim(),
  year: Number(body.year),
  price: Number(body.price),
  color: body.color?.trim(),
});

// Convierte los archivos de multer en rutas publicas para el frontend.
const extractVehicleImages = (files = []) =>
  files.map((file) => `/uploads/vehicles/${file.filename}`);

// Validaciones minimas antes de guardar un vehiculo en MongoDB.
const validateVehiclePayload = (payload) => {
  if (!payload.brand || payload.brand.length < 2) {
    return "La marca es obligatoria y debe tener al menos 2 caracteres";
  }

  if (!payload.model) {
    return "El modelo es obligatorio";
  }

  if (!Number.isInteger(payload.year) || payload.year < 1900 || payload.year > 2100) {
    return "El anio del vehiculo es invalido";
  }

  if (!Number.isFinite(payload.price) || payload.price < 0) {
    return "El precio del vehiculo es invalido";
  }

  if (!payload.color || payload.color.length < 2) {
    return "El color es obligatorio y debe tener al menos 2 caracteres";
  }

  return null;
};

const normalizePagination = (query) => {
  const page = Number.parseInt(query.page, 10) || 1;
  const limit = Number.parseInt(query.limit, 10) || 9;

  if (page < 1 || limit < 1 || limit > 50) {
    return null;
  }

  return { page, limit, skip: (page - 1) * limit };
};

// Traduce query params del endpoint en filtros compatibles con MongoDB.
const buildVehicleFilters = (query) => {
  const filters = {};
  const { brand, model, minYear, maxYear, minPrice, maxPrice, status } = query;

  if (brand) {
    filters.brand = { $regex: brand.trim(), $options: "i" };
  }

  if (model) {
    filters.model = { $regex: model.trim(), $options: "i" };
  }

  if (status) {
    if (!VALID_STATUS.includes(status)) {
      return { error: "El estado del vehiculo es invalido" };
    }

    filters.status = status;
  }

  if (minYear || maxYear) {
    filters.year = {};

    if (minYear) {
      const parsedMinYear = Number(minYear);
      if (!Number.isFinite(parsedMinYear)) {
        return { error: "minYear debe ser numerico" };
      }
      filters.year.$gte = parsedMinYear;
    }

    if (maxYear) {
      const parsedMaxYear = Number(maxYear);
      if (!Number.isFinite(parsedMaxYear)) {
        return { error: "maxYear debe ser numerico" };
      }
      filters.year.$lte = parsedMaxYear;
    }
  }

  if (minPrice || maxPrice) {
    filters.price = {};

    if (minPrice) {
      const parsedMinPrice = Number(minPrice);
      if (!Number.isFinite(parsedMinPrice)) {
        return { error: "minPrice debe ser numerico" };
      }
      filters.price.$gte = parsedMinPrice;
    }

    if (maxPrice) {
      const parsedMaxPrice = Number(maxPrice);
      if (!Number.isFinite(parsedMaxPrice)) {
        return { error: "maxPrice debe ser numerico" };
      }
      filters.price.$lte = parsedMaxPrice;
    }
  }

  return { filters };
};

const vehiclePost = async (req, res) => {
  try {
    const payload = normalizeVehiclePayload(req.body);
    const validationError = validateVehiclePayload(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const vehicle = await Vehicle.create({
      ...payload,
      images: extractVehicleImages(req.files),
      userId: req.user._id,
    });

    const vehicleCreated = await Vehicle.findById(vehicle._id).populate("userId", OWNER_SELECT);

    res.header("Location", `/api/vehicles/${vehicleCreated._id}`);
    return res.status(201).json(vehicleCreated);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const vehiclePut = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Vehicle id invalido" });
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    if (vehicle.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You cannot edit this vehicle" });
    }

    const payload = normalizeVehiclePayload(req.body);
    const validationError = validateVehiclePayload(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    // Si el usuario sube nuevas imagenes, se agregan sin borrar las actuales.
    const nextImages = req.files?.length
      ? [...vehicle.images, ...extractVehicleImages(req.files)]
      : vehicle.images;

    const vehicleUpdated = await Vehicle.findByIdAndUpdate(
      req.params.id,
      {
        ...payload,
        images: nextImages,
      },
      { new: true, runValidators: true }
    ).populate("userId", OWNER_SELECT);

    return res.status(200).json(vehicleUpdated);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const vehicleDelete = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Vehicle id invalido" });
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    if (vehicle.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You cannot delete this vehicle" });
    }

    // Tambien se elimina el historial de conversaciones ligado a la publicacion.
    const conversations = await Conversation.find({ vehicleId: vehicle._id }).select("_id");
    const conversationIds = conversations.map((conversation) => conversation._id);

    if (conversationIds.length > 0) {
      await Message.deleteMany({ conversationId: { $in: conversationIds } });
      await Conversation.deleteMany({ _id: { $in: conversationIds } });
    }

    await Vehicle.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const vehicleSold = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Vehicle id invalido" });
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    if (vehicle.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You cannot modify this vehicle" });
    }

    vehicle.status = "vendido";
    await vehicle.save();

    const updatedVehicle = await Vehicle.findById(vehicle._id).populate("userId", OWNER_SELECT);
    return res.status(200).json(updatedVehicle);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const vehicleGet = async (req, res) => {
  try {
    const pagination = normalizePagination(req.query);

    if (!pagination) {
      return res.status(400).json({ message: "Los parametros page y limit son invalidos" });
    }

    const { filters, error } = buildVehicleFilters(req.query);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const { page, limit, skip } = pagination;

    // La paginacion se resuelve en el backend para devolver solo la pagina solicitada.
    const [vehicles, total] = await Promise.all([
      Vehicle.find(filters)
        .populate("userId", OWNER_SELECT)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Vehicle.countDocuments(filters),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      total,
      totalPages,
      page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      results: vehicles,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const vehicleGetById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Vehicle id invalido" });
    }

    const vehicle = await Vehicle.findById(req.params.id).populate("userId", OWNER_SELECT);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // El detalle incluye cuantas conversaciones se han abierto sobre este vehiculo.
    const conversationCount = await Conversation.countDocuments({ vehicleId: vehicle._id });

    return res.status(200).json({
      ...vehicle.toObject(),
      conversationCount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  vehiclePost,
  vehiclePut,
  vehicleDelete,
  vehicleSold,
  vehicleGet,
  vehicleGetById,
};

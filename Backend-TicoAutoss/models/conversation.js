const mongoose = require("mongoose");

// Conversacion principal entre propietario e interesado para un vehiculo especifico.
const conversationSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    interestedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastMessageText: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    ownerUnreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    interestedUnreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

conversationSchema.index(
  { vehicleId: 1, ownerId: 1, interestedUserId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);

const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * Middleware principal de autenticacion.
 * Lee el header Authorization, valida el JWT y carga el usuario autenticado en req.user.
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const [scheme, token] = authHeader ? authHeader.split(" ") : [];

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authentication token required" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("+tokenVersion");

    if (!user) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    if ((user.tokenVersion || 0) !== (payload.tokenVersion || 0)) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    console.error("Error authenticating token:", error);
    return res.status(500).json({ message: "Error authenticating token" });
  }
};

/**
 * Login del sistema.
 * Verifica credenciales y devuelve un JWT firmado que luego se usa en rutas privadas.
 */
const generateToken = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password +tokenVersion");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Comparar contraseña con hash guardado
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        tokenVersion: user.tokenVersion || 0,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.status(201).json({
      message: "Login exitoso",
      token,
      user: { id: user._id, name: user.name, lastname: user.lastname, email: user.email },
    });
  } catch (error) {
    console.error("Error generating token:", error);
    return res.status(500).json({ message: "Error generating token" });
  }
};

/**
 * Logout del sistema.
 * Incrementa tokenVersion para invalidar los JWT antiguos del usuario.
 */
const logout = async (req, res) => {
  try {
    req.user.tokenVersion = (req.user.tokenVersion || 0) + 1;
    await req.user.save();
    return res.json({ message: "Logout exitoso" });
  } catch (error) {
    console.error("Error logout:", error);
    return res.status(500).json({ message: "Error en logout" });
  }
};

module.exports = { authenticateToken, generateToken, logout };

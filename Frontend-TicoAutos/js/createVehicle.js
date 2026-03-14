const API_BASE = "http://localhost:3000";

const token = sessionStorage.getItem("token");

// Si no hay token, no puede crear vehículos
if (!token) {
  window.location.href = "./login.html";
}

const form = document.getElementById("vehicleForm");
const msg = document.getElementById("msg");

// Mostrar mensajes en pantalla
function setMsg(text, type) {
  msg.textContent = text;
  msg.className = `form-message ${type || ""}`;
}

// Cuando el usuario envía el formulario
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const body = {
    brand: document.getElementById("brand").value.trim(),
    model: document.getElementById("model").value.trim(),
    year: document.getElementById("year").value.trim(),
    price: document.getElementById("price").value.trim(),
    color: document.getElementById("color").value.trim()
  };

  // Validación 
  if (!body.brand || !body.model || !body.year || !body.price || !body.color) {
    return setMsg("Todos los campos son obligatorios.", "err");
  }
  try {
    const resp = await fetch(`${API_BASE}/api/vehicles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return setMsg(data.message || "Error creando vehículo.", "err");
    }

    setMsg("Vehículo creado correctamente.", "ok");

    setTimeout(() => {
      window.location.href = "./index.html";
    }, 800);

  } catch (error) {
    console.error("Error creando vehículo:", error);
    setMsg("No se pudo conectar con el servidor.", "err");
  }
});
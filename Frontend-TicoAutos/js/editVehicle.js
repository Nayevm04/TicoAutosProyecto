const API_BASE = "http://localhost:3000";

const token = sessionStorage.getItem("token");

// Si no hay token, no puede editar
if (!token) {
  window.location.href = "./login.html";
}

const form = document.getElementById("editVehicleForm");
const msg = document.getElementById("msg");

// Mostrar mensajes
function setMsg(text, type) {
  msg.textContent = text;
  msg.className = `form-message ${type || ""}`;
}

// Obtener el id desde la URL
const params = new URLSearchParams(window.location.search);
const vehicleId = params.get("id");

// Si no viene id, vuelve al inicio
if (!vehicleId) {
  window.location.href = "./index.html";
}

// Cargar información actual del vehículo
async function loadVehicle() {
  try {
    const resp = await fetch(`${API_BASE}/api/vehicles/${vehicleId}`);
    const data = await resp.json();

    if (!resp.ok) {
      return setMsg(data.message || "Error cargando vehículo.", "err");
    }

    // Llena el formulario con la información actual
    document.getElementById("brand").value = data.brand || "";
    document.getElementById("model").value = data.model || "";
    document.getElementById("year").value = data.year || "";
    document.getElementById("price").value = data.price || "";
    document.getElementById("color").value = data.color || "";

  } catch (error) {
    console.error("Error cargando vehículo:", error);
    setMsg("No se pudo cargar la información del vehículo.", "err");
  }
}

// Guardar cambios
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const body = {
    brand: document.getElementById("brand").value.trim(),
    model: document.getElementById("model").value.trim(),
    year: document.getElementById("year").value.trim(),
    price: document.getElementById("price").value.trim(),
    color: document.getElementById("color").value.trim()
  };

  if (!body.brand || !body.model || !body.year || !body.price || !body.color) {
    return setMsg("Todos los campos son obligatorios.", "err");
  }

  try {
    const resp = await fetch(`${API_BASE}/api/vehicles/${vehicleId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await resp.json();

    if (!resp.ok) {
      return setMsg(data.message || "Error actualizando vehículo.", "err");
    }

    setMsg("Vehículo actualizado correctamente.", "ok");

    setTimeout(() => {
      window.location.href = "./index.html";
    }, 800);

  } catch (error) {
    console.error("Error actualizando vehículo:", error);
    setMsg("No se pudo conectar con el servidor.", "err");
  }
});

// Carga los datos al abrir la página
loadVehicle();
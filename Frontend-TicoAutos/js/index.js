const API_BASE = "http://localhost:3000";

// Verifica si hay token al cargar la página
const token = sessionStorage.getItem("token");
const userId = sessionStorage.getItem("userId");

// Si no hay token, manda al login
if (!token) {
  window.location.href = "./login.html";
}

// Botón cerrar sesión
const logoutBtn = document.getElementById("logoutBtn");
const vehicleList = document.getElementById("vehicleList");

logoutBtn.addEventListener("click", async () => {
  try {
    // Llamamos al backend para borrar el token en la BD
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("Error en logout:", error);
  }

  // Borra token del navegador
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("userId");

  // Redirige al login
  window.location.href = "./login.html";
});

// Ir a la pantalla de crear vehículo
window.goToCreate = function () {
  window.location.href = "./createVehicle.html";
};

// Cargar los vehículos y pintarlos en tarjetas
window.loadVehicles = async function () {
  try {
    const resp = await fetch(`${API_BASE}/api/vehicles`);
    const data = await resp.json();

    vehicleList.innerHTML = "";

    // Si el backend devuelve results, usamos results
    const vehicles = data.results || [];

    // Si no hay resultados, muestra mensaje
    if (vehicles.length === 0) {
      vehicleList.innerHTML = "<p>No hay vehículos publicados.</p>";
      return;
    }

    vehicles.forEach((vehicle) => {
      const card = document.createElement("div");
      card.className = "vehicle-card";

      card.innerHTML = `
        <h3>${vehicle.brand} ${vehicle.model}</h3>
        <p><strong>Año:</strong> ${vehicle.year}</p>
        <p><strong>Precio:</strong> ${vehicle.price}</p>
        <p><strong>Color:</strong> ${vehicle.color}</p>
        <p><strong>Estado:</strong> ${vehicle.status}</p>
        <p><strong>Propietario:</strong> ${vehicle.userId?.name || ""} ${vehicle.userId?.lastname || ""}</p>
      `;

      // Solo muestra botones si el vehículo pertenece al usuario logueado
      if (vehicle.userId && vehicle.userId._id === userId) {
        const actions = document.createElement("div");
        actions.className = "vehicle-actions";

        actions.innerHTML = `
          <button onclick="editVehicle('${vehicle._id}')">Editar</button>
          <button onclick="deleteVehicle('${vehicle._id}')">Eliminar</button>
          <button onclick="markSold('${vehicle._id}')">Marcar vendido</button>
        `;

        card.appendChild(actions);
      }
      vehicleList.appendChild(card);
    });

  } catch (error) {
    console.error("Error cargando vehículos:", error);
    vehicleList.innerHTML = "<p>Error al cargar los vehículos.</p>";
  }
};

// Cargar vehículos apenas abre la página
loadVehicles();

// Eliminar un vehículo
window.deleteVehicle = async function (id) {
  const confirmDelete = confirm("¿Seguro que deseas eliminar este vehículo?");
  if (!confirmDelete) return;

  try {
    const resp = await fetch(`${API_BASE}/api/vehicles/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      alert(data.message || "Error eliminando vehículo");
      return;
    }
    loadVehicles();
  } catch (error) {
    console.error("Error eliminando vehículo:", error);
  }
};

// Marcar un vehículo como vendido
window.markSold = async function (id) {
  try {
    const resp = await fetch(`${API_BASE}/api/vehicles/${id}/sold`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      alert(data.message || "Error marcando vehículo como vendido");
      return;
    }
    loadVehicles();
  } catch (error) {
    console.error("Error marcando vehículo como vendido:", error);
  }
};

// Ir a la pantalla de editar
window.editVehicle = function (id) {
  window.location.href = `./editVehicle.html?id=${id}`;
};
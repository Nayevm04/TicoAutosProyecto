const {
  apiFetch,
  escapeHtml,
  formatCurrency,
  getUser,
  isAuthenticated,
  renderNav,
  resolveMediaUrl,
  setFeedback,
} = window.TicoAutos;

// Pantalla principal publica: filtros, listado y acciones rapidas sobre vehiculos.
const form = document.getElementById("filtersForm");
const list = document.getElementById("vehicleList");
const feedback = document.getElementById("feedback");
const resultsMeta = document.getElementById("resultsMeta");
const paginationLabel = document.getElementById("paginationLabel");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const heroPublishBtn = document.getElementById("heroPublishBtn");
const heroQuestionsBtn = document.getElementById("heroQuestionsBtn");

renderNav("navActions");

if (!isAuthenticated()) {
  heroPublishBtn.href = "./login.html";
  heroQuestionsBtn.href = "./login.html";
}

const params = new URLSearchParams(window.location.search);
const fields = ["brand", "model", "status", "page", "minYear", "maxYear", "minPrice", "maxPrice", "limit"];

fields.forEach((field) => {
  const element = document.getElementById(field);
  if (element && params.has(field)) {
    element.value = params.get(field);
  }
});

const currentUser = getUser();

const createVehicleCard = (vehicle) => {
  const ownerName = `${vehicle.userId?.name || ""} ${vehicle.userId?.lastname || ""}`.trim() || "Sin propietario";
  const isOwner = currentUser && vehicle.userId && vehicle.userId._id === currentUser.id;
  const statusClass = vehicle.status === "vendido" ? "badge sold" : "badge available";

  return `
    <article class="vehicle-card">
      <img class="vehicle-cover" src="${resolveMediaUrl(vehicle.images?.[0])}" alt="${escapeHtml(vehicle.brand)} ${escapeHtml(vehicle.model)}" />
      <div class="card-top">
        <span class="${statusClass}">${escapeHtml(vehicle.status)}</span>
        <span class="card-price">${formatCurrency(vehicle.price)}</span>
      </div>
      <h3>${escapeHtml(vehicle.brand)} ${escapeHtml(vehicle.model)}</h3>
      <p class="vehicle-specs">${escapeHtml(String(vehicle.year))} | ${escapeHtml(vehicle.color)}</p>
      <p class="owner-line">Propietario: ${escapeHtml(ownerName)}</p>
      <div class="card-actions">
        <a class="btn btn-secondary" href="./vehicle.html?id=${vehicle._id}">Ver detalle</a>
        <button type="button" class="btn btn-ghost" data-share="${vehicle._id}">Compartir</button>
      </div>
      ${isOwner ? `
        <div class="owner-actions">
          <button type="button" class="btn btn-ghost" data-edit="${vehicle._id}">Editar</button>
          <button type="button" class="btn btn-ghost danger" data-delete="${vehicle._id}">Eliminar</button>
          <button type="button" class="btn btn-ghost" data-sold="${vehicle._id}">Marcar vendido</button>
        </div>
      ` : ""}
    </article>
  `;
};

const buildQuery = () => {
  // Mantiene los filtros en la URL para poder compartir o refrescar la busqueda.
  const query = new URLSearchParams();

  fields.forEach((field) => {
    const value = document.getElementById(field)?.value?.trim();
    if (value) {
      query.set(field, value);
    }
  });

  return query;
};

const loadVehicles = async () => {
  try {
    setFeedback(feedback, "");
    list.innerHTML = "<div class=\"empty-state\">Cargando vehiculos...</div>";

    const query = buildQuery();
    // El filtrado y la paginacion se resuelven en backend.
    const data = await apiFetch(`/api/vehicles?${query.toString()}`);

    if (!data.results.length) {
      list.innerHTML = "<div class=\"empty-state\">No encontramos vehiculos con esos filtros.</div>";
    } else {
      list.innerHTML = data.results.map(createVehicleCard).join("");
    }

    resultsMeta.textContent = `${data.total} resultados totales`;
    paginationLabel.textContent = `Pagina ${data.page} de ${data.totalPages}`;
    prevPageBtn.disabled = !data.hasPrevPage;
    nextPageBtn.disabled = !data.hasNextPage;
  } catch (error) {
    list.innerHTML = "<div class=\"empty-state\">No fue posible cargar los vehiculos.</div>";
    setFeedback(feedback, error.message || "No fue posible cargar los vehiculos", "error");
  }
};

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const pageInput = document.getElementById("page");
  if (!pageInput.value || Number(pageInput.value) < 1) {
    pageInput.value = "1";
  }

  const query = buildQuery();
  window.history.replaceState({}, "", `./index.html?${query.toString()}`);
  loadVehicles();
});

clearFiltersBtn.addEventListener("click", () => {
  form.reset();
  document.getElementById("page").value = "1";
  document.getElementById("limit").value = "9";
  window.history.replaceState({}, "", "./index.html");
  loadVehicles();
});

prevPageBtn.addEventListener("click", () => {
  const pageInput = document.getElementById("page");
  pageInput.value = String(Math.max(1, Number(pageInput.value || 1) - 1));
  form.dispatchEvent(new Event("submit"));
});

nextPageBtn.addEventListener("click", () => {
  const pageInput = document.getElementById("page");
  pageInput.value = String(Number(pageInput.value || 1) + 1);
  form.dispatchEvent(new Event("submit"));
});

list.addEventListener("click", async (event) => {
  const shareId = event.target.dataset.share;
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;
  const soldId = event.target.dataset.sold;

  if (shareId) {
    const publicUrl = new URL(`./vehicle.html?id=${shareId}`, window.location.href).href;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setFeedback(feedback, "Enlace copiado al portapapeles", "success");
    } catch (error) {
      window.prompt("Copia este enlace", publicUrl);
    }
  }

  if (editId) {
    window.location.href = `./editVehicle.html?id=${editId}`;
  }

  if (deleteId) {
    if (!window.confirm("Deseas eliminar este vehiculo?")) {
      return;
    }

    try {
      await apiFetch(`/api/vehicles/${deleteId}`, { method: "DELETE", auth: true });
      setFeedback(feedback, "Vehiculo eliminado correctamente", "success");
      loadVehicles();
    } catch (error) {
      setFeedback(feedback, error.message || "No fue posible eliminar el vehiculo", "error");
    }
  }

  if (soldId) {
    try {
      await apiFetch(`/api/vehicles/${soldId}/sold`, { method: "PATCH", auth: true });
      setFeedback(feedback, "Vehiculo marcado como vendido", "success");
      loadVehicles();
    } catch (error) {
      setFeedback(feedback, error.message || "No fue posible marcar el vehiculo", "error");
    }
  }
});

loadVehicles();

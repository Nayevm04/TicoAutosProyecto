const {
  apiFetch,
  renderNav,
  requireAuth,
  setFeedback,
} = window.TicoAutos;

if (requireAuth("./login.html")) {
  // Formulario privado para editar un vehiculo ya publicado.
  renderNav("navActions");

  const form = document.getElementById("editVehicleForm");
  const imagesInput = document.getElementById("images");
  const currentImages = document.getElementById("currentImages");
  const imagePreview = document.getElementById("imagePreview");
  const msg = document.getElementById("msg");
  const updateBtn = document.getElementById("updateVehicleBtn");
  const params = new URLSearchParams(window.location.search);
  const vehicleId = params.get("id");

  if (!vehicleId) {
    window.location.href = "./index.html";
  }

  const fillForm = (vehicle) => {
    // Rellena el formulario con los datos actuales del vehiculo.
    document.getElementById("brand").value = vehicle.brand || "";
    document.getElementById("model").value = vehicle.model || "";
    document.getElementById("year").value = vehicle.year || "";
    document.getElementById("price").value = vehicle.price || "";
    document.getElementById("color").value = vehicle.color || "";
    currentImages.innerHTML = (vehicle.images || [])
      .map((image) => `<img class="preview-thumb" src="${window.TicoAutos.resolveMediaUrl(image)}" alt="Imagen del vehiculo" />`)
      .join("");
  };

  const renderSelectedImages = () => {
    imagePreview.innerHTML = "";

    Array.from(imagesInput.files || []).forEach((file) => {
      const preview = document.createElement("img");
      preview.className = "preview-thumb";
      preview.alt = file.name;
      preview.src = URL.createObjectURL(file);
      imagePreview.appendChild(preview);
    });
  };

  imagesInput.addEventListener("change", renderSelectedImages);

  const loadVehicle = async () => {
    try {
      // Primero se consulta el detalle real para editar sobre datos existentes.
      const vehicle = await apiFetch(`/api/vehicles/${vehicleId}`);
      fillForm(vehicle);
    } catch (error) {
      setFeedback(msg, error.message || "No fue posible cargar el vehiculo", "error");
    }
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
      brand: document.getElementById("brand").value.trim(),
      model: document.getElementById("model").value.trim(),
      year: Number(document.getElementById("year").value),
      price: Number(document.getElementById("price").value),
      color: document.getElementById("color").value.trim(),
    };

    if (!payload.brand || !payload.model || !payload.color) {
      return setFeedback(msg, "Completa todos los campos requeridos", "error");
    }

    if (!Number.isInteger(payload.year) || payload.year < 1900 || payload.year > 2100) {
      return setFeedback(msg, "Ingresa un anio valido", "error");
    }

    if (!Number.isFinite(payload.price) || payload.price < 0) {
      return setFeedback(msg, "Ingresa un precio valido", "error");
    }

    updateBtn.disabled = true;
    updateBtn.textContent = "Actualizando...";

    try {
      const formData = new FormData();
      formData.append("brand", payload.brand);
      formData.append("model", payload.model);
      formData.append("year", String(payload.year));
      formData.append("price", String(payload.price));
      formData.append("color", payload.color);

      Array.from(imagesInput.files || []).forEach((file) => {
        formData.append("images", file);
      });

      await apiFetch(`/api/vehicles/${vehicleId}`, {
        method: "PUT",
        auth: true,
        body: formData,
      });

      setFeedback(msg, "Vehiculo actualizado correctamente", "success");
      window.setTimeout(() => {
        window.location.href = `./vehicle.html?id=${vehicleId}`;
      }, 700);
    } catch (error) {
      setFeedback(msg, error.message || "No fue posible actualizar el vehiculo", "error");
    } finally {
      updateBtn.disabled = false;
      updateBtn.textContent = "Actualizar vehiculo";
    }
  });

  loadVehicle();
}

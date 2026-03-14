const {
  apiFetch,
  renderNav,
  requireAuth,
  setFeedback,
} = window.TicoAutos;

if (requireAuth("./login.html")) {
  // Formulario privado para publicar un vehiculo con una o varias imagenes.
  renderNav("navActions");

  const form = document.getElementById("vehicleForm");
  const imagesInput = document.getElementById("images");
  const imagePreview = document.getElementById("imagePreview");
  const msg = document.getElementById("msg");
  const saveBtn = document.getElementById("saveVehicleBtn");

  const buildPayload = () => ({
    brand: document.getElementById("brand").value.trim(),
    model: document.getElementById("model").value.trim(),
    year: Number(document.getElementById("year").value),
    price: Number(document.getElementById("price").value),
    color: document.getElementById("color").value.trim(),
  });

  const renderSelectedImages = () => {
    // Vista previa local antes de subir los archivos al backend.
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

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = buildPayload();

    if (!payload.brand || payload.brand.length < 2) {
      return setFeedback(msg, "La marca es obligatoria", "error");
    }

    if (!payload.model) {
      return setFeedback(msg, "El modelo es obligatorio", "error");
    }

    if (!Number.isInteger(payload.year) || payload.year < 1900 || payload.year > 2100) {
      return setFeedback(msg, "Ingresa un anio valido", "error");
    }

    if (!Number.isFinite(payload.price) || payload.price < 0) {
      return setFeedback(msg, "Ingresa un precio valido", "error");
    }

    if (!payload.color || payload.color.length < 2) {
      return setFeedback(msg, "El color es obligatorio", "error");
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Guardando...";

    try {
      // Se usa FormData porque el endpoint recibe texto y archivos.
      const formData = new FormData();
      formData.append("brand", payload.brand);
      formData.append("model", payload.model);
      formData.append("year", String(payload.year));
      formData.append("price", String(payload.price));
      formData.append("color", payload.color);

      Array.from(imagesInput.files || []).forEach((file) => {
        formData.append("images", file);
      });

      await apiFetch("/api/vehicles", {
        method: "POST",
        auth: true,
        body: formData,
      });

      setFeedback(msg, "Vehiculo publicado correctamente", "success");
      window.setTimeout(() => {
        window.location.href = "./index.html";
      }, 700);
    } catch (error) {
      setFeedback(msg, error.message || "No fue posible publicar el vehiculo", "error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Guardar vehiculo";
    }
  });
}

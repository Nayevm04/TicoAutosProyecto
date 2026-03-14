const {
  apiFetch,
  escapeHtml,
  formatCurrency,
  formatDate,
  getUser,
  isAuthenticated,
  renderNav,
  resolveMediaUrl,
  setFeedback,
} = window.TicoAutos;

// Vista de detalle:
// muestra la publicacion, galeria, acciones del propietario e historial de mensajes.
renderNav("navActions");

const params = new URLSearchParams(window.location.search);
const vehicleId = params.get("id");
const feedback = document.getElementById("vehicleFeedback");
const detail = document.getElementById("vehicleDetail");
const questionPanel = document.getElementById("questionPanel");
const questionForm = document.getElementById("questionForm");
const questionPrompt = document.getElementById("questionPrompt");
const conversationList = document.getElementById("conversationList");
const questionsPageBtn = document.getElementById("questionsPageBtn");

let currentVehicle = null;

if (!vehicleId) {
  window.location.href = "./index.html";
}

const buildMessageBubble = (message, currentUserId) => {
  const isOwnMessage = message.senderId?._id === currentUserId;
  return `
    <article class="message-bubble ${isOwnMessage ? "outgoing" : "incoming"}">
      <p>${escapeHtml(message.text)}</p>
      <span class="conversation-meta">
        ${escapeHtml(message.senderId?.name || "")} ${escapeHtml(message.senderId?.lastname || "")} · ${escapeHtml(formatDate(message.sentAt))}
      </span>
    </article>
  `;
};

const renderVehicleDetail = () => {
  const ownerName = `${currentVehicle.userId?.name || ""} ${currentVehicle.userId?.lastname || ""}`.trim();
  const user = getUser();
  const isOwner = user && currentVehicle.userId && user.id === currentVehicle.userId._id;

  detail.innerHTML = `
    <section class="panel">
      <div class="vehicle-gallery">
        ${(currentVehicle.images?.length
          ? currentVehicle.images
          : [null]).map((image) => `
            <img
              class="vehicle-gallery-image"
              src="${resolveMediaUrl(image)}"
              alt="${escapeHtml(currentVehicle.brand)} ${escapeHtml(currentVehicle.model)}"
            />
          `).join("")}
      </div>

      <div class="detail-header">
        <div>
          <span class="eyebrow">Vehiculo</span>
          <h1>${escapeHtml(currentVehicle.brand)} ${escapeHtml(currentVehicle.model)}</h1>
          <p class="hero-copy">${escapeHtml(String(currentVehicle.year))} | ${escapeHtml(currentVehicle.color)} | ${escapeHtml(currentVehicle.status)}</p>
        </div>
        <div class="detail-price">${formatCurrency(currentVehicle.price)}</div>
      </div>

      <div class="detail-grid">
        <div class="detail-box">
          <h2>Resumen</h2>
          <ul class="detail-list">
            <li>Marca: ${escapeHtml(currentVehicle.brand)}</li>
            <li>Modelo: ${escapeHtml(currentVehicle.model)}</li>
            <li>Anio: ${escapeHtml(String(currentVehicle.year))}</li>
            <li>Color: ${escapeHtml(currentVehicle.color)}</li>
            <li>Estado: ${escapeHtml(currentVehicle.status)}</li>
            <li>Conversaciones registradas: ${escapeHtml(String(currentVehicle.conversationCount || 0))}</li>
          </ul>
        </div>
        <div class="detail-box">
          <h2>Propietario</h2>
          <p>${escapeHtml(ownerName || "Sin propietario")}</p>
          <p class="conversation-meta">Publicacion creada el ${escapeHtml(formatDate(currentVehicle.createdAt))}</p>
          <div class="card-actions">
            <button type="button" class="btn btn-secondary" id="shareVehicleBtn">Compartir enlace</button>
            ${isOwner ? `<a class="btn btn-ghost" href="./editVehicle.html?id=${currentVehicle._id}">Editar</a>` : ""}
          </div>
          ${isOwner ? `
            <div class="owner-actions">
              <button type="button" class="btn btn-ghost" id="markSoldBtn">Marcar vendido</button>
              <button type="button" class="btn btn-ghost danger" id="deleteVehicleBtn">Eliminar</button>
            </div>
          ` : ""}
        </div>
      </div>
    </section>
  `;

  document.getElementById("shareVehicleBtn")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setFeedback(feedback, "Enlace copiado correctamente", "success");
    } catch (error) {
      window.prompt("Copia este enlace", window.location.href);
    }
  });

  document.getElementById("markSoldBtn")?.addEventListener("click", async () => {
    try {
      await apiFetch(`/api/vehicles/${currentVehicle._id}/sold`, { method: "PATCH", auth: true });
      setFeedback(feedback, "Vehiculo marcado como vendido", "success");
      await loadVehicle();
    } catch (error) {
      setFeedback(feedback, error.message || "No fue posible actualizar el vehiculo", "error");
    }
  });

  document.getElementById("deleteVehicleBtn")?.addEventListener("click", async () => {
    if (!window.confirm("Deseas eliminar esta publicacion?")) {
      return;
    }

    try {
      await apiFetch(`/api/vehicles/${currentVehicle._id}`, { method: "DELETE", auth: true });
      window.location.href = "./index.html";
    } catch (error) {
      setFeedback(feedback, error.message || "No fue posible eliminar el vehiculo", "error");
    }
  });
};

const loadConversation = async () => {
  const user = getUser();
  const isOwner = user && currentVehicle.userId && user.id === currentVehicle.userId._id;

  if (!isAuthenticated()) {
    questionForm.hidden = true;
    questionsPageBtn.href = "./login.html";
    questionPrompt.innerHTML = `
      <div class="empty-state">
        <p>Inicia sesion para contactar al propietario y guardar el historial de conversacion de este vehiculo.</p>
        <a class="btn btn-primary" href="./login.html">Ir al login</a>
      </div>
    `;
    conversationList.innerHTML = "";
    return;
  }

  questionForm.hidden = isOwner;
  questionsPageBtn.hidden = false;
  questionPrompt.innerHTML = isOwner
    ? "<div class=\"empty-state compact\">Este es tu vehiculo. Revisa los mensajes desde tu bandeja para responder a cada persona interesada.</div>"
    : "<div class=\"empty-state compact\">Aqui puedes hablar con el dueno. Si ya habian conversado sobre este vehiculo, veras el historial abajo.</div>";

  try {
    // El historial depende del vehiculo abierto y del usuario autenticado.
    const data = await apiFetch(`/api/vehicles/${currentVehicle._id}/conversation`, { auth: true });

    if (!data.messages.length) {
      conversationList.innerHTML = "<div class=\"empty-state\">Todavia no hay mensajes en esta conversacion.</div>";
      return;
    }

    conversationList.innerHTML = data.messages
      .map((message) => buildMessageBubble(message, user.id))
      .join("");
  } catch (error) {
    conversationList.innerHTML = "<div class=\"empty-state\">No fue posible cargar la conversacion.</div>";
    setFeedback(feedback, error.message || "No fue posible cargar los mensajes", "error");
  }
};

const loadVehicle = async () => {
  try {
    currentVehicle = await apiFetch(`/api/vehicles/${vehicleId}`);
    renderVehicleDetail();
    loadConversation();
  } catch (error) {
    detail.innerHTML = "<div class=\"panel\"><div class=\"empty-state\">No fue posible cargar este vehiculo.</div></div>";
    questionPanel.hidden = true;
    setFeedback(feedback, error.message || "No fue posible cargar el vehiculo", "error");
  }
};

questionForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const questionText = document.getElementById("questionText").value.trim();
  if (questionText.length < 5) {
    return setFeedback(feedback, "El mensaje debe tener al menos 5 caracteres", "error");
  }

  try {
    // Si no existia conversacion, el backend la crea automaticamente.
    await apiFetch(`/api/vehicles/${vehicleId}/messages`, {
      method: "POST",
      auth: true,
      body: JSON.stringify({ text: questionText }),
    });

    document.getElementById("questionText").value = "";
    setFeedback(feedback, "Mensaje enviado correctamente", "success");
    await loadVehicle();
  } catch (error) {
    setFeedback(feedback, error.message || "No fue posible enviar el mensaje", "error");
  }
});

loadVehicle();

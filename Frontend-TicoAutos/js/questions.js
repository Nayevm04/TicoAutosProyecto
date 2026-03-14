const {
  apiFetch,
  escapeHtml,
  formatDate,
  getUser,
  renderNav,
  requireAuth,
  resolveMediaUrl,
  setFeedback,
} = window.TicoAutos;

if (requireAuth("./login.html")) {
  // Centro de mensajes:
  // - conversaciones iniciadas por el interesado
  // - inbox del propietario
  // - historial de la conversacion abierta
  renderNav("navActions");

  const myConversationsList = document.getElementById("myConversationsList");
  const inboxList = document.getElementById("inboxList");
  const myConversationsFeedback = document.getElementById("myConversationsFeedback");
  const inboxFeedback = document.getElementById("inboxFeedback");
  const threadTitle = document.getElementById("threadTitle");
  const threadMeta = document.getElementById("threadMeta");
  const threadMessages = document.getElementById("threadMessages");
  const threadFeedback = document.getElementById("threadFeedback");
  const replyForm = document.getElementById("replyForm");
  const replyText = document.getElementById("replyText");

  let activeConversationId = null;
  const currentUser = getUser();

  const renderConversationCard = (conversation, type) => `
    <article class="conversation-card conversation-summary" data-open-conversation="${conversation._id}">
      <div class="conversation-head">
        <div>
          <h3>${escapeHtml(conversation.vehicleId?.brand || "")} ${escapeHtml(conversation.vehicleId?.model || "")}</h3>
          <p class="conversation-meta">
            ${type === "owner" ? "Interesado" : "Propietario"}:
            ${escapeHtml(
              type === "owner"
                ? `${conversation.interestedUserId?.name || ""} ${conversation.interestedUserId?.lastname || ""}`
                : `${conversation.ownerId?.name || ""} ${conversation.ownerId?.lastname || ""}`
            )}
          </p>
        </div>
        <span class="badge ${type === "owner" && conversation.ownerUnreadCount > 0 ? "sold" : "available"}">
          ${type === "owner"
            ? (conversation.ownerUnreadCount > 0 ? `${conversation.ownerUnreadCount} pendientes` : "Al dia")
            : (conversation.interestedUnreadCount > 0 ? `${conversation.interestedUnreadCount} nuevos` : "Conversacion")}
        </span>
      </div>

      <img
        class="message-vehicle-thumb"
        src="${resolveMediaUrl(conversation.vehicleId?.images?.[0])}"
        alt="${escapeHtml(conversation.vehicleId?.brand || "Vehiculo")}"
      />

      <p><strong>Ultimo mensaje:</strong> ${escapeHtml(conversation.lastMessageText || "Sin mensajes")}</p>
      <p class="conversation-meta">Actualizado ${escapeHtml(formatDate(conversation.lastMessageAt))}</p>
      <div class="card-actions">
        <button type="button" class="btn btn-secondary" data-open-conversation="${conversation._id}">Abrir conversacion</button>
        <a class="btn btn-ghost" href="./vehicle.html?id=${conversation.vehicleId?._id}">Ver vehiculo</a>
      </div>
    </article>
  `;

  const renderThreadMessage = (message) => `
    <article class="message-bubble ${message.senderId?._id === currentUser?.id ? "outgoing" : "incoming"}">
      <p>${escapeHtml(message.text)}</p>
      <span class="conversation-meta">
        ${escapeHtml(message.senderId?.name || "")} ${escapeHtml(message.senderId?.lastname || "")} | ${escapeHtml(formatDate(message.sentAt))}
      </span>
    </article>
  `;

  const renderEmptyThread = (message) => {
    threadTitle.textContent = "Selecciona una conversacion";
    threadMeta.textContent = "Abre una conversacion para ver el historial completo del vehiculo.";
    threadMessages.className = "thread-messages";
    threadMessages.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
    replyForm.hidden = true;
    activeConversationId = null;
    setFeedback(threadFeedback, "", "");
  };

  const loadMyConversations = async () => {
    try {
      setFeedback(myConversationsFeedback, "", "");
      const data = await apiFetch("/api/messages/mine", { auth: true });
      if (!data.results.length) {
        myConversationsList.innerHTML = "<div class=\"empty-state\">Todavia no has iniciado conversaciones.</div>";
        return;
      }

      myConversationsList.innerHTML = data.results
        .map((conversation) => renderConversationCard(conversation, "interested"))
        .join("");
    } catch (error) {
      setFeedback(myConversationsFeedback, error.message || "No fue posible cargar tus conversaciones", "error");
    }
  };

  const loadInbox = async () => {
    try {
      setFeedback(inboxFeedback, "", "");
      const data = await apiFetch("/api/messages/inbox", { auth: true });
      if (!data.results.length) {
        inboxList.innerHTML = "<div class=\"empty-state\">No hay mensajes pendientes en tus vehiculos por ahora.</div>";
        return;
      }

      inboxList.innerHTML = data.results
        .map((conversation) => renderConversationCard(conversation, "owner"))
        .join("");
    } catch (error) {
      setFeedback(inboxFeedback, error.message || "No fue posible cargar el inbox", "error");
    }
  };

  const openConversation = async (conversationId) => {
    try {
      activeConversationId = conversationId;
      // Abrir una conversacion tambien limpia pendientes del lado que la consulta.
      const data = await apiFetch(`/api/messages/conversations/${conversationId}`, { auth: true });
      threadTitle.textContent = `${data.vehicleId?.brand || ""} ${data.vehicleId?.model || ""}`.trim() || "Conversacion";
      threadMeta.textContent = data.isOwner
        ? `Conversacion con ${data.interestedUserId?.name || ""} ${data.interestedUserId?.lastname || ""}`
        : `Conversacion con ${data.ownerId?.name || ""} ${data.ownerId?.lastname || ""}`;
      threadMessages.className = "thread-messages";
      threadMessages.innerHTML = data.messages.length
        ? data.messages.map(renderThreadMessage).join("")
        : "<div class=\"empty-state\">Todavia no hay mensajes en esta conversacion.</div>";
      replyForm.hidden = false;
      setFeedback(threadFeedback, "", "");
      threadMessages.scrollTop = threadMessages.scrollHeight;
      await loadMyConversations();
      await loadInbox();
    } catch (error) {
      setFeedback(threadFeedback, error.message || "No fue posible abrir la conversacion", "error");
    }
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-open-conversation]");
    const conversationId = trigger?.dataset.openConversation;
    if (!conversationId) {
      return;
    }

    openConversation(conversationId);
  });

  replyForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!activeConversationId) {
      return setFeedback(threadFeedback, "Selecciona una conversacion antes de responder", "error");
    }

    const text = replyText.value.trim();
    if (!text) {
      return setFeedback(threadFeedback, "Escribe un mensaje antes de responder", "error");
    }

    try {
      await apiFetch(`/api/messages/conversations/${activeConversationId}/messages`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ text }),
      });

      replyText.value = "";
      setFeedback(threadFeedback, "Mensaje enviado correctamente", "success");
      await openConversation(activeConversationId);
    } catch (error) {
      setFeedback(threadFeedback, error.message || "No fue posible responder el mensaje", "error");
    }
  });

  renderEmptyThread("Aqui veras el historial entre la persona interesada y el propietario del vehiculo.");
  loadMyConversations();
  loadInbox();
}

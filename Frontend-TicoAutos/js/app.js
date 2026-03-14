(function attachAppHelpers() {
  // Utilidades compartidas del frontend:
  // sesion, fetch al backend, formato visual y render del menu.
  const API_BASE = "http://localhost:3000";
  const TOKEN_KEY = "ticoautos_token";
  const USER_KEY = "ticoautos_user";

  const migrateLegacySession = () => {
    const legacyToken = sessionStorage.getItem("token");
    const legacyUserId = sessionStorage.getItem("userId");

    if (legacyToken && !localStorage.getItem(TOKEN_KEY)) {
      localStorage.setItem(TOKEN_KEY, legacyToken);
    }

    if (legacyUserId && !localStorage.getItem(USER_KEY)) {
      localStorage.setItem(USER_KEY, JSON.stringify({ id: legacyUserId }));
    }
  };

  const getToken = () => {
    migrateLegacySession();
    return localStorage.getItem(TOKEN_KEY);
  };

  const getUser = () => {
    migrateLegacySession();
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  };

  const saveSession = ({ token, user }) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userId");
  };

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userId");
  };

  const isAuthenticated = () => Boolean(getToken());

  const requireAuth = (redirectPath = "./login.html") => {
    if (!isAuthenticated()) {
      window.location.href = redirectPath;
      return false;
    }

    return true;
  };

  const redirectIfAuthenticated = (path = "./index.html") => {
    if (isAuthenticated()) {
      window.location.href = path;
    }
  };

  const escapeHtml = (value = "") =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;")
      .replaceAll("'", "&#39;");

  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);

  const formatDate = (value) =>
    value
      ? new Intl.DateTimeFormat("es-CR", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : "Sin fecha";

  const setFeedback = (element, message, type = "") => {
    if (!element) {
      return;
    }

    element.textContent = message;
    element.className = `feedback ${type}`.trim();
  };

  const resolveMediaUrl = (value) => {
    if (!value) {
      return "./assets/car-hero.svg";
    }

    if (value.startsWith("http")) {
      return value;
    }

    if (value.startsWith("/")) {
      return `${API_BASE}${value}`;
    }

    return value;
  };

  const apiFetch = async (path, options = {}) => {
    const headers = new Headers(options.headers || {});
    const request = { ...options, headers };

    if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    // Cuando una llamada necesita login, se agrega el Bearer token automaticamente.
    if (options.auth) {
      const token = getToken();
      if (!token) {
        throw new Error("Debes iniciar sesion para realizar esta accion");
      }

      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE}${path}`, request);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || "Ocurrio un error en la solicitud");
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  };

  const renderNav = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) {
      return;
    }

    if (isAuthenticated()) {
      const user = getUser();
      container.innerHTML = `
        <span class="nav-user">${escapeHtml(user?.name || "Usuario")}</span>
        <a class="btn btn-ghost" href="./index.html">Inicio</a>
        <a class="btn btn-ghost nav-link-with-badge" href="./questions.html">
          Mensajes
          <span class="nav-badge" id="pendingBadge" hidden>0</span>
        </a>
        <a class="btn btn-primary" href="./createVehicle.html">Publicar</a>
        <button type="button" class="btn btn-secondary" id="logoutBtn">Cerrar sesion</button>
      `;

      const logoutBtn = document.getElementById("logoutBtn");
      logoutBtn?.addEventListener("click", async () => {
        try {
          await apiFetch("/api/auth/logout", { method: "POST", auth: true });
        } catch (error) {
          console.error(error);
        } finally {
          clearSession();
          window.location.href = "./login.html";
        }
      });

      // Este badge muestra mensajes pendientes del propietario.
      const pendingBadge = document.getElementById("pendingBadge");
      apiFetch("/api/messages/inbox?status=pending&page=1&limit=1", { auth: true })
        .then((data) => {
          const pending = data.pendingTotal || data.total || 0;
          if (pending > 0 && pendingBadge) {
            pendingBadge.hidden = false;
            pendingBadge.textContent = pending > 99 ? "99+" : String(pending);
          }
        })
        .catch(() => {
          if (pendingBadge) {
            pendingBadge.hidden = true;
          }
        });

      return;
    }

    container.innerHTML = `
      <a class="btn btn-ghost" href="./index.html">Inicio</a>
      <a class="btn btn-ghost" href="./login.html">Entrar</a>
      <a class="btn btn-primary" href="./register.html">Crear cuenta</a>
    `;
  };

  window.TicoAutos = {
    API_BASE,
    apiFetch,
    clearSession,
    escapeHtml,
    formatCurrency,
    formatDate,
    getToken,
    getUser,
    isAuthenticated,
    redirectIfAuthenticated,
    renderNav,
    requireAuth,
    resolveMediaUrl,
    saveSession,
    setFeedback,
  };
})();

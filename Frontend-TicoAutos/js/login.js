const {
  apiFetch,
  redirectIfAuthenticated,
  renderNav,
  saveSession,
  setFeedback,
} = window.TicoAutos;

// Pantalla de login: valida datos minimos y guarda la sesion devuelta por la API.
const form = document.getElementById("loginForm");
const msg = document.getElementById("msg");
const btn = document.getElementById("btnLogin");

renderNav("navActions");
redirectIfAuthenticated("./index.html");

const lastEmail = sessionStorage.getItem("lastEmail");
if (lastEmail) {
  document.getElementById("email").value = lastEmail;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setFeedback(msg, "");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email.includes("@")) {
    return setFeedback(msg, "Ingresa un correo valido", "error");
  }

  if (password.length < 6) {
    return setFeedback(msg, "La contrasena debe tener al menos 6 caracteres", "error");
  }

  btn.disabled = true;
  btn.textContent = "Ingresando...";

  try {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    saveSession(data);
    setFeedback(msg, "Login exitoso. Redirigiendo...", "success");

    window.setTimeout(() => {
      window.location.href = "./index.html";
    }, 700);
  } catch (error) {
    setFeedback(msg, error.message || "No fue posible iniciar sesion", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Iniciar sesion";
  }
});

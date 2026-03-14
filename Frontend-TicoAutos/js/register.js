const {
  apiFetch,
  redirectIfAuthenticated,
  renderNav,
  setFeedback,
} = window.TicoAutos;

// Pantalla de registro: crea el usuario y luego lo envia al login.
const form = document.getElementById("registerForm");
const msg = document.getElementById("msg");
const btn = document.getElementById("btnRegister");

renderNav("navActions");
redirectIfAuthenticated("./index.html");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setFeedback(msg, "");

  const name = document.getElementById("name").value.trim();
  const lastname = document.getElementById("lastname").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (name.length < 2) {
    return setFeedback(msg, "El nombre debe tener al menos 2 caracteres", "error");
  }

  if (lastname.length < 2) {
    return setFeedback(msg, "El apellido debe tener al menos 2 caracteres", "error");
  }

  if (!email.includes("@")) {
    return setFeedback(msg, "Ingresa un correo valido", "error");
  }

  if (password.length < 6) {
    return setFeedback(msg, "La contrasena debe tener al menos 6 caracteres", "error");
  }

  btn.disabled = true;
  btn.textContent = "Creando cuenta...";

  try {
    await apiFetch("/api/users/register", {
      method: "POST",
      body: JSON.stringify({ name, lastname, email, password }),
    });

    sessionStorage.setItem("lastEmail", email);
    setFeedback(msg, "Registro exitoso. Ahora puedes iniciar sesion.", "success");

    window.setTimeout(() => {
      window.location.href = "./login.html";
    }, 900);
  } catch (error) {
    setFeedback(msg, error.message || "No fue posible registrarte", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Crear cuenta";
  }
});

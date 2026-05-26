import { apiLogin, saveAuth, getUser, apiRegister } from "./api.js";
import { closeLoginModal } from "./ui.js";

console.log("✓ app.js carregado");

async function handleLogin(event) {
  console.log("🔵 handleLogin chamado", event);
  event.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const senha = document.getElementById("login-password").value;
  const submitBtn = document.getElementById("login-submit");

  console.log("📧 Email:", email, "| Senha preenchida:", !!senha);

  if (!email || !senha) {
    alert("Preencha e-mail e senha");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Entrando...";

  try {
    console.log("📡 Enviando requisição para API...");
    const result = await apiLogin(email, senha);
    console.log("✅ Resposta recebida:", result);

    if (result) {
      saveAuth(result.token, result.user);

      console.log("Login bem-sucedido!");
      closeLoginModal();
      updateAuthUi();
    } else {
      console.log("erro");
    }
  } catch (erro) {
    console.error("❌ Erro:", erro);

    if (erro.status === 401) {
      alert("E-mail ou senha inválidos");
    } else {
      alert(erro.message || "Erro ao fazer login");
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Entrar na conta";
  }
}

function handleLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  updateAuthUi();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateAuthUi() {
  const authButtons = document.getElementById("auth-buttons");
  const userButtons = document.getElementById("user-button");
  const panelSection = document.getElementById("panel");
  const logoutButton = document.getElementById("logout-btn");

  const token = localStorage.getItem("token");
  const isLoged = token != null;

  if (isLoged) {
    if (logoutButton) {
      logoutButton.classList.remove("hidden");
      // logoutButton.classList.add("flex");
    }
    if (authButtons) {
      authButtons.classList.remove("sm:flex");
      authButtons.classList.add("hidden");
    }
    if (userButtons) userButtons.classList.remove("hidden");
    if (panelSection) {
      panelSection.classList.remove("hidden");
      panelSection.classList.add("block");
    }
  } else {
    if (logoutButton) logoutButton.classList.add("hidden");
    if (authButtons) {
      authButtons.classList.remove("hidden");
      authButtons.classList.add("sm:flex");
    }
    if (userButtons) userButtons.classList.add("hidden");
    if (panelSection) {
      panelSection.classList.remove("block");
      panelSection.classList.add("hidden");
    }
  }
}

console.log("🔍 Procurando formulário de login...");
const loginForm = document.getElementById("login-form");
console.log("loginForm encontrado?", !!loginForm, loginForm);

if (loginForm) {
  loginForm.addEventListener("submit", handleLogin);
  console.log("✅ Listener de submit registrado no formulário");
} else {
  console.error("❌ Formulário de login NÃO encontrado!");
  console.log(
    "IDs disponíveis no documento:",
    Array.from(document.querySelectorAll("[id]")).map((el) => el.id),
  );
}

const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", handleLogout);
}

const mobileLogoutBtn = document.getElementById("mobile-logout-btn");
if (mobileLogoutBtn) {
  mobileLogoutBtn.addEventListener("click", handleLogout);
}

document.addEventListener("DOMContentLoaded", () => {
  updateAuthUi();
});

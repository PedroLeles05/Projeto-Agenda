// Modal login open/close
const loginOverlay = document.getElementById("login-modal-overlay");
export const closeLoginModal = () => loginOverlay.classList.remove("open");

document
  .getElementById("close-login-btn")
  .addEventListener("click", closeLoginModal);
document
  .getElementById("cancel-login-btn")
  .addEventListener("click", closeLoginModal);
loginOverlay.addEventListener("click", (e) => {
  if (e.target === loginOverlay) closeLoginModal();
});

// Modal register open/close
const registerOverlay = document.getElementById("register-modal-overlay");
const closeRegisterModal = () => registerOverlay.classList.remove("open");

document
  .getElementById("close-register-btn")
  .addEventListener("click", closeRegisterModal);
document
  .getElementById("cancel-register-btn")
  .addEventListener("click", closeRegisterModal);
registerOverlay.addEventListener("click", (e) => {
  if (e.target === registerOverlay) closeRegisterModal();
});
// Modal open/close
const overlay = document.getElementById("modal-overlay");
const closeModal = () => overlay.classList.remove("open");
document
  .getElementById("close-modal-btn")
  .addEventListener("click", closeModal);
document.getElementById("cancel-btn").addEventListener("click", closeModal);
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeModal();
});

// Mobile menu
const mobileMenu = document.getElementById("mobile-menu");
document
  .getElementById("hamburger-btn")
  .addEventListener("click", () => mobileMenu.classList.add("open"));
document
  .getElementById("close-menu-btn")
  .addEventListener("click", () => mobileMenu.classList.remove("open"));
document
  .getElementById("mobile-menu-backdrop")
  .addEventListener("click", () => mobileMenu.classList.remove("open"));
mobileMenu
  .querySelectorAll("a")
  .forEach((a) =>
    a.addEventListener("click", () => mobileMenu.classList.remove("open")),
  );

// Filter pills
document.querySelectorAll(".tab-pill").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".tab-pill")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

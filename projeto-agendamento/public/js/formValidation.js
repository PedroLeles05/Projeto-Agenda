export function validateRequiredFields(values) {
  return values.every((value) => {
    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    return value !== null && value !== undefined && value !== false;
  });
}

export function validarNome(nome) {
  if (!nome) {
    document.getElementById("register-name").value = "";
    return { valid: false, message: "O campo nome é obrigatório." };
  }

  if (nome.length < 3 || nome.length > 60) {
    document.getElementById("register-name").value = "";
    return {
      valid: false,
      message: "O nome deve ter mais de 2 caracteres e menos que 61.",
    };
  }

  const nomePartes = nome.split(" ").filter((part) => part.length > 0);
  if (nomePartes.length < 2) {
    document.getElementById("register-name").value = "";
    return { valid: false, message: "Por favor, digite nome e sobrenome." };
  }

  const nomeRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;
  if (!nomeRegex.test(nome)) {
    document.getElementById("register-name").value = "";
    return { valid: false, message: "Insira um nome válido." };
  }

  return { valid: true };
}

export function validarEmail(email) {
  if (!email) {
    document.getElementById("register-email").value = "";
    return { valid: false, message: "O campo de e-mail é obrigatorio." };
  }

  if (email.length > 240) {
    document.getElementById("register-email").value = "";
    return { valid: false, message: "O e-mail digitado é longo de mais." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    document.getElementById("register-email").value = "";
    return {
      valid: false,
      message: "Insira um endereço de e-mail válido (ex: nome@email.com).",
    };
  }

  return { valid: true };
}

export function validarTelefone(telefone) {
  const digits = String(telefone || "").replace(/\D/g, "");

  if (digits.length !== 10 && digits.length !== 11) {
    return { valid: false, message: "Digite um telefone válido com DDD." };
  }

  return { valid: true, value: digits };
}

export function validarSenha(senha, confirmacaoSenha) {
  if (!senha) {
    document.getElementById("register-password").value = "";
    document.getElementById("register-confirm-password").value = "";
    return { valid: false, message: "O campo de senha é obrigatorio." };
  }

  if (senha.length < 8) {
    document.getElementById("register-password").value = "";
    document.getElementById("register-confirm-password").value = "";
    return {
      valid: false,
      message: "A senha tem que ter pelo menos 8 caracteres.",
    };
  }

  if (senha.length > 128) {
    document.getElementById("register-password").value = "";
    document.getElementById("register-confirm-password").value = "";
    return {
      valid: false,
      message: "A senha é longa demais (máximo 128 caracteres).",
    };
  }

  if (!/[A-Z]/.test(senha)) {
    document.getElementById("register-password").value = "";
    document.getElementById("register-confirm-password").value = "";
    return {
      valid: false,
      message: "A senha precisa conter pelo menos uma letra maiúscula.",
    };
  }

  if (!/[a-z]/.test(senha)) {
    document.getElementById("register-password").value = "";
    document.getElementById("register-confirm-password").value = "";
    return {
      valid: false,
      message: "A senha precisa conter pelo menos uma letra minúscula.",
    };
  }

  if (!/[0-9]/.test(senha)) {
    document.getElementById("register-password").value = "";
    document.getElementById("register-confirm-password").value = "";
    return {
      valid: false,
      message: "A senha precisa conter pelo menos um número.",
    };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
    document.getElementById("register-password").value = "";
    document.getElementById("register-confirm-password").value = "";
    return {
      valid: false,
      message:
        "A senha precisa conter pelo menos um caractere especial (!@#$%).",
    };
  }

  if (confirmacaoSenha !== null && senha !== confirmacaoSenha) {
    document.getElementById("register-confirm-password").value = "";
    return { valid: false, message: "As senhas não coincidem." };
  }

  return { valid: true };
}

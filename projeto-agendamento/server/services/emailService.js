const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));
}

function formatTime(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));
}

function getStatusContent(status) {
  if (status === "cancelled") {
    return {
      subject: "Agendamento cancelado | Agenda",
      title: "Seu agendamento foi cancelado",
      message: "O agendamento abaixo foi cancelado pelo prestador.",
    };
  }

  if (status === "completed") {
    return {
      subject: "Atendimento concluído | Agenda",
      title: "Seu atendimento foi concluído",
      message:
        "Obrigado por utilizar a Agenda. Esperamos atender você novamente.",
    };
  }

  return {
    subject: "Agendamento confirmado | Agenda",
    title: "Seu agendamento foi confirmado",
    message: "Seu horário foi reservado com sucesso.",
  };
}

async function sendAppointmentEmail({
  appointment,
  service,
  provider,
  status,
}) {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.EMAIL_FROM;
  const fromName = process.env.EMAIL_FROM_NAME || "Agenda";

  if (!apiKey || !from) {
    console.warn(
      "E-mail não enviado: BREVO_API_KEY ou EMAIL_FROM não configurado.",
    );
    return { sent: false, skipped: true };
  }

  const content = getStatusContent(status);
  const providerName = provider?.name || "Prestador";
  const providerEmail = provider?.email || "Não informado";
  const providerPhone = provider?.phone || "Não informado";
  const serviceTitle = service?.title || "Serviço";
  const startAt = appointment.startAt || appointment.date;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #292524; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #0f766e;">${escapeHtml(content.title)}</h1>
      <p>Olá, ${escapeHtml(appointment.clientName)}.</p>
      <p>${escapeHtml(content.message)}</p>
      <div style="background: #f5f5f4; padding: 20px; border-radius: 12px;">
        <p><strong>Serviço:</strong> ${escapeHtml(serviceTitle)}</p>
        <p><strong>Data:</strong> ${escapeHtml(formatDate(startAt))}</p>
        <p><strong>Horário:</strong> ${escapeHtml(formatTime(startAt))}</p>
        <p><strong>Prestador:</strong> ${escapeHtml(providerName)}</p>
        <p><strong>E-mail do prestador:</strong> ${escapeHtml(providerEmail)}</p>
        <p><strong>Telefone do prestador:</strong> ${escapeHtml(providerPhone)}</p>
      </div>
      <p style="color: #78716c;">Para falar com o prestador, utilize o e-mail informado acima.</p>
    </div>
  `;

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: from,
        name: fromName,
      },
      to: [
        {
          email: appointment.clientEmail,
          name: appointment.clientName,
        },
      ],
      subject: content.subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Falha ao enviar e-mail (${response.status}): ${errorBody}`,
    );
  }

  return { sent: true };
}

async function sendAppointmentEmailSafely(payload) {
  try {
    return await sendAppointmentEmail(payload);
  } catch (error) {
    console.error("Erro no envio do e-mail do agendamento:", error.message);
    return { sent: false, error: true };
  }
}

module.exports = { sendAppointmentEmailSafely };

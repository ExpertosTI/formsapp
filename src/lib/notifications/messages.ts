export function acceptanceMessage(params: {
  candidateName: string;
  tenantName: string;
}): string {
  return `Hola ${params.candidateName}, te saludamos de ${params.tenantName}.

¡Buenas noticias! Tu solicitud de empleo ha sido *aceptada*.

Mantente pendiente: serás contactado pronto para coordinar una *entrevista presencial*.

Gracias por tu interés.`;
}

export function interviewInviteMessage(params: {
  candidateName: string;
  tenantName: string;
  dateLabel: string;
  timeLabel: string;
  location: string;
  notes?: string | null;
}): string {
  const extra = params.notes?.trim() ? `\n\nNota: ${params.notes.trim()}` : "";
  return `Hola ${params.candidateName}, te saludamos de ${params.tenantName}.

Tu solicitud fue aceptada. Te invitamos a una *entrevista presencial*:

📅 *Fecha:* ${params.dateLabel}
🕐 *Hora:* ${params.timeLabel}
📍 *Lugar:* ${params.location}

Por favor confirma tu asistencia respondiendo a este mensaje.${extra}

¡Te esperamos!`;
}

export function formatSlotDateTime(startsAt: Date, endsAt: Date): { dateLabel: string; timeLabel: string } {
  const dateLabel = startsAt.toLocaleDateString("es-DO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStart = startsAt.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" });
  const timeEnd = endsAt.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" });
  return { dateLabel, timeLabel: `${timeStart} – ${timeEnd}` };
}

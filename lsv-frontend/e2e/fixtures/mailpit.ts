const MAILPIT_API = process.env.MAILPIT_API_URL ?? "http://127.0.0.1:8025";

type MailpitSummary = { ID: string; Subject: string; Created: string };
type MailpitMessage = { HTML: string; Text: string };

/** Mensaje más reciente para `to` cuyo asunto contiene `subjectContains` (espera hasta `timeoutMs`). */
export async function waitForMail(
  to: string,
  subjectContains: string,
  timeoutMs = 15_000,
): Promise<MailpitSummary> {
  const deadline = Date.now() + timeoutMs;
  const query = encodeURIComponent(`to:"${to}"`);
  while (Date.now() < deadline) {
    const response = await fetch(`${MAILPIT_API}/api/v1/search?query=${query}`);
    if (response.ok) {
      const body = (await response.json()) as { messages?: MailpitSummary[] };
      const match = (body.messages ?? []).find((m) =>
        m.Subject.includes(subjectContains),
      );
      if (match) return match;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(
    `No llegó un correo a ${to} con asunto "${subjectContains}" en ${timeoutMs} ms`,
  );
}

export async function messageHtml(id: string): Promise<string> {
  const response = await fetch(`${MAILPIT_API}/api/v1/message/${id}`);
  if (!response.ok) {
    throw new Error(
      `Mailpit devolvió ${response.status} para el mensaje ${id}`,
    );
  }
  return ((await response.json()) as MailpitMessage).HTML;
}

/** Saca el token del enlace `…/reset-password#token=…` de un correo de reset. */
export function extractResetToken(html: string): string {
  const match = /reset-password#token=([^"'\s<]+)/.exec(html);
  if (!match) {
    throw new Error("El correo no contiene un enlace de reset-password");
  }
  return decodeURIComponent(match[1]);
}

/** Borra todos los mensajes de Mailpit (la base de correos es compartida entre corridas). */
export async function clearMail(): Promise<void> {
  await fetch(`${MAILPIT_API}/api/v1/messages`, { method: "DELETE" });
}

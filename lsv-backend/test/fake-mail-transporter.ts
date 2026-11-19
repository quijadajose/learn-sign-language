/**
 * Transporter de correo falso para los e2e: guarda los mensajes en memoria en vez
 * de conectarse a SMTP. Se inyecta con
 * `.overrideProvider('MAIL_TRANSPORTER').useValue(fakeMail)`.
 */
export type SentMail = {
  from?: string;
  to: string;
  subject: string;
  html: string;
};

export class FakeMailTransporter {
  readonly sent: SentMail[] = [];

  sendMail(mail: SentMail): Promise<{ messageId: string }> {
    this.sent.push(mail);
    return Promise.resolve({ messageId: `fake-${this.sent.length}` });
  }

  clear(): void {
    this.sent.length = 0;
  }

  /** Algunos correos se envían en segundo plano: espera a que llegue uno que cumpla `match`. */
  async waitFor(
    match: (mail: SentMail) => boolean,
    timeoutMs = 3000,
  ): Promise<SentMail> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const found = this.sent.find(match);
      if (found) {
        return found;
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    throw new Error(
      `No llegó el correo esperado en ${timeoutMs} ms. Enviados: ${JSON.stringify(
        this.sent.map(({ to, subject }) => ({ to, subject })),
      )}`,
    );
  }
}

/** Extrae el token del enlace `.../reset-password#token=...` de un correo. */
export function extractResetToken(html: string): string {
  const match = /reset-password#token=([^"'\s<]+)/.exec(html);
  if (!match) {
    throw new Error('El correo no contiene un enlace de reset-password');
  }
  return decodeURIComponent(match[1]);
}

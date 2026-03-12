import { Injectable, Inject } from '@nestjs/common';
import {
  EmailParams,
  EmailService,
} from 'src/auth/domain/ports/email.service/email.service.interface';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NodeMailerService implements EmailService {
  constructor(
    @Inject('MAIL_TRANSPORTER')
    private readonly transporter: nodemailer.Transporter,
  ) {}

  async sendEmail(params: EmailParams): Promise<void> {
    const mailOptions = {
      from: '"LSV App" <noreply@lsvapp.com>', // Puedes ajustar el nombre y correo
      to: params.to,
      subject: params.subject,
      html: params.body,
    };

    await this.transporter.sendMail(mailOptions);
  }
}

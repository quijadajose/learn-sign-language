import { Injectable, Inject } from '@nestjs/common';
import {
  EmailParams,
  EmailService,
} from '../../domain/ports/email.service/email.service.interface.js';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NodeMailerService implements EmailService {
  constructor(
    @Inject('MAIL_TRANSPORTER')
    private readonly transporter: nodemailer.Transporter,
  ) {}

  async sendEmail(params: EmailParams): Promise<void> {
    const mailOptions = {
      // BE-28: el remitente debe ser la cuenta autenticada (SPF/DMARC). Configurable con EMAIL_FROM.
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: params.to,
      subject: params.subject,
      html: params.body,
    };

    await this.transporter.sendMail(mailOptions);
  }
}

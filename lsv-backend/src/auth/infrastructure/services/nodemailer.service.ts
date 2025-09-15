import { Injectable } from '@nestjs/common';
import {
  EmailParams,
  EmailService,
} from 'src/auth/domain/ports/email.service/email.service.interface';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class NodeMailerService implements EmailService {
  constructor(private readonly mailService: MailerService) {}

  async sendEmail(params: EmailParams): Promise<void> {
    const mailOptions = {
      to: params.to,
      subject: params.subject,
      html: params.body, // Cambiar de 'text' a 'html'
    };

    await this.mailService.sendMail(mailOptions);
  }
}

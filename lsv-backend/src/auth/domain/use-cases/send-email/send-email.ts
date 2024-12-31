import { Inject, Injectable } from '@nestjs/common';
import { EmailService, EmailParams } from '../../ports/email.service/email.service.interface';

@Injectable()
export class SendEmailUseCase {
    constructor(
        @Inject('EmailService') private readonly emailService: EmailService
    ) { }

    async execute(emailParams: EmailParams): Promise<void> {
        await this.emailService.sendEmail(emailParams);
    }
}
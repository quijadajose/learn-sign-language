export class EmailParams {
    constructor(
        public to: string,
        public subject: string,
        public body: string
    ) { }
}

export interface EmailService {
    sendEmail(params: EmailParams): Promise<void>;
}
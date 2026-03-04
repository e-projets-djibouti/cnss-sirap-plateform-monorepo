import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private readonly transporter: Transporter;

    constructor(private readonly config: ConfigService) {
        const host = this.config.get<string>('smtp.host', 'localhost');
        const port = this.config.get<number>('smtp.port', 1025);
        const secure = this.config.get<boolean>('smtp.secure', false);
        const user = this.config.get<string>('smtp.user');
        const pass = this.config.get<string>('smtp.pass');

        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: user && pass ? { user, pass } : undefined,
        });
    }

    async sendEmail(to: string, subject: string, html: string, text?: string): Promise<void> {
        const from = this.config.get<string>('smtp.from', 'no-reply@cnss-sirap.local');

        try {
            await this.transporter.sendMail({
                from,
                to,
                subject,
                html,
                text,
            });
        } catch (error) {
            this.logger.error(
                `Erreur envoi email à ${to}: ${error instanceof Error ? error.message : 'unknown error'}`,
            );
            throw error;
        }
    }
}

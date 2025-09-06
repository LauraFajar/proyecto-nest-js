import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`[EMAIL SIMULADO] Token de reset para ${email}: ${token}`);
      console.log(`[EMAIL SIMULADO] El token expira en 1 hora`);
      return;
    }

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Recuperación de Contraseña - AgroTIC',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2e7d32;">Recuperación de Contraseña</h2>
            <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Restablecer Contraseña
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Este enlace expirará en 1 hora. Si no solicitaste este cambio, puedes ignorar este correo.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              Este es un correo automático, por favor no respondas a este mensaje.
            </p>
          </div>
        `,
      });
    } catch (error) {
      console.log(`[EMAIL ERROR] No se pudo enviar email a ${email}`);
      console.log(`[EMAIL SIMULADO] Token de reset: ${token}`);
      console.log(`[EMAIL SIMULADO] El token expira en 1 hora`);
    }
  }
}

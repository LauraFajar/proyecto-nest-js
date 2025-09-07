import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { PassportModule } from '@nestjs/passport'; 
import { JwtModule } from '@nestjs/jwt'; 
import { RolesGuard } from './guards/roles.guard';
import { PasswordReset } from './entities/password-reset.entity';
import { EmailService } from './services/email.service';

@Module({
  imports: [
    UsuariosModule,
    PassportModule,
    JwtModule.register({
      secret: 'AGROTIC_LALUPA', 
      signOptions: { expiresIn: '1h' }, 
    }),
    MailerModule.forRootAsync({
      useFactory: () => {
        const smtpUser = process.env.SMTP_USER || '';
        const smtpPass = process.env.SMTP_PASS || '';
        const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
        const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
        
        if (!smtpUser || !smtpPass) {
          console.warn('SMTP credentials not found. Email sending will be simulated.');
        }

        return {
          transport: {
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465, 
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
            tls: {
              rejectUnauthorized: process.env.NODE_ENV === 'production' 
            }
          },
          defaults: {
            from: `"AgroTIC" <${smtpUser}>`,
          },
          template: {
            dir: __dirname + '/templates',
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailService, RolesGuard],
  exports: [AuthService, JwtModule, RolesGuard],
})
export class AuthModule {}
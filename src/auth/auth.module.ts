import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { PassportModule } from '@nestjs/passport'; 
import { JwtModule } from '@nestjs/jwt'; 
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
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
              // Solo rechazar certificados en producción
              rejectUnauthorized: process.env.NODE_ENV === 'production'
            },
            debug: false,
            logger: false
          },
          defaults: {
            from: `"AgroTIC" <${smtpUser}>`,
          }
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    EmailService,
    JwtStrategy,
    RolesGuard
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
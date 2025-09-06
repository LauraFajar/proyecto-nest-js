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
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      defaults: {
        from: `"AgroTIC" <${process.env.SMTP_USER}>`,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailService, RolesGuard],
  exports: [AuthService, JwtModule, RolesGuard],
})
export class AuthModule {}
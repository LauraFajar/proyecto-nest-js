import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsuariosService } from '../usuarios/usuarios.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from './services/email.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsuariosService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      return null;
    }
    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (user && isPasswordValid) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      sub: user.id_usuarios,
      email: user.email,
      roles: user.id_rol.nombre_rol, 
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(createUserDto: CreateUsuarioDto) {
    const existingUser = await this.usersService.findOneByEmail(createUserDto.email);
    if (existingUser) {
      throw new UnauthorizedException('El correo electrónico ya está registrado.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const newUser = await this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return newUser;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    // Verificar si el usuario existe
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return { message: 'Si el correo existe, recibirás un enlace de recuperación.' };
    }

    // Generar token único
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Expira en 1 hora

    // Guardar token directamente en el usuario
    await this.usersService.updateResetToken(user.id_usuarios, token, expiresAt);

    // Enviar email
    await this.emailService.sendPasswordResetEmail(email, token);

    return { message: 'Si el correo existe, recibirás un enlace de recuperación.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    // Buscar usuario con token válido
    const user = await this.usersService.findByResetToken(token);

    if (!user || !user.reset_token_expires) {
      throw new BadRequestException('Token inválido o expirado.');
    }

    // Verificar si el token ha expirado
    if (new Date() > user.reset_token_expires) {
      throw new BadRequestException('Token expirado.');
    }

    // Hashear nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar contraseña del usuario
    await this.usersService.updatePassword(user.id_usuarios, hashedPassword);

    // Limpiar token de reset
    await this.usersService.clearResetToken(user.id_usuarios);

    return { message: 'Contraseña actualizada exitosamente.' };
  }
}
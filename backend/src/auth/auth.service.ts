import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsuariosService } from '../usuarios/usuarios.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from './services/email.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UserPayload } from './types/user-payload.interface';
import { Role } from './roles/roles.enum';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsuariosService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async validateUser(numero_documento: string, pass: string): Promise<UserPayload | null> {
    const user = await this.usersService.findOneByDocumento(numero_documento);
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

  async login(user: UserPayload) {
    if (!user?.id_rol?.nombre_rol) {
      throw new UnauthorizedException('Usuario no tiene un rol asignado');
    }
    
    if (!user.id_usuarios || !user.numero_documento) {
      throw new UnauthorizedException('Datos de usuario incompletos');
    }
    
    // Normalizar nombres de rol desde BD al enum utilizado en la app
    const normalizeRole = (nombre: string): Role => {
      switch (nombre) {
        case 'Administrador':
          return Role.Admin;
        case 'Instructor':
          return Role.Instructor;
        case 'Aprendiz':
          return Role.Learner;
        case 'Pasante':
          return Role.Intern;
        case 'Invitado':
          return Role.Guest;
        default:
          return nombre as unknown as Role; // fallback por si hay un nombre no mapeado
      }
    };

    const payload = {
      sub: user.id_usuarios,
      numero_documento: user.numero_documento,
      roles: normalizeRole(user.id_rol.nombre_rol),
      ...(user.email && { email: user.email }),
      ...(user.nombres && { nombres: user.nombres }),
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id_usuarios: user.id_usuarios,
        numero_documento: user.numero_documento,
        email: user.email,
        nombres: user.nombres,
        rol: user.id_rol.nombre_rol,
        imagen_url: user.imagen_url,
      }
    };
  }

  async register(createUserDto: CreateUsuarioDto) {
    const existingUserByDoc = await this.usersService.findOneByDocumento(createUserDto.numero_documento);
    if (existingUserByDoc) {
      throw new UnauthorizedException('El número de documento ya está registrado.');
    }
    
    if (createUserDto.email) {
      const existingUserByEmail = await this.usersService.findOneByEmail(createUserDto.email);
      if (existingUserByEmail) {
        throw new UnauthorizedException('El correo electrónico ya está registrado.');
      }
    }

    const defaultRole = await this.usersService.findRolByName(Role.Guest);
    if (!defaultRole) {
      throw new BadRequestException('El rol Invitado no está configurado en el sistema');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const newUser = await this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
      id_rol: defaultRole.id_rol 
    });

    const { password, ...result } = newUser;
    return result;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      return { message: 'Si el correo electrónico existe, recibirás un enlace de recuperación.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); 

    await this.usersService.updateResetToken(user.id_usuarios, token, expiresAt);

    await this.emailService.sendPasswordResetEmail(user.email, token);

    return { message: 'Si el correo electrónico existe, recibirás un enlace de recuperación en breve.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    const user = await this.usersService.findByResetToken(token);

    if (!user || !user.reset_token_expires) {
      throw new BadRequestException('Token inválido o expirado.');
    }

    if (new Date() > user.reset_token_expires) {
      throw new BadRequestException('Token expirado.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await this.usersService.updatePassword(user.id_usuarios, hashedPassword);

    await this.usersService.clearResetToken(user.id_usuarios);

    return { message: 'Contraseña actualizada exitosamente.' };
  }
}
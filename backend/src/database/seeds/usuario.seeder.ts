
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from 'src/usuarios/entities/usuario.entity';
import { Rol } from 'src/rol/entities/rol.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsuarioSeeder {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
  ) {}

  async seed() {
    const salt = await bcrypt.genSalt(10);
    
    const data = [
      {
        nombres: 'Admin Temporal',
        email: 'admin@tuapp.com',
        password: 'Admin12345',
        tipo_documento: 'C.C',
        numero_documento: '999999',
        rol_nombre: 'Administrador',
      },
      {
        nombres: 'Laura Camila',
        email: 'lauracamilafajardocalderon@gmail.com',
        password: 'Laura2025',
        tipo_documento: 'C.C',
        numero_documento: '1082774473',
        rol_nombre: 'Instructor',
      },
      {
        nombres: 'Invitado Prueba',
        email: 'guest@test.local',
        password: 'Guest12345',
        tipo_documento: 'C.C',
        numero_documento: '555555',
        rol_nombre: 'Invitado',
      },
    ];

    for (const item of data) {
      const exists = await this.usuarioRepository.findOne({ where: { email: item.email } });
      if (!exists) {
        const rol = await this.rolRepository.findOne({ where: { nombre_rol: item.rol_nombre } });
        if (rol) {
          const hashedPassword = await bcrypt.hash(item.password, salt);
          const { rol_nombre, ...userData } = item;
          await this.usuarioRepository.save(this.usuarioRepository.create({
            ...userData,
            password: hashedPassword,
            id_rol: rol,
          }));
        }
      }
    }
  }
}

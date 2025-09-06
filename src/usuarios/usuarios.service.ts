import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto) {
    const { id_rol, ...userData } = createUsuarioDto;
    const nuevoUsuario = this.usuariosRepository.create({
      ...userData,
      id_rol: id_rol ? { id_rol } : undefined
    });
    return await this.usuariosRepository.save(nuevoUsuario);
  }

  async findAll() {
    return await this.usuariosRepository.find();
  }

  async findOne(id_usuarios: number) {
    return await this.usuariosRepository.findOneBy({ id_usuarios });
  }

  async update(id_usuarios: number, updateUsuarioDto: UpdateUsuarioDto) {
    const { id_rol, ...userData } = updateUsuarioDto;
    const updateData = {
      ...userData,
      ...(id_rol && { id_rol: { id_rol } })
    };
    await this.usuariosRepository.update(id_usuarios, updateData);
    return this.findOne(id_usuarios);
  }

  async remove(id_usuarios: number) {
    return await this.usuariosRepository.delete(id_usuarios);
  }

  async findOneByEmail(email: string): Promise<Usuario | null> {
    return this.usuariosRepository.findOne({ where: {email: email }, relations: ['id_rol'] });
  }

  async updatePassword(id_usuarios: number, hashedPassword: string): Promise<void> {
    await this.usuariosRepository.update(id_usuarios, { password: hashedPassword });
  }

  async updateResetToken(id_usuarios: number, token: string, expiresAt: Date): Promise<void> {
    await this.usuariosRepository.update(id_usuarios, { 
      reset_token: token, 
      reset_token_expires: expiresAt 
    });
  }

  async findByResetToken(token: string): Promise<Usuario | null> {
    return this.usuariosRepository.findOne({ 
      where: { 
        reset_token: token,
      } 
    });
  }

  async clearResetToken(id_usuarios: number): Promise<void> {
    await this.usuariosRepository
      .createQueryBuilder()
      .update(Usuario)
      .set({ 
        reset_token: () => 'NULL', 
        reset_token_expires: () => 'NULL' 
      })
      .where("id_usuarios = :id", { id: id_usuarios })
      .execute();
  }
}

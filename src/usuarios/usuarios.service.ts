import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { RolService } from '../rol/rol.service';
import { PaginationDto } from './dto/pagination.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
    private rolService: RolService,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto) {
    const { id_rol, ...userData } = createUsuarioDto;
    const nuevoUsuario = this.usuariosRepository.create({
      ...userData,
      id_rol: id_rol ? { id_rol } : undefined
    });
    return await this.usuariosRepository.save(nuevoUsuario);
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, page = 1 } = paginationDto;
    const [data, total] = await this.usuariosRepository.findAndCount({
      relations: ['id_rol'],
      take: limit,
      skip: (page - 1) * limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id_usuarios: number) {
    return await this.usuariosRepository.findOne({
      where: { id_usuarios },
      relations: ['id_rol'],
    });
  }

  async update(id_usuarios: number, updateUsuarioDto: UpdateUsuarioDto) {
    const { id_rol, ...userData } = updateUsuarioDto;
    const updateData: any = {
      ...userData,
      ...(id_rol && { id_rol: { id_rol } })
    };

    if (Object.keys(updateData).length === 0) {
      return this.findOne(id_usuarios);
    }

    await this.usuariosRepository.update(id_usuarios, updateData);
    return this.findOne(id_usuarios);
  }

  async remove(id_usuarios: number) {
    return await this.usuariosRepository.delete(id_usuarios);
  }

  async findRolById(id_rol: number) {
    return await this.rolService.findOne(id_rol);
  }

  async findRolByName(nombre_rol: string) {
    return await this.rolService.findByName(nombre_rol);
  }

  async findOneByEmail(email: string): Promise<Usuario | null> {
    return this.usuariosRepository.findOne({ where: {email: email }, relations: ['id_rol'] });
  }

  async findOneByDocumento(numero_documento: string): Promise<Usuario | null> {
    return this.usuariosRepository.findOne({ 
      where: { numero_documento }, 
      relations: ['id_rol'] 
    });
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

  async updateImagen(id_usuarios: number, imagenUrl: string): Promise<Usuario> {
    await this.usuariosRepository.update(id_usuarios, { imagen_url: imagenUrl });
    const usuario = await this.findOne(id_usuarios);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id_usuarios} no encontrado`);
    }
    return usuario;
  }
}

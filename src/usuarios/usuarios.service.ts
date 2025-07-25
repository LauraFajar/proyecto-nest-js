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
    const nuevoUsuario = this.usuariosRepository.create(createUsuarioDto);
    return await this.usuariosRepository.save(nuevoUsuario);
  }

  async findAll() {
    return await this.usuariosRepository.find();
  }

  async findOne(id_usuarios: number) {
    return await this.usuariosRepository.findOneBy({ id_usuarios });
  }

  async update(id_usuarios: number, updateUsuarioDto: UpdateUsuarioDto) {
    await this.usuariosRepository.update(id_usuarios, updateUsuarioDto);
    return this.findOne(id_usuarios);
  }

  async remove(id_usuarios: number) {
    return await this.usuariosRepository.delete(id_usuarios);
  }
}

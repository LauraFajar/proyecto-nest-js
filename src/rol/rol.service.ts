import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from './entities/rol.entity';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';

@Injectable()
export class RolService {
  constructor(
    @InjectRepository(Rol)
    private rolRepository: Repository<Rol>,
  ) {}

  async create(createRolDto: CreateRolDto) {
    const nuevoRol = this.rolRepository.create(createRolDto);
    return await this.rolRepository.save(nuevoRol);
  }

  async findAll() {
    return await this.rolRepository.find();
  }

  async findOne(id_rol: number) {
    return await this.rolRepository.findOneBy({ id_rol });
  }

  async update(id_rol: number, updateRolDto: UpdateRolDto) {
    await this.rolRepository.update(id_rol, updateRolDto);
    return this.findOne(id_rol); 
  }

  async remove(id_rol: number) {
    return await this.rolRepository.delete(id_rol);
  }
}

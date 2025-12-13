import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from './entities/rol.entity';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { Tiporol } from '../tiporol/entities/tiporol.entity';

@Injectable()
export class RolService {
  constructor(
    @InjectRepository(Rol)
    private rolRepository: Repository<Rol>,
    @InjectRepository(Tiporol)
    private tipoRolRepository: Repository<Tiporol>,
  ) {}

  async create(createRolDto: CreateRolDto) {
    const tipoRol = await this.tipoRolRepository.findOne({
      where: { id_tipo_rol: createRolDto.id_tipo_rol },
    });

    if (!tipoRol) {
      throw new NotFoundException(
        `Tipo de rol con ID ${createRolDto.id_tipo_rol} no encontrado`,
      );
    }

    const nuevoRol = this.rolRepository.create({
      ...createRolDto,
      id_tipo_rol: tipoRol,
    });

    return await this.rolRepository.save(nuevoRol);
  }

  async findAll() {
    return await this.rolRepository.find();
  }

  async findOne(id_rol: number) {
    return await this.rolRepository.findOneBy({ id_rol });
  }

  async findByName(nombre_rol: string) {
    return await this.rolRepository.findOne({ where: { nombre_rol } });
  }

  async update(id_rol: number, updateRolDto: UpdateRolDto) {
    const updateData: any = { ...updateRolDto };

    if (updateRolDto.id_tipo_rol) {
      const tipoRol = await this.tipoRolRepository.findOne({
        where: { id_tipo_rol: updateRolDto.id_tipo_rol },
      });

      if (!tipoRol) {
        throw new NotFoundException(
          `Tipo de rol con ID ${updateRolDto.id_tipo_rol} no encontrado`,
        );
      }

      updateData.id_tipo_rol = tipoRol;
    }

    await this.rolRepository.update(id_rol, updateData);
    return this.findOne(id_rol);
  }

  async remove(id_rol: number) {
    return await this.rolRepository.delete(id_rol);
  }
}

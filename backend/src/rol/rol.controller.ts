import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, SetMetadata } from '@nestjs/common';
import { RolService } from './rol.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles.enum';
import { Reflector } from '@nestjs/core';
import { Permisos } from '../permisos/decorators/permisos.decorator';

@Controller('rol')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RolController {
  constructor(private readonly rolService: RolService) {}

  @Post()
  @Roles(Role.Admin)
  @Permisos({ recurso: 'rol', accion: 'crear' })
  create(@Body() createRolDto: CreateRolDto) {
    return this.rolService.create(createRolDto);
  }

  @Get()
  @Roles(Role.Admin)
  @Permisos({ recurso: 'rol', accion: 'ver' })
  findAll() {
    return this.rolService.findAll();
  }

  @Get('disponibles')
  @SetMetadata('isPublic', true)
  async findRolesDisponibles() {
    return this.rolService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin)
  @Permisos({ recurso: 'rol', accion: 'ver' })
  findOne(@Param('id') id: string) {
    return this.rolService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @Permisos({ recurso: 'rol', accion: 'editar' })
  update(@Param('id') id: string, @Body() updateRolDto: UpdateRolDto) {
    return this.rolService.update(+id, updateRolDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @Permisos({ recurso: 'rol', accion: 'eliminar' })
  remove(@Param('id') id: string) {
    return this.rolService.remove(+id);
  }
}

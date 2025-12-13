import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { InsumosService } from './insumos.service';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles.enum';
import { Permisos } from '../permisos/decorators/permisos.decorator';

@Controller('insumos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class InsumosController {
  constructor(private readonly insumosService: InsumosService) {}

  @Post()
  @Roles(Role.Admin)
  @Permisos({ recurso: 'insumos', accion: 'crear' })
  create(@Body() createInsumoDto: CreateInsumoDto) {
    return this.insumosService.create(createInsumoDto);
  }

  @Get()
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  @Permisos({ recurso: 'insumos', accion: 'ver' })
  findAll() {
    return this.insumosService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  @Permisos({ recurso: 'insumos', accion: 'ver' })
  findOne(@Param('id') id: string) {
    return this.insumosService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @Permisos({ recurso: 'insumos', accion: 'editar' })
  update(@Param('id') id: string, @Body() updateInsumoDto: UpdateInsumoDto) {
    return this.insumosService.update(+id, updateInsumoDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @Permisos({ recurso: 'insumos', accion: 'eliminar' })
  remove(@Param('id') id: string) {
    return this.insumosService.remove(+id);
  }
}

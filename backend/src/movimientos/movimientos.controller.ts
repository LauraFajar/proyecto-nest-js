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
import { MovimientosService } from './movimientos.service';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { UpdateMovimientoDto } from './dto/update-movimiento.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles.enum';
import { Permisos } from '../permisos/decorators/permisos.decorator';

@Controller('movimientos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MovimientosController {
  constructor(private readonly movimientosService: MovimientosService) {}

  @Post()
  @Roles(Role.Admin, Role.Instructor)
  @Permisos({ recurso: 'movimientos', accion: 'crear' })
  create(@Body() createMovimientoDto: CreateMovimientoDto) {
    return this.movimientosService.create(createMovimientoDto);
  }

  @Get()
  @Roles(Role.Admin, Role.Instructor)
  @Permisos({ recurso: 'movimientos', accion: 'ver' })
  findAll() {
    return this.movimientosService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin)
  @Permisos({ recurso: 'movimientos', accion: 'ver' })
  findOne(@Param('id') id: string) {
    return this.movimientosService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @Permisos({ recurso: 'movimientos', accion: 'editar' })
  update(
    @Param('id') id: string,
    @Body() updateMovimientoDto: UpdateMovimientoDto,
  ) {
    return this.movimientosService.update(+id, updateMovimientoDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @Permisos({ recurso: 'movimientos', accion: 'eliminar' })
  remove(@Param('id') id: string) {
    return this.movimientosService.remove(+id);
  }
}

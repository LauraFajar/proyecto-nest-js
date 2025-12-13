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
import { IngresosService } from './ingresos.service';
import { CreateIngresoDto } from './dto/create-ingreso.dto';
import { UpdateIngresoDto } from './dto/update-ingreso.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles.enum';
import { Permisos } from '../permisos/decorators/permisos.decorator';

@Controller('ingresos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class IngresosController {
  constructor(private readonly ingresosService: IngresosService) {}

  @Post()
  @Roles(Role.Admin)
  @Permisos({ recurso: 'ingresos', accion: 'crear' })
  create(@Body() createIngresoDto: CreateIngresoDto) {
    return this.ingresosService.create(createIngresoDto);
  }

  @Get()
  @Roles(Role.Admin)
  @Permisos({ recurso: 'ingresos', accion: 'ver' })
  findAll() {
    return this.ingresosService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin)
  @Permisos({ recurso: 'ingresos', accion: 'ver' })
  findOne(@Param('id') id: string) {
    return this.ingresosService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @Permisos({ recurso: 'ingresos', accion: 'editar' })
  update(@Param('id') id: string, @Body() updateIngresoDto: UpdateIngresoDto) {
    return this.ingresosService.update(+id, updateIngresoDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @Permisos({ recurso: 'ingresos', accion: 'eliminar' })
  remove(@Param('id') id: string) {
    return this.ingresosService.remove(+id);
  }
}

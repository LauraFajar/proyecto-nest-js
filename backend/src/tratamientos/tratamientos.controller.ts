import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { TratamientosService } from './tratamientos.service';
import { CreateTratamientoDto } from './dto/create-tratamiento.dto';
import { UpdateTratamientoDto } from './dto/update-tratamiento.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles.enum';
import { Permisos } from '../permisos/decorators/permisos.decorator';

@Controller('tratamientos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TratamientosController {
  constructor(private readonly tratamientosService: TratamientosService) {}

  @Post()
  @Roles(Role.Admin, Role.Instructor)
  @Permisos({ recurso: 'tratamientos', accion: 'crear' })
  create(@Body() createTratamientoDto: CreateTratamientoDto) {
    return this.tratamientosService.create(createTratamientoDto);
  }

  @Get()
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  @Permisos({ recurso: 'tratamientos', accion: 'ver' })
  findAll(@Query('epaId') epaIdRaw?: string, @Query('tipo') tipo?: string) {
    const epaId =
      epaIdRaw && /^\d+$/.test(epaIdRaw) ? parseInt(epaIdRaw, 10) : undefined;
    return this.tratamientosService.findAll(epaId, tipo);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  @Permisos({ recurso: 'tratamientos', accion: 'ver' })
  findOne(@Param('id') id: string) {
    return this.tratamientosService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Instructor)
  @Permisos({ recurso: 'tratamientos', accion: 'editar' })
  update(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() updateTratamientoDto: UpdateTratamientoDto,
  ) {
    return this.tratamientosService.update(id, updateTratamientoDto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Instructor)
  @Permisos({ recurso: 'tratamientos', accion: 'eliminar' })
  remove(@Param('id') id: string) {
    return this.tratamientosService.remove(+id);
  }
}

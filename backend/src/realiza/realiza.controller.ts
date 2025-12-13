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
import { RealizaService } from './realiza.service';
import { CreateRealizaDto } from './dto/create-realiza.dto';
import { UpdateRealizaDto } from './dto/update-realiza.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles.enum';
import { Permisos } from '../permisos/decorators/permisos.decorator';

@Controller('realiza')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RealizaController {
  constructor(private readonly realizaService: RealizaService) {}

  @Post()
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  @Permisos({ recurso: 'realiza', accion: 'crear' })
  create(@Body() createRealizaDto: CreateRealizaDto) {
    return this.realizaService.create(createRealizaDto);
  }

  @Get()
  @Roles(Role.Admin, Role.Instructor)
  @Permisos({ recurso: 'realiza', accion: 'ver' })
  findAll() {
    return this.realizaService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Instructor)
  @Permisos({ recurso: 'realiza', accion: 'ver' })
  findOne(@Param('id') id: string) {
    return this.realizaService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Instructor)
  @Permisos({ recurso: 'realiza', accion: 'editar' })
  update(@Param('id') id: string, @Body() updateRealizaDto: UpdateRealizaDto) {
    return this.realizaService.update(+id, updateRealizaDto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Instructor)
  @Permisos({ recurso: 'realiza', accion: 'eliminar' })
  remove(@Param('id') id: string) {
    return this.realizaService.remove(+id);
  }
}

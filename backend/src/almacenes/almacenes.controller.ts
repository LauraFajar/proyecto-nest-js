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
import { AlmacenesService } from './almacenes.service';
import { CreateAlmaceneDto } from './dto/create-almacene.dto';
import { UpdateAlmaceneDto } from './dto/update-almacene.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles.enum';
import { Permisos } from '../permisos/decorators/permisos.decorator';

@Controller('almacenes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AlmacenesController {
  constructor(private readonly almacenesService: AlmacenesService) {}

  @Post()
  @Roles(Role.Admin, Role.Instructor)
  @Permisos({ recurso: 'almacenes', accion: 'crear' })
  create(@Body() createAlmaceneDto: CreateAlmaceneDto) {
    return this.almacenesService.create(createAlmaceneDto);
  }

  @Get()
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  @Permisos({ recurso: 'almacenes', accion: 'ver' })
  findAll() {
    return this.almacenesService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  @Permisos({ recurso: 'almacenes', accion: 'ver' })
  findOne(@Param('id') id: string) {
    return this.almacenesService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Instructor)
  @Permisos({ recurso: 'almacenes', accion: 'editar' })
  update(
    @Param('id') id: string,
    @Body() updateAlmaceneDto: UpdateAlmaceneDto,
  ) {
    return this.almacenesService.update(+id, updateAlmaceneDto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Instructor)
  @Permisos({ recurso: 'almacenes', accion: 'eliminar' })
  remove(@Param('id') id: string) {
    return this.almacenesService.remove(+id);
  }
}

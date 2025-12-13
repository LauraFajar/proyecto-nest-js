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
import { TiporolService } from './tiporol.service';
import { CreateTiporolDto } from './dto/create-tiporol.dto';
import { UpdateTiporolDto } from './dto/update-tiporol.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles.enum';
import { Permisos } from '../permisos/decorators/permisos.decorator';

@Controller('tiporol')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TiporolController {
  constructor(private readonly tiporolService: TiporolService) {}

  @Post()
  @Roles(Role.Admin)
  @Permisos({ recurso: 'tiporol', accion: 'crear' })
  create(@Body() createTiporolDto: CreateTiporolDto) {
    return this.tiporolService.create(createTiporolDto);
  }

  @Get()
  @Roles(Role.Admin)
  @Permisos({ recurso: 'tiporol', accion: 'ver' })
  findAll() {
    return this.tiporolService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin)
  @Permisos({ recurso: 'tiporol', accion: 'ver' })
  findOne(@Param('id') id: string) {
    return this.tiporolService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @Permisos({ recurso: 'tiporol', accion: 'editar' })
  update(@Param('id') id: string, @Body() updateTiporolDto: UpdateTiporolDto) {
    return this.tiporolService.update(+id, updateTiporolDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @Permisos({ recurso: 'tiporol', accion: 'eliminar' })
  remove(@Param('id') id: string) {
    return this.tiporolService.remove(+id);
  }
}

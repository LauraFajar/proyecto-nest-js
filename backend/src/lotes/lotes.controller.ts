import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { LotesService } from './lotes.service';
import { CreateLoteDto } from './dto/create-lote.dto';
import { UpdateLoteDto } from './dto/update-lote.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles.enum';
import { Permisos } from '../permisos/decorators/permisos.decorator';

@Controller('lotes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class LotesController {
  constructor(private readonly lotesService: LotesService) {}

  @Post()
  @Roles(Role.Admin, Role.Instructor)
  create(@Body() createLoteDto: CreateLoteDto) {
    return this.lotesService.create(createLoteDto);
  }

  @Get()
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  findAll() {
    return this.lotesService.findAll();
  }

  @Get('map-data')
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  getMapData() {
    return this.lotesService.findAllWithGeoData();
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  findOne(@Param('id') id: string) {
    return this.lotesService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Instructor)
  @Permisos({ recurso: 'lotes', accion: 'editar' })
  update(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() updateLoteDto: UpdateLoteDto,
  ) {
    return this.lotesService.update(id, updateLoteDto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Instructor)
  remove(@Param('id', new ParseIntPipe()) id: number) {
    return this.lotesService.remove(id);
  }

  @Put(':id/coordenadas')
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  @Permisos({ recurso: 'lotes', accion: 'editar' })
  async updateCoordinates(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() body: any,
  ) {
    const coords = Array.isArray(body?.coordenadas)
      ? body.coordenadas
      : Array.isArray(body?.coordinates)
        ? body.coordinates
        : null;
    if (!Array.isArray(coords) || !coords.length) {
      throw new BadRequestException('Payload de coordenadas inválido');
    }
    return this.lotesService.update(id, { coordenadas: coords });
  }

  @Post(':id/coordenadas')
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  @Permisos({ recurso: 'lotes', accion: 'editar' })
  async createOrUpdateCoordinates(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() body: any,
  ) {
    const coords = Array.isArray(body?.coordenadas)
      ? body.coordenadas
      : Array.isArray(body?.coordinates)
        ? body.coordinates
        : null;
    if (!Array.isArray(coords) || !coords.length) {
      throw new BadRequestException('Payload de coordenadas inválido');
    }
    return this.lotesService.update(id, { coordenadas: coords });
  }
}

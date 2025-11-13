import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EpaService } from './epa.service';
import { CreateEpaDto } from './dto/create-epa.dto';
import { UpdateEpaDto } from './dto/update-epa.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles.enum';
import { UploadsService } from '../uploads/uploads.service';
import { PaginationDto } from './dto/pagination.dto';
import { Permisos } from '../permisos/decorators/permisos.decorator';

@Controller('epa')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EpaController {
  constructor(
    private readonly epaService: EpaService,
    private readonly uploadsService: UploadsService
  ) {}

  @Post()
  @Roles(Role.Admin, Role.Instructor)
  @Permisos({ recurso: 'epa', accion: 'crear' })
  @UseInterceptors(FileInterceptor('imagen'))
  async create(@Body() createEpaDto: CreateEpaDto, @UploadedFile() file?: Express.Multer.File) {
    if (file) {
      const imageUrl = this.uploadsService.getImageUrl(file.filename);
      createEpaDto.imagen_referencia = imageUrl;
    }
    return this.epaService.create(createEpaDto);
  }

  @Post(':id/upload-imagen')
  @Roles(Role.Admin, Role.Instructor)
  @UseInterceptors(FileInterceptor('imagen'))
  async uploadImagen(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    console.log('File uploaded EPA:', file);

    if (!file) {
      return { error: 'No se ha proporcionado ninguna imagen' };
    }

    const imagenUrl = `/uploads/epa/${file.filename}`;
    console.log('Image URL EPA:', imagenUrl);

    await this.epaService.update(+id, { imagen_referencia: imagenUrl });

    return {
      message: 'Imagen subida correctamente',
      imageUrl: imagenUrl
    };
  }

  @Get()
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  @Permisos({ recurso: 'epa', accion: 'ver' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.epaService.findAll(paginationDto);
  }

  @Get('buscar')
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  @Permisos({ recurso: 'epa', accion: 'ver' })
  search(@Query('q') query: string, @Query('tipo') tipo?: string) {
    return this.epaService.search(query, tipo);
  }

  @Get('tipos')
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  @Permisos({ recurso: 'epa', accion: 'ver' })
  getTipos() {
    return ['enfermedad', 'plaga', 'arvense'];
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  @Permisos({ recurso: 'epa', accion: 'ver' })
  findOne(@Param('id') id: string) {
    return this.epaService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Instructor)
  @Permisos({ recurso: 'epa', accion: 'editar' })
  update(@Param('id') id: string, @Body() updateEpaDto: UpdateEpaDto) {
    return this.epaService.update(+id, updateEpaDto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Instructor)
  @Permisos({ recurso: 'epa', accion: 'eliminar' })
  remove(@Param('id') id: string) {
    return this.epaService.remove(+id);
  }
}

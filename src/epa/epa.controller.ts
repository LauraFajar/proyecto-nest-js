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

@Controller('epa')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EpaController {
  constructor(
    private readonly epaService: EpaService,
    private readonly uploadsService: UploadsService
  ) {}

  @Post()
  @Roles(Role.Admin, Role.Instructor)
  @UseInterceptors(FileInterceptor('imagen'))
  async create(@Body() createEpaDto: CreateEpaDto, @UploadedFile() file?: Express.Multer.File) {
    if (file) {
      const imageUrl = this.uploadsService.getImageUrl(file.filename);
      createEpaDto.imagen_referencia = imageUrl;
    }
    return this.epaService.create(createEpaDto);
  }

  @Post('upload/:id')
  @Roles(Role.Admin, Role.Instructor)
  @UseInterceptors(FileInterceptor('imagen'))
  async uploadImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { error: 'No se ha proporcionado ninguna imagen' };
    }
    
    const imageUrl = this.uploadsService.getImageUrl(file.filename);
    await this.epaService.update(+id, { imagen_referencia: imageUrl });
    
    return {
      message: 'Imagen subida correctamente',
      imageUrl
    };
  }

  @Get()
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  findAll() {
    return this.epaService.findAll();
  }

  @Get('buscar')
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  search(@Query('q') query: string, @Query('tipo') tipo?: string) {
    return this.epaService.search(query, tipo);
  }

  @Get('tipos')
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  getTipos() {
    return ['enfermedad', 'plaga', 'arvense'];
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  findOne(@Param('id') id: string) {
    return this.epaService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Instructor)
  update(@Param('id') id: string, @Body() updateEpaDto: UpdateEpaDto) {
    return this.epaService.update(+id, updateEpaDto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Instructor)
  remove(@Param('id') id: string) {
    return this.epaService.remove(+id);
  }
}

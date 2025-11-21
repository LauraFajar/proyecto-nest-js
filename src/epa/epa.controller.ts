import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
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
  @UseInterceptors(FileInterceptor('imagen', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dir = './uploads/epa';
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const unique = uuidv4();
        const ext = extname(file.originalname);
        cb(null, `${unique}${ext}`);
      },
    }),
  }))
  async create(@Body() createEpaDto: CreateEpaDto, @UploadedFile() file?: Express.Multer.File) {
    if (file) {
      let filename = file.filename;
      const dir = './uploads/epa';
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      if (!filename) {
        const unique = uuidv4();
        const ext = extname(file.originalname || '.jpg');
        filename = `${unique}${ext}`;
        const fullPath = join(dir, filename);
        if (file.buffer) writeFileSync(fullPath, file.buffer);
      }
      const imageUrl = this.uploadsService.getImageUrl(filename);
      createEpaDto.imagen_referencia = imageUrl;
    }
    return this.epaService.create(createEpaDto);
  }

  @Post(':id/upload-imagen')
  @Roles(Role.Admin, Role.Instructor)
  @UseInterceptors(FileInterceptor('imagen', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dir = './uploads/epa';
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const unique = uuidv4();
        const ext = extname(file.originalname);
        cb(null, `${unique}${ext}`);
      },
    }),
  }))
  async uploadImagen(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    console.log('File uploaded EPA:', file);

    if (!file) {
      return { error: 'No se ha proporcionado ninguna imagen' };
    }
    const dir = './uploads/epa';
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    let filename = file.filename;
    if (!filename) {
      const unique = uuidv4();
      const ext = extname(file.originalname || '.jpg');
      filename = `${unique}${ext}`;
      const fullPath = join(dir, filename);
      if (file.buffer) writeFileSync(fullPath, file.buffer);
    }
    const imagenUrl = `/uploads/epa/${filename}`;
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

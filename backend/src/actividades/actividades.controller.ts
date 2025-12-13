import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ActividadesService } from './actividades.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateActividadeDto } from './dto/create-actividade.dto';
import { UpdateActividadeDto } from './dto/update-actividade.dto';
import { PaginationDto } from './dto/pagination.dto';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Controller('actividades')
@UseGuards(JwtAuthGuard)
export class ActividadesController {
  constructor(private readonly actividadesService: ActividadesService) {}

  @Post()
  @HttpCode(201)
  create(@Body() createActividadDto: CreateActividadeDto) {
    return this.actividadesService.create(createActividadDto);
  }

  @Post('upload-photo/:actividadId')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = './uploads/actividades';
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const unique = uuidv4();
          const ext = extname(file.originalname || '.jpg');
          cb(null, `${unique}${ext}`);
        },
      }),
    }),
  )
  uploadPhoto(
    @Param('actividadId', ParseIntPipe) actividadId: number,
    @UploadedFile() photo: Express.Multer.File,
  ) {
    console.log('File uploaded Actividad:', photo);
    return this.actividadesService.handlePhotoUpload(actividadId, photo);
  }

  @Get(':actividadId/photos')
  getPhotosByActividad(
    @Param('actividadId', ParseIntPipe) actividadId: number,
  ) {
    return this.actividadesService.getFotosByActividad(actividadId);
  }

  @Get(':actividadId/recursos')
  getRecursosByActividad(
    @Param('actividadId', ParseIntPipe) actividadId: number,
  ) {
    return this.actividadesService.getRecursosByActividad(actividadId);
  }

  @Get()
  findAll(
    @Query(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    )
    paginationDto: PaginationDto,
  ) {
    return this.actividadesService.findAll(
      paginationDto.id_cultivo,
      paginationDto,
    );
  }

  @Get('reporte')
  async reporteActividades(
    @Query('id_cultivo', new ParseIntPipe({ optional: true }))
    id_cultivo?: number,
    @Query('fecha_inicio') fecha_inicio?: string,
    @Query('fecha_fin') fecha_fin?: string,
  ) {
    return this.actividadesService.obtenerReporteActividades(
      id_cultivo,
      fecha_inicio,
      fecha_fin,
    );
  }

  @Get('estadisticas')
  async estadisticasActividades() {
    return this.actividadesService.obtenerEstadisticas();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.actividadesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateActividadDto: UpdateActividadeDto,
  ) {
    return this.actividadesService.update(id, updateActividadDto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.actividadesService.remove(id);
  }
}

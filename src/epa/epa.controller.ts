import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { EpaService } from './epa.service';
import { CreateEpaDto } from './dto/create-epa.dto';
import { UpdateEpaDto } from './dto/update-epa.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles.enum';
import { extname } from 'path';

@Controller('epa')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EpaController {
  constructor(private readonly epaService: EpaService) {}

  @Post()
  @Roles(Role.Admin, Role.Instructor)
  @UseInterceptors(
    FileInterceptor('imagen_referencia', {
      storage: diskStorage({
        destination: './uploads', // carpeta donde se guardarán las fotos
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, file.fieldname + '-' + uniqueSuffix + ext);
        },
      }),
    }),
  )
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateEpaDto,
  ) {
    return this.epaService.create({
      ...body,
      imagen_referencia: file ? `/uploads/${file.filename}` : undefined, // <-- usa undefined
    });
  }

  @Get()
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  findAll() {
    return this.epaService.findAll();
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

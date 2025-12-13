import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles.enum';
import { Public } from '../auth/decorators/public.decorator';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('epa')
  @Roles(Role.Admin, Role.Instructor)
  @UseInterceptors(FileInterceptor('file'))
  async uploadEpaImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    const relativePath = this.uploadsService.getImageUrl(file.filename);

    return {
      originalname: file.originalname,
      filename: file.filename,
      path: relativePath,
    };
  }

  @Public()
  @Get('epa/:filename')
  async getEpaImage(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads/epa', filename);
    if (!existsSync(filePath)) {
      throw new BadRequestException('No se pudo encontrar la imagen');
    }
    return res.sendFile(filePath);
  }

  @Public()
  @Get('actividades/:filename')
  async getActividadImage(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = join(process.cwd(), 'uploads/actividades', filename);
    if (!existsSync(filePath)) {
      throw new BadRequestException('No se pudo encontrar la imagen');
    }
    return res.sendFile(filePath);
  }
}

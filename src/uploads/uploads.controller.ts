import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, Get, Param, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles.enum';

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
      path: relativePath
    };
  }

  @Get('epa/:filename')
  async getEpaImage(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const file = createReadStream(join(process.cwd(), 'uploads/epa', filename));
      file.pipe(res);
    } catch (error) {
      throw new BadRequestException('No se pudo encontrar la imagen');
    }
  }
}
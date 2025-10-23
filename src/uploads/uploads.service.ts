import { Injectable } from '@nestjs/common';
import { join } from 'path';

@Injectable()
export class UploadsService {
  getImagePath(filename: string, folder: string = 'epa'): string {
    return join('uploads', folder, filename);
  }

  getImageUrl(filename: string, folder: string = 'epa'): string {
    return `/uploads/${folder}/${filename}`;
  }
}
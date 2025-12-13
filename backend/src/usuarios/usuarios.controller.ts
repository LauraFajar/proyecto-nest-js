import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UploadedFile,
  UseInterceptors,
  Request,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles.enum';
import { PaginationDto } from './dto/pagination.dto';
import { Permisos } from '../permisos/decorators/permisos.decorator';

@Controller('usuarios')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @Roles(Role.Admin)
  @Permisos({ recurso: 'usuarios', accion: 'crear' })
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Get()
  @Roles(Role.Admin)
  @Permisos({ recurso: 'usuarios', accion: 'ver' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.usuariosService.findAll(paginationDto);
  }

  @Get('basico')
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern, Role.Guest)
  findAllBasic(@Query() paginationDto: PaginationDto) {
    return this.usuariosService.findAllBasic(paginationDto);
  }

  @Get(':id')
  @Roles(Role.Admin)
  @Permisos({ recurso: 'usuarios', accion: 'ver' })
  findOne(@Param('id', new ParseIntPipe()) id: number) {
    return this.usuariosService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern, Role.Guest)
  @Permisos({ recurso: 'usuarios', accion: 'editar' })
  update(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    if (req.user.roles !== Role.Admin && userId !== id) {
      throw new ForbiddenException('No puedes actualizar otros perfiles');
    }

    // Si no es admin, remover el campo id_rol del DTO para evitar que cambie su propio rol
    if (req.user.roles !== Role.Admin) {
      delete updateUsuarioDto.id_rol;
    }

    return this.usuariosService.update(id, updateUsuarioDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @Permisos({ recurso: 'usuarios', accion: 'eliminar' })
  remove(@Param('id', new ParseIntPipe()) id: number) {
    return this.usuariosService.remove(id);
  }

  @Post(':id/upload-imagen')
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern, Role.Guest)
  @Permisos({ recurso: 'usuarios', accion: 'editar' })
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage: diskStorage({
        destination: './uploads/usuarios',
        filename: (req, file, callback) => {
          const uniqueSuffix = uuidv4();
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async uploadImagen(
    @Param('id', new ParseIntPipe()) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    console.log('File uploaded:', file);

    const userId = req.user.id;
    if (req.user.roles !== Role.Admin && userId !== id) {
      throw new ForbiddenException(
        'No puedes actualizar la imagen de otros usuarios',
      );
    }

    const imagenUrl = `/uploads/usuarios/${file.filename}`;
    console.log('Image URL:', imagenUrl);

    return this.usuariosService.updateImagen(id, imagenUrl);
  }
}

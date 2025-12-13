import { Body, Controller, Delete, Get, Param, Post, UseGuards, Request, ForbiddenException, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { PermisosService } from './permisos.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles/roles.enum';

@Controller('permisos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PermisosController {
  constructor(private readonly permisosService: PermisosService) {}

  @Post()
  @Roles(Role.Admin)
  async create(@Body() body: { clave: string; nombre_permiso: string; descripcion?: string; activo?: boolean }) {
    return this.permisosService.createPermiso(body);
  }

  @Get()
  @Roles(Role.Admin)
  async list() {
    return this.permisosService.findAll();
  }

  @Get('usuario/me')
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern, Role.Guest)
  async listMyPermissions(@Request() req) {
    const rawId = req.user?.id;
    const userId = Number(rawId);
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new BadRequestException('ID de usuario inválido');
    }
    return this.permisosService.getUserPermissions(userId);
  }

  @Get('usuario/:id')
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern, Role.Guest)
  async listByUser(@Param('id', new ParseIntPipe()) id: number, @Request() req) {
    const requestedId = id;
    const userId = req.user?.id;
    const userRole = req.user?.roles as Role | undefined;

    if (userRole !== Role.Admin && userId !== requestedId) {
      throw new ForbiddenException('No puedes consultar permisos de otros usuarios');
    }
    return this.permisosService.getUserPermissions(requestedId);
  }

  @Post('asignar')
  @Roles(Role.Admin)
  async assign(@Body() body: { id_usuario: number; id_permiso: number }) {
    return this.permisosService.assignToUser(body.id_usuario, body.id_permiso);
  }

  @Delete('asignar')
  @Roles(Role.Admin)
  async revoke(@Body() body: { id_usuario: number; id_permiso: number }) {
    return this.permisosService.revokeFromUser(body.id_usuario, body.id_permiso);
  }
}
import { Body, Controller, Delete, Get, Param, Post, UseGuards, Request, ForbiddenException } from '@nestjs/common';
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

  @Get('usuario/:id')
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  async listByUser(@Param('id') id: string, @Request() req) {
    const requestedId = Number(id);
    const userId = req.user?.id;
    const userRole = req.user?.roles as Role | undefined;

    // Permitir que un usuario autenticado consulte SOLO sus propios permisos
    // Admin puede consultar permisos de cualquier usuario
    if (userRole !== Role.Admin && userId !== requestedId) {
      throw new ForbiddenException('No puedes consultar permisos de otros usuarios');
    }
    return this.permisosService.getUserPermissions(requestedId);
  }

  @Get('usuario/me')
  @Roles(Role.Admin, Role.Instructor, Role.Learner, Role.Intern)
  async listMyPermissions(@Request() req) {
    const userId = req.user?.id;
    return this.permisosService.getUserPermissions(Number(userId));
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
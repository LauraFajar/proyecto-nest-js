import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermisosService } from '../permisos.service';
import { Role } from '../../auth/roles/roles.enum';

type PermisoRequirement = string | { recurso: string; accion?: string };

@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permisosService: PermisosService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get<PermisoRequirement[]>(
      'permisos',
      context.getHandler(),
    );
    const mode =
      this.reflector.get<'all' | 'any'>(
        'permisos_mode',
        context.getHandler(),
      ) ?? 'all';
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { id?: number; roles?: Role } | undefined;
    if (!user?.id) return false;

    // Override: Admin e Instructor pasan cualquier chequeo de permisos
    if (user.roles === Role.Admin || user.roles === Role.Instructor) {
      return true;
    }

    const userPermClaves = await this.permisosService.getUserPermissions(
      user.id,
    );

    const match = (req: PermisoRequirement): boolean => {
      if (typeof req === 'string') return userPermClaves.includes(req);
      const recurso = req.recurso;
      const accion = req.accion;
      if (accion) {
        return userPermClaves.includes(`${recurso}:${accion}`);
      }
      return userPermClaves.some((k) => {
        const [r] = k.split(':');
        return r === recurso || k === recurso;
      });
    };

    if (mode === 'any') {
      return required.some(match);
    }
    return required.every(match);
  }
}

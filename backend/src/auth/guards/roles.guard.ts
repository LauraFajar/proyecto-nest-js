import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../roles/roles.enum';
import { PermisosService } from '../../permisos/permisos.service';

type PermisoRequirement = string | { recurso: string; accion?: string };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly permisosService: PermisosService,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const requiredRoles = this.reflector.get<Role[]>(
      'roles',
      context.getHandler(),
    );
    const permRequired = this.reflector.get<PermisoRequirement[]>(
      'permisos',
      context.getHandler(),
    );
    const permMode =
      this.reflector.get<'all' | 'any'>(
        'permisos_mode',
        context.getHandler(),
      ) ?? 'all';

    // Si no hay roles ni permisos requeridos, permitir acceso
    if (!requiredRoles && (!permRequired || permRequired.length === 0)) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { id?: number; roles?: Role } | undefined;

    if (!user) return false;

    // Primero: si el rol del usuario coincide con los requeridos, permitir
    if (requiredRoles && requiredRoles.includes(user.roles as Role)) {
      return true;
    }

    // Segundo: si hay permisos requeridos definidos en el handler, permitir por permiso explícito
    if (permRequired && permRequired.length > 0 && user.id) {
      return this.checkPermissions(user.id, permRequired, permMode);
    }

    // En ausencia de coincidencia de rol y sin permisos definidos, denegar
    return false;
  }

  private async checkPermissions(
    userId: number,
    required: PermisoRequirement[],
    mode: 'all' | 'any',
  ): Promise<boolean> {
    const userPermClaves =
      await this.permisosService.getUserPermissions(userId);

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

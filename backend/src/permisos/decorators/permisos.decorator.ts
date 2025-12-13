import { SetMetadata, applyDecorators } from '@nestjs/common';

export type PermisoRequirement = string | { recurso: string; accion?: string };
export type PermisosOptions = { mode?: 'all' | 'any' };

export function Permisos(...args: Array<PermisoRequirement | PermisosOptions>) {
  let mode: 'all' | 'any' = 'all';
  const last = args[args.length - 1];
  const requirements: PermisoRequirement[] = [...(args as PermisoRequirement[])];
  if (typeof last === 'object' && last && 'mode' in (last as any)) {
    mode = (last as PermisosOptions).mode ?? 'all';
    requirements.pop();
  }
  return applyDecorators(
    SetMetadata('permisos', requirements),
    SetMetadata('permisos_mode', mode),
  );
}
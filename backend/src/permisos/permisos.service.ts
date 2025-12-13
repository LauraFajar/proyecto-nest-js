import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permiso } from './entities/permiso.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Injectable()
export class PermisosService {
  constructor(
    @InjectRepository(Permiso)
    private readonly permisosRepo: Repository<Permiso>,
    @InjectRepository(Usuario)
    private readonly usuariosRepo: Repository<Usuario>,
  ) {}

  async createPermiso(data: {
    clave: string;
    recurso?: string;
    accion?: string;
    nombre_permiso: string;
    descripcion?: string;
    activo?: boolean;
  }) {
    const existing = await this.permisosRepo.findOne({
      where: { clave: data.clave },
    });
    if (existing) {
      return existing;
    }
    const recurso =
      data.recurso ??
      (data.clave.includes(':') ? data.clave.split(':')[0] : data.clave);
    const accion =
      data.accion ??
      (data.clave.includes(':') ? data.clave.split(':')[1] : data.clave);
    const permiso = this.permisosRepo.create({
      clave: data.clave,
      recurso,
      accion,
      nombre_permiso: data.nombre_permiso,
      descripcion: data.descripcion,
      activo: data.activo ?? true,
    });
    return this.permisosRepo.save(permiso);
  }

  async findAll(): Promise<Permiso[]> {
    return this.permisosRepo.find();
  }

  async findById(id_permiso: number): Promise<Permiso | null> {
    return this.permisosRepo.findOne({ where: { id_permiso } });
  }

  async assignToUser(id_usuario: number, id_permiso: number): Promise<Usuario> {
    const usuario = await this.usuariosRepo.findOne({
      where: { id_usuarios: id_usuario },
      relations: ['permisos'],
    });
    if (!usuario)
      throw new NotFoundException(`Usuario ${id_usuario} no encontrado`);
    const permiso = await this.findById(id_permiso);
    if (!permiso)
      throw new NotFoundException(`Permiso ${id_permiso} no encontrado`);

    const hasAlready = (usuario.permisos || []).some(
      (p) => p.id_permiso === id_permiso,
    );
    if (!hasAlready) {
      usuario.permisos = [...(usuario.permisos || []), permiso];
      await this.usuariosRepo.save(usuario);
    }
    return usuario;
  }

  async revokeFromUser(
    id_usuario: number,
    id_permiso: number,
  ): Promise<Usuario> {
    const usuario = await this.usuariosRepo.findOne({
      where: { id_usuarios: id_usuario },
      relations: ['permisos'],
    });
    if (!usuario)
      throw new NotFoundException(`Usuario ${id_usuario} no encontrado`);
    usuario.permisos = (usuario.permisos || []).filter(
      (p) => p.id_permiso !== id_permiso,
    );
    await this.usuariosRepo.save(usuario);
    return usuario;
  }

  async getUserPermissions(id_usuario: number): Promise<string[]> {
    const usuario = await this.usuariosRepo.findOne({
      where: { id_usuarios: id_usuario },
      relations: ['permisos'],
    });
    return (usuario?.permisos || [])
      .filter((p) => p.activo)
      .map((p) => p.clave);
  }

  async hasUserPermissions(
    id_usuario: number,
    required: string[],
    mode: 'all' | 'any' = 'all',
  ): Promise<boolean> {
    const perms = await this.getUserPermissions(id_usuario);
    if (mode === 'any') {
      return required.some((k) => perms.includes(k));
    }
    return required.every((k) => perms.includes(k));
  }
}

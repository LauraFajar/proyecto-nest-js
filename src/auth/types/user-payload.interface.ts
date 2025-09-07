export interface UserPayload {
  id_usuarios: number;
  numero_documento: string;
  email?: string;
  nombres?: string;
  tipo_documento?: string;
  id_rol: {
    id_rol: number;
    nombre_rol: string;
    id_tipo_rol: {
      id_tipo_rol: number;
      nombre_tipo_rol?: string;
    };
  };
  [key: string]: any;
}

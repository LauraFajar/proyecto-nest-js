import { IsString, Length, IsIn, IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';

export class CreateSensoreDto {
  @IsString()
  @Length(1, 20)
  tipo_sensor: string;

  @IsIn(['Activo', 'Inactivo'])
  estado: string;

  // MQTT Configuración (opcional)
  @IsOptional()
  @IsString()
  mqtt_host?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  mqtt_port?: number;

  @IsOptional()
  @IsString()
  mqtt_topic?: string;

  @IsOptional()
  @IsString()
  mqtt_username?: string;

  @IsOptional()
  @IsString()
  mqtt_password?: string;

  @IsOptional()
  @IsBoolean()
  mqtt_enabled?: boolean;

  @IsOptional()
  @IsString()
  mqtt_client_id?: string;

  // HTTPS Configuración (opcional)
  @IsOptional()
  @IsString()
  https_url?: string;

  @IsOptional()
  @IsString()
  https_method?: string;

  @IsOptional()
  @IsString()
  https_headers?: string;

  @IsOptional()
  @IsBoolean()
  https_enabled?: boolean;

  @IsOptional()
  @IsString()
  https_auth_token?: string;

}

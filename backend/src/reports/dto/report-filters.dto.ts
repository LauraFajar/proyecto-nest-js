import { IsDateString, IsNumber, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class ReportFiltersDto {
  @IsNumber()
  @Type(() => Number)
  cultivoId: number;

  @IsDateString()
  fechaInicio: string;

  @IsDateString()
  fechaFin: string;

  @IsArray()
  @IsOptional()
  metricas?: string[];

  @IsBoolean()
  @IsOptional()
  incluirActividades?: boolean;

  @IsBoolean()
  @IsOptional()
  incluirFinanzas?: boolean;

  @IsBoolean()
  @IsOptional()
  incluirInventario?: boolean;

  @IsBoolean()
  @IsOptional()
  incluirAlertas?: boolean;

  @IsBoolean()
  @IsOptional()
  incluirTrazabilidad?: boolean;
}

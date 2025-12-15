import { Cultivo } from '../../cultivos/entities/cultivo.entity';
import { Sublote } from '../../sublotes/entities/sublote.entity';
import { Actividad } from '../../actividades/entities/actividad.entity';
import { Inventario } from '../../inventario/entities/inventario.entity';

export interface MetricData {
  fecha: Date;
  valor: number;
  sensorId: string;
  sensorNombre: string;
  unidad: string;
  subgrupoId?: string;
  subgrupoNombre?: string;
}

export interface MetricSummary {
  promedio: number;
  maximo: number;
  minimo: number;
  desviacionEstandar: number;
  totalRegistros: number;
  alertas: number;
}

export interface ActividadReporte {
  id: string;
  tipo: string;
  fecha: Date;
  descripcion: string;
  responsable: string;
  estado: string;
  insumosUtilizados: Array<{
    insumo: string;
    cantidad: number;
    unidad: string;
    costo: number;
  }>;
  costoTotal: number;
}

export interface FinanzasReporte {
  costos: Array<{
    tipo: string;
    monto: number;
    fecha: Date;
    descripcion: string;
  }>;
  ingresos: Array<{
    concepto: string;
    monto: number;
    fecha: Date;
  }>;
  resumen: {
    costosTotales: number;
    ingresosTotales: number;
    margenBruto: number;
    margenNeto: number;
    roi: number;
  };
}

export interface InventarioReporte {
  insumos: Array<{
    id: string;
    nombre: string;
    cantidad: number;
    unidad: string;
    costoUnitario: number;
    costoTotal: number;
    proveedor: string;
  }>;
  resumen: {
    totalInsumos: number;
    valorTotal: number;
    insumosPorCategoria: Record<string, number>;
  };
}

export interface AlertaReporte {
  id: string;
  fecha: Date;
  tipo: 'advertencia' | 'peligro' | 'informativo';
  mensaje: string;
  sensorId?: string;
  sensorNombre?: string;
  actividadId?: string;
  actividadTipo?: string;
  resuelta: boolean;
}

export interface TrazabilidadReporte {
  cultivo: {
    id: number;
    nombre: string;
    tipo: string;
    fechaSiembra: Date | null;
    fechaCosechaEstimada: Date | null;
    estado: string;
    lote: string;
    observaciones: string;
    fechaCreacion: Date | null;
    actividades: Array<{
      fecha: Date;
      tipo: string;
      descripcion: string;
      estado: string;
    }>;
  } | null;
  mensaje: string;
}

export interface ReporteCultivo {
  // Metadatos
  fechaGeneracion: Date;
  periodo: {
    inicio: Date;
    fin: Date;
  };
  
  cultivo: Cultivo;
  sublotes: Sublote[];
  
  // Datos de sensores
  metricas: Record<string, {
    datos: MetricData[];
    resumen: MetricSummary;
    grafico?: any; 
  }>;
  
  actividades?: {
    lista: ActividadReporte[];
    resumen: {
      totalActividades: number;
      porTipo: Record<string, number>;
      costoTotal: number;
    };
  };
  
  finanzas?: FinanzasReporte;
  
  inventario?: InventarioReporte;
  
  alertas?: {
    lista: AlertaReporte[];
    resumen: {
      total: number;
      porTipo: Record<string, number>;
      noResueltas: number;
    };
  };
  
  trazabilidad?: TrazabilidadReporte;
  
  // Análisis y recomendaciones
  analisis?: {
    rendimiento: number; 
    salud: number; 
    recomendaciones: string[];
    puntosCriticos: Array<{
      tipo: 'alerta' | 'oportunidad' | 'riesgo';
      mensaje: string;
      accionRecomendada: string;
    }>;
  };
}

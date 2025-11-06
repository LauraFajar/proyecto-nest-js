import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertasService } from '../alertas.service';
import { SensoresService } from '../../sensores/sensores.service';
import { InventarioService } from '../../inventario/inventario.service';
import { ActividadesService } from '../../actividades/actividades.service';

@Injectable()
export class AlertSchedulerService {
  private readonly logger = new Logger(AlertSchedulerService.name);

  constructor(
    private readonly alertasService: AlertasService,
    private readonly sensoresService: SensoresService,
    private readonly inventarioService: InventarioService,
    private readonly actividadesService: ActividadesService,
  ) {}

  // Verificar sensores cada 15 minutos
  @Cron('0 */15 * * * *')
  async checkSensoresCriticos() {
    this.logger.log('🔍 Verificando sensores críticos...');
    
    try {
      const sensores = await this.sensoresService.findAll();
      
      for (const sensor of sensores) {
        if (sensor.estado !== 'activo') continue;

        // Obtener última lectura (simulada por ahora)
        const ultimaLectura = await this.getUltimaLecturaSensor(sensor.id_sensor);
        
        if (ultimaLectura && this.esCritico(ultimaLectura.valor, sensor)) {
          const mensaje = `Sensor ${sensor.tipo_sensor} (ID: ${sensor.id_sensor}) 
                        tiene valor crítico: ${ultimaLectura.valor}${ultimaLectura.unidad}. 
                        Rango permitido: ${sensor.valor_minimo} - ${sensor.valor_maximo}`;

          await this.alertasService.create({
            tipo_alerta: 'sensor_critico',
            titulo: `Alerta Sensor ${sensor.tipo_sensor}`,
            descripcion: mensaje,
            nivel_prioridad: 'alta',
            estado: 'pendiente',
            fecha_creacion: new Date(),
          });
          
          this.logger.warn(`🚨 Alerta de sensor: ${sensor.tipo_sensor} - Valor: ${ultimaLectura.valor}`);
        }
      }
    } catch (error) {
      this.logger.error('Error verificando sensores:', error);
    }
  }

  // Verificar stock bajo diariamente a las 8 AM
  @Cron('0 0 8 * * *')
  async checkStockBajo() {
    this.logger.log('📦 Verificando stock bajo...');
    
    try {
      const inventarioResp: any = await this.inventarioService.findAll();
      const inventarios = Array.isArray(inventarioResp) ? inventarioResp : (inventarioResp?.items || []);
      const itemsBajoStock = inventarios.filter((item: any) => item.cantidad_stock < 10);
      
      for (const item of itemsBajoStock) {
        await this.alertasService.notificarStockBajo(
          1, // Por ahora usuario admin
          item.insumo?.nombre_insumo || 'Insumo desconocido',
          item.cantidad_stock,
          10
        );
        
        this.logger.warn(`📦 Stock bajo: ${item.insumo?.nombre_insumo} - Cantidad: ${item.cantidad_stock}`);
      }
    } catch (error) {
      this.logger.error('Error verificando stock:', error);
    }
  }

  // Verificar actividades vencidas diariamente a las 9 AM
  @Cron('0 0 9 * * *')
  async checkActividadesVencidas() {
    this.logger.log('📅 Verificando actividades vencidas...');
    
    try {
      const hoy = new Date();
      const actividades = await this.actividadesService.findAllWithoutPagination();
      
      const actividadesVencidas = actividades.filter(actividad => {
        // Verificamos si la actividad está vencida comparando con la fecha de la actividad
        const fechaActividad = new Date(actividad.fecha);
        return fechaActividad < hoy && 
               actividad.estado !== 'completada' && 
               actividad.estado !== 'cancelada';
      });
      
      for (const actividad of actividadesVencidas) {
        // Convertir la fecha a string ISO para la notificación
        const fechaStr = new Date(actividad.fecha).toISOString().split('T')[0];
        
        await this.alertasService.notificarActividadVencida(
          1,
          actividad.tipo_actividad,
          fechaStr
        );
        
        this.logger.warn(`📅 Actividad vencida: ${actividad.tipo_actividad} - Fecha: ${fechaStr}`);
        
        // Actualizar el estado de la actividad a 'vencida' usando el DTO de actualización
        try {
          await this.actividadesService.update(actividad.id_actividad, {
            estado: 'vencida',
            tipo_actividad: actividad.tipo_actividad,
            responsable: actividad.responsable,
            detalles: actividad.detalles,
            id_cultivo: actividad.id_cultivo
          } as any);
        } catch (updateError) {
          this.logger.error('Error actualizando estado de actividad vencida:', updateError);
        }
      }
    } catch (error) {
      this.logger.error('Error verificando actividades:', error);
    }
  }

  // Resumen diario a las 6 PM
  @Cron('0 0 18 * * *')
  async enviarResumenDiario() {
    this.logger.log('📊 Generando resumen diario...');
    
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const alertasHoy = await this.alertasService.findAll();
      const alertasDelDia = alertasHoy.filter(alerta => alerta.fecha === hoy);
      
      if (alertasDelDia.length > 0) {
        this.logger.log(`📊 Resumen: ${alertasDelDia.length} alertas generadas hoy`);
      }
    } catch (error) {
      this.logger.error('Error generando resumen:', error);
    }
  }

  private async getUltimaLecturaSensor(id_sensor: number) {
    const valorSimulado = Math.random() * 100;
    
    return {
      valor: valorSimulado,
      fecha: new Date(),
      unidad: '%'
    };
  }

  private esCritico(valor: number, sensor: any): boolean {
    if (sensor.valor_minimo && valor < sensor.valor_minimo) {
      return true;
    }
    
    if (sensor.valor_maximo && valor > sensor.valor_maximo) {
      return true;
    }
    
    return false;
  }

  async testAlerts() {
    this.logger.log('🧪 Ejecutando prueba de alertas...');
    
    await this.checkSensoresCriticos();
    await this.checkStockBajo();
    await this.checkActividadesVencidas();
    
    this.logger.log('✅ Prueba de alertas completada');
  }
}

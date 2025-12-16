import api from './api';

const reportService = {
  async generateReport(reportData, format = 'pdf') {
    const endpoint = format === 'excel' 
      ? '/api/reportes/exportar/excel' 
      : '/api/reportes/exportar/pdf';

    try {
      const cleanData = {
        ...reportData,
        incluirActividades: Boolean(reportData.incluirActividades),
        incluirFinanzas: Boolean(reportData.incluirFinanzas),
        incluirInventario: Boolean(reportData.incluirInventario),
        incluirAlertas: Boolean(reportData.incluirAlertas),
        incluirTrazabilidad: Boolean(reportData.incluirTrazabilidad)
      };

      console.log('Sending data to API:', cleanData);

      const response = await api.post(endpoint, cleanData, {
        responseType: 'blob',
        timeout: 30000
      });
      return response;
    } catch (error) {
      console.error('Error al generar el reporte:', error);
      throw error;
    }
  },

  async getFilterOptions() {
    try {
      const response = await api.get('/api/reportes/opciones-filtros');
      return response.data;
    } catch (error) {
      console.error('Error al obtener opciones de filtros:', error);
      throw error;
    }
  }
};

export default reportService;

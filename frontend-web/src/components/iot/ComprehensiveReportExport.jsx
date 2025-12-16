import React, { useState, useEffect } from 'react';
import {
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Switch,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  Chip
} from '@mui/material';
import {
  Assessment,
  Description,
  TableChart
} from '@mui/icons-material';
import reportService from '../../services/reportService';
import cropService from '../../services/cropService';
import sensoresService from '../../services/sensoresService';

const ComprehensiveReportExport = () => { 
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cultivos, setCultivos] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [formData, setFormData] = useState({
    cultivoId: '',
    metricaSensor: 'temperatura',
    fechaInicio: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0],
    formato: 'pdf',
    incluirActividades: true,
    incluirFinanzas: true,
    incluirInventario: true,
    incluirAlertas: true,
    incluirTrazabilidad: true,
    metricasSeleccionadas: ['temperatura', 'humedad_aire', 'humedad_suelo_adc']
  });

  const showError = (message) => {
    setSnackbar({
      open: true,
      message,
      severity: 'error'
    });
  };

  const showSuccess = (message) => {
    setSnackbar({
      open: true,
      message,
      severity: 'success'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  useEffect(() => {
    const fetchCultivos = async () => {
      try {
        const response = await cropService.getCrops(1, 100);
        setCultivos(response.items || []);
      } catch (error) {
        console.error('Error fetching cultivos:', error);
        showError('Error al cargar los cultivos');
      }
    };
    fetchCultivos();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => !isLoading && setOpen(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.cultivoId) {
      showError('Por favor selecciona un cultivo');
      return;
    }

    setIsLoading(true);
    try {
      const fechaInicio = new Date(formData.fechaInicio).toISOString();
      const fechaFin = new Date(formData.fechaFin).toISOString();
      const reportData = {
        cultivoId: Number(formData.cultivoId),
        fechaInicio,
        fechaFin,
        incluirActividades: formData.incluirActividades,
        incluirFinanzas: formData.incluirFinanzas,
        incluirInventario: formData.incluirInventario,
        incluirAlertas: formData.incluirAlertas,
        incluirTrazabilidad: formData.incluirTrazabilidad,
        metricas: [formData.metricaSensor]
      };
      const response = await reportService.generateReport(reportData, formData.formato);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte-cultivo-${new Date().toISOString().split('T')[0]}.${formData.formato}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      showSuccess('Reporte generado exitosamente');
      handleClose();
    } catch (error) {
      let errorMessage = 'Error al generar el reporte';
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) errorMessage = error.response.data.message.join(', ');
        else errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        size="small"
        startIcon={<Assessment />}
        onClick={handleOpen}
        sx={{ 
          minWidth: 'auto', 
          px: 1.5,
          py: 0.5,
          fontSize: '0.875rem'
        }}
      >
        Generar Reporte
      </Button>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Generar Reporte Completo</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="cultivo-label">Cultivo</InputLabel>
              <Select
                labelId="cultivo-label"
                name="cultivoId"
                value={formData.cultivoId}
                onChange={handleChange}
                disabled={isLoading}
                label="Cultivo"
              >
                {cultivos.map((cultivo) => (
                  <MenuItem key={cultivo.id} value={cultivo.id}>
                    {cultivo.nombre || cultivo.nombre_cultivo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="metrica-sensor-label">Métrica de Sensor</InputLabel>
              <Select
                labelId="metrica-sensor-label"
                name="metricaSensor"
                value={formData.metricaSensor}
                onChange={handleChange}
                disabled={isLoading}
                label="Métrica de Sensor"
              >
                <MenuItem value="todas">Todas las métricas</MenuItem>
                <MenuItem value="temperatura">Temperatura</MenuItem>
                <MenuItem value="humedad_aire">Humedad Ambiente</MenuItem>
                <MenuItem value="humedad_suelo_porcentaje">Humedad Suelo</MenuItem>
                <MenuItem value="bomba_estado">Bomba (Activaciones)</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Fecha de inicio"
                type="date"
                name="fechaInicio"
                value={formData.fechaInicio}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                disabled={isLoading}
              />
              <TextField
                fullWidth
                label="Fecha de fin"
                type="date"
                name="fechaFin"
                value={formData.fechaFin}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                disabled={isLoading}
              />
            </Box>

            <FormControl fullWidth>
              <InputLabel id="formato-label">Formato</InputLabel>
              <Select
                labelId="formato-label"
                name="formato"
                value={formData.formato}
                onChange={handleChange}
                disabled={isLoading}
                label="Formato"
              >
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="excel">Excel</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="subtitle1" sx={{ mt: 2 }}>
              Opciones del reporte:
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.incluirActividades}
                  onChange={handleChange}
                  name="incluirActividades"
                  disabled={isLoading}
                />
              }
              label="Incluir actividades"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.incluirFinanzas}
                  onChange={handleChange}
                  name="incluirFinanzas"
                  disabled={isLoading}
                />
              }
              label="Incluir información financiera"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.incluirInventario}
                  onChange={handleChange}
                  name="incluirInventario"
                  disabled={isLoading}
                />
              }
              label="Incluir inventario"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.incluirAlertas}
                  onChange={handleChange}
                  name="incluirAlertas"
                  disabled={isLoading}
                />
              }
              label="Incluir alertas"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.incluirTrazabilidad}
                  onChange={handleChange}
                  name="incluirTrazabilidad"
                  disabled={isLoading}
                />
              }
              label="Incluir trazabilidad"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            color="primary"
            variant="contained"
            disabled={isLoading || !formData.cultivoId}
            startIcon={isLoading ? <CircularProgress size={20} /> : 
                     formData.formato === 'pdf' ? <Description /> : <TableChart />}
          >
            {isLoading ? 'Generando...' : 'Generar Reporte'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ComprehensiveReportExport;

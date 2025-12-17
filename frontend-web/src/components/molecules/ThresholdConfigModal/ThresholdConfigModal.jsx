import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  Button
} from '@mui/material';
import { Settings, Save, Cancel } from '@mui/icons-material';
import './ThresholdConfigModal.css';

const ThresholdConfigModal = ({ 
  open, 
  onClose, 
  onSave,
  currentThresholds = {
    temperatura: { min: 15, max: 35, enabled: true },
    humedad_aire: { min: 30, max: 80, enabled: true },
    humedad_suelo: { min: 20, max: 60, enabled: true }
  }
}) => {
  const [thresholds, setThresholds] = useState(currentThresholds);
  const [loading, setLoading] = useState(false);

  const handleThresholdChange = (sensor, field) => (event) => {
    const value = field === 'enabled' ? event.target.checked : Number(event.target.value);
    setThresholds(prev => ({
      ...prev,
      [sensor]: {
        ...prev[sensor],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(thresholds);
      onClose();
    } catch (error) {
      console.error('Error saving thresholds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setThresholds(currentThresholds);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Configurar Umbrales de Sensores</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary" className="modal-subtitle">
            Configura los umbrales mínimos y máximos para generar alertas cuando los valores de los sensores estén fuera de rango.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ border: 1, borderColor: 'grey.300', borderRadius: 2, p: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={thresholds.temperatura.enabled}
                    onChange={handleThresholdChange('temperatura', 'enabled')}
                    disabled={loading}
                  />
                }
                label="Temperatura"
                sx={{ mb: 1 }}
              />
              {thresholds.temperatura.enabled && (
                <Box sx={{ display: 'flex', gap: 2, ml: 4 }}>
                  <TextField
                    label="Mínimo (°C)"
                    type="number"
                    value={thresholds.temperatura.min}
                    onChange={handleThresholdChange('temperatura', 'min')}
                    disabled={loading}
                    size="small"
                    sx={{ width: 120 }}
                  />
                  <TextField
                    label="Máximo (°C)"
                    type="number"
                    value={thresholds.temperatura.max}
                    onChange={handleThresholdChange('temperatura', 'max')}
                    disabled={loading}
                    size="small"
                    sx={{ width: 120 }}
                  />
                </Box>
              )}
            </Box>

            <Box sx={{ border: 1, borderColor: 'grey.300', borderRadius: 2, p: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={thresholds.humedad_aire.enabled}
                    onChange={handleThresholdChange('humedad_aire', 'enabled')}
                    disabled={loading}
                  />
                }
                label="Humedad del Aire"
                sx={{ mb: 1 }}
              />
              {thresholds.humedad_aire.enabled && (
                <Box sx={{ display: 'flex', gap: 2, ml: 4 }}>
                  <TextField
                    label="Mínimo (%)"
                    type="number"
                    value={thresholds.humedad_aire.min}
                    onChange={handleThresholdChange('humedad_aire', 'min')}
                    disabled={loading}
                    size="small"
                    sx={{ width: 120 }}
                  />
                  <TextField
                    label="Máximo (%)"
                    type="number"
                    value={thresholds.humedad_aire.max}
                    onChange={handleThresholdChange('humedad_aire', 'max')}
                    disabled={loading}
                    size="small"
                    sx={{ width: 120 }}
                  />
                </Box>
              )}
            </Box>

            <Box sx={{ border: 1, borderColor: 'grey.300', borderRadius: 2, p: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={thresholds.humedad_suelo.enabled}
                    onChange={handleThresholdChange('humedad_suelo', 'enabled')}
                    disabled={loading}
                  />
                }
                label="Humedad del Suelo"
                sx={{ mb: 1 }}
              />
              {thresholds.humedad_suelo.enabled && (
                <Box sx={{ display: 'flex', gap: 2, ml: 4 }}>
                  <TextField
                    label="Mínimo (%)"
                    type="number"
                    value={thresholds.humedad_suelo.min}
                    onChange={handleThresholdChange('humedad_suelo', 'min')}
                    disabled={loading}
                    size="small"
                    sx={{ width: 120 }}
                  />
                  <TextField
                    label="Máximo (%)"
                    type="number"
                    value={thresholds.humedad_suelo.max}
                    onChange={handleThresholdChange('humedad_suelo', 'max')}
                    disabled={loading}
                    size="small"
                    sx={{ width: 120 }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          startIcon={<Cancel />}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          variant="contained"
          disabled={loading}
          startIcon={loading ? undefined : <Save />}
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ThresholdConfigModal;

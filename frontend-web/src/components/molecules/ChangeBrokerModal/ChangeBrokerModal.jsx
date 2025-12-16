import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Box, 
  Typography, 
  TextField, 
  Button,
  DialogActions,
  Alert,
  Stack
} from '@mui/material';
import { Settings, Save, Cancel } from '@mui/icons-material';
import './ChangeBrokerModal.css';

const ChangeBrokerModal = ({ 
  open, 
  onClose, 
  onSave, 
  currentBroker = 'wss://broker.hivemq.com/mqtt',
  currentPort = '8884',
  currentTopic = 'luixxa/dht11'
}) => {
  const [formData, setFormData] = useState({
    brokerUrl: '',
    port: '',
    topic: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setFormData({
        brokerUrl: currentBroker,
        port: currentPort,
        topic: currentTopic
      });
      setErrors({});
    }
  }, [open, currentBroker, currentPort, currentTopic]);

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.brokerUrl.trim()) {
      newErrors.brokerUrl = 'La URL del broker es requerida';
    } else if (!formData.brokerUrl.startsWith('mqtt://') && !formData.brokerUrl.startsWith('ws://') && !formData.brokerUrl.startsWith('wss://')) {
      newErrors.brokerUrl = 'La URL debe comenzar con mqtt://, ws:// o wss://';
    }

    if (!formData.port) {
      newErrors.port = 'El puerto es requerido';
    } else if (isNaN(formData.port)) {
      newErrors.port = 'El puerto debe ser un número';
    }

    if (!formData.topic.trim()) {
      newErrors.topic = 'El topic es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSave({
        brokerUrl: formData.brokerUrl.trim(),
        port: formData.port.toString().trim(),
        topic: formData.topic.trim()
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving broker configuration:', error);
      setErrors({ submit: 'Error al guardar la configuración. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        brokerUrl: currentBroker,
        port: currentPort,
        topic: currentTopic
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="change-broker-modal"
      aria-describedby="change-broker-modal-description"
      className="change-broker-modal-backdrop"
    >
      <Box
        className="change-broker-modal"
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 500,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
        }}
      >
        <Box className="modal-header">
          <Settings sx={{ mr: 2, color: '#1976d2', fontSize: '1.5rem' }} />
          <Typography id="change-broker-modal" variant="h5" component="h2" className="modal-title">
            Cambiar Configuración MQTT
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" className="modal-subtitle">
          Modifica la configuración del broker MQTT y el topic para cambiar la fuente de datos de los sensores.
        </Typography>

        <Box className="modal-form-field">
          <TextField
            label="URL del Broker"
            value={formData.brokerUrl}
            onChange={handleInputChange('brokerUrl')}
            error={!!errors.brokerUrl}
            helperText={errors.brokerUrl || 'Ej: mqtt://broker.hivemq.com o ws://broker.hivemq.com/mqtt'}
            fullWidth
            required
            disabled={loading}
            placeholder="wss://broker.hivemq.com/mqtt"
          />
        </Box>

        <Box className="modal-form-field">
          <TextField
            label="Puerto"
            value={formData.port}
            onChange={handleInputChange('port')}
            error={!!errors.port}
            helperText={errors.port || 'Ej: 1883, 8884'}
            fullWidth
            required
            disabled={loading}
            placeholder="8884"
            type="number"
          />
        </Box>

        <Box className="modal-form-field">
          <TextField
            label="Topic MQTT"
            value={formData.topic}
            onChange={handleInputChange('topic')}
            error={!!errors.topic}
            helperText={errors.topic || 'Topic MQTT del sensor (ej: luixxa/dht11)'}
            fullWidth
            required
            disabled={loading}
            placeholder="luixxa/dht11"
          />
        </Box>

        <Alert severity="info" className="current-config-alert">
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            Configuración actual:
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            <Typography variant="caption" className="config-item">
              <span className="config-label">Broker:</span> {currentBroker}
            </Typography>
            <Typography variant="caption" className="config-item">
              <span className="config-label">Puerto:</span> {currentPort}
            </Typography>
            <Typography variant="caption" className="config-item">
              <span className="config-label">Topic:</span> {currentTopic}
            </Typography>
          </Stack>
        </Alert>

        {errors.submit && (
          <Typography variant="caption" color="error" sx={{ mt: 2, display: 'block' }}>
            {errors.submit}
          </Typography>
        )}

        <DialogActions className="modal-actions">
          <Button 
            onClick={handleClose} 
            disabled={loading}
            startIcon={<Cancel />}
            className="btn-cancel"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant="contained"
            className="btn-save"
            startIcon={loading ? undefined : <Save />}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Box>
    </Modal>
  );
};

export default ChangeBrokerModal;
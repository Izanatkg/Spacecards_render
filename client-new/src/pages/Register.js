import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Paper,
    Snackbar,
    Alert,
    Link
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import config from '../config/config';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [customerCode, setCustomerCode] = useState(null);
    const [walletUrl, setWalletUrl] = useState(null);
    const [points, setPoints] = useState(null);
    const [ws, setWs] = useState(null);
    const [showSnackbar, setShowSnackbar] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleReset = () => {
        if (ws) {
            ws.close();
            setWs(null);
        }

        setCustomerCode(null);
        setWalletUrl(null);
        setPoints(null);
        setSuccess(false);
        setError(null);
        setShowSnackbar(false);
        
        setFormData({
            name: '',
            email: '',
            phone: ''
        });
    };

    const onSubmit = async (data) => {
        setLoading(true);
        setError(null);
        console.log('Submitting registration data:', data);

        try {
            const response = await axios.post(`${config.API_URL}/api/register`, data);
            console.log('Registration successful:', response.data);
            
            if (response.data.success) {
                // Verificar que tenemos la URL de Google Wallet
                if (!response.data.walletUrl) {
                    throw new Error('No se pudo generar la tarjeta de lealtad. Por favor, intente nuevamente.');
                }

                const { code, points: initialPoints } = response.data.customer;
                
                // Actualizar estados
                setCustomerCode(code);
                setPoints(initialPoints || 0);
                setWalletUrl(response.data.walletUrl);
                setSuccess(true);
                setShowSnackbar(true);
                
                // Iniciar conexión WebSocket después de actualizar estados
                setTimeout(() => connectWebSocket(code), 100);
            } else {
                throw new Error('Error en el registro. Por favor, intente nuevamente.');
            }
        } catch (error) {
            console.error('Error during registration:', error);
            setError(error.message || 'Error al registrar. Por favor intenta de nuevo.');
            setSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const connectWebSocket = (code) => {
        if (!code) return;
        
        // Cerrar WebSocket existente si hay uno
        if (ws) {
            ws.close();
        }

        const socket = new WebSocket(config.WS_URL);

        socket.onopen = () => {
            console.log('WebSocket connected');
            socket.send(JSON.stringify({
                type: 'register',
                customerCode: code
            }));
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'points_update') {
                    setPoints(data.points);
                    setShowSnackbar(true);
                }
            } catch (error) {
                console.error('Error processing WebSocket message:', error);
            }
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        socket.onclose = () => {
            console.log('WebSocket connection closed');
            setTimeout(() => connectWebSocket(code), 5000);
        };

        setWs(socket);
    };

    useEffect(() => {
        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, [ws]);

    if (success && customerCode) {
        return (
            <Container maxWidth="sm">
                <Paper elevation={3} sx={{ p: 4, mt: 4, textAlign: 'center' }}>
                    <Typography variant="h5" gutterBottom>
                        ¡Registro Exitoso!
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        Tu código de cliente es:
                    </Typography>
                    <Box sx={{ my: 2 }}>
                        <QRCodeSVG value={customerCode} size={200} />
                    </Box>
                    <Typography variant="h6" gutterBottom>
                        {customerCode}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        Puntos actuales: {points || 0}
                    </Typography>
                    {walletUrl && (
                        <Button
                            variant="contained"
                            color="primary"
                            href={walletUrl}
                            target="_blank"
                            sx={{ mt: 2 }}
                        >
                            Añadir a Google Wallet
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleReset}
                        sx={{ mt: 2, ml: walletUrl ? 2 : 0 }}
                    >
                        Registrar otro cliente
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="md">
            <Paper 
                elevation={3} 
                sx={{ 
                    p: 0, 
                    mt: 4,
                    borderRadius: 4,
                    overflow: 'hidden',
                    bgcolor: '#1a1f2e',
                    color: 'white',
                    display: 'flex'
                }}
            >
                {/* Lado izquierdo - Logo */}
                <Box sx={{ 
                    p: 4, 
                    bgcolor: '#141821',
                    width: '40%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Box 
                        sx={{ 
                            width: 120,
                            height: 120,
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Box
                            component="img"
                            src="/astronaut-icon.png"
                            alt="Stellar Cadet"
                            sx={{ 
                                width: '100%',
                                height: '100%',
                                filter: 'brightness(0.9) sepia(0.2) opacity(0.9)'
                            }}
                        />
                    </Box>
                    <Typography 
                        variant="h4" 
                        sx={{ 
                            color: '#f0f0f0',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            letterSpacing: 1
                        }}
                    >
                        Stellar<br/>Cadet
                    </Typography>
                </Box>

                {/* Lado derecho - Formulario */}
                <Box sx={{ p: 4, width: '60%' }}>
                    <Typography 
                        variant="h4" 
                        sx={{ 
                            mb: 1,
                            background: 'linear-gradient(45deg, #9c27b0, #7986cb)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        Nivel Stellar Cadet
                    </Typography>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            mb: 3,
                            color: '#64b5f6'
                        }}
                    >
                        El Inicio de tu Viaje
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            required
                            label="Nombre completo"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            margin="normal"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: '#404759' },
                                    '&:hover fieldset': { borderColor: '#4a5568' },
                                    '&.Mui-focused fieldset': { borderColor: '#7986cb' }
                                },
                                '& .MuiInputLabel-root': { color: '#b0b8c8' },
                                '& .MuiOutlinedInput-input': { color: '#ffffff' }
                            }}
                        />
                        <TextField
                            fullWidth
                            required
                            label="Correo electrónico"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            margin="normal"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: '#404759' },
                                    '&:hover fieldset': { borderColor: '#4a5568' },
                                    '&.Mui-focused fieldset': { borderColor: '#7986cb' }
                                },
                                '& .MuiInputLabel-root': { color: '#b0b8c8' },
                                '& .MuiOutlinedInput-input': { color: '#ffffff' }
                            }}
                        />
                        <TextField
                            fullWidth
                            required
                            label="Teléfono"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            margin="normal"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: '#404759' },
                                    '&:hover fieldset': { borderColor: '#4a5568' },
                                    '&.Mui-focused fieldset': { borderColor: '#7986cb' }
                                },
                                '& .MuiInputLabel-root': { color: '#b0b8c8' },
                                '& .MuiOutlinedInput-input': { color: '#ffffff' }
                            }}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{ 
                                mt: 3,
                                py: 1.5,
                                background: 'linear-gradient(45deg, #7e57c2, #5c6bc0)',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #9575cd, #7986cb)'
                                },
                                textTransform: 'none',
                                fontSize: '1.1rem'
                            }}
                        >
                            {loading ? 'Registrando...' : 'Registrar'}
                        </Button>
                    </form>
                </Box>
            </Paper>
            <Snackbar
                open={showSnackbar}
                autoHideDuration={6000}
                onClose={() => setShowSnackbar(false)}
            >
                <Alert
                    onClose={() => setShowSnackbar(false)}
                    severity={error ? 'error' : 'success'}
                >
                    {error || '¡Registro exitoso!'}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default Register;

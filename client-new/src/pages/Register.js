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

    // Función para conectar WebSocket
    const connectWebSocket = (code) => {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}`;
        const newWs = new WebSocket(wsUrl);

        newWs.onopen = () => {
            console.log('WebSocket connected');
            // Registrar para actualizaciones de puntos
            newWs.send(JSON.stringify({
                type: 'register',
                customerCode: code
            }));
        };

        newWs.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'points_update') {
                    console.log('Received points update:', data.points);
                    setPoints(data.points);
                }
            } catch (error) {
                console.error('Error processing WebSocket message:', error);
            }
        };

        newWs.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        newWs.onclose = () => {
            console.log('WebSocket disconnected');
            // Intentar reconectar después de 5 segundos
            setTimeout(() => connectWebSocket(code), 5000);
        };

        setWs(newWs);
    };

    // Limpiar WebSocket al desmontar
    useEffect(() => {
        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, [ws]);

    const onSubmit = async (data) => {
        setLoading(true);
        setError(null);
        console.log('Submitting registration data:', data);

        try {
            const response = await axios.post('/api/register', data);
            console.log('Registration successful:', response.data);
            
            if (response.data.success) {
                setSuccess(true);
                const code = response.data.customer.customer_code;
                setCustomerCode(code);
                setWalletUrl(response.data.walletUrl);
                setPoints(response.data.customer.total_points);
                // Iniciar conexión WebSocket
                connectWebSocket(code);
                setShowSnackbar(true);
            }
        } catch (error) {
            console.error('Error during registration:', error);
            setError('Error al registrar. Por favor intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        if (ws) {
            ws.close();
        }
        setCustomerCode(null);
        setWalletUrl(null);
        setPoints(null);
        setSuccess(false);
        setFormData({
            name: '',
            email: '',
            phone: ''
        });
    };

    return (
        <Container component="main" maxWidth="sm">
            <Paper 
                elevation={3} 
                sx={{ 
                    p: 4, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    mt: 4
                }}
            >
                <Snackbar 
                    open={showSnackbar} 
                    autoHideDuration={6000} 
                    onClose={() => setShowSnackbar(false)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert 
                        onClose={() => setShowSnackbar(false)} 
                        severity="success" 
                        sx={{ width: '100%' }}
                    >
                        ¡Registro exitoso!
                    </Alert>
                </Snackbar>

                {error && (
                    <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {!success ? (
                    <Box component="form" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} sx={{ mt: 3 }}>
                        <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#1a237e', fontWeight: 'bold', mb: 3 }}>
                            Registro de Entrenador
                        </Typography>

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="name"
                            label="Nombre completo"
                            name="name"
                            autoComplete="name"
                            autoFocus
                            value={formData.name}
                            onChange={handleChange}
                            disabled={loading}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Correo electrónico"
                            name="email"
                            autoComplete="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={loading}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="phone"
                            label="Teléfono"
                            name="phone"
                            autoComplete="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={loading}
                            sx={{ mb: 3 }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{
                                mt: 3,
                                mb: 2,
                                backgroundColor: '#1a237e',
                                '&:hover': {
                                    backgroundColor: '#0d47a1'
                                }
                            }}
                        >
                            {loading ? 'Registrando...' : 'Registrar'}
                        </Button>
                    </Box>
                ) : (
                    <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {customerCode && (
                            <Box sx={{ mt: 3, textAlign: 'center' }}>
                                <Typography variant="h6" gutterBottom>
                                    ID de Entrenador: {customerCode}
                                </Typography>

                                {points !== null && (
                                    <Typography variant="h6" gutterBottom sx={{ color: '#4caf50' }}>
                                        Puntos actuales: {points}
                                    </Typography>
                                )}

                                <Box sx={{ mt: 2, mb: 4 }}>
                                    <QRCodeSVG 
                                        value={customerCode}
                                        size={200}
                                        level="H"
                                        includeMargin={true}
                                    />
                                </Box>

                                {walletUrl && (
                                    <Box sx={{ mt: 2, mb: 2 }}>
                                        <Button
                                            component="a"
                                            href={walletUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            variant="contained"
                                            color="primary"
                                            sx={{
                                                backgroundColor: '#4285f4',
                                                '&:hover': {
                                                    backgroundColor: '#3367d6'
                                                }
                                            }}
                                        >
                                            Agregar a Google Wallet
                                        </Button>
                                    </Box>
                                )}

                                <Button
                                    onClick={handleReset}
                                    variant="outlined"
                                    sx={{ mt: 2 }}
                                >
                                    Registrar otro entrenador
                                </Button>
                            </Box>
                        )}
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default Register;

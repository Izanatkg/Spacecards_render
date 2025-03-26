import React, { useState } from 'react';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    CircularProgress,
    Alert,
    Snackbar,
    Link
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Register = () => {
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [registrationData, setRegistrationData] = useState(null);
    const [showSnackbar, setShowSnackbar] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            console.log('Submitting registration data:', formData);
            const response = await register(formData.name, formData.email, formData.phone);
            console.log('Registration response:', response);
            
            if (response) {
                setRegistrationData({
                    customer_code: response.customer_code,
                    qrCode: response.qrCode,
                    walletUrl: response.walletUrl
                });
                setSuccess(true);
                setShowSnackbar(true);
            } else {
                setError('Error en el registro');
            }
        } catch (error) {
            console.error('Error during registration:', error);
            setError(error.response?.data?.message || 'Error en el registro');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setRegistrationData(null);
        setFormData({
            name: '',
            email: '',
            phone: ''
        });
        setError('');
        setSuccess(false);
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #4a90e2 0%, #357abd 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 4
            }}
        >
            <Container maxWidth="sm">
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography 
                        variant="h3" 
                        component="h1" 
                        sx={{ 
                            color: 'white',
                            fontWeight: 'bold',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                            mb: 2
                        }}
                    >
                        PokéPuntos
                    </Typography>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            color: 'white',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                        }}
                    >
                        ¡Colecciona, gana y canjea PokéPuntos por cartas Pokémon exclusivas!
                    </Typography>
                </Box>

                <Paper 
                    elevation={3} 
                    sx={{ 
                        p: 4, 
                        borderRadius: 2,
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <Box
                        component="img"
                        src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png"
                        sx={{
                            position: 'absolute',
                            right: -50,
                            top: -50,
                            width: 200,
                            height: 200,
                            opacity: 0.1,
                            transform: 'rotate(15deg)'
                        }}
                    />

                    {!success ? (
                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                            <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#1a237e', fontWeight: 'bold', mb: 3 }}>
                                Registro de Entrenador
                            </Typography>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="name"
                                label="Nombre Completo"
                                name="name"
                                autoComplete="name"
                                value={formData.name}
                                onChange={handleChange}
                                autoFocus
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                label="Correo Electrónico"
                                name="email"
                                autoComplete="email"
                                value={formData.email}
                                onChange={handleChange}
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
                                inputProps={{ pattern: "[0-9]{10}" }}
                                helperText="10 dígitos"
                            />
                            {error && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {error}
                                </Alert>
                            )}
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ 
                                    mt: 3,
                                    background: 'linear-gradient(45deg, #4a90e2 30%, #357abd 90%)',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '1.1rem',
                                    py: 1.5,
                                    '&:hover': {
                                        background: 'linear-gradient(45deg, #357abd 30%, #2c6aa1 90%)',
                                    }
                                }}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} /> : '¡Comenzar Aventura!'}
                            </Button>
                        </Box>
                    ) : (
                        <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {registrationData && (
                                <Box sx={{ mt: 3, textAlign: 'center' }}>
                                    <Typography variant="h6">
                                        ID de Entrenador: {registrationData.customer_code}
                                    </Typography>
                                    {registrationData.qrCode && (
                                        <Box sx={{ mt: 2, mb: 2 }}>
                                            <img src={registrationData.qrCode} alt="QR Code" style={{ maxWidth: '200px' }} />
                                        </Box>
                                    )}
                                    {registrationData.walletUrl && (
                                        <Box sx={{ mt: 2, mb: 2 }}>
                                            <Button
                                                component="a"
                                                href={registrationData.walletUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                variant="contained"
                                                sx={{ 
                                                    backgroundColor: '#000000',
                                                    '&:hover': {
                                                        backgroundColor: '#333333'
                                                    }
                                                }}
                                                startIcon={
                                                    <img 
                                                        src="https://fonts.gstatic.com/s/i/productlogos/wallet/v8/192px.svg"
                                                        alt=""
                                                        style={{ height: '24px' }}
                                                    />
                                                }
                                            >
                                                Agregar a Google Wallet
                                            </Button>
                                        </Box>
                                    )}
                                    <Box sx={{ mt: 2 }}>
                                        <Button
                                            variant="outlined"
                                            onClick={handleReset}
                                        >
                                            Registrar otro entrenador
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    )}
                </Paper>
            </Container>
            <Snackbar
                open={showSnackbar}
                autoHideDuration={6000}
                onClose={() => setShowSnackbar(false)}
                message="¡Registro exitoso!"
            />
        </Box>
    );
};

export default Register;

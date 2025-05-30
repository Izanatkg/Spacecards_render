import React, { useState } from 'react';
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Paper,
    Snackbar,
    Alert,
    CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config/config';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSnackbar, setShowSnackbar] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(`${config.API_URL}/api/login`, formData);
            
            if (response.data.success) {
                // Guardar datos del cliente en localStorage
                localStorage.setItem('customerData', JSON.stringify(response.data.customer));
                
                // Redirigir al dashboard
                navigate('/dashboard');
            } else {
                throw new Error(response.data.message || 'Error al iniciar sesión');
            }
        } catch (error) {
            console.error('Error durante el inicio de sesión:', error);
            setError(error.response?.data?.message || error.message || 'Error al iniciar sesión. Por favor, verifica tus datos.');
            setShowSnackbar(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
            <Paper 
                elevation={3} 
                sx={{ 
                    p: 4, 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    bgcolor: '#1a1f2e',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                }}
            >
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <Typography 
                        variant="h4" 
                        component="h1" 
                        gutterBottom
                        sx={{ 
                            fontWeight: 'bold',
                            background: 'linear-gradient(45deg, #7e57c2, #5c6bc0)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        Acceso Espacial
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#b0b8c8', mb: 2 }}>
                        Ingresa a tu cuenta para ver tu progreso estelar
                    </Typography>
                </Box>

                <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
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
                        {loading ? (
                            <CircularProgress size={24} color="inherit" />
                        ) : (
                            'Iniciar Sesión'
                        )}
                    </Button>
                </Box>
            </Paper>
            <Snackbar
                open={showSnackbar}
                autoHideDuration={6000}
                onClose={() => setShowSnackbar(false)}
            >
                <Alert
                    onClose={() => setShowSnackbar(false)}
                    severity="error"
                >
                    {error}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default Login;

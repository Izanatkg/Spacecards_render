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
        setLoading(true);
        setError('');

        try {
            const response = await register(formData.name, formData.email, formData.phone);
            console.log('Registration response:', response);
            setRegistrationData(response);
            setSuccess(true);
            setShowSnackbar(true);
        } catch (error) {
            setError(error.response?.data?.message || 'Error en el registro');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({ name: '', email: '', phone: '' });
        setSuccess(false);
        setRegistrationData(null);
        setError('');
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
                        <>
                            <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#1a237e', fontWeight: 'bold', mb: 3 }}>
                                Registro de Entrenador
                            </Typography>

                            <form onSubmit={handleSubmit}>
                                <TextField
                                    fullWidth
                                    label="Nombre completo"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    margin="normal"
                                    required
                                    sx={{ 
                                        '& .MuiOutlinedInput-root': {
                                            '&:hover fieldset': {
                                                borderColor: '#4a90e2',
                                            },
                                        },
                                    }}
                                />
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    margin="normal"
                                    required
                                    sx={{ 
                                        '& .MuiOutlinedInput-root': {
                                            '&:hover fieldset': {
                                                borderColor: '#4a90e2',
                                            },
                                        },
                                    }}
                                />
                                <TextField
                                    fullWidth
                                    label="Teléfono"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    margin="normal"
                                    required
                                    inputProps={{ pattern: "[0-9]{10}" }}
                                    helperText="10 dígitos"
                                    sx={{ 
                                        '& .MuiOutlinedInput-root': {
                                            '&:hover fieldset': {
                                                borderColor: '#4a90e2',
                                            },
                                        },
                                    }}
                                />
                                {error && (
                                    <Alert severity="error" sx={{ mt: 2 }}>
                                        {error}
                                    </Alert>
                                )}
                                <Button
                                    fullWidth
                                    type="submit"
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
                            </form>
                        </>
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
                                            <a 
                                                href={registrationData.walletUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ textDecoration: 'none' }}
                                            >
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    startIcon={<img src="/google-wallet.png" alt="" style={{ height: '24px' }} />}
                                                    sx={{ 
                                                        backgroundColor: '#000000',
                                                        '&:hover': {
                                                            backgroundColor: '#333333'
                                                        }
                                                    }}
                                                >
                                                    Agregar a Google Wallet
                                                </Button>
                                            </a>
                                        </Box>
                                    )}
                                    <Box sx={{ mt: 2 }}>
                                        <Button
                                            variant="outlined"
                                            onClick={() => setRegistrationData(null)}
                                            sx={{ mt: 1 }}
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

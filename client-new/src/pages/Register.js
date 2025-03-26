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
                            <Alert 
                                severity="success" 
                                sx={{ 
                                    mb: 4,
                                    backgroundColor: '#4caf50',
                                    color: 'white',
                                    '& .MuiAlert-icon': {
                                        color: 'white'
                                    }
                                }}
                            >
                                ¡Felicidades, Entrenador! {registrationData?.welcomeBonus}
                            </Alert>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1a237e' }}>
                                ID de Entrenador: {registrationData?.id}
                            </Typography>
                            {registrationData?.qrCode && (
                                <Box sx={{ mb: 2 }}>
                                    <img src={registrationData.qrCode} alt="QR Code" style={{ width: '200px', height: '200px' }} />
                                </Box>
                            )}
                            {registrationData?.walletUrl && (
                                <Box sx={{ mt: 3, mb: 2, textAlign: 'center' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <a 
                                            href={registrationData.walletUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ 
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                textDecoration: 'none',
                                                backgroundColor: '#000000',
                                                color: '#FFFFFF',
                                                padding: '8px 16px',
                                                borderRadius: '24px',
                                                gap: '8px',
                                                height: '48px'
                                            }}
                                        >
                                            <img
                                                src="https://fonts.gstatic.com/s/i/productlogos/wallet/v8/192px.svg"
                                                alt="Google Wallet"
                                                style={{
                                                    height: '24px',
                                                    width: 'auto'
                                                }}
                                            />
                                            <span style={{
                                                fontFamily: 'Roboto, Arial, sans-serif',
                                                fontSize: '16px',
                                                fontWeight: '500'
                                            }}>
                                                Add to Google Wallet
                                            </span>
                                        </a>
                                    </Box>
                                </Box>
                            )}
                            <Typography variant="body1" sx={{ mt: 2, color: '#4a90e2', fontWeight: 'bold' }}>
                                {registrationData?.points && `¡Tienes ${registrationData.points} PokéPuntos!`}
                            </Typography>
                            <Button
                                variant="outlined"
                                onClick={handleReset}
                                sx={{ 
                                    mt: 3,
                                    borderColor: '#4a90e2',
                                    color: '#4a90e2',
                                    '&:hover': {
                                        borderColor: '#357abd',
                                        backgroundColor: 'rgba(74, 144, 226, 0.1)'
                                    }
                                }}
                            >
                                Registrar otro entrenador
                            </Button>
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

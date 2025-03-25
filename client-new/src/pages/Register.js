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
import axios from '../config/axios';

const Register = () => {
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
            const response = await axios.post('/register', {
                fullName: formData.name,
                email: formData.email,
                phone: formData.phone
            });

            console.log('Registration response:', response.data);
            setRegistrationData(response.data);
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
        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Registro Club Pokémon
                </Typography>

                {!success ? (
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Nombre completo"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            margin="normal"
                            required
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
                            color="primary"
                            sx={{ mt: 3 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Registrarse'}
                        </Button>
                    </form>
                ) : (
                    <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Alert severity="success" sx={{ mb: 4 }}>
                            ¡Registro exitoso! {registrationData.welcomeBonus && `(${registrationData.welcomeBonus})`}
                        </Alert>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                            ID: {registrationData.user.customerId}
                        </Typography>
                        {registrationData.qrCode && (
                            <Box sx={{ mb: 2 }}>
                                <img src={registrationData.qrCode} alt="QR Code" style={{ width: '200px', height: '200px' }} />
                            </Box>
                        )}
                        {registrationData.walletUrl && (
                          <Box sx={{ 
                            mt: 3, 
                            mb: 2,
                            textAlign: 'center'
                          }}>
                            <Box sx={{ 
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}>
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
                        <Typography variant="body1" sx={{ mt: 2, color: 'success.main', fontWeight: 'bold' }}>
                            {registrationData.welcomeBonus && `¡Bienvenido! Tienes ${registrationData.welcomeBonus}!`}
                        </Typography>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={handleReset}
                            sx={{ mt: 3 }}
                        >
                            Registrar otro usuario
                        </Button>
                    </Box>
                )}
            </Paper>

            <Snackbar
                open={showSnackbar}
                autoHideDuration={6000}
                onClose={() => setShowSnackbar(false)}
            >
                <Alert severity="success" sx={{ width: '100%' }}>
                    ¡Registro completado con éxito!
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default Register;
